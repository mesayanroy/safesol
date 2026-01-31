'use client';

import { FC } from 'react';
import { PhantomSetupGuide } from './PhantomSetupGuide';
import { EncryptedText } from '@/components/ui/encrypted-text';
import { Vortex } from '@/components/ui/vortex';

export const LandingHero: FC = () => (
  <div className="min-h-screen bg-gradient-to-b from-stone-950 via-stone-950 to-stone-900 flex items-center justify-center px-4 relative overflow-hidden">
    {/* Vortex Background */}
    <div className="absolute inset-0 w-full h-full opacity-60">
      <Vortex
        backgroundColor="transparent"
        className="w-full h-full"
        containerClassName="w-full h-full"
        particleCount={500}
        baseHue={210}
        rangeHue={60}
        baseSpeed={0.2}
        rangeSpeed={1}
        baseRadius={0.5}
        rangeRadius={2}
        rangeY={100}
      />
    </div>

    {/* Content */}
    <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
      {/* Logo/Brand */}
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white text-2xl font-bold shadow-lg shadow-blue-500/30">
        🔒
      </div>

      {/* Headline */}
      <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight">
        Private Payments
        <br />
        on Solana
      </h1>

      {/* Subheading */}
      <p className="text-lg text-stone-400 max-w-2xl mx-auto">
        <EncryptedText
          text="Zero-knowledge proofs prove you can afford your payment without revealing the amount. Only cryptographic commitments reach the blockchain."
          revealDelayMs={30}
          flipDelayMs={40}
          className="text-lg text-stone-400"
        />
      </p>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
        <a
          href="#app"
          className="px-8 py-3 rounded-xl border-2 border-white text-white font-semibold tracking-wide hover:border-blue-300 hover:shadow-lg hover:shadow-white/20 transition-all duration-500 group"
        >
          <span className="relative inline-block">
            Create Private Payment
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-white to-blue-300 group-hover:w-full transition-all duration-500"></span>
          </span>
        </a>
        <a
          href="#how-it-works"
          className="px-8 py-3 rounded-xl border border-stone-700 text-white font-semibold hover:bg-stone-900 transition-colors"
        >
          Learn How It Works
        </a>
      </div>

      {/* Trust Indicators */}
      <div className="grid grid-cols-3 gap-4 pt-12 max-w-md mx-auto">
        <div className="text-center">
          <p className="text-3xl font-bold text-white">100%</p>
          <p className="text-sm text-white">Privacy</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-white">On-Chain</p>
          <p className="text-sm text-white">Verified</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-white">ZK</p>
          <p className="text-sm text-white">Native</p>
        </div>
      </div>
    </div>
  </div>
);

export const HowItWorks: FC = () => (
  <div
    id="how-it-works"
    className="py-24 bg-stone-950 border-y border-stone-800"
  >
    <div className="max-w-5xl mx-auto px-4">
      <h2 className="text-4xl font-bold text-stone-900 dark:text-stone-50 text-center mb-4">
        How It Works
      </h2>
      <p className="text-center text-stone-400 mb-16 max-w-2xl mx-auto">
        Your payment stays private from start to finish. Validators verify cryptographic proofs, not
        transaction details.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Step 1 */}
        <div className="space-y-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500 text-white font-bold text-lg">
            1
          </div>
          <h3 className="text-lg font-semibold text-stone-50">
            Off-Chain Proof
          </h3>
          <p className="text-sm text-stone-400">
            Your wallet generates a ZK proof that proves you can afford the payment—without
            revealing the amount.
          </p>
          <p className="text-xs text-stone-500 italic">
            Amount never leaves your device
          </p>
        </div>

        {/* Step 2 */}
        <div className="space-y-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500 text-white font-bold text-lg">
            2
          </div>
          <h3 className="text-lg font-semibold text-stone-50">
            On-Chain Verification
          </h3>
          <p className="text-sm text-stone-400">
            Solana validators verify your cryptographic proof and prevent double-spending via
            nullifiers.
          </p>
          <p className="text-xs text-stone-500 italic">
            Proof is verified, then discarded
          </p>
        </div>

        {/* Step 3 */}
        <div className="space-y-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500 text-white font-bold text-lg">
            3
          </div>
          <h3 className="text-lg font-semibold text-stone-50">
            Private on Explorer
          </h3>
          <p className="text-sm text-stone-400">
            The blockchain shows only the transaction hash and Merkle root. Amount and recipient
            remain encrypted.
          </p>
          <p className="text-xs text-stone-500 italic">
            Only you can see details
          </p>
        </div>
      </div>

      {/* Setup Guide */}
      <PhantomSetupGuide />
    </div>
  </div>
);
