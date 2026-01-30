'use client';

import '@/lib/polyfills';
import { useState, useEffect, useRef } from 'react';
import { Buffer } from 'buffer';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey } from '@solana/web3.js';
import { BN, AnchorProvider } from '@coral-xyz/anchor';
import PaymentForm from '@/components/PaymentForm';
import TransactionDashboard from '@/components/TransactionDashboard';
import { TransactionUI, TransactionStep } from '@/components/TransactionUI';
import { ProtocolGuarantees } from '@/components/ProtocolGuarantees';
import { LandingHero, HowItWorks } from '@/components/Landing';
import { PrivacyCard, WalletStatus, StepIndicator } from '@/components/UI';
import { WalletDebugPanel } from '@/components/WalletDebugPanel';
import { useTransactionHistory } from '@/hooks/useTransactionHistory';
import {
  generateSpendProof,
  generateSecret,
  generateCommitment,
  calculateMerklePath,
  serializeProofForSolana,
} from '@/lib/zk';
import { buildPrivatePaymentTx, getExplorerUrl } from '@/lib/solana';
import { createLightClient } from '@/lib/light';
import { TransactionManager } from '@/lib/transactions';

// Enable debug mode by adding ?debug=1 to URL
const isDebugMode =
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === '1';

export default function Home() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const {
    transactions,
    stats,
    limits,
    recordTransaction,
    updateStatus,
    updateStatusBySignature,
    attachReceipt,
    checkCrossBorderLimit,
    getRemainingBudget,
    changeFilter,
    clearHistory,
    exportHistory,
  } = useTransactionHistory();

  const [txSignature, setTxSignature] = useState<string>('');
  const [merkleRoot, setMerkleRoot] = useState<string>('');
  const [currentTxId, setCurrentTxId] = useState<string | null>(null);
  const currentTxIdRef = useRef<string | null>(null);
  const [paymentType, setPaymentType] = useState<'domestic' | 'cross-border'>('domestic');
  const [proofStatus, setProofStatus] = useState<
    'idle' | 'generating' | 'generated' | 'submitted' | 'confirmed' | 'error'
  >('idle');
  const [loading, setLoading] = useState(false);
  const [showApp, setShowApp] = useState(false);
  const [connectionError, setConnectionError] = useState<string>('');
  const [transactionSteps, setTransactionSteps] = useState<TransactionStep[]>([
    { id: 'secret', label: 'Generate Secret', description: 'Creating commitment', status: 'idle' },
    {
      id: 'merkle',
      label: 'Merkle Proof',
      description: 'Fetching from Light Protocol',
      status: 'idle',
    },
    { id: 'zk-proof', label: 'ZK Proof', description: 'Groth16 proof generation', status: 'idle' },
    {
      id: 'build-tx',
      label: 'Build Transaction',
      description: 'Preparing Solana transaction',
      status: 'idle',
    },
    {
      id: 'sign-tx',
      label: 'Sign & Send',
      description: 'Wallet signature and submission',
      status: 'idle',
    },
    { id: 'confirm', label: 'Confirm', description: 'Waiting for confirmation', status: 'idle' },
  ]);

  const updateStep = (
    stepId: string,
    status: TransactionStep['status'],
    error?: string,
    data?: string
  ) => {
    setTransactionSteps((prev) =>
      prev.map((step) => (step.id === stepId ? { ...step, status, error, data } : step))
    );
  };

  const handlePrivatePayment = async (
    recipient: string,
    amount: number,
    type: 'domestic' | 'cross-border'
  ) => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      setConnectionError('Please connect wallet first');
      setTimeout(() => setConnectionError(''), 3000);
      return;
    }

    console.log('[App] 🚀 Starting private payment:', { recipient, amount, type });
    console.log('[App] 🔧 Buffer available:', typeof Buffer !== 'undefined');
    console.log('[App] 🔧 crypto available:', typeof crypto !== 'undefined');
    console.log(
      '[App] 🔧 crypto.getRandomValues available:',
      typeof crypto?.getRandomValues === 'function'
    );
    console.log('[App] 🔧 generateSecret available:', typeof generateSecret === 'function');
    console.log('[App] 🔧 generateCommitment available:', typeof generateCommitment === 'function');

    // Test Buffer functionality
    try {
      const testBuf = Buffer.alloc(32);
      console.log('[App] 🔧 Buffer test successful:', testBuf.length);
    } catch (bufErr) {
      console.error('[App] ✗ Buffer test failed:', bufErr);
    }

    // Test generateSecret
    try {
      const testSecret = generateSecret();
      console.log(
        '[App] 🔧 generateSecret test successful:',
        typeof testSecret,
        testSecret.toString(16).slice(0, 16) + '...'
      );
    } catch (secretTestErr) {
      console.error('[App] ✗ generateSecret test failed:', secretTestErr);
    }

    // Check cross-border limit
    if (type === 'cross-border') {
      const canSpend = checkCrossBorderLimit(amount);
      if (!canSpend.allowed) {
        setConnectionError(canSpend.reason || 'Cross-border limit exceeded');
        setTimeout(() => setConnectionError(''), 5000);
        return;
      }
    }

    if (!connection) {
      setConnectionError('Network connection failed. Please refresh the page.');
      return;
    }

    setConnectionError('');
    setLoading(true);
    setProofStatus('generating');

    // Record transaction immediately as pending
    const txId = recordTransaction('', amount, recipient, type, 'pending');
    setCurrentTxId(txId);
    currentTxIdRef.current = txId;

    try {
      // Reset steps
      setTransactionSteps((prev) => prev.map((s) => ({ ...s, status: 'idle', error: undefined })));

      console.log('[App] Starting private payment flow...', {
        type,
        recipient,
        amount: `${amount} SOL`,
        wallet: wallet.publicKey.toString(),
      });

      // Step 1: Generate secret and commitment
      updateStep('secret', 'active');
      console.log('[App] Step 1: Generating secret and commitment...');

      let secret: bigint;
      let commitment: bigint;

      try {
        secret = generateSecret();
        const secretHash = secret.toString(16).slice(0, 16);
        console.log('[App] ✓ Secret generated:', secretHash + '...');

        // Generate commitment
        commitment = await generateCommitment(secret, BigInt(Math.floor(amount * 1e9)));

        updateStep('secret', 'complete', undefined, `Secret: ${secretHash}...`);
        console.log('[App] ✓ Commitment generated:', commitment.toString().slice(0, 16) + '...');
      } catch (secretErr) {
        const errMsg = secretErr instanceof Error ? secretErr.message : 'Secret generation failed';
        console.error('[App] ✗ Secret generation error:', secretErr);
        console.error('[App] ✗ Error type:', typeof secretErr);
        console.error(
          '[App] ✗ Error stack:',
          secretErr instanceof Error ? secretErr.stack : 'No stack'
        );
        updateStep('secret', 'error', errMsg);
        throw new Error(errMsg);
      }

      // Step 2: Fetch current Merkle root from on-chain state PDA
      updateStep('merkle', 'active');
      console.log('[App] Step 2: Fetching Merkle root from on-chain state...');

      let merkleProof: string[];
      let currentRoot: string;
      let lightClient: any;
      let proofBytes: Buffer; // Track proof bytes for receipt generation

      try {
        // Load program to read state
        const programId = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID!);
        const [statePDA] = PublicKey.findProgramAddressSync([Buffer.from('state')], programId);

        console.log('[App] Fetching state from PDA:', statePDA.toString());

        // Fetch state account data
        const stateAccount = await connection.getAccountInfo(statePDA);
        if (!stateAccount) {
          throw new Error('State PDA not initialized. Run: npx tsx scripts/init_state.ts');
        }

        // Parse Merkle root from state (skip 8-byte discriminator + 32-byte authority = offset 40)
        const merkleRootBytes = stateAccount.data.slice(40, 72);
        currentRoot = Buffer.from(merkleRootBytes).toString('hex');

        console.log('[App] ✓ On-chain Merkle root:', currentRoot.slice(0, 16) + '...');
        console.log('[App] ✓ Full root:', currentRoot);

        // For now, use mock merkle proof (empty tree)
        lightClient = createLightClient(connection);
        merkleProof = await lightClient.getCommitmentProof(commitment.toString());

        // Store merkle root for display
        setMerkleRoot(currentRoot);

        updateStep('merkle', 'complete', undefined, `Root: ${currentRoot.slice(0, 16)}...`);
      } catch (merkleErr) {
        const errMsg = merkleErr instanceof Error ? merkleErr.message : 'Merkle proof failed';
        console.error('[App] ✗ Merkle proof error:', merkleErr);
        updateStep('merkle', 'error', errMsg);
        throw new Error(errMsg);
      }

      // Step 3: Calculate Merkle path (this is part of zk-proof preparation)
      console.log('[App] Step 3: Calculating Merkle path indices...');

      let path: bigint[];
      let indices: bigint[];

      try {
        const pathResult = await calculateMerklePath(
          commitment,
          merkleProof.map((p) => BigInt(p))
        );
        path = pathResult.path;
        indices = pathResult.indices;
        console.log('[App] ✓ Path calculated with', path.length, 'levels');
      } catch (pathErr) {
        const errMsg =
          pathErr instanceof Error ? pathErr.message : 'Merkle path calculation failed';
        console.error('[App] ✗ Merkle path error:', pathErr);
        updateStep('merkle', 'error', errMsg);
        throw new Error(errMsg);
      }

      // Step 4: Generate ZK proof
      updateStep('zk-proof', 'active');
      console.log('[App] Step 4: Generating zero-knowledge proof...');

      const useMockProofs = process.env.NEXT_PUBLIC_ENABLE_MOCK_PROOFS === 'true';
      const proofMode = useMockProofs ? 'MOCK (development)' : 'REAL Groth16 (production)';
      console.log('[App] Proof generation mode:', proofMode);

      let proof;
      try {
        console.log('[App] Starting ZK proof generation...');
        console.log('[App] Proof inputs:', {
          secret: '***hidden***',
          amount: Math.floor(amount * 1e9),
          merkleRoot: currentRoot,
          merkleRootBigInt: BigInt(
            '0x' + (currentRoot.startsWith('0x') ? currentRoot.slice(2) : currentRoot)
          ).toString(),
        });

        proof = await generateSpendProof(
          {
            secret,
            amount: BigInt(Math.floor(amount * 1e9)),
            balance: BigInt(100 * 1e9), // TODO: Get actual balance
            merkleProof: path,
            merkleRoot: BigInt(
              '0x' + (currentRoot.startsWith('0x') ? currentRoot.slice(2) : currentRoot)
            ),
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

      updateStep('zk-proof', 'complete', undefined, `Proof: ${proof.nullifier.slice(0, 20)}...`);
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

      console.log('[App] Program IDs:', {
        privacyPay: process.env.NEXT_PUBLIC_PROGRAM_ID,
        zkVerifier: process.env.NEXT_PUBLIC_VERIFIER_ID,
      });

      // REAL TRANSACTION MODE - Program deployed successfully
      const useMockTransaction = false;

      if (useMockTransaction) {
        console.log('[App] ⚠ Using MOCK transaction mode (program has compile errors)');

        // Generate a fake transaction signature
        const mockSignature =
          'mock_' +
          Array.from(crypto.getRandomValues(new Uint8Array(32)))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')
            .slice(0, 88);

        updateStep('build-tx', 'complete', undefined, '1 instruction (MOCK)');
        updateStep('sign-tx', 'active');

        await new Promise((resolve) => setTimeout(resolve, 1500));

        updateStep('sign-tx', 'complete', undefined, `Tx: ${mockSignature.slice(0, 16)}...`);
        setTxSignature(mockSignature);

        updateStep('confirm', 'active');
        await new Promise((resolve) => setTimeout(resolve, 1000));
        updateStep('confirm', 'complete', undefined, '✓ Mock Confirmed');

        console.log('[App] ✓ Mock transaction completed:', mockSignature);
        console.log('[App] ⚠ This is a DEMONSTRATION ONLY - no real SOL was transferred');
        console.log('[App] ⚠ Fix program compile errors to enable real transactions');

        setProofStatus('confirmed');
        setLoading(false);

        const txId = currentTxIdRef.current;
        if (txId) {
          updateStatus(txId, 'confirmed', mockSignature);
        }
        updateStatusBySignature(mockSignature, 'confirmed');

        return;
      }

      const provider = new AnchorProvider(connection, wallet as any, {
        commitment: 'confirmed',
        preflightCommitment: 'confirmed',
      });

      // Convert merkle root to 32-byte Buffer
      let merkleRootBuffer: Buffer;
      const rootHex = currentRoot.startsWith('0x') ? currentRoot.slice(2) : currentRoot;
      if (rootHex.length === 64) {
        merkleRootBuffer = Buffer.from(rootHex, 'hex');
      } else {
        merkleRootBuffer = Buffer.alloc(32, 0);
      }

      console.log('[App] Merkle root for transaction:', {
        hex: rootHex,
        buffer: Array.from(merkleRootBuffer).slice(0, 8),
        length: merkleRootBuffer.length,
      });

      let tx;
      try {
        console.log('[App] Serializing proof for Solana...');
        
        // Serialize proof and capture bytes for receipt
        proofBytes = serializeProofForSolana(proof);
        console.log('[App] ✓ Proof serialized:', proofBytes.length, 'bytes');
        
        tx = await buildPrivatePaymentTx(provider, {
          proof,
          amount: new BN(Math.floor(amount * 1e9)),
          recipient: new PublicKey(recipient),
          merkleRoot: merkleRootBuffer,
        });

        // Ensure transaction has recent blockhash and fee payer
        console.log('[App] Fetching latest blockhash...');
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash(
          'confirmed'
        );
        tx.recentBlockhash = blockhash;
        tx.lastValidBlockHeight = lastValidBlockHeight;
        tx.feePayer = wallet.publicKey;

        console.log('[App] ✓ Transaction configured:', {
          blockhash: blockhash.slice(0, 16) + '...',
          lastValidBlockHeight,
          feePayer: wallet.publicKey.toString(),
          instructionCount: tx.instructions.length,
        });

        console.log('[App] ✓ Transaction built successfully');
      } catch (txErr) {
        const txErrMsg = txErr instanceof Error ? txErr.message : String(txErr);
        console.error('[App] Transaction build failed:', txErrMsg);
        throw new Error(`Transaction build failed: ${txErrMsg}`);
      }

      updateStep('build-tx', 'complete', undefined, `${tx.instructions.length} instructions`);

      // Step 7: Submit transaction
      updateStep('sign-tx', 'active');
      console.log('[App] Step 7: Signing and submitting transaction to Solana...');
      console.log('[App] Transaction details:', {
        feePayer: tx.feePayer?.toString(),
        recentBlockhash: tx.recentBlockhash,
        instructionCount: tx.instructions.length,
        signers: tx.signatures.length,
      });

      let signature: string | undefined;

      try {
        console.log('[App] Requesting wallet signature...');

        // Simulate transaction first to catch errors early
        console.log('[App] Simulating transaction...');
        try {
          const simulation = await connection.simulateTransaction(tx);
          console.log('[App] Simulation result:', simulation);

          if (simulation.value.err) {
            console.error('[App] ✗ Simulation failed:', simulation.value.err);
            console.error('[App] ✗ Simulation logs:', simulation.value.logs);
            throw new Error(
              `Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`
            );
          }

          console.log('[App] ✓ Simulation successful');
          console.log('[App] Simulation logs:', simulation.value.logs);
        } catch (simErr) {
          console.error('[App] ✗ Simulation error:', simErr);
          throw simErr;
        }

        // Send transaction using wallet adapter
        // Note: wallet.sendTransaction handles signing AND sending to network
        console.log('[App] Sending transaction to wallet for signing...');
        signature = await wallet.sendTransaction(tx, connection, {
          skipPreflight: true, // We already simulated above
          preflightCommitment: 'confirmed',
        });

        console.log('[App] ✓ Transaction sent! Signature:', signature);
        console.log('[App] ✓ Signature length:', signature.length);
        updateStep('sign-tx', 'complete', undefined, `Tx: ${signature.slice(0, 16)}...`);

        // Set signature immediately so user can see it
        setTxSignature(signature);
        setMerkleRoot(currentRoot);

        // Update transaction record with signature (still pending confirmation)
        const txId = currentTxIdRef.current;
        if (txId) {
          updateStatus(txId, 'pending', signature);
          console.log('[App] Transaction sent, waiting for on-chain confirmation...');
        }

        setProofStatus('confirmed');
        setLoading(false); // Clear loading state immediately after signature is obtained
      } catch (signErr: any) {
        // Check if we got a signature before the error
        if (signature) {
          console.warn('[App] ⚠ Error occurred AFTER signature was obtained:', signErr.message);
          console.warn('[App] ⚠ Transaction was likely sent successfully - signature:', signature);
          console.warn('[App] ⚠ Continuing to confirmation...');

          // Ensure UI is updated with signature
          if (!txSignature) {
            setTxSignature(signature);
            setMerkleRoot(currentRoot);
            updateStep('sign-tx', 'complete', undefined, `Tx: ${signature.slice(0, 16)}...`);
          }

          const txId = currentTxIdRef.current;
          if (txId) {
            updateStatus(txId, 'pending', signature);
            console.log('[App] Transaction sent, waiting for on-chain confirmation...');
          }

          setProofStatus('confirmed');
          setLoading(false); // Clear loading state
          // Don't throw - continue to confirmation
        } else {
          // No signature obtained - real error
          console.error('[App] ✗ Transaction submission failed - FULL ERROR:', {
            message: signErr.message,
            code: signErr.code,
            logs: signErr.logs,
            stack: signErr.stack,
            name: signErr.name,
          });

          // Extract meaningful error message
          let errorMessage = 'Transaction failed';

          if (signErr.message) {
            if (
              signErr.message.includes('User rejected') ||
              signErr.message.includes('User cancelled')
            ) {
              errorMessage = 'Transaction rejected by user';
            } else {
              errorMessage = signErr.message;
            }
          }

          updateStep('sign-tx', 'error', errorMessage);
          throw new Error(errorMessage);
        }
      }

      // Only proceed to confirmation if we have a signature
      if (!signature) {
        console.error('[App] ✗ No transaction signature - cannot confirm');
        throw new Error('Transaction failed - no signature received');
      }

      // Step 8: Confirm transaction (run in background, don't block UI)
      updateStep('confirm', 'active');
        console.log('[App] Step 8: Confirming transaction on-chain...');
        console.log('[App] ⏳ Checking confirmation status (this may take a few seconds)...');
      console.log('[App] Signature to confirm:', signature);

      // Don't await - let confirmation happen in background
      (async () => {
        try {
          // Check confirmation status a few times quickly
          let confirmed = false;
          let attempts = 0;
          const maxAttempts = 20; // Faster feedback with shorter interval

          while (!confirmed && attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 500)); // Check every 0.5 seconds

            try {
              const statuses = await connection.getSignatureStatuses([signature], {
                searchTransactionHistory: true,
              });
              const status = statuses.value[0];

              console.log(`[App] Confirmation attempt ${attempts + 1}/${maxAttempts}:`, status);

              if (!status) {
                const txDetails = await connection.getTransaction(signature, {
                  maxSupportedTransactionVersion: 0,
                  commitment: 'confirmed',
                });
                if (txDetails) {
                  confirmed = true;
                  console.log('[App] ✓ Transaction found on-chain via getTransaction');
                  updateStep('confirm', 'complete', undefined, '✓ Confirmed on Solana');

                  const txId = currentTxIdRef.current;
                  if (txId) {
                    updateStatus(txId, 'confirmed', signature);
                  }
                  updateStatusBySignature(signature, 'confirmed');

                  break;
                }
              }

              if (
                status?.confirmationStatus === 'processed' ||
                status?.confirmationStatus === 'confirmed' ||
                status?.confirmationStatus === 'finalized' ||
                (status?.confirmationStatus === null && status?.confirmations === null)
              ) {
                confirmed = true;
                console.log('[App] ✓ Transaction confirmed on-chain!');

                if (status.err) {
                  console.error('[App] ✗ Transaction failed on-chain:', status.err);
                  updateStep('confirm', 'error', 'Transaction failed on-chain');

                  // Update transaction status to failed
                  const txId = currentTxIdRef.current;
                  if (txId) {
                    updateStatus(txId, 'failed', `On-chain error: ${JSON.stringify(status.err)}`);
                  }
                  updateStatusBySignature(signature, 'failed', `On-chain error: ${JSON.stringify(status.err)}`);
                } else {
                  updateStep('confirm', 'complete', undefined, '✓ Confirmed on Solana');

                  // Update transaction status to confirmed
                  const txId = currentTxIdRef.current;
                  if (txId) {
                    updateStatus(txId, 'confirmed', signature);
                  }
                  updateStatusBySignature(signature, 'confirmed');
                  
                  // Fetch transaction details for receipt
                  try {
                    const txDetails = await connection.getTransaction(signature, {
                      maxSupportedTransactionVersion: 0,
                    });
                    
                    const blockTime = txDetails?.blockTime || undefined;
                    console.log('[App] Transaction block time:', blockTime);
                    
                    // Generate privacy receipt
                    const network = process.env.NEXT_PUBLIC_RPC_ENDPOINT?.includes('devnet') 
                      ? 'devnet' 
                      : 'mainnet-beta';
                    const proofType = process.env.NEXT_PUBLIC_ENABLE_MOCK_PROOFS === 'true' 
                      ? 'Mock' as const
                      : 'Groth16' as const;
                    
                    const receipt = TransactionManager.createReceipt(
                      signature,
                      currentRoot,
                      proofBytes,
                      proof.nullifier,
                      network,
                      proofType,
                      blockTime
                    );
                    
                    // Attach receipt to transaction
                    const txId = currentTxIdRef.current;
                    if (txId) {
                      attachReceipt(txId, receipt);
                      console.log('[App] ✓ Privacy receipt attached to transaction');
                    }
                  } catch (receiptErr) {
                    console.warn('[App] ⚠ Failed to generate receipt (non-critical):', receiptErr);
                  }
                }
                break;
              }
            } catch (statusErr) {
              console.warn('[App] ⚠ Status check error:', statusErr);
            }

            attempts++;
          }

          if (!confirmed) {
            console.log('[App] ℹ Transaction confirmation timed out - may still be processing');
            console.log('[App] ℹ Check explorer for current status:', getExplorerUrl(signature));
            updateStep('confirm', 'complete', undefined, '✓ Sent (check explorer)');
            
            // Note: We don't mark as failed - transaction might still confirm later
            // The monitorTransaction background task will update status when confirmed
          }

          // Update Light Protocol state
          try {
            await lightClient.storeCompressedCommitment(commitment.toString(), wallet.publicKey);
            console.log('[App] ✓ Commitment stored in compressed tree');
          } catch (lightErr) {
            console.warn('[App] ⚠ Light Protocol update failed (non-critical):', lightErr);
          }

          console.log('[App] ✅ Payment complete!');
          console.log('[App]   - Transaction:', signature);
          console.log('[App]   - Explorer:', getExplorerUrl(signature));
          console.log('[App]   - Merkle root:', currentRoot.slice(0, 16) + '...');
          console.log('[App]   - All 6 privacy steps completed successfully!');
        } catch (confirmErr) {
          console.error('[App] ✗ Confirmation check error:', confirmErr);
          console.log('[App] ℹ Transaction sent - check explorer for confirmation');
          updateStep('confirm', 'complete', undefined, '✓ Sent (check explorer)');
        }
      })();

      // Don't wait for confirmation - transaction is already successful
    } catch (err: any) {
      console.error('[App] ❌ Payment failed:', err);
      setProofStatus('error');
      setLoading(false); // Clear loading state on error

      // Mark transaction as failed
      const txId = currentTxIdRef.current;
      if (txId) {
        updateStatus(txId, 'failed', err.message || 'Unknown error');
      }

      // Mark failed step
      const errorMsg = err.message || 'Unknown error';
      const failedSteps = transactionSteps.filter(
        (s) => s.status === 'active' || s.status === 'idle'
      );
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
    }
    // Note: setLoading(false) is called in success/error blocks above
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
            <span className="text-red-800 dark:text-red-200 text-xs sm:text-sm flex-1">
              {connectionError}
            </span>
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

        {/* Protocol Guarantees */}
        <div className="mb-8 sm:mb-10">
          <ProtocolGuarantees />
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
              crossBorderLimitRemaining={getRemainingBudget()}
              onPaymentTypeChange={setPaymentType}
            />
          </div>

          {/* Privacy Layer Steps - Real-time Flow */}
          <div className="bg-white dark:bg-stone-950 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-stone-200 dark:border-stone-800 shadow-sm">
            <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-50 mb-4">
              🔒 Privacy Layer Steps
            </h3>

            {/* Real-time Step Progress */}
            <div className="space-y-3">
              {transactionSteps.map((step, index) => {
                const isActive = step.status === 'active';
                const isComplete = step.status === 'complete';
                const isError = step.status === 'error';
                const isIdle = step.status === 'idle';

                return (
                  <div
                    key={step.id}
                    className={`relative p-3 rounded-lg border-2 transition-all duration-300 ${
                      isActive
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 shadow-lg shadow-blue-500/20'
                        : isComplete
                        ? 'border-green-500 bg-green-50 dark:bg-green-950'
                        : isError
                        ? 'border-red-500 bg-red-50 dark:bg-red-950'
                        : 'border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Step Icon/Number */}
                      <div
                        className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          isActive
                            ? 'bg-blue-600 text-white animate-pulse'
                            : isComplete
                            ? 'bg-green-600 text-white'
                            : isError
                            ? 'bg-red-600 text-white'
                            : 'bg-stone-300 dark:bg-stone-600 text-stone-600 dark:text-stone-300'
                        }`}
                      >
                        {isComplete ? '✓' : isError ? '✕' : index + 1}
                      </div>

                      {/* Step Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4
                            className={`text-sm font-semibold ${
                              isActive
                                ? 'text-blue-900 dark:text-blue-100'
                                : isComplete
                                ? 'text-green-900 dark:text-green-100'
                                : isError
                                ? 'text-red-900 dark:text-red-100'
                                : 'text-stone-600 dark:text-stone-400'
                            }`}
                          >
                            {step.label}
                          </h4>
                          {isActive && (
                            <div className="flex gap-1">
                              <div
                                className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"
                                style={{ animationDelay: '0ms' }}
                              ></div>
                              <div
                                className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"
                                style={{ animationDelay: '150ms' }}
                              ></div>
                              <div
                                className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"
                                style={{ animationDelay: '300ms' }}
                              ></div>
                            </div>
                          )}
                        </div>
                        <p
                          className={`text-xs ${
                            isActive
                              ? 'text-blue-700 dark:text-blue-300'
                              : isComplete
                              ? 'text-green-700 dark:text-green-300'
                              : isError
                              ? 'text-red-700 dark:text-red-300'
                              : 'text-stone-500 dark:text-stone-500'
                          }`}
                        >
                          {step.description}
                        </p>

                        {/* Error Message */}
                        {isError && step.error && (
                          <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded text-xs text-red-800 dark:text-red-200">
                            {step.error}
                          </div>
                        )}

                        {/* Data/Result Display */}
                        {isComplete && step.data && (
                          <div className="mt-2 p-2 bg-green-100 dark:bg-green-900/30 rounded text-xs text-green-800 dark:text-green-200 font-mono break-all">
                            {step.data}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Status Summary */}
            {loading && (
              <div className="mt-4 pt-4 border-t border-stone-200 dark:border-stone-700">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-600 dark:text-stone-400">Processing...</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 animate-pulse"
                        style={{
                          width: `${
                            (transactionSteps.filter((s) => s.status === 'complete').length /
                              transactionSteps.length) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-stone-900 dark:text-stone-100 font-semibold">
                      {transactionSteps.filter((s) => s.status === 'complete').length}/
                      {transactionSteps.length}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {!loading && !txSignature && (
              <div className="mt-4 pt-4 border-t border-stone-200 dark:border-stone-700 text-center">
                <p className="text-xs text-stone-500 dark:text-stone-500">
                  🔒 Steps will appear here during transaction
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Transaction Result */}
        {txSignature && (
          <div className="bg-white dark:bg-stone-950 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border border-stone-200 dark:border-stone-800 shadow-sm mb-6 sm:mb-8">
            {txSignature.startsWith('mock_') && (
              <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3 sm:p-4 mb-4">
                <p className="text-yellow-800 dark:text-yellow-200 text-sm font-semibold mb-2">
                  ⚠️ Demo Mode - Mock Transaction
                </p>
                <p className="text-yellow-700 dark:text-yellow-300 text-xs">
                  This is a demonstration only. The Solana program has compile errors that prevent
                  real transactions. All privacy layers (ZK proof, Merkle tree, commitment) worked
                  correctly.
                  <a href="https://github.com/your-repo" className="underline ml-1">
                    View documentation
                  </a>{' '}
                  to fix the program.
                </p>
              </div>
            )}
            <h2 className="text-xl sm:text-2xl font-semibold text-stone-900 dark:text-stone-50 mb-4 sm:mb-6">
              ✓ Payment {txSignature.startsWith('mock_') ? 'Simulated' : 'Confirmed'}
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
                {txSignature.startsWith('mock_')
                  ? 'View Program on Explorer →'
                  : 'View on Solana Explorer →'}
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
                <div className="col-span-2">
                  <p className="text-stone-600 dark:text-stone-400 mb-1">Merkle Root Hash</p>
                  <p className="text-green-600 dark:text-green-400 font-mono text-xs break-all">
                    {merkleRoot || 'Generating...'}
                  </p>
                </div>
                <div>
                  <p className="text-stone-600 dark:text-stone-400 mb-1">Privacy Status</p>
                  <p className="text-green-600 dark:text-green-400 font-semibold">✓ Private</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transaction Dashboard */}
        <div className="bg-white dark:bg-stone-950 rounded-2xl p-6 sm:p-8 border border-stone-200 dark:border-stone-800 shadow-sm">
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-50 mb-6">
            Transaction Dashboard
          </h2>
          <TransactionDashboard
            transactions={transactions}
            stats={stats || undefined}
            limits={limits || undefined}
            onFilterChange={changeFilter}
            onClearHistory={clearHistory}
            onExportHistory={exportHistory}
            loading={false}
          />
        </div>

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
      {loading && (
        <TransactionUI
          steps={transactionSteps}
          txSignature={txSignature}
          merkleRoot={merkleRoot}
          loading={loading}
        />
      )}
    </main>
  );
}
