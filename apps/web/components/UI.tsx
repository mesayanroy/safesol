'use client';

import { FC } from 'react';

interface InfoIconProps {
  text: string;
}

export const InfoIcon: FC<InfoIconProps> = ({ text }) => (
  <div className="group relative">
    <span className="inline-block w-4 h-4 rounded-full bg-stone-300 dark:bg-stone-600 text-stone-700 dark:text-stone-300 text-xs font-medium flex items-center justify-center cursor-help">
      ?
    </span>
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-stone-900 text-stone-50 text-xs rounded-lg px-3 py-2 whitespace-nowrap z-10 border border-stone-700">
      {text}
    </div>
  </div>
);

interface PrivacyCardProps {
  icon: string;
  title: string;
  description: string;
  details?: string[];
}

export const PrivacyCard: FC<PrivacyCardProps> = ({ icon, title, description, details }) => (
  <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 hover:shadow-lg transition-shadow">
    <div className="text-3xl mb-3">{icon}</div>
    <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-50 mb-2">{title}</h3>
    <p className="text-sm text-stone-600 dark:text-stone-400 mb-3">{description}</p>
    {details && (
      <ul className="space-y-1">
        {details.map((detail, idx) => (
          <li
            key={idx}
            className="text-xs text-stone-500 dark:text-stone-500 flex items-center gap-2"
          >
            <span className="w-1 h-1 bg-stone-400 dark:bg-stone-600 rounded-full"></span>
            {detail}
          </li>
        ))}
      </ul>
    )}
  </div>
);

interface ProofStatusBadgeProps {
  status: 'idle' | 'generating' | 'generated' | 'submitted' | 'confirmed' | 'error';
}

export const ProofStatusBadge: FC<ProofStatusBadgeProps> = ({ status }) => {
  const statusConfig = {
    idle: {
      bg: 'bg-stone-100 dark:bg-stone-900',
      text: 'text-stone-700 dark:text-stone-300',
      label: 'Ready',
    },
    generating: {
      bg: 'bg-blue-100 dark:bg-blue-950',
      text: 'text-blue-700 dark:text-blue-300',
      label: 'Generating Proof...',
    },
    generated: {
      bg: 'bg-green-100 dark:bg-green-950',
      text: 'text-green-700 dark:text-green-300',
      label: 'Proof Generated',
    },
    submitted: {
      bg: 'bg-blue-100 dark:bg-blue-950',
      text: 'text-blue-700 dark:text-blue-300',
      label: 'Submitted',
    },
    confirmed: {
      bg: 'bg-green-100 dark:bg-green-950',
      text: 'text-green-700 dark:text-green-300',
      label: 'Confirmed',
    },
    error: {
      bg: 'bg-red-100 dark:bg-red-950',
      text: 'text-red-700 dark:text-red-300',
      label: 'Error',
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={`${config.bg} ${config.text} text-xs font-medium px-3 py-1 rounded-full inline-flex items-center gap-2`}
    >
      {status === 'generating' && (
        <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
      )}
      {status === 'confirmed' && (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      )}
      {config.label}
    </div>
  );
};

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

export const StepIndicator: FC<StepIndicatorProps> = ({ steps, currentStep }) => (
  <div className="space-y-3">
    {steps.map((step, idx) => (
      <div key={idx} className="flex items-center gap-3">
        <div
          className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold transition-colors ${
            idx < currentStep
              ? 'bg-green-500 text-white'
              : idx === currentStep
                ? 'bg-blue-500 text-white'
                : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
          }`}
        >
          {idx < currentStep ? '✓' : idx + 1}
        </div>
        <span
          className={`text-sm transition-colors ${
            idx <= currentStep
              ? 'text-stone-900 dark:text-stone-50 font-medium'
              : 'text-stone-500 dark:text-stone-500'
          }`}
        >
          {step}
        </span>
      </div>
    ))}
  </div>
);

interface WalletStatusProps {
  connected: boolean;
  address?: string;
  balance?: number;
}

export const WalletStatus: FC<WalletStatusProps> = ({ connected, address, balance }) => (
  <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl p-4">
    <div className="flex items-center gap-3 mb-2">
      <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-stone-400'}`}></div>
      <span className="text-sm font-medium text-stone-900 dark:text-stone-50">
        {connected ? 'Wallet Connected' : 'Wallet Disconnected'}
      </span>
    </div>
    {connected && address && (
      <>
        <p className="text-xs text-stone-500 dark:text-stone-500 font-mono truncate">{address}</p>
        {balance !== undefined && (
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
            Balance: {balance.toFixed(4)} SOL
          </p>
        )}
      </>
    )}
  </div>
);
