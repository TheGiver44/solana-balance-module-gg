/**
 * React Example - Solana Balance Module
 * 
 * This example shows how to integrate the Solana Balance Module
 * into a React application with real-time monitoring.
 */

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useSolanaBalance } from '../src/useSolanaBalance';

export function BalanceExample() {
  const { publicKey, connected } = useWallet();
  const [address, setAddress] = useState('');
  const [monitoringAddress, setMonitoringAddress] = useState('');
  const [isMonitoring, setIsMonitoring] = useState(false);

  const {
    getSolBalance,
    getTokenBalances,
    getAllBalances,
    startMonitoring,
    stopMonitoring,
    stopAllMonitoring,
    solBalance,
    tokenBalances,
    isLoading,
    error,
    lastUpdate,
    clearError
  } = useSolanaBalance({
    onBalanceUpdate: (result) => {
      console.log('Balance updated!', result);
    },
    onError: (error) => {
      console.error('Balance check failed:', error);
    },
    onProgress: (step) => {
      console.log('Progress:', step);
    },
    autoRefresh: true,
    refreshInterval: 30000 // 30 seconds
  });

  // Auto-fill address when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      setAddress(publicKey.toString());
    }
  }, [connected, publicKey]);

  const handleCheckSolBalance = async () => {
    if (!address) {
      alert('Please enter a wallet address');
      return;
    }

    try {
      clearError();
      const balance = await getSolBalance(address);
      console.log('SOL Balance:', balance);
    } catch (err) {
      console.error('Error getting SOL balance:', err);
    }
  };

  const handleCheckTokenBalances = async () => {
    if (!address) {
      alert('Please enter a wallet address');
      return;
    }

    try {
      clearError();
      const balances = await getTokenBalances(address);
      console.log('Token Balances:', balances);
    } catch (err) {
      console.error('Error getting token balances:', err);
    }
  };

  const handleCheckAllBalances = async () => {
    if (!address) {
      alert('Please enter a wallet address');
      return;
    }

    try {
      clearError();
      const result = await getAllBalances(address);
      console.log('All Balances:', result);
    } catch (err) {
      console.error('Error getting all balances:', err);
    }
  };

  const handleStartMonitoring = () => {
    if (!address) {
      alert('Please enter a wallet address');
      return;
    }

    startMonitoring(address);
    setMonitoringAddress(address);
    setIsMonitoring(true);
  };

  const handleStopMonitoring = () => {
    if (monitoringAddress) {
      stopMonitoring(monitoringAddress);
    }
    setMonitoringAddress('');
    setIsMonitoring(false);
  };

  const handleStopAllMonitoring = () => {
    stopAllMonitoring();
    setMonitoringAddress('');
    setIsMonitoring(false);
  };

  return (
    <div className="balance-example">
      <h2>Solana Balance Example</h2>
      
      <div className="form-group">
        <label htmlFor="address">Wallet Address:</label>
        <input
          id="address"
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter wallet address"
          className="form-input"
        />
      </div>

      {error && (
        <div className="error-message">
          <p>Error: {error}</p>
          <button onClick={clearError}>Clear Error</button>
        </div>
      )}

      <div className="button-group">
        <button
          onClick={handleCheckSolBalance}
          disabled={isLoading || !address}
          className="balance-button"
        >
          {isLoading ? 'Checking...' : 'Check SOL Balance'}
        </button>

        <button
          onClick={handleCheckTokenBalances}
          disabled={isLoading || !address}
          className="balance-button"
        >
          {isLoading ? 'Checking...' : 'Check Token Balances'}
        </button>

        <button
          onClick={handleCheckAllBalances}
          disabled={isLoading || !address}
          className="balance-button"
        >
          {isLoading ? 'Checking...' : 'Check All Balances'}
        </button>
      </div>

      <div className="monitoring-section">
        <h3>Real-time Monitoring</h3>
        <div className="button-group">
          <button
            onClick={handleStartMonitoring}
            disabled={isLoading || !address || isMonitoring}
            className="monitor-button start"
          >
            Start Monitoring
          </button>

          <button
            onClick={handleStopMonitoring}
            disabled={!isMonitoring}
            className="monitor-button stop"
          >
            Stop Monitoring
          </button>

          <button
            onClick={handleStopAllMonitoring}
            disabled={!isMonitoring}
            className="monitor-button stop-all"
          >
            Stop All Monitoring
          </button>
        </div>

        {isMonitoring && (
          <p className="monitoring-status">
            Monitoring: {monitoringAddress}
          </p>
        )}
      </div>

      {solBalance && (
        <div className="balance-display">
          <h3>SOL Balance</h3>
          <div className="balance-info">
            <p><strong>Amount:</strong> {solBalance.formatted} SOL</p>
            <p><strong>Lamports:</strong> {solBalance.lamports.toLocaleString()}</p>
            {lastUpdate && (
              <p><strong>Last Updated:</strong> {lastUpdate.toLocaleString()}</p>
            )}
          </div>
        </div>
      )}

      {tokenBalances.length > 0 && (
        <div className="token-balances">
          <h3>Token Balances ({tokenBalances.length})</h3>
          <div className="token-list">
            {tokenBalances.map((token, index) => (
              <div key={token.mint || index} className="token-item">
                <div className="token-info">
                  <p><strong>Symbol:</strong> {token.symbol || 'Unknown'}</p>
                  <p><strong>Amount:</strong> {token.uiAmount.toFixed(4)}</p>
                  <p><strong>Decimals:</strong> {token.decimals}</p>
                  <p><strong>Mint:</strong> {token.mint.slice(0, 8)}...{token.mint.slice(-8)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .balance-example {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: Arial, sans-serif;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }

        .form-input {
          width: 100%;
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 14px;
        }

        .button-group {
          display: flex;
          gap: 10px;
          margin: 20px 0;
          flex-wrap: wrap;
        }

        .balance-button,
        .monitor-button {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .balance-button {
          background-color: #007bff;
          color: white;
        }

        .balance-button:hover:not(:disabled) {
          background-color: #0056b3;
        }

        .balance-button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }

        .monitor-button.start {
          background-color: #28a745;
          color: white;
        }

        .monitor-button.start:hover:not(:disabled) {
          background-color: #1e7e34;
        }

        .monitor-button.stop {
          background-color: #dc3545;
          color: white;
        }

        .monitor-button.stop:hover:not(:disabled) {
          background-color: #c82333;
        }

        .monitor-button.stop-all {
          background-color: #6c757d;
          color: white;
        }

        .monitor-button.stop-all:hover:not(:disabled) {
          background-color: #5a6268;
        }

        .monitor-button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }

        .monitoring-section {
          margin: 30px 0;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background-color: #f8f9fa;
        }

        .monitoring-status {
          color: #28a745;
          font-weight: bold;
          margin-top: 10px;
        }

        .balance-display {
          margin: 20px 0;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background-color: #f8f9fa;
        }

        .balance-info p {
          margin: 5px 0;
        }

        .token-balances {
          margin: 20px 0;
        }

        .token-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 15px;
          margin-top: 15px;
        }

        .token-item {
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background-color: white;
        }

        .token-info p {
          margin: 5px 0;
          font-size: 14px;
        }

        .error-message {
          background-color: #f8d7da;
          color: #721c24;
          padding: 10px;
          border-radius: 4px;
          margin: 10px 0;
        }

        .error-message button {
          background-color: #721c24;
          color: white;
          border: none;
          padding: 5px 10px;
          border-radius: 3px;
          cursor: pointer;
          margin-top: 5px;
        }
      `}</style>
    </div>
  );
}
