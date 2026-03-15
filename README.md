# Solana Balance Module

A reusable, robust Solana balance checking module that can be dropped into any JS/TSX project. Features real-time balance monitoring, SPL token support, and comprehensive error handling.

## Features

- 🚀 **Easy Integration** - Drop into any JS/TSX project
- 🔄 **Real-time Monitoring** - Live balance updates with configurable intervals
- 🪙 **SPL Token Support** - Check balances for any SPL token
- 🔄 **Robust RPC Management** - Multiple endpoints with automatic fallback
- 📱 **React Support** - Custom hooks for React integration
- 🌐 **Vanilla JS Support** - Works in any JavaScript environment
- 📝 **TypeScript** - Full TypeScript support with type definitions
- 🔧 **Configurable** - Flexible configuration options
- ⚡ **Performance** - Optimized for high-frequency balance checking

## Installation

```bash
npm install @solana/web3.js
```

## Quick Start

### React Integration

```tsx
import { useSolanaBalance } from './solana-balance-module';

function BalanceComponent() {
  const { 
    getSolBalance, 
    getTokenBalances, 
    getAllBalances,
    startMonitoring,
    solBalance,
    tokenBalances,
    isLoading, 
    error 
  } = useSolanaBalance({
    onBalanceUpdate: (result) => console.log('Balance updated!', result),
    onError: (error) => console.error('Balance check failed:', error),
    autoRefresh: true,
    refreshInterval: 30000 // 30 seconds
  });

  const handleCheckBalance = async () => {
    const result = await getAllBalances('your-wallet-address');
    console.log('SOL Balance:', result.solBalance);
    console.log('Token Balances:', result.tokenBalances);
  };

  const handleStartMonitoring = () => {
    startMonitoring('your-wallet-address');
  };

  return (
    <div>
      <button onClick={handleCheckBalance} disabled={isLoading}>
        {isLoading ? 'Checking...' : 'Check Balance'}
      </button>
      <button onClick={handleStartMonitoring}>
        Start Real-time Monitoring
      </button>
      
      {solBalance && (
        <p>SOL Balance: {solBalance.formatted} SOL</p>
      )}
      
      {tokenBalances.map(token => (
        <p key={token.mint}>
          {token.symbol || 'Token'}: {token.uiAmount.toFixed(4)}
        </p>
      ))}
    </div>
  );
}
```

### Vanilla JavaScript

```javascript
import { createVanillaBalance } from './solana-balance-module';

const balanceManager = createVanillaBalance({
  rpcUrl: 'https://api.mainnet-beta.solana.com',
  refreshInterval: 30000
})
.onBalanceUpdate((result) => console.log('Balance updated!', result))
.onError((error) => console.error('Error:', error))
.onProgress((step) => console.log('Step:', step));

// Get SOL balance
const solBalance = await balanceManager.getSolBalance('your-wallet-address');
console.log('SOL Balance:', solBalance.formatted);

// Get token balances
const tokenBalances = await balanceManager.getTokenBalances('your-wallet-address');
console.log('Token Balances:', tokenBalances);

// Get all balances
const allBalances = await balanceManager.getAllBalances('your-wallet-address');
console.log('All Balances:', allBalances);

// Start real-time monitoring
balanceManager.startMonitoring('your-wallet-address');
```

### Simple One-Liner

```javascript
import { quickSolBalance, quickTokenBalances, quickAllBalances } from './solana-balance-module';

// Get SOL balance in one line
const solBalance = await quickSolBalance('your-wallet-address');
console.log('SOL Balance:', solBalance.formatted);

// Get token balances in one line
const tokenBalances = await quickTokenBalances('your-wallet-address');
console.log('Token Balances:', tokenBalances);

// Get all balances in one line
const allBalances = await quickAllBalances('your-wallet-address');
console.log('All Balances:', allBalances);
```

## API Reference

### Core Classes

#### `SolanaBalanceModule`

Main class for handling balance checking.

```typescript
const balanceModule = new SolanaBalanceModule({
  rpcUrl: 'https://api.mainnet-beta.solana.com',
  commitment: 'confirmed',
  maxRetries: 3,
  retryDelay: 1000,
  refreshInterval: 30000
});
```

**Methods:**
- `getSolBalance(address: string): Promise<SolBalance>`
- `getTokenBalances(address: string, mints?: string[]): Promise<TokenBalance[]>`
- `getAllBalances(address: string, tokenMints?: string[]): Promise<BalanceResult>`
- `startBalanceMonitoring(address: string, callback: Function, tokenMints?: string[]): string`
- `stopBalanceMonitoring(address: string): void`
- `addressExists(address: string): Promise<boolean>`
- `getAccountInfo(address: string): Promise<AccountInfo | null>`

#### `useSolanaBalance` (React Hook)

React hook for easy integration.

```typescript
const {
  isLoading,
  isConnected,
  error,
  solBalance,
  tokenBalances,
  lastUpdate,
  getSolBalance,
  getTokenBalances,
  getAllBalances,
  refreshBalances,
  startMonitoring,
  stopMonitoring,
  stopAllMonitoring,
  clearError,
  reset,
  updateConfig,
  getConfig
} = useSolanaBalance(options);
```

#### `VanillaBalanceManager`

For non-React projects.

```typescript
const manager = createVanillaBalance(config)
  .onBalanceUpdate((result) => console.log('Success!', result))
  .onError((error) => console.error('Error:', error))
  .onProgress((step) => console.log('Step:', step));
```

### Types

```typescript
interface BalanceConfig {
  rpcUrl?: string;
  commitment?: 'processed' | 'confirmed' | 'finalized';
  maxRetries?: number;
  retryDelay?: number;
  refreshInterval?: number; // in milliseconds
}

interface SolBalance {
  lamports: number;
  sol: number;
  formatted: string;
}

interface TokenBalance {
  mint: string;
  amount: number;
  decimals: number;
  uiAmount: number;
  symbol?: string;
  name?: string;
}

interface BalanceResult {
  success: boolean;
  solBalance?: SolBalance;
  tokenBalances?: TokenBalance[];
  error?: string;
}
```

## Configuration

### RPC Endpoints

The module comes with multiple RPC endpoints for reliability:

1. Helius (Primary)
2. Solana Mainnet
3. Project Serum
4. Ankr
5. Alchemy

### Real-time Monitoring

Configure real-time balance monitoring:

```typescript
const balanceModule = new SolanaBalanceModule({
  refreshInterval: 30000 // 30 seconds
});

// Start monitoring
balanceModule.startBalanceMonitoring(
  'wallet-address',
  (result) => console.log('Balance updated:', result)
);
```

### Retry Logic

Automatic retry with exponential backoff:

```typescript
const balanceModule = new SolanaBalanceModule({
  maxRetries: 3,
  retryDelay: 1000 // 1 second base delay
});
```

## Examples

### React Component with Real-time Monitoring

```tsx
import { useSolanaBalance } from './solana-balance-module';

function RealTimeBalance() {
  const { 
    solBalance, 
    tokenBalances, 
    startMonitoring, 
    stopMonitoring,
    isLoading 
  } = useSolanaBalance({
    refreshInterval: 10000, // 10 seconds
    onBalanceUpdate: (result) => {
      console.log('Balance updated:', result);
    }
  });

  const handleStartMonitoring = () => {
    startMonitoring('your-wallet-address');
  };

  const handleStopMonitoring = () => {
    stopMonitoring('your-wallet-address');
  };

  return (
    <div>
      <button onClick={handleStartMonitoring} disabled={isLoading}>
        Start Monitoring
      </button>
      <button onClick={handleStopMonitoring}>
        Stop Monitoring
      </button>
      
      {solBalance && (
        <div>
          <h3>SOL Balance</h3>
          <p>{solBalance.formatted} SOL</p>
          <p>{solBalance.lamports} lamports</p>
        </div>
      )}
      
      {tokenBalances.length > 0 && (
        <div>
          <h3>Token Balances</h3>
          {tokenBalances.map(token => (
            <div key={token.mint}>
              <p>{token.symbol || 'Unknown'}: {token.uiAmount.toFixed(4)}</p>
              <p>Mint: {token.mint}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Node.js Server Integration

```javascript
import { SolanaBalanceModule } from './solana-balance-module';

const balanceModule = new SolanaBalanceModule({
  rpcUrl: process.env.SOLANA_RPC_URL,
  refreshInterval: 60000 // 1 minute
});

// Express.js endpoint
app.get('/api/balance/:address', async (req, res) => {
  const { address } = req.params;
  
  try {
    const result = await balanceModule.getAllBalances(address);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// WebSocket for real-time updates
io.on('connection', (socket) => {
  socket.on('start-balance-monitoring', (address) => {
    balanceModule.startBalanceMonitoring(address, (result) => {
      socket.emit('balance-update', result);
    });
  });
});
```

### Portfolio Tracker

```javascript
import { createVanillaBalance, BalanceUtils } from './solana-balance-module';

class PortfolioTracker {
  constructor() {
    this.balanceManager = createVanillaBalance({
      refreshInterval: 30000
    });
    this.prices = {}; // Token prices
  }

  async trackPortfolio(address) {
    const result = await this.balanceManager.getAllBalances(address);
    
    if (result.success) {
      const totalValue = BalanceUtils.calculatePortfolioValue(
        result.solBalance,
        result.tokenBalances,
        this.prices
      );
      
      console.log('Portfolio Value:', totalValue);
      console.log('SOL Balance:', result.solBalance.formatted);
      console.log('Token Count:', result.tokenBalances.length);
    }
  }

  startTracking(address) {
    this.balanceManager.startMonitoring(address);
  }
}
```

### Error Handling

```typescript
const balanceModule = new SolanaBalanceModule();

try {
  const result = await balanceModule.getAllBalances('invalid-address');
  
  if (!result.success) {
    console.error('Balance check failed:', result.error);
  }
} catch (error) {
  console.error('Unexpected error:', error);
}
```

## Building

```bash
npm run build
```

## Development

```bash
npm run dev
```

## Testing

```bash
npm test
```

## License

MIT

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

For support, please open an issue on GitHub or contact the maintainers.
