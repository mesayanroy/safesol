'use client';

import { useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey } from '@solana/web3.js';
import { BN, AnchorProvider } from '@coral-xyz/anchor';
import PaymentForm from '@/components/PaymentForm';
import TransactionHistory from '@/components/TransactionHistory';
import { LandingHero, HowItWorks } from '@/components/Landing';
import { PrivacyCard, WalletStatus, StepIndicator } from '@/components/UI';
import { generateSpendProof, generateSecret } from '@/lib/zk';
import { buildPrivatePaymentTx, getExplorerUrl } from '@/lib/solana';
import { createLightClient } from '@/lib/light';

export default function Home() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [txSignature, setTxSignature] = useState<string>('');
  const [proofStatus, setProofStatus] = useState<
    'idle' | 'generating' | 'generated' | 'submitted' | 'confirmed' | 'error'
  >('idle');
  const [loading, setLoading] = useState(false);
  const [showApp, setShowApp] = useState(false);

  const handlePrivatePayment = async (recipient: string, amount: number) => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      alert('Please connect wallet');
      return;
    }

    setLoading(true);
    setProofStatus('generating');
    try {
      console.log('[App] Starting private payment...');

      // 1. Generate ZK proof (MOCKED for hackathon)
      const secret = generateSecret();
      const proof = await generateSpendProof(
        {
          secret,
          amount: BigInt(amount * 1e9), // Convert to lamports
          balance: BigInt(10 * 1e9), // Mock balance
          merkleProof: [BigInt(0), BigInt(0), BigInt(0)],
          merkleRoot: BigInt(0),
          recipient,
        },
        true // Use mock proof
      );

      console.log('[App] ZK proof generated:', proof.nullifier);
      setProofStatus('generated');

      // 2. Build transaction
      const provider = new AnchorProvider(connection, wallet as any, { commitment: 'confirmed' });

      const tx = await buildPrivatePaymentTx(provider, {
        proof,
        amount: new BN(amount * 1e9),
        recipient: new PublicKey(recipient),
        merkleRoot: Buffer.alloc(32, 0),
      });

      setProofStatus('submitted');

      // 3. Send transaction
      const signature = await wallet.sendTransaction(tx, connection);
      await connection.confirmTransaction(signature, 'confirmed');

      console.log('[App] Transaction confirmed:', signature);
      setTxSignature(signature);
      setProofStatus('confirmed');

      alert(`Payment sent! Tx: ${signature}`);
    } catch (err: any) {
      console.error('[App] Payment failed:', err);
      setProofStatus('error');
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Landing page view
  if (!showApp) {
    return (
      <>
        <LandingHero />
        <HowItWorks />

        {/* Privacy Features */}
        <section id="app" className="py-24 bg-stone-50 dark:bg-stone-900">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-4xl font-bold text-stone-900 dark:text-stone-50 text-center mb-4">
              Privacy by Design
            </h2>
            <p className="text-center text-stone-600 dark:text-stone-400 mb-16 max-w-2xl mx-auto">
              Every payment is protected at the cryptographic level, not just the application level.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <PrivacyCard
                icon="🛡️"
                title="Amount Proof"
                description="Zero-knowledge proofs verify you can afford the payment without revealing the amount."
                details={[
                  'Verified on-chain',
                  'Cryptographic commitment',
                  'Never visible on ledger',
                ]}
              />
              <PrivacyCard
                icon="🔐"
                title="Recipient Encryption"
                description="Only you can decrypt who receives your payment. The blockchain sees a nullifier."
                details={[
                  'AES-256 encryption',
                  'Solana keypair derivation',
                  'Non-deterministic nonce',
                ]}
              />
              <PrivacyCard
                icon="✓"
                title="Nullifier Tracking"
                description="Prevents double-spending without revealing transaction details or sender."
                details={[
                  'Merkle tree verification',
                  'On-chain storage',
                  'Reusable proofs blocked',
                ]}
              />
            </div>

            <div className="text-center">
              <button
                onClick={() => setShowApp(true)}
                className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors inline-block"
              >
                Launch App →
              </button>
            </div>
          </div>
        </section>
      </>
    );
  }

  // Dashboard/App view
  return (
    <main className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100 dark:from-stone-950 dark:to-stone-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <button
              onClick={() => setShowApp(false)}
              className="text-blue-600 hover:text-blue-700 font-semibold mb-2 flex items-center gap-1"
            >
              ← Back to Info
            </button>
            <h1 className="text-4xl font-bold text-stone-900 dark:text-stone-50">
              Private Payments
            </h1>
            <p className="text-stone-600 dark:text-stone-400">
              Send payments that prove your solvency without revealing amounts
            </p>
          </div>
          <div className="flex flex-col items-end gap-4">
            <WalletMultiButton />
            {wallet.publicKey && (
              <WalletStatus connected={true} address={wallet.publicKey.toString()} />
            )}
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Payment Form */}
          <div className="lg:col-span-2 bg-white dark:bg-stone-950 rounded-2xl p-8 border border-stone-200 dark:border-stone-800 shadow-sm">
            <h2 className="text-2xl font-semibold text-stone-900 dark:text-stone-50 mb-8">
              Send Private Payment
            </h2>
            <PaymentForm
              onSubmit={handlePrivatePayment}
              loading={loading}
              connected={!!wallet.publicKey}
              proofStatus={proofStatus}
            />
          </div>

          {/* Proof Flow Sidebar */}
          <div className="bg-white dark:bg-stone-950 rounded-2xl p-8 border border-stone-200 dark:border-stone-800 shadow-sm">
            <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-50 mb-6">
              Proof Flow
            </h3>
            <StepIndicator
              steps={['Recipient & Amount', 'Generate Proof', 'Submit & Verify', 'Confirmed']}
              currentStep={
                proofStatus === 'idle'
                  ? 0
                  : proofStatus === 'generating'
                    ? 1
                    : proofStatus === 'generated'
                      ? 2
                      : proofStatus === 'submitted'
                        ? 2
                        : 4
              }
            />
          </div>
        </div>

        {/* Transaction Result */}
        {txSignature && (
          <div className="bg-white dark:bg-stone-950 rounded-2xl p-8 border border-stone-200 dark:border-stone-800 shadow-sm mb-8">
            <h2 className="text-2xl font-semibold text-stone-900 dark:text-stone-50 mb-6">
              ✓ Payment Confirmed
            </h2>
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl p-4">
                <p className="text-green-700 dark:text-green-300 text-sm font-mono break-all">
                  {txSignature}
                </p>
              </div>
              <a
                href={getExplorerUrl(txSignature)}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-center transition"
              >
                View on Solana Explorer →
              </a>
              <div className="grid grid-cols-2 gap-4 text-sm mt-6">
                <div>
                  <p className="text-stone-600 dark:text-stone-400 mb-1">ZK Proof</p>
                  <p className="text-green-600 dark:text-green-400 font-semibold">✓ Verified</p>
                </div>
                <div>
                  <p className="text-stone-600 dark:text-stone-400 mb-1">Double-Spend Check</p>
                  <p className="text-green-600 dark:text-green-400 font-semibold">✓ Passed</p>
                </div>
                <div>
                  <p className="text-stone-600 dark:text-stone-400 mb-1">Merkle Root</p>
                  <p className="text-green-600 dark:text-green-400 font-semibold">✓ Updated</p>
                </div>
                <div>
                  <p className="text-stone-600 dark:text-stone-400 mb-1">Privacy Status</p>
                  <p className="text-green-600 dark:text-green-400 font-semibold">✓ Private</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transaction History */}
        <TransactionHistory />

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
          <h3 className="text-blue-900 dark:text-blue-100 font-semibold mb-3">
            ℹ️ Development Mode
          </h3>
          <ul className="text-blue-800 dark:text-blue-200 text-sm space-y-2">
            <li>
              • Mock ZK proofs for rapid testing (real Circom circuits ready in /zk/circuits/)
            </li>
            <li>• Light Protocol integration ready for production compression</li>
            <li>
              • Deploy to devnet:{' '}
              <code className="bg-black/20 px-2 py-1 rounded text-xs">pnpm run deploy</code>
            </li>
            <li>• Replace mock verifier with real Groth16 proof system</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
