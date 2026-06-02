import { NextResponse } from 'next/server';

async function verifyFirebaseToken(idToken: string): Promise<boolean> {
  if (!idToken) return false;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    console.error('Firebase token verification error: NEXT_PUBLIC_FIREBASE_API_KEY is not configured in environment variables.');
    return false;
  }

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );
    return res.ok;
  } catch (err) {
    console.error('Firebase token verification network/CORS error:', err);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    // 1. Kimlik doğrulama başlığı kontrolü (Authorization: Bearer <idToken>)
    const authHeader = request.headers.get('Authorization');
    const idToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : '';

    if (!idToken) {
      return NextResponse.json(
        { error: 'Bu işlem için giriş yapılması zorunludur. Lütfen oturum açın.' },
        { status: 401 }
      );
    }

    // 2. Token doğruluğunu kontrol et
    const isValid = await verifyFirebaseToken(idToken);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Geçersiz veya süresi dolmuş kullanıcı oturumu.' },
        { status: 401 }
      );
    }

    const { teamId, teamName, probability, groupLetter } = await request.json();

    if (!teamId || !teamName) {
      return NextResponse.json(
        { error: 'teamId ve teamName parametreleri zorunludur.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      const prompt = `Sen profesyonel bir futbol analiz uzmanısın. 2026 FIFA Dünya Kupası'ndaki ${teamName} takımı (Kazanma olasılığı %${probability || 0}, ${groupLetter || 'Bilinmeyen'} Grubu) için Türkçe olarak kısa, taktiksel, heyecan verici ve gerçekçi 2-3 cümlelik bir turnuva analizi yaz. Klişelerden uzak dur, taktiksel terimler (örneğin; geçiş hücumu, bloklar arası mesafe, gegenpress, alçak blok vb.) kullan. Yanıtında başka bir açıklama veya markdown biçimlendirmesi (örneğin kal kalın yazılar) olmasın, doğrudan analiz metnini dön.`;

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: prompt,
                    },
                  ],
                },
              ],
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const analysisText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (analysisText) {
            return NextResponse.json({ analysis: analysisText.trim() });
          }
        }
        console.warn("Gemini API çağrısı başarısız oldu veya geçersiz veri döndü, yedek analize geçiliyor.");
      } catch (apiError) {
        console.error("Gemini API çağrı hatası:", apiError);
      }
    }

    // YEDEK MEKANİZMA (MOCK FALLBACK)
    // API anahtarı yoksa veya hata verirse takıma özel gerçekçi taktiksel metinler üretecektir.
    const fallbackAnalyses: { [key: string]: string } = {
      mexico: `${teamName}, ev sahibi avantajıyla geçiş hücumlarında dikey pas kalitesini en üst seviyeye çıkaracaktır. Seyirci coşkusuyla alçak blokları aşmakta zorlanmayacaklar ancak savunma arkası sızmalara karşı dikkatli olmaları gerekir.`,
      turkiye: `${teamName}, orta sahada Hakan Çalhanoğlu liderliğindeki yaratıcı merkez kurgusu ve genç yeteneklerinin dinamizmiyle 3. bölgede tehlikeli aksiyonlar üretecektir. Pres gücü yüksek bu kadro, turnuvada sürpriz bir derinlik yakalamaya oldukça yakın.`,
      spain: `${teamName}, %${probability} şampiyonluk ihtimaliyle turnuvanın pas oyununu dikte edecek en güçlü adayıdır. Rakip yarı sahada yarım alan (half-space) kullanımında son derece etkililer ve turnuva ağacında finale kadar giden yolda favoriler.`,
      brazil: `${teamName}, hücum hattındaki yaratıcı kanat forvetleri ve bire birdeki üstün yetenekleri ile her an skoru değiştirebilecek dinamizme sahip. Geçiş savunmasındaki konsantrasyon kaybını önlerlerse turnuvanın en büyük favorilerinden biri olurlar.`,
      argentina: `${teamName}, orta sahadaki sert pres gücü ve hücum geçişlerindeki mükemmel senkronizasyonu ile turnuvanın en dengeli takımı durumunda. Rakip bloklar arasındaki boşlukları cezalandırma becerileri onları yine en tepeye taşıyabilir.`,
      germany: `${teamName}, kompakt savunma yapısı ve merkezdeki pas istasyonlarının kalitesiyle klasik bir turnuva takımı refleksine sahip. Gegenpress uygulamalarındaki verimlilikleri grubun kaderini doğrudan etkileyecektir.`,
      france: `${teamName}, atletik yapısı, hızlı hücum geçişleri ve son vuruşlardaki öldürücü bitiriciliği ile rakiplerine karşı ezici bir fiziksel üstünlüğe sahip. Çeyrek final ve ötesi için yolları son derece açık görünüyor.`,
    };

    const defaultFallback = `${teamName} takımı, turnuva simülasyonlarında ve veri modellerinde güçlü bir grafik çiziyor. Turnuvayı kazanma ihtimali %${probability || 2} olarak ölçülen ekip, orta saha dinamizmi ve fiziksel güç dengesi sayesinde ${groupLetter || 'ilgili'} grubunda önemli bir iddia sahibi olacaktır.`;

    const analysis = fallbackAnalyses[teamId.toLowerCase()] || defaultFallback;
    return NextResponse.json({ analysis });

  } catch (error: any) {
    console.error("Next.js API rotası hatası:", error);
    return NextResponse.json(
      { error: error.message || 'Sunucu hatası oluştu.' },
      { status: 500 }
    );
  }
}
