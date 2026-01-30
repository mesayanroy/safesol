'use client';

import { useState, useCallback } from 'react';
import { CompressedMerkleTree, TreeStats } from '@/lib/light-compression';

export interface CompressionState {
  isCompressing: boolean;
  treeStats: TreeStats | null;
  compressionRatio: string;
  gasOptimization: string;
  leafCount: number;
}

/**
 * Hook for managing Light Protocol tree compression
 *
 * Tracks:
 * - Real-time merkle tree state
 * - Compression statistics
 * - Gas optimization metrics
 */
export function useTreeCompression() {
  const [tree] = useState(() => new CompressedMerkleTree(20));
  const [state, setState] = useState<CompressionState>({
    isCompressing: false,
    treeStats: null,
    compressionRatio: '0%',
    gasOptimization: '0%',
    leafCount: 0,
  });

  const addCommitment = useCallback(
    async (commitment: bigint) => {
      setState((prev) => ({ ...prev, isCompressing: true }));

      try {
        // Add to compressed tree
        const leafIndex = tree.addLeaf(commitment);

        // Get updated stats
        const stats = tree.getStats();

        setState((prev) => ({
          ...prev,
          isCompressing: false,
          treeStats: stats,
          compressionRatio: tree.getCompressionRatio(),
          gasOptimization: tree.getGasOptimization(),
          leafCount: tree.getLeafCount(),
        }));

        console.log('[Compression Hook] Commitment added:', {
          leafIndex,
          stats,
        });

        return leafIndex;
      } catch (error) {
        console.error('[Compression Hook] Error adding commitment:', error);
        setState((prev) => ({ ...prev, isCompressing: false }));
        throw error;
      }
    },
    [tree]
  );

  const getProof = useCallback(
    (leafIndex: number) => {
      try {
        const proof = tree.getProof(leafIndex);
        return {
          root: proof.root.toString(16).padStart(64, '0'),
          path: proof.path.map((p) => p.toString(16).padStart(64, '0')),
          indices: proof.indices,
        };
      } catch (error) {
        console.error('[Compression Hook] Error getting proof:', error);
        throw error;
      }
    },
    [tree]
  );

  const getStats = useCallback(() => {
    return tree.getStats();
  }, [tree]);

  const resetTree = useCallback(() => {
    // Create new tree instance
    const newTree = new CompressedMerkleTree(20);
    setState({
      isCompressing: false,
      treeStats: null,
      compressionRatio: '0%',
      gasOptimization: '0%',
      leafCount: 0,
    });
  }, []);

  return {
    ...state,
    addCommitment,
    getProof,
    getStats,
    resetTree,
    tree,
  };
}

/**
 * Format compression metrics for display
 */
export function formatCompressionMetrics(stats: TreeStats | null) {
  if (!stats) {
    return {
      leaves: '0',
      ratio: '0%',
      gasReduction: '0%',
      rootPreview: '0x0000...',
    };
  }

  return {
    leaves: stats.leafCount.toString(),
    ratio: stats.compressionRatio.toFixed(2) + '%',
    gasReduction: stats.gasOptimization.split('%')[0],
    rootPreview: '0x' + stats.root.slice(0, 8) + '...',
  };
}

/**
 * Calculate storage savings from compression
 */
export function calculateStorageSavings(
  leafCount: number,
  treeDepth: number = 20
): {
  uncompressed: number;
  compressed: number;
  saved: number;
  savedPercent: number;
} {
  const perLeafSize = 32; // bytes
  const proofSize = treeDepth * 32; // merkle proof

  const uncompressed = leafCount * perLeafSize;
  const compressed = proofSize; // Only store proof per transaction
  const saved = uncompressed - compressed;
  const savedPercent = (saved / uncompressed) * 100;

  return {
    uncompressed,
    compressed,
    saved,
    savedPercent,
  };
}
