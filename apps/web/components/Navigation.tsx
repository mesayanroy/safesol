// Main navigation component with clean UI and scroll animations
'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useTransactionHistory } from '@/hooks/useTransactionHistory';

export default function Navigation() {
  const pathname = usePathname();
  const { publicKey } = useWallet();
  const { stats } = useTransactionHistory();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => pathname === path;

  const navItems = [
    { label: 'Send Payment', href: '/', icon: '💳' },
    { label: 'Dashboard', href: '/dashboard', icon: '📊' },
    { label: 'Dev Tools', href: '/dev-tools', icon: '⚙️' },
  ];

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50 shadow-lg shadow-slate-900/20'
          : 'bg-slate-900/80 backdrop-blur-sm border-b border-slate-800'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
              <span className="text-white font-bold">🔐</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent hidden sm:inline group-hover:from-blue-300 group-hover:to-cyan-200 transition-all duration-300">
              SafeSol
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 font-medium text-sm ${
                  isActive(item.href)
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
                {item.href === '/dashboard' && stats && stats.confirmedTransactions > 0 && (
                  <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-green-500/20 text-green-300 px-2 py-0.5 text-[10px] font-semibold">
                    ✓ Confirmed
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center gap-4">
            <WalletMultiButton
              style={{
                backgroundColor: publicKey ? '#0ea5e9' : '#64748b',
                borderRadius: '0.5rem',
                color: 'white',
                fontWeight: 500,
                padding: '0.5rem 1rem',
                transition: 'all 0.3s ease',
                boxShadow: publicKey ? '0 0 20px rgba(14, 165, 233, 0.3)' : 'none',
              }}
            />

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-300 transition-all duration-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 w-full ${
                  isActive(item.href)
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
                {item.href === '/dashboard' && stats && stats.confirmedTransactions > 0 && (
                  <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-green-500/20 text-green-300 px-2 py-0.5 text-[10px] font-semibold">
                    ✓ Confirmed
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
