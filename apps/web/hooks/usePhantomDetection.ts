'use client';

import { useEffect, useState, useCallback } from 'react';

interface WalletDetection {
  isPhantomInstalled: boolean;
  phantomVersion?: string;
  walletState: 'detecting' | 'detected' | 'not-found';
  debugInfo: string[];
}

/**
 * Hook to detect and monitor Phantom wallet availability
 * Runs only on client side and provides real-time debug info
 */
export function usePhantomDetection(): WalletDetection {
  const [detection, setDetection] = useState<WalletDetection>({
    isPhantomInstalled: false,
    walletState: 'detecting',
    debugInfo: [],
  });

  useEffect(() => {
    // Ensure client-side only
    if (typeof window === 'undefined') {
      setDetection((prev) => ({
        ...prev,
        debugInfo: [...prev.debugInfo, 'SSR detected, skipping'],
      }));
      return;
    }

    const debug: string[] = [];

    // Step 1: Check window.solana exists
    if (!window.solana) {
      debug.push('window.solana is undefined');
      setDetection({
        isPhantomInstalled: false,
        walletState: 'not-found',
        debugInfo: debug,
      });
      return;
    }

    debug.push(`window.solana exists: ${typeof window.solana}`);

    // Step 2: Check for Phantom specifically
    const isPhantom = window.solana?.isPhantom === true;
    debug.push(`isPhantom check: ${isPhantom}`);

    if (!isPhantom) {
      debug.push(`Detected wallet: ${window.solana.name || 'unknown'}`);
      setDetection({
        isPhantomInstalled: false,
        walletState: 'not-found',
        debugInfo: debug,
      });
      return;
    }

    // Step 3: Get Phantom version
    const version = window.solana?.version || 'unknown';
    debug.push(`Phantom version: ${version}`);

    // Step 4: Check connected state (non-blocking)
    const publicKey = window.solana.publicKey;
    if (publicKey) {
      debug.push(`Already connected: ${publicKey.toString()}`);
    } else {
      debug.push('Phantom ready, awaiting user connection');
    }

    setDetection({
      isPhantomInstalled: true,
      phantomVersion: version,
      walletState: 'detected',
      debugInfo: debug,
    });

    // Log to console for debugging
    console.group('[Phantom Detection] Success');
    debug.forEach((msg) => console.log(`  ✓ ${msg}`));
    console.groupEnd();
  }, []);

  return detection;
}
