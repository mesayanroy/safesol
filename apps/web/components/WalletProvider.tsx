'use client';

import { FC, ReactNode, useMemo, useCallback } from 'react';
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
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

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
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  }, []);

  // Debug: Log network configuration
  console.log('[WalletProvider] Initialized with:', {
    network: network,
    endpoint: endpoint,
    walletCount: wallets.length,
    walletNames: wallets.map((w) => w.name),
  });

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect={false} onError={handleWalletError}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};

export default WalletProvider;
