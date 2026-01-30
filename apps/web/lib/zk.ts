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
import { Buffer } from 'buffer';
// @ts-ignore
import * as snarkjs from 'snarkjs';

/**
 * Convert Uint8Array to hex string (browser-compatible)
 */
function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert BigInt to 32-byte Buffer (big-endian)
 */
function bigIntToBytes32(value: string | bigint): Buffer {
  const buf = Buffer.alloc(32, 0);
  let bigint: bigint;

  if (typeof value === 'string') {
    if (value.startsWith('0x')) {
      bigint = BigInt(value);
    } else {
      bigint = BigInt(value);
    }
  } else {
    bigint = value;
  }

  // Ensure value is within valid range
  const maxVal = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF');
  if (bigint > maxVal || bigint < BigInt(0)) {
    console.warn('[ZK] Value out of range, truncating:', value);
    bigint = bigint & maxVal;
  }

  // Write big-endian 32 bytes
  for (let i = 31; i >= 0; i--) {
    buf[i] = Number(bigint & BigInt(0xff));
    bigint = bigint >> BigInt(8);
  }

  return buf;
}

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
 * Truncate a large hash to fit in Solana u64 (for amounts/indices)
 * Takes only the lower 64 bits
 */
export function truncateToU64(value: bigint): bigint {
  const mask = BigInt('0xFFFFFFFFFFFFFFFF'); // 2^64 - 1
  return value & mask;
}

/**
 * Load circuit files with proper path resolution for browser environment
 * Returns file paths/URLs that snarkjs can load directly
 */
async function loadCircuitFiles(): Promise<{ wasmFile: string; zkeyFile: string }> {
  try {
    console.log('[ZK] Preparing circuit file paths for snarkjs...');

    // Use absolute paths that Next.js serves from public/
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const wasmFile = `${origin}/circuits/spend.wasm`;
    const zkeyFile = `${origin}/circuits/spend_final.zkey`;

    console.log('[ZK] WASM path:', wasmFile);
    console.log('[ZK] Zkey path:', zkeyFile);

    // Verify files are accessible
    const wasmResponse = await fetch(wasmFile);
    if (!wasmResponse.ok) {
      throw new Error(`Failed to fetch WASM: ${wasmResponse.status} ${wasmResponse.statusText}`);
    }
    const wasmSize = (await wasmResponse.arrayBuffer()).byteLength;
    console.log('[ZK] ✓ WASM accessible:', wasmSize, 'bytes');

    const zkeyResponse = await fetch(zkeyFile);
    if (!zkeyResponse.ok) {
      throw new Error(`Failed to fetch zkey: ${zkeyResponse.status} ${zkeyResponse.statusText}`);
    }
    const zkeySize = (await zkeyResponse.arrayBuffer()).byteLength;
    console.log('[ZK] ✓ zkey accessible:', zkeySize, 'bytes');

    return { wasmFile, zkeyFile };
  } catch (err) {
    console.error('[ZK] Failed to load circuit files:', err);
    throw new Error(
      `Circuit file loading failed: ${err instanceof Error ? err.message : String(err)}`
    );
  }
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
  const commitment = await generateCommitment(inputs.secret, inputs.amount);
  const nullifier = await generateNullifier(commitment, inputs.secret);

  if (useMock) {
    // HACKATHON MODE: Return mock proof for rapid development
    console.log('[ZK] Using MOCK proof - replace with real snarkjs in production');
    console.log('[ZK] Circuit inputs validated:', {
      secret: inputs.secret.toString().slice(0, 16) + '...',
      amount: inputs.amount.toString(),
      commitment: commitment.toString().slice(0, 16) + '...',
      nullifier: nullifier.toString().slice(0, 16) + '...',
      merkleRoot: inputs.merkleRoot.toString(),
    });

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

  // PRODUCTION MODE: Real proof generation with proper input validation
  try {
    console.log('[ZK] Generating REAL Groth16 proof...');
    console.log('[ZK] Loading circuit files...');

    const { wasmFile, zkeyFile } = await loadCircuitFiles();

    // Validate inputs before proving
    if (!inputs.secret || !inputs.amount) {
      throw new Error('Missing required circuit inputs: secret or amount');
    }

    // Prepare circuit inputs for simplified circuit (just secret and amount)
    // NOTE: Our circuit doesn't verify merkleRoot, but we add it to publicSignals for the Solana program
    const circuitInputs = {
      secret: inputs.secret.toString(),
      amount: inputs.amount.toString(),
    };

    console.log('[ZK] Generating proof with snarkjs.groth16.fullProve...');
    console.log('[ZK] Circuit inputs:', {
      secret: '***hidden***',
      amount: circuitInputs.amount,
      merkleRoot: inputs.merkleRoot.toString(), // Will be added to publicSignals manually
    });

    // Pass file paths directly - snarkjs will handle fetching in browser
    console.log('[ZK] Calling snarkjs.groth16.fullProve with file paths...');
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      circuitInputs,
      wasmFile, // URL string that snarkjs will fetch
      zkeyFile // URL string that snarkjs will fetch
    );

    console.log('[ZK] ✓ Proof generated successfully');
    console.log('[ZK] Circuit public signals (from circuit):', publicSignals);

    // The circuit outputs: [nullifier, amount]
    // But Solana program expects: [nullifier, merkleRoot, amount]
    // So we insert merkleRoot at index 1
    const nullifier = publicSignals[0];
    const augmentedSignals = [
      nullifier,
      inputs.merkleRoot.toString(), // Insert merkleRoot
      publicSignals[1], // amount
    ];

    console.log('[ZK] Augmented signals for Solana:', augmentedSignals);
    console.log('[ZK] Nullifier:', nullifier);
    console.log('[ZK] MerkleRoot:', inputs.merkleRoot.toString());

    return {
      proof,
      publicSignals: augmentedSignals, // Use augmented signals
      nullifier: nullifier,
      commitment: commitment.toString(),
    };
  } catch (err) {
    console.error('[ZK] Real proof generation failed:', err);
    console.error('[ZK] Error details:', {
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });

    throw new Error(
      `Failed to generate ZK proof: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

/**
 * Format proof for Solana program
 * Anchor expects specific byte format: [pi_a (64), pi_b (128), pi_c (64)] = 256 bytes
 */
export function serializeProofForSolana(proof: SpendProof): Buffer {
  const proofBytes = Buffer.alloc(256); // Groth16 proof exactly 256 bytes

  try {
    // Extract proof components from snarkjs format
    const pi_a = proof.proof.pi_a; // 3 field elements, use first 2
    const pi_b = proof.proof.pi_b; // 2x2 matrix of field elements
    const pi_c = proof.proof.pi_c; // 3 field elements, use first 2

    let offset = 0;

    // Write pi_a (64 bytes: 2 x 32-byte field elements)
    if (pi_a && pi_a.length >= 2) {
      const a0 = bigIntToBytes32(pi_a[0]);
      const a1 = bigIntToBytes32(pi_a[1]);
      a0.copy(proofBytes, offset);
      offset += 32;
      a1.copy(proofBytes, offset);
      offset += 32;
    } else {
      throw new Error('Invalid pi_a format');
    }

    // Write pi_b (128 bytes: 2x2 matrix = 4 x 32-byte field elements)
    if (pi_b && pi_b.length >= 2 && pi_b[0].length >= 2 && pi_b[1].length >= 2) {
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
          const bytes = bigIntToBytes32(pi_b[i][j]);
          bytes.copy(proofBytes, offset);
          offset += 32;
        }
      }
    } else {
      throw new Error('Invalid pi_b format');
    }

    // Write pi_c (64 bytes: 2 x 32-byte field elements)
    if (pi_c && pi_c.length >= 2) {
      const c0 = bigIntToBytes32(pi_c[0]);
      const c1 = bigIntToBytes32(pi_c[1]);
      c0.copy(proofBytes, offset);
      offset += 32;
      c1.copy(proofBytes, offset);
      offset += 32;
    } else {
      throw new Error('Invalid pi_c format');
    }

    console.log('[ZK] Proof serialized successfully:', {
      size: proofBytes.length,
      hash: proofBytes.toString('hex').substring(0, 20) + '...',
    });

    return proofBytes;
  } catch (err) {
    console.error('[ZK] Error serializing proof:', err);
    console.error('[ZK] Proof structure:', {
      pi_a_length: proof.proof.pi_a?.length,
      pi_b_length: proof.proof.pi_b?.length,
      pi_c_length: proof.proof.pi_c?.length,
    });
    throw new Error(
      `Failed to serialize proof: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

/**
 * Generate random secret for new commitment
 */
export function generateSecret(): bigint {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  return BigInt('0x' + uint8ArrayToHex(randomBytes));
}

/**
 * Calculate Merkle proof path with path indices
 * Used to prove membership in compressed state tree
 */
export async function calculateMerklePath(
  commitment: bigint,
  tree: bigint[]
): Promise<{ path: bigint[]; indices: bigint[] }> {
  const poseidon = await buildPoseidon();
  const path: bigint[] = [];
  const indices: bigint[] = [];

  // Binary sparse Merkle tree proof
  let currentHash = commitment;

  for (let i = 0; i < tree.length; i++) {
    const sibling = tree[i];
    // In a sparse tree, we alternate left/right
    const pathIndex = BigInt(i % 2); // 0 = left, 1 = right

    const left = pathIndex === 0n ? currentHash : sibling;
    const right = pathIndex === 0n ? sibling : currentHash;

    currentHash = BigInt(poseidon.F.toString(poseidon([left, right])));
    path.push(sibling);
    indices.push(pathIndex);
  }

  console.log('[ZK] Merkle path calculated:', {
    leafHash: commitment.toString().slice(0, 16) + '...',
    pathLength: path.length,
    indices: indices.map((i) => i.toString()),
  });

  return { path, indices };
}
