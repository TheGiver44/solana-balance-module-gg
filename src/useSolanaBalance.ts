/**
 * React Hook for Solana Balance Module
 * Provides easy integration with React components for balance checking
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { SolanaBalanceModule, BalanceConfig, BalanceResult, SolBalance, TokenBalance } from './index';

export interface UseSolanaBalanceOptions extends Partial<BalanceConfig> {
  onBalanceUpdate?: (result: BalanceResult) => void;
  onError?: (error: string) => void;
  onProgress?: (step: string) => void;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseSolanaBalanceReturn {
  // State
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;
  solBalance: SolBalance | null;
  tokenBalances: TokenBalance[];
  lastUpdate: Date | null;
  
  // Actions
  getSolBalance: (address: string) => Promise<SolBalance>;
  getTokenBalances: (address: string, mints?: string[]) => Promise<TokenBalance[]>;
  getAllBalances: (address: string, tokenMints?: string[]) => Promise<BalanceResult>;
  refreshBalances: (address: string, tokenMints?: string[]) => Promise<void>;
  startMonitoring: (address: string, tokenMints?: string[]) => void;
  stopMonitoring: (address: string) => void;
  stopAllMonitoring: () => void;
  clearError: () => void;
  reset: () => void;
  
  // Configuration
  updateConfig: (config: Partial<BalanceConfig>) => void;
  getConfig: () => BalanceConfig;
}

/**
 * React hook for Solana balance checking
 */
export function useSolanaBalance(options: UseSolanaBalanceOptions = {}): UseSolanaBalanceReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [solBalance, setSolBalance] = useState<SolBalance | null>(null);
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const balanceModuleRef = useRef<SolanaBalanceModule | null>(null);
  const monitoringAddressRef = useRef<string | null>(null);
  
  // Initialize balance module
  if (!balanceModuleRef.current) {
    balanceModuleRef.current = new SolanaBalanceModule({
      rpcUrl: options.rpcUrl,
      commitment: options.commitment,
      maxRetries: options.maxRetries,
      retryDelay: options.retryDelay,
      refreshInterval: options.refreshInterval || options.refreshInterval
    });
  }

  const handleSuccess = useCallback((result: BalanceResult) => {
    if (result.solBalance) {
      setSolBalance(result.solBalance);
    }
    if (result.tokenBalances) {
      setTokenBalances(result.tokenBalances);
    }
    setLastUpdate(new Date());
    setError(null);
    setIsConnected(true);
    options.onBalanceUpdate?.(result);
  }, [options]);

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    setIsConnected(false);
    options.onError?.(errorMessage);
  }, [options]);

  const handleProgress = useCallback((step: string) => {
    options.onProgress?.(step);
  }, [options]);

  const getSolBalance = useCallback(async (address: string): Promise<SolBalance> => {
    if (!balanceModuleRef.current) {
      const error = 'Balance module not initialized';
      handleError(error);
      throw new Error(error);
    }

    setIsLoading(true);
    setError(null);
    
    try {
      handleProgress('Getting SOL balance...');
      
      const balance = await balanceModuleRef.current.getSolBalance(address);
      
      setSolBalance(balance);
      setLastUpdate(new Date());
      setIsConnected(true);
      
      return balance;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      handleError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, handleProgress]);

  const getTokenBalances = useCallback(async (address: string, mints?: string[]): Promise<TokenBalance[]> => {
    if (!balanceModuleRef.current) {
      const error = 'Balance module not initialized';
      handleError(error);
      throw new Error(error);
    }

    setIsLoading(true);
    setError(null);
    
    try {
      handleProgress('Getting token balances...');
      
      const balances = await balanceModuleRef.current.getTokenBalances(address, mints);
      
      setTokenBalances(balances);
      setLastUpdate(new Date());
      setIsConnected(true);
      
      return balances;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      handleError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, handleProgress]);

  const getAllBalances = useCallback(async (address: string, tokenMints?: string[]): Promise<BalanceResult> => {
    if (!balanceModuleRef.current) {
      const error = 'Balance module not initialized';
      handleError(error);
      return { success: false, error };
    }

    setIsLoading(true);
    setError(null);
    
    try {
      handleProgress('Getting all balances...');
      
      const result = await balanceModuleRef.current.getAllBalances(address, tokenMints);
      
      if (result.success) {
        if (result.solBalance) {
          setSolBalance(result.solBalance);
        }
        if (result.tokenBalances) {
          setTokenBalances(result.tokenBalances);
        }
        setLastUpdate(new Date());
        setIsConnected(true);
        handleSuccess(result);
      } else {
        handleError(result.error || 'Failed to get balances');
      }
      
      return result;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      handleError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [handleError, handleSuccess, handleProgress]);

  const refreshBalances = useCallback(async (address: string, tokenMints?: string[]) => {
    await getAllBalances(address, tokenMints);
  }, [getAllBalances]);

  const startMonitoring = useCallback((address: string, tokenMints?: string[]) => {
    if (!balanceModuleRef.current) {
      handleError('Balance module not initialized');
      return;
    }

    monitoringAddressRef.current = address;
    
    balanceModuleRef.current.startBalanceMonitoring(
      address,
      (result) => {
        if (result.success) {
          if (result.solBalance) {
            setSolBalance(result.solBalance);
          }
          if (result.tokenBalances) {
            setTokenBalances(result.tokenBalances);
          }
          setLastUpdate(new Date());
          setIsConnected(true);
          options.onBalanceUpdate?.(result);
        } else {
          handleError(result.error || 'Balance monitoring failed');
        }
      },
      tokenMints
    );
  }, [handleError, options]);

  const stopMonitoring = useCallback((address: string) => {
    if (balanceModuleRef.current) {
      balanceModuleRef.current.stopBalanceMonitoring(address);
    }
    if (monitoringAddressRef.current === address) {
      monitoringAddressRef.current = null;
    }
  }, []);

  const stopAllMonitoring = useCallback(() => {
    if (balanceModuleRef.current) {
      balanceModuleRef.current.stopAllBalanceMonitoring();
    }
    monitoringAddressRef.current = null;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setSolBalance(null);
    setTokenBalances([]);
    setLastUpdate(null);
    setIsConnected(false);
    stopAllMonitoring();
  }, [stopAllMonitoring]);

  const updateConfig = useCallback((config: Partial<BalanceConfig>) => {
    if (balanceModuleRef.current) {
      balanceModuleRef.current.updateConfig(config);
    }
  }, []);

  const getConfig = useCallback((): BalanceConfig => {
    if (!balanceModuleRef.current) {
      throw new Error('Balance module not initialized');
    }
    return balanceModuleRef.current.getConfig();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (balanceModuleRef.current) {
        balanceModuleRef.current.destroy();
      }
    };
  }, []);

  return {
    // State
    isLoading,
    isConnected,
    error,
    solBalance,
    tokenBalances,
    lastUpdate,
    
    // Actions
    getSolBalance,
    getTokenBalances,
    getAllBalances,
    refreshBalances,
    startMonitoring,
    stopMonitoring,
    stopAllMonitoring,
    clearError,
    reset,
    
    // Configuration
    updateConfig,
    getConfig
  };
}

/**
 * Hook for wallet integration (requires wallet adapter)
 */
export function useWalletBalance(
  wallet: { publicKey: string | null } | null,
  options: UseSolanaBalanceOptions = {}
): UseSolanaBalanceReturn & { 
  getWalletBalances: (tokenMints?: string[]) => Promise<BalanceResult>;
  startWalletMonitoring: (tokenMints?: string[]) => void;
} {
  const balanceHook = useSolanaBalance(options);
  
  const getWalletBalances = useCallback(async (tokenMints?: string[]): Promise<BalanceResult> => {
    if (!wallet?.publicKey) {
      const error = 'Wallet not connected';
      options.onError?.(error);
      return { success: false, error };
    }

    return await balanceHook.getAllBalances(wallet.publicKey, tokenMints);
  }, [wallet, balanceHook, options]);

  const startWalletMonitoring = useCallback((tokenMints?: string[]) => {
    if (!wallet?.publicKey) {
      options.onError?.('Wallet not connected');
      return;
    }

    balanceHook.startMonitoring(wallet.publicKey, tokenMints);
  }, [wallet, balanceHook, options]);

  return {
    ...balanceHook,
    getWalletBalances,
    startWalletMonitoring
  };
}
