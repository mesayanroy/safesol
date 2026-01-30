/**
 * Solana Transaction Builder & Program Interaction
 *
 * Handles:
 * - Transaction construction
 * - CPI to verifier program
 * - Nullifier PDA creation
 * - Merkle root updates
 */

import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js';
import { AnchorProvider, Program, BN } from '@coral-xyz/anchor';
import { SpendProof, serializeProofForSolana } from './zk';
import type { PrivacyPay } from '../../../target/types/privacy_pay';
import idl from '../../../target/idl/privacy_pay.json';

// Guard against invalid/missing env vars to avoid SSR crashes during Next.js build.
const FALLBACK_PROGRAM_ID = '11111111111111111111111111111111'; // Valid base58 placeholder

function safePublicKey(value?: string): PublicKey {
  try {
    return new PublicKey(value || FALLBACK_PROGRAM_ID);
  } catch {
    return new PublicKey(FALLBACK_PROGRAM_ID);
  }
}

const PRIVACY_PAY_PROGRAM_ID = safePublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID);
const ZK_VERIFIER_PROGRAM_ID = safePublicKey(process.env.NEXT_PUBLIC_VERIFIER_ID);

export interface PrivatePaymentParams {
  proof: SpendProof;
  amount: BN;
  recipient: PublicKey;
  merkleRoot: Buffer;
  nullifierSeed?: Buffer;
  proofBytes?: Buffer; // optional pre-serialized proof
}

/**
 * Find nullifier PDA
 * Seeds: ["nullifier", nullifier_seed]
 */
export function findNullifierPDA(nullifierSeed: Buffer): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('nullifier'), nullifierSeed],
    PRIVACY_PAY_PROGRAM_ID
  );
}

/**
 * Find state PDA that holds Merkle root
 * Seeds: ["state"]
 */
export function findStatePDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from('state')], PRIVACY_PAY_PROGRAM_ID);
}

/**
 * Build private payment transaction
 *
 * Flow:
 * 1. Create nullifier PDA (if not exists)
 * 2. CPI to verifier program
 * 3. Update Merkle root in state PDA
 * 4. Transfer SOL to recipient
 */
export async function buildPrivatePaymentTx(
  provider: AnchorProvider,
  params: PrivatePaymentParams
): Promise<Transaction> {
  const program = new Program(idl as any, provider);

  // Create nullifier seed from the nullifier hash
  const nullifierSeed =
    params.nullifierSeed ?? Buffer.from(params.proof.nullifier.slice(0, 64), 'hex');
  const [nullifierPDA] = findNullifierPDA(nullifierSeed);
  const [statePDA] = findStatePDA();

  // Serialize proof with error handling
  let proofBytes: Buffer;
  try {
    proofBytes = params.proofBytes ?? serializeProofForSolana(params.proof);
    console.log('[Solana] ✓ Proof serialized successfully:', {
      size: proofBytes.length,
      isBuffer: Buffer.isBuffer(proofBytes),
    });
  } catch (err) {
    console.error('[Solana] ✗ Failed to serialize proof:', err);
    throw new Error(
      `Proof serialization failed: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  // Verify proof buffer size
  if (proofBytes.length !== 256) {
    throw new Error(`Invalid proof size: expected 256 bytes, got ${proofBytes.length}`);
  }

  // Prepare merkle root as fixed-size array [u8; 32]
  const merkleRootArray = Array.from(params.merkleRoot);
  if (merkleRootArray.length !== 32) {
    throw new Error(`Invalid merkle root size: expected 32 bytes, got ${merkleRootArray.length}`);
  }

  // Prepare nullifier seed as fixed-size array [u8; 32]
  const nullifierSeedArray = Array.from(nullifierSeed);
  if (nullifierSeedArray.length < 32) {
    // Pad to 32 bytes if needed
    while (nullifierSeedArray.length < 32) {
      nullifierSeedArray.push(0);
    }
  }
  const nullifierSeed32 = nullifierSeedArray.slice(0, 32);

  // Convert public signals to Vec<[u8; 32]>
  // Each signal is a bigint that needs to be converted to a 32-byte array
  const publicSignalsArrays = params.proof.publicSignals.map((signal, idx) => {
    const sigBigInt = BigInt(signal);

    // For merkleRoot (signal index 1), preserve full 256 bits
    // For other signals, truncate to 64 bits
    if (idx === 1) {
      // MerkleRoot - full 32 bytes (big-endian)
      const buf = Buffer.alloc(32);
      const hex = sigBigInt.toString(16).padStart(64, '0');
      Buffer.from(hex, 'hex').copy(buf);
      console.log('[Solana] Signal[1] MerkleRoot:', hex);
      return Array.from(buf);
    } else {
      // Nullifier and Amount - 64-bit values
      const truncated = sigBigInt & BigInt('0xFFFFFFFFFFFFFFFF');
      const buf = Buffer.alloc(32);
      buf.writeBigUInt64BE(truncated, 24); // Write to last 8 bytes
      console.log(`[Solana] Signal[${idx}]:`, truncated.toString());
      return Array.from(buf);
    }
  });

  console.log('[Solana] Building transaction with:', {
    proofSize: proofBytes.length,
    merkleRootSize: merkleRootArray.length,
    nullifierSeedSize: nullifierSeed32.length,
    publicSignalsCount: publicSignalsArrays.length,
    nullifierPDA: nullifierPDA.toString(),
    amount: params.amount.toString(),
    programId: program.programId.toString(),
  });

  // Build the instruction with proper types
  // Pass proof as Buffer (bytes type), others as arrays
  try {
    const tx = await program.methods
      .privateSpend(
        merkleRootArray, // [u8; 32]
        params.amount, // u64
        Buffer.from(proofBytes), // bytes
        nullifierSeed32, // [u8; 32]
        publicSignalsArrays // Vec<[u8; 32]>
      )
      .accounts({
        payer: provider.wallet.publicKey,
        state: statePDA,
        nullifier: nullifierPDA,
        recipient: params.recipient,
        zkVerifier: ZK_VERIFIER_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .transaction();

    console.log('[Solana] ✓ Transaction built successfully:', {
      instructionCount: tx.instructions.length,
      signers: tx.signatures.length,
    });

    return tx;
  } catch (buildErr) {
    console.error('[Solana] ✗ Transaction build error - FULL DETAILS:', {
      error: buildErr,
      message: buildErr instanceof Error ? buildErr.message : String(buildErr),
      stack: buildErr instanceof Error ? buildErr.stack : undefined,
      programId: program.programId.toString(),
      accounts: {
        payer: provider.wallet.publicKey.toString(),
        state: statePDA.toString(),
        nullifier: nullifierPDA.toString(),
        recipient: params.recipient.toString(),
      },
    });
    throw new Error(
      `Transaction build failed: ${buildErr instanceof Error ? buildErr.message : String(buildErr)}`
    );
  }
}

/**
 * Initialize state PDA (one-time setup)
 */
export async function initializeState(
  provider: AnchorProvider,
  initialRoot: Buffer
): Promise<string> {
  const program = new Program(idl as any, provider);
  const [statePDA] = findStatePDA();

  const tx = await program.methods
    .initialize(Array.from(initialRoot))
    .accounts({
      payer: provider.wallet.publicKey,
      state: statePDA,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  console.log('[Solana] State initialized:', tx);
  return tx;
}

/**
 * Fetch current Merkle root from on-chain state
 */
export async function getCurrentMerkleRoot(provider: AnchorProvider): Promise<Buffer> {
  const program = new Program(idl as any, provider);
  const [statePDA] = findStatePDA();

  try {
    const state = await (program.account as any).state.fetch(statePDA);
    return Buffer.from(state.merkleRoot);
  } catch (err) {
    console.log('[Solana] State not initialized, using genesis root');
    return Buffer.alloc(32, 0);
  }
}

/**
 * Check if nullifier has been used (prevent double-spend)
 */
export async function isNullifierUsed(
  connection: Connection,
  nullifierSeed: Buffer
): Promise<boolean> {
  const [nullifierPDA] = findNullifierPDA(nullifierSeed);
  const accountInfo = await connection.getAccountInfo(nullifierPDA);
  return accountInfo !== null;
}

/**
 * Get transaction explorer URL
 */
export function getExplorerUrl(signature: string, cluster: string = 'devnet'): string {
  // Handle mock transactions
  if (signature.startsWith('mock_')) {
    return `https://explorer.solana.com/address/${
      process.env.NEXT_PUBLIC_PROGRAM_ID || 'Csrxfr5aDNNMmozoGGfbLjYeU7Kjjs3ZH2Vy83c5Rpd8'
    }?cluster=${cluster}`;
  }
  return `https://explorer.solana.com/tx/${signature}?cluster=${cluster}`;
}
