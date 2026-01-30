'use client';

import { FC, useState } from 'react';
import { ChevronDown, Shield, CheckCircle2, Zap, Lock } from 'lucide-react';

interface GuaranteeItem {
  title: string;
  description: string;
  type: 'cryptographic' | 'on-chain' | 'abstracted';
}

const guarantees: GuaranteeItem[] = [
  // Cryptographically Enforced
  {
    type: 'cryptographic',
    title: 'ZK Proof Generation (Groth16 / Circom)',
    description:
      'Off-chain zero-knowledge proofs generated and verified using industry-standard Groth16 proving system. Proof correctness is mathematically verifiable.',
  },
  {
    type: 'cryptographic',
    title: 'Balance Constraint (≥ Amount)',
    description:
      'ZK circuit enforces sender has sufficient balance before transaction. Constraint is baked into the proof, not just checked in software.',
  },
  {
    type: 'cryptographic',
    title: 'Commitment Correctness',
    description:
      'Poseidon hash ensures commitment integrity. Sender cannot change commitment post-generation without invalidating the ZK proof.',
  },
  {
    type: 'cryptographic',
    title: 'Nullifier Uniqueness (Double-Spend Prevention)',
    description:
      'Unique nullifier derived from secret and commitment. Replay or double-spend attempts generate different nullifiers, preventing tx duplication.',
  },

  // On-Chain (Solana)
  {
    type: 'on-chain',
    title: 'Transaction Execution via Solana Consensus',
    description:
      'All txs finalized via Solana validators. On-chain state updates require cryptographic signatures and validator agreement.',
  },
  {
    type: 'on-chain',
    title: 'Real SOL Balance Updates (Devnet)',
    description:
      'Actual Solana devnet balance changes. Transfers are irreversible after finalization unless explicitly reversed by on-chain program.',
  },
  {
    type: 'on-chain',
    title: 'Merkle Root State Transition',
    description:
      'Merkle root stored in PDA (Program Derived Address). State transitions logged on-chain and verifiable via block explorer.',
  },
  {
    type: 'on-chain',
    title: 'PDA-Based State Protection',
    description:
      'Program owns state account. Only authorized programs can modify root. Prevents unauthorized state mutations.',
  },

  // Abstracted but Real
  {
    type: 'abstracted',
    title: 'ZK Proof Verification (Upgradeable)',
    description:
      'Verifier logic encapsulated in Solana program. Demo uses placeholder; production uses Groth16 verifier contract. Upgradeable without breaking state.',
  },
  {
    type: 'abstracted',
    title: 'Selective Disclosure (Receipt Reuse)',
    description:
      'Privacy receipt contains cryptographic commitments (Merkle root, proof hash, nullifier). Auditors can verify without exposing transaction details.',
  },
];

const GuaranteeCard: FC<{ item: GuaranteeItem }> = ({ item }) => {
  const typeConfig = {
    cryptographic: {
      icon: Shield,
      label: 'Cryptographically Enforced',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
      borderColor: 'border-blue-200 dark:border-blue-800',
      textColor: 'text-blue-900 dark:text-blue-100',
      badgeColor: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
      emoji: '✅',
    },
    'on-chain': {
      icon: Zap,
      label: 'Enforced On-Chain (Solana)',
      bgColor: 'bg-green-50 dark:bg-green-950',
      borderColor: 'border-green-200 dark:border-green-800',
      textColor: 'text-green-900 dark:text-green-100',
      badgeColor: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
      emoji: '⚡',
    },
    abstracted: {
      icon: Lock,
      label: 'Abstracted but Real (Demo)',
      bgColor: 'bg-purple-50 dark:bg-purple-950',
      borderColor: 'border-purple-200 dark:border-purple-800',
      textColor: 'text-purple-900 dark:text-purple-100',
      badgeColor: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
      emoji: '🧪',
    },
  };

  const config = typeConfig[item.type];
  const IconComponent = config.icon;

  return (
    <div className={`${config.bgColor} ${config.borderColor} border rounded-xl p-4 sm:p-5`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 pt-0.5">
          <IconComponent className={`w-5 h-5 ${config.textColor}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <h4 className={`font-semibold ${config.textColor} text-sm sm:text-base`}>
              {item.title}
            </h4>
            <span className={`${config.badgeColor} px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap`}>
              {config.emoji}
            </span>
          </div>
          <p className={`${config.textColor} text-xs sm:text-sm opacity-90`}>{item.description}</p>
        </div>
      </div>
    </div>
  );
};

export const ProtocolGuarantees: FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const cryptographicGuarantees = guarantees.filter((g) => g.type === 'cryptographic');
  const onChainGuarantees = guarantees.filter((g) => g.type === 'on-chain');
  const abstractedGuarantees = guarantees.filter((g) => g.type === 'abstracted');

  return (
    <div className="w-full">
      {/* Collapsed View */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 hover:from-blue-700 hover:to-purple-700 dark:hover:from-blue-800 dark:hover:to-purple-800 text-white rounded-xl p-4 sm:p-5 transition-all duration-300 shadow-lg"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-left">
            <Shield className="w-5 h-5 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-sm sm:text-base">Protocol Guarantees</h3>
              <p className="text-xs opacity-90">
                {isExpanded ? 'Hide details' : 'Click to view cryptographic & blockchain guarantees'}
              </p>
            </div>
          </div>
          <ChevronDown
            className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Expanded View */}
      {isExpanded && (
        <div className="mt-4 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Cryptographically Enforced */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h4 className="font-bold text-stone-900 dark:text-stone-50 text-sm sm:text-base">
                ✅ Cryptographically Enforced
              </h4>
            </div>
            <div className="space-y-3 pl-7">
              {cryptographicGuarantees.map((item, idx) => (
                <GuaranteeCard key={idx} item={item} />
              ))}
            </div>
          </div>

          {/* On-Chain (Solana) */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h4 className="font-bold text-stone-900 dark:text-stone-50 text-sm sm:text-base">
                ⚡ Enforced On-Chain (Solana)
              </h4>
            </div>
            <div className="space-y-3 pl-7">
              {onChainGuarantees.map((item, idx) => (
                <GuaranteeCard key={idx} item={item} />
              ))}
            </div>
          </div>

          {/* Abstracted but Real */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Lock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h4 className="font-bold text-stone-900 dark:text-stone-50 text-sm sm:text-base">
                🧪 Abstracted but Real (Demo Architecture)
              </h4>
            </div>
            <div className="space-y-3 pl-7">
              {abstractedGuarantees.map((item, idx) => (
                <GuaranteeCard key={idx} item={item} />
              ))}
            </div>
          </div>

          {/* Key Insight */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border border-amber-200 dark:border-amber-800 rounded-xl p-4 sm:p-5">
            <h5 className="font-semibold text-amber-900 dark:text-amber-100 text-sm sm:text-base mb-2">
              🔍 Key Insight
            </h5>
            <p className="text-amber-800 dark:text-amber-200 text-xs sm:text-sm">
              All cryptographic constraints are embedded in the ZK proof. Solana consensus ensures on-chain state
              consistency. Together, they prevent fraud, double-spending, and unauthorized transfers without exposing
              transaction amounts or identities.
            </p>
          </div>

          {/* Footer */}
          <div className="bg-stone-100 dark:bg-stone-900 rounded-lg p-3 sm:p-4 text-center">
            <p className="text-xs text-stone-600 dark:text-stone-400">
              Audit-ready privacy payment protocol on Solana devnet
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProtocolGuarantees;
