'use client';

import React, { useEffect, useState } from 'react';

interface GPTWrapperProps {
  onAdCompleted: () => void;
  onAdClosed?: () => void;
  onAdFailed?: () => void;
  adUnitPath?: string;
}

export default function GPTWrapper({
  onAdCompleted,
  onAdClosed,
  onAdFailed,
  adUnitPath,
}: GPTWrapperProps) {
  const [isAdReady, setIsAdReady] = useState(false);
  const [readyEvent, setReadyEvent] = useState<any>(null);
  const [adMessage, setAdMessage] = useState('Google Ad Manager reklam sunucusu hazırlanıyor...');
  const [adError, setAdError] = useState(false);

  const finalAdUnitPath =
    adUnitPath ||
    process.env.NEXT_PUBLIC_GAM_REWARDED_AD_UNIT ||
    '/21775744923/example/adaptive-rewarded-vertical';

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let rewardedSlot: any = null;
    let cleanupFunc: (() => void) | null = null;

    const initGPT = () => {
      const googletag = (window as any).googletag || {};
      googletag.cmd = googletag.cmd || [];

      googletag.cmd.push(() => {
        try {
          // Define out of page slot for rewarded ad
          rewardedSlot = googletag.defineOutOfPageSlot(
            finalAdUnitPath,
            googletag.enums.OutOfPageFormat.REWARDED
          );

          if (rewardedSlot) {
            rewardedSlot.addService(googletag.pubads());
          }

          // Register event listeners
          const onReady = (event: any) => {
            if (event.slot === rewardedSlot) {
              console.log('GPT: Rewarded ad is ready.');
              setIsAdReady(true);
              setReadyEvent(event);
              setAdMessage('Ödüllü reklam hazır! Devam etmek için aşağıdaki butona tıklayın.');
            }
          };

          const onGranted = (event: any) => {
            if (event.slot === rewardedSlot) {
              console.log('GPT: Reward granted!');
              onAdCompleted();
            }
          };

          const onClosed = (event: any) => {
            if (event.slot === rewardedSlot) {
              console.log('GPT: Ad closed.');
              if (onAdClosed) onAdClosed();
              // Clean up slot after watch to allow subsequent loads
              if (rewardedSlot) {
                googletag.destroySlots([rewardedSlot]);
                rewardedSlot = null;
              }
            }
          };

          googletag.pubads().addEventListener('rewardedSlotReady', onReady);
          googletag.pubads().addEventListener('rewardedSlotGranted', onGranted);
          googletag.pubads().addEventListener('rewardedSlotClosed', onClosed);

          googletag.enableServices();
          googletag.display(rewardedSlot);

          cleanupFunc = () => {
            try {
              googletag.pubads().removeEventListener('rewardedSlotReady', onReady);
              googletag.pubads().removeEventListener('rewardedSlotGranted', onGranted);
              googletag.pubads().removeEventListener('rewardedSlotClosed', onClosed);
            } catch (e) {
              console.warn('GPT remove listeners failed:', e);
            }
          };
        } catch (err) {
          console.error('GPT initialization error:', err);
          setAdError(true);
          setAdMessage('Ödüllü reklam yüklenemedi.');
          if (onAdFailed) onAdFailed();
        }
      });
    };

    // Wait until googletag is fully loaded and ready
    if ((window as any).googletag && (window as any).googletag.apiReady) {
      initGPT();
    } else {
      const interval = setInterval(() => {
        if ((window as any).googletag && (window as any).googletag.apiReady) {
          clearInterval(interval);
          initGPT();
        }
      }, 200);
      return () => {
        clearInterval(interval);
        if (cleanupFunc) cleanupFunc();
      };
    }

    return () => {
      if (cleanupFunc) cleanupFunc();
      const googletag = (window as any).googletag;
      if (googletag && rewardedSlot) {
        googletag.cmd.push(() => {
          googletag.destroySlots([rewardedSlot]);
        });
      }
    };
  }, [finalAdUnitPath]);

  const handleShowAd = () => {
    if (readyEvent) {
      try {
        readyEvent.makeRewardedVisible();
      } catch (err) {
        console.error('Failed to show rewarded ad:', err);
        setAdError(true);
        if (onAdFailed) onAdFailed();
      }
    }
  };

  return (
    <div className="p-5 bg-slate-950/40 border border-white/5 rounded-2xl text-center space-y-4">
      <div className="text-xs text-slate-400 font-medium leading-relaxed">
        {adMessage}
      </div>
      
      {isAdReady && readyEvent && !adError ? (
        <button
          onClick={handleShowAd}
          className="w-full bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-500 hover:to-indigo-550 text-white font-bold py-3.5 rounded-xl shadow-lg hover:scale-[1.01] transition-all text-xs tracking-wider uppercase font-display"
        >
          📺 Reklamı Başlat ve İzle
        </button>
      ) : adError ? (
        <div className="space-y-2">
          <p className="text-[10px] text-rose-400 font-bold uppercase">Hata oluştu</p>
          <button
            onClick={() => {
              if (onAdFailed) onAdFailed();
            }}
            className="w-full bg-slate-900 hover:bg-slate-800 text-slate-300 py-2.5 rounded-xl text-xs font-semibold border border-white/5 transition"
          >
            Mockup Reklam Modu ile Devam Et
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-4 gap-2">
          <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Google Ads Yükleniyor...</span>
        </div>
      )}
    </div>
  );
}
