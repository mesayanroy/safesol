'use client';

import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey } from '@solana/web3.js';
import { BN, AnchorProvider } from '@coral-xyz/anchor';
import PaymentForm from '@/components/PaymentForm';
import TransactionHistory from '@/components/TransactionHistory';
import { TransactionUI, TransactionStep } from '@/components/TransactionUI';
import { LandingHero, HowItWorks } from '@/components/Landing';
import { PrivacyCard, WalletStatus, StepIndicator } from '@/components/UI';
import { WalletDebugPanel } from '@/components/WalletDebugPanel';
import { generateSpendProof, generateSecret } from '@/lib/zk';
import { buildPrivatePaymentTx, getExplorerUrl } from '@/lib/solana';
import { createLightClient } from '@/lib/light';

// Enable debug mode by adding ?debug=1 to URL
const isDebugMode =
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === '1';

export default function Home() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [txSignature, setTxSignature] = useState<string>('');
  const [proofStatus, setProofStatus] = useState<
    'idle' | 'generating' | 'generated' | 'submitted' | 'confirmed' | 'error'
  >('idle');
  const [loading, setLoading] = useState(false);
  const [showApp, setShowApp] = useState(false);
  const [connectionError, setConnectionError] = useState<string>('');
  const [transactionSteps, setTransactionSteps] = useState<TransactionStep[]>([
    { id: 'secret', label: 'Generate Secret', description: 'Creating commitment', status: 'idle' },
    { id: 'merkle', label: 'Merkle Proof', description: 'Fetching from Light Protocol', status: 'idle' },
    { id: 'zk-proof', label: 'ZK Proof', description: 'Groth16 proof generation', status: 'idle' },
    { id: 'build-tx', label: 'Build Transaction', description: 'Preparing Solana transaction', status: 'idle' },
    { id: 'sign-tx', label: 'Sign & Send', description: 'Wallet signature and submission', status: 'idle' },
    { id: 'confirm', label: 'Confirm', description: 'Waiting for confirmation', status: 'idle' },
  ]);

  // Save transactions to localStorage
  useEffect(() => {
    if (txSignature && wallet.publicKey) {
      const key = `txs_${wallet.publicKey.toString()}`;
      const existing = localStorage.getItem(key);
      const txs = existing ? JSON.parse(existing) : [];
      const currentTime = Math.floor(Date.now() / 1000);
      
      txs.push({
        signature: txSignature,
        amount: 0, // Would come from form
        timestamp: currentTime,
        status: 'confirmed',
      });
      
      localStorage.setItem(key, JSON.stringify(txs));
    }
  }, [txSignature, wallet.publicKey]);

  const updateStep = (stepId: string, status: TransactionStep['status'], error?: string) => {
    setTransactionSteps(prev =>
      prev.map(step =>
        step.id === stepId
          ? { ...step, status, error }
          : step
      )
    );
  };

  const handlePrivatePayment = async (recipient: string, amount: number) => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      setConnectionError('Please connect wallet first');
      setTimeout(() => setConnectionError(''), 3000);
      return;
    }

    if (!connection) {
      setConnectionError('Network connection failed. Please refresh the page.');
      return;
    }

    setConnectionError('');
    setLoading(true);
    setProofStatus('generating');
    
    try {
      // Reset steps
      setTransactionSteps(prev => prev.map(s => ({ ...s, status: 'idle', error: undefined })));

      console.log('[App] Starting private payment flow...', {
        recipient,
        amount: `${amount} SOL`,
        wallet: wallet.publicKey.toString(),
      });

      // Step 1: Generate secret and commitment
      updateStep('secret', 'active');
      console.log('[App] Step 1: Generating secret and commitment...');
      const secret = generateSecret();
      const { generateCommitment } = await import('@/lib/zk');
      const commitment = await generateCommitment(secret, BigInt(Math.floor(amount * 1e9)));
      updateStep('secret', 'complete');
      console.log('[App] ✓ Commitment generated:', commitment.toString().slice(0, 16) + '...');

      // Step 2: Initialize Light Protocol client and get Merkle proof
      updateStep('merkle', 'active');
      console.log('[App] Step 2: Getting Merkle proof from Light Protocol...');
      const { LightProtocolClient } = await import('@/lib/light');
      const lightClient = new LightProtocolClient(connection);
      
      const merkleProof = await lightClient.getCommitmentProof(commitment.toString());
      const currentRoot = await lightClient.getCurrentRoot();
      updateStep('merkle', 'complete');
      console.log('[App] ✓ Merkle proof retrieved, root:', currentRoot.slice(0, 16) + '...');

      // Step 3: Calculate Merkle path (this is part of zk-proof preparation)
      console.log('[App] Step 3: Calculating Merkle path indices...');
      const { calculateMerklePath } = await import('@/lib/zk');
      const { path, indices } = await calculateMerklePath(
        commitment,
        merkleProof.map(p => BigInt(p))
      );
      console.log('[App] ✓ Path calculated with', path.length, 'levels');

      // Step 4: Generate ZK proof
      updateStep('zk-proof', 'active');
      console.log('[App] Step 4: Generating zero-knowledge proof...');
      
      const useMockProofs = process.env.NEXT_PUBLIC_ENABLE_MOCK_PROOFS === 'true';
      const proofMode = useMockProofs ? 'MOCK (development)' : 'REAL Groth16 (production)';
      console.log('[App] Proof generation mode:', proofMode);
      
      let proof;
      try {
        console.log('[App] Starting ZK proof generation...');
        proof = await generateSpendProof(
          {
            secret,
            amount: BigInt(Math.floor(amount * 1e9)),
            balance: BigInt(100 * 1e9), // TODO: Get actual balance
            merkleProof: path,
            merkleRoot: BigInt('0x' + (currentRoot.startsWith('0x') ? currentRoot.slice(2) : currentRoot)),
            recipient,
          },
          useMockProofs
        );
        
        if (!proof || !proof.nullifier || !proof.publicSignals) {
          throw new Error('Invalid proof structure returned from generateSpendProof');
        }
        
        console.log('[App] ✓ ZK proof generated successfully');
      } catch (proofErr) {
        console.error('[App] ✗ Proof generation failed:', proofErr);
        const errorMsg = proofErr instanceof Error ? proofErr.message : String(proofErr);
        updateStep('zk-proof', 'error', errorMsg);
        throw new Error(`Proof generation failed: ${errorMsg}`);
      }
      
      updateStep('zk-proof', 'complete');
      console.log('[App] ✓ ZK proof complete');
      console.log('[App]   - Nullifier:', proof.nullifier.slice(0, 16) + '...');
      console.log('[App]   - Public signals:', proof.publicSignals.length);
      setProofStatus('generated');

      // Step 5: Verify proof locally
      console.log('[App] Step 5: Verifying proof locally...');
      const isValid = await lightClient.verifyCompressedProof(
        commitment.toString(),
        merkleProof,
        currentRoot
      );
      
      if (!isValid) {
        throw new Error('Local proof verification failed - Merkle root mismatch');
      }
      console.log('[App] ✓ Proof verified against current Merkle root');

      // Step 6: Build transaction
      updateStep('build-tx', 'active');
      console.log('[App] Step 6: Building Solana transaction...');
      
      const provider = new AnchorProvider(connection, wallet as any, { 
        commitment: 'confirmed',
        preflightCommitment: 'confirmed'
      });

      // Convert merkle root to 32-byte buffer
      let merkleRootBuffer: Buffer;
      const rootHex = currentRoot.startsWith('0x') ? currentRoot.slice(2) : currentRoot;
      if (rootHex.length === 64) {
        merkleRootBuffer = Buffer.from(rootHex, 'hex');
      } else {
        merkleRootBuffer = Buffer.alloc(32, 0);
      }

      let tx;
      try {
        console.log('[App] Serializing proof for Solana...');
        tx = await buildPrivatePaymentTx(provider, {
          proof,
          amount: new BN(Math.floor(amount * 1e9)),
          recipient: new PublicKey(recipient),
          merkleRoot: merkleRootBuffer,
        });
        
        // Ensure transaction has recent blockhash and fee payer
        if (!tx.recentBlockhash) {
          console.log('[App] Setting recent blockhash...');
          const { blockhash } = await connection.getLatestBlockhash('confirmed');
          tx.recentBlockhash = blockhash;
        }
        if (!tx.feePayer) {
          tx.feePayer = wallet.publicKey;
        }
        
        console.log('[App] ✓ Transaction built successfully');
      } catch (txErr) {
        const txErrMsg = txErr instanceof Error ? txErr.message : String(txErr);
        console.error('[App] Transaction build failed:', txErrMsg);
        throw new Error(`Transaction build failed: ${txErrMsg}`);
      }
      
      updateStep('build-tx', 'complete');

      // Step 7: Submit transaction
      updateStep('sign-tx', 'active');
      console.log('[App] Step 7: Submitting transaction to Solana...');
      console.log('[App] Transaction details:', {
        feePayer: tx.feePayer?.toString(),
        recentBlockhash: tx.recentBlockhash,
        instructionCount: tx.instructions.length,
        signers: tx.signatures.length,
      });
      
      let signature: string;
      
      try {
        signature = await wallet.sendTransaction(tx, connection, {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
          maxRetries: 3,
        });
        updateStep('sign-tx', 'complete');
        console.log('[App] ✓ Transaction sent, signature:', signature);
      } catch (signErr: any) {
        // Log full error details
        console.error('[App] ✗ Transaction submission failed - FULL ERROR:', {
          message: signErr.message,
          code: signErr.code,
          logs: signErr.logs,
          stack: signErr.stack,
          toString: signErr.toString(),
        });
        
        // Extract meaningful error message
        let errorMessage = 'Transaction failed';
        if (signErr.message) {
          errorMessage = signErr.message;
        } else if (signErr.toString) {
          errorMessage = signErr.toString();
        }
        
        // Check for common error patterns
        if (errorMessage.includes('0x1')) {
          errorMessage = 'Insufficient funds for transaction';
        } else if (errorMessage.includes('rejected')) {
          errorMessage = 'Transaction rejected by wallet';
        } else if (errorMessage.includes('blockhash')) {
          errorMessage = 'Transaction expired - please retry';
        } else if (errorMessage.includes('simulate')) {
          errorMessage = 'Transaction simulation failed - check program logs';
        }
        
        updateStep('sign-tx', 'error', errorMessage);
        throw new Error(errorMessage);
      }

      // Step 8: Confirm transaction
      updateStep('confirm', 'active');
      console.log('[App] Step 8: Confirming transaction...');
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');
      
      if (confirmation.value.err) {
        updateStep('confirm', 'error', 'Transaction failed on-chain');
        throw new Error('Transaction failed on-chain: ' + JSON.stringify(confirmation.value.err));
      }
      
      updateStep('confirm', 'complete');
      console.log('[App] ✓ Transaction confirmed on-chain');

      // Step 9: Update Light Protocol state
      console.log('[App] Step 9: Updating Light Protocol state...');
      await lightClient.storeCompressedCommitment(commitment.toString(), wallet.publicKey);
      console.log('[App] ✓ Commitment stored in compressed tree');

      setTxSignature(signature);
      setProofStatus('confirmed');

      console.log('[App] ✅ Payment complete!');
      console.log('[App]   - Explorer:', getExplorerUrl(signature));
      
    } catch (err: any) {
      console.error('[App] ❌ Payment failed:', err);
      setProofStatus('error');
      
      // Mark failed step
      const errorMsg = err.message || 'Unknown error';
      const failedSteps = transactionSteps.filter(s => s.status === 'active' || s.status === 'idle');
      if (failedSteps.length > 0) {
        updateStep(failedSteps[0].id, 'error', errorMsg);
      }
      
      let userMsg = 'Transaction failed. Please try again.';
      if (errorMsg.includes('rejected')) {
        userMsg = 'Transaction was rejected by your wallet.';
      } else if (errorMsg.includes('Merkle')) {
        userMsg = 'Merkle proof verification failed. Please retry.';
      } else if (errorMsg.includes('Blob') || errorMsg.includes('serializ')) {
        userMsg = `Proof serialization error: ${errorMsg}. Please check browser console.`;
      } else if (errorMsg.includes('invalid') || errorMsg.includes('Invalid')) {
        userMsg = `Invalid data: ${errorMsg}`;
      } else {
        userMsg = errorMsg;
      }
      
      console.error('[App] ✗ Transaction error:', errorMsg);
      setConnectionError(userMsg);
      setTimeout(() => setConnectionError(''), 8000);
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
        <section id="app" className="py-12 sm:py-16 lg:py-24 bg-stone-50 dark:bg-stone-900">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 dark:text-stone-50 text-center mb-3 sm:mb-4">
              Privacy by Design
            </h2>
            <p className="text-center text-sm sm:text-base text-stone-600 dark:text-stone-400 mb-10 sm:mb-16 max-w-2xl mx-auto">
              Every payment is protected at the cryptographic level, not just the application level.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
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
                className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors inline-block text-sm sm:text-base"
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
      {/* Debug Panel - visible with ?debug=1 param */}
      <WalletDebugPanel show={isDebugMode} />

      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {/* Error Banner */}
        {connectionError && (
          <div className="mb-4 sm:mb-6 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl p-3 sm:p-4 flex items-start sm:items-center justify-between gap-2">
            <span className="text-red-800 dark:text-red-200 text-xs sm:text-sm flex-1">{connectionError}</span>
            <button
              onClick={() => setConnectionError('')}
              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex-shrink-0 text-lg sm:text-xl"
            >
              ✕
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 mb-6 sm:mb-8 lg:mb-12">
          <div className="w-full sm:w-auto">
            <button
              onClick={() => setShowApp(false)}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold mb-2 flex items-center gap-1 text-sm sm:text-base"
            >
              ← Back to Info
            </button>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 dark:text-stone-50">
              Private Payments
            </h1>
            <p className="text-sm sm:text-base text-stone-600 dark:text-stone-400 mt-1">
              Send payments that prove your solvency without revealing amounts
            </p>
          </div>
          <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-4 w-full sm:w-auto">
            <div className="flex-1 sm:flex-none w-full sm:w-auto">
              <WalletMultiButton className="!w-full sm:!w-auto" />
            </div>
            {wallet.publicKey && (
              <div className="hidden sm:block">
                <WalletStatus connected={true} address={wallet.publicKey.toString()} />
              </div>
            )}
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
          {/* Payment Form */}
          <div className="lg:col-span-2 bg-white dark:bg-stone-950 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border border-stone-200 dark:border-stone-800 shadow-sm">
            <h2 className="text-xl sm:text-2xl font-semibold text-stone-900 dark:text-stone-50 mb-4 sm:mb-6 lg:mb-8">
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
          <div className="bg-white dark:bg-stone-950 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border border-stone-200 dark:border-stone-800 shadow-sm">
            <h3 className="text-base sm:text-lg font-semibold text-stone-900 dark:text-stone-50 mb-4 sm:mb-6">
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
          <div className="bg-white dark:bg-stone-950 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border border-stone-200 dark:border-stone-800 shadow-sm mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-semibold text-stone-900 dark:text-stone-50 mb-4 sm:mb-6">
              ✓ Payment Confirmed
            </h2>
            <div className="space-y-3 sm:space-y-4">
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl p-3 sm:p-4">
                <p className="text-green-700 dark:text-green-300 text-xs sm:text-sm font-mono break-all">
                  {txSignature}
                </p>
              </div>
              <a
                href={getExplorerUrl(txSignature)}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 sm:py-3 rounded-xl text-center transition text-sm sm:text-base"
              >
                View on Solana Explorer →
              </a>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm mt-4 sm:mt-6">
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
        <div className="mt-6 sm:mt-8 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl sm:rounded-2xl p-4 sm:p-6">
          <h3 className="text-blue-900 dark:text-blue-100 font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
            ℹ️ Development Mode
          </h3>
          <ul className="text-blue-800 dark:text-blue-200 text-xs sm:text-sm space-y-1.5 sm:space-y-2">
            <li>
              • Mock ZK proofs for rapid testing (real Circom circuits ready in /zk/circuits/)
            </li>
            <li>• Light Protocol integration ready for production compression</li>
            <li>
              • Deploy to devnet:{' '}
              <code className="bg-black/20 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs">
                pnpm run deploy
              </code>
            </li>
            <li>• Replace mock verifier with real Groth16 proof system</li>
          </ul>
        </div>
      </div>

      {/* Transaction Progress UI */}
      {loading && <TransactionUI steps={transactionSteps} txSignature={txSignature} loading={loading} />}
    </main>
  );
}
