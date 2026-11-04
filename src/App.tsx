/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StoreProvider, useStore } from './context/StoreContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { CartDrawer } from './components/layout/CartDrawer';
import { HeroSection } from './components/home/HeroSection';
import { CategoryBanners } from './components/home/CategoryBanners';
import { FeaturedProducts } from './components/home/FeaturedProducts';
import { ScentNotesGuide } from './components/home/ScentNotesGuide';
import { BrandStory } from './components/home/BrandStory';
import { Testimonials } from './components/home/Testimonials';
import { ProductCatalog } from './components/catalog/ProductCatalog';
import { ProductDetailModal } from './components/catalog/ProductDetailModal';
import { CheckoutModal } from './components/checkout/CheckoutModal';
import { OrderSuccessModal } from './components/checkout/OrderSuccessModal';
import { AuthModal } from './components/account/AuthModal';
import { UserProfileModal } from './components/account/UserProfileModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminLoginPage } from './components/admin/AdminLoginPage';
import { CategorySlug, Product } from './types';
import { 
  Home, 
  ShoppingBag, 
  Heart, 
  User, 
  Grid, 
  Sparkles, 
  ShieldCheck,
  Loader2
} from 'lucide-react';

function StoreApp() {
  const { 
    selectedProduct, 
    setSelectedProduct, 
    isCheckoutOpen, 
    setIsCheckoutOpen,
    lastConfirmedOrder,
    setLastConfirmedOrder,
    isAdminViewOpen,
    setIsAdminViewOpen,
    setSelectedCategory,
    setActiveScentNote,
    cartTotalCount,
    wishlistCount,
    setIsCartOpen,
    products
  } = useStore();

  const { isAdmin, isAuthLoading, firebaseUser } = useAuth();

  // Current Route tracking (/ , /catalog, /story, /admin/login, /admin/dashboard)
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname || '/');
  const [currentView, setCurrentView] = useState<'home' | 'catalog' | 'story'>('home');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileInitialTab, setProfileInitialTab] = useState<'orders' | 'wishlist' | 'profile'>('orders');

  // Sync browser path with history API
  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Navigation handlers
  const handleNavigateHome = () => {
    navigateTo('/');
    setCurrentView('home');
  };

  const handleNavigateCatalog = (category?: CategorySlug | 'all') => {
    if (category) {
      setSelectedCategory(category);
    }
    navigateTo('/catalog');
    setCurrentView('catalog');
  };

  const handleNavigateStory = () => {
    navigateTo('/story');
    setCurrentView('story');
  };

  const handleOpenProduct = (productOrId: Product | string) => {
    if (typeof productOrId === 'string') {
      const found = products.find(p => p.id === productOrId);
      if (found) setSelectedProduct(found);
    } else {
      setSelectedProduct(productOrId);
    }
  };

  const handleSelectScentFilter = (scent: string) => {
    setActiveScentNote(scent);
    setCurrentView('catalog');
    navigateTo('/catalog');
  };

  const handleOpenWishlist = () => {
    setProfileInitialTab('wishlist');
    setIsProfileOpen(true);
  };

  const handleOpenAdminPortal = () => {
    if (isAdmin) {
      navigateTo('/admin/dashboard');
      setIsAdminViewOpen(true);
    } else {
      navigateTo('/admin/login');
    }
  };

  // Route 1: Dedicated Admin Login Page (/admin/login)
  if (currentPath === '/admin/login') {
    return (
      <AdminLoginPage
        onSuccessNavigateDashboard={() => {
          navigateTo('/admin/dashboard');
          setIsAdminViewOpen(true);
        }}
        onNavigateHome={handleNavigateHome}
      />
    );
  }

  // Route 2: Dedicated Protected Admin Dashboard (/admin/dashboard)
  if (currentPath === '/admin/dashboard') {
    if (isAuthLoading) {
      return (
        <div className="min-h-screen bg-[#1c1917] text-white flex flex-col items-center justify-center p-6 space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
          <p className="font-serif text-lg">Vérification des droits d'administration ZStore...</p>
          <span className="text-xs text-stone-400 font-mono">Contrôle des Firebase Custom Claims (admin: true)</span>
        </div>
      );
    }

    if (!isAdmin) {
      return (
        <div className="min-h-screen bg-[#1c1917] text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#262220] rounded-3xl p-8 border border-rose-900/60 shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-rose-950/80 border border-rose-700/50 text-rose-400 mx-auto flex items-center justify-center">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold text-white">Accès Réservé à la Direction</h2>
              <p className="text-xs text-stone-300 mt-2 leading-relaxed">
                Le rôle de confiance <code className="bg-stone-900 px-1.5 py-0.5 rounded text-rose-300 font-mono">admin: true</code> n'est pas associé à votre session active.
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <button
                onClick={() => navigateTo('/admin/login')}
                className="w-full py-3 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-xs uppercase tracking-wider font-bold transition-all shadow-md cursor-pointer"
              >
                Se Connecter au Portail Admin
              </button>
              <button
                onClick={handleNavigateHome}
                className="w-full py-2.5 border border-stone-700 hover:bg-stone-800 text-stone-400 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Retourner à la Boutique Client
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#1c1917]">
        <AdminDashboard
          isOpen={true}
          onClose={() => {
            setIsAdminViewOpen(false);
            navigateTo('/');
          }}
        />
      </div>
    );
  }

  // Standard Storefront Layout (/ , /catalog, /story)
  return (
    <div className="min-h-screen flex flex-col bg-[#faf8f5] text-[#262220]">
      
      {/* Top Navbar */}
      <Navbar
        onOpenProfile={() => {
          setProfileInitialTab('orders');
          setIsProfileOpen(true);
        }}
        onOpenWishlist={handleOpenWishlist}
        onOpenAdmin={handleOpenAdminPortal}
        onNavigateHome={handleNavigateHome}
        onNavigateCatalog={handleNavigateCatalog}
        onNavigateStory={handleNavigateStory}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16 sm:pb-0">
        
        {currentView === 'home' && currentPath !== '/catalog' && currentPath !== '/story' && (
          <>
            <HeroSection
              onExploreCatalog={handleNavigateCatalog}
              onExploreCandles={() => handleNavigateCatalog('bougies')}
            />
            <CategoryBanners
              onSelectCategory={(cat) => handleNavigateCatalog(cat)}
            />
            <FeaturedProducts
              onOpenDetails={handleOpenProduct}
              onExploreCatalog={handleNavigateCatalog}
            />
            <ScentNotesGuide
              onSelectScentFilter={handleSelectScentFilter}
            />
            <BrandStory
              onExploreCatalog={handleNavigateCatalog}
            />
            <Testimonials />
          </>
        )}

        {(currentView === 'catalog' || currentPath === '/catalog') && (
          <ProductCatalog
            onOpenDetails={handleOpenProduct}
          />
        )}

        {(currentView === 'story' || currentPath === '/story') && (
          <div className="pt-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
              <button
                onClick={handleNavigateHome}
                className="text-xs text-amber-800 hover:underline flex items-center gap-1 cursor-pointer"
              >
                ← Retour à l'accueil
              </button>
            </div>
            <BrandStory onExploreCatalog={handleNavigateCatalog} />
            <Testimonials />
          </div>
        )}

      </main>

      {/* Footer */}
      <Footer
        onNavigateCatalog={handleNavigateCatalog}
        onNavigateStory={handleNavigateStory}
        onOpenAdmin={handleOpenAdminPortal}
      />

      {/* Mobile Bottom Quick Navigation Bar */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-stone-200 z-30 px-3 py-2 flex items-center justify-around shadow-lg">
        <button
          onClick={handleNavigateHome}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors cursor-pointer ${
            currentView === 'home' && currentPath === '/' ? 'text-amber-800 font-bold' : 'text-stone-500'
          }`}
        >
          <Home className="w-5 h-5" />
          <span>Accueil</span>
        </button>

        <button
          onClick={() => handleNavigateCatalog('all')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors cursor-pointer ${
            currentView === 'catalog' || currentPath === '/catalog' ? 'text-amber-800 font-bold' : 'text-stone-500'
          }`}
        >
          <Grid className="w-5 h-5" />
          <span>Boutique</span>
        </button>

        <button
          onClick={() => setIsCartOpen(true)}
          className="relative flex flex-col items-center gap-0.5 text-[10px] font-medium text-stone-500 cursor-pointer"
        >
          <ShoppingBag className="w-5 h-5" />
          {cartTotalCount > 0 && (
            <span className="absolute -top-1 right-2 bg-amber-700 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {cartTotalCount}
            </span>
          )}
          <span>Panier</span>
        </button>

        <button
          onClick={handleOpenWishlist}
          className="relative flex flex-col items-center gap-0.5 text-[10px] font-medium text-stone-500 cursor-pointer"
        >
          <Heart className="w-5 h-5" />
          {wishlistCount > 0 && (
            <span className="absolute -top-1 right-2 bg-amber-700 text-white text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">
              {wishlistCount}
            </span>
          )}
          <span>Favoris</span>
        </button>

        <button
          onClick={() => {
            setProfileInitialTab('profile');
            setIsProfileOpen(true);
          }}
          className="flex flex-col items-center gap-0.5 text-[10px] font-medium text-stone-500 cursor-pointer"
        >
          <User className="w-5 h-5" />
          <span>Compte</span>
        </button>
      </nav>

      {/* Slide-over Cart Drawer */}
      <CartDrawer
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderSuccess={() => {}}
      />

      {/* Order Confirmation Screen Modal */}
      <OrderSuccessModal
        order={lastConfirmedOrder}
        onClose={() => setLastConfirmedOrder(null)}
        onViewProfile={() => {
          setProfileInitialTab('orders');
          setIsProfileOpen(true);
        }}
      />

      {/* Authentication Modal */}
      <AuthModal />

      {/* Customer Profile & Orders History Modal */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onOpenProduct={handleOpenProduct}
        initialTab={profileInitialTab}
      />

      {/* Admin Dashboard Modal (if opened while on storefront) */}
      <AdminDashboard
        isOpen={isAdminViewOpen}
        onClose={() => setIsAdminViewOpen(false)}
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <StoreApp />
      </StoreProvider>
    </AuthProvider>
  );
}
