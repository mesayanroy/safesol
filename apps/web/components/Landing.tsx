'use client';

import { FC } from 'react';
import { PhantomSetupGuide } from './PhantomSetupGuide';

export const LandingHero: FC = () => (
  <div className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100 dark:from-stone-950 dark:to-stone-900 flex items-center justify-center px-4">
    <div className="max-w-4xl mx-auto text-center space-y-8">
      {/* Logo/Brand */}
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500 text-white text-2xl font-bold">
        🔒
      </div>

      {/* Headline */}
      <h1 className="text-5xl md:text-6xl font-bold text-stone-900 dark:text-stone-50 leading-tight">
        Private Payments
        <br />
        on Solana
      </h1>

      {/* Subheading */}
      <p className="text-xl text-stone-600 dark:text-stone-400 max-w-2xl mx-auto">
        Zero-knowledge proofs prove you can afford your payment without revealing the amount. Only
        cryptographic commitments reach the blockchain.
      </p>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
        <a
          href="#app"
          className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
        >
          Create Private Payment
        </a>
        <a
          href="#how-it-works"
          className="px-8 py-3 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-50 font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
        >
          Learn How It Works
        </a>
      </div>

      {/* Trust Indicators */}
      <div className="grid grid-cols-3 gap-4 pt-12 max-w-md mx-auto">
        <div className="text-center">
          <p className="text-3xl font-bold text-stone-900 dark:text-stone-50">100%</p>
          <p className="text-sm text-stone-600 dark:text-stone-400">Privacy</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-stone-900 dark:text-stone-50">On-Chain</p>
          <p className="text-sm text-stone-600 dark:text-stone-400">Verified</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-stone-900 dark:text-stone-50">ZK</p>
          <p className="text-sm text-stone-600 dark:text-stone-400">Native</p>
        </div>
      </div>
    </div>
  </div>
);

export const HowItWorks: FC = () => (
  <div
    id="how-it-works"
    className="py-24 bg-white dark:bg-stone-950 border-y border-stone-200 dark:border-stone-800"
  >
    <div className="max-w-5xl mx-auto px-4">
      <h2 className="text-4xl font-bold text-stone-900 dark:text-stone-50 text-center mb-4">
        How It Works
      </h2>
      <p className="text-center text-stone-600 dark:text-stone-400 mb-16 max-w-2xl mx-auto">
        Your payment stays private from start to finish. Validators verify cryptographic proofs, not
        transaction details.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Step 1 */}
        <div className="space-y-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500 text-white font-bold text-lg">
            1
          </div>
          <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
            Off-Chain Proof
          </h3>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Your wallet generates a ZK proof that proves you can afford the payment—without
            revealing the amount.
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-500 italic">
            Amount never leaves your device
          </p>
        </div>

        {/* Step 2 */}
        <div className="space-y-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500 text-white font-bold text-lg">
            2
          </div>
          <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
            On-Chain Verification
          </h3>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Solana validators verify your cryptographic proof and prevent double-spending via
            nullifiers.
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-500 italic">
            Proof is verified, then discarded
          </p>
        </div>

        {/* Step 3 */}
        <div className="space-y-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500 text-white font-bold text-lg">
            3
          </div>
          <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
            Private on Explorer
          </h3>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            The blockchain shows only the transaction hash and Merkle root. Amount and recipient
            remain encrypted.
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-500 italic">
            Only you can see details
          </p>
        </div>
      </div>

      {/* Setup Guide */}
      <PhantomSetupGuide />
    </div>
  </div>
);
