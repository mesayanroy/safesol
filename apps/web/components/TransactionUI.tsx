// Enhanced transaction UI showing step-by-step process
'use client';

import { useState } from 'react';
import { getExplorerUrl } from '@/lib/solana';

export interface TransactionStep {
  id: string;
  label: string;
  description: string;
  status: 'idle' | 'active' | 'complete' | 'error';
  error?: string;
  data?: string;
}

interface TransactionUIProps {
  steps: TransactionStep[];
  txSignature?: string;
  merkleRoot?: string;
  loading: boolean;
}

export function TransactionUI({ steps, txSignature, merkleRoot, loading }: TransactionUIProps) {
  const completedCount = steps.filter((s) => s.status === 'complete').length;
  const totalCount = steps.length;

  return (
    <div className="fixed bottom-0 right-0 w-full sm:w-96 bg-slate-900 border-t border-l border-slate-800 shadow-2xl rounded-tl-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-white">Transaction Progress</h3>
          <p className="text-sm text-blue-100">
            {completedCount} of {totalCount} steps
          </p>
        </div>
        <div className="text-2xl">{getStepIcon(completedCount, totalCount)}</div>
      </div>

      {/* Progress Bar */}
      <div className="px-6 py-3 bg-slate-800">
        <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="px-6 py-4 space-y-3 max-h-64 overflow-y-auto">
        {steps.map((step, index) => (
          <TransactionStep key={step.id} step={step} index={index} totalSteps={totalCount} />
        ))}
      </div>

      {/* Result */}
      {txSignature && (
        <div className="px-6 py-4 border-t border-slate-800 bg-green-900/20 border-b border-green-700">
          <div className="space-y-3">
            <p className="text-sm font-medium text-green-400">✓ Transaction Confirmed</p>
            <a
              href={getExplorerUrl(txSignature)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block w-full text-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition"
            >
              View on Explorer
            </a>
            <code className="block bg-slate-800 rounded px-3 py-2 text-xs text-green-400 break-all">
              {txSignature.slice(0, 20)}...{txSignature.slice(-20)}
            </code>
            {merkleRoot && (
              <div className="mt-2">
                <p className="text-xs text-slate-400 mb-1">Merkle Root:</p>
                <code className="block bg-slate-800 rounded px-3 py-2 text-xs text-blue-400 break-all">
                  {merkleRoot}
                </code>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error State */}
      {steps.some((s) => s.status === 'error') && !txSignature && (
        <div className="px-6 py-4 border-t border-slate-800 bg-red-900/20 border-b border-red-700">
          {steps
            .filter((s) => s.status === 'error')
            .map((step) => (
              <div key={step.id} className="space-y-2">
                <p className="text-sm font-medium text-red-400">✗ {step.label}</p>
                {step.error && (
                  <p className="text-xs text-red-300 bg-slate-800 rounded px-3 py-2">
                    {step.error}
                  </p>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function TransactionStep({
  step,
  index,
  totalSteps,
}: {
  step: TransactionStep;
  index: number;
  totalSteps: number;
}) {
  const isActive = step.status === 'active';
  const isComplete = step.status === 'complete';
  const isError = step.status === 'error';

  const bgColor = isComplete
    ? 'bg-green-900/20 border-green-700'
    : isError
    ? 'bg-red-900/20 border-red-700'
    : isActive
    ? 'bg-blue-900/20 border-blue-700'
    : 'bg-slate-800 border-slate-700';

  const textColor = isComplete
    ? 'text-green-400'
    : isError
    ? 'text-red-400'
    : isActive
    ? 'text-blue-400'
    : 'text-slate-400';

  return (
    <div className={`border rounded-lg p-3 transition ${bgColor}`}>
      <div className="flex items-start gap-3">
        {/* Status Icon */}
        <div
          className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
            isComplete
              ? 'bg-green-600 text-white'
              : isError
              ? 'bg-red-600 text-white'
              : isActive
              ? 'bg-blue-600 text-white animate-pulse'
              : 'bg-slate-700 text-slate-400'
          }`}
        >
          {isComplete ? '✓' : isError ? '✗' : isActive ? '⋯' : index + 1}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${textColor}`}>{step.label}</p>
          {step.description && <p className="text-xs text-slate-400 mt-1">{step.description}</p>}
          {isError && step.error && (
            <p className="text-xs text-red-400 mt-1 break-all">{step.error}</p>
          )}
        </div>

        {/* Animation */}
        {isActive && (
          <div className="flex-shrink-0">
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}

function getStepIcon(completed: number, total: number): string {
  if (completed === total) return '✓';
  if (completed === 0) return '⏳';
  return `${completed}/${total}`;
}
