'use client';

import { FC, ReactNode, useMemo, useCallback, useEffect } from 'react';
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

require('@solana/wallet-adapter-react-ui/styles.css');

const WalletProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const network = WalletAdapterNetwork.Devnet;
  
  // Use custom RPC endpoint or fallback to Solana public
  const endpoint = useMemo(() => {
    const customRpc = process.env.NEXT_PUBLIC_RPC_ENDPOINT;
    if (customRpc) {
      console.log('[WalletProvider] Using custom RPC:', customRpc);
      return customRpc;
    }
    const defaultEndpoint = clusterApiUrl(network);
    console.log('[WalletProvider] Using default RPC:', defaultEndpoint);
    return defaultEndpoint;
  }, []);

  // Initialize wallets with Phantom FIRST (priority ordering)
  // Phantom must come before other wallets to ensure proper detection
  const wallets = useMemo(() => {
    const walletList = [];

    try {
      // Step 1: Phantom - highest priority (most users)
      const phantom = new PhantomWalletAdapter();
      walletList.push(phantom);
      console.log('[WalletProvider] ✓ PhantomWalletAdapter initialized');
    } catch (err) {
      console.error('[WalletProvider] Failed to initialize PhantomWalletAdapter:', err);
    }

    try {
      // Step 2: Solflare - fallback
      const solflare = new SolflareWalletAdapter();
      walletList.push(solflare);
      console.log('[WalletProvider] ✓ SolflareWalletAdapter initialized');
    } catch (err) {
      console.error('[WalletProvider] Failed to initialize SolflareWalletAdapter:', err);
    }

    if (walletList.length === 0) {
      console.warn('[WalletProvider] ⚠ No wallet adapters initialized');
    }

    return walletList;
  }, []);

  // Global error handler for all wallet events
  const handleWalletError = useCallback((error: Error) => {
    console.error('[WalletProvider] Wallet Error:', {
      message: error.message,
      code: (error as any).code,
      timestamp: new Date().toISOString(),
    });
  }, []);

  // Debug: Log network configuration
  useEffect(() => {
    console.log('[WalletProvider] Network Configuration:', {
      network: network,
      endpoint: endpoint,
      walletCount: wallets.length,
      walletNames: wallets.map((w) => w.name),
      autoConnect: process.env.NEXT_PUBLIC_WALLET_AUTO_CONNECT === 'true',
    });
  }, [endpoint, network, wallets]);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider 
        wallets={wallets} 
        autoConnect={process.env.NEXT_PUBLIC_WALLET_AUTO_CONNECT === 'true'}
        onError={handleWalletError}
      >
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};

export default WalletProvider;
