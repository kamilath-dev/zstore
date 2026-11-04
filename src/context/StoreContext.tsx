import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Product, 
  CartItem, 
  Category, 
  CategorySlug, 
  Order, 
  OrderStatus, 
  PromoCode, 
  DeliveryDetails, 
  PaymentMethod 
} from '../types';
import { 
  db, 
  handleFirestoreError, 
  OperationType 
} from '../services/firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  runTransaction
} from 'firebase/firestore';
import { useAuth } from './AuthContext';

interface StoreContextType {
  // Catalog & Filter
  products: Product[];
  categories: Category[];
  isCategoriesLoading: boolean;
  isProductsLoading: boolean;
  productsError: string | null;
  categoriesError: string | null;
  promosError: string | null;
  selectedCategory: CategorySlug | 'all';
  setSelectedCategory: (cat: CategorySlug | 'all') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  sortBy: 'featured' | 'price-asc' | 'price-desc' | 'rating' | 'newest';
  setSortBy: (sort: 'featured' | 'price-asc' | 'price-desc' | 'rating' | 'newest') => void;
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
  inStockOnly: boolean;
  setInStockOnly: (val: boolean) => void;
  activeScentNote: string | null;
  setActiveScentNote: (note: string | null) => void;

  // Selected Product for Detail Modal
  selectedProduct: Product | null;
  setSelectedProduct: (p: Product | null) => void;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotalCount: number;
  cartSubtotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;

  // Wishlist
  wishlist: string[];
  wishlistCount: number;
  toggleWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;

  // Checkout & Promos
  appliedPromo: PromoCode | null;
  applyPromoCode: (code: string) => { success: boolean; message: string };
  removePromoCode: () => void;
  promoDiscount: number;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  placeOrder: (deliveryDetails: DeliveryDetails, paymentMethod: PaymentMethod) => Promise<Order>;

  // Orders
  orders: Order[];
  isOrdersLoading: boolean;
  ordersError: string | null;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus, note?: string) => Promise<void>;
  lastConfirmedOrder: Order | null;
  setLastConfirmedOrder: (order: Order | null) => void;

  // Admin Dashboard
  isAdminViewOpen: boolean;
  setIsAdminViewOpen: (open: boolean) => void;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  updateStock: (productId: string, newStock: number) => Promise<void>;
  addCategory: (categoryData: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  promos: PromoCode[];
  isPromosLoading: boolean;
  addPromoCode: (promo: PromoCode) => Promise<void>;
  togglePromoActive: (code: string) => Promise<void>;

  // Refresh
  reloadProducts: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);
const LOCAL_STORAGE_PREFIX = 'zstore-7ed88';
const CART_STORAGE_KEY = `${LOCAL_STORAGE_PREFIX}:cart`;
const WISHLIST_STORAGE_KEY = `${LOCAL_STORAGE_PREFIX}:wishlist`;

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, firebaseUser, isAdmin } = useAuth();

  // Real Firestore Products State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [promosError, setPromosError] = useState<string | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<CategorySlug | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating' | 'newest'>('featured');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [activeScentNote, setActiveScentNote] = useState<string | null>(null);

  // Modals
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAdminViewOpen, setIsAdminViewOpen] = useState(false);
  const [lastConfirmedOrder, setLastConfirmedOrder] = useState<Order | null>(null);

  // Cart (persisted in localStorage for active user session)
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Wishlist
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Calculate actual wishlist count against products that genuinely exist in the store catalog
  const wishlistCount = React.useMemo(() => {
    if (products.length === 0) return 0;
    return wishlist.filter((id) => products.some((p) => p.id === id)).length;
  }, [wishlist, products]);

  // Real-time Orders from Firestore
  const [orders, setOrders] = useState<Order[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  // Promos
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [isPromosLoading, setIsPromosLoading] = useState(true);
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  // Sync wishlist with authenticated user profile
  useEffect(() => {
    if (user && user.wishlist) {
      setWishlist(user.wishlist);
    }
  }, [user]);

  // Save guest wishlist to localStorage
  useEffect(() => {
    if (!firebaseUser) {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
    }
  }, [wishlist, firebaseUser]);

  // Automatically prune orphaned product IDs from wishlist once catalog is loaded
  useEffect(() => {
    if (!isProductsLoading && products.length > 0 && wishlist.length > 0) {
      const validIds = wishlist.filter((id) => products.some((p) => p.id === id));
      if (validIds.length !== wishlist.length) {
        setWishlist(validIds);
        localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(validIds));
        if (firebaseUser) {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          updateDoc(userDocRef, { wishlist: validIds }).catch(error => {
            console.error('Could not synchronize the user wishlist:', error);
          });
        }
      }
    }
  }, [isProductsLoading, products, wishlist, firebaseUser]);

  // 1. Real-time Firestore Listener for Products
  useEffect(() => {
    setIsProductsLoading(true);
    setProductsError(null);

    const productsRef = collection(db, 'products');
    const unsubscribe = onSnapshot(
      productsRef,
      (snapshot) => {
        const loaded: Product[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push({ id: docSnap.id, ...docSnap.data() } as Product);
        });
        setProducts(loaded);
        setIsProductsLoading(false);
      },
      (error) => {
        console.error('Products listener error:', error);
        setProductsError(error.code === 'permission-denied'
          ? 'Lecture refusée par les règles Firestore. Vérifiez les règles publiées pour products.'
          : 'Impossible de charger le catalogue depuis Cloud Firestore.');
        setIsProductsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // 2. Real-time Firestore Listener for Categories
  useEffect(() => {
    setIsCategoriesLoading(true);
    setCategoriesError(null);
    const categoriesRef = collection(db, 'categories');
    const unsubscribe = onSnapshot(
      categoriesRef,
      (snapshot) => {
        setCategoriesError(null);
        setIsCategoriesLoading(false);
        const loaded: Category[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push({ id: docSnap.id, ...docSnap.data() } as Category);
        });
        setCategories(loaded);
      },
      (error) => {
        console.error('Categories listener error:', error);
        setCategories([]);
        setIsCategoriesLoading(false);
        setCategoriesError(error.code === 'permission-denied'
          ? 'Lecture refusée par les règles Firestore. Vérifiez les règles publiées pour categories.'
          : 'Impossible de charger les catégories depuis Cloud Firestore.');
      }
    );

    return () => unsubscribe();
  }, []);

  // 3. Real-time Firestore Listener for Promos
  useEffect(() => {
    setIsPromosLoading(true);
    setPromosError(null);
    const promosRef = collection(db, 'promos');
    const unsubscribe = onSnapshot(
      promosRef,
      (snapshot) => {
        setPromosError(null);
        setIsPromosLoading(false);
        const loaded: PromoCode[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push(docSnap.data() as PromoCode);
        });
        setPromos(loaded);
      },
      (error) => {
        console.error('Promos listener error:', error);
        setPromos([]);
        setIsPromosLoading(false);
        setPromosError(error.code === 'permission-denied'
          ? 'Lecture refusée par les règles Firestore. Vérifiez les règles publiées pour promos.'
          : 'Impossible de charger les promotions depuis Cloud Firestore.');
      }
    );

    return () => unsubscribe();
  }, []);

  // 4. Real-time Firestore Listener for Orders (RBAC-aware)
  useEffect(() => {
    if (!firebaseUser) {
      setOrders([]);
      setOrdersError(null);
      setIsOrdersLoading(false);
      return;
    }

    setIsOrdersLoading(true);
    setOrdersError(null);

    // If Admin: listen to all orders. If Customer: listen to orders where userId == firebaseUser.uid
    const ordersRef = collection(db, 'orders');
    const ordersQuery = isAdmin 
      ? ordersRef 
      : query(ordersRef, where('userId', '==', firebaseUser.uid));

    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        setOrdersError(null);
        const loaded: Order[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push({ id: docSnap.id, ...docSnap.data() } as Order);
        });
        // Sort descending by date
        loaded.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setOrders(loaded);
        setIsOrdersLoading(false);
      },
      (error) => {
        console.error('Orders listener error:', error);
        setOrders([]);
        setOrdersError(error.code === 'permission-denied'
          ? 'Lecture refusée pour les commandes. Vérifiez la session et les règles Firestore.'
          : 'Impossible de charger les commandes depuis Cloud Firestore.');
        setIsOrdersLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firebaseUser, isAdmin]);

  // Cart operations
  const addToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    setAppliedPromo(null);
  };

  const cartTotalCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartSubtotal = cart.reduce((total, item) => total + item.product.price * item.quantity, 0);

  // Wishlist operations with Firestore persistence for authenticated users
  const toggleWishlist = async (productId: string) => {
    const updated = wishlist.includes(productId)
      ? wishlist.filter((id) => id !== productId)
      : [...wishlist, productId];

    setWishlist(updated);

    if (firebaseUser) {
      try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        await updateDoc(userDocRef, { wishlist: updated });
      } catch (err) {
        console.warn('Could not persist wishlist to Firestore user doc:', err);
      }
    }
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  // Promo code validation
  const applyPromoCode = (code: string): { success: boolean; message: string } => {
    const cleanCode = code.trim().toUpperCase();
    const found = promos.find((p) => p.code.toUpperCase() === cleanCode && p.isActive);
    if (!found) {
      return { success: false, message: 'Code promotionnel invalide ou expiré.' };
    }
    if (found.minOrderAmount && cartSubtotal < found.minOrderAmount) {
      return {
        success: false,
        message: `Ce code nécessite un panier minimum de ${found.minOrderAmount.toLocaleString()} FCFA.`
      };
    }
    setAppliedPromo(found);
    return { success: true, message: `Code ${found.code} appliqué avec succès !` };
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
  };

  const promoDiscount = appliedPromo
    ? appliedPromo.discountPercent
      ? Math.round((cartSubtotal * appliedPromo.discountPercent) / 100)
      : appliedPromo.discountAmount || 0
    : 0;

  // Orders and inventory are written together by the authenticated server endpoint.
  const placeOrder = async (deliveryDetails: DeliveryDetails, paymentMethod: PaymentMethod): Promise<Order> => {
    if (!firebaseUser) {
      throw new Error("Authentification requise pour valider la commande.");
    }

    if (cart.length === 0) {
      throw new Error("Votre panier est vide.");
    }

    const pendingKeyName = `${LOCAL_STORAGE_PREFIX}:pending-order:${firebaseUser.uid}`;
    const idempotencyKey = localStorage.getItem(pendingKeyName) || crypto.randomUUID();
    localStorage.setItem(pendingKeyName, idempotencyKey);
    const idToken = await firebaseUser.getIdToken();
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        idempotencyKey,
        items: cart.map(({ product, quantity, selectedColor, selectedSize }) => ({
          productId: product.id,
          quantity,
          ...(selectedColor === undefined ? {} : { selectedColor }),
          ...(selectedSize === undefined ? {} : { selectedSize })
        })),
        deliveryDetails,
        paymentMethod,
        ...(appliedPromo ? { promoCode: appliedPromo.code } : {})
      })
    });

    const result = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(
        typeof result?.error === 'string'
          ? result.error
          : 'Impossible d’enregistrer la commande. Veuillez réessayer.'
      );
    }
    if (!result?.order || typeof result.order.id !== 'string') {
      throw new Error('Le serveur a renvoyé une réponse de commande invalide.');
    }

    const newOrder = result.order as Order;
    localStorage.removeItem(pendingKeyName);
    setLastConfirmedOrder(newOrder);
    clearCart();
    setIsCheckoutOpen(false);
    return newOrder;
  };

  // Real Order Status Progression in Firestore (Admin only)
  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus, note?: string) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await runTransaction(db, async transaction => {
        const orderSnap = await transaction.get(orderRef);
        if (!orderSnap.exists()) throw new Error('Commande introuvable dans Firestore.');
        const existingData = orderSnap.data() as Order;
        const statusNotes: Record<OrderStatus, string> = {
          en_attente: 'Commande remise en attente',
          en_preparation: 'Préparation et emballage soigné en atelier ZStore',
          en_livraison: 'Colis confié au livreur ZStore Express Bénin',
          livree: 'Colis remis au destinataire et paiement encaissé',
          annulee: 'Commande annulée'
        };
        transaction.update(orderRef, {
          status: newStatus,
          timeline: [
            ...(existingData.timeline || []),
            {
              status: newStatus,
              timestamp: new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }),
              note: note || statusNotes[newStatus]
            }
          ],
          isPaid: newStatus === 'livree' ? true : existingData.isPaid
        });
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  // Helper to remove any undefined values before writing to Firestore
  const sanitizeFirestoreData = (data: Record<string, any>): Record<string, any> => {
    const clean: Record<string, any> = {};
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) {
        clean[key] = val;
      }
    }
    return clean;
  };

  // Real Product Management in Cloud Firestore (Admin only)
  const addProduct = async (productData: Omit<Product, 'id'>) => {
    const productRef = doc(collection(db, 'products'));
    const newId = productRef.id;
    const newProduct: Product = {
      ...productData,
      id: newId,
      rating: 0,
      reviewCount: 0,
      reviews: [],
      updatedAt: new Date().toISOString()
    };

    try {
      await runTransaction(db, async transaction => {
        const existing = await transaction.get(productRef);
        if (existing.exists()) throw new Error('Identifiant produit déjà utilisé; réessayez.');
        transaction.set(productRef, sanitizeFirestoreData(newProduct));
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `products/${newId}`);
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      const cleanUpdates = sanitizeFirestoreData({
        ...updates,
        updatedAt: new Date().toISOString()
      });
      await updateDoc(doc(db, 'products', id), cleanUpdates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${id}`);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
    }
  };

  const updateStock = async (productId: string, newStock: number) => {
    try {
      await updateDoc(doc(db, 'products', productId), {
        stock: Math.max(0, newStock),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${productId}`);
    }
  };

  const addPromoCode = async (newPromo: PromoCode) => {
    const code = newPromo.code.trim().toUpperCase();
    if (!/^[A-Z0-9_-]{1,50}$/.test(code)) {
      throw new Error('Le code promotionnel doit contenir uniquement lettres, chiffres, tirets et underscores.');
    }
    const promo = { ...newPromo, code };
    try {
      const promoRef = doc(db, 'promos', code);
      await runTransaction(db, async transaction => {
        const existing = await transaction.get(promoRef);
        if (existing.exists()) throw new Error('Ce code promotionnel existe déjà.');
        transaction.set(promoRef, promo);
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `promos/${code}`);
    }
  };

  const togglePromoActive = async (code: string) => {
    const target = promos.find(p => p.code === code);
    if (!target) return;
    try {
      await updateDoc(doc(db, 'promos', code), {
        isActive: !target.isActive
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `promos/${code}`);
    }
  };

  // Real Category Management in Cloud Firestore (Admin only)
  const addCategory = async (categoryData: Omit<Category, 'id'>) => {
    const cleanSlug = (categoryData.slug || categoryData.name)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    if (!cleanSlug) throw new Error('Le slug de catégorie est invalide.');
    const newId = `cat-${cleanSlug}`;
    const newCategory: Category = {
      ...categoryData,
      id: newId,
      slug: cleanSlug,
      itemCount: categoryData.itemCount || 0
    };

    try {
      const categoryRef = doc(db, 'categories', newId);
      await runTransaction(db, async transaction => {
        const existing = await transaction.get(categoryRef);
        if (existing.exists()) throw new Error('Cette catégorie existe déjà.');
        transaction.set(categoryRef, sanitizeFirestoreData(newCategory));
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `categories/${newId}`);
    }
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    try {
      const cleanUpdates = sanitizeFirestoreData(updates);
      await updateDoc(doc(db, 'categories', id), cleanUpdates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `categories/${id}`);
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'categories', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `categories/${id}`);
    }
  };

  const reloadProducts = () => {
    // onSnapshot automatically updates
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        categories,
        isCategoriesLoading,
        isProductsLoading,
        productsError,
        categoriesError,
        promosError,
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
        setActiveScentNote,
        selectedProduct,
        setSelectedProduct,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartTotalCount,
        cartSubtotal,
        isCartOpen,
        setIsCartOpen,
        wishlist,
        wishlistCount,
        toggleWishlist,
        isInWishlist,
        appliedPromo,
        applyPromoCode,
        removePromoCode,
        promoDiscount,
        isCheckoutOpen,
        setIsCheckoutOpen,
        placeOrder,
        orders,
        isOrdersLoading,
        ordersError,
        updateOrderStatus,
        lastConfirmedOrder,
        setLastConfirmedOrder,
        isAdminViewOpen,
        setIsAdminViewOpen,
        addProduct,
        updateProduct,
        deleteProduct,
        updateStock,
        addCategory,
        updateCategory,
        deleteCategory,
        promos,
        isPromosLoading,
        addPromoCode,
        togglePromoActive,
        reloadProducts
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
