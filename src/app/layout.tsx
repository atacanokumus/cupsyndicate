import './globals.css';
import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import Script from 'next/script';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CupSyndicate | World Cup 2026 Prediction Wizard',
  description: 'World Cup 2026 Bracket, Prediction, and Social League Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || 'ca-pub-3940256099942544';

  return (
    <html lang="tr" className={`${inter.variable} ${outfit.variable} font-sans`}>
      <head>
        {/* Google AdSense Script */}
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        {/* Google Publisher Tag (GPT) Script */}
        <Script
          async
          src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"
          strategy="afterInteractive"
        />
      </head>
      <body className="antialiased bg-slate-950 text-slate-100">{children}</body>
    </html>
  );
}

