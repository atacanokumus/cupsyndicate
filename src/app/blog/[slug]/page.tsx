import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { BLOG_POSTS } from '../../../lib/blogData';
import { Calendar, Clock, ChevronLeft, Award } from 'lucide-react';

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

// SSG için statik slug parametreleri üretme
export async function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({
    slug: post.slug,
  }));
}

// Dinamik Meta Veri Tanımı
export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const post = BLOG_POSTS.find((p) => p.slug === params.slug);
  if (!post) return {};
  
  return {
    title: `${post.title} | KupaTahmini.com Blog`,
    description: post.excerpt,
  };
}

export default function BlogPostDetailPage({ params }: BlogPostPageProps) {
  const post = BLOG_POSTS.find((p) => p.slug === params.slug);
  
  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <div>
        <Header />
        
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-8">
            
            {/* Back Button */}
            <Link 
              href="/blog"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-violet-400 transition group font-bold"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition" />
              <span>Geri Dön</span>
            </Link>

            {/* Main Article Container */}
            <article className="glass-card rounded-3xl p-6 sm:p-10 border border-white/10 space-y-6 shadow-2xl">
              
              {/* Header Details */}
              <div className="space-y-4 border-b border-white/5 pb-6">
                
                {/* Category & Stats */}
                <div className="flex flex-wrap gap-2 items-center text-[10px] text-slate-400">
                  <span className="bg-violet-900/30 text-violet-300 border border-violet-800/30 px-2.5 py-0.5 rounded font-bold uppercase tracking-wider">
                    {post.category}
                  </span>
                  <div className="flex items-center gap-2 ml-1 text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{post.date}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{post.readTime}</span>
                    </span>
                  </div>
                </div>

                {/* Title */}
                <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight font-display glow-text-violet">
                  {post.title}
                </h1>

                {/* Excerpt Summary Box */}
                <div className="p-4 bg-slate-900/40 border-l-4 border-violet-500 rounded-r-xl text-slate-300 text-xs italic leading-relaxed">
                  {post.excerpt}
                </div>
              </div>

              {/* Rich Content paragraphs */}
              <div className="space-y-5 text-slate-300 text-xs leading-relaxed font-sans">
                {post.content.map((paragraph, index) => (
                  <p key={index} className="indent-4">
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Author badge box */}
              <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500">
                <div className="flex items-center gap-2">
                  <div className="bg-gradient-to-r from-violet-500/20 to-indigo-500/20 border border-violet-500/30 p-1.5 rounded-full text-violet-400">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-white">KupaTahmini.com Editör Masası</p>
                    <p className="text-[9px]">Futbol Analitiği ve Olasılık Departmanı</p>
                  </div>
                </div>
                <div className="font-mono bg-slate-900/60 border border-white/5 px-2.5 py-1 rounded text-[9px]">
                  Özgün İçerik
                </div>
              </div>

            </article>

          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
