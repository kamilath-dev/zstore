import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  ShoppingBag, 
  ArrowRight, 
  Gift, 
  Tag, 
  ShieldCheck, 
  Sparkles,
  Check
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { formatPrice } from '../../utils/currency';
import { DemoBadge } from '../common/DemoBadge';

interface CartDrawerProps {
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onProceedToCheckout }) => {
  const { 
    cart, 
    isCartOpen, 
    setIsCartOpen, 
    removeFromCart, 
    updateCartQuantity, 
    cartSubtotal, 
    cartTotalCount,
    appliedPromo,
    applyPromoCode,
    removePromoCode,
    promoDiscount
  } = useStore();

  const [promoInput, setPromoInput] = useState('');
  const [promoMessage, setPromoMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [wantsGiftWrap, setWantsGiftWrap] = useState(false);

  if (!isCartOpen) return null;

  const freeShippingThreshold = 35000;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - cartSubtotal);
  const progressPercent = Math.min(100, Math.round((cartSubtotal / freeShippingThreshold) * 100));

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    const res = applyPromoCode(promoInput);
    if (res.success) {
      setPromoMessage({ type: 'success', text: res.message });
      setPromoInput('');
    } else {
      setPromoMessage({ type: 'error', text: res.message });
    }
  };

  const finalTotal = Math.max(0, cartSubtotal - promoDiscount);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-stone-900/50 backdrop-blur-xs transition-opacity duration-300"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#faf8f5] shadow-2xl flex flex-col border-l border-stone-200">
          
          {/* Header */}
          <div className="p-5 border-b border-stone-200/80 bg-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-stone-800" />
              <h2 className="font-serif text-xl font-semibold text-stone-900">
                Votre Panier ({cartTotalCount})
              </h2>
            </div>
            <button 
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors"
              aria-label="Fermer le panier"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free shipping banner */}
          <div className="bg-amber-50/80 px-5 py-3 border-b border-amber-100 text-xs">
            {remainingForFreeShipping > 0 ? (
              <div>
                <p className="text-amber-900 font-medium">
                  Ajoutez encore <span className="font-bold underline">{formatPrice(remainingForFreeShipping)}</span> pour bénéficier de la <span className="font-semibold">livraison gratuite à Cotonou</span> !
                </p>
                <div className="w-full bg-amber-200/60 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="bg-amber-700 h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-800 font-medium">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Félicitations ! Vous profitez de la <strong>livraison offerte à Cotonou</strong>.</span>
              </div>
            )}
          </div>

          {/* Items Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4">
                <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-4">
                  <ShoppingBag className="w-8 h-8 stroke-1" />
                </div>
                <h3 className="font-serif text-lg font-medium text-stone-800">
                  Votre panier est actuellement vide
                </h3>
                <p className="text-stone-500 text-xs mt-1.5 max-w-xs leading-relaxed">
                  Laissez-vous tenter par nos bougies parfumées artisanales, diffuseurs et vases d'exception.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-6 px-5 py-2.5 bg-[#262220] text-[#faf8f5] rounded-full text-xs uppercase tracking-wider font-medium hover:bg-stone-800 transition-colors"
                >
                  Découvrir les Collections
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div 
                  key={item.product.id}
                  className="flex gap-4 p-3.5 bg-white rounded-xl border border-stone-200/70 shadow-xs hover:border-stone-300 transition-colors"
                >
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-20 h-20 object-cover rounded-lg bg-stone-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="font-serif text-sm font-semibold text-stone-900 truncate">
                          {item.product.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-stone-400 hover:text-rose-600 p-1 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[11px] text-amber-800 font-medium">
                        {item.product.categoryName}
                      </p>
                      <p className="text-xs font-semibold text-stone-900 mt-1">
                        {formatPrice(item.product.price)}
                      </p>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100">
                      <div className="flex items-center border border-stone-200 rounded-md bg-stone-50">
                        <button
                          onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                          className="px-2 py-0.5 text-stone-600 hover:bg-stone-200 text-xs transition-colors"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-semibold text-stone-800 min-w-5 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                          className="px-2 py-0.5 text-stone-600 hover:bg-stone-200 text-xs transition-colors"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-xs font-bold text-stone-800">
                        {formatPrice(item.product.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}

            {cart.length > 0 && (
              <>
                {/* Gift Wrap option */}
                <div className="bg-amber-50/50 p-3.5 rounded-xl border border-amber-200/50 flex items-start gap-3">
                  <div className="pt-0.5">
                    <input
                      type="checkbox"
                      id="cart-gift-wrap"
                      checked={wantsGiftWrap}
                      onChange={(e) => setWantsGiftWrap(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-800 focus:ring-amber-500 accent-amber-800 cursor-pointer"
                    />
                  </div>
                  <label htmlFor="cart-gift-wrap" className="text-xs text-stone-700 cursor-pointer">
                    <span className="font-semibold text-stone-900 flex items-center gap-1.5">
                      <Gift className="w-3.5 h-3.5 text-amber-700" />
                      Emballage cadeau & mot manuscrit offert
                    </span>
                    <span className="block text-[11px] text-stone-500 mt-0.5">
                      Boîte écrin ZStore noire et ruban terracotta. Message personnalisable lors de la commande.
                    </span>
                  </label>
                </div>

                {/* Promo Code Form */}
                <div className="bg-white p-3.5 rounded-xl border border-stone-200/80">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-800 mb-2">
                    <Tag className="w-3.5 h-3.5 text-amber-700" />
                    <span>Code Avantage / Promotion</span>
                  </div>

                  {appliedPromo ? (
                    <div className="flex items-center justify-between bg-emerald-50 text-emerald-800 px-3 py-2 rounded-lg text-xs border border-emerald-200">
                      <div>
                        <span className="font-bold">{appliedPromo.code}</span>
                        <span className="ml-1 text-[11px]">(-{formatPrice(promoDiscount)})</span>
                      </div>
                      <button
                        onClick={removePromoCode}
                        className="text-emerald-700 hover:text-emerald-900 text-xs underline font-medium"
                      >
                        Retirer
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyPromo} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ex: BIENVENUE10"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value)}
                        className="flex-1 text-xs px-3 py-2 rounded-lg border border-stone-300 focus:border-amber-700 focus:outline-none uppercase"
                      />
                      <button
                        type="submit"
                        className="px-3 py-2 bg-stone-800 text-white rounded-lg text-xs font-medium hover:bg-stone-900 transition-colors"
                      >
                        Appliquer
                      </button>
                    </form>
                  )}

                  {promoMessage && (
                    <p className={`text-[11px] mt-1.5 ${promoMessage.type === 'success' ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {promoMessage.text}
                    </p>
                  )}

                  <p className="text-[10px] text-stone-400 mt-2">
                    Codes d'évaluation disponibles : <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-600">BIENVENUE10</code>, <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-600">HARMONIE5000</code>
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Footer & Checkout */}
          {cart.length > 0 && (
            <div className="p-5 bg-white border-t border-stone-200/80 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Sous-total</span>
                  <span>{formatPrice(cartSubtotal)}</span>
                </div>
                {promoDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Remise ({appliedPromo?.code})</span>
                    <span>-{formatPrice(promoDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-600">
                  <span>Livraison estimée</span>
                  <span className="text-stone-500">Calculée à l'étape suivante</span>
                </div>
                <div className="flex justify-between text-stone-900 font-serif text-base font-bold pt-2 border-t border-stone-100">
                  <span>Total estimé</span>
                  <span>{formatPrice(finalTotal)}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsCartOpen(false);
                  onProceedToCheckout();
                }}
                className="w-full py-3.5 bg-[#262220] hover:bg-[#38332f] text-[#faf8f5] rounded-xl text-xs uppercase tracking-wider font-semibold transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Valider ma Commande</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-stone-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Paiement sécurisé à la livraison ou Mobile Money Bénin</span>
              </div>

              <div className="pt-1 flex justify-center">
                <DemoBadge size="sm" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
