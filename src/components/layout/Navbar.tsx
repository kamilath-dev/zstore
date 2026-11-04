import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Heart, 
  Search, 
  User, 
  Menu, 
  X, 
  ShieldAlert, 
  MapPin, 
  Phone,
  Sparkles
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { formatPrice } from '../../utils/currency';
import { CategorySlug } from '../../types';

interface NavbarProps {
  onOpenProfile: () => void;
  onOpenWishlist: () => void;
  onOpenAdmin: () => void;
  onNavigateHome: () => void;
  onNavigateCatalog: (category?: CategorySlug | 'all') => void;
  onNavigateStory: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenProfile,
  onOpenWishlist,
  onOpenAdmin,
  onNavigateHome,
  onNavigateCatalog,
  onNavigateStory,
}) => {
  const { 
    cartTotalCount, 
    cartSubtotal, 
    setIsCartOpen, 
    wishlistCount, 
    selectedCategory,
    searchQuery,
    setSearchQuery
  } = useStore();
  const { user, isAdmin, openAuthModal } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSearchInput, setShowSearchInput] = useState(false);

  const categories: { label: string; slug: CategorySlug | 'all' }[] = [
    { label: 'Tous nos Objets', slug: 'all' },
    { label: 'Bougies Parfumées', slug: 'bougies' },
    { label: 'Diffuseurs', slug: 'diffuseurs' },
    { label: 'Vases & Céramiques', slug: 'vases' },
    { label: 'Art de Vivre', slug: 'decoration' },
    { label: 'Coffrets Écrins', slug: 'coffrets' },
  ];

  const handleCategoryClick = (slug: CategorySlug | 'all') => {
    onNavigateCatalog(slug);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#faf8f5]/95 backdrop-blur-md border-b border-stone-200/70 transition-all duration-200">
      {/* Top Announcement Bar */}
      <div className="bg-[#262220] text-[#e8dfd5] text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-amber-300 font-medium tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              Livraison offerte à Cotonou dès 35 000 FCFA
            </span>
            <span className="hidden md:inline text-stone-500">•</span>
            <span className="hidden md:flex items-center gap-1 text-stone-300">
              <MapPin className="w-3 h-3 text-stone-400" />
              Showroom Haie Vive, Cotonou
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-stone-300">
            <a 
              href="https://wa.me/22997000000" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-amber-300 transition-colors flex items-center gap-1"
            >
              <Phone className="w-3 h-3" />
              WhatsApp: +229 97 00 00 00
            </a>
            <span className="text-stone-600">|</span>
            <button
              onClick={onOpenAdmin}
              className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${
                isAdmin 
                  ? 'bg-amber-600 text-white font-semibold' 
                  : 'hover:text-amber-300 text-stone-400'
              }`}
              title="Accès au Tableau de Bord Administrateur ZStore"
            >
              <ShieldAlert className="w-3 h-3" />
              <span>{isAdmin ? 'Espace Admin Actif' : 'Portail Admin'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Mobile Menu Button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-stone-700 hover:text-stone-900 focus:outline-none"
              aria-label="Ouvrir le menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Brand Logo */}
          <div className="flex-1 lg:flex-none flex items-center justify-center lg:justify-start">
            <button 
              onClick={onNavigateHome}
              className="text-left group focus:outline-none"
            >
              <div className="flex items-baseline gap-1.5">
                <span className="font-serif text-2xl sm:text-3xl font-semibold tracking-wider text-stone-900 group-hover:text-stone-700 transition-colors">
                  ZSTORE
                </span>
                <span className="text-xs uppercase font-light tracking-[0.25em] text-amber-800 font-sans">
                  Bénin
                </span>
              </div>
              <p className="text-[9px] uppercase tracking-[0.2em] text-stone-500 font-sans font-medium">
                Maison & Fragrances
              </p>
            </button>
          </div>

          {/* Desktop Category Navigation */}
          <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.slug;
              return (
                <button
                  key={cat.slug}
                  onClick={() => handleCategoryClick(cat.slug)}
                  className={`px-3 py-2 text-xs uppercase tracking-wider font-medium transition-all rounded-md ${
                    isActive
                      ? 'text-amber-900 border-b-2 border-amber-800 font-semibold'
                      : 'text-stone-700 hover:text-stone-950 hover:bg-stone-100/60'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
            <button
              onClick={onNavigateStory}
              className="px-3 py-2 text-xs uppercase tracking-wider font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100/60 rounded-md transition-all"
            >
              La Maison
            </button>
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            
            {/* Search Toggle / Input */}
            <div className="relative">
              {showSearchInput ? (
                <div className="flex items-center bg-stone-100 rounded-full px-3 py-1.5 border border-stone-300 w-44 sm:w-64 transition-all">
                  <Search className="w-4 h-4 text-stone-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    placeholder="Bougie, santal, vase..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs bg-transparent focus:outline-none text-stone-800"
                    autoFocus
                  />
                  <button 
                    onClick={() => {
                      setShowSearchInput(false);
                      setSearchQuery('');
                    }}
                    className="text-stone-400 hover:text-stone-600 ml-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowSearchInput(true)}
                  className="p-2 text-stone-700 hover:text-stone-900 hover:bg-stone-100/80 rounded-full transition-colors"
                  title="Rechercher un produit"
                >
                  <Search className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Wishlist */}
            <button
              onClick={onOpenWishlist}
              className="relative p-2 text-stone-700 hover:text-stone-900 hover:bg-stone-100/80 rounded-full transition-colors hidden sm:block cursor-pointer"
              title="Mes Favoris"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-amber-700 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* User Account / Profile */}
            <button
              onClick={user ? onOpenProfile : () => openAuthModal()}
              className="p-2 text-stone-700 hover:text-stone-900 hover:bg-stone-100/80 rounded-full transition-colors relative"
              title={user ? `Compte (${user.displayName})` : 'Connexion / Inscription'}
            >
              <User className="w-5 h-5" />
              {user && (
                <span className="absolute bottom-1 right-1 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white"></span>
              )}
            </button>

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2 pl-3 pr-4 py-2 bg-[#262220] hover:bg-[#38332f] text-[#f7f4ef] rounded-full transition-all shadow-sm group"
              title="Voir mon panier"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4 group-hover:scale-105 transition-transform" />
                {cartTotalCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-amber-600 text-white rounded-full text-[9px] w-4 h-4 flex items-center justify-center font-bold">
                    {cartTotalCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium hidden md:inline">
                {cartSubtotal > 0 ? formatPrice(cartSubtotal) : 'Panier'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-stone-200 bg-[#faf8f5] px-4 pt-4 pb-6 space-y-3 shadow-xl">
          <p className="text-[11px] uppercase tracking-widest text-stone-400 font-semibold px-2">
            Collections ZStore
          </p>
          <div className="grid grid-cols-1 gap-1">
            {categories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => handleCategoryClick(cat.slug)}
                className={`text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${
                  selectedCategory === cat.slug
                    ? 'bg-amber-100/70 text-amber-900 font-semibold'
                    : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                <span>{cat.label}</span>
                <span className="text-xs text-stone-400 font-mono">→</span>
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-stone-200 space-y-2">
            <button
              onClick={() => {
                onNavigateStory();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm text-stone-700 hover:bg-stone-100 rounded-lg font-medium"
            >
              L'Histoire & Les Ateliers de la Maison
            </button>
            <div className="flex items-center justify-between px-3 pt-2 text-xs text-stone-500">
              <span>Showroom Haie Vive, Cotonou</span>
              <a href="tel:+22997000000" className="text-amber-800 font-medium">
                +229 97 00 00 00
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
