// Professional Dashboard with User Profile and Transaction History
'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import UserProfile from '@/components/UserProfile';
import TransactionDashboard from '@/components/TransactionDashboard';
import { useTransactionHistory } from '@/hooks/useTransactionHistory';

export default function DashboardPage() {
  const wallet = useWallet();
  const { transactions, stats, limits, changeFilter, clearHistory, exportHistory } =
    useTransactionHistory();

  if (!wallet.publicKey) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100 dark:from-stone-950 dark:to-stone-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-20">
            <p className="text-4xl mb-4">🔓</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 dark:text-stone-50 mb-4">
              Access Dashboard
            </h1>
            <p className="text-stone-600 dark:text-stone-400 mb-8 max-w-2xl mx-auto">
              Connect your Solana wallet to view your profile, transactions, and payment history
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
            Dashboard
          </h1>
          <p className="text-stone-600 dark:text-stone-400 text-xs sm:text-sm">
            View your profile, transaction history, and payment details
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Left Column - Profile */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <UserProfile
                stats={
                  stats
                    ? {
                        totalTransactions: stats.totalTransactions,
                        confirmedTransactions: stats.confirmedTransactions,
                        totalSpent: stats.totalSpent,
                      }
                    : undefined
                }
              />
            </div>
          </div>

          {/* Right Column - Transactions */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {/* Quick Stats Row */}
              {stats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                  <StatCard label="Total" value={stats.totalTransactions} icon="📊" color="blue" />
                  <StatCard
                    label="Confirmed"
                    value={stats.confirmedTransactions}
                    icon="✓"
                    color="green"
                  />
                  <StatCard label="Failed" value={stats.failedTransactions} icon="✗" color="red" />
                  <StatCard
                    label="Spent"
                    value={`${stats.totalSpent.toFixed(2)}`}
                    icon="💰"
                    color="purple"
                    isSol={true}
                  />
                </div>
              )}

              {/* Limit Card */}
              {limits && (
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 rounded-2xl p-4 sm:p-6 text-white shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base sm:text-lg font-bold">Daily Cross-Border Limit</h3>
                    <span className="text-2xl">🌍</span>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs opacity-90">Spent Today</span>
                        <span className="text-xs font-semibold">
                          {limits.dailyCrossBorderSpent.toFixed(2)} / {limits.dailyCrossBorderLimit}{' '}
                          SOL
                        </span>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
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
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1.5">
                      <div className="bg-white/10 rounded-lg px-2.5 py-1.5">
                        <p className="text-xs opacity-75">Remaining</p>
                        <p className="text-base font-bold">
                          {Math.max(
                            0,
                            limits.dailyCrossBorderLimit - limits.dailyCrossBorderSpent
                          ).toFixed(2)}{' '}
                          SOL
                        </p>
                      </div>
                      <div className="bg-white/10 rounded-lg px-2.5 py-1.5">
                        <p className="text-xs opacity-75">Usage</p>
                        <p className="text-base font-bold">
                          {(
                            (limits.dailyCrossBorderSpent / limits.dailyCrossBorderLimit) *
                            100
                          ).toFixed(0)}
                          %
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Transactions Dashboard */}
              <div className="bg-white dark:bg-stone-950 rounded-2xl p-4 sm:p-6 border border-stone-200 dark:border-stone-800 shadow-sm">
                <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-50 mb-4">
                  Transaction History
                </h2>
                <TransactionDashboard
                  transactions={transactions}
                  stats={stats || undefined}
                  limits={limits || undefined}
                  onFilterChange={changeFilter}
                  onClearHistory={clearHistory}
                  onExportHistory={exportHistory}
                  loading={false}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl p-3 sm:p-4">
          <h3 className="text-sm sm:text-base font-bold text-blue-900 dark:text-blue-100 mb-1.5">
            💡 Dashboard Tips
          </h3>
          <ul className="space-y-1 text-xs text-blue-800 dark:text-blue-200">
            <li>• Your profile updates automatically with wallet balance and transaction stats</li>
            <li>• Cross-border limit resets every 24 hours automatically</li>
            <li>• Use filters to organize transactions by type and status</li>
            <li>• Export your transaction history as JSON for record-keeping</li>
            <li>• All your data is stored securely in your browser's localStorage</li>
          </ul>
        </div>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  isSol = false,
}: {
  label: string;
  value: string | number;
  icon: string;
  color: 'blue' | 'green' | 'red' | 'purple';
  isSol?: boolean;
}) {
  const colorClasses = {
    blue: 'from-blue-100 to-blue-50 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100',
    green:
      'from-green-100 to-green-50 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100',
    red: 'from-red-100 to-red-50 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100',
    purple:
      'from-purple-100 to-purple-50 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-100',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl p-3 border`}>
      <p className="text-xs opacity-75 mb-1">{label}</p>
      <div className="flex items-center justify-between">
        <p className="text-xl sm:text-2xl font-bold">
          {value}
          {isSol ? ' SOL' : ''}
        </p>
        <p className="text-lg">{icon}</p>
      </div>
    </div>
  );
}
