import React, { useState, useMemo } from 'react';
import { 
  Filter, 
  X, 
  Search, 
  SlidersHorizontal, 
  RotateCcw,
  Sparkles,
  Flame,
  Check
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { ProductCard } from './ProductCard';
import { Product, CategorySlug } from '../../types';
import { formatPrice } from '../../utils/currency';

interface ProductCatalogProps {
  onOpenDetails: (product: Product) => void;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({ onOpenDetails }) => {
  const { 
    products, 
    categories, 
    isProductsLoading,
    productsError,
    categoriesError,
    selectedCategory, 
    setSelectedCategory, 
    searchQuery, 
    setSearchQuery,
    sortBy,
    setSortBy,
    priceRange,
    setPriceRange,
    inStockOnly,
    setInStockOnly,
    activeScentNote,
    setActiveScentNote
  } = useStore();

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const scentNotesList = [
    { label: 'Tous', value: null },
    { label: 'Ambre & Vanille', value: 'ambre' },
    { label: 'Boisé & Santal', value: 'bois' },
    { label: 'Fleur d\'oranger & Néroli', value: 'neroli' },
    { label: 'Cacao & Épices', value: 'cacao' },
  ];

  // Filtering & Sorting
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (selectedCategory !== 'all' && p.category !== selectedCategory) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesDesc = p.description.toLowerCase().includes(query);
        const matchesCat = p.categoryName.toLowerCase().includes(query);
        const matchesTag = p.tagline.toLowerCase().includes(query);
        const matchesOlfactory = p.olfactoryPyramid && (
          p.olfactoryPyramid.topNotes.some(n => n.toLowerCase().includes(query)) ||
          p.olfactoryPyramid.heartNotes.some(n => n.toLowerCase().includes(query)) ||
          p.olfactoryPyramid.baseNotes.some(n => n.toLowerCase().includes(query))
        );
        if (!matchesName && !matchesDesc && !matchesCat && !matchesTag && !matchesOlfactory) {
          return false;
        }
      }

      // Price filter
      if (p.price > priceRange[1]) {
        return false;
      }

      // In stock
      if (inStockOnly && p.stock === 0) {
        return false;
      }

      // Scent note
      if (activeScentNote) {
        const textToSearch = `${p.name} ${p.tagline} ${p.description} ${p.olfactoryPyramid?.topNotes.join(' ')} ${p.olfactoryPyramid?.heartNotes.join(' ')} ${p.olfactoryPyramid?.baseNotes.join(' ')}`.toLowerCase();
        if (!textToSearch.includes(activeScentNote.toLowerCase())) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'newest') return (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0);
      // 'featured'
      return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
    });
  }, [products, selectedCategory, searchQuery, priceRange, inStockOnly, activeScentNote, sortBy]);

  const resetFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setPriceRange([0, 100000]);
    setInStockOnly(false);
    setActiveScentNote(null);
    setSortBy('featured');
  };

  const hasActiveFilters = 
    selectedCategory !== 'all' || 
    searchQuery.trim() !== '' || 
    priceRange[1] < 100000 || 
    inStockOnly || 
    activeScentNote !== null;

  return (
    <section className="py-12 sm:py-16 bg-[#faf8f5] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb & Title */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs text-stone-500 mb-2">
            <span>Accueil</span>
            <span>/</span>
            <span className="text-amber-900 font-medium capitalize">
              {selectedCategory === 'all' ? 'Toutes les Créations' : selectedCategory}
            </span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl text-stone-900 font-normal">
                {selectedCategory === 'all' 
                  ? 'Catalogue de la Maison ZStore' 
                  : categories.find(c => c.slug === selectedCategory)?.name || 'Objets Décoratifs'}
              </h1>
              <p className="text-stone-500 text-xs sm:text-sm mt-1 max-w-xl">
                {selectedCategory === 'all'
                  ? 'Explorez notre sélection artisanale de bougies, parfums d’ambiance, vases et coffrets pour un intérieur empreint de sérénité.'
                  : categories.find(c => c.slug === selectedCategory)?.description}
              </p>
            </div>
            
            {/* Results count & Mobile filter toggle */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-stone-500 font-medium">
                {filteredProducts.length} pièce{filteredProducts.length > 1 ? 's' : ''} disponible{filteredProducts.length > 1 ? 's' : ''}
              </span>
              <button
                onClick={() => setMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-medium border border-stone-300"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filtres</span>
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full text-xs uppercase tracking-wider font-medium whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-[#262220] text-[#faf8f5] shadow-xs'
                : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
            }`}
          >
            Tous nos Objets ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`px-4 py-2 rounded-full text-xs uppercase tracking-wider font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.slug
                  ? 'bg-amber-800 text-white shadow-xs'
                  : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Main Grid: Sidebar Filters (desktop) + Product Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Desktop Filter Sidebar */}
          <div className="hidden lg:block space-y-6 bg-white p-6 rounded-2xl border border-stone-200/80 h-fit sticky top-28 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <span className="font-serif text-lg font-semibold text-stone-900 flex items-center gap-2">
                <Filter className="w-4 h-4 text-amber-800" />
                Filtres & Préférences
              </span>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-xs text-amber-800 hover:text-amber-950 flex items-center gap-1 font-medium underline"
                >
                  <RotateCcw className="w-3 h-3" />
                  Réinitialiser
                </button>
              )}
            </div>

            {/* Search within catalog */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-700 block mb-2">
                Recherche par mot-clé
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Bougie, santal, vase..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 pl-9 focus:outline-none focus:border-amber-700"
                />
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Scent notes filter (for home fragrance lovers) */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-700 block mb-2 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-700" />
                Famille Olfactive
              </label>
              <div className="flex flex-wrap gap-1.5">
                {scentNotesList.map((sn, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveScentNote(sn.value)}
                    className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                      activeScentNote === sn.value
                        ? 'bg-amber-800 text-white font-medium'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {sn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Price slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-700">
                  Prix Maximum
                </label>
                <span className="text-xs font-bold text-amber-900">
                  {formatPrice(priceRange[1])}
                </span>
              </div>
              <input
                type="range"
                min="10000"
                max="80000"
                step="2500"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([0, Number(e.target.value)])}
                className="w-full accent-amber-800 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-stone-400 mt-1">
                <span>10 000 FCFA</span>
                <span>80 000 FCFA</span>
              </div>
            </div>

            {/* In stock only checkbox */}
            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-700">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="rounded text-amber-800 focus:ring-amber-500 accent-amber-800"
                />
                <span>Uniquement les articles en stock à Cotonou</span>
              </label>
            </div>

            {/* Sorting */}
            <div className="pt-2 border-t border-stone-200">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-700 block mb-2">
                Trier par
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl p-2.5 focus:outline-none focus:border-amber-700 text-stone-800 cursor-pointer"
              >
                <option value="featured">Sélection de la Maison</option>
                <option value="price-asc">Prix : Croissant</option>
                <option value="price-desc">Prix : Décroissant</option>
                <option value="rating">Mieux Notés</option>
                <option value="newest">Nouveautés</option>
              </select>
            </div>

          </div>

          {/* Product Grid Area */}
          <div className="lg:col-span-3">
            
            {/* Active filters pill list */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 mb-6 p-3 bg-amber-50/60 rounded-xl border border-amber-200/60 text-xs">
                <span className="text-stone-500 font-medium">Filtres actifs :</span>
                {selectedCategory !== 'all' && (
                  <span className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-full border border-stone-300 text-stone-800">
                    Catégorie: {selectedCategory}
                    <button onClick={() => setSelectedCategory('all')}><X className="w-3 h-3 text-stone-400" /></button>
                  </span>
                )}
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-full border border-stone-300 text-stone-800">
                    "{searchQuery}"
                    <button onClick={() => setSearchQuery('')}><X className="w-3 h-3 text-stone-400" /></button>
                  </span>
                )}
                {activeScentNote && (
                  <span className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-full border border-stone-300 text-stone-800">
                    Note: {activeScentNote}
                    <button onClick={() => setActiveScentNote(null)}><X className="w-3 h-3 text-stone-400" /></button>
                  </span>
                )}
                {inStockOnly && (
                  <span className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-full border border-stone-300 text-stone-800">
                    En stock uniquement
                    <button onClick={() => setInStockOnly(false)}><X className="w-3 h-3 text-stone-400" /></button>
                  </span>
                )}
              </div>
            )}

            {productsError && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between">
                <div>
                  <p className="font-semibold">Erreur de chargement du catalogue</p>
                  <p className="text-[11px] mt-0.5">{productsError}</p>
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="px-3 py-1 bg-rose-800 text-white rounded-lg text-xs font-medium hover:bg-rose-900"
                >
                  Actualiser
                </button>
              </div>
            )}
            {categoriesError && (
              <div role="alert" className="mb-6 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                {categoriesError}
              </div>
            )}

            {isProductsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="bg-white rounded-2xl p-4 border border-stone-200/70 animate-pulse space-y-4">
                    <div className="aspect-square bg-stone-100 rounded-xl w-full" />
                    <div className="space-y-2">
                      <div className="h-3 bg-stone-100 rounded w-1/3" />
                      <div className="h-4 bg-stone-200 rounded w-3/4" />
                      <div className="h-3 bg-stone-100 rounded w-1/2" />
                    </div>
                    <div className="pt-2 flex justify-between items-center border-t border-stone-100">
                      <div className="h-5 bg-stone-200 rounded w-1/3" />
                      <div className="w-8 h-8 bg-stone-100 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-stone-200">
                <div className="w-16 h-16 rounded-full bg-stone-100 mx-auto flex items-center justify-center text-stone-400 mb-4">
                  <Search className="w-8 h-8 stroke-1" />
                </div>
                <h3 className="font-serif text-xl font-medium text-stone-800">
                  {products.length === 0 
                    ? "Notre atelier prépare actuellement de nouvelles créations"
                    : "Aucune création ne correspond à vos critères"}
                </h3>
                <p className="text-stone-500 text-xs mt-1.5 max-w-sm mx-auto leading-relaxed">
                  {products.length === 0
                    ? "Les pièces artisanales seront réapprovisionnées très prochainement dans le showroom de Cotonou."
                    : "Essayez d'élargir votre recherche ou de réinitialiser les filtres pour découvrir nos bougies et pièces de décoration."}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="mt-6 px-6 py-2.5 bg-[#262220] text-[#faf8f5] rounded-full text-xs uppercase tracking-wider font-medium hover:bg-stone-800 transition-colors"
                  >
                    Afficher Tout le Catalogue
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onOpenDetails={onOpenDetails}
                  />
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Mobile Filters Modal */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden lg:hidden">
          <div 
            className="absolute inset-0 bg-stone-900/50 backdrop-blur-xs"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-sm bg-white shadow-2xl flex flex-col p-6 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-stone-200">
                <h3 className="font-serif text-lg font-semibold text-stone-900">
                  Filtres & Tri
                </h3>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-1.5 text-stone-400 hover:text-stone-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile sorting */}
              <div>
                <label className="text-xs font-semibold uppercase text-stone-700 block mb-2">
                  Trier par
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full text-xs bg-stone-50 border border-stone-200 rounded-lg p-2.5"
                >
                  <option value="featured">Sélection de la Maison</option>
                  <option value="price-asc">Prix : Croissant</option>
                  <option value="price-desc">Prix : Décroissant</option>
                  <option value="rating">Mieux Notés</option>
                </select>
              </div>

              {/* Mobile Price Slider */}
              <div>
                <div className="flex justify-between items-center mb-2 text-xs">
                  <span className="font-semibold text-stone-700">Prix Maximum</span>
                  <span className="font-bold text-amber-900">{formatPrice(priceRange[1])}</span>
                </div>
                <input
                  type="range"
                  min="10000"
                  max="80000"
                  step="2500"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([0, Number(e.target.value)])}
                  className="w-full accent-amber-800"
                />
              </div>

              {/* In stock */}
              <label className="flex items-center gap-2 text-xs text-stone-700">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="accent-amber-800"
                />
                <span>En stock uniquement</span>
              </label>

              <div className="pt-6 border-t border-stone-200 mt-auto flex gap-3">
                <button
                  onClick={resetFilters}
                  className="flex-1 py-3 border border-stone-300 text-stone-700 rounded-xl text-xs font-medium"
                >
                  Effacer
                </button>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="flex-1 py-3 bg-[#262220] text-white rounded-xl text-xs font-semibold"
                >
                  Appliquer ({filteredProducts.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
