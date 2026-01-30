'use client';

import { TreeStats } from '@/lib/light-compression';
import { BarChart3, Database, Zap } from 'lucide-react';

interface CompressionStatsProps {
  stats: TreeStats | null;
  isCompressing?: boolean;
}

export function CompressionStats({ stats, isCompressing }: CompressionStatsProps) {
  if (!stats) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
        <h3 className="text-lg font-bold text-white mb-4">Light Protocol Compression</h3>
        <div className="text-gray-400 text-sm">
          No compression data yet. Add a commitment to see stats.
        </div>
      </div>
    );
  }

  const compressionRatio = Math.round(stats.compressionRatio);
  const gasReduction = parseInt(stats.gasOptimization.split('%')[0]);
  const treeSizeKB = (stats.leafCount * 32 * (1 - stats.compressionRatio / 100)) / 1024;

  return (
    <div className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 backdrop-blur-sm rounded-xl border border-white/10 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-400" />
          Light Protocol Compression
        </h3>
        {isCompressing && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-blue-400">Compressing...</span>
          </div>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Leaves Count */}
        <div className="bg-black/20 rounded-lg p-4">
          <div className="text-xs text-gray-400 mb-1">Total Leaves</div>
          <div className="text-2xl font-bold text-cyan-400">{stats.leafCount}</div>
          <div className="text-xs text-gray-500 mt-1">in compressed tree</div>
        </div>

        {/* Compression Ratio */}
        <div className="bg-black/20 rounded-lg p-4">
          <div className="text-xs text-gray-400 mb-1">Compression</div>
          <div className="text-2xl font-bold text-green-400">{compressionRatio}%</div>
          <div className="text-xs text-gray-500 mt-1">space reduction</div>
        </div>

        {/* Gas Savings */}
        <div className="bg-black/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-3 h-3 text-yellow-400" />
            <span className="text-xs text-gray-400">Gas Savings</span>
          </div>
          <div className="text-2xl font-bold text-yellow-400">{gasReduction}%</div>
          <div className="text-xs text-gray-500 mt-1">per transaction</div>
        </div>

        {/* Merkle Depth */}
        <div className="bg-black/20 rounded-lg p-4">
          <div className="text-xs text-gray-400 mb-1">Tree Depth</div>
          <div className="text-2xl font-bold text-purple-400">20</div>
          <div className="text-xs text-gray-500 mt-1">~1M max leaves</div>
        </div>
      </div>

      {/* Storage Visualization */}
      <div className="bg-black/20 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            Storage Impact
          </h4>
        </div>

        {/* Uncompressed */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-400">Without Compression</span>
            <span className="text-xs font-mono text-gray-300">
              {((stats.leafCount * 32) / 1024).toFixed(2)} KB
            </span>
          </div>
          <div className="w-full h-2 bg-red-500/20 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 w-full"></div>
          </div>
        </div>

        {/* Compressed */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-400">With Light Protocol</span>
            <span className="text-xs font-mono text-gray-300">{treeSizeKB.toFixed(2)} KB</span>
          </div>
          <div className="w-full h-2 bg-green-500/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500"
              style={{ width: `${100 - compressionRatio}%` }}
            ></div>
          </div>
        </div>

        {/* Savings */}
        <div className="pt-2 border-t border-white/10">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-white">Savings</span>
            <span className="text-sm font-bold text-green-400">
              {((stats.leafCount * 32 * (compressionRatio / 100)) / 1024).toFixed(2)} KB
            </span>
          </div>
        </div>
      </div>

      {/* Root Hash */}
      <div className="bg-black/20 rounded-lg p-4">
        <div className="text-xs text-gray-400 mb-2">Merkle Root</div>
        <div className="font-mono text-xs text-cyan-400 break-all">
          {stats.root.slice(0, 16)}...{stats.root.slice(-16)}
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Used in ZK proof as on-chain state commitment
        </div>
      </div>

      {/* Benefits Summary */}
      <div className="mt-4 p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg border border-blue-500/20">
        <h4 className="text-sm font-semibold text-white mb-2">✨ Light Protocol Benefits</h4>
        <ul className="text-xs text-gray-300 space-y-1">
          <li>
            ✓ <strong>{compressionRatio}%</strong> smaller on-chain footprint
          </li>
          <li>
            ✓ <strong>{gasReduction}%</strong> cheaper transactions
          </li>
          <li>
            ✓ <strong>Instant</strong> merkle proof generation
          </li>
          <li>
            ✓ <strong>Scalable</strong> to millions of commitments
          </li>
        </ul>
      </div>
    </div>
  );
}
