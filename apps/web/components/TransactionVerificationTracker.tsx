'use client';

import { useState } from 'react';
import { CheckCircle2, Clock, Loader2, AlertCircle } from 'lucide-react';

export interface VerificationStep {
  id: string;
  label: string;
  description: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  timestamp?: number;
  data?: any;
}

interface TransactionVerificationTrackerProps {
  steps: VerificationStep[];
  transactionSignature?: string;
}

export function TransactionVerificationTracker({
  steps,
  transactionSignature,
}: TransactionVerificationTrackerProps) {
  return (
    <div className="w-full max-w-3xl mx-auto bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">Transaction Verification</h3>
        {transactionSignature && (
          <a
            href={`https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-purple-400 hover:text-purple-300 underline"
          >
            View on Explorer ↗
          </a>
        )}
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`relative flex items-start space-x-4 p-4 rounded-lg transition-all ${
              step.status === 'complete'
                ? 'bg-green-500/10 border border-green-500/20'
                : step.status === 'processing'
                ? 'bg-purple-500/10 border border-purple-500/20 animate-pulse'
                : step.status === 'error'
                ? 'bg-red-500/10 border border-red-500/20'
                : 'bg-gray-500/5 border border-gray-500/10'
            }`}
          >
            {/* Status Icon */}
            <div className="flex-shrink-0 mt-1">
              {step.status === 'complete' && <CheckCircle2 className="w-6 h-6 text-green-400" />}
              {step.status === 'processing' && (
                <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
              )}
              {step.status === 'pending' && <Clock className="w-6 h-6 text-gray-400" />}
              {step.status === 'error' && <AlertCircle className="w-6 h-6 text-red-400" />}
            </div>

            {/* Step Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4
                  className={`text-sm font-semibold ${
                    step.status === 'complete'
                      ? 'text-green-300'
                      : step.status === 'processing'
                      ? 'text-purple-300'
                      : step.status === 'error'
                      ? 'text-red-300'
                      : 'text-gray-400'
                  }`}
                >
                  Layer {index + 1}: {step.label}
                </h4>
                {step.timestamp && (
                  <span className="text-xs text-gray-500">
                    {new Date(step.timestamp).toLocaleTimeString()}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400 mt-1">{step.description}</p>

              {/* Additional Data */}
              {step.data && step.status === 'complete' && (
                <div className="mt-2 p-2 bg-black/20 rounded text-xs font-mono text-gray-300 overflow-x-auto">
                  {typeof step.data === 'string' ? (
                    step.data
                  ) : (
                    <pre>{JSON.stringify(step.data, null, 2)}</pre>
                  )}
                </div>
              )}
            </div>

            {/* Connecting Line */}
            {index < steps.length - 1 && (
              <div
                className={`absolute left-7 top-14 w-0.5 h-8 ${
                  step.status === 'complete' ? 'bg-green-500/30' : 'bg-gray-500/20'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-black/20 rounded-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-white">
              {steps.filter((s) => s.status === 'complete').length}
            </div>
            <div className="text-xs text-gray-400">Completed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-400">
              {steps.filter((s) => s.status === 'processing').length}
            </div>
            <div className="text-xs text-gray-400">Processing</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-400">
              {steps.filter((s) => s.status === 'pending').length}
            </div>
            <div className="text-xs text-gray-400">Pending</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-400">
              {steps.filter((s) => s.status === 'error').length}
            </div>
            <div className="text-xs text-gray-400">Errors</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook for managing verification steps
export function useVerificationSteps() {
  const [steps, setSteps] = useState<VerificationStep[]>([
    {
      id: 'compression',
      label: 'Merkle Tree Compression',
      description: 'Compressing commitment in Light Protocol (99.5% smaller)',
      status: 'pending',
    },
    {
      id: 'proof-gen',
      label: 'ZK Proof Generation',
      description: 'Generating zero-knowledge proof client-side (288 bytes)',
      status: 'pending',
    },
    {
      id: 'merkle-root',
      label: 'Merkle Root Verification',
      description: 'Verifying commitment exists in compressed tree',
      status: 'pending',
    },
    {
      id: 'zk-verify',
      label: 'ZK Proof Verification',
      description: 'On-chain Groth16 proof validation',
      status: 'pending',
    },
    {
      id: 'nullifier',
      label: 'Nullifier Check',
      description: 'Preventing double-spend attack',
      status: 'pending',
    },
    {
      id: 'payment',
      label: 'Payment Execution',
      description: 'Transferring SOL to recipient',
      status: 'pending',
    },
  ]);

  const updateStep = (id: string, updates: Partial<VerificationStep>) => {
    setSteps((prev) =>
      prev.map((step) => (step.id === id ? { ...step, ...updates, timestamp: Date.now() } : step))
    );
  };

  const resetSteps = () => {
    setSteps((prev) =>
      prev.map((step) => ({ ...step, status: 'pending', timestamp: undefined, data: undefined }))
    );
  };

  return { steps, updateStep, resetSteps };
}
