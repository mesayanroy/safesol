/**
 * ZK Proof Generation & Verification Utilities
 *
 * This module handles:
 * - Proof generation (spend, membership, disclosure)
 * - Circuit witness calculation
 * - Nullifier derivation
 * - Mock proof for rapid testing
 */

import { buildPoseidon } from 'circomlibjs';
// @ts-ignore
import * as snarkjs from 'snarkjs';

export interface SpendProof {
  proof: any;
  publicSignals: string[];
  nullifier: string;
  commitment: string;
}

export interface CircuitInputs {
  secret: bigint;
  amount: bigint;
  balance: bigint;
  merkleProof: bigint[];
  merkleRoot: bigint;
  recipient: string;
}

/**
 * Generate a Poseidon commitment
 * commitment = poseidon(secret, amount)
 */
export async function generateCommitment(secret: bigint, amount: bigint): Promise<bigint> {
  const poseidon = await buildPoseidon();
  const hash = poseidon.F.toString(poseidon([secret, amount]));
  return BigInt(hash);
}

/**
 * Generate nullifier to prevent double-spending
 * nullifier = poseidon(commitment, secret)
 */
export async function generateNullifier(commitment: bigint, secret: bigint): Promise<bigint> {
  const poseidon = await buildPoseidon();
  const hash = poseidon.F.toString(poseidon([commitment, secret]));
  return BigInt(hash);
}

/**
 * Generate ZK proof for private spend
 *
 * Circuit proves:
 * - User knows secret for commitment
 * - Balance >= amount
 * - Commitment is in Merkle tree
 * - Nullifier is correctly derived
 */
export async function generateSpendProof(
  inputs: CircuitInputs,
  useMock: boolean = true
): Promise<SpendProof> {
  if (useMock) {
    // HACKATHON MODE: Return mock proof for rapid development
    console.log('[ZK] Using MOCK proof - replace with real snarkjs in production');

    const commitment = await generateCommitment(inputs.secret, inputs.amount);
    const nullifier = await generateNullifier(commitment, inputs.secret);

    return {
      proof: {
        pi_a: ['0', '0', '0'],
        pi_b: [
          ['0', '0'],
          ['0', '0'],
          ['0', '0'],
        ],
        pi_c: ['0', '0', '0'],
        protocol: 'groth16',
        curve: 'bn128',
      },
      publicSignals: [nullifier.toString(), inputs.merkleRoot.toString(), inputs.amount.toString()],
      nullifier: nullifier.toString(),
      commitment: commitment.toString(),
    };
  }

  // PRODUCTION MODE: Real proof generation
  try {
    const wasmPath = '/circuits/spend.wasm';
    const zkeyPath = '/circuits/spend_final.zkey';

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      {
        secret: inputs.secret.toString(),
        amount: inputs.amount.toString(),
        balance: inputs.balance.toString(),
        merkleProof: inputs.merkleProof.map((p) => p.toString()),
        merkleRoot: inputs.merkleRoot.toString(),
        recipient: inputs.recipient,
      },
      wasmPath,
      zkeyPath
    );

    return {
      proof,
      publicSignals,
      nullifier: publicSignals[0],
      commitment: await generateCommitment(inputs.secret, inputs.amount).then((c) => c.toString()),
    };
  } catch (err) {
    console.error('[ZK] Proof generation failed:', err);
    throw new Error('Failed to generate ZK proof');
  }
}

/**
 * Format proof for Solana program
 * Anchor expects specific byte format
 */
export function serializeProofForSolana(proof: SpendProof): Buffer {
  // Convert proof to bytes format expected by Solana verifier
  const proofBytes = Buffer.alloc(256); // Groth16 proof size

  // In production, properly encode pi_a, pi_b, pi_c into 256 bytes
  // For hackathon, we send a mock buffer

  return proofBytes;
}

/**
 * Generate random secret for new commitment
 */
export function generateSecret(): bigint {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  return BigInt('0x' + Buffer.from(randomBytes).toString('hex'));
}

/**
 * Calculate Merkle proof path
 * Used to prove membership in compressed state tree
 */
export async function calculateMerklePath(commitment: bigint, tree: bigint[]): Promise<bigint[]> {
  const poseidon = await buildPoseidon();
  const path: bigint[] = [];

  // Simple binary tree proof
  // In production, use proper sparse Merkle tree
  let currentHash = commitment;

  for (let i = 0; i < tree.length; i++) {
    const sibling = tree[i];
    currentHash = BigInt(poseidon.F.toString(poseidon([currentHash, sibling])));
    path.push(sibling);
  }

  return path;
}
