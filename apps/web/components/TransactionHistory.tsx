'use client';

import { FC } from 'react';

const TransactionHistory: FC = () => {
  // Mock transaction history for demo
  const mockTxs = [
    {
      signature: '4r2E5c8nQ1pV9xK2mL3aB7sT6wF4dJ9hG1yN5oP2mR8t',
      timestamp: 'Today at 2:34 PM',
      status: 'Confirmed',
      proofVerified: true,
    },
  ];

  return (
    <div className="bg-white dark:bg-stone-950 rounded-2xl p-8 border border-stone-200 dark:border-stone-800 shadow-sm">
      <h2 className="text-2xl font-semibold text-stone-900 dark:text-stone-50 mb-6">
        Recent Private Transactions
      </h2>

      <div className="space-y-3">
        {mockTxs.length > 0 ? (
          mockTxs.map((tx, idx) => (
            <div
              key={idx}
              className="bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <p className="text-stone-900 dark:text-stone-50 font-mono text-sm break-all">
                    {tx.signature}
                  </p>
                  <p className="text-stone-500 dark:text-stone-500 text-xs mt-2">{tx.timestamp}</p>
                </div>
                <div className="flex items-center gap-2">
                  {tx.proofVerified && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 rounded-full text-xs font-semibold">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {tx.status}
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-3 text-stone-600 dark:text-stone-400 text-xs flex items-center gap-1">
                <span>🔐</span>
                <span>Amount and recipient encrypted. Only you can decrypt details.</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-stone-500 dark:text-stone-500 text-sm">No transactions yet</p>
            <p className="text-stone-400 dark:text-stone-600 text-xs mt-1">
              Connect your wallet and send a private payment to see it here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;
