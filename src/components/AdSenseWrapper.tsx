'use client';

import React, { useEffect, useState } from 'react';

interface AdSenseWrapperProps {
  slot: string;
  className?: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical';
  responsive?: boolean;
}

export default function AdSenseWrapper({
  slot,
  className = '',
  format = 'auto',
  responsive = true,
}: AdSenseWrapperProps) {
  const [adFailed, setAdFailed] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);

  useEffect(() => {
    // Client-side execution check
    if (typeof window !== 'undefined') {
      try {
        // Load AdSense Script if not already loaded
        if (!document.getElementById('adsense-script')) {
          const script = document.createElement('script');
          script.id = 'adsense-script';
          script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + (process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || 'ca-pub-dummy');
          script.async = true;
          script.crossOrigin = 'anonymous';
          document.head.appendChild(script);
        }

        // Initialize ad
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        setAdLoaded(true);
      } catch (err) {
        console.warn('AdSense initialization failed, rendering layout placeholder.', err);
        setAdFailed(true);
      }
    }
  }, [slot]);

  // Premium, dark-themed responsive placeholder for development or ad-blockers
  return (
    <div className={`w-full overflow-hidden my-3 mx-auto max-w-full ${className}`}>
      {adFailed || !process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID ? (
        <div className="glass-card border border-white/5 rounded-xl p-3 flex flex-col justify-center items-center gap-1.5 text-center min-h-[90px] relative overflow-hidden bg-slate-950/20">
          <div className="absolute top-1.5 left-2.5 text-[8px] text-slate-500 border border-slate-900 px-1 py-0.2 rounded font-bold uppercase tracking-wider">
            Sponsor
          </div>
          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider font-display mt-2">
            CupSyndicate Reklam Alanı
          </div>
          <div className="text-[8px] text-slate-500 font-medium">
            Turnuva heyecanına ortak olan sponsor markalarımız burada yayınlanacaktır.
          </div>
          <div className="w-16 h-1 bg-violet-600/30 rounded mt-1 overflow-hidden">
            <div className="h-full bg-violet-500 rounded animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      ) : (
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive={responsive ? 'true' : 'false'}
        />
      )}
    </div>
  );
}
