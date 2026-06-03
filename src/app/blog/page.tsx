import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { BLOG_POSTS } from '../../lib/blogData';
import { Calendar, Clock, ChevronRight, BookOpen } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Futbol Analiz Blogu | KupaTahmini.com',
  description: 'Dünya Kupası 2026 analizleri, turnuva ağacı (bracket) yapma taktikleri, grup ihtimalleri ve futbol istatistiklerine dair güncel rehberler.',
};

export default function BlogListPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between">
      <div>
        <Header />
        
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-12">
            
            {/* Header section */}
            <div className="text-center space-y-4">
              <h1 className="text-4xl sm:text-5xl font-black text-white bg-gradient-to-r from-violet-300 via-pink-300 to-amber-200 bg-clip-text text-transparent glow-text-violet">
                KupaTahmini Blog
              </h1>
              <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
                Dünya Kupası 2026 turnuva ağacı tahminlerinizi güçlendirecek, istatistiksel olasılık hesapları ve güncel futbol analizleri içeren özgün rehberlerimiz.
              </p>
            </div>

            {/* Articles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {BLOG_POSTS.map((post) => (
                <article 
                  key={post.slug} 
                  className="glass-card glass-card-hover rounded-3xl border border-white/10 overflow-hidden flex flex-col justify-between shadow-lg"
                >
                  <div className="p-6 space-y-4">
                    {/* Category */}
                    <div className="flex items-center justify-between">
                      <span className="bg-violet-900/30 text-violet-300 border border-violet-800/30 px-2 py-0.5 rounded text-[10px] font-bold">
                        {post.category}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-base font-bold text-white leading-snug line-clamp-2">
                      <Link href={`/blog/${post.slug}`} className="hover:text-violet-400 transition">
                        {post.title}
                      </Link>
                    </h2>

                    {/* Excerpt */}
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                      {post.excerpt}
                    </p>
                  </div>

                  {/* Card Footer */}
                  <div className="px-6 py-4 bg-slate-900/30 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{post.date}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{post.readTime}</span>
                      </span>
                    </div>

                    <Link 
                      href={`/blog/${post.slug}`}
                      className="text-violet-400 hover:text-violet-300 font-bold flex items-center gap-0.5 group text-[10px]"
                    >
                      <span>Oku</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {/* Empty check just in case */}
            {BLOG_POSTS.length === 0 && (
              <div className="text-center py-16 glass-card rounded-3xl border border-white/10">
                <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500">Şu an gösterilecek yazı bulunmamaktadır.</p>
              </div>
            )}

          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
