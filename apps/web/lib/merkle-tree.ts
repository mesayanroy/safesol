/**
 * Merkle Tree Implementation for ZK Privacy
 *
 * Handles:
 * - Sparse Merkle Tree construction
 * - Merkle proof generation
 * - Path index calculation
 * - Root computation verification
 */

// @ts-ignore
import { buildPoseidon } from 'circomlibjs';

export interface MerkleProofData {
  leaf: bigint;
  path: bigint[];
  indices: number[];
  root: bigint;
}

/**
 * Hash function using Poseidon (efficient for ZK circuits)
 */
export async function poseidonHash(left: bigint, right: bigint): Promise<bigint> {
  const poseidon = await buildPoseidon();
  const hash = poseidon([left, right]);
  return BigInt(poseidon.F.toString(hash));
}

/**
 * Compute Merkle root from leaf and proof path
 * 
 * Works by traversing up the tree using sibling hashes
 */
export async function computeMerkleRoot(
  leaf: bigint,
  proof: bigint[],
  indices: number[]
): Promise<bigint> {
  if (proof.length !== indices.length) {
    throw new Error('Proof and indices length mismatch');
  }

  let current = leaf;

  for (let i = 0; i < proof.length; i++) {
    const sibling = proof[i];
    const isRight = indices[i] === 1;

    // Hash in correct order based on position
    current = await poseidonHash(
      isRight ? sibling : current,
      isRight ? current : sibling
    );
  }

  return current;
}

/**
 * Generate sparse Merkle proof
 * 
 * For a tree of depth N:
 * - Returns N siblings needed to prove membership
 * - Returns N path indices (0=left, 1=right)
 * 
 * Sparse trees can have leaves at any position
 * Path encodes the binary representation of the leaf's index
 */
export async function generateSparseProof(
  leafIndex: bigint,
  treeDepth: number,
  allLeaves: Map<number, bigint>
): Promise<{proof: bigint[], indices: number[]}> {
  const proof: bigint[] = [];
  const indices: number[] = [];

  let currentIndex = leafIndex;
  const poseidon = await buildPoseidon();

  for (let level = 0; level < treeDepth; level++) {
    // Get sibling index at this level
    const siblingIndex = currentIndex ^ 1n; // XOR with 1 to get sibling

    // Get sibling leaf (or use zero if doesn't exist)
    const sibling = allLeaves.get(Number(siblingIndex)) ?? BigInt(0);
    proof.push(sibling);

    // Record if this leaf is on right (1) or left (0)
    indices.push(Number(currentIndex & 1n));

    // Move up one level
    currentIndex = currentIndex >> 1n;
  }

  return { proof, indices };
}

/**
 * Merkle tree for managing commitment states
 */
export class MerkleTree {
  private leaves: Map<number, bigint> = new Map();
  private depth: number;
  private root: bigint;
  private nextIndex: number = 0;

  constructor(depth: number = 20) {
    this.depth = depth;
    this.root = BigInt(0);
  }

  /**
   * Add a leaf to the tree
   * Returns the leaf index
   */
  async addLeaf(leaf: bigint): Promise<number> {
    const index = this.nextIndex;
    this.leaves.set(index, leaf);
    this.nextIndex++;

    // Recompute root
    await this.computeRoot();

    console.log('[MerkleTree] Leaf added:', {
      index,
      leafHash: leaf.toString().slice(0, 16) + '...',
      totalLeaves: this.leaves.size,
      newRoot: this.root.toString().slice(0, 16) + '...',
    });

    return index;
  }

  /**
   * Get proof for a leaf
   */
  async getProof(leafIndex: number): Promise<MerkleProofData> {
    const leaf = this.leaves.get(leafIndex);
    if (!leaf) {
      throw new Error(`Leaf at index ${leafIndex} not found`);
    }

    const { proof, indices } = await generateSparseProof(
      BigInt(leafIndex),
      this.depth,
      this.leaves
    );

    return {
      leaf,
      path: proof,
      indices,
      root: this.root,
    };
  }

  /**
   * Recompute tree root from all leaves
   */
  private async computeRoot(): Promise<void> {
    if (this.leaves.size === 0) {
      this.root = BigInt(0);
      return;
    }

    // Build tree level by level
    let currentLevel = new Map(this.leaves);

    for (let level = 0; level < this.depth; level++) {
      const nextLevel = new Map<number, bigint>();

      // Combine pairs of nodes
      for (let i = 0; i < Math.pow(2, this.depth - level); i += 2) {
        const left = currentLevel.get(i) ?? BigInt(0);
        const right = currentLevel.get(i + 1) ?? BigInt(0);

        const parent = await poseidonHash(left, right);
        nextLevel.set(i / 2, parent);
      }

      currentLevel = nextLevel;
    }

    // The last remaining node is the root
    this.root = currentLevel.get(0) ?? BigInt(0);
  }

  /**
   * Get current tree root
   */
  getRoot(): bigint {
    return this.root;
  }

  /**
   * Get number of leaves
   */
  getLeafCount(): number {
    return this.leaves.size;
  }

  /**
   * Export tree state (for persistence)
   */
  exportState(): {leaves: Array<[number, string]>, root: string} {
    return {
      leaves: Array.from(this.leaves.entries()).map(([idx, leaf]) => [idx, leaf.toString()]),
      root: this.root.toString(),
    };
  }

  /**
   * Import tree state
   */
  async importState(state: {leaves: Array<[number, string]>, root: string}): Promise<void> {
    this.leaves.clear();
    for (const [idx, leaf] of state.leaves) {
      this.leaves.set(idx, BigInt(leaf));
      this.nextIndex = Math.max(this.nextIndex, idx + 1);
    }
    await this.computeRoot();
    console.log('[MerkleTree] State imported, root:', this.root.toString().slice(0, 16) + '...');
  }
}

/**
 * Verify a Merkle proof locally
 * Used before submitting transaction to ensure proof is valid
 */
export async function verifyMerkleProof(
  leaf: bigint,
  proof: bigint[],
  indices: number[],
  root: bigint
): Promise<boolean> {
  try {
    const computedRoot = await computeMerkleRoot(leaf, proof, indices);
    const isValid = computedRoot === root;
    
    console.log('[MerkleTree] Proof verification:', {
      isValid,
      proofDepth: proof.length,
      leaf: leaf.toString().slice(0, 16) + '...',
      expectedRoot: root.toString().slice(0, 16) + '...',
      computedRoot: computedRoot.toString().slice(0, 16) + '...',
    });

    return isValid;
  } catch (err) {
    console.error('[MerkleTree] Proof verification failed:', err);
    return false;
  }
}
