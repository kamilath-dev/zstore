import React, { useState } from 'react';
import { 
  X, 
  Heart, 
  ShoppingBag, 
  Star, 
  Truck, 
  ShieldCheck, 
  Sparkles, 
  Check, 
  MapPin, 
  Layers, 
  Flame, 
  Info,
  Clock
} from 'lucide-react';
import { Product } from '../../types';
import { formatPrice, formatPriceEur } from '../../utils/currency';
import { useStore } from '../../context/StoreContext';
import { DemoBadge } from '../common/DemoBadge';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, onClose }) => {
  const { addToCart, isInWishlist, toggleWishlist } = useStore();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'olfactory' | 'care' | 'reviews'>('description');

  if (!product) return null;

  const isWishlisted = isInWishlist(product.id);
  const isOutOfStock = product.stock === 0;

  const handleAddToCart = () => {
    addToCart(product, quantity);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="min-h-full flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="relative bg-[#faf8f5] w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-stone-200">
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-full transition-colors bg-white/80 backdrop-blur-xs shadow-xs"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2">
            
            {/* Left: Gallery */}
            <div className="p-6 sm:p-8 bg-stone-100/70 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="aspect-square rounded-2xl overflow-hidden bg-white shadow-xs border border-stone-200">
                  <img
                    src={product.images[selectedImageIndex] || product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover object-center"
                  />
                </div>

                {/* Thumbnails */}
                {product.images.length > 1 && (
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    {product.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                          selectedImageIndex === idx
                            ? 'border-amber-700 shadow-xs'
                            : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Guarantees Box */}
              <div className="mt-6 pt-6 border-t border-stone-200/80 space-y-2.5 text-xs text-stone-600">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Livraison express à Cotonou (3h à 6h) & partout au Bénin</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Disponible immédiatement au Showroom Haie Vive, Cotonou</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Garantie casse transport & emballage renforcé ZStore</span>
                </div>
              </div>
            </div>

            {/* Right: Info & Actions */}
            <div className="p-6 sm:p-8 flex flex-col justify-between overflow-y-auto max-h-[85vh]">
              <div>
                
                {/* Header info */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs uppercase tracking-widest text-amber-800 font-semibold">
                    {product.categoryName}
                  </span>
                  <DemoBadge size="sm" />
                </div>

                <h2 className="font-serif text-2xl sm:text-3xl font-normal text-stone-900 mt-1">
                  {product.name}
                </h2>

                <p className="text-stone-600 text-xs sm:text-sm italic mt-1 font-serif">
                  {product.tagline}
                </p>

                {/* Rating & Stock */}
                <div className="flex items-center gap-4 mt-3 pb-4 border-b border-stone-200 text-xs">
                  <div className="flex items-center gap-1.5 text-stone-800 font-medium">
                    <div className="flex text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < Math.floor(product.rating) ? 'fill-amber-500 text-amber-500' : 'text-stone-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span>{product.rating}</span>
                    <span className="text-stone-400">({product.reviewCount} avis vérifiés)</span>
                  </div>

                  <span className="text-stone-300">•</span>

                  <div>
                    {isOutOfStock ? (
                      <span className="text-rose-600 font-medium">Épuisé</span>
                    ) : product.stock <= 5 ? (
                      <span className="text-amber-700 font-medium">
                        Dernières pièces ({product.stock} disponibles)
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-medium flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> En stock à Cotonou
                      </span>
                    )}
                  </div>
                </div>

                {/* Price Display */}
                <div className="mt-4 flex items-baseline gap-3">
                  <span className="font-serif text-3xl font-bold text-stone-900">
                    {formatPrice(product.price)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm text-stone-400 line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                  <span className="text-xs text-stone-500">
                    ({formatPriceEur(product.price)})
                  </span>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-stone-200 mt-5 text-xs font-medium">
                  <button
                    onClick={() => setActiveTab('description')}
                    className={`pb-2 mr-4 transition-colors ${
                      activeTab === 'description'
                        ? 'border-b-2 border-amber-800 text-amber-900 font-semibold'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    Détails
                  </button>

                  {product.olfactoryPyramid && (
                    <button
                      onClick={() => setActiveTab('olfactory')}
                      className={`pb-2 mr-4 transition-colors ${
                        activeTab === 'olfactory'
                          ? 'border-b-2 border-amber-800 text-amber-900 font-semibold'
                          : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      Pyramide Olfactive
                    </button>
                  )}

                  <button
                    onClick={() => setActiveTab('care')}
                    className={`pb-2 mr-4 transition-colors ${
                      activeTab === 'care'
                        ? 'border-b-2 border-amber-800 text-amber-900 font-semibold'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    Entretien
                  </button>

                  <button
                    onClick={() => setActiveTab('reviews')}
                    className={`pb-2 transition-colors ${
                      activeTab === 'reviews'
                        ? 'border-b-2 border-amber-800 text-amber-900 font-semibold'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    Avis ({product.reviews?.length || 0})
                  </button>
                </div>

                {/* Tab content */}
                <div className="py-4 text-xs text-stone-600 min-h-36">
                  {activeTab === 'description' && (
                    <div className="space-y-3">
                      <p className="leading-relaxed text-stone-700">
                        {product.description}
                      </p>
                      {product.details && product.details.length > 0 && (
                        <ul className="space-y-1.5 pt-1">
                          {product.details.map((det, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-amber-700 font-bold">•</span>
                              <span>{det}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {product.dimensions && (
                        <p className="text-stone-500 pt-1">
                          <strong>Dimensions :</strong> {product.dimensions}
                        </p>
                      )}
                    </div>
                  )}

                  {activeTab === 'olfactory' && product.olfactoryPyramid && (
                    <div className="space-y-3 bg-amber-50/50 p-3.5 rounded-xl border border-amber-200/50">
                      <div>
                        <span className="font-semibold text-stone-900 uppercase tracking-wider text-[10px] block">
                          Notes de Tête (Première impression)
                        </span>
                        <p className="text-stone-700 mt-0.5">
                          {product.olfactoryPyramid.topNotes.join(', ')}
                        </p>
                      </div>
                      <div>
                        <span className="font-semibold text-stone-900 uppercase tracking-wider text-[10px] block">
                          Notes de Cœur (Personnalité & sillage)
                        </span>
                        <p className="text-stone-700 mt-0.5">
                          {product.olfactoryPyramid.heartNotes.join(', ')}
                        </p>
                      </div>
                      <div>
                        <span className="font-semibold text-stone-900 uppercase tracking-wider text-[10px] block">
                          Notes de Fond (Tenue durable)
                        </span>
                        <p className="text-stone-700 mt-0.5">
                          {product.olfactoryPyramid.baseNotes.join(', ')}
                        </p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'care' && (
                    <div className="space-y-2">
                      <p className="font-medium text-stone-800">
                        Conseils d'utilisation de nos maîtres ciriers et artisans :
                      </p>
                      <ul className="space-y-1.5">
                        {product.careGuide?.map((care, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-amber-700 font-bold">✓</span>
                            <span>{care}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {activeTab === 'reviews' && (
                    <div className="space-y-3">
                      {(!product.reviews || product.reviews.length === 0) ? (
                        <p className="text-stone-400 py-4 italic">
                          Soyez le premier client à donner votre avis sur cette création à Cotonou !
                        </p>
                      ) : (
                        product.reviews.map((rev) => (
                          <div key={rev.id} className="p-3 bg-white rounded-lg border border-stone-200/80 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-stone-900">
                                {rev.authorName} ({rev.city})
                              </span>
                              <div className="flex text-amber-500">
                                {[...Array(rev.rating)].map((_, i) => (
                                  <Star key={i} className="w-3 h-3 fill-amber-500" />
                                ))}
                              </div>
                            </div>
                            <p className="text-stone-600 text-xs leading-relaxed">
                              "{rev.comment}"
                            </p>
                            <span className="text-[10px] text-stone-400 block">
                              {rev.date} • Achat vérifié
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

              </div>

              {/* Bottom Purchase Bar */}
              <div className="pt-4 border-t border-stone-200 space-y-3">
                <div className="flex items-center gap-3">
                  {/* Quantity */}
                  <div className="flex items-center border border-stone-300 rounded-xl bg-white px-2 py-1">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={isOutOfStock || quantity <= 1}
                      className="px-2 py-1 text-stone-600 hover:text-stone-900 disabled:opacity-30"
                    >
                      -
                    </button>
                    <span className="px-3 text-xs font-bold text-stone-900">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      disabled={isOutOfStock || quantity >= product.stock}
                      className="px-2 py-1 text-stone-600 hover:text-stone-900 disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>

                  {/* Add to Cart button */}
                  <button
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    className={`flex-1 py-3.5 px-6 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all flex items-center justify-center gap-2 ${
                      isOutOfStock
                        ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                        : 'bg-[#262220] hover:bg-amber-800 text-white shadow-md'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>
                      {isOutOfStock ? 'Indisponible' : `Ajouter au Panier • ${formatPrice(product.price * quantity)}`}
                    </span>
                  </button>

                  {/* Wishlist toggle */}
                  <button
                    onClick={() => toggleWishlist(product.id)}
                    className={`p-3.5 rounded-xl border transition-colors ${
                      isWishlisted
                        ? 'bg-rose-50 border-rose-200 text-rose-600'
                        : 'bg-white border-stone-300 text-stone-700 hover:text-rose-600'
                    }`}
                    title={isWishlisted ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  >
                    <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-600' : ''}`} />
                  </button>
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
