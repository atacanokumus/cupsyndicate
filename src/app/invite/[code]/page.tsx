'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { getSquadBasicInfo } from '../../../lib/dbServices';

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string) || '';

  const [squadInfo, setSquadInfo] = useState<{ name: string; memberCount: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!code) return;
    (async () => {
      setLoading(true);
      const info = await getSquadBasicInfo(code);
      if (info) {
        setSquadInfo(info);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    })();
  }, [code]);

  const handleJoin = () => {
    router.push(`/predictions?invite=${encodeURIComponent(code)}`);
  };

  const handleSkip = () => {
    router.push('/predictions');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 bg-[radial-gradient(ellipse_at_top,rgba(120,80,200,0.12),transparent_50%)]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        {loading ? (
          <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-10 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full border-2 border-violet-500 border-t-transparent animate-spin mx-auto" />
            <p className="text-sm text-slate-400">Klan bilgileri yükleniyor...</p>
          </div>
        ) : notFound ? (
          <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-10 text-center space-y-6 shadow-2xl">
            <span className="text-5xl block">❌</span>
            <div className="space-y-2">
              <h2 className="text-xl font-black text-white">Klan Bulunamadı</h2>
              <p className="text-xs text-slate-400">
                <span className="font-mono text-violet-400">{code}</span> kodlu bir klan mevcut değil.
                Davet linkini kontrol edip tekrar deneyin.
              </p>
            </div>
            <button
              onClick={handleSkip}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl transition text-sm"
            >
              Ana Sayfaya Git →
            </button>
          </div>
        ) : (
          <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
            {/* Üst Logo ve Başlık */}
            <div className="space-y-3">
              <span className="text-5xl block filter drop-shadow-[0_4px_12px_rgba(120,80,200,0.4)]">⚔️</span>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Klan Daveti
              </h1>
              <p className="text-xs text-slate-400">
                Bir arkadaşınız sizi KupaTahmini.com&apos;da bir klana davet etti!
              </p>
            </div>

            {/* Klan Bilgi Kartı */}
            <div className="bg-gradient-to-br from-violet-950/40 to-indigo-950/40 border border-violet-500/30 rounded-2xl p-6 space-y-3">
              <span className="text-[10px] text-violet-400 font-bold uppercase tracking-widest block">KLAN ADI</span>
              <h2 className="text-xl font-black text-white">{squadInfo?.name}</h2>
              <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                <span className="bg-slate-800 px-2 py-1 rounded-lg border border-white/5">
                  👥 {squadInfo?.memberCount}/20 Üye
                </span>
                <span className="bg-slate-800 px-2 py-1 rounded-lg border border-white/5 font-mono text-violet-400">
                  {code}
                </span>
              </div>
            </div>

            {/* Soru */}
            <p className="text-sm font-semibold text-slate-200">
              <span className="text-amber-400">&ldquo;{squadInfo?.name}&rdquo;</span> klanına katılmak istiyor musun?
            </p>

            {/* Butonlar */}
            <div className="space-y-3">
              <button
                onClick={handleJoin}
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-violet-900/30 transition transform hover:-translate-y-0.5 text-sm"
              >
                ✅ Evet, Katıl!
              </button>
              <button
                onClick={handleSkip}
                className="w-full bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 font-semibold py-3 rounded-xl transition text-xs"
              >
                Hayır, Kendi Başıma Devam Et
              </button>
            </div>

            <p className="text-[10px] text-slate-500">
              Katıldıktan sonra tahminlerinizi yaparak klanınızla yarışabilirsiniz.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
