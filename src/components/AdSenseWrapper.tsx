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

  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || 'ca-pub-3940256099942544';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const pushAd = () => {
          try {
            ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
            setAdLoaded(true);
          } catch (e) {
            console.warn('AdSense push failed:', e);
            // Don't mark as failed immediately if it's just multiple pushes or rendering delays
          }
        };

        // Delay push slightly to ensure the DOM elements are fully rendered and layout is settled
        const timer = setTimeout(() => {
          pushAd();
        }, 100);

        return () => clearTimeout(timer);
      } catch (err) {
        console.warn('AdSense initialization failed, rendering placeholder.', err);
        setAdFailed(true);
      }
    }
  }, [slot]);

  return (
    <div className={`w-full overflow-hidden my-3 mx-auto max-w-full ${className}`}>
      {adFailed ? (
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
        </div>
      ) : (
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={clientId}
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive={responsive ? 'true' : 'false'}
        />
      )}
    </div>
  );
}

