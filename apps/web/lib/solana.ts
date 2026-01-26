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
  proofBytes?: Buffer; // optional pre-serialized proof
}

/**
 * Find nullifier PDA
 * Seeds: ["nullifier", nullifier_hash]
 */
export function findNullifierPDA(nullifier: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('nullifier'),
      Buffer.from(nullifier.slice(0, 32)), // Hash first 32 bytes
    ],
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
  const program = new Program(idl as any, PRIVACY_PAY_PROGRAM_ID, provider);

  const [nullifierPDA] = findNullifierPDA(params.proof.nullifier);
  const [statePDA] = findStatePDA();

  // Anchor accepts Buffer for bytes and fixed arrays; avoid Array.from to keep Blob encoding happy
  const merkleRootBytes = Buffer.from(params.merkleRoot);
  const proofBytes = params.proofBytes ?? serializeProofForSolana(params.proof);

  const tx = await program.methods
    .privateSpend(merkleRootBytes, params.amount, proofBytes)
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

  return tx;
}

/**
 * Initialize state PDA (one-time setup)
 */
export async function initializeState(
  provider: AnchorProvider,
  initialRoot: Buffer
): Promise<string> {
  const program = new Program(idl as any, PRIVACY_PAY_PROGRAM_ID, provider);
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
  const program = new Program(idl as any, PRIVACY_PAY_PROGRAM_ID, provider);
  const [statePDA] = findStatePDA();

  try {
    const state = await program.account.state.fetch(statePDA);
    return Buffer.from(state.merkleRoot);
  } catch (err) {
    console.log('[Solana] State not initialized, using genesis root');
    return Buffer.alloc(32, 0);
  }
}

/**
 * Check if nullifier has been used (prevent double-spend)
 */
export async function isNullifierUsed(connection: Connection, nullifier: string): Promise<boolean> {
  const [nullifierPDA] = findNullifierPDA(nullifier);
  const accountInfo = await connection.getAccountInfo(nullifierPDA);
  return accountInfo !== null;
}

/**
 * Get transaction explorer URL
 */
export function getExplorerUrl(signature: string, cluster: string = 'devnet'): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=${cluster}`;
}
