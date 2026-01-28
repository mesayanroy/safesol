// Dev Tools page with API documentation and testing tools
'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { generateSecret, generateCommitment, generateNullifier } from '@/lib/zk';

export default function DevToolsPage() {
  const { publicKey } = useWallet();
  const [activeTab, setActiveTab] = useState<'docs' | 'tester'>('docs');
  const [secret, setSecret] = useState('');
  const [amount, setAmount] = useState('');
  const [commitment, setCommitment] = useState('');
  const [nullifier, setNullifier] = useState('');
  const [testing, setTesting] = useState(false);

  const generateTestProof = async () => {
    if (!secret || !amount) {
      alert('Please enter secret and amount');
      return;
    }

    setTesting(true);
    try {
      const secretBig = BigInt(secret);
      const amountBig = BigInt(amount);

      const comm = await generateCommitment(secretBig, amountBig);
      const null_ = await generateNullifier(comm, secretBig);

      setCommitment(comm.toString());
      setNullifier(null_.toString());
    } catch (err) {
      console.error('Error:', err);
      alert('Error generating proof');
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="heading-xl mb-2">Developer Tools</h1>
          <p className="text-muted">API documentation and proof testing utilities for ZK privacy payments</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-4 mb-8 border-b border-slate-700">
          <button
            onClick={() => setActiveTab('docs')}
            className={`px-4 py-2 font-medium border-b-2 transition-all duration-300 ${
              activeTab === 'docs'
                ? 'border-blue-500 text-blue-400 shadow-lg shadow-blue-500/20'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            API Documentation
          </button>
          <button
            onClick={() => setActiveTab('tester')}
            className={`px-4 py-2 font-medium border-b-2 transition-all duration-300 ${
              activeTab === 'tester'
                ? 'border-blue-500 text-blue-400 shadow-lg shadow-blue-500/20'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            Proof Tester
          </button>
        </div>

        {/* API Docs Tab */}
        {activeTab === 'docs' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <ApiEndpoint
              method="POST"
              endpoint="/api/proof/generate"
              title="Generate ZK Proof"
              description="Generate a zero-knowledge proof for a private payment"
              requestBody={{
                secret: 'bigint (32 bytes)',
                amount: 'u64 (in lamports)',
                balance: 'u64 (in lamports)',
              }}
              responseBody={{
                proof: 'object',
                publicSignals: '[bigint]',
                nullifier: 'bigint',
              }}
              example={{
                request: {
                  secret: '12345678901234567890123456789012',
                  amount: '1000000000',
                  balance: '100000000000',
                },
                response: {
                  proof: { pi_a: 'uint256[2]', pi_b: 'uint256[4]', pi_c: 'uint256[2]' },
                  publicSignals: ['12345', '67890', '11111'],
                  nullifier: '99999',
                },
              }}
            />

            <ApiEndpoint
              method="POST"
              endpoint="/api/proof/verify"
              title="Verify ZK Proof"
              description="Verify a zero-knowledge proof on-chain"
              requestBody={{
                proof: 'Buffer (256 bytes)',
                publicSignals: '[bigint]',
              }}
              responseBody={{
                valid: 'boolean',
                message: 'string',
              }}
            />

            <ApiEndpoint
              method="GET"
              endpoint="/api/transactions/{walletAddress}"
              title="Get Transaction History"
              description="Fetch all private transactions for a wallet"
              responseBody={{
                transactions: 'Transaction[]',
                count: 'number',
                totalVolume: 'u64',
              }}
            />

            <ApiEndpoint
              method="POST"
              endpoint="/api/payment/send"
              title="Send Private Payment"
              description="Submit a private payment transaction to Solana"
              requestBody={{
                proof: 'SpendProof',
                amount: 'u64',
                recipient: 'PublicKey',
              }}
              responseBody={{
                signature: 'string',
                status: 'pending | confirmed | failed',
              }}
            />
          </div>
        )}

        {/* Proof Tester Tab */}
        {activeTab === 'tester' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="card-elevated p-8">
              <h3 className="heading-md mb-6">Proof Generation Tester</h3>

              <div className="space-y-6">
                {/* Secret Input */}
                <div>
                  <label className="text-label">
                    Secret (hex)
                  </label>
                  <input
                    type="text"
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    placeholder="e.g., 12345678901234567890123456789012"
                    className="w-full mt-2 bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all duration-300"
                  />
                  <button
                    onClick={() => setSecret(generateSecret().toString().padStart(32, '0'))}
                    className="mt-2 text-sm text-blue-400 hover:text-blue-300 transition-colors duration-200"
                  >
                    ✨ Generate random
                  </button>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="text-label">
                    Amount (lamports)
                  </label>
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g., 1000000000"
                    className="w-full mt-2 bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all duration-300"
                  />
                </div>

                {/* Generate Button */}
                <button
                  onClick={generateTestProof}
                  disabled={testing || !secret || !amount}
                  className="w-full button-primary disabled:bg-slate-600 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {testing ? '⏳ Generating...' : '🚀 Generate Proof'}
                </button>

                {/* Results */}
                {commitment && (
                  <div className="space-y-4 mt-8 pt-8 border-t border-slate-700">
                    <div>
                      <label className="text-label">
                        Commitment
                      </label>
                      <code className="block mt-2 bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-green-400 text-sm break-all font-mono">
                        {commitment}
                      </code>
                    </div>
                    <div>
                      <label className="text-label">
                        Nullifier
                      </label>
                      <code className="block mt-2 bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-green-400 text-sm break-all font-mono">
                        {nullifier}
                      </code>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Circuit Info */}
            <div className="card-elevated p-8">
              <h3 className="heading-md mb-6">Circuit Information</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-start pb-4 border-b border-slate-700">
                  <span className="text-label">Algorithm</span>
                  <span className="text-white font-medium">Groth16 (BN128)</span>
                </div>
                <div className="flex justify-between items-start pb-4 border-b border-slate-700">
                  <span className="text-label">Hash Function</span>
                  <span className="text-white font-medium">Poseidon</span>
                </div>
                <div className="flex justify-between items-start pb-4 border-b border-slate-700">
                  <span className="text-label">Proof Size</span>
                  <span className="text-white font-medium">726 bytes (JSON)</span>
                </div>
                <div className="flex justify-between items-start pb-4 border-b border-slate-700">
                  <span className="text-label">Generation Time</span>
                  <span className="text-white font-medium">~400ms</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-label">Public Signals</span>
                  <span className="text-white font-medium">3 (nullifier, secret, amount)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ApiEndpoint({
  method,
  endpoint,
  title,
  description,
  requestBody,
  responseBody,
  example,
}: {
  method: string;
  endpoint: string;
  title: string;
  description: string;
  requestBody?: Record<string, string>;
  responseBody?: Record<string, string>;
  example?: any;
}) {
  const [expanded, setExpanded] = useState(false);

  const methodColor = {
    GET: 'bg-blue-900/50 text-blue-300',
    POST: 'bg-green-900/50 text-green-300',
    PUT: 'bg-yellow-900/50 text-yellow-300',
    DELETE: 'bg-red-900/50 text-red-300',
  }[method] || 'bg-slate-900/50 text-slate-300';

  return (
    <div className="card-elevated overflow-hidden transition-all duration-300">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors duration-300"
      >
        <div className="text-left">
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-3 py-1 rounded font-medium text-sm ${methodColor}`}>
              {method}
            </span>
            <code className="text-slate-300 font-mono text-sm">{endpoint}</code>
          </div>
          <p className="text-muted">{description}</p>
        </div>
        <div className={`text-slate-400 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}>
          ▼
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-700 px-6 py-4 space-y-4 bg-slate-900/20 animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="heading-md">{title}</p>

          {requestBody && (
            <div>
              <p className="text-label mb-3">Request Body:</p>
              <pre className="bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-slate-300 text-xs overflow-auto font-mono">
                {JSON.stringify(requestBody, null, 2)}
              </pre>
            </div>
          )}

          {responseBody && (
            <div>
              <p className="text-label mb-3">Response:</p>
              <pre className="bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-slate-300 text-xs overflow-auto font-mono">
                {JSON.stringify(responseBody, null, 2)}
              </pre>
            </div>
          )}

          {example && (
            <div>
              <p className="text-label mb-3">Example:</p>
              <pre className="bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-green-400 text-xs overflow-auto font-mono">
                {JSON.stringify(example, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
