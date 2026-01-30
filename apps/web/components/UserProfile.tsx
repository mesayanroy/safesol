'use client';

import { FC } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';

interface UserProfileProps {
  stats?: {
    totalTransactions: number;
    confirmedTransactions: number;
    totalSpent: number;
  };
}

const UserProfile: FC<UserProfileProps> = ({ stats }) => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch wallet balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (!publicKey || !connection) return;

      setLoading(true);
      try {
        const lamports = await connection.getBalance(publicKey);
        setBalance(lamports / LAMPORTS_PER_SOL);
      } catch (error) {
        console.error('Error fetching balance:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();

    // Refresh balance every 10 seconds
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, [publicKey, connection]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!publicKey) {
    return (
      <div className="bg-gradient-to-br from-stone-50 to-stone-100 dark:from-stone-900 dark:to-stone-950 rounded-2xl p-6 sm:p-8 border border-stone-200 dark:border-stone-800 shadow-sm">
        <div className="text-center py-8">
          <p className="text-2xl mb-4">👤</p>
          <p className="text-stone-600 dark:text-stone-400 font-medium">No Wallet Connected</p>
          <p className="text-stone-500 dark:text-stone-500 text-sm mt-2">
            Connect your wallet to see profile details
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-2xl p-6 sm:p-8 border border-blue-200 dark:border-blue-800 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-50">
          Your Profile
        </h2>
        <span className="text-3xl">👤</span>
      </div>

      {/* Main Profile Info */}
      <div className="bg-white dark:bg-stone-950 rounded-xl p-6 mb-6 border border-stone-200 dark:border-stone-800">
        <div className="space-y-4">
          {/* Wallet Address */}
          <div>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mb-2">
              Connected Wallet
            </p>
            <div className="flex items-center gap-2">
              <code className="text-sm sm:text-base font-mono bg-stone-100 dark:bg-stone-900 px-3 sm:px-4 py-2 rounded-lg text-stone-900 dark:text-stone-50 flex-1 truncate">
                {publicKey.toString()}
              </code>
              <button
                onClick={() => copyToClipboard(publicKey.toString())}
                className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-900 transition"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : (
                  <Copy className="w-5 h-5 text-stone-600 dark:text-stone-400" />
                )}
              </button>
            </div>
          </div>

          {/* Balance */}
          <div>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mb-2">
              Available Balance
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                {loading ? '...' : balance?.toFixed(4) || '0.00'}
              </span>
              <span className="text-lg sm:text-xl font-semibold text-stone-600 dark:text-stone-400">
                SOL
              </span>
            </div>
          </div>

          {/* Verification Status */}
          <div className="pt-4 border-t border-stone-200 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 rounded-full text-xs sm:text-sm font-semibold">
                <span>✓</span>
                <span>Verified Wallet</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-stone-950 rounded-xl p-4 border border-stone-200 dark:border-stone-800">
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mb-2">
              Total Transactions
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-50">
              {stats.totalTransactions}
            </p>
          </div>

          <div className="bg-white dark:bg-stone-950 rounded-xl p-4 border border-stone-200 dark:border-stone-800">
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mb-2">Confirmed</p>
            <p className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">
              {stats.confirmedTransactions}
            </p>
          </div>

          <div className="bg-white dark:bg-stone-950 rounded-xl p-4 border border-stone-200 dark:border-stone-800">
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mb-2">
              Total Spent
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-50">
              {stats.totalSpent.toFixed(2)} SOL
            </p>
          </div>
        </div>
      )}

      {/* No Stats Message */}
      {!stats && (
        <div className="bg-white dark:bg-stone-950 rounded-xl p-6 border border-stone-200 dark:border-stone-800 text-center">
          <p className="text-stone-600 dark:text-stone-400">
            Send your first payment to see statistics
          </p>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
