'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useState } from 'react';
import { useTransactionHistory } from '@/hooks/useTransactionHistory';
import { ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, XCircle, Send } from 'lucide-react';

export default function PaymentsPage() {
  const wallet = useWallet();
  const { transactions, stats, limits } = useTransactionHistory();
  const [paymentType, setPaymentType] = useState<'domestic' | 'cross-border'>('domestic');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet.publicKey || !wallet.signTransaction) {
      setError('Wallet not connected');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate inputs
      if (!recipient.trim()) {
        throw new Error('Please enter a recipient address');
      }
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        throw new Error('Please enter a valid amount');
      }

      // Check limits
      const amountSol = parseFloat(amount);
      if (paymentType === 'cross-border' && limits) {
        const remaining = limits.dailyCrossBorderLimit - limits.dailyCrossBorderSpent;
        if (amountSol > remaining) {
          throw new Error(`Cross-border limit exceeded. Remaining: ${remaining.toFixed(2)} SOL`);
        }
      }

      // Here you would implement the actual payment logic
      // For now, we'll just show a success message
      console.log('Payment submitted:', { recipient, amount, paymentType });

      setSuccess(`Payment of ${amount} SOL sent successfully!`);
      setRecipient('');
      setAmount('');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  // Get recent transactions (limit to 10)
  const recentTransactions = transactions
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    .slice(0, 10);

  if (!wallet.publicKey) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100 dark:from-stone-950 dark:to-stone-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-20">
            <p className="text-4xl mb-4">💳</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 dark:text-stone-50 mb-4">
              Send Payments
            </h1>
            <p className="text-stone-600 dark:text-stone-400 mb-8 max-w-2xl mx-auto">
              Connect your Solana wallet to send domestic and cross-border payments securely
            </p>
            <button
              onClick={() => {
                const button = document.querySelector('[role="button"]');
                if (button instanceof HTMLElement) button.click();
              }}
              className="px-8 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
            >
              Connect Wallet
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100 dark:from-stone-950 dark:to-stone-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 dark:text-stone-50 mb-2">
            Send Payment
          </h1>
          <p className="text-stone-600 dark:text-stone-400 text-xs sm:text-sm">
            Send domestic or cross-border payments with privacy and security
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12">
          {/* Payment Form */}
          <div className="bg-white dark:bg-stone-950 rounded-2xl p-4 sm:p-6 border border-stone-200 dark:border-stone-800 shadow-sm">
            <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-50 mb-4">
              Payment Details
            </h2>

            <form onSubmit={handlePayment} className="space-y-3">
              {/* Recipient */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Recipient Address
                </label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="Enter recipient's Solana wallet address"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-50 placeholder-stone-500 dark:placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Amount (SOL)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.0001"
                  min="0"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-50 placeholder-stone-500 dark:placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
              </div>

              {/* Payment Type */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-2">
                  Payment Type
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentType('domestic')}
                    disabled={loading}
                    className={`flex-1 py-2 px-3 text-sm rounded-lg font-medium transition-all ${
                      paymentType === 'domestic'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                    }`}
                  >
                    🏠 Domestic
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentType('cross-border')}
                    disabled={loading}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                      paymentType === 'cross-border'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                    }`}
                  >
                    🌍 Cross-Border
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-green-800 dark:text-green-200 text-sm">{success}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !wallet.publicKey}
                className="w-full py-2.5 px-4 text-sm bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-stone-400 disabled:to-stone-500 text-white font-bold rounded-lg transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                {loading ? 'Processing...' : 'Send Payment'}
              </button>
            </form>
          </div>

          {/* Right Column - Info & Recent */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Limit Info Card */}
              {limits && (
                <div className="bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-700 dark:to-orange-700 rounded-2xl p-4 sm:p-6 text-white shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base sm:text-lg font-bold">Available Balance</h3>
                    <span className="text-2xl">💰</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 rounded-lg px-4 py-3">
                      <p className="text-xs opacity-75 mb-1">Domestic</p>
                      <p className="text-2xl font-bold">Unlimited</p>
                    </div>
                    <div className="bg-white/10 rounded-lg px-4 py-3">
                      <p className="text-xs opacity-75 mb-1">Cross-Border</p>
                      <p className="text-2xl font-bold">
                        {Math.max(
                          0,
                          limits.dailyCrossBorderLimit - limits.dailyCrossBorderSpent
                        ).toFixed(2)}{' '}
                        SOL
                      </p>
                    </div>
                  </div>

                  {limits.dailyCrossBorderSpent > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/20">
                      <p className="text-xs opacity-75 mb-2">Today's Cross-Border Usage</p>
                      <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-white h-full transition-all duration-300"
                          style={{
                            width: `${Math.min(
                              (limits.dailyCrossBorderSpent / limits.dailyCrossBorderLimit) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs mt-2">
                        {limits.dailyCrossBorderSpent.toFixed(2)} / {limits.dailyCrossBorderLimit}{' '}
                        SOL
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Recent Transactions */}
              <div className="bg-white dark:bg-stone-950 rounded-2xl p-4 sm:p-6 border border-stone-200 dark:border-stone-800 shadow-sm">
                <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-50 mb-4">
                  Recent Payments
                </h2>

                {recentTransactions.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-stone-600 dark:text-stone-400 text-sm">
                      No payments yet. Send your first payment to get started!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentTransactions.map((tx) => (
                      <TransactionItem key={tx.id || tx.signature} transaction={tx} />
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Tips */}
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-2xl p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-bold text-green-900 dark:text-green-100 mb-2">
                  ✨ Payment Tips
                </h3>
                <ul className="space-y-1.5 text-xs sm:text-sm text-green-800 dark:text-green-200">
                  <li>• Domestic payments have no daily limits</li>
                  <li>• Cross-border payments are limited to 10 SOL per day</li>
                  <li>• All payments are secured on the Solana blockchain</li>
                  <li>• Transactions typically confirm within 1-2 minutes</li>
                  <li>• Your payment history is stored locally on this device</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <StatCard label="Total Payments" value={stats.totalTransactions} icon="📊" />
            <StatCard label="Confirmed" value={stats.confirmedTransactions} icon="✓" />
            <StatCard label="Failed" value={stats.failedTransactions} icon="✗" />
            <StatCard label="Total Sent" value={`${stats.totalSpent.toFixed(2)} SOL`} icon="💸" />
          </div>
        )}
      </div>
    </main>
  );
}

interface Transaction {
  id?: string;
  signature: string;
  amount: number;
  recipient?: string;
  status: 'confirmed' | 'pending' | 'failed';
  timestamp?: number;
  type?: 'domestic' | 'cross-border';
}

function TransactionItem({ transaction }: { transaction: Transaction }) {
  const statusConfig = {
    confirmed: {
      icon: CheckCircle2,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950',
      label: 'Confirmed',
    },
    pending: {
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950',
      label: 'Pending',
    },
    failed: {
      icon: XCircle,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-950',
      label: 'Failed',
    },
  };

  const config = statusConfig[transaction.status];
  const IconComponent = config.icon;
  const isOutgoing = true; // In a real app, check if sender is the user

  const formattedAmount = (transaction.amount / 1e9).toFixed(4);
  const date = transaction.timestamp
    ? new Date(transaction.timestamp * 1000).toLocaleDateString()
    : 'N/A';
  const time = transaction.timestamp
    ? new Date(transaction.timestamp * 1000).toLocaleTimeString()
    : '';

  return (
    <div
      className={`${config.bgColor} rounded-lg p-4 border border-stone-200 dark:border-stone-800`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${config.color}`}>
          <IconComponent className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-stone-900 dark:text-stone-50">
              {transaction.type === 'cross-border' ? '🌍' : '🏠'} {transaction.type || 'Payment'}
            </p>
            <span className={`text-xs font-medium px-2 py-1 rounded ${config.color}`}>
              {config.label}
            </span>
          </div>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
            {date} {time && `at ${time}`}
          </p>
        </div>

        <div className="text-right">
          <p className="font-bold text-stone-900 dark:text-stone-50 flex items-center gap-1">
            {isOutgoing ? (
              <ArrowUpRight className="w-4 h-4 text-red-600 dark:text-red-400" />
            ) : (
              <ArrowDownLeft className="w-4 h-4 text-green-600 dark:text-green-400" />
            )}
            {formattedAmount} SOL
          </p>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 truncate max-w-40">
            {transaction.recipient ? `to ${transaction.recipient.slice(0, 8)}...` : 'Transaction'}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="bg-white dark:bg-stone-950 rounded-xl p-4 border border-stone-200 dark:border-stone-800">
      <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mb-2">{label}</p>
      <div className="flex items-center justify-between">
        <p className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-50">{value}</p>
        <p className="text-xl sm:text-2xl">{icon}</p>
      </div>
    </div>
  );
}
