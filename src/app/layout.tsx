import './globals.css';
import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';

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
  return (
    <html lang="tr" className={`${inter.variable} ${outfit.variable} font-sans`}>
      <body className="antialiased bg-slate-950 text-slate-100">{children}</body>
    </html>
  );
}
