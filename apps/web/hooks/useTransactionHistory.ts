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
  PrivacyReceipt,
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

  // Reconcile status for txs that may have been marked failed/pending prematurely
  const reconcileStatuses = useCallback(async () => {
    if (!manager) return;

    const allTxs = manager.getTransactions();
    const candidates = allTxs
      .filter((t) => t.signature && (t.status === 'pending' || t.status === 'failed'))
      .slice(0, 10);

    if (candidates.length === 0) return;

    let updated = false;

    await Promise.all(
      candidates.map(async (tx) => {
        const isConfirmed = await manager.verifyTransaction(tx.signature);
        if (isConfirmed && tx.status !== 'confirmed') {
          manager.updateTransactionStatus(tx.id, 'confirmed');
          updated = true;
        }
      })
    );

    if (updated) {
      setTransactions(manager.getFilteredTransactions(filter.type, filter.status));
      setLimits(manager.getDailyLimits());
      setStats(manager.getTodayStats());
    }
  }, [manager, filter]);

  // Refresh on mount and when filter changes
  useEffect(() => {
    refresh();

    // Auto-refresh every 5 seconds
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  // Background reconciliation every 7 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      reconcileStatuses();
    }, 7000);

    return () => clearInterval(interval);
  }, [reconcileStatuses]);

  useEffect(() => {
    reconcileStatuses();
  }, [reconcileStatuses]);

  // Record transaction
  const recordTransaction = useCallback(
    (
      signature: string,
      amount: number,
      recipient: string,
      type: TransactionType,
      status: TransactionStatus = 'pending'
    ): string => {
      if (!manager) throw new Error('Manager not initialized');

      const record = manager.recordTransaction(signature, amount, recipient, type, status);
      refresh();

      // Monitor confirmation only if we already have a signature
      if (signature) {
        manager.monitorTransaction(signature, record.id).then(() => {
          refresh();
        });
      }

      return record.id;
    },
    [manager, refresh]
  );

  // Update transaction status
  const updateStatus = useCallback(
    (txId: string, status: TransactionStatus, signatureOrError?: string) => {
      if (!manager) return;

      // If status is confirmed, the third param is signature
      // If status is failed, the third param is error message
        // If status is pending, the third param could be signature (for updating pending tx with signature)
      if (status === 'confirmed') {
        manager.updateTransactionStatus(txId, status, undefined, signatureOrError);
      } else if (status === 'failed') {
        manager.updateTransactionStatus(txId, status, signatureOrError);
        } else if (status === 'pending' && signatureOrError) {
          // Update pending transaction with signature, then start monitoring
          manager.updateTransactionStatus(txId, status, undefined, signatureOrError);
          manager.monitorTransaction(signatureOrError, txId).then(() => {
            refresh();
          });
      } else {
        manager.updateTransactionStatus(txId, status);
      }

      refresh();
    },
    [manager, refresh]
  );

  const updateStatusBySignature = useCallback(
    (signature: string, status: TransactionStatus, errorMessage?: string) => {
      if (!manager) return;
      manager.updateTransactionStatusBySignature(signature, status, errorMessage);
      refresh();
    },
    [manager, refresh]
  );

  // Attach privacy receipt to transaction
  const attachReceipt = useCallback(
    (txId: string, receipt: PrivacyReceipt) => {
      if (!manager) return;
      manager.attachReceipt(txId, receipt);
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
    updateStatusBySignature,
    attachReceipt,
    checkCrossBorderLimit,
    getRemainingBudget,
    changeFilter,
    clearHistory,
    exportHistory,
    refresh,
  };
}
