/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Cpu,
  Heart,
  Scale,
  Camera,
  Sparkles,
  WifiOff,
  Download,
  Printer,
  Star,
} from 'lucide-react';
import {
  INITIAL_PRODUCTS,
  INITIAL_ORDERS,
  INITIAL_TRANSACTIONS,
  INITIAL_COUPONS,
  INITIAL_WAREHOUSES,
  INITIAL_REVIEWS,
  INITIAL_SUPPORT_TICKETS,
  HERO_IMAGE_URL,
  Product,
  ProductCategory,
  CartItem,
  Order,
  PaymentTransaction,
  DashboardMetrics,
  Coupon,
  Warehouse,
  InventoryMovement,
  ProductReview,
  SupportTicket,
  AppNotification,
  AuditLogEntry,
  UserAccount,
  calculateCartTotals,
  computeDashboardMetrics,
  searchCatalogProducts,
  parseNaturalLanguageSearch,
  getHybridRecommendations,
  formatINR,
} from './utils/commerce';
import { ResilientImage } from './components/ResilientImage';
import { ProductDetailModal } from './components/ProductDetailModal';
import { PaymentGatewayModal } from './components/PaymentGatewayModal';
import { ProductDashboard } from './components/ProductDashboard';
import { AiStrategistDrawer } from './components/AiStrategistDrawer';
import { WishlistCompareModal } from './components/WishlistCompareModal';
import { AccountSupportModal } from './components/AccountSupportModal';
import { VisualSearchModal } from './components/VisualSearchModal';
import { useAuth } from './components/AuthProvider';

const CATEGORIES: ('All Objects' | ProductCategory)[] = [
  'All Objects',
  'Footwear & Sneakers',
  'Performance Athleisure',
  'Fragrances & Grooming',
  'Signature Accessories',
];

const NATURAL_LANGUAGE_SUGGESTIONS = [
  'Find running shoes below ₹15,000',
  'Show track jacket in stock',
  'Perfume under ₹4,000',
  'Leather court sneakers',
];

export default function App() {
  const [activeView, setActiveView] = useState<'storefront' | 'orders' | 'dashboard'>(
    'storefront'
  );

  // Full-Stack Enterprise State
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [transactions, setTransactions] =
    useState<PaymentTransaction[]>(INITIAL_TRANSACTIONS);
  const [coupons, setCoupons] = useState<Coupon[]>(INITIAL_COUPONS);
  const [warehouses, setWarehouses] = useState<Warehouse[]>(INITIAL_WAREHOUSES);
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>(INITIAL_REVIEWS);
  const [supportTickets, setSupportTickets] =
    useState<SupportTicket[]>(INITIAL_SUPPORT_TICKETS);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>(() =>
    computeDashboardMetrics(
      INITIAL_PRODUCTS,
      INITIAL_ORDERS,
      INITIAL_TRANSACTIONS,
      INITIAL_SUPPORT_TICKETS
    )
  );

  // User Session from AuthProvider, Persistent Cart, Wishlist, Compare & Recently Viewed
  const { currentUser, setCurrentUser } = useAuth();

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('one8_cart_v2');
      return saved ? JSON.parse(saved) : [{ productId: 'prod-1', quantity: 1 }];
    } catch {
      return [{ productId: 'prod-1', quantity: 1 }];
    }
  });

  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('one8_wishlist_v2');
      return saved ? JSON.parse(saved) : ['prod-1'];
    } catch {
      return ['prod-1'];
    }
  });

  const [compareIds, setCompareIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('one8_compare_v2');
      return saved ? JSON.parse(saved) : ['prod-1', 'prod-4'];
    } catch {
      return ['prod-1', 'prod-4'];
    }
  });

  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>(['prod-1', 'prod-2']);

  // Storefront Filter & Search State
  const [selectedCategory, setSelectedCategory] =
    useState<'All Objects' | ProductCategory>('All Objects');
  const [searchQuery, setSearchQuery] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<
    'featured' | 'price-asc' | 'price-desc' | 'rating' | 'newest'
  >('featured');

  // Modals & Drawers State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutInitialStep, setCheckoutInitialStep] = useState<'cart' | 'shipping'>('cart');
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [isWishlistCompareOpen, setIsWishlistCompareOpen] = useState(false);
  const [wishlistCompareTab, setWishlistCompareTab] = useState<'wishlist' | 'compare'>(
    'wishlist'
  );
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountModalTab, setAccountModalTab] = useState<
    'account' | 'support' | 'notifications'
  >('account');
  const [isVisualSearchOpen, setIsVisualSearchOpen] = useState(false);

  // Newsletter, Toast & PWA Offline/Install State
  const [bagToast, setBagToast] = useState<string | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [deferredPwaPrompt, setDeferredPwaPrompt] = useState<any>(null);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);

  // Sync LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('one8_cart_v2', JSON.stringify(cart));
    } catch {
      // ignore storage quota errors
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('one8_wishlist_v2', JSON.stringify(wishlistIds));
    } catch {
      // ignore
    }
  }, [wishlistIds]);

  useEffect(() => {
    try {
      localStorage.setItem('one8_compare_v2', JSON.stringify(compareIds));
    } catch {
      // ignore
    }
  }, [compareIds]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('one8_user_v2', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('one8_user_v2');
      }
    } catch {
      // ignore
    }
  }, [currentUser]);

  // Network & PWA Install Listeners
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPwaPrompt(e);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Load initial state from full-stack server
  useEffect(() => {
    fetch('/api/state')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.products)) {
          setProducts(data.products);
          if (data.orders) setOrders(data.orders);
          if (data.transactions) setTransactions(data.transactions);
          if (data.coupons) setCoupons(data.coupons);
          if (data.warehouses) setWarehouses(data.warehouses);
          if (data.inventoryMovements) setInventoryMovements(data.inventoryMovements);
          if (data.reviews) setReviews(data.reviews);
          if (data.supportTickets) setSupportTickets(data.supportTickets);
          if (data.notifications) setNotifications(data.notifications);
          if (data.auditLogs) setAuditLogs(data.auditLogs);
          if (data.metrics) setMetrics(data.metrics);
        }
      })
      .catch(() => {
        // Fallback to deterministic seed state already loaded
      });
  }, []);

  const syncServerPayload = (payload: any) => {
    if (!payload) return;
    if (payload.products) setProducts(payload.products);
    if (payload.orders) setOrders(payload.orders);
    if (payload.transactions) setTransactions(payload.transactions);
    if (payload.coupons) setCoupons(payload.coupons);
    if (payload.warehouses) setWarehouses(payload.warehouses);
    if (payload.inventoryMovements) setInventoryMovements(payload.inventoryMovements);
    if (payload.reviews) setReviews(payload.reviews);
    if (payload.supportTickets) setSupportTickets(payload.supportTickets);
    if (payload.notifications) setNotifications(payload.notifications);
    if (payload.auditLogs) setAuditLogs(payload.auditLogs);
    if (payload.metrics) setMetrics(payload.metrics);
  };

  const cartTotals = calculateCartTotals(
    cart,
    products,
    '',
    'STANDARD_WHITE_GLOVE',
    coupons
  );

  const handleOpenProductDetail = (product: Product) => {
    setSelectedProduct(product);
    setRecentlyViewedIds((prev) =>
      [product.id, ...prev.filter((id) => id !== product.id)].slice(0, 4)
    );
  };

  const handleAddToCart = (
    product: Product,
    quantity = 1,
    openCheckoutImmediately = false,
    variantId?: string
  ) => {
    setCart((prev) => {
      const existing = prev.find(
        (item) =>
          item.productId === product.id &&
          (item.variantId || '') === (variantId || '') &&
          !item.savedForLater
      );
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id &&
          (item.variantId || '') === (variantId || '') &&
          !item.savedForLater
            ? { ...item, quantity: Math.min(product.stock, item.quantity + quantity) }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          variantId,
          quantity: Math.min(product.stock, quantity),
          savedForLater: false,
        },
      ];
    });

    if (openCheckoutImmediately) {
      setCheckoutInitialStep('shipping');
      setIsCheckoutOpen(true);
    } else {
      setBagToast(`Added "${product.title}" to Kit Bag`);
      setTimeout(() => setBagToast(null), 3200);
    }
  };

  const handleUpdateCartQty = (productId: string, quantity: number) => {
    setCart((prev) => {
      if (quantity <= 0) {
        return prev.filter((item) => item.productId !== productId);
      }
      return prev.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      );
    });
  };

  const handleToggleSaveForLater = (productId: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, savedForLater: !item.savedForLater }
          : item
      )
    );
  };

  const handleToggleWishlist = (productId: string) => {
    setWishlistIds((prev) => {
      const exists = prev.includes(productId);
      const next = exists ? prev.filter((id) => id !== productId) : [...prev, productId];
      const prod = products.find((p) => p.id === productId);
      if (prod) {
        setBagToast(
          exists
            ? `Removed "${prod.title}" from Wishlist`
            : `Saved "${prod.title}" to Wishlist`
        );
        setTimeout(() => setBagToast(null), 2600);
      }
      return next;
    });
  };

  const handleToggleCompare = (productId: string) => {
    setCompareIds((prev) => {
      const exists = prev.includes(productId);
      if (exists) {
        return prev.filter((id) => id !== productId);
      }
      if (prev.length >= 4) {
        setBagToast('Comparison tray supports up to 4 items at once');
        setTimeout(() => setBagToast(null), 2600);
        return prev;
      }
      setBagToast('Added item to side-by-side comparison matrix');
      setTimeout(() => setBagToast(null), 2600);
      return [...prev, productId];
    });
  };

  // Intelligent Natural Language Search & Filtering
  const parsedIntent = searchQuery.trim()
    ? parseNaturalLanguageSearch(searchQuery)
    : null;

  const filteredProducts = searchCatalogProducts(products, searchQuery, {
    category: selectedCategory,
    inStockOnly,
    minRatingFilter: minRating > 0 ? minRating : undefined,
    sortBy,
  });

  // Hybrid Personalized Recommendations
  const recommendedProducts = getHybridRecommendations(
    products,
    recentlyViewedIds,
    cart.map((c) => c.productId),
    3
  );

  const recentlyViewedProducts = recentlyViewedIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p));

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F6F4] text-[#0A0A0B]">
      {/* OFFLINE / PWA BANNER */}
      {isOffline && (
        <div className="bg-[#E11D48] text-white px-4 py-1.5 text-xs flex items-center justify-center gap-2">
          <WifiOff className="w-3.5 h-3.5" />
          <span>
            Offline Mode Active — Browsing cached one8 Official Store catalog via Service Worker.
          </span>
        </div>
      )}

      {/* STRICT 3-ZONE TOP BAR CONTRACT — ONE8 CARBON OBSIDIAN HEADER */}
      <header className="sticky top-0 z-40 bg-[#0A0A0B] text-white border-b border-zinc-800 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#storefront"
          onClick={(e) => {
            e.preventDefault();
            setActiveView('storefront');
          }}
          className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-wider text-white whitespace-nowrap shrink-0"
        >
          one8
        </a>

        {/* Zone 2: 5 concise single-line navigation links */}
        <nav
          aria-label="Primary Navigation"
          className="flex items-center gap-5 sm:gap-7 text-xs sm:text-sm font-medium text-zinc-400 overflow-x-auto"
        >
          <a
            href="#collection"
            onClick={(e) => {
              e.preventDefault();
              setActiveView('storefront');
            }}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              activeView === 'storefront'
                ? 'text-white border-b-2 border-[#E11D48]'
                : ''
            }`}
          >
            Shop Drop
          </a>
          <a
            href="#wishlist"
            onClick={(e) => {
              e.preventDefault();
              setWishlistCompareTab('wishlist');
              setIsWishlistCompareOpen(true);
            }}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5"
          >
            Wishlist ({wishlistIds.length})
          </a>
          <a
            href="#orders"
            onClick={(e) => {
              e.preventDefault();
              setActiveView('orders');
            }}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              activeView === 'orders'
                ? 'text-white border-b-2 border-[#E11D48]'
                : ''
            }`}
          >
            Track Orders ({orders.length})
          </a>
          <a
            href="#dashboard"
            onClick={(e) => {
              e.preventDefault();
              setActiveView('dashboard');
            }}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              activeView === 'dashboard'
                ? 'text-white border-b-2 border-[#E11D48]'
                : ''
            }`}
          >
            Merchant Dashboard
          </a>
          <a
            href="#account"
            onClick={(e) => {
              e.preventDefault();
              setAccountModalTab('account');
              setIsAccountModalOpen(true);
            }}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5"
          >
            {currentUser ? `Hi, ${currentUser.fullName.split(' ')[0]}` : 'Login / OTP'}
          </a>
        </nav>

        {/* Zone 3: 1 Primary Action Button */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => {
              setCheckoutInitialStep('cart');
              setIsCheckoutOpen(true);
            }}
            className="px-4 py-2 rounded-lg bg-[#E11D48] text-white text-xs font-semibold hover:bg-[#BE123C] transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>
              Shopping Bag ({cartTotals.itemCount}) · {formatINR(cartTotals.totalAmount)}
            </span>
          </button>
        </div>
      </header>

      {/* Non-intrusive Add-to-Bag Feedback Banner */}
      {bagToast && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-40 bg-[#0A0A0B] text-white px-4 py-3 rounded-lg shadow-lg border border-zinc-700 flex items-center gap-3 text-xs"
        >
          <CheckCircle2 className="w-4 h-4 text-[#E11D48] shrink-0" />
          <span>{bagToast}</span>
          <button
            type="button"
            onClick={() => {
              setBagToast(null);
              setCheckoutInitialStep('cart');
              setIsCheckoutOpen(true);
            }}
            className="underline font-semibold ml-2 whitespace-nowrap text-[#D4AF37]"
          >
            Open Bag
          </button>
        </div>
      )}

      {/* MAIN VIEWPORT */}
      <main className="flex-1">
        {/* VIEW 1: ONE8 OFFICIAL STOREFRONT */}
        {activeView === 'storefront' && (
          <div>
            {/* SECTION 1: ONE8 STADIUM CARBON HERO + PERFORMANCE PILLARS */}
            <section className="max-w-7xl mx-auto px-4 sm:px-8 pt-5 pb-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch bg-[#0A0A0B] text-white border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                {/* Left Column: High-Impact Athletic Campaign Narrative */}
                <div className="lg:col-span-6 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
                  <div className="space-y-3.5">
                    <div className="text-xs font-mono uppercase tracking-widest text-[#D4AF37] flex items-center gap-2">
                      <span>ONE8 OFFICIAL STORE · EDITION #18</span>
                      <span aria-hidden="true">·</span>
                      <span>MUMBAI · BENGALURU · DELHI</span>
                    </div>

                    <h1
                      className="font-display uppercase text-white font-bold leading-[1.03] tracking-tight"
                      style={{
                        fontSize: 'clamp(2.25rem, 3.8vw, 3.45rem)',
                        textWrap: 'balance',
                      }}
                    >
                      Built for relentless pace. Engineered for #18.
                    </h1>

                    <p className="text-sm text-zinc-300 leading-relaxed max-w-[56ch]">
                      Carbon-plated marathon footwear, laser-vented 4-way stretch athleisure, and
                      22% extrait-grade signature fragrances. Tested in high-output performance
                      labs and delivered across India with instant UPI & 3DS checkout.
                    </p>
                  </div>

                  <div className="pt-6 space-y-4">
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
                      <a
                        href="#catalog-grid"
                        className="px-4 py-2.5 rounded-lg bg-[#E11D48] text-white text-xs font-semibold uppercase tracking-wide hover:bg-[#BE123C] transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                      >
                        <span>Shop Season 18 Drop</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </a>

                      <button
                        type="button"
                        onClick={() => setIsVisualSearchOpen(true)}
                        className="px-3.5 py-2.5 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 text-xs font-medium hover:bg-zinc-800 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                      >
                        <Camera className="w-3.5 h-3.5 text-[#E11D48]" />
                        <span>AI Visual Search</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsAiDrawerOpen(true)}
                        className="px-3.5 py-2.5 rounded-lg border border-zinc-700 bg-zinc-900/60 text-zinc-200 text-xs font-medium hover:bg-zinc-800 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>one8 AI Coach</span>
                      </button>
                    </div>

                    <div className="pt-3 border-t border-zinc-800 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
                      <span>
                        Code <strong className="text-white font-mono">ONE8CHAMP</strong> (18% Off) ·{' '}
                        <strong className="text-white font-mono">ATELIER10</strong> (10% Off) ·{' '}
                        <strong className="text-white font-mono">FIRST5000</strong> (₹5,000 Off)
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>Free Express Air Transit above ₹25,000</span>
                    </div>
                  </div>
                </div>

                {/* Right Column: 16:9 Athlete Sprinter Campaign Photography */}
                <div className="lg:col-span-6 bg-zinc-900 min-h-[250px] sm:min-h-[330px] max-h-[410px]">
                  <ResilientImage
                    src={HERO_IMAGE_URL}
                    alt="one8 championship athlete sprinting in matte black AeroTech track jacket and carbon-plated crimson running shoes"
                    className="w-full h-full lg:h-full object-cover"
                  />
                </div>
              </div>

              {/* Full-Width 4-Column Performance & Gateway Trust Row Below Hero */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-3">
                <div className="bg-white px-4 py-3.5 rounded-lg border border-zinc-200">
                  <div className="font-mono text-xs text-[#E11D48] font-semibold">
                    01. Carbon Propulsion
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-zinc-900 mt-0.5 truncate">
                    Full-Length Carbon & NitroFoam
                  </div>
                </div>
                <div className="bg-white px-4 py-3.5 rounded-lg border border-zinc-200">
                  <div className="font-mono text-xs text-[#E11D48] font-semibold">
                    02. one8Pay Gateway
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-zinc-900 mt-0.5 truncate">
                    HMAC-Signed UPI, 3DS & NetBanking
                  </div>
                </div>
                <div className="bg-white px-4 py-3.5 rounded-lg border border-zinc-200">
                  <div className="font-mono text-xs text-[#E11D48] font-semibold">
                    03. Pro-Dry Engineering
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-zinc-900 mt-0.5 truncate">
                    4-Way Stretch & Silver-Ion Mesh
                  </div>
                </div>
                <div className="bg-white px-4 py-3.5 rounded-lg border border-zinc-200">
                  <div className="font-mono text-xs text-[#E11D48] font-semibold">
                    04. Live Hub Sync
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-zinc-900 mt-0.5 truncate">
                    {metrics.totalSkus} Flagship SKUs · {metrics.totalUnitsInStock} Units
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 2: INTELLIGENT DISCOVERY & ONE8 SEASON 18 DROP GRID */}
            <section
              id="catalog-grid"
              className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-6 border-t border-zinc-200"
            >
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-[#E11D48] mb-1">
                    one8 Performance Catalog · Natural-Language Discovery · INR (₹)
                  </div>
                  <h2 className="font-display text-3xl sm:text-4xl uppercase font-bold text-zinc-950">
                    Featured Drop ({filteredProducts.length})
                  </h2>
                </div>

                {/* Intelligent Search, Visual Search, Compare & Sort Controls */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="relative">
                    <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="search"
                      aria-label="Search one8 collection with natural language"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Try: 'Running shoes below ₹15,000'..."
                      className="pl-9 pr-3.5 py-2 text-xs rounded-lg border border-zinc-300 bg-white focus:outline-none focus:border-zinc-950 w-64 sm:w-72"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsVisualSearchOpen(true)}
                    className="px-3 py-2 rounded-lg border border-zinc-300 bg-white text-xs font-medium text-zinc-800 hover:bg-zinc-100 flex items-center gap-1.5"
                    title="AI Visual Search by Photo or Gear Type"
                  >
                    <Camera className="w-3.5 h-3.5 text-[#E11D48]" />
                    <span>Visual Search</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setWishlistCompareTab('compare');
                      setIsWishlistCompareOpen(true);
                    }}
                    className="px-3 py-2 rounded-lg border border-zinc-300 bg-white text-xs font-medium text-zinc-800 hover:bg-zinc-100 flex items-center gap-1.5"
                  >
                    <Scale className="w-3.5 h-3.5" />
                    <span>Compare ({compareIds.length})</span>
                  </button>

                  <select
                    aria-label="Sort products"
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(
                        e.target.value as
                          | 'featured'
                          | 'price-asc'
                          | 'price-desc'
                          | 'rating'
                          | 'newest'
                      )
                    }
                    className="px-3 py-2 text-xs rounded-lg border border-zinc-300 bg-white text-zinc-800 focus:outline-none focus:border-zinc-950"
                  >
                    <option value="featured">Sort: Signature Order</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="rating">Rating: Highest Verified</option>
                    <option value="newest">Release: Newest Drop</option>
                  </select>
                </div>
              </div>

              {/* Natural Language Search Suggestions & Active Intent Feedback */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-3 rounded-xl border border-zinc-200 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-zinc-500 font-medium">Instant Queries:</span>
                  {NATURAL_LANGUAGE_SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setSearchQuery(suggestion)}
                      className={`px-2.5 py-1 rounded-md border transition-colors ${
                        searchQuery === suggestion
                          ? 'bg-[#0A0A0B] text-white border-[#0A0A0B]'
                          : 'bg-[#F6F6F4] text-zinc-800 border-zinc-300 hover:border-zinc-500'
                      }`}
                    >
                      “{suggestion}”
                    </button>
                  ))}
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-[#E11D48] font-medium underline ml-1"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Availability & Rating Filter Toggles */}
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 text-zinc-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => setInStockOnly(e.target.checked)}
                      className="rounded border-zinc-300"
                    />
                    <span>In-Stock Only</span>
                  </label>
                  <select
                    aria-label="Filter by minimum rating"
                    value={minRating}
                    onChange={(e) => setMinRating(Number(e.target.value))}
                    className="px-2.5 py-1 rounded-md border border-zinc-300 bg-[#F6F6F4] text-zinc-800"
                  >
                    <option value={0}>All Ratings</option>
                    <option value={4.5}>4.5★ & Above</option>
                    <option value={4.8}>4.8★ & Above</option>
                  </select>
                </div>
              </div>

              {/* Parsed Natural Language Intent Telemetry (when active) */}
              {parsedIntent &&
                (parsedIntent.maxPrice !== undefined ||
                  parsedIntent.minPrice !== undefined ||
                  parsedIntent.inferredCategory) && (
                  <div className="text-xs text-zinc-600 flex flex-wrap items-center gap-2 px-1">
                    <span className="font-semibold text-[#E11D48]">
                      one8 AI Search Parser Active:
                    </span>
                    {parsedIntent.inferredCategory && (
                      <span>Category → {parsedIntent.inferredCategory}</span>
                    )}
                    {parsedIntent.maxPrice !== undefined && (
                      <span>· Max Price → {formatINR(parsedIntent.maxPrice)}</span>
                    )}
                    {parsedIntent.minPrice !== undefined && (
                      <span>· Min Price → {formatINR(parsedIntent.minPrice)}</span>
                    )}
                  </div>
                )}

              {/* Interactive Category Filter Bar */}
              <div
                className="flex items-center gap-1.5 p-1 bg-zinc-200/80 rounded-lg overflow-x-auto max-w-full self-start"
                role="tablist"
                aria-label="Product Category Filter"
              >
                {CATEGORIES.map((category) => (
                  <button
                    key={category}
                    type="button"
                    role="tab"
                    aria-selected={selectedCategory === category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3.5 py-2 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                      selectedCategory === category
                        ? 'bg-[#0A0A0B] text-white shadow-xs'
                        : 'text-zinc-600 hover:text-zinc-950'
                    }`}
                  >
                    {category === 'All Objects' ? 'All Drops' : category}
                  </button>
                ))}
              </div>

              {/* 3-Column Product Grid */}
              {filteredProducts.length === 0 ? (
                <div className="bg-white p-12 rounded-xl border border-zinc-200 text-center space-y-3">
                  <p className="font-display text-2xl uppercase font-bold text-zinc-900">
                    No gear matches your filter criteria.
                  </p>
                  <p className="text-xs text-zinc-500">
                    Try clearing your price ceiling or switching categories.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('All Objects');
                      setSearchQuery('');
                      setInStockOnly(false);
                      setMinRating(0);
                    }}
                    className="px-4 py-2 rounded-lg bg-[#0A0A0B] text-white text-xs font-semibold"
                  >
                    Reset Discovery Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
                  {filteredProducts.map((product) => {
                    const isWishlisted = wishlistIds.includes(product.id);
                    const isCompared = compareIds.includes(product.id);

                    return (
                      <article
                        key={product.id}
                        className="group bg-white rounded-xl border border-zinc-200 overflow-hidden flex flex-col justify-between transition-transform duration-150 hover:-translate-y-0.5 hover:border-zinc-400"
                      >
                        <div>
                          {/* 4:3 Studio Product Photography */}
                          <div
                            onClick={() => handleOpenProductDetail(product)}
                            className="aspect-4/3 bg-zinc-900 overflow-hidden cursor-pointer relative"
                          >
                            <ResilientImage
                              src={product.imageUrl}
                              alt={product.title}
                              fallbackLabel={product.title}
                              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-200"
                            />
                            {/* Interactive Wishlist & Compare Quick Actions */}
                            <div
                              className="absolute top-3 right-3 flex items-center gap-1.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                aria-label={`Save ${product.title} to Wishlist`}
                                onClick={() => handleToggleWishlist(product.id)}
                                className={`p-2 rounded-lg border backdrop-blur-xs transition-colors ${
                                  isWishlisted
                                    ? 'bg-[#0A0A0B] text-white border-[#0A0A0B]'
                                    : 'bg-white/90 text-zinc-800 border-zinc-200 hover:bg-white'
                                }`}
                              >
                                <Heart
                                  className={`w-3.5 h-3.5 ${
                                    isWishlisted ? 'fill-current text-[#E11D48]' : ''
                                  }`}
                                />
                              </button>
                              <button
                                type="button"
                                aria-label={`Compare ${product.title}`}
                                onClick={() => handleToggleCompare(product.id)}
                                className={`p-2 rounded-lg border backdrop-blur-xs transition-colors ${
                                  isCompared
                                    ? 'bg-[#0A0A0B] text-white border-[#0A0A0B]'
                                    : 'bg-white/90 text-zinc-800 border-zinc-200 hover:bg-white'
                                }`}
                              >
                                <Scale className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Card Body — Zero Pill Enclosures */}
                          <div className="p-5">
                            <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500 mb-1.5">
                              <span className="uppercase tracking-wider text-[#E11D48] font-semibold">
                                {product.category}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono">{product.sku}</span>
                              <span aria-hidden="true">·</span>
                              <span>
                                {product.stock > 0
                                  ? `In Stock (${product.stock})`
                                  : 'Out of Stock'}
                              </span>
                            </div>

                            <h3 className="text-base font-bold text-zinc-950 leading-snug mb-1">
                              <button
                                type="button"
                                onClick={() => handleOpenProductDetail(product)}
                                className="text-left hover:text-[#E11D48] transition-colors focus:outline-none"
                              >
                                {product.title}
                              </button>
                            </h3>

                            <p className="text-xs text-zinc-600 line-clamp-2 mb-3">
                              {product.material} — {product.description}
                            </p>

                            {/* Inline Rating & Provenance Row */}
                            <div className="flex items-center gap-2 text-xs text-zinc-500">
                              <span className="inline-flex items-center gap-1 text-zinc-900 font-semibold">
                                <Star className="w-3.5 h-3.5 text-[#D4AF37] fill-[#D4AF37]" />
                                {product.ratingAvg ?? 4.9} ({product.reviewCount ?? 24})
                              </span>
                              <span aria-hidden="true">·</span>
                              <span>{product.origin}</span>
                            </div>
                          </div>
                        </div>

                        {/* Card Footer with Tabular Price & Actions */}
                        <div className="px-5 pb-5 pt-3 border-t border-zinc-100 flex items-center justify-between gap-3">
                          <div>
                            <div className="flex items-baseline gap-2">
                              <span className="font-mono text-base font-bold text-zinc-950 tabular-nums">
                                {formatINR(product.price)}
                              </span>
                              {product.compareAtPrice &&
                                product.compareAtPrice > product.price && (
                                  <span className="font-mono text-xs text-zinc-400 line-through tabular-nums">
                                    {formatINR(product.compareAtPrice)}
                                  </span>
                                )}
                            </div>
                            <div className="text-[11px] text-zinc-500">{product.leadTime}</div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenProductDetail(product)}
                              className="px-3 py-2 rounded-lg border border-zinc-300 text-zinc-800 text-xs font-medium hover:bg-zinc-100 transition-colors whitespace-nowrap"
                            >
                              Specs
                            </button>
                            <button
                              type="button"
                              disabled={product.stock <= 0}
                              onClick={() => handleAddToCart(product, 1, false)}
                              className="px-3.5 py-2 rounded-lg bg-[#0A0A0B] text-white text-xs font-semibold hover:bg-[#E11D48] disabled:opacity-40 transition-colors whitespace-nowrap shrink-0"
                            >
                              {product.stock > 0 ? 'Add to Bag' : 'Sold Out'}
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            {/* SECTION 3: PERSONALIZED HYBRID RECOMMENDATIONS & RECENTLY VIEWED */}
            <section className="max-w-7xl mx-auto px-4 sm:px-8 py-10 border-t border-zinc-200 space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-[#E11D48] mb-1">
                    one8 Kit Pairings · Co-Purchase & Training Affinity
                  </div>
                  <h2 className="font-display text-2xl sm:text-3xl uppercase font-bold text-zinc-950">
                    Recommended for Your Training Kit
                  </h2>
                </div>
                <div className="text-xs text-zinc-500">
                  Calibrated from your active kit bag ({cartTotals.itemCount}) & saved gear
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {recommendedProducts.map((rec) => (
                  <div
                    key={rec.id}
                    className="bg-white p-4 rounded-xl border border-zinc-200 flex items-center gap-4"
                  >
                    <div
                      onClick={() => handleOpenProductDetail(rec)}
                      className="w-24 h-20 rounded-lg bg-zinc-900 overflow-hidden shrink-0 cursor-pointer"
                    >
                      <ResilientImage
                        src={rec.imageUrl}
                        alt={rec.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] text-[#E11D48] font-mono font-semibold">
                        {rec.sku}
                      </div>
                      <h3 className="text-sm font-bold text-zinc-950 truncate">
                        <button
                          type="button"
                          onClick={() => handleOpenProductDetail(rec)}
                          className="hover:underline text-left"
                        >
                          {rec.title}
                        </button>
                      </h3>
                      <div className="font-mono text-xs font-bold text-zinc-950 mt-1">
                        {formatINR(rec.price)}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleAddToCart(rec, 1, false)}
                          className="px-2.5 py-1 rounded bg-[#0A0A0B] text-white text-[11px] font-semibold hover:bg-[#E11D48]"
                        >
                          Add to Bag
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenProductDetail(rec)}
                          className="text-[11px] text-zinc-600 underline"
                        >
                          Inspect
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recently Viewed Strip */}
              {recentlyViewedProducts.length > 0 && (
                <div className="pt-4 border-t border-zinc-200 flex flex-wrap items-center justify-between gap-4">
                  <div className="text-xs text-zinc-500 font-medium">
                    Recently Inspected Gear:
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    {recentlyViewedProducts.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleOpenProductDetail(item)}
                        className="flex items-center gap-2 text-xs text-zinc-800 hover:underline bg-white px-3 py-1.5 rounded-lg border border-zinc-200"
                      >
                        <span className="font-semibold">{item.title}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-zinc-500">
                          {formatINR(item.price)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* SECTION 4: ONE8 ATHLETE CREED, TESTIMONIAL & AI COACH BANNER */}
            <section className="max-w-7xl mx-auto px-4 sm:px-8 py-12 border-t border-zinc-200 space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 space-y-4">
                  <div className="text-xs font-mono uppercase tracking-wider text-[#E11D48]">
                    one8 Performance Labs · Tested by Championship Athletes
                  </div>
                  <h2 className="font-display text-3xl sm:text-4xl uppercase font-bold text-zinc-950">
                    Never settle for average pace. Built for the 1% who outwork the room.
                  </h2>
                  <p className="text-sm text-zinc-600 leading-relaxed max-w-[65ch]">
                    Every one8 release undergoes biomechanical stride testing in Bengaluru and
                    high-humidity textile stress testing in Mumbai. Ships with an official GST tax
                    invoice and serialized authenticity hologram.
                  </p>

                  {/* Attributable Athlete Testimonial */}
                  <blockquote className="bg-white p-5 rounded-xl border border-zinc-200 space-y-2">
                    <p className="text-sm text-zinc-800 italic">
                      “Switching to the one8 Velocity Carbon-Plate Pro Runner and AeroTech Track
                      Jacket cut my 10K split times by 42 seconds. The midfoot lock and NitroFoam
                      rebound rival ₹25,000 imported race shoes.”
                    </p>
                    <footer className="text-xs text-zinc-500">
                      <strong className="text-zinc-950 font-semibold">
                        Arjun Singhania, Marathoner & Track Coach
                      </strong>{' '}
                      · Worli Sea Face Running Club, Mumbai
                    </footer>
                  </blockquote>
                </div>

                {/* High-Thinking AI Coach & Strategist Callout Card */}
                <div className="lg:col-span-5 bg-[#0A0A0B] text-white p-7 rounded-xl border border-zinc-800 space-y-4">
                  <div className="flex items-center gap-2 text-xs text-[#D4AF37] font-mono">
                    <Cpu className="w-4 h-4" />
                    <span>Powered by gemini-4-argon · ThinkingLevel.HIGH</span>
                  </div>
                  <h3 className="font-display text-2xl uppercase font-bold">
                    Need a marathon kit pairing or store inventory strategy?
                  </h3>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Consult our high-thinking one8 AI Strategist for shoe rotation sizing, fragrance
                    layering, and merchant margin optimization against live warehouse stock.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsAiDrawerOpen(true)}
                      className="py-2.5 px-4 rounded-lg bg-[#E11D48] text-white text-xs font-semibold hover:bg-[#BE123C] transition-colors"
                    >
                      Launch one8 AI Coach
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAccountModalTab('support');
                        setIsAccountModalOpen(true);
                      }}
                      className="py-2.5 px-4 rounded-lg border border-zinc-700 text-zinc-200 text-xs font-medium hover:bg-zinc-900 transition-colors"
                    >
                      Athlete Support Desk
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* VIEW 2: ORDER TRACKING, LIFECYCLE TIMELINE & GST INVOICES */}
        {activeView === 'orders' && (
          <section className="max-w-5xl mx-auto px-4 sm:px-8 py-10 space-y-6">
            <div className="flex items-end justify-between border-b border-zinc-200 pb-5">
              <div>
                <div className="text-xs font-mono uppercase text-[#E11D48] mb-1">
                  Live Allocation, AWB Dispatch Telemetry & GST Invoices
                </div>
                <h1 className="font-display text-3xl uppercase font-bold text-zinc-950">
                  Verified Orders & Gateway Receipts ({orders.length})
                </h1>
              </div>
              <button
                type="button"
                onClick={() => setActiveView('storefront')}
                className="px-4 py-2 rounded-lg border border-zinc-300 text-xs font-semibold text-zinc-800 hover:bg-zinc-100"
              >
                Back to Shop Drop
              </button>
            </div>

            {/* Printable GST Invoice Modal View */}
            {selectedInvoiceOrder && (
              <div className="bg-white p-6 rounded-xl border-2 border-zinc-950 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                  <div>
                    <div className="text-xs font-mono text-zinc-500">
                      TAX INVOICE · GSTIN 27AABCO1818K1Z5
                    </div>
                    <h2 className="font-display text-2xl uppercase font-bold text-zinc-950">
                      one8 Official Store Invoice — {selectedInvoiceOrder.id}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-3 py-1.5 rounded-lg bg-[#0A0A0B] text-white text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print / Save PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedInvoiceOrder(null)}
                      className="px-3 py-1.5 rounded-lg border border-zinc-300 text-xs"
                    >
                      Close
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="text-zinc-500">Billed & Shipped To:</div>
                    <div className="font-semibold text-zinc-900">
                      {selectedInvoiceOrder.customer.fullName}
                    </div>
                    <div>{selectedInvoiceOrder.customer.streetAddress}</div>
                    <div>
                      {selectedInvoiceOrder.customer.city}, {selectedInvoiceOrder.customer.state} —{' '}
                      {selectedInvoiceOrder.customer.pinCode}
                    </div>
                  </div>
                  <div className="sm:text-right font-mono">
                    <div>
                      Invoice Date:{' '}
                      {new Date(selectedInvoiceOrder.createdAt).toLocaleDateString('en-IN')}
                    </div>
                    <div>Gateway Ref: {selectedInvoiceOrder.paymentTransactionId}</div>
                    <div>
                      AWB Tracking: {selectedInvoiceOrder.trackingNumber || 'Pending Assignment'}
                    </div>
                  </div>
                </div>
                <div className="border-t border-zinc-200 pt-3 font-mono text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatINR(selectedInvoiceOrder.subtotal)}</span>
                  </div>
                  {selectedInvoiceOrder.discount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discount ({selectedInvoiceOrder.promoCode}):</span>
                      <span>-{formatINR(selectedInvoiceOrder.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>GST (18% IGST):</span>
                    <span>{formatINR(selectedInvoiceOrder.gstAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Express Insured Transit:</span>
                    <span>{formatINR(selectedInvoiceOrder.shippingFee)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm pt-2 border-t border-zinc-200">
                    <span>Total Settled Amount:</span>
                    <span>{formatINR(selectedInvoiceOrder.totalAmount)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {orders.map((order) => {
                const txn = transactions.find((t) => t.id === order.paymentTransactionId);
                return (
                  <article
                    key={order.id}
                    className="bg-white p-6 rounded-xl border border-zinc-200 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 pb-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                          <span className="font-mono font-bold text-[#E11D48]">{order.id}</span>
                          <span aria-hidden="true">·</span>
                          <span>
                            Placed{' '}
                            {new Date(order.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono">{order.paymentTransactionId}</span>
                          {order.trackingNumber && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono text-zinc-900">
                                AWB: {order.trackingNumber}
                              </span>
                            </>
                          )}
                        </div>
                        <h2 className="text-base font-bold text-zinc-950 mt-1">
                          Status: {order.status} — Recipient: {order.customer.fullName} (
                          {order.customer.city}, {order.customer.pinCode})
                        </h2>
                      </div>

                      <div className="text-left sm:text-right flex sm:flex-col items-center sm:items-end justify-between gap-2">
                        <div>
                          <div className="font-mono text-lg font-bold text-zinc-950 tabular-nums">
                            {formatINR(order.totalAmount)}
                          </div>
                          <div className="text-xs text-zinc-500 font-mono">
                            {txn ? `${txn.methodSummary} · ${txn.status}` : order.paymentMethod}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedInvoiceOrder(order)}
                          className="px-3 py-1 rounded border border-zinc-300 text-xs font-semibold text-zinc-800 hover:bg-zinc-100"
                        >
                          View GST Invoice
                        </button>
                      </div>
                    </div>

                    <div className="divide-y divide-zinc-100">
                      {order.items.map((item) => (
                        <div
                          key={item.productId}
                          className="py-2.5 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-zinc-900">{item.title}</span>
                            <span className="font-mono text-zinc-500">
                              {item.sku} × {item.quantity}
                            </span>
                          </div>
                          <span className="font-mono text-zinc-900 font-semibold tabular-nums">
                            {formatINR(item.unitPrice * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Order Lifecycle Timeline */}
                    {order.timeline && order.timeline.length > 0 && (
                      <div className="pt-3 border-t border-zinc-100">
                        <div className="text-[11px] font-mono uppercase text-zinc-400 mb-2">
                          Order & Logistics Lifecycle
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs">
                          {order.timeline.map((event, idx) => (
                            <div
                              key={`${event.status}-${idx}`}
                              className="flex items-center gap-1.5 text-zinc-800 bg-[#F6F6F4] px-2.5 py-1 rounded border border-zinc-200"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#E11D48]" />
                              <span className="font-semibold">{event.status}</span>
                              <span className="text-zinc-400">·</span>
                              <span className="text-zinc-600">{event.note}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* VIEW 3: ENTERPRISE PRODUCT & OPERATIONS DASHBOARD */}
        {activeView === 'dashboard' && (
          <ProductDashboard
            products={products}
            orders={orders}
            transactions={transactions}
            metrics={metrics}
            coupons={coupons}
            warehouses={warehouses}
            inventoryMovements={inventoryMovements}
            supportTickets={supportTickets}
            auditLogs={auditLogs}
            onStateUpdated={syncServerPayload}
            onOpenAiStrategist={() => setIsAiDrawerOpen(true)}
            onSwitchToStorefront={() => setActiveView('storefront')}
          />
        )}
      </main>

      {/* ONE8 CARBON OBSIDIAN ENTERPRISE FOOTER */}
      <footer className="border-t border-zinc-800 bg-[#0A0A0B] text-zinc-400 px-4 sm:px-8 py-10 mt-12">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-zinc-800">
            <div className="md:col-span-5 space-y-2">
              <div className="font-display text-2xl uppercase font-bold text-white tracking-wider">
                one8 — Performance Footwear, Athleisure & Fragrances
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-md">
                Engineered for relentless pace. Carbon-plated running footwear, 4-way stretch
                technical activewear, and signature Eau De Parfum direct from our Mumbai,
                Bengaluru, and Gurugram hubs.
              </p>
              <div className="text-xs text-zinc-500 font-mono pt-1">
                GSTIN 27AABCO1818K1Z5 · Official one8 Enterprise Storefront v2.0
              </div>
            </div>

            <div className="md:col-span-3 space-y-2 text-xs">
              <div className="font-semibold text-white uppercase tracking-wider">
                one8 Digital Modules
              </div>
              <ul className="space-y-1.5 text-zinc-400">
                <li>
                  <button
                    type="button"
                    onClick={() => setIsVisualSearchOpen(true)}
                    className="hover:text-white"
                  >
                    AI Visual Gear Search
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setWishlistCompareTab('compare');
                      setIsWishlistCompareOpen(true);
                    }}
                    className="hover:text-white"
                  >
                    Gear Comparison Matrix ({compareIds.length})
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setAccountModalTab('support');
                      setIsAccountModalOpen(true);
                    }}
                    className="hover:text-white"
                  >
                    Athlete Support & AI Triage
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setAccountModalTab('notifications');
                      setIsAccountModalOpen(true);
                    }}
                    className="hover:text-white"
                  >
                    Drop Notifications ({unreadNotificationsCount})
                  </button>
                </li>
              </ul>
            </div>

            <div className="md:col-span-4 space-y-2">
              <div className="text-xs font-semibold text-white uppercase tracking-wider">
                one8 Club Early Access & Drop Alerts
              </div>
              <p className="text-xs text-zinc-400">
                Get early access to limited #18 Gold Edition sneaker drops and member privileges.
              </p>
              {newsletterSubscribed ? (
                <div className="p-2.5 rounded-lg bg-zinc-900 border border-emerald-500/40 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Welcome to the one8 Club. Early drop alerts activated.</span>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (newsletterEmail.includes('@')) {
                      setNewsletterSubscribed(true);
                      setNewsletterEmail('');
                    }
                  }}
                  className="flex gap-2 pt-1"
                >
                  <input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="athlete@one8club.in"
                    className="flex-1 px-3 py-2 text-xs rounded-lg border border-zinc-700 bg-zinc-900 text-white"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#E11D48] text-white text-xs font-semibold hover:bg-[#BE123C]"
                  >
                    Join Club
                  </button>
                </form>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-zinc-500">
            <div>© {new Date().getFullYear()} one8 Official Store · Enterprise Edition v2.0</div>

            <div className="flex flex-wrap items-center gap-6">
              <button
                type="button"
                onClick={() => setActiveView('storefront')}
                className="hover:text-white transition-colors"
              >
                Shop Drop
              </button>
              <button
                type="button"
                onClick={() => setActiveView('orders')}
                className="hover:text-white transition-colors"
              >
                Order Tracking
              </button>
              <button
                type="button"
                onClick={() => setActiveView('dashboard')}
                className="hover:text-white transition-colors"
              >
                Merchant Dashboard
              </button>
              {deferredPwaPrompt && (
                <button
                  type="button"
                  onClick={() => {
                    deferredPwaPrompt.prompt();
                    setDeferredPwaPrompt(null);
                  }}
                  className="flex items-center gap-1 text-white font-medium"
                >
                  <Download className="w-3.5 h-3.5" />
                  Install App
                </button>
              )}
              <span className="flex items-center gap-1 text-zinc-400">
                <ShieldCheck className="w-3.5 h-3.5 text-[#E11D48]" />
                one8Pay HMAC Verified
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* PRODUCT DETAIL MODAL (WITH MULTI-IMAGE GALLERY, ZOOM, VARIANTS & REVIEWS) */}
      <ProductDetailModal
        product={selectedProduct}
        reviews={reviews}
        wishlistIds={wishlistIds}
        compareIds={compareIds}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
        onToggleWishlist={handleToggleWishlist}
        onToggleCompare={handleToggleCompare}
        onReviewSubmitted={(updatedReviews, updatedProducts) => {
          setReviews(updatedReviews);
          setProducts(updatedProducts);
        }}
      />

      {/* WISHLIST & SIDE-BY-SIDE PRODUCT COMPARISON MODAL */}
      <WishlistCompareModal
        isOpen={isWishlistCompareOpen}
        initialTab={wishlistCompareTab}
        onClose={() => setIsWishlistCompareOpen(false)}
        products={products}
        wishlistIds={wishlistIds}
        compareIds={compareIds}
        onToggleWishlist={handleToggleWishlist}
        onToggleCompare={handleToggleCompare}
        onAddToCart={(product) => handleAddToCart(product, 1, false)}
        onInspectProduct={(product) => {
          setIsWishlistCompareOpen(false);
          handleOpenProductDetail(product);
        }}
      />

      {/* ACCOUNT, SAVED ADDRESSES, NOTIFICATIONS & SUPPORT CENTER MODAL */}
      <AccountSupportModal
        isOpen={isAccountModalOpen}
        initialTab={accountModalTab}
        onClose={() => setIsAccountModalOpen(false)}
        currentUser={currentUser}
        onUserAuthenticated={(user) => setCurrentUser(user)}
        onSignOut={() => setCurrentUser(null)}
        supportTickets={supportTickets}
        notifications={notifications}
        onTicketCreated={(tickets) => setSupportTickets(tickets)}
        onNotificationsUpdated={(notifs) => setNotifications(notifs)}
      />

      {/* AI VISUAL SEARCH MODAL */}
      <VisualSearchModal
        isOpen={isVisualSearchOpen}
        onClose={() => setIsVisualSearchOpen(false)}
        onSelectProduct={(product) => handleOpenProductDetail(product)}
      />

      {/* SHOPPING BAG, SAVE FOR LATER & PAYMENT GATEWAY MODAL */}
      <PaymentGatewayModal
        isOpen={isCheckoutOpen}
        initialStep={checkoutInitialStep}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        products={products}
        coupons={coupons}
        onUpdateCartQty={handleUpdateCartQty}
        onToggleSaveForLater={handleToggleSaveForLater}
        onClearCart={() => setCart((prev) => prev.filter((item) => item.savedForLater))}
        onCheckoutSuccess={(data) => {
          syncServerPayload(data);
          setCart((prev) => prev.filter((item) => item.savedForLater));
        }}
        onNavigateToOrders={() => setActiveView('orders')}
      />

      {/* HIGH-THINKING AI STRATEGIST DRAWER */}
      <AiStrategistDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
      />
    </div>
  );
}
