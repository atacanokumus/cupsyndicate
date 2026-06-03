import React from 'react';
import type { Metadata } from 'next';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Trophy, Users, Shield, Award } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Hakkımızda | KupaTahmini.com',
  description: 'Dünya Kupası 2026 sosyal tahmin platformu KupaTahmini.com vizyonu, misyonu ve kurucuları hakkında bilgi edinin.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between">
      <div>
        <Header />
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-12">
            
            {/* Hero Heading */}
            <div className="text-center space-y-4">
              <h1 className="text-4xl sm:text-5xl font-black text-white bg-gradient-to-r from-violet-300 via-pink-300 to-amber-200 bg-clip-text text-transparent glow-text-violet">
                Hakkımızda
              </h1>
              <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
                KupaTahmini.com, futbol heyecanını veri odaklı ve sosyal bir yarışmaya dönüştüren yeni nesil turnuva tahmin platformudur.
              </p>
            </div>

            {/* Content Glass Card */}
            <div className="glass-card rounded-3xl p-8 sm:p-10 border border-white/10 space-y-8 shadow-2xl">
              
              {/* Sec 1: Misyon */}
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-violet-400" />
                  <span>Misyonumuz</span>
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Misyonumuz, 2026 Dünya Kupası turnuvasını futbolseverler için çok daha interaktif, heyecanlı ve sosyal hale getirmektir. Kullanıcılarımızın sadece pasif birer izleyici olmaktan çıkıp, kendi analizleri, grup aşaması olasılık tahminleri ve turnuva ağacı (bracket) simülasyonları ile futbol aklını konuşturmalarını sağlıyoruz.
                </p>
              </div>

              {/* Sec 2: PvP Klan Rekabeti */}
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-pink-400" />
                  <span>Sosyal Klanlar ve Kadro Mantığı</span>
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Futbol tek başına değil, arkadaşlarla paylaşıldığında güzeldir. Bu felsefeden yola çıkarak KupaTahmini.com'a özel bir **PvP Kadro (Klan) Sistemi** entegre ettik. Her kullanıcı kendi özel klanını kurup arkadaşlarını davet edebilir. Klan üyelerinin tahminleri doğrultusunda dinamik klan istatistikleri çıkarılır ve klanlar arası küresel liderlik tablosunda yer alınır.
                </p>
              </div>

              {/* Sec 3: Yapay Zeka Desteği */}
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  <span>Yapay Zeka Destekli Analizler (AI Insight)</span>
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Gelişmiş veri modelleri ve Google Gemini yapay zeka entegrasyonu sayesinde, kararsız kaldığınız her takım için derinlemesine analiz sunuyoruz. 'AI' butonlarımıza tıklayarak takımların turnuva kadro kaliteleri, form durumları ve matematiksel çıkma yüzdelerini inceleyebilirsiniz.
                </p>
              </div>

              {/* Sec 4: Terms (Kullanım Şartları) */}
              <div id="terms" className="space-y-3 pt-6 border-t border-white/5">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-400" />
                  <span>Kullanım Şartları</span>
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  KupaTahmini.com tamamen ücretsiz, kâr amacı gütmeyen bir sosyal tahmin oyunudur. Sitede yer alan hiçbir bilgi, oran veya yapay zeka tahmini kesinlik vaat etmez ve bahis tavsiyesi niteliği taşımaz. Sitedeki tahmin hakları, puanlama sistemi ve PvP lig kuralları KupaTahmini.com yönetimi tarafından önceden haber verilmeksizin güncellenebilir.
                </p>
              </div>

            </div>

          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
