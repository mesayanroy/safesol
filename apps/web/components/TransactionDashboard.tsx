'use client';

import { FC, useState } from 'react';
import { TransactionRecord, TransactionType, TransactionStatus } from '@/lib/transactions';
import { Copy, Download, Trash2, Filter, FileText } from 'lucide-react';
import { PrivacyReceiptModal } from './PrivacyReceiptModal';

interface TransactionDashboardProps {
  transactions: TransactionRecord[];
  stats?: {
    totalTransactions: number;
    confirmedTransactions: number;
    failedTransactions: number;
    totalSpent: number;
    domesticCount: number;
    crossBorderCount: number;
  };
  limits?: {
    dailyCrossBorderLimit: number;
    dailyCrossBorderSpent: number;
    domesticCount: number;
    crossBorderCount: number;
  };
  onFilterChange?: (filter: { type?: TransactionType; status?: TransactionStatus }) => void;
  onClearHistory?: () => void;
  onExportHistory?: () => string | null;
  loading?: boolean;
}

const StatusBadge: FC<{ status: TransactionStatus }> = ({ status }) => {
  const variants = {
    pending: 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300',
    confirmed: 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300',
    failed: 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300',
  };

  const icons = {
    pending: '⏳',
    confirmed: '✓',
    failed: '✗',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${variants[status]}`}
    >
      <span>{icons[status]}</span>
      <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
    </span>
  );
};

const TypeBadge: FC<{ type: TransactionType }> = ({ type }) => {
  const variants = {
    domestic: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300',
    'cross-border': 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300',
  };

  const icons = {
    domestic: '🏠',
    'cross-border': '🌍',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${variants[type]}`}
    >
      <span>{icons[type]}</span>
      <span>{type === 'domestic' ? 'Domestic' : 'Cross-Border'}</span>
    </span>
  );
};

const TransactionDashboard: FC<TransactionDashboardProps> = ({
  transactions,
  stats,
  limits,
  onFilterChange,
  onClearHistory,
  onExportHistory,
  loading,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedType, setSelectedType] = useState<TransactionType | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<TransactionStatus | undefined>(undefined);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<TransactionRecord | null>(null);

  const handleFilterChange = () => {
    onFilterChange?.({
      type: selectedType,
      status: selectedStatus,
    });
  };

  const handleExport = () => {
    const data = onExportHistory?.();
    if (data) {
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transaction-history-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString();
  };

  const formatAmount = (amount: number) => {
    return amount.toFixed(4);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
          <StatCard label="Total Transactions" value={stats.totalTransactions} icon="📊" />
          <StatCard label="Confirmed" value={stats.confirmedTransactions} icon="✓" color="green" />
          <StatCard label="Failed" value={stats.failedTransactions} icon="✗" color="red" />
          <StatCard label="Total Spent" value={`${formatAmount(stats.totalSpent)} SOL`} icon="💰" />
          <StatCard label="Domestic" value={stats.domesticCount} icon="🏠" />
          <StatCard label="Cross-Border" value={stats.crossBorderCount} icon="🌍" />
        </div>
      )}

      {/* Daily Limits */}
      {limits && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
              Daily Cross-Border Limit
            </h3>
            <span className="text-2xl">🌍</span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-stone-700 dark:text-stone-300">Spent Today</span>
                <span className="text-sm font-semibold text-stone-900 dark:text-stone-50">
                  {formatAmount(limits.dailyCrossBorderSpent)} / {limits.dailyCrossBorderLimit} SOL
                </span>
              </div>
              <div className="w-full bg-stone-200 dark:bg-stone-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-full transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      (limits.dailyCrossBorderSpent / limits.dailyCrossBorderLimit) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/50 dark:bg-stone-900/50 rounded-lg p-3">
                <p className="text-xs text-stone-600 dark:text-stone-400 mb-1">Remaining</p>
                <p className="text-lg font-bold text-stone-900 dark:text-stone-50">
                  {formatAmount(
                    Math.max(0, limits.dailyCrossBorderLimit - limits.dailyCrossBorderSpent)
                  )}{' '}
                  SOL
                </p>
              </div>
              <div className="bg-white/50 dark:bg-stone-900/50 rounded-lg p-3">
                <p className="text-xs text-stone-600 dark:text-stone-400 mb-1">Usage</p>
                <p className="text-lg font-bold text-stone-900 dark:text-stone-50">
                  {((limits.dailyCrossBorderSpent / limits.dailyCrossBorderLimit) * 100).toFixed(0)}
                  %
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 hover:bg-stone-50 dark:hover:bg-stone-900 transition text-sm font-medium text-stone-700 dark:text-stone-300"
        >
          <Filter className="w-4 h-4" />
          <span>Filters</span>
        </button>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 hover:bg-stone-50 dark:hover:bg-stone-900 transition text-sm font-medium text-stone-700 dark:text-stone-300"
        >
          <Download className="w-4 h-4" />
          <span>Export</span>
        </button>

        {transactions.length > 0 && (
          <button
            onClick={onClearHistory}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 hover:bg-red-100 dark:hover:bg-red-900 transition text-sm font-medium text-red-700 dark:text-red-300"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-stone-50 dark:bg-stone-900 rounded-2xl p-6 border border-stone-200 dark:border-stone-800 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-stone-900 dark:text-stone-50 mb-2">
                Transaction Type
              </label>
              <select
                value={selectedType || ''}
                onChange={(e) => setSelectedType((e.target.value as TransactionType) || undefined)}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-50 text-sm"
              >
                <option value="">All Types</option>
                <option value="domestic">Domestic</option>
                <option value="cross-border">Cross-Border</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-900 dark:text-stone-50 mb-2">
                Status
              </label>
              <select
                value={selectedStatus || ''}
                onChange={(e) =>
                  setSelectedStatus((e.target.value as TransactionStatus) || undefined)
                }
                className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-50 text-sm"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleFilterChange}
            className="w-full px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition text-sm"
          >
            Apply Filters
          </button>
        </div>
      )}

      {/* Transactions List */}
      <div className="bg-white dark:bg-stone-950 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
        {transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-stone-900 dark:text-stone-50">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-stone-900 dark:text-stone-50">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-stone-900 dark:text-stone-50">
                    Recipient
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-stone-900 dark:text-stone-50">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-stone-900 dark:text-stone-50">
                    Time
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-stone-900 dark:text-stone-50">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-stone-50 dark:hover:bg-stone-900 transition">
                    <td className="px-4 py-4">
                      <TypeBadge type={tx.type} />
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-semibold text-stone-900 dark:text-stone-50">
                        {formatAmount(tx.amount)} SOL
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <code className="text-xs font-mono text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded">
                        {formatAddress(tx.recipient)}
                      </code>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={tx.status} />
                    </td>
                    <td className="px-4 py-4 text-xs text-stone-600 dark:text-stone-400">
                      {formatDate(tx.timestamp)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyToClipboard(tx.signature, tx.id)}
                          className="p-1.5 rounded hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                          title="Copy signature"
                        >
                          <Copy className="w-4 h-4 text-stone-500 dark:text-stone-400" />
                        </button>
                        {tx.status === 'confirmed' && tx.receipt && (
                          <button
                            onClick={() => setSelectedReceipt(tx)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white text-xs font-medium transition shadow-sm"
                            title="View Privacy Receipt"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Receipt</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 px-4">
            <p className="text-2xl mb-2">📭</p>
            <p className="text-stone-600 dark:text-stone-400 font-medium mb-1">
              No transactions yet
            </p>
            <p className="text-sm text-stone-500 dark:text-stone-500">
              Send your first private payment to see it here
            </p>
          </div>
        )}
      </div>

      {/* Privacy Receipt Modal */}
      {selectedReceipt && selectedReceipt.receipt && (
        <PrivacyReceiptModal
          receipt={selectedReceipt.receipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
};

const StatCard: FC<{
  label: string;
  value: string | number;
  icon: string;
  color?: 'green' | 'red' | 'blue' | 'default';
}> = ({ label, value, icon, color = 'default' }) => {
  const colorVariants = {
    green: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800',
    red: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800',
    blue: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
    default: 'bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800',
  };

  return (
    <div className={`rounded-lg p-4 border ${colorVariants[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-stone-600 dark:text-stone-400">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-stone-900 dark:text-stone-50">{value}</p>
    </div>
  );
};

export default TransactionDashboard;
