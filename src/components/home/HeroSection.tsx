import React from 'react';
import { ArrowRight, Sparkles, Shield, Flame, Gift } from 'lucide-react';
import { DemoBadge } from '../common/DemoBadge';
import { CategorySlug } from '../../types';

interface HeroSectionProps {
  onExploreCatalog: (category?: CategorySlug | 'all') => void;
  onExploreCandles: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExploreCatalog,
  onExploreCandles,
}) => {
  return (
    <section className="relative overflow-hidden bg-[#241f1c] text-[#f7f4ef]">
      {/* Background with warm ambient lighting & texture */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity scale-105 transition-transform duration-1000 ease-out"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=1920&q=80')`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#201c1a] via-[#201c1a]/85 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#201c1a] via-transparent to-black/20" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
        <div className="max-w-2xl space-y-8">
          
          {/* Subtle Pill */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs tracking-wider uppercase font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Nouvelle Collection Harmonie 2026
            </span>
            <DemoBadge label="Boutique Démo Bénin" />
          </div>

          {/* Headline */}
          <div className="space-y-4">
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal leading-[1.15] text-[#f5ede3] tracking-tight">
              Sublimez votre intérieur d’émotions et de <span className="italic font-serif font-light text-amber-300">senteurs rares</span>.
            </h1>
            <p className="text-stone-300 text-base sm:text-lg font-light leading-relaxed max-w-xl">
              ZStore Bénin réinvente l’art de vivre à Cotonou : bougies parfumées coulées à la cire de soja pure, diffuseurs d'exception, vases sculpturaux en terre cuite et coffrets cadeaux d'un raffinement absolu.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
            <button
              onClick={() => onExploreCatalog('all')}
              className="px-8 py-4 bg-amber-700 hover:bg-amber-600 text-white rounded-full font-medium text-xs sm:text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 group cursor-pointer"
            >
              <span>Explorer la Collection</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onExploreCandles}
              className="px-8 py-4 bg-stone-900/60 hover:bg-stone-800/80 border border-stone-600 text-stone-200 hover:text-white rounded-full font-medium text-xs sm:text-sm tracking-wider uppercase transition-all backdrop-blur-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Nos Bougies d’Artisan</span>
            </button>
          </div>

          {/* Trust Guarantees */}
          <div className="pt-8 border-t border-stone-800/80 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs text-stone-400">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-amber-900/40 border border-amber-700/50 flex items-center justify-center text-amber-400 shrink-0">
                <Flame className="w-3.5 h-3.5" />
              </div>
              <span>Cire 100% Végétale de Soja</span>
            </div>
            
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-amber-900/40 border border-amber-700/50 flex items-center justify-center text-amber-400 shrink-0">
                <Gift className="w-3.5 h-3.5" />
              </div>
              <span>Écrins Cadeaux Prêts à Offrir</span>
            </div>

            <div className="flex items-center gap-2.5 col-span-2 sm:col-span-1">
              <div className="w-7 h-7 rounded-full bg-amber-900/40 border border-amber-700/50 flex items-center justify-center text-amber-400 shrink-0">
                <Shield className="w-3.5 h-3.5" />
              </div>
              <span>Livraison Sécurisée Tout Bénin</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
