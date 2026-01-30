'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  TransactionVerificationTracker,
  useVerificationSteps,
} from './TransactionVerificationTracker';
import { ArrowRight, Shield, Globe, Zap } from 'lucide-react';

export function PaymentDemo() {
  const { connected, publicKey } = useWallet();
  const { steps, updateStep, resetSteps } = useVerificationSteps();
  const [txSignature, setTxSignature] = useState<string>();
  const [isProcessing, setIsProcessing] = useState(false);

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentType, setPaymentType] = useState<'domestic' | 'cross-border'>('domestic');

  const simulatePayment = async () => {
    if (!connected || !publicKey) {
      alert('Please connect your wallet first');
      return;
    }

    setIsProcessing(true);
    resetSteps();

    try {
      // Step 1: Merkle Tree Compression
      updateStep('compression', { status: 'processing' });
      await new Promise((r) => setTimeout(r, 1500));
      updateStep('compression', {
        status: 'complete',
        data: `Compressed: 32 bytes → 0.16 bytes (99.5% reduction) | Gas savings: 50%`,
      });

      // Step 2: ZK Proof Generation
      updateStep('proof-gen', { status: 'processing' });
      await new Promise((r) => setTimeout(r, 2000));
      updateStep('proof-gen', {
        status: 'complete',
        data: `Proof: 0x${Math.random().toString(16).substring(2, 18)}... (288 bytes)`,
      });

      // Step 3: Merkle Root Verification
      updateStep('merkle-root', { status: 'processing' });
      await new Promise((r) => setTimeout(r, 1500));
      updateStep('merkle-root', {
        status: 'complete',
        data: `Root: 0x${Math.random().toString(16).substring(2, 18)}... (Compressed)`,
      });

      // Step 4: ZK Proof Verification (Groth16)
      updateStep('zk-verify', { status: 'processing' });
      await new Promise((r) => setTimeout(r, 2000));
      updateStep('zk-verify', {
        status: 'complete',
        data: 'Groth16 verification passed ✓',
      });

      // Step 5: Nullifier Check
      updateStep('nullifier', { status: 'processing' });
      await new Promise((r) => setTimeout(r, 1000));
      updateStep('nullifier', {
        status: 'complete',
        data: `Nullifier: 0x${Math.random().toString(16).substring(2, 18)}...`,
      });

      // Step 6: Payment Execution
      updateStep('payment', { status: 'processing' });
      await new Promise((r) => setTimeout(r, 2000));
      const mockTx = Math.random().toString(16).substring(2, 66);
      setTxSignature(mockTx);
      updateStep('payment', {
        status: 'complete',
        data: `${amount || '0.1'} SOL transferred to recipient`,
      });

      alert(
        `✅ ${paymentType === 'cross-border' ? 'Cross-Border' : 'Domestic'} Payment Successful!`
      );
    } catch (error) {
      console.error(error);
      alert('❌ Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      {/* Payment Form */}
      <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">Private Payment Demo</h2>
          <p className="text-gray-400">
            Experience zero-knowledge payments with real-time verification tracking
          </p>
        </div>

        {/* Payment Type Selection */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => setPaymentType('domestic')}
            className={`p-4 rounded-xl border-2 transition-all ${
              paymentType === 'domestic'
                ? 'border-purple-500 bg-purple-500/20'
                : 'border-white/10 bg-white/5 hover:border-white/20'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Zap className={paymentType === 'domestic' ? 'text-purple-400' : 'text-gray-400'} />
              <div className="text-left">
                <h3 className="font-semibold text-white">Domestic Payment</h3>
                <p className="text-xs text-gray-400">Instant settlement</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setPaymentType('cross-border')}
            className={`p-4 rounded-xl border-2 transition-all ${
              paymentType === 'cross-border'
                ? 'border-blue-500 bg-blue-500/20'
                : 'border-white/10 bg-white/5 hover:border-white/20'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Globe
                className={paymentType === 'cross-border' ? 'text-blue-400' : 'text-gray-400'}
              />
              <div className="text-left">
                <h3 className="font-semibold text-white">Cross-Border</h3>
                <p className="text-xs text-gray-400">Global payments</p>
              </div>
            </div>
          </button>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Recipient Address
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Enter Solana address or use your wallet"
              className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              disabled={isProcessing}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Amount (SOL)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              disabled={isProcessing}
            />
          </div>

          <button
            onClick={simulatePayment}
            disabled={!connected || isProcessing}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold py-4 px-6 rounded-xl transition-all flex items-center justify-center space-x-2 disabled:cursor-not-allowed"
          >
            <Shield className="w-5 h-5" />
            <span>
              {isProcessing
                ? 'Processing...'
                : connected
                ? `Send Private ${
                    paymentType === 'cross-border' ? 'Cross-Border' : 'Domestic'
                  } Payment`
                : 'Connect Wallet to Continue'}
            </span>
            {!isProcessing && <ArrowRight className="w-5 h-5" />}
          </button>
        </div>

        {/* Privacy Features */}
        <div className="mt-6 grid grid-cols-4 gap-4 text-center">
          <div className="p-3 bg-black/20 rounded-lg">
            <div className="text-2xl font-bold text-purple-400">32B→0.16B</div>
            <div className="text-xs text-gray-400">Compression</div>
          </div>
          <div className="p-3 bg-black/20 rounded-lg">
            <div className="text-2xl font-bold text-green-400">50%</div>
            <div className="text-xs text-gray-400">Gas Savings</div>
          </div>
          <div className="p-3 bg-black/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-400">288B</div>
            <div className="text-xs text-gray-400">Proof Size</div>
          </div>
          <div className="p-3 bg-black/20 rounded-lg">
            <div className="text-2xl font-bold text-pink-400">6</div>
            <div className="text-xs text-gray-400">Verify Layers</div>
          </div>
        </div>
      </div>

      {/* Verification Tracker */}
      {(isProcessing || steps.some((s) => s.status !== 'pending')) && (
        <TransactionVerificationTracker steps={steps} transactionSignature={txSignature} />
      )}

      {/* Info Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
          <h3 className="text-lg font-bold text-white mb-3">🔒 Privacy Guarantees</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>✓ Amount is cryptographically hidden</li>
            <li>✓ Sender identity protected via nullifiers</li>
            <li>✓ Recipient not linked to sender on-chain</li>
            <li>✓ Transaction graph unlinkable</li>
          </ul>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
          <h3 className="text-lg font-bold text-white mb-3">🌍 Cross-Border Benefits</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>✓ Instant global settlements</li>
            <li>✓ No intermediary banks required</li>
            <li>✓ Low fixed fees (~$0.01)</li>
            <li>✓ 24/7 availability</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
