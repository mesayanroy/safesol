'use client';

import { PrivacyReceipt } from '@/lib/transactions';
import { getExplorerUrl } from '@/lib/solana';

interface PrivacyReceiptModalProps {
  receipt: PrivacyReceipt;
  onClose: () => void;
}

export function PrivacyReceiptModal({ receipt, onClose }: PrivacyReceiptModalProps) {
  const formatHash = (hash: string, length: number = 16) => {
    if (hash.length <= length) return hash;
    return `${hash.slice(0, length / 2)}...${hash.slice(-length / 2)}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    });
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Simple feedback - could enhance with toast notification
      const button = document.activeElement as HTMLButtonElement;
      const originalText = button.textContent;
      button.textContent = 'Copied!';
      setTimeout(() => {
        button.textContent = originalText;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 rounded-t-lg">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Privacy Receipt</h2>
              <p className="text-sm opacity-90 mt-1">Zero-Knowledge Payment Verification</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
              aria-label="Close"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* What This Receipt Proves */}
          <div className="bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
              What This Receipt Proves
            </h3>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li className="flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>This transaction was executed on Solana {receipt.network}</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>The payment amount is cryptographically hidden</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>The sender proved sufficient balance via zero-knowledge proof</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>This receipt can be used for selective disclosure auditing</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Double-spending is prevented via unique nullifier</span>
              </li>
            </ul>
          </div>

          {/* Transaction Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              Transaction Details
            </h3>

            {/* Transaction Hash */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Solana Transaction Hash
              </label>
              <div className="flex items-center space-x-2">
                <code className="flex-1 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded text-sm font-mono break-all">
                  {receipt.txHash}
                </code>
                <button
                  onClick={() => copyToClipboard(receipt.txHash, 'Transaction Hash')}
                  className="px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors text-sm font-medium"
                >
                  Copy
                </button>
                <a
                  href={getExplorerUrl(receipt.txHash, receipt.network as 'devnet' | 'mainnet-beta')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200 rounded hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors text-sm font-medium"
                >
                  Explorer ↗
                </a>
              </div>
            </div>

            {/* Network */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Network
                </label>
                <div className="bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white uppercase">
                    {receipt.network}
                  </span>
                </div>
              </div>

              {/* Timestamp */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Timestamp
                </label>
                <div className="bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded">
                  <span className="text-sm text-gray-900 dark:text-white">
                    {formatDate(receipt.timestamp)}
                  </span>
                </div>
              </div>
            </div>

            {/* Block Time (if available) */}
            {receipt.blockTime && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Block Time (On-Chain)
                </label>
                <div className="bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded">
                  <span className="text-sm text-gray-900 dark:text-white">
                    {formatDate(receipt.blockTime * 1000)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Cryptographic Commitments */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              Cryptographic Commitments
            </h3>

            {/* Commitment Root */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Merkle Commitment Root
              </label>
              <div className="flex items-center space-x-2">
                <code className="flex-1 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded text-sm font-mono break-all">
                  {receipt.commitmentRoot}
                </code>
                <button
                  onClick={() => copyToClipboard(receipt.commitmentRoot, 'Commitment Root')}
                  className="px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors text-sm font-medium"
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                The Merkle root proves membership in the anonymity set
              </p>
            </div>

            {/* ZK Proof Hash */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Zero-Knowledge Proof Hash ({receipt.proofType})
              </label>
              <div className="flex items-center space-x-2">
                <code className="flex-1 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded text-sm font-mono break-all">
                  {receipt.zkProofHash}
                </code>
                <button
                  onClick={() => copyToClipboard(receipt.zkProofHash, 'ZK Proof Hash')}
                  className="px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors text-sm font-medium"
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                SHA-256 hash of the {receipt.proofType} proof bytes
              </p>
            </div>

            {/* Nullifier */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Nullifier Hash
              </label>
              <div className="flex items-center space-x-2">
                <code className="flex-1 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded text-sm font-mono break-all">
                  {receipt.nullifier}
                </code>
                <button
                  onClick={() => copyToClipboard(receipt.nullifier, 'Nullifier')}
                  className="px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors text-sm font-medium"
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Unique identifier prevents double-spending
              </p>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <svg
                className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                <p className="font-semibold mb-1">Privacy Notice</p>
                <p>
                  This receipt contains cryptographic commitments, not financial details. The actual
                  payment amount and sender identity remain private. This document can be used for
                  selective disclosure to authorized auditors who possess the proper viewing keys.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 px-6 py-4 rounded-b-lg border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Generated: {formatDate(Date.now())}
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
