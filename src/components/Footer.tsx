'use client';

import React from 'react';
import Link from 'next/link';
import { Trophy, Mail, Shield, AlertTriangle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-slate-950/90 border-t border-white/10 mt-16 pt-12 pb-8 text-slate-400">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Column 1: Info */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-violet-500 to-indigo-650 p-1.5 rounded-lg shadow-glow-violet">
                <Trophy className="w-4 h-4 text-white" />
              </div>
              <span className="text-base font-black text-white font-display">
                KupaTahmini.com
              </span>
            </Link>
            <p className="text-xs leading-relaxed max-w-sm text-slate-400">
              Dünya Kupası 2026 turnuva ağacı tahminlerini yapın, kendi klanınızı kurup arkadaşlarınızla PvP liglerinde kıyasıya yarışın. Futbol heyecanını sosyal analizlerle katlayın!
            </p>
            <div className="flex items-center gap-2 text-[10px] text-slate-500">
              <Mail className="w-3.5 h-3.5" />
              <span>info@kupatahmini.com</span>
            </div>
          </div>

          {/* Column 2: Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white font-display">Hızlı Navigasyon</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-violet-400 transition duration-200">
                  Ana Sayfa
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-violet-400 transition duration-200">
                  Futbol Blogu
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-violet-400 transition duration-200">
                  Hakkımızda
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-violet-400 transition duration-200">
                  İletişim
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white font-display">Yasal ve Güvenlik</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/privacy" className="flex items-center gap-1.5 hover:text-violet-400 transition duration-200">
                  <Shield className="w-3 h-3 text-violet-400" />
                  <span>Gizlilik Politikası</span>
                </Link>
              </li>
              <li>
                <Link href="/privacy#cookies" className="hover:text-violet-400 transition duration-200">
                  Çerez Politikası
                </Link>
              </li>
              <li>
                <Link href="/about#terms" className="hover:text-violet-400 transition duration-200">
                  Kullanım Şartları
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Disclaimer / Uyarı */}
        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-2 bg-slate-900/40 border border-white/5 p-3 rounded-xl max-w-2xl">
            <AlertTriangle className="w-4 h-4 text-amber-500/80 shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-500 leading-relaxed">
              <strong>Sorumluluk Reddi Beyanı:</strong> KupaTahmini.com bağımsız ve ücretsiz bir eğlence ve sosyal tahmin platformudur. FIFA, UEFA, FIFA World Cup 2026 organizasyon komitesi veya herhangi bir resmi spor kulübüyle hiçbir resmi bağı veya ticari ortaklığı bulunmamaktadır.
            </p>
          </div>
          <div className="text-[10px] text-slate-600 font-mono text-center md:text-right font-semibold">
            © 2026 KupaTahmini.com. Tüm hakları saklıdır.
          </div>
        </div>

      </div>
    </footer>
  );
}
