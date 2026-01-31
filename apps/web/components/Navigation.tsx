// Main navigation component with clean UI and scroll animations
'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useTransactionHistory } from '@/hooks/useTransactionHistory';
import { Navbar, NavBody, NavItems } from '@/components/ui/resizable-navbar';

export default function Navigation() {
  const pathname = usePathname();
  const { publicKey } = useWallet();
  const { stats } = useTransactionHistory();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  const navItems = [
    { label: 'Send Payment', href: '/#launch-app', icon: '💳' },
    { label: 'Dashboard', href: '/dashboard', icon: '' },
    { label: 'Dev Tools', href: '/dev-tools', icon: '' },
  ];

  const isHighlighted = (href: string) => href !== '/#launch-app' && isActive(href);

  const navItemsForResizable = navItems.map((item) => ({
    name: `${item.icon} ${item.label}`,
    link: item.href,
  }));

  return (
    <Navbar className="sticky top-0 z-50">
      <NavBody className="bg-stone-950/80 backdrop-blur-md border-b border-stone-800/50">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group mr-8">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
            <span className="text-white font-bold text-sm">🔐</span>
          </div>
          <span className="text-lg font-bold text-white hidden sm:inline transition-all duration-300">
            SafeSol
          </span>
        </Link>

        {/* Desktop Navigation Items */}
        <div className="hidden md:flex items-center gap-1 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-300 font-medium text-xs ${
                isHighlighted(item.href)
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30'
                  : 'text-white hover:text-white hover:bg-stone-800/60'
              }`}
            >
              <span className="text-sm">{item.icon}</span>
              <span>{item.label}</span>
              {item.href === '/dashboard' && stats && stats.confirmedTransactions > 0 && (
                <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-green-500/20 text-white px-2 py-0.5 text-[10px] font-semibold">
                  ✓ Confirmed
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Wallet Connection */}
        <div className="flex items-center gap-4 ml-auto">
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
            className="md:hidden p-2 rounded-lg text-white hover:bg-stone-800 hover:text-white transition-all duration-300"
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
      </NavBody>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-stone-950/80 backdrop-blur-md border-b border-stone-800/50 pb-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-300 w-full mx-2 text-xs ${
                isHighlighted(item.href)
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white'
                  : 'text-white hover:text-white hover:bg-stone-800/60'
              }`}
            >
              <span className="text-sm">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
              {item.href === '/dashboard' && stats && stats.confirmedTransactions > 0 && (
                <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-green-500/20 text-white px-2 py-0.5 text-[10px] font-semibold">
                  ✓ Confirmed
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </Navbar>
  );
}

