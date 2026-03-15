/**
 * Vanilla JavaScript Example - Solana Balance Module
 * 
 * This example shows how to use the Solana Balance Module
 * in a vanilla JavaScript application.
 */

import { 
  createVanillaBalance, 
  quickSolBalance, 
  quickTokenBalances, 
  quickAllBalances,
  BalanceUtils 
} from '../src/vanilla.js';

// Example 1: Using VanillaBalanceManager
async function example1() {
  console.log('=== Example 1: VanillaBalanceManager ===');
  
  const balanceManager = createVanillaBalance({
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    refreshInterval: 30000
  })
  .onBalanceUpdate((result) => {
    console.log('✅ Balance updated!', result);
  })
  .onError((error) => {
    console.error('❌ Balance check failed:', error);
  })
  .onProgress((step) => {
    console.log('📝 Progress:', step);
  });

  try {
    // Get SOL balance
    const solBalance = await balanceManager.getSolBalance('your-wallet-address-here');
    console.log('SOL Balance:', solBalance);

    // Get token balances
    const tokenBalances = await balanceManager.getTokenBalances('your-wallet-address-here');
    console.log('Token Balances:', tokenBalances);

    // Get all balances
    const allBalances = await balanceManager.getAllBalances('your-wallet-address-here');
    console.log('All Balances:', allBalances);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    balanceManager.destroy();
  }
}

// Example 2: Quick balance checking (one-liners)
async function example2() {
  console.log('\n=== Example 2: Quick Balance Checking ===');
  
  try {
    // Quick SOL balance
    const solBalance = await quickSolBalance('your-wallet-address-here');
    console.log('Quick SOL Balance:', solBalance.formatted);
    
    // Quick token balances
    const tokenBalances = await quickTokenBalances('your-wallet-address-here');
    console.log('Quick Token Balances:', tokenBalances.length, 'tokens');
    
    // Quick all balances
    const allBalances = await quickAllBalances('your-wallet-address-here');
    console.log('Quick All Balances:', allBalances.success ? 'Success' : 'Failed');
    
  } catch (error) {
    console.error('Quick balance error:', error);
  }
}

// Example 3: Real-time monitoring
async function example3() {
  console.log('\n=== Example 3: Real-time Monitoring ===');
  
  const balanceManager = createVanillaBalance({
    refreshInterval: 10000 // 10 seconds
  })
  .onBalanceUpdate((result) => {
    console.log('🔄 Balance Update:', {
      sol: result.solBalance?.formatted,
      tokens: result.tokenBalances?.length || 0
    });
  })
  .onError((error) => {
    console.error('💥 Monitoring Error:', error);
  });

  try {
    // Start monitoring
    const address = 'your-wallet-address-here';
    balanceManager.startMonitoring(address);
    console.log(`📡 Started monitoring ${address}`);
    
    // Let it run for 30 seconds
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    // Stop monitoring
    balanceManager.stopMonitoring(address);
    console.log('🛑 Stopped monitoring');
    
  } catch (error) {
    console.error('Monitoring error:', error);
  } finally {
    balanceManager.destroy();
  }
}

// Example 4: Portfolio tracking
async function example4() {
  console.log('\n=== Example 4: Portfolio Tracking ===');
  
  const balanceManager = createVanillaBalance({
    refreshInterval: 60000 // 1 minute
  });

  try {
    const address = 'your-wallet-address-here';
    
    // Get initial portfolio
    const result = await balanceManager.getAllBalances(address);
    
    if (result.success) {
      console.log('📊 Portfolio Summary:');
      console.log(`SOL Balance: ${result.solBalance?.formatted} SOL`);
      console.log(`Token Count: ${result.tokenBalances?.length || 0}`);
      
      // Calculate total value (if we had price data)
      const mockPrices = {
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 1.0, // USDC
        'So11111111111111111111111111111111111111112': 100.0, // SOL
      };
      
      const totalValue = BalanceUtils.calculatePortfolioValue(
        result.solBalance,
        result.tokenBalances,
        mockPrices
      );
      
      console.log(`Total Value: $${totalValue.toFixed(2)}`);
      
      // Filter tokens by minimum balance
      const significantTokens = BalanceUtils.filterTokensByMinBalance(
        result.tokenBalances,
        0.01 // Minimum 0.01 tokens
      );
      
      console.log(`Significant Tokens: ${significantTokens.length}`);
      
      // Sort by balance
      const sortedTokens = BalanceUtils.sortTokensByBalance(result.tokenBalances);
      console.log('Top 3 Tokens:');
      sortedTokens.slice(0, 3).forEach((token, index) => {
        console.log(`${index + 1}. ${token.symbol || 'Unknown'}: ${token.uiAmount.toFixed(4)}`);
      });
    }
    
  } catch (error) {
    console.error('Portfolio tracking error:', error);
  } finally {
    balanceManager.destroy();
  }
}

// Example 5: Address validation and utilities
function example5() {
  console.log('\n=== Example 5: Address Validation and Utilities ===');
  
  // Test addresses
  const validAddress = '11111111111111111111111111111112'; // System Program
  const invalidAddress = 'invalid-address';
  
  console.log('Valid address:', BalanceUtils.isValidAddress(validAddress));
  console.log('Invalid address:', BalanceUtils.isValidAddress(invalidAddress));
  
  // Convert between SOL and lamports
  const solAmount = 1.5;
  const lamports = BalanceUtils.solToLamports(solAmount);
  const backToSol = BalanceUtils.lamportsToSol(lamports);
  
  console.log(`${solAmount} SOL = ${lamports} lamports`);
  console.log(`${lamports} lamports = ${backToSol} SOL`);
  
  // Format amounts
  const formattedSol = BalanceUtils.formatSol(solAmount, 6);
  console.log(`Formatted SOL: ${formattedSol}`);
  
  // Format token amounts
  const tokenAmount = 1000000; // 1 million with 6 decimals
  const formattedToken = BalanceUtils.formatTokenAmount(tokenAmount, 6, 2);
  console.log(`Formatted Token: ${formattedToken}`);
}

// Example 6: Configuration management
function example6() {
  console.log('\n=== Example 6: Configuration Management ===');
  
  const balanceManager = createVanillaBalance({
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    refreshInterval: 30000,
    maxRetries: 5
  });

  // Get current configuration
  const config = balanceManager.getConfig();
  console.log('Current configuration:', config);

  // Update configuration
  balanceManager.updateConfig({
    refreshInterval: 60000, // 1 minute
    maxRetries: 3
  });

  const updatedConfig = balanceManager.getConfig();
  console.log('Updated configuration:', updatedConfig);
}

// Example 7: Error handling and recovery
async function example7() {
  console.log('\n=== Example 7: Error Handling and Recovery ===');
  
  const balanceManager = createVanillaBalance({
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    maxRetries: 3,
    retryDelay: 2000
  })
  .onError((error) => {
    console.error('💥 Error occurred:', error);
  })
  .onProgress((step) => {
    console.log('⏳', step);
  });

  try {
    // Try with invalid address
    console.log('Testing with invalid address...');
    const invalidResult = await balanceManager.getAllBalances('invalid-address');
    console.log('Invalid address result:', invalidResult.success ? 'Success' : 'Failed');
    
    // Try with valid address
    console.log('Testing with valid address...');
    const validResult = await balanceManager.getAllBalances('11111111111111111111111111111112');
    console.log('Valid address result:', validResult.success ? 'Success' : 'Failed');
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  } finally {
    balanceManager.destroy();
  }
}

// Run all examples
async function runExamples() {
  console.log('🚀 Solana Balance Module - Vanilla JavaScript Examples\n');
  
  try {
    await example1();
    await example2();
    await example3();
    await example4();
    example5();
    example6();
    await example7();
    
    console.log('\n✅ All examples completed!');
  } catch (error) {
    console.error('💥 Error running examples:', error);
  }
}

// Export for use in other modules
export {
  example1,
  example2,
  example3,
  example4,
  example5,
  example6,
  example7,
  runExamples
};

// Run examples if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  window.runSolanaBalanceExamples = runExamples;
} else if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment
  module.exports = {
    runExamples,
    example1,
    example2,
    example3,
    example4,
    example5,
    example6,
    example7
  };
}
