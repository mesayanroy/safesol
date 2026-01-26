/**
 * Proof Verification Helpers
 * 
 * Utilities for verifying Merkle proofs locally
 * before submitting to chain
 */

import { buildPoseidon } from 'circomlibjs';

export async function verifyMerkleProof(
  leaf: string,
  proof: string[],
  root: string
): Promise<boolean> {
  const poseidon = await buildPoseidon();
  
  let currentHash = BigInt(leaf);
  
  for (const sibling of proof) {
    currentHash = BigInt(
      poseidon.F.toString(
        poseidon([currentHash, BigInt(sibling)])
      )
    );
  }
  
  return currentHash.toString() === root;
}
