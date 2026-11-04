export type CategorySlug = 
  | 'bougies'
  | 'diffuseurs'
  | 'vases'
  | 'decoration'
  | 'coffrets'
  | (string & {});

export interface Category {
  id: string;
  slug: CategorySlug;
  name: string;
  description: string;
  image: string;
  itemCount: number;
}

export interface OlfactoryPyramid {
  topNotes: string[];    // Notes de tête
  heartNotes: string[];  // Notes de cœur
  baseNotes: string[];   // Notes de fond
}

export interface ProductReview {
  id: string;
  productId?: string;
  authorName: string;
  city: string;
  rating: number; // 1-5
  date: string;
  comment: string;
  verifiedPurchase: boolean;
  userId?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: CategorySlug;
  categoryName: string;
  price: number; // In FCFA
  originalPrice?: number; // In FCFA if on promo
  rating: number;
  reviewCount: number;
  stock: number;
  sku: string;
  images: string[];
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestseller?: boolean;
  tagline: string;
  description: string;
  details: string[];
  dimensions?: string;
  weight?: string;
  burnTime?: string; // for candles
  capacity?: string; // for diffusers/vases
  materials?: string[];
  olfactoryPyramid?: OlfactoryPyramid;
  careGuide?: string[];
  reviews?: ProductReview[];
  updatedAt?: string;
  isDemo?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

export type PromoCode = {
  code: string;
  minOrderAmount?: number;
  description: string;
  isActive: boolean;
} & (
  | { discountPercent: number; discountAmount?: number }
  | { discountPercent?: number; discountAmount: number }
);

export type OrderStatus = 
  | 'en_attente'       // En attente de confirmation / règlement
  | 'en_preparation'  // En préparation atelier
  | 'en_livraison'    // En cours d'acheminement coursier
  | 'livree'          // Livrée au client & encaissée
  | 'annulee';        // Annulée

export type PaymentMethod = 
  | 'paiement_livraison'  // Espèces ou Mobile Money remis au coursier à la livraison (Opérationnel)
  | 'virement_bancaire'   // Virement bancaire / RIB ZStore Bénin (Opérationnel, confirmation manuelle)
  | 'mtn_momo_planned'    // MTN Mobile Money Direct (Bientôt disponible, en cours de raccordement API)
  | 'moov_money_planned'; // Moov Money Direct (Bientôt disponible, en cours de raccordement API)

export interface DeliveryDetails {
  fullName: string;
  phone: string;
  email: string;
  city: string; // Cotonou, Abomey-Calavi, Porto-Novo, Parakou, etc.
  district: string; // Haie Vive, Cadjehoun, Akpakpa, Fidjrossè, etc.
  addressDetails: string; // Repère pour le coursier
  deliveryOption: 'standard' | 'express' | 'showroom';
  deliveryDate?: string;
  deliveryTimeSlot?: string;
  giftWrapping: boolean;
  giftMessage?: string;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g., ZS-BN-2026-8941
  date: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  appliedPromo?: string;
  total: number;
  deliveryDetails: DeliveryDetails;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  isPaid: boolean;
  timeline: {
    status: OrderStatus;
    timestamp: string;
    note: string;
  }[];
  createdAt?: string;
  isDemo?: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
  city?: string;
  district?: string;
  savedAddresses: {
    id: string;
    label: string; // "Domicile", "Bureau", etc.
    fullName: string;
    phone: string;
    city: string;
    district: string;
    details: string;
  }[];
  wishlist?: string[];
  role: 'customer' | 'admin';
}
