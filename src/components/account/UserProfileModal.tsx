import React, { useState } from 'react';
import { 
  X, 
  User, 
  Package, 
  MapPin, 
  Phone, 
  LogOut, 
  Heart, 
  Clock, 
  CheckCircle, 
  Truck, 
  AlertCircle,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { OrderStatus, Order } from '../../types';
import { formatPrice } from '../../utils/currency';
import { DemoBadge } from '../common/DemoBadge';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProduct: (productId: string) => void;
  initialTab?: 'orders' | 'wishlist' | 'profile';
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenProduct,
  initialTab = 'orders'
}) => {
  const { user, logout, openAuthModal } = useAuth();
  const { orders, wishlist, products, addToCart, toggleWishlist } = useStore();

  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'profile'>(initialTab);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);

  React.useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  // Filter orders for this customer
  const userOrders = orders;

  const wishlistedProducts = products.filter((p) => wishlist.includes(p.id));

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'en_attente':
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-[10px] font-semibold">En Attente</span>;
      case 'en_preparation':
        return <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-[10px] font-semibold">En Préparation</span>;
      case 'en_livraison':
        return <span className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded-full text-[10px] font-semibold">En Livraison</span>;
      case 'livree':
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-semibold">Livrée</span>;
      case 'annulee':
        return <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-full text-[10px] font-semibold">Annulée</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="min-h-full flex items-center justify-center p-3 sm:p-6 lg:p-8">
        <div className="relative bg-[#faf8f5] w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden border border-stone-200">
          
          {/* Header */}
          <div className="p-6 bg-white border-b border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-amber-900 text-amber-100 flex items-center justify-center font-serif text-lg font-bold">
                {user ? user.displayName.charAt(0) : <Heart className="w-6 h-6 text-amber-200" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-serif text-xl sm:text-2xl font-semibold text-stone-900">
                    {user ? user.displayName : "Mes Favoris & Espace Client"}
                  </h2>
                  {user?.role === 'admin' && (
                    <span className="bg-amber-800 text-white text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold">
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-stone-500 text-xs">
                  {user ? `${user.email} • ${user.city || 'Cotonou, Bénin'}` : "Sauvegardez vos coups de cœur pour vos prochains achats"}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Bar */}
          <div className="flex border-b border-stone-200 bg-white px-6 gap-6 text-xs font-medium">
            <button
              onClick={() => {
                setActiveTab('orders');
                setSelectedOrderDetails(null);
              }}
              className={`py-3 flex items-center gap-1.5 transition-colors ${
                activeTab === 'orders'
                  ? 'border-b-2 border-amber-800 text-amber-900 font-semibold'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Historique Commandes ({userOrders.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('wishlist');
                setSelectedOrderDetails(null);
              }}
              className={`py-3 flex items-center gap-1.5 transition-colors ${
                activeTab === 'wishlist'
                  ? 'border-b-2 border-amber-800 text-amber-900 font-semibold'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <Heart className="w-4 h-4" />
              <span>Favoris ({wishlistedProducts.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('profile');
                setSelectedOrderDetails(null);
              }}
              className={`py-3 flex items-center gap-1.5 transition-colors ${
                activeTab === 'profile'
                  ? 'border-b-2 border-amber-800 text-amber-900 font-semibold'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Coordonnées</span>
            </button>
          </div>

          {/* Content Area */}
          <div className="p-6 sm:p-8 overflow-y-auto max-h-[70vh] space-y-6">
            
            {/* Tab: Orders */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                {!user ? (
                  <div className="text-center py-12 text-stone-500 space-y-3">
                    <Package className="w-10 h-10 mx-auto text-stone-300 stroke-1" />
                    <p className="font-serif text-lg text-stone-700">Connectez-vous pour voir vos commandes</p>
                    <p className="text-xs text-stone-400 max-w-sm mx-auto">
                      Accédez au suivi en temps réel de vos livraisons ZStore Express à Cotonou et partout au Bénin.
                    </p>
                    <button
                      onClick={() => openAuthModal('Consulter mes commandes')}
                      className="px-5 py-2.5 bg-[#262220] hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm cursor-pointer"
                    >
                      Se Connecter
                    </button>
                  </div>
                ) : userOrders.length === 0 ? (
                  <div className="text-center py-12 text-stone-500">
                    <Package className="w-10 h-10 mx-auto text-stone-300 mb-2 stroke-1" />
                    <p className="font-serif text-lg text-stone-700">Aucune commande enregistrée</p>
                    <p className="text-xs text-stone-400 mt-1">Vos futures créations ZStore apparaîtront ici.</p>
                  </div>
                ) : (
                  userOrders.map((ord) => (
                    <div 
                      key={ord.id}
                      className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4 shadow-xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-stone-900">
                              {ord.orderNumber}
                            </span>
                            {getStatusBadge(ord.status)}
                          </div>
                          <span className="text-[11px] text-stone-400">
                            Commandé le {new Date(ord.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        </div>
                        <div className="text-left sm:text-right">
                          <span className="font-serif text-base font-bold text-stone-900">
                            {formatPrice(ord.total)}
                          </span>
                          <span className="block text-[10px] text-stone-400">
                            {ord.items.length} article{ord.items.length > 1 ? 's' : ''} • {ord.paymentMethod === 'paiement_livraison' ? 'Paiement à la livraison' : ord.paymentMethod === 'virement_bancaire' ? 'Virement bancaire' : 'Mobile Money'}
                          </span>
                        </div>
                      </div>

                      {/* Items row */}
                      <div className="flex gap-2 overflow-x-auto py-1">
                        {ord.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-stone-50 p-2 rounded-xl border border-stone-100 shrink-0">
                            <img 
                              src={item.product.images[0]} 
                              alt="" 
                              className="w-10 h-10 object-cover rounded-md"
                            />
                            <div className="text-xs">
                              <p className="font-medium text-stone-800 max-w-36 truncate">{item.product.name}</p>
                              <p className="text-stone-400 text-[10px]">Qté: {item.quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Timeline progression */}
                      <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-200/40 text-xs">
                        <span className="font-semibold text-stone-800 text-[11px] block mb-1">
                          Suivi de livraison en temps réel :
                        </span>
                        <div className="space-y-1.5">
                          {ord.timeline.map((step, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-[11px]">
                              <span className="text-amber-700 font-bold">•</span>
                              <span className="text-stone-700"><strong>{step.timestamp}</strong> - {step.note}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="text-xs text-stone-500 pt-1 flex justify-between items-center">
                        <span>Livraison : {ord.deliveryDetails.district}, {ord.deliveryDetails.city}</span>
                        <a 
                          href={`https://wa.me/22997000000?text=${encodeURIComponent(`Bonjour ZStore, je souhaite un renseignement sur ma commande ${ord.orderNumber}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-amber-800 hover:text-amber-950 font-medium flex items-center gap-1 underline"
                        >
                          <Phone className="w-3 h-3" />
                          Contacter le showroom
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab: Wishlist */}
            {activeTab === 'wishlist' && (
              <div className="space-y-4">
                {wishlistedProducts.length === 0 ? (
                  <div className="text-center py-12 text-stone-500">
                    <Heart className="w-10 h-10 mx-auto text-stone-300 mb-2 stroke-1" />
                    <p className="font-serif text-lg text-stone-700">Votre liste d'envies est vide</p>
                    <p className="text-xs text-stone-400 mt-1">Cliquez sur le cœur d'une création pour la sauvegarder.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {wishlistedProducts.map((prod) => (
                      <div 
                        key={prod.id}
                        className="flex gap-3 bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs"
                      >
                        <img 
                          src={prod.images[0]} 
                          alt="" 
                          className="w-16 h-16 object-cover rounded-xl bg-stone-100 cursor-pointer"
                          onClick={() => {
                            onClose();
                            onOpenProduct(prod.id);
                          }}
                        />
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <h4 
                              onClick={() => {
                                onClose();
                                onOpenProduct(prod.id);
                              }}
                              className="font-serif text-sm font-semibold text-stone-900 cursor-pointer hover:text-amber-800 truncate"
                            >
                              {prod.name}
                            </h4>
                            <p className="text-xs font-bold text-stone-900 mt-0.5">
                              {formatPrice(prod.price)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => addToCart(prod, 1)}
                              className="px-3 py-1 bg-[#262220] hover:bg-amber-800 text-white rounded-lg text-xs font-medium flex items-center gap-1"
                            >
                              <ShoppingBag className="w-3 h-3" />
                              <span>Ajouter</span>
                            </button>
                            <button
                              onClick={() => toggleWishlist(prod.id)}
                              className="text-stone-400 hover:text-rose-600 text-xs"
                            >
                              Retirer
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Profile Info */}
            {activeTab === 'profile' && (
              !user ? (
                <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center space-y-3">
                  <User className="w-10 h-10 mx-auto text-stone-300 stroke-1" />
                  <p className="font-serif text-lg text-stone-800">Espace Client ZStore Bénin</p>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto">
                    Connectez-vous pour gérer vos coordonnées, numéros de téléphone et adresses de livraison à Cotonou.
                  </p>
                  <button
                    onClick={() => openAuthModal('Connexion espace client')}
                    className="px-5 py-2.5 bg-[#262220] hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm cursor-pointer"
                  >
                    Se Connecter / Créer un Compte
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
                  <h3 className="font-serif text-lg font-semibold text-stone-900">
                    Coordonnées Personnelles
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="text-stone-400 block mb-1">Nom complet</label>
                      <p className="font-semibold text-stone-800 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                        {user.displayName}
                      </p>
                    </div>
                    <div>
                      <label className="text-stone-400 block mb-1">Email</label>
                      <p className="font-semibold text-stone-800 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                        {user.email}
                      </p>
                    </div>
                    <div>
                      <label className="text-stone-400 block mb-1">Téléphone Bénin</label>
                      <p className="font-semibold text-stone-800 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                        {user.phone || '+229 97 00 00 00'}
                      </p>
                    </div>
                    <div>
                      <label className="text-stone-400 block mb-1">Ville principale</label>
                      <p className="font-semibold text-stone-800 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                        {user.city || 'Cotonou, Bénin'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-stone-100">
                    <h4 className="font-semibold text-stone-900 text-xs mb-2">
                      Adresses de Livraison Enregistrées
                    </h4>
                    {(!user.savedAddresses || user.savedAddresses.length === 0) ? (
                      <p className="text-stone-400 italic text-[11px] py-2">
                        Aucune adresse pré-enregistrée. Votre adresse renseignée en commande sera conservée pour vos prochains achats.
                      </p>
                    ) : (
                      user.savedAddresses.map((addr) => (
                        <div key={addr.id} className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/50 text-xs">
                          <p className="font-bold text-stone-900">{addr.label} - {addr.fullName}</p>
                          <p className="text-stone-600">{addr.district}, {addr.city}</p>
                          <p className="text-stone-500 text-[11px] italic">{addr.details}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            )}

            {/* Logout / Login button */}
            <div className="pt-4 border-t border-stone-200 flex justify-between items-center">
              {user ? (
                <button
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  className="flex items-center gap-2 text-xs text-rose-700 hover:text-rose-900 font-semibold cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Se déconnecter</span>
                </button>
              ) : (
                <button
                  onClick={() => openAuthModal('Connexion')}
                  className="text-xs text-amber-900 hover:text-amber-700 font-semibold cursor-pointer"
                >
                  Se connecter à mon compte →
                </button>
              )}

              <span className="text-[11px] text-stone-400 font-medium">
                ZStore Bénin • Maison & Fragrances
              </span>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
