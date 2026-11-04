import React from 'react';
import { Heart, ShoppingBag, Eye, Star } from 'lucide-react';
import { Product } from '../../types';
import { formatPrice } from '../../utils/currency';
import { useStore } from '../../context/StoreContext';

interface ProductCardProps {
  product: Product;
  onOpenDetails: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onOpenDetails }) => {
  const { addToCart, isInWishlist, toggleWishlist } = useStore();
  const isWishlisted = isInWishlist(product.id);
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const isOutOfStock = product.stock === 0;

  return (
    <div className="group relative flex flex-col bg-white rounded-2xl overflow-hidden border border-stone-200/70 hover:border-amber-200 hover:shadow-lg transition-all duration-300">
      
      {/* Image Container */}
      <div className="relative aspect-square w-full overflow-hidden bg-stone-100 cursor-pointer" onClick={() => onOpenDetails(product)}>
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
          {product.isBestseller && (
            <span className="bg-[#262220] text-amber-300 text-[10px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full shadow-xs">
              Bestseller
            </span>
          )}
          {product.isNewArrival && (
            <span className="bg-amber-700 text-white text-[10px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full shadow-xs">
              Nouveau
            </span>
          )}
          {product.originalPrice && (
            <span className="bg-rose-700 text-white text-[10px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full shadow-xs">
              Offre Spéciale
            </span>
          )}
        </div>

        {/* Stock Status Pill */}
        <div className="absolute bottom-3 left-3 z-10">
          {isOutOfStock ? (
            <span className="bg-stone-900/80 backdrop-blur-xs text-stone-200 text-[10px] px-2 py-0.5 rounded-md font-medium">
              Rupture momentanée
            </span>
          ) : isLowStock ? (
            <span className="bg-amber-900/85 backdrop-blur-xs text-amber-200 text-[10px] px-2 py-0.5 rounded-md font-medium">
              Plus que {product.stock} en stock
            </span>
          ) : null}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-200 z-10 ${
            isWishlisted
              ? 'bg-rose-50 text-rose-600 shadow-sm'
              : 'bg-white/80 backdrop-blur-xs text-stone-700 hover:text-rose-600 hover:bg-white'
          }`}
          title={isWishlisted ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          aria-label="Favoris"
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-600' : ''}`} />
        </button>

        {/* Quick View Hover Button */}
        <div className="absolute inset-0 bg-stone-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
          <span className="bg-white/95 text-stone-900 text-xs font-semibold px-4 py-2 rounded-full shadow-md flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
            <Eye className="w-3.5 h-3.5" />
            Aperçu rapide
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
            <span className="text-amber-800 font-medium text-[11px] uppercase tracking-wider">
              {product.categoryName}
            </span>
            <div className="flex items-center gap-1 text-stone-700 font-medium text-[11px]">
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span>{product.rating}</span>
              <span className="text-stone-400">({product.reviewCount})</span>
            </div>
          </div>

          <h3 
            onClick={() => onOpenDetails(product)}
            className="font-serif text-base font-semibold text-stone-900 hover:text-amber-900 transition-colors cursor-pointer line-clamp-1"
          >
            {product.name}
          </h3>

          <p className="text-stone-500 text-xs line-clamp-2 mt-1 leading-relaxed font-light">
            {product.tagline}
          </p>
        </div>

        {/* Price & Add to Cart */}
        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif text-base sm:text-lg font-bold text-stone-900">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && (
                <span className="text-xs text-stone-400 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>
            {product.burnTime && (
              <span className="text-[10px] text-stone-400 block font-light">
                Combustion: {product.burnTime}
              </span>
            )}
          </div>

          <button
            onClick={() => addToCart(product, 1)}
            disabled={isOutOfStock}
            className={`p-2.5 rounded-full transition-all flex items-center justify-center shrink-0 ${
              isOutOfStock
                ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                : 'bg-[#262220] hover:bg-amber-700 text-white shadow-xs hover:shadow-md cursor-pointer'
            }`}
            title={isOutOfStock ? 'Indisponible' : 'Ajouter au panier'}
            aria-label="Ajouter au panier"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>

      </div>

    </div>
  );
};
