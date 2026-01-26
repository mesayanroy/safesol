'use client';

import { FC } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { usePhantomDetection } from '@/hooks/usePhantomDetection';

interface WalletDebugPanelProps {
  show?: boolean;
}

/**
 * Debug panel showing:
 * - Phantom detection status
 * - Network / cluster mismatch
 * - Wallet connection state
 * - RPC endpoint
 */
export const WalletDebugPanel: FC<WalletDebugPanelProps> = ({ show = false }) => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const phantomDetection = usePhantomDetection();

  if (!show) return null;

  const rpcEndpoint = connection.rpcEndpoint;
  const isDevnet = rpcEndpoint.includes('devnet');
  const isMainnet = rpcEndpoint.includes('mainnet') || rpcEndpoint.includes('api.solana');

  return (
    <div className="fixed bottom-4 right-4 max-w-sm bg-stone-900 border border-stone-700 rounded-lg p-4 text-xs text-stone-300 font-mono space-y-2 max-h-96 overflow-y-auto z-50 shadow-lg">
      <div className="font-bold text-blue-400">🔍 Wallet Debug Panel</div>

      {/* Phantom Detection */}
      <div className="border-t border-stone-700 pt-2">
        <div className="font-bold text-yellow-400">Phantom Detection:</div>
        <div
          className={
            phantomDetection.walletState === 'detected' ? 'text-green-400' : 'text-red-400'
          }
        >
          State: {phantomDetection.walletState}
        </div>
        {phantomDetection.isPhantomInstalled && (
          <div className="text-green-400">✓ Installed (v{phantomDetection.phantomVersion})</div>
        )}
        {!phantomDetection.isPhantomInstalled && <div className="text-red-400">✗ Not detected</div>}
        {phantomDetection.debugInfo.map((info, idx) => (
          <div key={idx} className="text-stone-400 ml-2">
            • {info}
          </div>
        ))}
      </div>

      {/* Network / RPC */}
      <div className="border-t border-stone-700 pt-2">
        <div className="font-bold text-yellow-400">Network:</div>
        <div>{rpcEndpoint}</div>
        <div
          className={isDevnet ? 'text-green-400' : isMainnet ? 'text-blue-400' : 'text-orange-400'}
        >
          {isDevnet && '✓ Devnet'} {isMainnet && '✓ Mainnet'}{' '}
          {!isDevnet && !isMainnet && '⚠ Custom RPC'}
        </div>
      </div>

      {/* Wallet Connection */}
      <div className="border-t border-stone-700 pt-2">
        <div className="font-bold text-yellow-400">Wallet State:</div>
        <div>
          Connected:{' '}
          {wallet.connected ? (
            <span className="text-green-400">✓ Yes</span>
          ) : (
            <span className="text-red-400">✗ No</span>
          )}
        </div>
        {wallet.publicKey && (
          <div className="text-green-400 break-all">
            {wallet.publicKey.toString().slice(0, 8)}...
          </div>
        )}
        <div>Wallet name: {wallet.wallet?.adapter.name || 'none'}</div>
        <div>Signing support: {wallet.signTransaction ? '✓' : '✗'}</div>
      </div>

      {/* Connection Test */}
      <div className="border-t border-stone-700 pt-2">
        <div className="font-bold text-yellow-400">Checks:</div>
        <div
          className={
            phantomDetection.isPhantomInstalled && wallet.connected
              ? 'text-green-400'
              : 'text-orange-400'
          }
        >
          Phantom Ready:{' '}
          {phantomDetection.isPhantomInstalled && wallet.connected ? '✓' : '✗ (connect Phantom)'}
        </div>
      </div>
    </div>
  );
};
