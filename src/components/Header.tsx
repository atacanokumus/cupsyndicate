'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Trophy, Menu, X, Globe2 } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: 'Ana Sayfa', href: '/' },
    { name: 'Blog', href: '/blog' },
    { name: 'Hakkımızda', href: '/about' },
    { name: 'İletişim', href: '/contact' },
    { name: 'Gizlilik', href: '/privacy' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-slate-950/75 backdrop-blur-md border-b border-white/10 shadow-lg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="bg-gradient-to-br from-violet-500 to-indigo-600 p-1.5 rounded-lg shadow-glow-violet group-hover:scale-105 transition duration-300">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-black tracking-tight text-white font-display bg-gradient-to-r from-violet-300 via-pink-300 to-amber-200 bg-clip-text text-transparent glow-text-violet">
                KupaTahmini.com
              </span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-xs font-bold uppercase tracking-wider transition duration-300 hover:text-white ${
                    isActive ? 'text-violet-400 border-b-2 border-violet-500 pb-1' : 'text-slate-400'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
            <Link
              href="/"
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-[10px] font-black uppercase tracking-wider px-4 py-2 rounded-lg shadow-md hover:scale-105 transition-all duration-300 font-display"
            >
              Tahmin Sihirbazı 🏆
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 focus:outline-none transition duration-300"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {isOpen && (
        <div className="md:hidden bg-slate-950 border-b border-white/10 px-2 pt-2 pb-4 space-y-1 shadow-2xl animate-fadeIn">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition ${
                  isActive ? 'bg-violet-950/40 text-violet-400 border-l-4 border-violet-500' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
          <div className="pt-2 px-3">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="block w-full text-center bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-black uppercase tracking-wider py-3 rounded-lg shadow-md font-display"
            >
              Tahmin Sihirbazı 🏆
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
