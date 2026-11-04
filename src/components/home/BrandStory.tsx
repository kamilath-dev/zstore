import React from 'react';
import { Sparkles, Flame, Heart, Compass, ShieldCheck } from 'lucide-react';
import { CategorySlug } from '../../types';

interface BrandStoryProps {
  onExploreCatalog: (category: CategorySlug | 'all') => void;
}

export const BrandStory: React.FC<BrandStoryProps> = ({ onExploreCatalog }) => {
  return (
    <section className="py-20 sm:py-28 bg-[#f5ede3] text-[#262220] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Story Block: Dual Column Editorial */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left: Imagery Composition */}
          <div className="lg:col-span-6 relative">
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border border-stone-300">
              <img
                src="https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1200&q=85"
                alt="Atelier ZStore Bénin"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white p-4 bg-stone-900/60 backdrop-blur-md rounded-2xl border border-white/20">
                <p className="font-serif text-lg font-medium">Showroom & Atelier de Création</p>
                <p className="text-xs text-stone-300 mt-0.5">Quartier Haie Vive, Cotonou — République du Bénin</p>
              </div>
            </div>

            {/* Floating Accent Card */}
            <div className="hidden sm:block absolute -bottom-6 -right-6 bg-white p-5 rounded-2xl shadow-xl border border-stone-200 max-w-xs">
              <div className="flex items-center gap-2 text-amber-800 font-semibold text-xs mb-1">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>100% Coulé à la Main</span>
              </div>
              <p className="text-stone-600 text-xs leading-relaxed">
                Chaque bougie est coulée à la main en petites séries pour garantir une diffusion pure et généreuse.
              </p>
            </div>
          </div>

          {/* Right: Text Narrative */}
          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs uppercase tracking-[0.25em] text-amber-800 font-semibold block">
              La Philosophie ZStore Bénin
            </span>

            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal leading-tight text-stone-900">
              L'art de vivre sublimé par l'émotion et l'authenticité.
            </h2>

            <p className="text-stone-700 text-sm sm:text-base leading-relaxed font-light">
              Née à Cotonou de la passion pour le design raffiné et la haute parfumerie d'intérieur, la Maison <strong>ZStore Bénin</strong> célèbre la beauté des intérieurs chaleureux. Nous croyons qu'une maison est bien plus qu'un espace : c'est un sanctuaire de sérénité, de parfums apaisants et d'objets d'art qui racontent une histoire.
            </p>

            <p className="text-stone-600 text-xs sm:text-sm leading-relaxed font-light">
              Nos collections conjuguent des matières nobles et durables — grès naturel chamotté, travertin beige, verre soufflé ambré — avec des formules olfactives travaillées à Grasse selon les plus hauts standards de la parfumerie fine.
            </p>

            {/* Three Pillars */}
            <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-white/80 p-4 rounded-xl border border-stone-200">
                <Flame className="w-5 h-5 text-amber-700 mb-2" />
                <h4 className="font-bold text-stone-900 mb-1">Cires Végétales</h4>
                <p className="text-stone-500 leading-snug">Soja 100% végétal sans paraffine toxique ni OGM.</p>
              </div>

              <div className="bg-white/80 p-4 rounded-xl border border-stone-200">
                <Compass className="w-5 h-5 text-amber-700 mb-2" />
                <h4 className="font-bold text-stone-900 mb-1">Design Singulier</h4>
                <p className="text-stone-500 leading-snug">Vases et sculptures aux lignes épurées et organiques.</p>
              </div>

              <div className="bg-white/80 p-4 rounded-xl border border-stone-200">
                <Heart className="w-5 h-5 text-amber-700 mb-2" />
                <h4 className="font-bold text-stone-900 mb-1">L'Art d'Offrir</h4>
                <p className="text-stone-500 leading-snug">Écrins noirs et rubans terracotta pour des cadeaux inoubliables.</p>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={() => onExploreCatalog('all')}
                className="px-6 py-3 bg-[#262220] hover:bg-stone-800 text-white rounded-full text-xs uppercase tracking-wider font-semibold transition-all shadow-md"
              >
                Découvrir Toutes les Créations de la Maison
              </button>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
