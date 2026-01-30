import { PublicKey, Connection, Transaction } from '@solana/web3.js';
import { createHash } from 'crypto';

export type TransactionType = 'domestic' | 'cross-border';
export type TransactionStatus = 'pending' | 'confirmed' | 'failed';

export interface PrivacyReceipt {
  txHash: string;
  network: string;
  timestamp: number;
  commitmentRoot: string;
  zkProofHash: string;
  nullifier: string;
  proofType: 'Groth16' | 'Mock';
  blockTime?: number;
}

export interface TransactionRecord {
  id: string;
  signature: string;
  amount: number;
  recipient: string;
  type: TransactionType;
  status: TransactionStatus;
  timestamp: number;
  errorMessage?: string;
  gasUsed?: number;
  // Privacy receipt data
  receipt?: PrivacyReceipt;
}

export interface DailyLimits {
  dailyCrossBorderLimit: number; // in SOL
  dailyCrossBorderSpent: number; // in SOL
  domesticCount: number;
  crossBorderCount: number;
  lastReset: number; // Unix timestamp
}

/**
 * Transaction history manager
 * Handles local storage, real-time updates, and limit tracking
 */
export class TransactionManager {
  private connection: Connection;
  private userPublicKey: PublicKey | null;
  private storageKey: string;
  private limitsStorageKey: string;

  constructor(connection: Connection, userPublicKey?: PublicKey) {
    this.connection = connection;
    this.userPublicKey = userPublicKey || null;
    this.storageKey = userPublicKey ? `tx_history_${userPublicKey.toString()}` : 'tx_history';
    this.limitsStorageKey = userPublicKey ? `tx_limits_${userPublicKey.toString()}` : 'tx_limits';
  }

  /**
   * Set user public key (for multi-wallet support)
   */
  setUser(publicKey: PublicKey) {
    this.userPublicKey = publicKey;
    this.storageKey = `tx_history_${publicKey.toString()}`;
    this.limitsStorageKey = `tx_limits_${publicKey.toString()}`;
  }

  /**
   * Record a new transaction
   */
  recordTransaction(
    signature: string,
    amount: number,
    recipient: string,
    type: TransactionType,
    status: TransactionStatus = 'pending',
    errorMessage?: string
  ): TransactionRecord {
    const record: TransactionRecord = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      signature,
      amount,
      recipient,
      type,
      status,
      timestamp: Date.now(),
      errorMessage,
    };

    // Save to localStorage
    this.saveTransaction(record);

    // Update daily limits if confirmed cross-border
    if (status === 'confirmed' && type === 'cross-border') {
      this.updateDailyLimits(amount);
    }

    return record;
  }

  /**
   * Get all transactions for current user
   */
  getTransactions(): TransactionRecord[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(this.storageKey);
    return stored ? JSON.parse(stored) : [];
  }

  /**
   * Get transactions filtered by type and status
   */
  getFilteredTransactions(type?: TransactionType, status?: TransactionStatus): TransactionRecord[] {
    let txs = this.getTransactions();

    if (type) {
      txs = txs.filter((t) => t.type === type);
    }

    if (status) {
      txs = txs.filter((t) => t.status === status);
    }

    return txs.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Update transaction status
   */
  updateTransactionStatus(
    txId: string,
    status: TransactionStatus,
    errorMessage?: string,
    signature?: string
  ): void {
    const txs = this.getTransactions();
    const tx = txs.find((t) => t.id === txId);

    if (tx) {
      tx.status = status;
      if (errorMessage) tx.errorMessage = errorMessage;
      if (signature) tx.signature = signature;

      // Update daily limits if status changed to confirmed
      if (status === 'confirmed' && tx.type === 'cross-border') {
        this.updateDailyLimits(tx.amount);
      }

      this.saveTransaction(tx);
    }
  }

  /**
   * Update transaction status by signature (fallback if txId is unknown)
   */
  updateTransactionStatusBySignature(
    signature: string,
    status: TransactionStatus,
    errorMessage?: string
  ): void {
    const txs = this.getTransactions();
    const tx = txs.find((t) => t.signature === signature);

    if (tx) {
      tx.status = status;
      if (errorMessage) tx.errorMessage = errorMessage;

      if (status === 'confirmed' && tx.type === 'cross-border') {
        this.updateDailyLimits(tx.amount);
      }

      this.saveTransaction(tx);
    }
  }

  /**
   * Attach privacy receipt to transaction
   */
  attachReceipt(txId: string, receipt: PrivacyReceipt): void {
    const txs = this.getTransactions();
    const tx = txs.find((t) => t.id === txId);

    if (tx) {
      tx.receipt = receipt;
      this.saveTransaction(tx);
    }
  }

  /**
   * Generate privacy receipt from transaction data
   */
  static createReceipt(
    txHash: string,
    commitmentRoot: string,
    proofBytes: Uint8Array | Buffer,
    nullifier: string,
    network: string = 'devnet',
    proofType: 'Groth16' | 'Mock' = 'Groth16',
    blockTime?: number
  ): PrivacyReceipt {
    // Hash the proof bytes to create a proof hash
    const proofArray = proofBytes instanceof Buffer ? proofBytes : Buffer.from(proofBytes);
    const zkProofHash = createHash('sha256').update(proofArray).digest('hex');

    return {
      txHash,
      network,
      timestamp: Date.now(),
      commitmentRoot,
      zkProofHash,
      nullifier,
      proofType,
      blockTime,
    };
  }

  /**
   * Get current daily limits
   */
  getDailyLimits(): DailyLimits {
    if (typeof window === 'undefined') {
      return {
        dailyCrossBorderLimit: 10,
        dailyCrossBorderSpent: 0,
        domesticCount: 0,
        crossBorderCount: 0,
        lastReset: Date.now(),
      };
    }

    const stored = localStorage.getItem(this.limitsStorageKey);
    const now = Date.now();
    const secondsPerDay = 86_400_000; // 24 hours in milliseconds

    if (!stored) {
      return {
        dailyCrossBorderLimit: 10,
        dailyCrossBorderSpent: 0,
        domesticCount: 0,
        crossBorderCount: 0,
        lastReset: now,
      };
    }

    const limits: DailyLimits = JSON.parse(stored);

    // Reset if 24 hours have passed
    if (now - limits.lastReset > secondsPerDay) {
      limits.dailyCrossBorderSpent = 0;
      limits.domesticCount = 0;
      limits.crossBorderCount = 0;
      limits.lastReset = now;
      localStorage.setItem(this.limitsStorageKey, JSON.stringify(limits));
    }

    return limits;
  }

  /**
   * Check if cross-border transaction is allowed
   */
  canSpendCrossBorder(amount: number): { allowed: boolean; reason?: string } {
    const limits = this.getDailyLimits();

    if (limits.dailyCrossBorderSpent + amount > limits.dailyCrossBorderLimit) {
      const remaining = limits.dailyCrossBorderLimit - limits.dailyCrossBorderSpent;
      return {
        allowed: false,
        reason: `Daily cross-border limit exceeded. Remaining: ${remaining.toFixed(2)} SOL / ${
          limits.dailyCrossBorderLimit
        } SOL`,
      };
    }

    return { allowed: true };
  }

  /**
   * Get remaining cross-border budget for today
   */
  getRemainingCrossBorderBudget(): number {
    const limits = this.getDailyLimits();
    return Math.max(0, limits.dailyCrossBorderLimit - limits.dailyCrossBorderSpent);
  }

  /**
   * Get statistics for today
   */
  getTodayStats(): {
    totalTransactions: number;
    confirmedTransactions: number;
    failedTransactions: number;
    totalSpent: number;
    domesticCount: number;
    crossBorderCount: number;
  } {
    const txs = this.getTransactions();
    const now = Date.now();
    const secondsPerDay = 86_400_000;
    const todayTxs = txs.filter((t) => now - t.timestamp < secondsPerDay);

    return {
      totalTransactions: todayTxs.length,
      confirmedTransactions: todayTxs.filter((t) => t.status === 'confirmed').length,
      failedTransactions: todayTxs.filter((t) => t.status === 'failed').length,
      totalSpent: todayTxs
        .filter((t) => t.status === 'confirmed')
        .reduce((sum, t) => sum + t.amount, 0),
      domesticCount: todayTxs.filter((t) => t.type === 'domestic').length,
      crossBorderCount: todayTxs.filter((t) => t.type === 'cross-border').length,
    };
  }

  /**
   * Verify transaction on-chain
   */
  async verifyTransaction(signature: string): Promise<boolean> {
    try {
      const statuses = await this.connection.getSignatureStatuses([signature], {
        searchTransactionHistory: true,
      });
        const status = statuses.value[0];
      
      if (!status) {
        // Fallback: check if transaction exists on-chain
        const tx = await this.connection.getTransaction(signature, {
          maxSupportedTransactionVersion: 0,
          commitment: 'confirmed',
        });
        return Boolean(tx);
      }

        const isConfirmed =
          status.confirmationStatus === 'processed' ||
          status.confirmationStatus === 'confirmed' ||
          status.confirmationStatus === 'finalized' ||
          (status.confirmationStatus === null && status.confirmations === null);

        return isConfirmed && !status.err;
    } catch (error) {
      console.error('Error verifying transaction:', error);
      return false;
    }
  }

  /**
   * Monitor transaction confirmation
   */
  async monitorTransaction(
    signature: string,
    txId: string,
    maxRetries = 60,
    retryInterval = 1000
  ): Promise<boolean> {
    let retries = 0;

    while (retries < maxRetries) {
      try {
        const statuses = await this.connection.getSignatureStatuses([signature], {
          searchTransactionHistory: true,
        });
        const status = statuses.value[0];

        if (status?.err) {
          this.updateTransactionStatus(txId, 'failed', JSON.stringify(status.err));
          this.updateTransactionStatusBySignature(signature, 'failed', JSON.stringify(status.err));
          return false;
        }

        if (!status) {
          const tx = await this.connection.getTransaction(signature, {
            maxSupportedTransactionVersion: 0,
            commitment: 'confirmed',
          });
          if (tx) {
            this.updateTransactionStatus(txId, 'confirmed');
            this.updateTransactionStatusBySignature(signature, 'confirmed');
            return true;
          }
        }

        const isConfirmed =
          status?.confirmationStatus === 'processed' ||
          status?.confirmationStatus === 'confirmed' ||
          status?.confirmationStatus === 'finalized' ||
          (status?.confirmationStatus === null && status?.confirmations === null);

        if (isConfirmed) {
          this.updateTransactionStatus(txId, 'confirmed');
          this.updateTransactionStatusBySignature(signature, 'confirmed');
          return true;
        }
      } catch (error) {
        console.error('Error monitoring transaction:', error);
      }

      retries++;
      await new Promise((resolve) => setTimeout(resolve, retryInterval));
    }

    // Do not mark as failed on timeout; transaction may still confirm later
    return false;
  }

  /**
   * Clear all transaction history (use with caution)
   */
  clearHistory(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.storageKey);
      localStorage.removeItem(this.limitsStorageKey);
    }
  }

  /**
   * Export transaction history as JSON
   */
  exportHistory(): string {
    const data = {
      transactions: this.getTransactions(),
      limits: this.getDailyLimits(),
      exportedAt: new Date().toISOString(),
      user: this.userPublicKey?.toString(),
    };
    return JSON.stringify(data, null, 2);
  }

  // Private methods

  private saveTransaction(record: TransactionRecord): void {
    if (typeof window === 'undefined') return;

    const existing = this.getTransactions();
    const index = existing.findIndex((t) => t.id === record.id);

    if (index >= 0) {
      existing[index] = record;
    } else {
      existing.push(record);
    }

    // Keep only last 100 transactions
    if (existing.length > 100) {
      existing.shift();
    }

    localStorage.setItem(this.storageKey, JSON.stringify(existing));
  }

  private updateDailyLimits(crossBorderAmount: number): void {
    if (typeof window === 'undefined') return;

    const limits = this.getDailyLimits();
    limits.dailyCrossBorderSpent += crossBorderAmount;
    limits.crossBorderCount += 1;
    limits.lastReset = Date.now();

    localStorage.setItem(this.limitsStorageKey, JSON.stringify(limits));
  }
}

/**
 * Batch verify multiple transactions
 */
export async function batchVerifyTransactions(
  connection: Connection,
  signatures: string[]
): Promise<Map<string, boolean>> {
  const results = new Map<string, boolean>();

  // Process in batches of 10
  for (let i = 0; i < signatures.length; i += 10) {
    const batch = signatures.slice(i, i + 10);
    const manager = new TransactionManager(connection);

    await Promise.all(
      batch.map(async (sig) => {
        const isConfirmed = await manager.verifyTransaction(sig);
        results.set(sig, isConfirmed);
      })
    );
  }

  return results;
}
