'use client';

import { FC } from 'react';

/**
 * Inline help component displayed in landing page
 * Guides users through Phantom setup if not installed
 */
export const PhantomSetupGuide: FC = () => {
  return (
    <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 mt-8">
      <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
        🔗 Setting Up Phantom Wallet
      </h3>

      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-500 text-white text-sm font-bold">
              1
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-blue-900 dark:text-blue-100">Install Phantom</h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Download Phantom from{' '}
              <a
                href="https://phantom.app"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-blue-600"
              >
                phantom.app
              </a>{' '}
              and add it to your browser
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-500 text-white text-sm font-bold">
              2
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-blue-900 dark:text-blue-100">Switch to Devnet</h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Open Phantom → Click the network selector (top right) → Select <strong>Devnet</strong>{' '}
              (this app uses devnet)
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-500 text-white text-sm font-bold">
              3
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-blue-900 dark:text-blue-100">Refresh This Page</h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Press <kbd className="bg-black/20 px-2 py-0.5 rounded text-xs">F5</kbd> or{' '}
              <kbd className="bg-black/20 px-2 py-0.5 rounded text-xs">Ctrl+R</kbd> to reload
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-500 text-white text-sm font-bold">
              4
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-blue-900 dark:text-blue-100">
              Click "Connect Wallet"
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Click the wallet button and select Phantom from the list
            </p>
          </div>
        </div>
      </div>

      {/* Troubleshooting */}
      <div className="mt-6 pt-6 border-t border-blue-200 dark:border-blue-800">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">🔧 Troubleshooting</h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
          <li>
            <strong>Phantom not showing in wallet list?</strong> Try refreshing the page or
            restarting your browser
          </li>
          <li>
            <strong>Network mismatch error?</strong> Make sure Phantom is set to Devnet (not Mainnet
            or Testnet)
          </li>
          <li>
            <strong>Signature keeps failing?</strong> Try removing and re-adding the app in Phantom
            settings
          </li>
          <li>
            <strong>Still stuck?</strong> Check console (F12) for detailed error messages
          </li>
        </ul>
      </div>

      {/* Debug Mode */}
      <div className="mt-6 pt-6 border-t border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          💡 <strong>Dev tip:</strong> Add{' '}
          <code className="bg-black/20 px-1 rounded">?debug=1</code> to the URL to see wallet
          detection details
        </p>
      </div>
    </div>
  );
};
