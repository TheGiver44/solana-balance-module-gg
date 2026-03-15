/**
 * Vanilla JavaScript version of Solana Balance Module
 * For use in non-React projects
 */

import { SolanaBalanceModule, BalanceConfig, BalanceResult, SolBalance, TokenBalance } from './index';

/**
 * Vanilla JS Balance Manager
 * Provides a simple interface for non-React projects
 */
export class VanillaBalanceManager {
  private balanceModule: SolanaBalanceModule;
  private callbacks: {
    onBalanceUpdate?: (result: BalanceResult) => void;
    onError?: (error: string) => void;
    onProgress?: (step: string) => void;
  } = {};

  constructor(config?: Partial<BalanceConfig>) {
    this.balanceModule = new SolanaBalanceModule(config);
  }

  /**
   * Set event callbacks
   */
  onBalanceUpdate(callback: (result: BalanceResult) => void): this {
    this.callbacks.onBalanceUpdate = callback;
    return this;
  }

  onError(callback: (error: string) => void): this {
    this.callbacks.onError = callback;
    return this;
  }

  onProgress(callback: (step: string) => void): this {
    this.callbacks.onProgress = callback;
    return this;
  }

  /**
   * Get SOL balance
   */
  async getSolBalance(address: string): Promise<SolBalance> {
    try {
      this.callbacks.onProgress?.('Getting SOL balance...');
      
      const balance = await this.balanceModule.getSolBalance(address);
      
      this.callbacks.onBalanceUpdate?.({ success: true, solBalance: balance });
      return balance;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.callbacks.onError?.(errorMessage);
      throw error;
    }
  }

  /**
   * Get token balances
   */
  async getTokenBalances(address: string, mints?: string[]): Promise<TokenBalance[]> {
    try {
      this.callbacks.onProgress?.('Getting token balances...');
      
      const balances = await this.balanceModule.getTokenBalances(address, mints);
      
      this.callbacks.onBalanceUpdate?.({ success: true, tokenBalances: balances });
      return balances;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.callbacks.onError?.(errorMessage);
      throw error;
    }
  }

  /**
   * Get all balances (SOL + tokens)
   */
  async getAllBalances(address: string, tokenMints?: string[]): Promise<BalanceResult> {
    try {
      this.callbacks.onProgress?.('Getting all balances...');
      
      const result = await this.balanceModule.getAllBalances(address, tokenMints);
      
      if (result.success) {
        this.callbacks.onBalanceUpdate?.(result);
      } else {
        this.callbacks.onError?.(result.error || 'Failed to get balances');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.callbacks.onError?.(errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Start real-time balance monitoring
   */
  startMonitoring(address: string, tokenMints?: string[]): string {
    this.balanceModule.startBalanceMonitoring(
      address,
      (result) => {
        if (result.success) {
          this.callbacks.onBalanceUpdate?.(result);
        } else {
          this.callbacks.onError?.(result.error || 'Balance monitoring failed');
        }
      },
      tokenMints
    );
    return address;
  }

  /**
   * Stop balance monitoring
   */
  stopMonitoring(address: string): void {
    this.balanceModule.stopBalanceMonitoring(address);
  }

  /**
   * Stop all monitoring
   */
  stopAllMonitoring(): void {
    this.balanceModule.stopAllBalanceMonitoring();
  }

  /**
   * Check if address exists
   */
  async addressExists(address: string): Promise<boolean> {
    try {
      this.callbacks.onProgress?.('Checking if address exists...');
      
      const exists = await this.balanceModule.addressExists(address);
      
      this.callbacks.onBalanceUpdate?.({ success: true });
      return exists;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.callbacks.onError?.(errorMessage);
      return false;
    }
  }

  /**
   * Get account info
   */
  async getAccountInfo(address: string): Promise<any> {
    try {
      this.callbacks.onProgress?.('Getting account info...');
      
      const accountInfo = await this.balanceModule.getAccountInfo(address);
      
      this.callbacks.onBalanceUpdate?.({ success: true });
      return accountInfo;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.callbacks.onError?.(errorMessage);
      throw error;
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<BalanceConfig>): void {
    this.balanceModule.updateConfig(config);
  }

  /**
   * Get current configuration
   */
  getConfig(): BalanceConfig {
    return this.balanceModule.getConfig();
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.balanceModule.destroy();
  }
}

/**
 * Create a vanilla balance manager instance
 */
export const createVanillaBalance = (config?: Partial<BalanceConfig>): VanillaBalanceManager => {
  return new VanillaBalanceManager(config);
};

/**
 * Simple balance checking functions for one-off operations
 */
export async function quickSolBalance(address: string, config?: Partial<BalanceConfig>): Promise<SolBalance> {
  const manager = new VanillaBalanceManager(config);
  
  try {
    const balance = await manager.getSolBalance(address);
    return balance;
  } finally {
    manager.destroy();
  }
}

export async function quickTokenBalances(address: string, mints?: string[], config?: Partial<BalanceConfig>): Promise<TokenBalance[]> {
  const manager = new VanillaBalanceManager(config);
  
  try {
    const balances = await manager.getTokenBalances(address, mints);
    return balances;
  } finally {
    manager.destroy();
  }
}

export async function quickAllBalances(address: string, tokenMints?: string[], config?: Partial<BalanceConfig>): Promise<BalanceResult> {
  const manager = new VanillaBalanceManager(config);
  
  try {
    const result = await manager.getAllBalances(address, tokenMints);
    return result;
  } finally {
    manager.destroy();
  }
}

/**
 * Utility functions for common operations
 */
export const BalanceUtils = {
  /**
   * Validate Solana address
   */
  isValidAddress: (address: string): boolean => {
    try {
      new (require('@solana/web3.js').PublicKey)(address);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Convert lamports to SOL
   */
  lamportsToSol: (lamports: number): number => {
    return lamports / 1000000000;
  },

  /**
   * Convert SOL to lamports
   */
  solToLamports: (sol: number): number => {
    return Math.floor(sol * 1000000000);
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
   * Calculate total portfolio value (requires price data)
   */
  calculatePortfolioValue: (solBalance: SolBalance, tokenBalances: TokenBalance[], prices?: Record<string, number>): number => {
    let totalValue = solBalance.sol;
    
    if (prices) {
      tokenBalances.forEach(token => {
        const price = prices[token.mint] || 0;
        totalValue += token.uiAmount * price;
      });
    }
    
    return totalValue;
  },

  /**
   * Filter tokens by minimum balance
   */
  filterTokensByMinBalance: (tokenBalances: TokenBalance[], minBalance: number): TokenBalance[] => {
    return tokenBalances.filter(token => token.uiAmount >= minBalance);
  },

  /**
   * Sort tokens by balance (highest first)
   */
  sortTokensByBalance: (tokenBalances: TokenBalance[]): TokenBalance[] => {
    return [...tokenBalances].sort((a, b) => b.uiAmount - a.uiAmount);
  }
};
