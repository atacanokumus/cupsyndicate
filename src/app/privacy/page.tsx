import React from 'react';
import type { Metadata } from 'next';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Shield, Eye, Database, Info } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Gizlilik Politikası | KupaTahmini.com',
  description: 'KupaTahmini.com gizlilik politikası, KVKK ve GDPR uyumlu veri işleme süreçleri ile çerez politikası hakkında bilgilendirme.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between">
      <div>
        <Header />
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-12">
            
            {/* Heading */}
            <div className="text-center space-y-4">
              <h1 className="text-4xl sm:text-5xl font-black text-white bg-gradient-to-r from-violet-300 via-pink-300 to-amber-200 bg-clip-text text-transparent glow-text-violet">
                Gizlilik Politikası
              </h1>
              <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
                KupaTahmini.com olarak gizliliğinize büyük önem veriyoruz. Kişisel verilerinizin nasıl toplandığı, işlendiği ve çerezlerin nasıl kullanıldığına dair tüm bilgiler aşağıda özetlenmiştir.
              </p>
            </div>

            {/* Main Content Glass Card */}
            <div className="glass-card rounded-3xl p-8 sm:p-10 border border-white/10 space-y-8 shadow-2xl">
              
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <Shield className="w-5 h-5 text-violet-400" />
                <h2 className="text-lg font-bold text-white font-display">KVKK ve GDPR Aydınlatma Metni</h2>
              </div>

              {/* 1. Veri Sorumlusu */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5 font-display">
                  <span className="text-violet-400">1.</span> Veri Sorumlusu
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  KupaTahmini.com web sitesi üzerinde toplanan verilerin sorumluluğu, platformun açık kaynak kodlu geliştirici topluluğuna aittir. Herhangi bir veri hakkı talebinde bulunmak için <strong>info@kupatahmini.com</strong> adresi üzerinden bizimle iletişime geçebilirsiniz.
                </p>
              </div>

              {/* 2. Toplanan Kişisel Veriler */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5 font-display">
                  <span className="text-violet-400">2.</span> Hangi Verileri Topluyoruz?
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Platformumuzda yer alan tahmin kaydetme, klan kurma ve PvP liglerine katılma özelliklerini kullanabilmeniz için Google/Firebase Kimlik Doğrulama (Google Login) sistemini entegre etmiş bulunuyoruz. Giriş yaptığınızda şu temel verileri Firebase Firestore veritabanımızda saklıyoruz:
                </p>
                <ul className="list-disc pl-5 text-xs text-slate-400 space-y-1">
                  <li>Google Hesabınızda yer alan <strong>E-posta adresiniz</strong></li>
                  <li>Profilinizde gösterilecek olan <strong>Adınız / Soyadınız</strong> veya tercih ettiğiniz takma ad</li>
                  <li>Google profil fotoğrafınızın URL bağlantısı (isteğe bağlı)</li>
                  <li>Sistem tarafından otomatik üretilen benzersiz kullanıcı ID'si (UID)</li>
                </ul>
              </div>

              {/* 3. Verilerin İşlenme Amaçları */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5 font-display">
                  <span className="text-violet-400">3.</span> Verileriniz Hangi Amaçlarla İşlenir?
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Toplanan veriler, tamamen oyun içi deneyiminizin sağlanması ve turnuva tahmin sürecinin yönetilmesi amaçlarıyla işlenmektedir:
                </p>
                <ul className="list-disc pl-5 text-xs text-slate-400 space-y-1">
                  <li>Yaptığınız grup ve eleme aşaması tahminlerinin kaydedilmesi ve saklanması</li>
                  <li>PvP Kadro (Klan) sisteminde takım arkadaşlarınızla davet linki aracılığıyla eşleşmenizin sağlanması</li>
                  <li>Klan içi ve küresel liderlik tablolarında (Leaderboards) puanınızın hesaplanması ve adınızın gösterilmesi</li>
                  <li>KupaTahmini.com sistem güncellemeleri hakkında gerekli teknik bilgilendirmelerin e-posta ile yapılması</li>
                </ul>
              </div>

              {/* 4. Çerez Politikası ve Reklamlar */}
              <div id="cookies" className="space-y-3 pt-6 border-t border-white/5">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5 font-display">
                  <span className="text-violet-400">4.</span> Çerez Politikası ve Google AdSense Reklamları
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Sitemizde, kullanıcı deneyimini optimize etmek ve sunucu masraflarını karşılamak amacıyla üçüncü taraf reklam sağlayıcıları (Google AdSense) kullanılmaktadır. Google dahil üçüncü taraf satıcılar, web sitemize yaptığınız önceki ziyaretlere dayanarak reklam yayınlamak için çerezleri (cookies) kullanır.
                </p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Google'ın reklam çerezlerini kullanması, kendisinin ve ortaklarının sitemizdeki ve/veya internetteki diğer sitelerdeki ziyaretlerine dayalı olarak kullanıcılara reklam sunmasına olanak tanır. Kullanıcılar, kişiselleştirilmiş reklamcılığı devre dışı bırakmak için <a href="https://settings.google.com/ads/preferences" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline">Google Reklam Ayarları</a> sayfasını ziyaret edebilirler.
                </p>
                <div className="flex items-start gap-2 bg-slate-900/50 border border-white/5 p-3 rounded-xl">
                  <Info className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    <strong>Avrupa Bölgesi Kullanıcıları (EEA / UK):</strong> Sitemizi bu bölgelerden ziyaret eden kullanıcılara reklam sunulmadan önce Google onaylı Kullanıcı Rızası Yönetim Platformu (CMP) üzerinden rıza seçimi sunulur. Rıza kararlarınızı dilediğiniz zaman bu banner aracılığıyla değiştirebilirsiniz.
                  </p>
                </div>
              </div>

              {/* 5. Veri Güvenliği */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5 font-display">
                  <span className="text-violet-400">5.</span> Verileriniz Güvenle Nasıl Saklanıyor?
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Firebase Firestore altyapımızda tutulan veriler, asenkron güvenlik kuralları ve şifreli sunucu bağlantıları (SSL/HTTPS) ile korunmaktadır. Firebase Authentication sistemi, Google şifrenizi hiçbir şekilde platformumuzla paylaşmaz; sadece güvenli bir doğrulama tokenı kullanarak oturum açmanızı sağlar.
                </p>
              </div>

              {/* 6. Kullanıcı Hakları */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5 font-display">
                  <span className="text-violet-400">6.</span> KVKK Madde 11 Kapsamındaki Haklarınız
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  KVKK'nın 11. maddesi ve GDPR düzenlemeleri uyarınca veri sahipleri; kişisel verilerinin silinmesini, düzeltilmesini, işlenip işlenmediğini öğrenmeyi ve veri işlemeye itiraz etme haklarına sahiptir. Bu kapsamda hesabınızı ve tahmin verilerinizi tamamen silmek isterseniz, info@kupatahmini.com adresine yazılı e-posta göndermeniz yeterlidir. Verileriniz 72 saat içerisinde sunucularımızdan kalıcı olarak silinecektir.
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
