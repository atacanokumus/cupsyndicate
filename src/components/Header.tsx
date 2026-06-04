'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { Trophy, Menu, X, User as UserIcon, LogOut } from 'lucide-react';
import { auth, logOut } from '../lib/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

interface HeaderProps {
  onTabChange?: (tab: 'landing' | 'profile' | 'leaderboards') => void;
}

function HeaderContent({ onTabChange }: HeaderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = searchParams.get('tab');
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await logOut();
      window.location.href = '/?tab=landing';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleQueryParamLink = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
    tabName: 'landing' | 'profile' | 'leaderboards'
  ) => {
    e.preventDefault();
    router.push(href);
    if (onTabChange) {
      onTabChange(tabName);
    }
  };

  const navLinks = [
    { name: 'Ana Sayfa', href: '/?tab=landing', tab: 'landing' as const },
    { name: 'Blog', href: '/blog', tab: null },
    { name: 'Hakkımızda', href: '/about', tab: null },
    { name: 'İletişim', href: '/contact', tab: null },
    { name: 'Gizlilik', href: '/privacy', tab: null },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-slate-950/75 backdrop-blur-md border-b border-white/10 shadow-lg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link
              href="/?tab=landing"
              onClick={(e) => handleQueryParamLink(e, '/?tab=landing', 'landing')}
              className="flex items-center gap-2 group"
            >
              <div className="bg-gradient-to-br from-violet-500 to-indigo-650 p-1.5 rounded-lg shadow-glow-violet group-hover:scale-105 transition duration-300">
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
              const isActive = pathname === '/' 
                ? (link.href === '/?tab=landing' && (tab === 'landing' || !tab))
                : (link.href !== '/?tab=landing' && pathname?.startsWith(link.href));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={(e) => {
                    if (link.tab) {
                      handleQueryParamLink(e, link.href, link.tab);
                    }
                  }}
                  className={`text-xs font-bold uppercase tracking-wider transition duration-300 hover:text-white ${
                    isActive ? 'text-violet-400 border-b-2 border-violet-500 pb-1' : 'text-slate-400'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}

            {/* Profile Link if Logged In */}
            {user && (
              <Link
                href="/?tab=profile"
                onClick={(e) => handleQueryParamLink(e, '/?tab=profile', 'profile')}
                className={`text-xs font-bold uppercase tracking-wider transition duration-300 hover:text-white flex items-center gap-1.5 ${
                  pathname === '/' && tab === 'profile' ? 'text-violet-400 border-b-2 border-violet-500 pb-1' : 'text-slate-400'
                }`}
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Profilim</span>
              </Link>
            )}

            {/* Logout Button if Logged In */}
            {user ? (
              <button
                onClick={handleLogout}
                className="bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-rose-300 text-[10px] font-black uppercase tracking-wider px-3.5 py-2 rounded-lg transition-all flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Çıkış</span>
              </button>
            ) : (
              <Link
                href="/?tab=landing"
                onClick={(e) => handleQueryParamLink(e, '/?tab=landing', 'landing')}
                className="bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-500 hover:to-indigo-550 text-white text-[10px] font-black uppercase tracking-wider px-4 py-2 rounded-lg shadow-md hover:scale-105 transition-all duration-300 font-display"
              >
                Tahmin Sihirbazı 🏆
              </Link>
            )}
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
            const isActive = pathname === '/' 
              ? (link.href === '/?tab=landing' && (tab === 'landing' || !tab))
              : (link.href !== '/?tab=landing' && pathname?.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  setIsOpen(false);
                  if (link.tab) {
                    handleQueryParamLink(e, link.href, link.tab);
                  }
                }}
                className={`block px-3 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition ${
                  isActive ? 'bg-violet-950/40 text-violet-400 border-l-4 border-violet-500' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                {link.name}
              </Link>
            );
          })}

          {/* Mobile Profile Link */}
          {user && (
            <Link
              href="/?tab=profile"
              onClick={(e) => {
                setIsOpen(false);
                handleQueryParamLink(e, '/?tab=profile', 'profile');
              }}
              className={`block px-3 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${
                pathname === '/' && tab === 'profile' ? 'bg-violet-950/40 text-violet-400 border-l-4 border-violet-500' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <UserIcon className="w-4 h-4 text-violet-400" />
              <span>Profilim</span>
            </Link>
          )}

          <div className="pt-2 px-3">
            {user ? (
              <button
                onClick={() => {
                  setIsOpen(false);
                  handleLogout();
                }}
                className="w-full text-center bg-rose-950 hover:bg-rose-900 text-rose-200 text-xs font-black uppercase tracking-wider py-3 rounded-lg flex items-center justify-center gap-1.5 border border-rose-800"
              >
                <LogOut className="w-4 h-4" />
                <span>Çıkış Yap</span>
              </button>
            ) : (
              <Link
                href="/?tab=landing"
                onClick={(e) => {
                  setIsOpen(false);
                  handleQueryParamLink(e, '/?tab=landing', 'landing');
                }}
                className="block w-full text-center bg-gradient-to-r from-violet-600 to-indigo-650 text-white text-xs font-black uppercase tracking-wider py-3 rounded-lg shadow-md font-display"
              >
                Tahmin Sihirbazı 🏆
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default function Header({ onTabChange }: HeaderProps) {
  return (
    <Suspense fallback={
      <header className="sticky top-0 z-50 w-full bg-slate-950/75 backdrop-blur-md border-b border-white/10 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="bg-gradient-to-br from-violet-500 to-indigo-650 p-1.5 rounded-lg shadow-glow-violet">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-black tracking-tight text-white font-display bg-gradient-to-r from-violet-300 via-pink-300 to-amber-200 bg-clip-text text-transparent glow-text-violet">
                  KupaTahmini.com
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>
    }>
      <HeaderContent onTabChange={onTabChange} />
    </Suspense>
  );
}
