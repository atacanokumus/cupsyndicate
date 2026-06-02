'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function AdblockDetector() {
  const [isBlocked, setIsBlocked] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const detectAdblock = async () => {
      // Delay slightly to let adblock extension stylesheets inject and apply to the DOM
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Test 1: Fetch check to AdSense script URL (only if online to prevent offline false positives)
      let fetchBlocked = false;
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        try {
          await fetch('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', {
            method: 'HEAD',
            mode: 'no-cors',
            cache: 'no-store'
          });
        } catch (err) {
          console.log('AdBlock detected via fetch block:', err);
          fetchBlocked = true;
        }
      }

      // Test 2: DOM bait element check (local, offline-friendly)
      let domBlocked = false;
      const bait = document.createElement('div');
      bait.className = 'adsbygoogle adsbox ad-banner ad-placement doubleclick';
      bait.setAttribute(
        'style',
        'position: absolute !important; left: -9999px !important; top: -9999px !important; width: 1px !important; height: 1px !important; display: block !important; visibility: visible !important;'
      );
      document.body.appendChild(bait);

      // Let the DOM update
      await new Promise((resolve) => setTimeout(resolve, 50));

      const computedStyle = window.getComputedStyle(bait);
      if (
        computedStyle.display === 'none' ||
        computedStyle.visibility === 'hidden' ||
        bait.offsetHeight === 0 ||
        bait.offsetWidth === 0
      ) {
        console.log('AdBlock detected via DOM bait check.');
        domBlocked = true;
      }
      document.body.removeChild(bait);

      // Set state: both tests or master DOM check confirms blocking
      if (fetchBlocked || domBlocked) {
        setIsBlocked(true);
      }
      setChecking(false);
    };

    // Run check on mount
    detectAdblock();
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  if (checking || !isBlocked) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4 animate-fadeIn">
      <div className="glass-card border border-white/10 rounded-3xl max-w-md w-full p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
        {/* Top accent line */}
        <div className="h-1.5 bg-gradient-to-r from-red-500 via-amber-500 to-red-500 absolute top-0 left-0 right-0" />
        
        <div className="w-16 h-16 rounded-full bg-red-950/30 border border-red-500/20 flex items-center justify-center mx-auto text-red-500">
          <AlertTriangle className="w-8 h-8 text-red-500 animate-pulse" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-extrabold text-white font-display tracking-wide">
            Reklam Engelleyici Algılandı!
          </h3>
          <p className="text-xs text-slate-350 leading-relaxed pt-2">
            Platformumuzun tamamen ücretsiz kalabilmesi, sunucu maliyetlerimizi karşılayabilmemiz ve yapay zeka tahmin motorumuzu çalıştırabilmemiz için reklam gelirlerine ihtiyacımız var.
          </p>
          <p className="text-[11px] text-slate-400 font-semibold">
            Lütfen tarayıcınızdaki reklam engelleyiciyi (AdBlock, uBlock vb.) kapatıp sayfayı yenileyiniz.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          className="w-full bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-500 hover:to-indigo-550 text-white font-bold py-3.5 rounded-xl shadow-lg hover:scale-[1.01] transition-all text-xs tracking-wider uppercase font-display flex items-center justify-center gap-2"
        >
          🔄 Kapatıp Yenile
        </button>
      </div>
    </div>
  );
}
