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

  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || 'ca-pub-7838551368632112';

  // Dynamically resolve slot ID from environment variables or use fallback
  const getAdSlot = () => {
    if (slot === 'banner-slot-a') {
      return process.env.NEXT_PUBLIC_ADSENSE_SLOT_BANNER || 'banner-slot-a';
    }
    if (slot === 'rewarded-fallback-banner') {
      return process.env.NEXT_PUBLIC_ADSENSE_SLOT_REWARDED_FALLBACK || 'rewarded-fallback-banner';
    }
    if (slot === 'interstitial-modal-slot') {
      return process.env.NEXT_PUBLIC_ADSENSE_SLOT_MODAL || 'interstitial-modal-slot';
    }
    return slot;
  };

  const adSlot = getAdSlot();

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
  }, [adSlot]);

  return (
    <div className={`w-full overflow-hidden mx-auto max-w-full ${format === 'horizontal' ? '' : 'my-3'} ${className}`}>
      {adFailed ? (
        <div className="glass-card border border-white/5 rounded-xl p-3 flex flex-col justify-center items-center gap-1.5 text-center min-h-[90px] relative overflow-hidden bg-slate-950/20">
          <div className="absolute top-1.5 left-2.5 text-[8px] text-slate-500 border border-slate-900 px-1 py-0.2 rounded font-bold uppercase tracking-wider">
            Sponsor
          </div>
          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider font-display mt-2">
            KupaTahmini.com Reklam Alanı
          </div>
          <div className="text-[8px] text-slate-500 font-medium">
            Turnuva heyecanına ortak olan sponsor markalarımız burada yayınlanacaktır.
          </div>
        </div>
      ) : (
        <ins
          className={`adsbygoogle ${format === 'horizontal' ? 'adsbygoogle-horizontal' : ''}`}
          style={{ display: 'block', height: format === 'horizontal' ? '50px' : 'auto', maxHeight: format === 'horizontal' ? '50px' : 'none' }}
          data-ad-client={clientId}
          data-ad-slot={adSlot}
          data-ad-format={format}
          data-full-width-responsive={responsive ? 'true' : 'false'}
        />
      )}
    </div>
  );
}

