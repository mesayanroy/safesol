/**
 * Compressed Tree Management
 *
 * This is a placeholder for Light Protocol tree operations.
 * In hackathon mode, we use simple mocked trees.
 * For production, integrate @lightprotocol/stateless.js
 */

export interface CompressedTree {
  root: string;
  depth: number;
  leaves: string[];
}

/**
 * Create a new compressed tree
 */
export function createTree(depth: number = 20): CompressedTree {
  return {
    root: '0x' + '0'.repeat(64),
    depth,
    leaves: [],
  };
}

/**
 * Add leaf to tree
 */
export function addLeaf(tree: CompressedTree, leaf: string): CompressedTree {
  return {
    ...tree,
    leaves: [...tree.leaves, leaf],
    // In production: recompute Merkle root
  };
}

/**
 * Get Merkle proof for leaf
 */
export function getProof(tree: CompressedTree, leaf: string): string[] {
  // Mock proof
  return Array(tree.depth).fill('0x' + '0'.repeat(64));
}
