/**
 * HTML5 Canvas kullanarak kullanıcının şampiyonluk ve üçüncülük tahminlerini içeren
 * 1080x1920 (9:16) boyutlarında dikey Instagram Story formatında yüksek çözünürlüklü 
 * bir paylaşım görseli üreten yardımcı servis.
 */

export interface ShareCardData {
  userName: string;
  squadName: string;
  championName: string;
  championFlag: string;
  championProb: number;
  thirdName: string;
  thirdFlag: string;
  isWatermarkRemoved: boolean;
}

export function generateBracketCard(data: ShareCardData): Promise<string> {
  return new Promise((resolve, reject) => {
    // 1080x1920 çözünürlüğünde canvas oluştur
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context oluşturulamadı.'));
      return;
    }

    // 1. ARKA PLAN DEGRADE (Derin Gece Mavisi, Neon Mor ve Lüks Gece Tonları)
    const bgGrad = ctx.createRadialGradient(540, 960, 100, 540, 960, 1200);
    bgGrad.addColorStop(0, '#1e1b4b'); // indigo-950
    bgGrad.addColorStop(0.5, '#0f0f1b'); // Koyu gece
    bgGrad.addColorStop(1, '#020205'); // Neredeyse siyah
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1920);

    // 2. PARILTI EFEKTLERİ VE SÜSLEMELER (Daireler ve Işımalar)
    ctx.fillStyle = 'rgba(139, 92, 246, 0.08)'; // Violet glow
    ctx.beginPath();
    ctx.arc(540, 400, 350, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(236, 72, 153, 0.04)'; // Pink glow
    ctx.beginPath();
    ctx.arc(540, 1200, 450, 0, Math.PI * 2);
    ctx.fill();

    // 3. DIŞ ÇERÇEVE DEGRADESİ
    const borderGrad = ctx.createLinearGradient(0, 0, 1080, 1920);
    borderGrad.addColorStop(0, 'rgba(124, 58, 237, 0.3)'); // Mor
    borderGrad.addColorStop(0.5, 'rgba(236, 72, 153, 0.1)'); // Pembe
    borderGrad.addColorStop(1, 'rgba(245, 158, 11, 0.2)'); // Altın
    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = 30;
    ctx.strokeRect(15, 15, 1050, 1890);

    // 4. BAŞLIK VE LOGO
    // Dünya Kupası Emojisi
    ctx.font = '80px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏆', 540, 200);

    // Ana Başlık
    ctx.font = 'bold 64px Outfit, system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('CUP SYNDICATE', 540, 310);

    ctx.font = 'bold 32px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#a78bfa'; // violet-400
    ctx.fillText('WORLD CUP 2026 BRACKETS', 540, 375);

    // 5. KULLANICI & KADRO BİLGİ KUTUSU
    // Kutu Arka Planı
    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 4;
    
    // Yuvarlatılmış Kutu Çizme Yardımcısı
    const drawRoundRect = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    };

    drawRoundRect(140, 460, 800, 160, 24);

    // Kullanıcı Adı
    ctx.font = 'bold 36px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'left';
    ctx.fillText(data.userName || 'Konuk Tahminci', 190, 515);

    // Kadro Bilgisi
    ctx.font = '550 26px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Kadro:', 190, 565);

    ctx.font = 'bold 28px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#fbbf24'; // Altın sarısı
    ctx.fillText(data.squadName || 'Kadro Dışı', 290, 565);

    // 6. ŞAMPİYON KUTUSU (BÜYÜK VE ŞAŞAALI)
    ctx.fillStyle = 'rgba(124, 58, 237, 0.15)'; // Morumsu transparan
    const goldGrad = ctx.createLinearGradient(140, 680, 940, 1080);
    goldGrad.addColorStop(0, 'rgba(245, 158, 11, 0.8)'); // Altın
    goldGrad.addColorStop(1, 'rgba(217, 119, 6, 0.8)');
    ctx.strokeStyle = goldGrad;
    ctx.lineWidth = 6;
    
    drawRoundRect(140, 680, 800, 420, 32);

    // Şampiyon Başlığı
    ctx.textAlign = 'center';
    ctx.font = 'bold 30px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('⭐ DÜNYA KUPASI ŞAMPİYONU ⭐', 540, 740);

    // Şampiyon Bayrağı
    ctx.font = '140px Arial, "Segoe UI Emoji", sans-serif';
    ctx.fillText(data.championFlag || '⚽', 540, 860);

    // Şampiyon İsmi
    ctx.font = 'black 64px Outfit, system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(data.championName.toUpperCase(), 540, 970);

    // Olasılık istatistiği
    ctx.font = 'bold 26px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`Kazanma Olasılığı: %${data.championProb || 0}`, 540, 1035);

    // 7. ÜÇÜNCÜLÜK KUTUSU (GÜMÜŞ TONLARI)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.5)';
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)'; // Gümüş rengi çerçeve
    ctx.lineWidth = 4;

    drawRoundRect(140, 1150, 800, 320, 24);

    // Üçüncü Başlığı
    ctx.font = 'bold 26px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('🥉 DÜNYA KUPASI ÜÇÜNCÜSÜ', 540, 1205);

    // Üçüncü Bayrağı
    ctx.font = '90px Arial, "Segoe UI Emoji", sans-serif';
    ctx.fillText(data.thirdFlag || '⚽', 540, 1285);

    // Üçüncü İsmi
    ctx.font = 'bold 44px Outfit, system-ui, sans-serif';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(data.thirdName.toUpperCase(), 540, 1380);

    // 8. BRACKET DETAY SÜSLERİ
    ctx.font = '28px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText('----------------------------------------------------', 540, 1530);

    ctx.font = 'italic bold 28px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#8b5cf6';
    ctx.fillText('"Tahminini Yap, Kadronu Kur, Kupayı Kazan!"', 540, 1580);

    // 9. FİLİGRAN VE WEB ADRESİ
    if (!data.isWatermarkRemoved) {
      // Reklam izlenmemişse filigran bas
      ctx.fillStyle = 'rgba(244, 63, 94, 0.15)'; // Rose transparan kutu
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
      ctx.lineWidth = 3;
      drawRoundRect(240, 1660, 600, 85, 16);

      ctx.font = 'bold 22px Inter, system-ui, sans-serif';
      ctx.fillStyle = '#fda4af';
      ctx.fillText('🔒 ÜCRETSİZ TAHMİN KARTI', 540, 1703);
    } else {
      // Reklam izlenmişse filigran kalkar, şık sponsor / başarı mühürü basılır
      ctx.fillStyle = 'rgba(16, 185, 129, 0.1)'; // Emerald transparan kutu
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.lineWidth = 3;
      drawRoundRect(240, 1660, 600, 85, 16);

      ctx.font = 'bold 22px Inter, system-ui, sans-serif';
      ctx.fillStyle = '#6ee7b7';
      ctx.fillText('✨ CUP SYNDICATE ONAYLI KART', 540, 1703);
    }

    // Web Adresi
    ctx.font = 'bold 36px Outfit, system-ui, sans-serif';
    // Renk geçişli web adresi efekti
    const textGrad = ctx.createLinearGradient(350, 0, 730, 0);
    textGrad.addColorStop(0, '#c084fc'); // purple-400
    textGrad.addColorStop(1, '#f472b6'); // pink-400
    ctx.fillStyle = textGrad;
    ctx.fillText('cupsyndicate.com', 540, 1800);

    // Küçük sürüm / telif bilgisi
    ctx.font = '20px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText('CupSyndicate 2026. Tüm hakları saklıdır.', 540, 1845);

    // Canvas'tan PNG data URL üret
    try {
      const dataUrl = canvas.toDataURL('image/png');
      resolve(dataUrl);
    } catch (err) {
      reject(err);
    }
  });
}
