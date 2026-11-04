import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { CategorySlug } from '../../types';

interface CategoryBannersProps {
  onSelectCategory: (category: CategorySlug) => void;
}

export const CategoryBanners: React.FC<CategoryBannersProps> = ({ onSelectCategory }) => {
  const { categories, products } = useStore();

  const getCount = (slug: string) => {
    return products.filter((p) => p.category === slug).length;
  };

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <section className="py-16 sm:py-24 bg-[#faf8f5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] text-amber-800 font-semibold">
              Univers d'Exception
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 mt-2 font-normal">
              Les Signatures de la Maison
            </h2>
          </div>
          <p className="text-stone-500 text-xs sm:text-sm max-w-md leading-relaxed">
            Des matières vivantes, des fragrances assemblées avec minutie et des pièces créées pour insuffler poésie et sérénité à vos espaces de vie.
          </p>
        </div>

        {/* Categories Grid (Asymmetrical high-fashion layout) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {categories.map((cat, idx) => {
            const count = getCount(cat.slug);
            // Asymmetrical layout logic: first item takes col-span-7, second takes col-span-5, others col-span-4
            let colSpan = 'md:col-span-4';
            let heightClass = 'h-72';
            if (idx === 0) {
              colSpan = 'md:col-span-7';
              heightClass = 'h-80 sm:h-96';
            } else if (idx === 1) {
              colSpan = 'md:col-span-5';
              heightClass = 'h-80 sm:h-96';
            }

            return (
              <div 
                key={cat.id || cat.slug}
                onClick={() => onSelectCategory(cat.slug)}
                className={`${colSpan} group relative ${heightClass} rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300`}
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/30 to-transparent" />
                <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-between text-white">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] tracking-widest uppercase bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30">
                      {count} {count > 1 ? 'créations' : 'création'}
                    </span>
                    <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center group-hover:bg-amber-600 transition-colors">
                      <ArrowUpRight className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl sm:text-3xl font-semibold">
                      {cat.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-stone-300 mt-1.5 max-w-sm font-light line-clamp-2">
                      {cat.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
