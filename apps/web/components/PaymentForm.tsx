'use client';

import { FC, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { InfoIcon, ProofStatusBadge } from './UI';

interface PaymentFormProps {
  onSubmit: (recipient: string, amount: number) => Promise<void>;
  loading: boolean;
  connected: boolean;
  proofStatus?: 'idle' | 'generating' | 'generated' | 'submitted' | 'confirmed' | 'error';
}

const PaymentForm: FC<PaymentFormProps> = ({
  onSubmit,
  loading,
  connected,
  proofStatus = 'idle',
}) => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [errors, setErrors] = useState<{ recipient?: string; amount?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};

    // Validate recipient
    try {
      new PublicKey(recipient);
    } catch {
      newErrors.recipient = 'Invalid Solana address';
    }

    // Validate amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      newErrors.amount = 'Enter a valid amount';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    await onSubmit(recipient, amountNum);
  };

  const isDisabled = loading || !connected;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Recipient Input */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-stone-900 dark:text-stone-50">
            Recipient Address
          </label>
          <InfoIcon text="This address is encrypted in your proof and not visible on-chain" />
        </div>
        <input
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="Enter Solana address"
          className={`w-full px-4 py-3 rounded-xl border transition-colors text-stone-900 dark:text-stone-50 placeholder-stone-400 dark:placeholder-stone-600 focus:outline-none ${
            errors.recipient
              ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950'
              : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 focus:border-blue-500'
          }`}
          disabled={isDisabled}
        />
        {errors.recipient && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.recipient}</p>
        )}
      </div>

      {/* Amount Input */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-stone-900 dark:text-stone-50">
            Amount (SOL)
          </label>
          <InfoIcon text="The amount is proven cryptographically without being revealed" />
        </div>
        <input
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className={`w-full px-4 py-3 rounded-xl border transition-colors text-stone-900 dark:text-stone-50 placeholder-stone-400 dark:placeholder-stone-600 focus:outline-none ${
            errors.amount
              ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950'
              : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 focus:border-blue-500'
          }`}
          disabled={isDisabled}
        />
        {errors.amount && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.amount}</p>
        )}
      </div>

      {/* Privacy Notice */}
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl p-4 space-y-2">
        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
          🔐 Your payment is private by design
        </p>
        <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
          <li>✓ Amount never sent to blockchain</li>
          <li>✓ Recipient encrypted in your proof</li>
          <li>✓ Only cryptographic commitment is public</li>
        </ul>
      </div>

      {/* Proof Status */}
      {proofStatus !== 'idle' && (
        <div className="flex items-center justify-between p-3 bg-stone-100 dark:bg-stone-900 rounded-xl">
          <span className="text-sm text-stone-600 dark:text-stone-400">ZK Proof Status</span>
          <ProofStatusBadge status={proofStatus} />
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isDisabled || Object.keys(errors).length > 0}
        className={`w-full py-3 rounded-xl font-semibold transition-all ${
          isDisabled || Object.keys(errors).length > 0
            ? 'bg-stone-200 dark:bg-stone-800 text-stone-500 dark:text-stone-500 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg active:scale-95'
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Generating proof...
          </span>
        ) : !connected ? (
          'Connect Wallet to Continue'
        ) : (
          'Generate Proof & Send Payment'
        )}
      </button>

      {!connected && (
        <p className="text-xs text-stone-500 dark:text-stone-500 text-center">
          Connect your Solana wallet above to proceed with your private payment.
        </p>
      )}
    </form>
  );
};

export default PaymentForm;
