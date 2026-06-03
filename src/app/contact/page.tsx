import React from 'react';
import type { Metadata } from 'next';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import ContactForm from '../../components/ContactForm';
import { Mail, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'İletişim | KupaTahmini.com',
  description: 'KupaTahmini.com ile iletişime geçin. Hata bildirimleri, iş ortaklıkları ve genel sorularınız için destek ekibimize yazın.',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between">
      <div>
        <Header />
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-12">
            
            {/* Heading */}
            <div className="text-center space-y-4">
              <h1 className="text-4xl sm:text-5xl font-black text-white bg-gradient-to-r from-violet-300 via-pink-300 to-amber-200 bg-clip-text text-transparent glow-text-violet">
                İletişim
              </h1>
              <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
                Herhangi bir sorunuz, geri bildiriminiz veya klan sistemi ile ilgili hata bildirimleriniz için bize her zaman ulaşabilirsiniz.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Client Component Form */}
              <ContactForm />

              {/* Column 3: Contact Info Cards */}
              <div className="space-y-6">
                
                {/* Email Card */}
                <div className="glass-card rounded-2xl p-5 border border-white/10 space-y-2.5">
                  <div className="bg-violet-500/10 border border-violet-500/20 p-2 rounded-lg w-fit text-violet-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-white font-display">Destek E-Posta</h3>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Klan davet linkleri, liderlik tabloları ve Firebase hesap senkronizasyonu ile ilgili sorunlarınızı destek mailimize gönderebilirsiniz.
                  </p>
                  <p className="text-xs text-violet-400 font-mono font-bold">info@kupatahmini.com</p>
                </div>

                {/* Location/Info Card */}
                <div className="glass-card rounded-2xl p-5 border border-white/10 space-y-2.5">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg w-fit text-emerald-400">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-white font-display">Geliştirici Ekip</h3>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    KupaTahmini.com, dünya genelindeki futbol tutkunları ve yazılımcı ekipler tarafından açık kaynak vizyonuyla geliştirilmektedir.
                  </p>
                  <p className="text-xs text-emerald-400 font-bold">İstanbul / Türkiye</p>
                </div>

              </div>

            </div>

          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
