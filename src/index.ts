/**
 * Solana Balance Module
 * A reusable module for checking SOL and SPL token balances that can be dropped into any JS/TSX project
 * 
 * Features:
 * - SOL balance checking
 * - SPL token balance checking
 * - Multiple token support
 * - Robust RPC connection with fallbacks
 * - TypeScript support
 * - React hook integration
 * - Vanilla JS support
 * - Error handling and retry logic
 * - Real-time balance monitoring
 */

import { 
  Connection, 
  PublicKey, 
  ParsedAccountData,
  AccountInfo,
  GetAccountInfoConfig
} from '@solana/web3.js';

// Types
export interface BalanceConfig {
  rpcUrl?: string;
  commitment?: 'processed' | 'confirmed' | 'finalized';
  maxRetries?: number;
  retryDelay?: number;
  refreshInterval?: number; // in milliseconds
}

export interface TokenBalance {
  mint: string;
  amount: number;
  decimals: number;
  uiAmount: number;
  symbol?: string;
  name?: string;
}

export interface SolBalance {
  lamports: number;
  sol: number;
  formatted: string;
}

export interface BalanceResult {
  success: boolean;
  solBalance?: SolBalance;
  tokenBalances?: TokenBalance[];
  error?: string;
}

export interface RPCConfig {
  endpoints: string[];
  maxRetries: number;
  retryDelay: number;
  rateLimitDelay: number;
}

// Default configuration
const DEFAULT_CONFIG: BalanceConfig = {
  rpcUrl: 'https://api.mainnet-beta.solana.com',
  commitment: 'confirmed',
  maxRetries: 3,
  retryDelay: 1000,
  refreshInterval: 30000 // 30 seconds
};

const DEFAULT_RPC_CONFIG: RPCConfig = {
  endpoints: [
    'https://mainnet.helius-rpc.com/?api-key=YOUR API KEY HERE',
    'https://api.mainnet-beta.solana.com',
    'https://solana-api.projectserum.com',
    'https://rpc.ankr.com/solana',
    'https://solana-mainnet.g.alchemy.com/v2/demo'
  ],
  maxRetries: 3,
  retryDelay: 1000,
  rateLimitDelay: 100
};

// Constants
const LAMPORTS_PER_SOL = 1000000000;
const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

/**
 * Robust RPC Connection Manager
 * Handles multiple RPC endpoints with fallback and rate limiting
 */
class RobustRPCManager {
  private config: RPCConfig;
  private currentEndpointIndex = 0;
  private failedEndpoints = new Set<string>();
  private requestTimestamps = new Map<string, number[]>();
  private readonly MAX_REQUESTS_PER_MINUTE = 10;
  private readonly RATE_LIMIT_WINDOW = 60 * 1000;

  constructor(config: Partial<RPCConfig> = {}) {
    this.config = { ...DEFAULT_RPC_CONFIG, ...config };
  }

  private isEndpointRateLimited(endpoint: string): boolean {
    const now = Date.now();
    const timestamps = this.requestTimestamps.get(endpoint) || [];
    const recentTimestamps = timestamps.filter(ts => now - ts < this.RATE_LIMIT_WINDOW);
    this.requestTimestamps.set(endpoint, recentTimestamps);
    return recentTimestamps.length >= this.MAX_REQUESTS_PER_MINUTE;
  }

  private canMakeRequest(endpoint: string): boolean {
    const timestamps = this.requestTimestamps.get(endpoint) || [];
    if (timestamps.length === 0) return true;
    const lastRequest = timestamps[timestamps.length - 1];
    return Date.now() - lastRequest >= this.config.rateLimitDelay;
  }

  private recordRequest(endpoint: string): void {
    const now = Date.now();
    const timestamps = this.requestTimestamps.get(endpoint) || [];
    timestamps.push(now);
    this.requestTimestamps.set(endpoint, timestamps);
  }

  private markEndpointAsFailed(endpoint: string): void {
    this.failedEndpoints.add(endpoint);
    setTimeout(() => {
      this.failedEndpoints.delete(endpoint);
    }, 5 * 60 * 1000); // Remove from failed list after 5 minutes
  }

  private async getNextAvailableEndpoint(): Promise<string> {
    let attempts = 0;
    const maxAttempts = this.config.endpoints.length * 2;

    while (attempts < maxAttempts) {
      const endpoint = this.config.endpoints[this.currentEndpointIndex];
      
      if (this.failedEndpoints.has(endpoint)) {
        this.currentEndpointIndex = (this.currentEndpointIndex + 1) % this.config.endpoints.length;
        attempts++;
        continue;
      }
      
      if (this.isEndpointRateLimited(endpoint)) {
        this.currentEndpointIndex = (this.currentEndpointIndex + 1) % this.config.endpoints.length;
        attempts++;
        continue;
      }
      
      if (!this.canMakeRequest(endpoint)) {
        await new Promise(resolve => setTimeout(resolve, this.config.rateLimitDelay));
      }
      
      return endpoint;
    }
    
    this.failedEndpoints.clear();
    this.currentEndpointIndex = 0;
    return this.config.endpoints[0];
  }

  async createConnection(): Promise<Connection> {
    const endpoint = await this.getNextAvailableEndpoint();
    this.recordRequest(endpoint);
    return new Connection(endpoint, 'confirmed');
  }

  async executeWithRetry<T>(
    operation: (connection: Connection) => Promise<T>,
    operationName: string = 'operation'
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        const connection = await this.createConnection();
        const result = await operation(connection);
        this.currentEndpointIndex = 0; // Reset to prefer working endpoint
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        if (errorMessage.includes('429') || errorMessage.includes('403') || 
            errorMessage.includes('fetch') || errorMessage.includes('network')) {
          const currentEndpoint = this.config.endpoints[this.currentEndpointIndex];
          this.markEndpointAsFailed(currentEndpoint);
        }
        
        this.currentEndpointIndex = (this.currentEndpointIndex + 1) % this.config.endpoints.length;
        
        if (attempt < this.config.maxRetries - 1) {
          const delay = Math.min(this.config.retryDelay * Math.pow(2, attempt), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError || new Error('All RPC endpoints failed');
  }
}

/**
 * Solana Balance Module
 * Main class for handling balance checking
 */
export class SolanaBalanceModule {
  private rpcManager: RobustRPCManager;
  private config: BalanceConfig;
  private refreshIntervals = new Map<string, NodeJS.Timeout>();

  constructor(config: Partial<BalanceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.rpcManager = new RobustRPCManager();
  }

  /**
   * Get SOL balance for an address
   */
  async getSolBalance(address: string): Promise<SolBalance> {
    try {
      const result = await this.rpcManager.executeWithRetry(async (connection) => {
        const balance = await connection.getBalance(new PublicKey(address));
        const sol = balance / LAMPORTS_PER_SOL;
        
        return {
          lamports: balance,
          sol: sol,
          formatted: sol.toFixed(4)
        };
      });

      return result;
    } catch (error) {
      throw new Error(`Failed to get SOL balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get SPL token balances for an address
   */
  async getTokenBalances(address: string, mints?: string[]): Promise<TokenBalance[]> {
    try {
      const result = await this.rpcManager.executeWithRetry(async (connection) => {
        const publicKey = new PublicKey(address);
        const tokenProgramId = new PublicKey(TOKEN_PROGRAM_ID);
        
        // Get all token accounts
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
          publicKey,
          { programId: tokenProgramId }
        );

        const balances: TokenBalance[] = [];

        for (const account of tokenAccounts.value) {
          const parsedData = account.account.data as ParsedAccountData;
          
          if (parsedData.parsed && parsedData.parsed.info) {
            const info = parsedData.parsed.info;
            const mint = info.mint;
            
            // Filter by specific mints if provided
            if (mints && mints.length > 0 && !mints.includes(mint)) {
              continue;
            }

            const amount = parseInt(info.tokenAmount.amount);
            const decimals = info.tokenAmount.decimals;
            const uiAmount = amount / Math.pow(10, decimals);

            balances.push({
              mint,
              amount,
              decimals,
              uiAmount,
              symbol: this.getTokenSymbol(mint),
              name: this.getTokenName(mint)
            });
          }
        }

        return balances;
      });

      return result;
    } catch (error) {
      throw new Error(`Failed to get token balances: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get both SOL and token balances
   */
  async getAllBalances(address: string, tokenMints?: string[]): Promise<BalanceResult> {
    try {
      const [solBalance, tokenBalances] = await Promise.all([
        this.getSolBalance(address),
        this.getTokenBalances(address, tokenMints)
      ]);

      return {
        success: true,
        solBalance,
        tokenBalances
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Start real-time balance monitoring
   */
  startBalanceMonitoring(
    address: string,
    callback: (result: BalanceResult) => void,
    tokenMints?: string[]
  ): string {
    const intervalId = setInterval(async () => {
      try {
        const result = await this.getAllBalances(address, tokenMints);
        callback(result);
      } catch (error) {
        callback({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        });
      }
    }, this.config.refreshInterval);

    this.refreshIntervals.set(address, intervalId);
    return address;
  }

  /**
   * Stop balance monitoring for an address
   */
  stopBalanceMonitoring(address: string): void {
    const intervalId = this.refreshIntervals.get(address);
    if (intervalId) {
      clearInterval(intervalId);
      this.refreshIntervals.delete(address);
    }
  }

  /**
   * Stop all balance monitoring
   */
  stopAllBalanceMonitoring(): void {
    this.refreshIntervals.forEach((intervalId) => {
      clearInterval(intervalId);
    });
    this.refreshIntervals.clear();
  }

  /**
   * Get account info
   */
  async getAccountInfo(address: string): Promise<AccountInfo<Buffer> | null> {
    try {
      const result = await this.rpcManager.executeWithRetry(async (connection) => {
        return await connection.getAccountInfo(new PublicKey(address));
      });

      return result;
    } catch (error) {
      throw new Error(`Failed to get account info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if address exists
   */
  async addressExists(address: string): Promise<boolean> {
    try {
      const accountInfo = await this.getAccountInfo(address);
      return accountInfo !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get token metadata (basic implementation)
   */
  private getTokenSymbol(mint: string): string | undefined {
    // This would typically fetch from a token registry or API
    // For now, return undefined - can be extended with token metadata service
    return undefined;
  }

  private getTokenName(mint: string): string | undefined {
    // This would typically fetch from a token registry or API
    // For now, return undefined - can be extended with token metadata service
    return undefined;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<BalanceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): BalanceConfig {
    return { ...this.config };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopAllBalanceMonitoring();
  }
}

// Export default instance
export const solanaBalance = new SolanaBalanceModule();

// Export utility functions
export const createBalanceModule = (config?: Partial<BalanceConfig>) => new SolanaBalanceModule(config);

// Export constants
export { LAMPORTS_PER_SOL, TOKEN_PROGRAM_ID };

// Export utility functions
export const BalanceUtils = {
  /**
   * Convert lamports to SOL
   */
  lamportsToSol: (lamports: number): number => {
    return lamports / LAMPORTS_PER_SOL;
  },

  /**
   * Convert SOL to lamports
   */
  solToLamports: (sol: number): number => {
    return Math.floor(sol * LAMPORTS_PER_SOL);
  },

  /**
   * Format SOL amount for display
   */
  formatSol: (sol: number, decimals: number = 4): string => {
    return sol.toFixed(decimals);
  },

  /**
   * Format token amount for display
   */
  formatTokenAmount: (amount: number, decimals: number, displayDecimals: number = 2): string => {
    const uiAmount = amount / Math.pow(10, decimals);
    return uiAmount.toFixed(displayDecimals);
  },

  /**
   * Validate Solana address
   */
  isValidAddress: (address: string): boolean => {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }
};
