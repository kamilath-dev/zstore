import React, { useState } from 'react';
import { 
  X, 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Tag, 
  Plus, 
  Edit2, 
  Trash2, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Search, 
  ShieldCheck, 
  Sparkles,
  Database,
  Lock,
  Phone,
  Layers,
  Table as TableIcon,
  LayoutGrid
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { OrderStatus, Product, Order, PromoCode, Category } from '../../types';
import { formatPrice } from '../../utils/currency';
import { AdminProductForm } from './AdminProductForm';
import { AdminCategoryForm } from './AdminCategoryForm';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ isOpen, onClose }) => {
  const { user, firebaseUser, isAdmin, isAuthLoading, logout, openAuthModal } = useAuth();
  const { 
    products, 
    categories,
    orders, 
    isProductsLoading,
    isOrdersLoading,
    productsError,
    categoriesError,
    promosError,
    ordersError,
    updateOrderStatus, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    updateStock,
    addCategory,
    updateCategory,
    deleteCategory,
    promos,
    addPromoCode,
    togglePromoActive
  } = useStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'categories' | 'orders' | 'promos' | 'architecture'>('overview');
  const [productSearch, setProductSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [productViewMode, setProductViewMode] = useState<'table' | 'cards'>('table');
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatus | 'all'>('all');
  
  // Product edit state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  
  // Category edit state
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  
  // New promo code form
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoPercent, setNewPromoPercent] = useState('10');
  const [newPromoMin, setNewPromoMin] = useState('25000');
  const [newPromoDesc, setNewPromoDesc] = useState('');
  const [promoFormError, setPromoFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Gatekeeper: If user is not an authenticated Admin verified via Firebase Custom Claims (admin: true)
  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs" onClick={onClose} />
        <div className="min-h-full flex items-center justify-center p-4">
          <div className="relative bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-200 text-center space-y-4">
            <button onClick={onClose} className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-900 mx-auto flex items-center justify-center">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-stone-900">
              Accès Administrateur Restreint
            </h2>
            <p className="text-xs text-stone-600 leading-relaxed">
              Cette console est strictement réservée à la direction de <strong>ZStore Bénin</strong>. L'accès nécessite l'attribution vérifiée du rôle de confiance <code>admin: true</code> par le serveur.
            </p>

            <div className="pt-2 space-y-3">
              {firebaseUser ? (
                <div className="p-3 bg-stone-100 rounded-xl text-xs text-stone-600 text-left space-y-1">
                  <p>Compte connecté : <strong>{firebaseUser.email}</strong></p>
                  <p className="text-rose-700 font-semibold text-[11px]">
                    Accès refusé : Ce compte n'a pas la Custom Claim 'admin: true'.
                  </p>
                </div>
              ) : null}

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    window.history.pushState({}, '', '/admin/login');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }}
                  className="w-full py-3 bg-[#262220] hover:bg-stone-800 text-white rounded-xl text-xs uppercase tracking-wider font-semibold transition-colors shadow-md cursor-pointer"
                >
                  Page de Connexion Admin (/admin/login)
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 border border-stone-300 hover:bg-stone-50 text-stone-600 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                >
                  Retourner à la Boutique Client
                </button>
              </div>

              <p className="text-[11px] text-stone-400">
                Sécurité Zero-Trust • Firestore Rules enforce <code className="font-mono text-stone-600 font-semibold">request.auth.token.admin == true</code>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Real Analytics computed from actual Firestore records
  const validOrders = orders.filter(o => o.status !== 'annulee');
  const totalRevenue = validOrders.reduce((sum, ord) => sum + ord.total, 0);
  const totalOrdersCount = orders.length;
  const avgBasket = validOrders.length > 0 ? Math.round(totalRevenue / validOrders.length) : 0;
  const lowStockCount = products.filter(p => p.stock <= 5).length;

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.categoryName.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
    c.slug.toLowerCase().includes(categorySearch.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(categorySearch.toLowerCase()))
  );

  const filteredOrders = orders.filter(o => 
    orderStatusFilter === 'all' ? true : o.status === orderStatusFilter
  );

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = newPromoCode.trim().toUpperCase();
    if (!/^[A-Z0-9_-]{1,50}$/.test(code)) {
      setPromoFormError('Utilisez uniquement lettres, chiffres, tirets et underscores (50 caractères max).');
      return;
    }
    const promo: PromoCode = {
      code,
      discountPercent: Number(newPromoPercent) || 10,
      minOrderAmount: Number(newPromoMin) || 0,
      description: newPromoDesc || `${newPromoPercent}% de remise immédiate`,
      isActive: true
    };
    try {
      await addPromoCode(promo);
      setNewPromoCode('');
      setNewPromoDesc('');
      setPromoFormError(null);
    } catch (error) {
      setPromoFormError(error instanceof Error ? error.message : 'Impossible de créer cette promotion.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs" onClick={onClose} />

      <div className="fixed inset-2 sm:inset-6 lg:inset-8 bg-[#faf8f5] rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-stone-300">
        
        {/* Top bar */}
        <div className="bg-[#262220] text-white px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2 sm:gap-3 truncate">
            <span className="font-serif text-lg sm:text-xl font-bold tracking-wider text-amber-300 shrink-0">
              ZSTORE
            </span>
            <span className="text-stone-500 hidden sm:inline">|</span>
            <span className="text-[11px] sm:text-xs text-stone-300 font-medium bg-stone-800 px-2.5 py-1 rounded-full truncate">
              Console Direction & Stocks (Cloud Firestore)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden md:inline text-xs text-amber-200/80 font-mono">
              {firebaseUser?.email}
            </span>
            <button
              onClick={async () => {
                await logout();
                onClose();
              }}
              className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              title="Déconnexion Administrateur"
            >
              Déconnexion
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-white rounded-full transition-colors cursor-pointer"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white border-b border-stone-200 px-4 sm:px-6 flex gap-4 sm:gap-6 overflow-x-auto text-xs font-medium scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3.5 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? 'border-b-2 border-amber-800 text-amber-900 font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Tableau de Bord</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`py-3.5 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'products'
                ? 'border-b-2 border-amber-800 text-amber-900 font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Produits & Stocks ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`py-3.5 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'categories'
                ? 'border-b-2 border-amber-800 text-amber-900 font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Catégories ({categories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3.5 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'orders'
                ? 'border-b-2 border-amber-800 text-amber-900 font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Commandes ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('promos')}
            className={`py-3.5 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'promos'
                ? 'border-b-2 border-amber-800 text-amber-900 font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Codes Promo ({promos.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            className={`py-3.5 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'architecture'
                ? 'border-b-2 border-amber-800 text-amber-900 font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Database className="w-4 h-4 text-amber-700" />
            <span>Connexion Firestore</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#faf8f5]">
          {[productsError, categoriesError, promosError, ordersError]
            .filter((message): message is string => Boolean(message))
            .map((message, index) => (
              <div
                key={`${index}-${message}`}
                role="alert"
                className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-start gap-2"
              >
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{message}</span>
              </div>
            ))}
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 sm:space-y-8">
              
              {/* Empty catalog without demo imports */}
              {products.length === 0 && !isProductsLoading && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 sm:p-6">
                  <p className="font-serif text-base font-bold text-amber-900">
                    Le catalogue est vide
                  </p>
                  <p className="text-xs text-stone-600 mt-1">
                    Aucun jeu de démonstration n’a été importé. Ajoutez vos catégories et produits réels depuis les onglets correspondants.
                  </p>
                </div>
              )}

              {/* Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
                  <div className="flex items-center justify-between text-stone-500 mb-1.5 sm:mb-2">
                    <span className="text-[10px] sm:text-xs uppercase font-medium">Chiffre d'Affaires</span>
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="font-serif text-lg sm:text-2xl font-bold text-stone-900">
                    {formatPrice(totalRevenue)}
                  </p>
                  <p className="text-[10px] text-stone-500 mt-1">
                    Commandes réelles enregistrées
                  </p>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
                  <div className="flex items-center justify-between text-stone-500 mb-1.5 sm:mb-2">
                    <span className="text-[10px] sm:text-xs uppercase font-medium">Commandes Totales</span>
                    <ShoppingBag className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="font-serif text-lg sm:text-2xl font-bold text-stone-900">
                    {totalOrdersCount}
                  </p>
                  <p className="text-[10px] text-stone-500 mt-1">
                    Cloud Firestore
                  </p>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
                  <div className="flex items-center justify-between text-stone-500 mb-1.5 sm:mb-2">
                    <span className="text-[10px] sm:text-xs uppercase font-medium">Panier Moyen</span>
                    <Sparkles className="w-4 h-4 text-amber-600" />
                  </div>
                  <p className="font-serif text-lg sm:text-2xl font-bold text-stone-900">
                    {formatPrice(avgBasket)}
                  </p>
                  <p className="text-[10px] text-stone-500 mt-1">
                    Par commande validée
                  </p>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
                  <div className="flex items-center justify-between text-stone-500 mb-1.5 sm:mb-2">
                    <span className="text-[10px] sm:text-xs uppercase font-medium">Alertes Stock</span>
                    <AlertTriangle className={`w-4 h-4 ${lowStockCount > 0 ? 'text-amber-600' : 'text-stone-400'}`} />
                  </div>
                  <p className="font-serif text-lg sm:text-2xl font-bold text-stone-900">
                    {lowStockCount}
                  </p>
                  <p className="text-[10px] text-amber-700 mt-1 font-medium">
                    Articles avec ≤ 5 pièces
                  </p>
                </div>
              </div>

              {/* Status Breakdown & Recent Orders */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Status distribution */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-xs space-y-3">
                  <h3 className="font-serif text-base font-semibold text-stone-900">
                    État des Commandes
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center p-2.5 bg-amber-50 rounded-xl text-amber-900">
                      <span>En Attente de Traitement</span>
                      <span className="font-bold">{orders.filter(o => o.status === 'en_attente').length}</span>
                    </div>
                    <div className="flex justify-between items-center p-2.5 bg-blue-50 rounded-xl text-blue-900">
                      <span>En Préparation Atelier</span>
                      <span className="font-bold">{orders.filter(o => o.status === 'en_preparation').length}</span>
                    </div>
                    <div className="flex justify-between items-center p-2.5 bg-purple-50 rounded-xl text-purple-900">
                      <span>En Cours d'Expédition Bénin</span>
                      <span className="font-bold">{orders.filter(o => o.status === 'en_livraison').length}</span>
                    </div>
                    <div className="flex justify-between items-center p-2.5 bg-emerald-50 rounded-xl text-emerald-900">
                      <span>Livrées & Payées</span>
                      <span className="font-bold">{orders.filter(o => o.status === 'livree').length}</span>
                    </div>
                  </div>
                </div>

                {/* Recent Orders List */}
                <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-serif text-base font-semibold text-stone-900">
                      Commandes Récentes
                    </h3>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="text-xs text-amber-800 hover:underline font-medium cursor-pointer"
                    >
                      Toutes les commandes →
                    </button>
                  </div>

                  {orders.length === 0 ? (
                    <p className="text-xs text-stone-400 py-6 text-center italic">
                      Aucune commande enregistrée pour le moment.
                    </p>
                  ) : (
                    <div className="divide-y divide-stone-100 text-xs">
                      {orders.slice(0, 5).map((ord) => (
                        <div key={ord.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-stone-900">{ord.orderNumber}</span>
                              <span className="text-stone-400">•</span>
                              <span className="font-medium text-stone-800">{ord.deliveryDetails.fullName}</span>
                            </div>
                            <p className="text-[11px] text-stone-500 mt-0.5">
                              {ord.deliveryDetails.city} ({ord.deliveryDetails.district}) • {ord.items.length} articles
                            </p>
                          </div>
                          <div className="text-left sm:text-right mt-1 sm:mt-0">
                            <p className="font-bold text-stone-900">{formatPrice(ord.total)}</p>
                            <span className="text-[10px] text-amber-800 uppercase tracking-wider font-semibold">
                              {ord.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: PRODUCTS & INVENTORY */}
          {activeTab === 'products' && (
            <div className="space-y-4 sm:space-y-6">
              
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <input
                    type="text"
                    placeholder="Filtrer par nom, SKU ou catégorie..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full text-xs bg-white border border-stone-300 rounded-xl px-3 py-2.5 pl-9 focus:outline-none focus:border-amber-700"
                  />
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                </div>

                <div className="flex items-center gap-2">
                  {/* View Mode Toggle: Table (6 columns) vs Mobile Cards */}
                  <div className="inline-flex items-center p-1 bg-stone-200/70 rounded-xl text-xs">
                    <button
                      type="button"
                      onClick={() => setProductViewMode('table')}
                      className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer font-medium ${
                        productViewMode === 'table'
                          ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                      title="Vue Tableau avec les 6 colonnes complètes"
                    >
                      <TableIcon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Tableau (6 colonnes)</span>
                      <span className="sm:hidden">Tableau</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductViewMode('cards')}
                      className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer font-medium ${
                        productViewMode === 'cards'
                          ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                      title="Vue Fiches cartes compactes"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Vue Fiches</span>
                      <span className="sm:hidden">Fiches</span>
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setEditingProduct(null);
                      setIsProductFormOpen(true);
                    }}
                    className="px-3.5 sm:px-4 py-2.5 bg-amber-800 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nouvelle Création</span>
                  </button>
                </div>
              </div>

              {/* Products Container */}
              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
                
                {filteredProducts.length === 0 ? (
                  <div className="p-8 text-center text-stone-400 text-xs italic">
                    Aucun produit ne correspond à votre recherche.
                  </div>
                ) : productViewMode === 'table' ? (
                  /* Full Responsive Table with all 6 columns visible on Mobile, Tablet & Desktop */
                  <div>
                    {/* Tablet & Mobile scroll guide */}
                    <div className="lg:hidden px-3.5 py-2 bg-amber-50/80 border-b border-amber-100 text-[11px] text-amber-900 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-medium">
                        ⇄ Faites glisser horizontalement pour parcourir les 6 colonnes
                      </span>
                      <span className="font-semibold text-amber-800 bg-white/90 px-2 py-0.5 rounded border border-amber-200 shrink-0 text-[10px]">
                        6 colonnes
                      </span>
                    </div>

                    <div className="overflow-x-auto w-full">
                      <table className="w-full text-left text-xs min-w-[700px]">
                        <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px]">
                          <tr>
                            <th className="p-3.5 sm:p-4">Produit</th>
                            <th className="p-3.5 sm:p-4">Catégorie</th>
                            <th className="p-3.5 sm:p-4">Prix</th>
                            <th className="p-3.5 sm:p-4">Stock</th>
                            <th className="p-3.5 sm:p-4">Statut</th>
                            <th className="p-3.5 sm:p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {filteredProducts.map((prod) => (
                            <tr key={prod.id} className="hover:bg-stone-50/70 transition-colors">
                              {/* 1. Produit */}
                              <td className="p-3.5 sm:p-4 flex items-center gap-3">
                                <img
                                  src={prod.images[0] || 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=150&q=80'}
                                  alt=""
                                  className="w-12 h-12 object-cover rounded-lg bg-stone-100 shrink-0 border border-stone-200"
                                />
                                <div className="min-w-0 max-w-[220px]">
                                  <p className="font-semibold text-stone-900 truncate">{prod.name}</p>
                                  <span className="font-mono text-[10px] text-stone-400 block truncate">
                                    SKU: {prod.sku}
                                  </span>
                                </div>
                              </td>

                              {/* 2. Catégorie */}
                              <td className="p-3.5 sm:p-4 text-stone-600">
                                <span className="bg-stone-100 text-stone-700 px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap">
                                  {prod.categoryName}
                                </span>
                              </td>

                              {/* 3. Prix */}
                              <td className="p-3.5 sm:p-4 font-bold text-stone-900 whitespace-nowrap">
                                {formatPrice(prod.price)}
                              </td>

                              {/* 4. Stock */}
                              <td className="p-3.5 sm:p-4">
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => updateStock(prod.id, Math.max(0, prod.stock - 1))}
                                    className="w-6 h-6 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center text-xs font-bold cursor-pointer"
                                    title="Diminuer le stock"
                                  >
                                    -
                                  </button>
                                  <span className={`font-bold px-2 text-center min-w-[24px] ${prod.stock <= 5 ? 'text-amber-700' : 'text-stone-800'}`}>
                                    {prod.stock}
                                  </span>
                                  <button
                                    onClick={() => updateStock(prod.id, prod.stock + 1)}
                                    className="w-6 h-6 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center text-xs font-bold cursor-pointer"
                                    title="Augmenter le stock"
                                  >
                                    +
                                  </button>
                                </div>
                              </td>

                              {/* 5. Statut */}
                              <td className="p-3.5 sm:p-4 whitespace-nowrap">
                                {prod.stock === 0 ? (
                                  <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-full text-[10px] font-semibold">
                                    Épuisé
                                  </span>
                                ) : prod.stock <= 5 ? (
                                  <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-[10px] font-semibold">
                                    Stock Faible ({prod.stock})
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-semibold">
                                    En Stock ({prod.stock})
                                  </span>
                                )}
                              </td>

                              {/* 6. Actions */}
                              <td className="p-3.5 sm:p-4 text-right space-x-2 whitespace-nowrap">
                                <button
                                  onClick={() => {
                                    setEditingProduct(prod);
                                    setIsProductFormOpen(true);
                                  }}
                                  className="p-1.5 text-stone-500 hover:text-amber-800 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                                  title="Modifier le produit"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Confirmez-vous la suppression définitive du produit "${prod.name}" dans Firestore ?`)) {
                                      deleteProduct(prod.id);
                                    }
                                  }}
                                  className="p-1.5 text-stone-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Supprimer le produit"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  /* Cards View: Compact cards alternative */
                  <div className="divide-y divide-stone-100 p-2 sm:p-3">
                    {filteredProducts.map((prod) => (
                      <div key={prod.id} className="p-3 space-y-2.5 text-xs">
                        <div className="flex gap-3">
                          <img
                            src={prod.images[0] || 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=150&q=80'}
                            alt=""
                            className="w-14 h-14 object-cover rounded-lg bg-stone-100 shrink-0 border border-stone-200"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-stone-900 truncate">{prod.name}</p>
                            <p className="text-[11px] text-stone-500">{prod.categoryName} • SKU: {prod.sku}</p>
                            <p className="font-bold text-stone-900 mt-0.5">{formatPrice(prod.price)}</p>
                          </div>
                          <div>
                            {prod.stock === 0 ? (
                              <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full text-[10px] font-semibold">
                                Épuisé
                              </span>
                            ) : prod.stock <= 5 ? (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-semibold">
                                Faible
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-semibold">
                                En Stock
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                          <div className="flex items-center gap-2">
                            <span className="text-stone-500 text-[11px]">Stock :</span>
                            <div className="flex items-center border border-stone-300 rounded-lg">
                              <button
                                onClick={() => updateStock(prod.id, Math.max(0, prod.stock - 1))}
                                className="px-2 py-0.5 text-stone-600 hover:bg-stone-100 text-xs font-bold cursor-pointer"
                              >
                                -
                              </button>
                              <span className="px-2 font-bold text-stone-900">{prod.stock}</span>
                              <button
                                onClick={() => updateStock(prod.id, prod.stock + 1)}
                                className="px-2 py-0.5 text-stone-600 hover:bg-stone-100 text-xs font-bold cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                setEditingProduct(prod);
                                setIsProductFormOpen(true);
                              }}
                              className="p-1.5 text-stone-600 hover:text-amber-800 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                              title="Modifier"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Confirmez-vous la suppression du produit "${prod.name}" ?`)) {
                                  deleteProduct(prod.id);
                                }
                              }}
                              className="p-1.5 text-stone-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>

            </div>
          )}

          {/* TAB 2bis: CATEGORIES MANAGEMENT */}
          {activeTab === 'categories' && (
            <div className="space-y-4 sm:space-y-6">
              
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <input
                    type="text"
                    placeholder="Filtrer par nom ou description de catégorie..."
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    className="w-full text-xs bg-white border border-stone-300 rounded-xl px-3 py-2.5 pl-9 focus:outline-none focus:border-amber-700"
                  />
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                </div>

                <button
                  onClick={() => {
                    setEditingCategory(null);
                    setIsCategoryFormOpen(true);
                  }}
                  className="px-4 py-2.5 bg-amber-800 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nouvelle Catégorie</span>
                </button>
              </div>

              {/* Categories Grid/List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCategories.length === 0 ? (
                  <div className="col-span-full bg-white p-8 rounded-2xl text-center text-stone-400 text-xs border border-stone-200 italic">
                    Aucune catégorie trouvée.
                  </div>
                ) : (
                  filteredCategories.map((cat) => {
                    const count = products.filter(p => p.category === cat.slug).length;
                    return (
                      <div
                        key={cat.id}
                        className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                      >
                        <div>
                          <div className="relative h-36 bg-stone-100 overflow-hidden border-b border-stone-100">
                            <img
                              src={cat.image}
                              alt={cat.name}
                              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                            />
                            <span className="absolute top-2.5 right-2.5 bg-[#262220]/80 backdrop-blur-xs text-white text-[10px] font-medium px-2.5 py-0.5 rounded-full">
                              {count} produit{count > 1 ? 's' : ''}
                            </span>
                          </div>

                          <div className="p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="font-serif text-base font-bold text-stone-900">
                                {cat.name}
                              </h4>
                              <span className="font-mono text-[10px] text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                {cat.slug}
                              </span>
                            </div>

                            <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                              {cat.description || 'Créations artisanales ZStore Bénin.'}
                            </p>
                          </div>
                        </div>

                        <div className="p-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-xs">
                          <span className="text-[11px] text-stone-500">
                            Catalogue Firestore
                          </span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                setEditingCategory(cat);
                                setIsCategoryFormOpen(true);
                              }}
                              className="p-1.5 text-stone-600 hover:text-amber-800 hover:bg-white rounded-lg transition-colors cursor-pointer"
                              title="Modifier la catégorie"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Supprimer la catégorie "${cat.name}" de Cloud Firestore ?`)) {
                                  deleteCategory(cat.id);
                                }
                              }}
                              className="p-1.5 text-stone-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Supprimer la catégorie"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          )}

          {/* TAB 3: ORDERS MANAGEMENT */}
          {activeTab === 'orders' && (
            <div className="space-y-4 sm:space-y-6">
              
              {/* Order Status Filter Buttons */}
              <div className="flex flex-wrap gap-2 text-xs">
                {(['all', 'en_attente', 'en_preparation', 'en_livraison', 'livree', 'annulee'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setOrderStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl capitalize font-medium transition-colors cursor-pointer ${
                      orderStatusFilter === st
                        ? 'bg-[#262220] text-white shadow-xs'
                        : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {st === 'all' ? 'Toutes les Commandes' : st.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {/* Orders List */}
              <div className="space-y-4">
                {filteredOrders.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl text-center text-stone-400 text-xs border border-stone-200">
                    Aucune commande trouvée sous ce filtre.
                  </div>
                ) : (
                  filteredOrders.map((ord) => (
                    <div key={ord.id} className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 space-y-3.5 shadow-xs">
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-stone-900">{ord.orderNumber}</span>
                            <span className="text-xs text-stone-500">• {new Date(ord.date).toLocaleDateString('fr-FR')}</span>
                          </div>
                          <p className="text-xs text-stone-700 mt-0.5">
                            Client : <strong>{ord.deliveryDetails.fullName}</strong> ({ord.deliveryDetails.phone})
                          </p>
                          <p className="text-[11px] text-stone-500">
                            {ord.deliveryDetails.district}, {ord.deliveryDetails.city} - {ord.deliveryDetails.addressDetails}
                          </p>
                        </div>

                        <div className="text-left sm:text-right">
                          <p className="font-serif text-lg font-bold text-stone-900">{formatPrice(ord.total)}</p>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                            ord.isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                          }`}>
                            {ord.isPaid ? 'Payé' : 'En attente d\'encaissement'}
                          </span>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="space-y-1 text-xs text-stone-600">
                        {ord.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span>{it.quantity}x {it.product.name}</span>
                            <span className="font-medium text-stone-800">{formatPrice(it.product.price * it.quantity)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Status Progressions */}
                      <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-stone-500 font-medium text-[11px]">Changer le statut :</span>
                          <button
                            onClick={() => updateOrderStatus(ord.id, 'en_preparation')}
                            className="px-2.5 py-1 bg-blue-50 text-blue-800 hover:bg-blue-100 rounded-lg font-medium transition-colors cursor-pointer"
                          >
                            Préparer
                          </button>
                          <button
                            onClick={() => updateOrderStatus(ord.id, 'en_livraison')}
                            className="px-2.5 py-1 bg-purple-50 text-purple-800 hover:bg-purple-100 rounded-lg font-medium transition-colors cursor-pointer"
                          >
                            Expédier
                          </button>
                          <button
                            onClick={() => updateOrderStatus(ord.id, 'livree')}
                            className="px-2.5 py-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-lg font-medium transition-colors cursor-pointer"
                          >
                            Marquer Livrée (Encaissé)
                          </button>
                          <button
                            onClick={() => updateOrderStatus(ord.id, 'annulee')}
                            className="px-2.5 py-1 bg-rose-50 text-rose-800 hover:bg-rose-100 rounded-lg font-medium transition-colors cursor-pointer"
                          >
                            Annuler
                          </button>
                        </div>

                        <a
                          href={`https://wa.me/${ord.deliveryDetails.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-1 underline text-xs"
                        >
                          <Phone className="w-3 h-3" />
                          WhatsApp Client →
                        </a>
                      </div>

                    </div>
                  ))
                )}
              </div>

            </div>
          )}

          {/* TAB 4: PROMOTIONS */}
          {activeTab === 'promos' && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
                  <h3 className="font-serif text-base font-semibold text-stone-900">
                    Nouveau Code Promotionnel
                  </h3>
                  <form onSubmit={handleCreatePromo} className="space-y-3 text-xs">
                    {promoFormError && (
                      <p role="alert" className="text-rose-700">{promoFormError}</p>
                    )}
                    <div>
                      <label className="font-medium text-stone-700 block mb-1">Code Promo *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: NOELCOTONOU"
                        value={newPromoCode}
                        onChange={(e) => setNewPromoCode(e.target.value)}
                        className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl uppercase font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-medium text-stone-700 block mb-1">Remise (%)</label>
                      <input
                        type="number"
                        min="5"
                        max="50"
                        value={newPromoPercent}
                        onChange={(e) => setNewPromoPercent(e.target.value)}
                        className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="font-medium text-stone-700 block mb-1">Panier Minimum (FCFA)</label>
                      <input
                        type="number"
                        step="5000"
                        value={newPromoMin}
                        onChange={(e) => setNewPromoMin(e.target.value)}
                        className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="font-medium text-stone-700 block mb-1">Description</label>
                      <input
                        type="text"
                        placeholder="Ex: 10% pour les fêtes"
                        value={newPromoDesc}
                        onChange={(e) => setNewPromoDesc(e.target.value)}
                        className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-[#262220] hover:bg-stone-800 text-white rounded-xl font-semibold transition-colors mt-2 cursor-pointer"
                    >
                      Enregistrer dans Firestore
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-2 space-y-3">
                  <h3 className="font-serif text-base font-semibold text-stone-900">
                    Codes Actifs dans Firestore
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {promos.map((pr) => (
                      <div key={pr.code} className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex justify-between items-start">
                            <span className="font-mono text-base font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg">
                              {pr.code}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              pr.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-500'
                            }`}>
                              {pr.isActive ? 'Actif' : 'Désactivé'}
                            </span>
                          </div>
                          <p className="text-xs text-stone-600 mt-2 font-medium">{pr.description}</p>
                          {pr.minOrderAmount && (
                            <p className="text-[11px] text-stone-400 mt-0.5">
                              Dès {formatPrice(pr.minOrderAmount)} d'achats
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => togglePromoActive(pr.code)}
                          className="w-full py-2 border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs rounded-xl font-medium transition-colors cursor-pointer"
                        >
                          {pr.isActive ? 'Désactiver le code' : 'Réactiver le code'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 5: ARCHITECTURE & FIREBASE BLUEPRINT */}
          {activeTab === 'architecture' && (
            <div className="space-y-6 max-w-4xl bg-white p-5 sm:p-8 rounded-2xl border border-stone-200 shadow-xs text-xs text-stone-700 leading-relaxed">
              <div className="flex items-center gap-3 border-b border-stone-200 pb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg sm:text-xl font-semibold text-stone-900">
                    Configuration Firestore & Authentification
                  </h3>
                  <p className="text-stone-500 text-xs">
                    Projet cible configuré localement
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-emerald-950 text-xs space-y-2">
                  <p className="font-semibold flex items-center gap-1.5 text-emerald-800">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Configuration Firebase cible
                  </p>
                  <p className="text-emerald-900 leading-relaxed">
                    <strong>Projet Firebase :</strong> <code className="bg-white/80 px-1.5 py-0.5 rounded font-mono">zstore-7ed88</code><br/>
                    <strong>Base Firestore :</strong> <code className="bg-white/80 px-1.5 py-0.5 rounded font-mono">(default)</code><br/>
                    <strong>Règles :</strong> fichiers locaux préparés, déploiement à effectuer séparément après validation.
                  </p>
                </div>

                <h4 className="font-serif text-base font-bold text-stone-900 pt-2">
                  Collections Firestore Utilisées en Production :
                </h4>
                <div className="bg-stone-900 text-stone-200 p-4 rounded-xl font-mono text-[11px] overflow-x-auto">
                  {`// Collections: documents are created only by real application actions
/products/{productId}     -> Product fields, including price, stock, images[] and optional nested metadata
/categories/{categoryId}  -> { id, slug, name, description, image, itemCount }
/orders/{orderId}         -> { orderNumber, date, userId, items[], subtotal, deliveryFee, discount, appliedPromo?, total, deliveryDetails, status, paymentMethod, isPaid, timeline[] }
/users/{uid}              -> { uid, email, displayName, savedAddresses[], wishlist?, role, optional contact fields }
/promos/{code}            -> { code, description, isActive, discountPercent? or discountAmount?, minOrderAmount? }
/reviews/{reviewId}       -> ProductReview fields, written only by an authenticated owner
/admins/{uid}             -> client access denied; this document is not required for admin authority`}
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Product Form Modal */}
      {isProductFormOpen && (
        <AdminProductForm
          product={editingProduct}
          onClose={() => {
            setIsProductFormOpen(false);
            setEditingProduct(null);
          }}
          onSave={async (data) => {
            if (editingProduct) {
              await updateProduct(editingProduct.id, data);
            } else {
              await addProduct(data);
            }
          }}
        />
      )}

      {/* Category Form Modal */}
      {isCategoryFormOpen && (
        <AdminCategoryForm
          category={editingCategory}
          onClose={() => {
            setIsCategoryFormOpen(false);
            setEditingCategory(null);
          }}
          onSave={async (catData) => {
            if (editingCategory) {
              await updateCategory(editingCategory.id, catData);
            } else {
              await addCategory(catData);
            }
          }}
        />
      )}
    </div>
  );
};
