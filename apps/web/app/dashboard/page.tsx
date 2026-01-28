// Dashboard page showing transaction history and user profile
'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';
import { getExplorerUrl } from '@/lib/solana';
import Link from 'next/link';

interface Transaction {
  signature: string;
  amount: number;
  timestamp: number;
  status: 'confirmed' | 'pending' | 'failed';
  recipient?: string;
}

export default function DashboardPage() {
  const { publicKey, disconnect } = useWallet();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalVolume, setTotalVolume] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load transaction history from localStorage
  useEffect(() => {
    if (!publicKey) return;

    const saved = localStorage.getItem(`txs_${publicKey.toString()}`);
    const txs = saved ? JSON.parse(saved) : [];
    setTransactions(txs);
    
    const volume = txs
      .filter((tx: Transaction) => tx.status === 'confirmed')
      .reduce((sum: number, tx: Transaction) => sum + tx.amount, 0);
    
    setTotalVolume(volume);
    setLoading(false);
  }, [publicKey]);

  if (!publicKey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Dashboard</h1>
          <p className="text-slate-400 mb-8">Connect your wallet to view your transaction history</p>
          <Link href="/" className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
              <p className="text-slate-400">Wallet: {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}</p>
            </div>
            <button
              onClick={() => disconnect()}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
            >
              Disconnect
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard 
              label="Total Transactions" 
              value={transactions.length.toString()}
              icon="📊"
            />
            <StatCard 
              label="Confirmed Transactions"
              value={transactions.filter(t => t.status === 'confirmed').length.toString()}
              icon="✓"
            />
            <StatCard 
              label="Total Volume"
              value={`${(totalVolume / 1e9).toFixed(2)} SOL`}
              icon="💰"
            />
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-white mb-6">Transaction History</h2>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            <p className="text-slate-400 mt-4">Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="bg-slate-800 rounded-lg p-8 text-center">
            <p className="text-slate-400 mb-4">No transactions yet</p>
            <Link href="/" className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">
              Send a Private Payment
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.slice().reverse().map((tx) => (
              <TransactionRow key={tx.signature} transaction={tx} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-sm">{label}</p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
  const statusColor = {
    confirmed: 'text-green-400 bg-green-400/10',
    pending: 'text-yellow-400 bg-yellow-400/10',
    failed: 'text-red-400 bg-red-400/10',
  }[transaction.status];

  const statusIcon = {
    confirmed: '✓',
    pending: '⏱',
    failed: '✗',
  }[transaction.status];

  const date = new Date(transaction.timestamp * 1000).toLocaleString();

  return (
    <a
      href={getExplorerUrl(transaction.signature)}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-blue-500 transition flex items-center justify-between group"
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className={`p-2 rounded-lg font-bold ${statusColor}`}>
          {statusIcon}
        </div>
        <div className="min-w-0">
          <p className="text-white font-mono text-sm truncate group-hover:text-blue-400">
            {transaction.signature.slice(0, 20)}...
          </p>
          <p className="text-slate-400 text-xs mt-1">{date}</p>
        </div>
      </div>
      <div className="text-right ml-4">
        <p className="text-white font-semibold">{(transaction.amount / 1e9).toFixed(4)} SOL</p>
        <p className="text-slate-400 text-xs capitalize">{transaction.status}</p>
      </div>
    </a>
  );
}
