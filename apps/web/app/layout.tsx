import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import '@solana/wallet-adapter-react-ui/styles.css';
import WalletProvider from '@/components/WalletProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Private Payments on Solana',
  description:
    'Send payments with zero-knowledge proofs. Amount and recipient proven private through cryptography.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-50`}
      >
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}
