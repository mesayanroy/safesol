'use client';

import { useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import {
  TransactionManager,
  TransactionRecord,
  TransactionStatus,
  TransactionType,
  DailyLimits,
} from '@/lib/transactions';

interface TransactionStats {
  totalTransactions: number;
  confirmedTransactions: number;
  failedTransactions: number;
  totalSpent: number;
  domesticCount: number;
  crossBorderCount: number;
}

export function useTransactionHistory() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [manager, setManager] = useState<TransactionManager | null>(null);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [limits, setLimits] = useState<DailyLimits | null>(null);
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<{
    type?: TransactionType;
    status?: TransactionStatus;
  }>({});

  // Initialize manager when wallet connects
  useEffect(() => {
    if (wallet.publicKey) {
      const newManager = new TransactionManager(connection, wallet.publicKey);
      setManager(newManager);
    } else {
      setManager(null);
      setTransactions([]);
      setLimits(null);
      setStats(null);
    }
  }, [wallet.publicKey, connection]);

  // Refresh data
  const refresh = useCallback(() => {
    if (!manager) return;

    setTransactions(manager.getFilteredTransactions(filter.type, filter.status));
    setLimits(manager.getDailyLimits());
    setStats(manager.getTodayStats());
  }, [manager, filter]);

  // Refresh on mount and when filter changes
  useEffect(() => {
    refresh();

    // Auto-refresh every 5 seconds
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  // Record transaction
  const recordTransaction = useCallback(
    (
      signature: string,
      amount: number,
      recipient: string,
      type: TransactionType
    ): string => {
      if (!manager) throw new Error('Manager not initialized');

      const record = manager.recordTransaction(signature, amount, recipient, type, 'pending');
      refresh();

      // Monitor confirmation in background
      manager.monitorTransaction(signature, record.id).then(() => {
        refresh();
      });

      return record.id;
    },
    [manager, refresh]
  );

  // Update transaction status
  const updateStatus = useCallback(
    (txId: string, status: TransactionStatus, errorMessage?: string) => {
      if (!manager) return;
      manager.updateTransactionStatus(txId, status, errorMessage);
      refresh();
    },
    [manager, refresh]
  );

  // Check cross-border limit
  const checkCrossBorderLimit = useCallback(
    (amount: number) => {
      if (!manager) throw new Error('Manager not initialized');
      return manager.canSpendCrossBorder(amount);
    },
    [manager]
  );

  // Get remaining budget
  const getRemainingBudget = useCallback(() => {
    if (!manager) return 0;
    return manager.getRemainingCrossBorderBudget();
  }, [manager]);

  // Change filter
  const changeFilter = useCallback((newFilter: typeof filter) => {
    setFilter(newFilter);
  }, []);

  // Clear history
  const clearHistory = useCallback(() => {
    if (!manager) return;
    if (confirm('Are you sure you want to clear all transaction history?')) {
      manager.clearHistory();
      refresh();
    }
  }, [manager, refresh]);

  // Export history
  const exportHistory = useCallback(() => {
    if (!manager) return null;
    return manager.exportHistory();
  }, [manager]);

  return {
    transactions,
    limits,
    stats,
    loading,
    filter,
    recordTransaction,
    updateStatus,
    checkCrossBorderLimit,
    getRemainingBudget,
    changeFilter,
    clearHistory,
    exportHistory,
    refresh,
  };
}
