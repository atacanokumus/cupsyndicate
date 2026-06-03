'use client';

import React from 'react';
import { Send, MessageSquare } from 'lucide-react';

export default function ContactForm() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Mesajınız başarıyla iletildi! (Mockup Gönderim)');
  };

  return (
    <div className="md:col-span-2 glass-card rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6 shadow-2xl">
      <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
        <MessageSquare className="w-5 h-5 text-violet-400" />
        <span>Bize Mesaj Gönderin</span>
      </h2>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Adınız</label>
            <input
              type="text"
              placeholder="Örn: Ahmet Yılmaz"
              className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">E-posta Adresiniz</label>
            <input
              type="email"
              placeholder="ahmet@example.com"
              className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Konu</label>
          <input
            type="text"
            placeholder="Geri bildirim, hata bildirimi, ortaklık vb."
            className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mesajınız</label>
          <textarea
            rows={5}
            placeholder="Mesajınızı buraya yazın..."
            className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition resize-none"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-500 hover:to-indigo-550 text-white font-bold py-3.5 rounded-xl text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg hover:scale-[1.01] transition-all font-display"
        >
          <Send className="w-4 h-4" />
          <span>Mesajı Gönder</span>
        </button>
      </form>
    </div>
  );
}
