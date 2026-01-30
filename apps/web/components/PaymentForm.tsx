'use client';

import { FC, useState, useEffect } from 'react';
import { PublicKey } from '@solana/web3.js';
import { InfoIcon, ProofStatusBadge } from './UI';

interface PaymentFormProps {
  onSubmit: (
    recipient: string,
    amount: number,
    paymentType: 'domestic' | 'cross-border'
  ) => Promise<void>;
  loading: boolean;
  connected: boolean;
  proofStatus?: 'idle' | 'generating' | 'generated' | 'submitted' | 'confirmed' | 'error';
  crossBorderLimitRemaining?: number;
  onPaymentTypeChange?: (type: 'domestic' | 'cross-border') => void;
}

const PaymentForm: FC<PaymentFormProps> = ({
  onSubmit,
  loading,
  connected,
  proofStatus = 'idle',
  crossBorderLimitRemaining,
  onPaymentTypeChange,
}) => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentType, setPaymentType] = useState<'domestic' | 'cross-border'>('domestic');
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

    // Check cross-border limit
    if (paymentType === 'cross-border' && crossBorderLimitRemaining !== undefined) {
      if (amountNum > crossBorderLimitRemaining) {
        newErrors.amount = `Cross-border limit exceeded. Remaining: ${crossBorderLimitRemaining.toFixed(
          2
        )} SOL`;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    await onSubmit(recipient, amountNum, paymentType);
  };

  // Notify parent of payment type change
  useEffect(() => {
    onPaymentTypeChange?.(paymentType);
  }, [paymentType, onPaymentTypeChange]);

  const isDisabled = loading || !connected;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      {/* Payment Type Selection */}
      <div>
        <label className="block text-sm font-semibold text-stone-900 dark:text-stone-50 mb-3">
          Payment Type
        </label>
        <div className="grid grid-cols-2 gap-3">
          {(['domestic', 'cross-border'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setPaymentType(type)}
              disabled={isDisabled}
              className={`p-4 rounded-xl border-2 transition-all font-semibold text-sm sm:text-base ${
                paymentType === type
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                  : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-50 hover:border-blue-300 dark:hover:border-blue-700'
              } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className="text-lg mb-1 block">{type === 'domestic' ? '🏠' : '🌍'}</span>
              {type === 'domestic' ? 'Domestic' : 'Cross-Border'}
            </button>
          ))}
        </div>

        {/* Cross-Border Limit Warning */}
        {paymentType === 'cross-border' && crossBorderLimitRemaining !== undefined && (
          <div
            className={`mt-3 p-3 rounded-lg text-xs sm:text-sm ${
              crossBorderLimitRemaining > 0
                ? 'bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                : 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
            }`}
          >
            {crossBorderLimitRemaining > 0 ? (
              <>
                <span className="font-semibold">⚠️ Daily Limit:</span>{' '}
                {crossBorderLimitRemaining.toFixed(2)} SOL remaining today
              </>
            ) : (
              <>
                <span className="font-semibold">❌ Limit Exceeded:</span> Daily cross-border limit
                reached. Try again tomorrow or send a domestic payment.
              </>
            )}
          </div>
        )}
      </div>

      {/* Recipient Input */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-1">
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
          className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border transition-colors text-sm sm:text-base text-stone-900 dark:text-stone-50 placeholder-stone-400 dark:placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${
            errors.recipient
              ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950'
              : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 focus:border-blue-500'
          }`}
          disabled={isDisabled}
        />
        {errors.recipient && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-1.5">{errors.recipient}</p>
        )}
      </div>

      {/* Amount Input */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-1">
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
          className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border transition-colors text-sm sm:text-base text-stone-900 dark:text-stone-50 placeholder-stone-400 dark:placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${
            errors.amount
              ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950'
              : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 focus:border-blue-500'
          }`}
          disabled={isDisabled}
        />
        {errors.amount && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-1.5">{errors.amount}</p>
        )}
      </div>

      {/* Privacy Notice */}
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl p-3 sm:p-4 space-y-2">
        <p className="text-xs sm:text-sm font-medium text-blue-900 dark:text-blue-100">
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 p-3 bg-stone-100 dark:bg-stone-900 rounded-xl">
          <span className="text-xs sm:text-sm text-stone-600 dark:text-stone-400">
            ZK Proof Status
          </span>
          <ProofStatusBadge status={proofStatus} />
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isDisabled || Object.keys(errors).length > 0}
        className={`w-full py-3 sm:py-3.5 rounded-xl font-semibold transition-all text-sm sm:text-base ${
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
            <span className="hidden sm:inline">Generating proof...</span>
            <span className="sm:hidden">Generating...</span>
          </span>
        ) : !connected ? (
          <>
            <span className="hidden sm:inline">Connect Wallet to Continue</span>
            <span className="sm:hidden">Connect Wallet</span>
          </>
        ) : (
          <>
            <span className="hidden sm:inline">Generate Proof & Send Payment</span>
            <span className="sm:hidden">Send Payment</span>
          </>
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
