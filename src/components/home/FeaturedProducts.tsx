import React, { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { ProductCard } from '../catalog/ProductCard';
import { Product, CategorySlug } from '../../types';

interface FeaturedProductsProps {
  onOpenDetails: (product: Product) => void;
  onExploreCatalog: (category: CategorySlug | 'all') => void;
}

export const FeaturedProducts: React.FC<FeaturedProductsProps> = ({
  onOpenDetails,
  onExploreCatalog,
}) => {
  const { products } = useStore();
  const [filterMode, setFilterMode] = useState<'bestseller' | 'new' | 'candles'>('bestseller');

  const filtered = products.filter((p) => {
    if (filterMode === 'bestseller') return p.isBestseller || p.rating >= 4.8;
    if (filterMode === 'new') return p.isNewArrival;
    if (filterMode === 'candles') return p.category === 'bougies';
    return true;
  });
  const displayedProducts = (filtered.length > 0 ? filtered : products).slice(0, 6);

  return (
    <section className="py-20 sm:py-24 bg-[#faf8f5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs uppercase tracking-[0.25em] text-amber-800 font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sélection Exclusivité</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 font-normal">
              Les Créations Préférées de Cotonou
            </h2>
          </div>

          {/* Filter Pills */}
          <div className="flex bg-stone-200/70 p-1 rounded-full text-xs font-medium self-start sm:self-auto">
            <button
              onClick={() => setFilterMode('bestseller')}
              className={`px-4 py-1.5 rounded-full transition-all ${
                filterMode === 'bestseller'
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Incontournables
            </button>
            <button
              onClick={() => setFilterMode('new')}
              className={`px-4 py-1.5 rounded-full transition-all ${
                filterMode === 'new'
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Nouveautés
            </button>
            <button
              onClick={() => setFilterMode('candles')}
              className={`px-4 py-1.5 rounded-full transition-all ${
                filterMode === 'candles'
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Bougies
            </button>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {displayedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onOpenDetails={onOpenDetails}
            />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <button
            onClick={() => onExploreCatalog('all')}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-white border border-stone-300 hover:border-amber-700 text-stone-900 rounded-full text-xs uppercase tracking-wider font-semibold transition-all shadow-xs hover:shadow-md"
          >
            <span>Voir Toutes nos Collections (Bougies, Vases, Diffuseurs)</span>
            <ArrowRight className="w-4 h-4 text-amber-800" />
          </button>
        </div>

      </div>
    </section>
  );
};
