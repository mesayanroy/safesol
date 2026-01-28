import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import '@solana/wallet-adapter-react-ui/styles.css';
import WalletProvider from '@/components/WalletProvider';
import Navigation from '@/components/Navigation';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafaf9' },
    { media: '(prefers-color-scheme: dark)', color: '#0c0a09' },
  ],
};

export const metadata: Metadata = {
  title: 'SafeSol - Private Payments on Solana',
  description:
    'Send private payments on Solana using zero-knowledge proofs. Prove your solvency without revealing amounts or recipients. Built with ZK-SNARKs, Light Protocol compression, and Anchor.',
  keywords: [
    'Solana',
    'Zero-Knowledge Proofs',
    'ZK-SNARKs',
    'Privacy',
    'Blockchain',
    'Cryptocurrency',
    'Private Payments',
    'Light Protocol',
    'Groth16',
  ],
  authors: [{ name: 'SafeSol Team' }],
  creator: 'SafeSol',
  publisher: 'SafeSol',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'SafeSol - Private Payments on Solana',
    description: 'Send private payments with zero-knowledge proofs on Solana',
    siteName: 'SafeSol',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SafeSol - Private Payments on Solana',
    description: 'Send private payments with zero-knowledge proofs',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-50`}
      >
        <WalletProvider>
          <Navigation />
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}
