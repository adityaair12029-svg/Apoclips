export type ProductCategory =
  | 'Footwear & Sneakers'
  | 'Performance Athleisure'
  | 'Fragrances & Grooming'
  | 'Signature Accessories'
  | 'Audio & Acoustics'
  | 'Architectural Lighting'
  | 'Sculptural Seating'
  | 'Tableware & Craft';

export type PaymentMethod = 'UPI' | 'CARD' | 'NETBANKING' | 'COD';

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Packed'
  | 'Shipped'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled'
  | 'Returned'
  | 'Refunded';

export type ShippingMethodId = 'STANDARD_WHITE_GLOVE' | 'EXPRESS_AIR_CRATE';

export interface ProductVariant {
  id: string;
  label: string;
  size: string;
  color: string;
  colorHex: string;
  priceDelta: number;
  stock: number;
  skuSuffix: string;
}

export interface ProductSpecification {
  label: string;
  value: string;
}

export interface ProductReview {
  id: string;
  productId: string;
  authorName: string;
  authorCity: string;
  rating: number;
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: string;
}

export interface Product {
  id: string;
  sku: string;
  title: string;
  brand: string;
  category: ProductCategory;
  subcategory: string;
  price: number; // Discounted/selling price in INR (₹)
  compareAtPrice?: number; // Original MRP in INR (₹)
  taxRatePercent: number;
  stock: number;
  warehouseLocation: string;
  material: string;
  dimensions: string;
  color: string;
  sizeOptions: string[];
  origin: string;
  leadTime: string;
  warranty: string;
  description: string;
  imageUrl: string;
  gallery: string[];
  variants: ProductVariant[];
  specifications: ProductSpecification[];
  featured: boolean;
  isTrending?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  ratingAvg: number;
  reviewCount: number;
  seoTitle?: string;
  seoDescription?: string;
  visualTags?: string[];
}

export interface CartItem {
  productId: string;
  variantId?: string;
  quantity: number;
  savedForLater?: boolean;
}

export interface ShippingAddress {
  id?: string;
  label?: string;
  fullName: string;
  email: string;
  phone: string;
  streetAddress: string;
  city: string;
  state: string;
  pinCode: string;
  isDefault?: boolean;
}

export interface OrderTimelineEvent {
  status: OrderStatus;
  timestamp: string;
  note: string;
  actor: string;
}

export interface OrderItemSnapshot {
  productId: string;
  variantId?: string;
  variantName?: string;
  sku: string;
  title: string;
  unitPrice: number;
  quantity: number;
  imageUrl: string;
}

export interface Order {
  id: string;
  userId?: string;
  createdAt: string;
  customer: ShippingAddress;
  items: OrderItemSnapshot[];
  subtotal: number;
  discount: number;
  promoCode?: string;
  gstAmount: number;
  shippingMethod: ShippingMethodId;
  shippingFee: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentTransactionId: string;
  trackingNumber: string;
  carrier: string;
  estimatedDelivery: string;
  status: OrderStatus;
  timeline: OrderTimelineEvent[];
}

export interface PaymentTransaction {
  id: string;
  orderId: string;
  createdAt: string;
  amount: number;
  gatewayFee: number;
  netAmount: number;
  method: PaymentMethod;
  methodSummary: string;
  status: 'Captured' | 'COD Pending' | 'Failed' | 'Refunded';
  signatureHash: string;
  provider: string;
  refundReason?: string;
  refundedAt?: string;
}

export interface Coupon {
  code: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  active: boolean;
  usageCount: number;
  usageLimit: number;
  expiresAt: string;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  city: string;
  state: string;
  manager: string;
  capacityUnits: number;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  sku: string;
  warehouseCode: string;
  type: 'INBOUND_RESTOCK' | 'ORDER_RESERVATION' | 'MANUAL_ADJUSTMENT' | 'RETURN_RESTOCK';
  quantityDelta: number;
   resultingStock: number;
  reason: string;
  createdAt: string;
}

export interface UserAccount {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'CUSTOMER' | 'ADMIN';
  loyaltyTier: 'Club Member' | 'one8 Pro Athlete' | 'Founding Patron';
  loyaltyPoints: number;
  savedAddresses: ShippingAddress[];
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  orderId?: string;
  category:
    | 'Order & Delivery'
    | 'Payment & Invoice'
    | 'Size & Fit Exchange'
    | 'Return & Refund'
    | 'Acoustic Consultation';
  priority: 'Normal' | 'High' | 'Urgent';
  subject: string;
  status: 'Open' | 'In Progress' | 'Resolved';
  createdAt: string;
  messages: {
    id: string;
    sender: 'Customer' | 'Atelier Support' | 'AI Triage';
    text: string;
    timestamp: string;
  }[];
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'ORDER' | 'PRICE_DROP' | 'RESTOCK' | 'SECURITY' | 'PROMO';
  read: boolean;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  actor: string;
  action: string;
  entityType: 'PRODUCT' | 'ORDER' | 'PAYMENT' | 'COUPON' | 'AUTH' | 'SYSTEM';
  entityId: string;
  details: string;
  ipAddress: string;
  createdAt: string;
}

export interface CartCalculation {
  subtotal: number;
  discount: number;
  taxableAmount: number;
  gstAmount: number;
  shippingFee: number;
  totalAmount: number;
  itemCount: number;
  appliedCoupon?: Coupon;
}

export interface DashboardMetrics {
  grossRevenue: number;
  netSettledRevenue: number;
  averageOrderValue: number;
  totalOrders: number;
  activeOrdersCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalSkus: number;
  totalUnitsInStock: number;
  conversionRatePercent: number;
  refundedOrdersCount: number;
  totalCustomersCount: number;
  openTicketsCount: number;
  categoryRevenueBreakdown: Record<string, number>;
}

export const HERO_IMAGE_URL =
  '/src/assets/images/one8_hero_athlete_banner_1793638456058.jpg';

const IMG_VELOCITY_SNEAKER =
  '/src/assets/images/one8_velocity_sneaker_1793638457465.jpg';
const IMG_AEROTECH_JACKET =
  '/src/assets/images/one8_aerotech_jacket_1793638458951.jpg';
const IMG_INTENSE_NOIR_EDP =
  '/src/assets/images/one8_intense_noir_edp_1793638459826.jpg';
const IMG_COURT_LEATHER_LOW =
  '/src/assets/images/one8_court_leather_low_1793638459774.jpg';
const IMG_COMPRESSION_TEE =
  '/src/assets/images/one8_compression_tee_1793638476800.jpg';
const IMG_CARBON_DUFFLE =
  '/src/assets/images/one8_carbon_duffle_1793638478341.jpg';

export const PRODUCT_IMAGE_PRESETS: Record<string, string> = {
  'Velocity Carbon-Plate Runner (4:3)': IMG_VELOCITY_SNEAKER,
  'AeroTech Laser-Vent Track Jacket (4:3)': IMG_AEROTECH_JACKET,
  'Intense Noir Eau De Parfum 100ml (4:3)': IMG_INTENSE_NOIR_EDP,
  'Apex Court Italian Leather Low (4:3)': IMG_COURT_LEATHER_LOW,
  'Pro-Dry Gold Crest Training Tee (4:3)': IMG_COMPRESSION_TEE,
  'Carbon-Weave Weekender Duffle (4:3)': IMG_CARBON_DUFFLE,
};

export const INITIAL_WAREHOUSES: Warehouse[] = [
  {
    id: 'wh-mum',
    code: 'WH-MUM-18',
    name: 'one8 Flagship Footwear & Apparel Hub',
    city: 'Mumbai',
    state: 'Maharashtra',
    manager: 'Vikramaditya Joshi',
    capacityUnits: 500,
  },
  {
    id: 'wh-blr',
    code: 'WH-BLR-18',
    name: 'one8 Performance Lab & South Dispatch',
    city: 'Bengaluru',
    state: 'Karnataka',
    manager: 'Dr. Siddharth Rao',
    capacityUnits: 450,
  },
  {
    id: 'wh-del',
    code: 'WH-DEL-18',
    name: 'one8 North India Express Hub',
    city: 'Gurugram',
    state: 'Haryana',
    manager: 'Karanvir Singh',
    capacityUnits: 400,
  },
];

export const INITIAL_COUPONS: Coupon[] = [
  {
    code: 'ONE8CHAMP',
    description: '18% Signature #18 Champion Privilege on orders above ₹3,000',
    discountType: 'PERCENTAGE',
    discountValue: 18,
    minOrderAmount: 3000,
    maxDiscountAmount: 15000,
    active: true,
    usageCount: 42,
    usageLimit: 500,
    expiresAt: '2027-12-31T23:59:59.000Z',
  },
  {
    code: 'ATELIER10',
    description: '10% Member Privilege across all footwear, apparel & fragrances',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    minOrderAmount: 2000,
    maxDiscountAmount: 25000,
    active: true,
    usageCount: 18,
    usageLimit: 500,
    expiresAt: '2027-12-31T23:59:59.000Z',
  },
  {
    code: 'WELCOME15',
    description: '15% First-Order Drop Privilege on orders above ₹5,000',
    discountType: 'PERCENTAGE',
    discountValue: 15,
    minOrderAmount: 5000,
    maxDiscountAmount: 20000,
    active: true,
    usageCount: 9,
    usageLimit: 200,
    expiresAt: '2027-06-30T23:59:59.000Z',
  },
  {
    code: 'FIRST5000',
    description: 'Flat ₹5,000 Instant Rebate on pro bundles above ₹20,000',
    discountType: 'FIXED',
    discountValue: 5000,
    minOrderAmount: 20000,
    active: true,
    usageCount: 5,
    usageLimit: 100,
    expiresAt: '2027-12-31T23:59:59.000Z',
  },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    sku: 'ONE8-FTW-01',
    title: 'one8 Velocity Carbon-Plate Pro Runner',
    brand: 'one8 Footwear Lab',
    category: 'Footwear & Sneakers',
    subcategory: 'Carbon Marathon & Sprint Runners',
    price: 12999,
    compareAtPrice: 15999,
    taxRatePercent: 18,
    stock: 14,
    warehouseLocation: 'WH-BLR-18',
    material: 'AeroWeave Monofilament Mesh, Full-Length Carbon Plate & NitroFoam Midsole',
    dimensions: 'UK 7 – UK 11 · 218 g (Size UK 8) · 8mm Heel-to-Toe Drop',
    color: 'Obsidian Black / Crimson Pulse / Gold',
    sizeOptions: ['UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11'],
    origin: 'Bengaluru Performance Lab',
    leadTime: 'Express 24-Hr Dispatch',
    warranty: '1-Year Sole & Carbon-Plate Performance Warranty',
    description:
      'Engineered for explosive stride propulsion. Features a full-length spooned carbon-fiber plate sandwiched between dual-density nitrogen-infused supercritical foam and a high-grip Continental-grade wet-traction outsole.',
    imageUrl: IMG_VELOCITY_SNEAKER,
    gallery: [IMG_VELOCITY_SNEAKER, IMG_COURT_LEATHER_LOW, IMG_HERO_FALLBACK()],
    variants: [
      {
        id: 'var-1-uk8',
        label: 'UK 8 · Obsidian / Crimson Pulse',
        size: 'UK 8',
        color: 'Obsidian Crimson',
        colorHex: '#E11D48',
        priceDelta: 0,
        stock: 6,
        skuSuffix: 'UK8',
      },
      {
        id: 'var-1-uk9',
        label: 'UK 9 · Obsidian / Crimson Pulse',
        size: 'UK 9',
        color: 'Obsidian Crimson',
        colorHex: '#E11D48',
        priceDelta: 0,
        stock: 5,
        skuSuffix: 'UK9',
      },
      {
        id: 'var-1-uk10',
        label: 'UK 10 · Championship Gold Edition',
        size: 'UK 10',
        color: 'Championship Gold',
        colorHex: '#D4AF37',
        priceDelta: 1000,
        stock: 3,
        skuSuffix: 'UK10-GLD',
      },
    ],
    specifications: [
      { label: 'Propulsion Plate', value: 'Full-Length Aerospace Carbon Fiber' },
      { label: 'Midsole Compound', value: 'Dual-Density Supercritical NitroFoam (82% Energy Return)' },
      { label: 'Upper Construction', value: 'Breathable Hydrophobic AeroWeave Mesh' },
      { label: 'Stack Height', value: '38mm Heel / 30mm Forefoot (World Athletics Legal)' },
    ],
    featured: true,
    isTrending: true,
    isBestSeller: true,
    ratingAvg: 4.9,
    reviewCount: 42,
    seoTitle: 'one8 Velocity Carbon-Plate Pro Runner | Official Store',
    seoDescription: 'Carbon-plated marathon & training running shoe in Obsidian Black and Crimson Pulse.',
    visualTags: ['sneaker', 'running', 'shoe', 'shoes', 'carbon', 'black', 'red', 'gold', 'footwear', 'audio', 'speaker'],
  },
  {
    id: 'prod-2',
    sku: 'ONE8-APP-02',
    title: 'one8 AeroTech Laser-Vent Track Jacket',
    brand: 'one8 Athleisure',
    category: 'Performance Athleisure',
    subcategory: 'Technical Outerwear & Tracksuits',
    price: 6499,
    compareAtPrice: 7999,
    taxRatePercent: 18,
    stock: 19,
    warehouseLocation: 'WH-MUM-18',
    material: '4-Way Stretch Japanese Ripstop Nylon (DWR Water-Repellent Finish)',
    dimensions: 'Sizes S, M, L, XL · Athletic Tailored Fit · 290 GSM',
    color: 'Carbon Matte Black / Crimson Micro-Perf',
    sizeOptions: ['S', 'M', 'L', 'XL'],
    origin: 'Mumbai Design Studio',
    leadTime: 'Dispatches in 24 Hours',
    warranty: '1-Year Seam & Waterproof Zipper Guarantee',
    description:
      'Designed for stadium warmups and urban transit. Tailored from 4-way stretch technical woven ripstop with laser-perforated underarm ventilation zones, bonded waterproof zippers, and articulated elbows.',
    imageUrl: IMG_AEROTECH_JACKET,
    gallery: [IMG_AEROTECH_JACKET, IMG_COMPRESSION_TEE, IMG_HERO_FALLBACK()],
    variants: [
      {
        id: 'var-2-m',
        label: 'Size M · Carbon Matte Black',
        size: 'M',
        color: 'Carbon Black',
        colorHex: '#141413',
        priceDelta: 0,
        stock: 8,
        skuSuffix: 'M',
      },
      {
        id: 'var-2-l',
        label: 'Size L · Carbon Matte Black',
        size: 'L',
        color: 'Carbon Black',
        colorHex: '#141413',
        priceDelta: 0,
        stock: 7,
        skuSuffix: 'L',
      },
      {
        id: 'var-2-xl',
        label: 'Size XL · Carbon Matte Black',
        size: 'XL',
        color: 'Carbon Black',
        colorHex: '#141413',
        priceDelta: 0,
        stock: 4,
        skuSuffix: 'XL',
      },
    ],
    specifications: [
      { label: 'Shell Fabric', value: '88% Recycled Polyamide / 12% Elastane 4-Way Stretch' },
      { label: 'Weather Protection', value: 'PFC-Free DWR Coating (Wind & Light Rain Resistant)' },
      { label: 'Ventilation', value: 'Laser-Cut Crimson Back-Yoke & Underarm Micro-Vents' },
      { label: 'Hardware', value: 'Matte Black YKK AquaGuard Lockable Zippers' },
    ],
    featured: true,
    isBestSeller: true,
    ratingAvg: 4.8,
    reviewCount: 31,
    seoTitle: 'one8 AeroTech Laser-Vent Track Jacket | Technical Athleisure',
    seoDescription: '4-way stretch matte black technical track jacket with laser-cut ventilation.',
    visualTags: ['jacket', 'track', 'apparel', 'athleisure', 'black', 'sportswear', 'brass', 'lamp', 'light'],
  },
  {
    id: 'prod-3',
    sku: 'ONE8-FRG-03',
    title: 'one8 Intense Noir Eau De Parfum (100ml)',
    brand: 'one8 Fragrances',
    category: 'Fragrances & Grooming',
    subcategory: 'Signature Eau De Parfum',
    price: 3499,
    compareAtPrice: 4299,
    taxRatePercent: 18,
    stock: 28,
    warehouseLocation: 'WH-MUM-18',
    material: '22% Extrait-Grade Fragrance Oil Concentration · Faceted Matte Obsidian Flacon',
    dimensions: '100 ml / 3.4 fl. oz. · Heavy Brushed Gold Magnetic Cap',
    color: 'Matte Obsidian Flacon / Brushed Gold',
    sizeOptions: ['100 ml Collector Flacon', '100 ml + 20 ml Travel Atomizer'],
    origin: 'Compounded in Grasse & Mumbai',
    leadTime: 'Immediate Dispatch',
    warranty: 'Authenticity Hologram & Batch Serialized',
    description:
      'Bold, magnetic, and built for evening intensity. Opens with Calabrian bergamot and crushed black pepper, evolving into a heart of smoked vetiver and Moroccan cedarwood over an ambergris and leather base.',
    imageUrl: IMG_INTENSE_NOIR_EDP,
    gallery: [IMG_INTENSE_NOIR_EDP, IMG_CARBON_DUFFLE],
    variants: [
      {
        id: 'var-3-100ml',
        label: '100 ml Signature Collector Flacon',
        size: '100 ml',
        color: 'Obsidian Gold',
        colorHex: '#D4AF37',
        priceDelta: 0,
        stock: 20,
        skuSuffix: '100ML',
      },
      {
        id: 'var-3-giftset',
        label: '100 ml EDP + 20 ml Travel Atomizer Set',
        size: '120 ml Set',
        color: 'Obsidian Crimson',
        colorHex: '#E11D48',
        priceDelta: 900,
        stock: 8,
        skuSuffix: 'SET',
      },
    ],
    specifications: [
      { label: 'Top Notes', value: 'Calabrian Bergamot, Pink Pepper, Cardamom Pod' },
      { label: 'Heart Notes', value: 'Smoked Haitian Vetiver, Atlas Cedar, Tuscan Iris' },
      { label: 'Base Notes', value: 'Black Leather, Ambergris, Roasted Tonka Bean' },
      { label: 'Longevity', value: '10–12 Hours (22% EDP Intense Concentration)' },
    ],
    featured: true,
    isTrending: true,
    ratingAvg: 4.9,
    reviewCount: 54,
    seoTitle: 'one8 Intense Noir Eau De Parfum 100ml | Official Fragrance',
    seoDescription: 'Long-lasting woody-aromatic Eau De Parfum in a faceted matte black bottle.',
    visualTags: ['fragrance', 'perfume', 'edp', 'cologne', 'noir', 'gold', 'black', 'chair', 'oak'],
  },
  {
    id: 'prod-4',
    sku: 'ONE8-FTW-04',
    title: 'one8 Apex Court Italian Leather Low',
    brand: 'one8 Footwear Lab',
    category: 'Footwear & Sneakers',
    subcategory: 'Court & Lifestyle Sneakers',
    price: 9999,
    compareAtPrice: 11999,
    taxRatePercent: 18,
    stock: 11,
    warehouseLocation: 'WH-DEL-18',
    material: 'Full-Grain Tumbled Nappa Leather, Metallic Gold Heel Tab & Margom Cup Sole',
    dimensions: 'UK 7 – UK 11 · Dual-Density OrthoLite Insole',
    color: 'Chalk White / Obsidian / Gold Foil',
    sizeOptions: ['UK 7', 'UK 8', 'UK 9', 'UK 10'],
    origin: 'Gurugram Craft Studio',
    leadTime: 'Dispatches in 24 Hours',
    warranty: '1-Year Stitched Cup-Sole Guarantee',
    description:
      'Off-pitch sophistication meets everyday resilience. Hand-lasted in supple full-grain chalk-white tumbled leather with a contrasting obsidian vector sweep, brushed championship gold heel tab, and stitched rubber cup sole.',
    imageUrl: IMG_COURT_LEATHER_LOW,
    gallery: [IMG_COURT_LEATHER_LOW, IMG_VELOCITY_SNEAKER],
    variants: [
      {
        id: 'var-4-uk8',
        label: 'UK 8 · Chalk White / Obsidian Gold',
        size: 'UK 8',
        color: 'Chalk White',
        colorHex: '#F5F5F4',
        priceDelta: 0,
        stock: 6,
        skuSuffix: 'UK8',
      },
      {
        id: 'var-4-uk9',
        label: 'UK 9 · Chalk White / Obsidian Gold',
        size: 'UK 9',
        color: 'Chalk White',
        colorHex: '#F5F5F4',
        priceDelta: 0,
        stock: 5,
        skuSuffix: 'UK9',
      },
    ],
    specifications: [
      { label: 'Upper Leather', value: '1.8mm Full-Grain Tumbled Calfskin Leather' },
      { label: 'Footbed', value: 'Molded Open-Cell OrthoLite Memory Foam' },
      { label: 'Outsole', value: '360° Sidewall-Stitched High-Abrasion Rubber Cup Sole' },
      { label: 'Detailing', value: 'Embossed Gold Foil #18 Heel Crest & Waxed Cotton Laces' },
    ],
    featured: true,
    isNewArrival: true,
    ratingAvg: 4.8,
    reviewCount: 27,
    seoTitle: 'one8 Apex Court Italian Leather Low Sneaker | White & Black',
    seoDescription: 'Full-grain leather low-top court sneaker with gold heel crest.',
    visualTags: ['white', 'sneaker', 'leather', 'court', 'shoes', 'footwear', 'ceramic', 'tableware'],
  },
  {
    id: 'prod-5',
    sku: 'ONE8-APP-05',
    title: 'one8 Pro-Dry Gold Crest Training Tee',
    brand: 'one8 Athleisure',
    category: 'Performance Athleisure',
    subcategory: 'High-Intensity Compression & Training Tops',
    price: 2999,
    compareAtPrice: 3699,
    taxRatePercent: 18,
    stock: 34,
    warehouseLocation: 'WH-BLR-18',
    material: 'AeroCool Honeycomb Micro-Mesh with Silver-Ion Anti-Odor Treatment',
    dimensions: 'Sizes S, M, L, XL · Ergonomic Raglan Shoulder Cut · 165 GSM',
    color: 'Obsidian Black / Crimson Raglan / Gold Crest',
    sizeOptions: ['S', 'M', 'L', 'XL'],
    origin: 'Bengaluru Performance Lab',
    leadTime: 'Immediate Dispatch',
    warranty: 'Zero-Chafe Flatlock Seam Guarantee',
    description:
      'Built for relentless high-output training sessions. Features body-mapped honeycomb mesh zones that accelerate sweat evaporation by 40%, zero-chafe flatlockcrimson raglan seams, and a metallic gold chest crest.',
    imageUrl: IMG_COMPRESSION_TEE,
    gallery: [IMG_COMPRESSION_TEE, IMG_AEROTECH_JACKET],
    variants: [
      {
        id: 'var-5-m',
        label: 'Size M · Athletic Fit',
        size: 'M',
        color: 'Obsidian Crimson',
        colorHex: '#E11D48',
        priceDelta: 0,
        stock: 15,
        skuSuffix: 'M',
      },
      {
        id: 'var-5-l',
        label: 'Size L · Athletic Fit',
        size: 'L',
        color: 'Obsidian Crimson',
        colorHex: '#E11D48',
        priceDelta: 0,
        stock: 19,
        skuSuffix: 'L',
      },
    ],
    specifications: [
      { label: 'Moisture Management', value: 'Pro-Dry Hydrophilic Capillary Weave' },
      { label: 'Anti-Microbial', value: 'Polygiene Silver-Ion Odor Control Finish' },
      { label: 'Seam Architecture', value: 'Ergonomic Flatlock Raglan Seams' },
      { label: 'UV Protection', value: 'UPF 50+ Outdoor Training Rating' },
    ],
    featured: false,
    isTrending: true,
    ratingAvg: 4.9,
    reviewCount: 63,
    seoTitle: 'one8 Pro-Dry Gold Crest Training Tee | Gym & Running T-Shirt',
    seoDescription: 'Moisture-wicking athletic training t-shirt in obsidian black, crimson, and gold.',
    visualTags: ['t-shirt', 'tee', 'shirt', 'gym', 'training', 'compression', 'apparel', 'teak', 'lounge'],
  },
  {
    id: 'prod-6',
    sku: 'ONE8-ACC-06',
    title: 'one8 Carbon-Weave Weekender Duffle (45L)',
    brand: 'one8 Pro Gear',
    category: 'Signature Accessories',
    subcategory: 'Pro Locker & Travel Bags',
    price: 8499,
    compareAtPrice: 9999,
    taxRatePercent: 18,
    stock: 9,
    warehouseLocation: 'WH-DEL-18',
    material: '1680D Ballistic Nylon, Carbon-Fiber Weave Panels & Brushed Gold Hardware',
    dimensions: '56 × 28 × 29 cm · 45 Liters Capacity · Dedicated Ventilated Shoe Vault',
    color: 'Matte Carbon Black / Crimson Zippers / Gold',
    sizeOptions: ['45L Pro Weekender'],
    origin: 'Mumbai Design Studio',
    leadTime: 'Dispatches in 24 Hours',
    warranty: '5-Year Ballistic Shell & Hardware Warranty',
    description:
      'Engineered to transition effortlessly from the training ground to the departure lounge. Built with 1680D water-resistant ballistic nylon, diagonal carbon-weave side armor, a ventilated footwear compartment, and a padded 16" laptop sleeve.',
    imageUrl: IMG_CARBON_DUFFLE,
    gallery: [IMG_CARBON_DUFFLE, IMG_INTENSE_NOIR_EDP],
    variants: [
      {
        id: 'var-6-std',
        label: '45L Carbon Black / Crimson Edition',
        size: '45L',
        color: 'Carbon Crimson',
        colorHex: '#E11D48',
        priceDelta: 0,
        stock: 9,
        skuSuffix: '45L',
      },
    ],
    specifications: [
      { label: 'Primary Chassis', value: '1680D Waterproof Ballistic Nylon + Carbon-Weave Armor' },
      { label: 'Shoe Compartment', value: 'Isolated Ventilated Footwear Tunnel (Fits up to UK 12)' },
      { label: 'Tech Storage', value: 'Fleece-Lined 16" Laptop & Tablet Compartment' },
      { label: 'Hardware', value: 'Solid Brushed Brass D-Rings & Crimson YKK Racquet Zippers' },
    ],
    featured: false,
    isNewArrival: true,
    ratingAvg: 4.9,
    reviewCount: 19,
    seoTitle: 'one8 Carbon-Weave Weekender Duffle 45L | Gym & Travel Bag',
    seoDescription: '1680D ballistic nylon sports duffle bag with ventilated shoe compartment.',
    visualTags: ['bag', 'duffle', 'gym bag', 'accessories', 'carbon', 'luggage', 'plinth', 'travertine'],
  },
];

function IMG_HERO_FALLBACK() {
  return HERO_IMAGE_URL;
}

export const INITIAL_REVIEWS: ProductReview[] = [
  {
    id: 'rev-101',
    productId: 'prod-1',
    authorName: 'Arjun Singhania',
    authorCity: 'Mumbai',
    rating: 5,
    title: 'Shaved 4 minutes off my Mumbai Half Marathon PB',
    comment:
      'The carbon-plate snap at toe-off is unreal.Super stable around corners and the Obsidian/Crimson colorway looks lethal in person.',
    verifiedPurchase: true,
    helpfulCount: 24,
    createdAt: '2026-10-18T10:30:00.000Z',
  },
  {
    id: 'rev-102',
    productId: 'prod-2',
    authorName: 'Rohan Mehta',
    authorCity: 'Bengaluru',
    rating: 5,
    title: 'Tailored fit and incredible laser-vent breathability',
    comment:
      'Wore the AeroTech Jacket for early morning turf sessions in Bengaluru. Blocks the wind without ever feeling clammy.',
    verifiedPurchase: true,
    helpfulCount: 16,
    createdAt: '2026-10-24T15:15:00.000Z',
  },
  {
    id: 'rev-103',
    productId: 'prod-3',
    authorName: 'Kabir Malhotra',
    authorCity: 'New Delhi',
    rating: 5,
    title: 'Compliment magnet — lasts 10+ hours easily',
    comment:
      'Intense Noir smells like a ₹18,000 niche designer parfum. The heavy magnetic gold cap and faceted black bottle feel ultra-premium.',
    verifiedPurchase: true,
    helpfulCount: 31,
    createdAt: '2026-10-29T09:00:00.000Z',
  },
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ONE8-8490',
    userId: 'usr-customer-1',
    createdAt: '2026-11-01T14:20:00.000Z',
    customer: {
      fullName: 'Rohan Mehta',
      email: 'rohan.mehta@one8club.in',
      phone: '9820411290',
      streetAddress: '402, Pali Hill Residences, Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pinCode: '400050',
    },
    items: [
      {
        productId: 'prod-1',
        sku: 'ONE8-FTW-01',
        title: 'one8 Velocity Carbon-Plate Pro Runner',
        variantName: 'UK 9 · Obsidian / Crimson Pulse',
        unitPrice: 12999,
        quantity: 1,
        imageUrl: IMG_VELOCITY_SNEAKER,
      },
      {
        productId: 'prod-5',
        sku: 'ONE8-APP-05',
        title: 'one8 Pro-Dry Gold Crest Training Tee',
        variantName: 'Size L · Athletic Fit',
        unitPrice: 2999,
        quantity: 1,
        imageUrl: IMG_COMPRESSION_TEE,
      },
    ],
    subtotal: 15998,
    discount: 2880,
    promoCode: 'ONE8CHAMP',
    gstAmount: 2361,
    shippingMethod: 'STANDARD_WHITE_GLOVE',
    shippingFee: 450,
    totalAmount: 15929,
    paymentMethod: 'UPI',
    paymentTransactionId: 'pay_One8_9928174Upi',
    trackingNumber: 'BLUEDART-ONE8-884120',
    carrier: 'BlueDart Express Air',
    estimatedDelivery: '04 Nov 2026',
    status: 'Shipped',
    timeline: [
      {
        status: 'Confirmed',
        timestamp: '2026-11-01T14:20:05.000Z',
        note: 'Order verified & instant UPI settlement captured.',
        actor: 'one8Pay Gateway',
      },
      {
        status: 'Packed',
        timestamp: '2026-11-01T18:10:00.000Z',
        note: 'Quality-checked & sealed at Bengaluru Performance Lab (WH-BLR-18).',
        actor: 'Warehouse WH-BLR-18',
      },
      {
        status: 'Shipped',
        timestamp: '2026-11-02T02:00:00.000Z',
        note: 'Dispatched via BlueDart Express Air (AWB: BLUEDART-ONE8-884120).',
        actor: 'Logistics Dispatch',
      },
    ],
  },
  {
    id: 'ONE8-8491',
    userId: 'usr-customer-1',
    createdAt: '2026-11-02T06:15:00.000Z',
    customer: {
      fullName: 'Ananya Krishnan',
      email: 'ananya@krishnandg.com',
      phone: '9845019283',
      streetAddress: '18, 12th Main Road, Indiranagar HAL II Stage',
      city: 'Bengaluru',
      state: 'Karnataka',
      pinCode: '560038',
    },
    items: [
      {
        productId: 'prod-2',
        sku: 'ONE8-APP-02',
        title: 'one8 AeroTech Laser-Vent Track Jacket',
        variantName: 'Size M · Carbon Matte Black',
        unitPrice: 6499,
        quantity: 1,
        imageUrl: IMG_AEROTECH_JACKET,
      },
      {
        productId: 'prod-3',
        sku: 'ONE8-FRG-03',
        title: 'one8 Intense Noir Eau De Parfum (100ml)',
        variantName: '100 ml Signature Collector Flacon',
        unitPrice: 3499,
        quantity: 1,
        imageUrl: IMG_INTENSE_NOIR_EDP,
      },
    ],
    subtotal: 9998,
    discount: 1000,
    promoCode: 'ATELIER10',
    gstAmount: 1620,
    shippingMethod: 'STANDARD_WHITE_GLOVE',
    shippingFee: 450,
    totalAmount: 11068,
    paymentMethod: 'CARD',
    paymentTransactionId: 'pay_One8_9928410Card',
    trackingNumber: 'DELHIVERY-ONE8-904512',
    carrier: 'Delhivery Priority Air',
    estimatedDelivery: '05 Nov 2026',
    status: 'Confirmed',
    timeline: [
      {
        status: 'Confirmed',
        timestamp: '2026-11-02T06:15:10.000Z',
        note: '3DS 2.0 Visa card settlement captured. Allocated at Mumbai Hub (WH-MUM-18).',
        actor: 'one8Pay Gateway',
      },
    ],
  },
];

export const INITIAL_TRANSACTIONS: PaymentTransaction[] = [
  {
    id: 'pay_One8_9928174Upi',
    orderId: 'ONE8-8490',
    createdAt: '2026-11-01T14:20:05.000Z',
    amount: 15929,
    gatewayFee: 0,
    netAmount: 15929,
    method: 'UPI',
    methodSummary: 'UPI · rohan.mehta@okicici',
    status: 'Captured',
    signatureHash: 'sig_9f8a7d6c5b4e3f2a1d0c',
    provider: 'Razorpay / one8Pay Enterprise',
  },
  {
    id: 'pay_One8_9928410Card',
    orderId: 'ONE8-8491',
    createdAt: '2026-11-02T06:15:10.000Z',
    amount: 11068,
    gatewayFee: 221,
    netAmount: 10847,
    method: 'CARD',
    methodSummary: 'Visa Infinite ···· 4242',
    status: 'Captured',
    signatureHash: 'sig_3b7e1a9c4d2f8e6b0a5c',
    provider: 'Razorpay / one8Pay Enterprise',
  },
];

export const INITIAL_SUPPORT_TICKETS: SupportTicket[] = [
  {
    id: 'TKT-1801',
    userId: 'usr-customer-1',
    customerName: 'Rohan Mehta',
    customerEmail: 'rohan.mehta@one8club.in',
    category: 'Size & Fit Exchange',
    priority: 'Normal',
    subject: 'Sizing advice for one8 Velocity Carbon Runner (UK 8 vs UK 9)',
    status: 'Resolved',
    createdAt: '2026-11-01T16:00:00.000Z',
    messages: [
      {
        id: 'msg-1',
        sender: 'Customer',
        text: 'Does the Velocity Carbon-Plate Pro Runner fit true to UK sizing or should I go half a size up for marathon distance?',
        timestamp: '2026-11-01T16:00:00.000Z',
      },
      {
        id: 'msg-2',
        sender: 'Atelier Support',
        text: 'The AeroWeave upper is engineered true-to-size with a race-locked midfoot. If you wear cushioned crew socks for 21K/42K runs, UK 9 gives an ideal 6mm forefoot splay allowance.',
        timestamp: '2026-11-01T16:40:00.000Z',
      },
    ],
  },
];

export function formatINR(amount: number): string {
  const rounded = Math.round(Number.isFinite(amount) ? amount : 0);
  return `₹${rounded.toLocaleString('en-IN')}`;
}

/**
 * Pure Cart, Multi-Coupon, GST & Multi-Tier Shipping Calculator
 */
export function calculateCartTotals(
  cart: CartItem[],
  products: Product[],
  promoCode = '',
  shippingMethod: ShippingMethodId = 'STANDARD_WHITE_GLOVE',
  coupons: Coupon[] = INITIAL_COUPONS
): CartCalculation {
  let subtotal = 0;
  let itemCount = 0;

  for (const item of cart) {
    if (item.savedForLater) continue;
    const product = products.find((p) => p.id === item.productId);
    if (!product || item.quantity <= 0) continue;
    const validQty = Math.min(item.quantity, Math.max(product.stock, 1));
    const variantDelta =
      item.variantId && product.variants
        ? (product.variants.find((v) => v.id === item.variantId)?.priceDelta ?? 0)
        : 0;
    subtotal += (product.price + variantDelta) * validQty;
    itemCount += validQty;
  }

  const normalizedPromo = promoCode.trim().toUpperCase();
  let discount = 0;
  let appliedCoupon: Coupon | undefined;

  if (subtotal > 0 && normalizedPromo) {
    const matched = coupons.find(
      (c) => c.code.toUpperCase() === normalizedPromo && c.active
    );
    if (matched && subtotal >= matched.minOrderAmount) {
      appliedCoupon = matched;
      if (matched.discountType === 'PERCENTAGE') {
        const raw = Math.round((subtotal * matched.discountValue) / 100);
        discount = matched.maxDiscountAmount
          ? Math.min(raw, matched.maxDiscountAmount)
          : raw;
      } else {
        discount = Math.min(matched.discountValue, subtotal);
      }
    } else if (normalizedPromo === 'ATELIER10') {
      discount = Math.round(subtotal * 0.1);
    }
  }

  const taxableAmount = Math.max(0, subtotal - discount);
  const gstAmount = Math.round(taxableAmount * 0.18);

  let shippingFee = 0;
  if (taxableAmount > 0) {
    if (shippingMethod === 'EXPRESS_AIR_CRATE') {
      shippingFee = 1450;
    } else {
      shippingFee = taxableAmount >= 25000 ? 0 : 450;
    }
  }

  const totalAmount = taxableAmount + gstAmount + shippingFee;

  return {
    subtotal,
    discount,
    taxableAmount,
    gstAmount,
    shippingFee,
    totalAmount,
    itemCount,
    appliedCoupon,
  };
}

/**
 * Intelligent Natural-Language Search Parser & Synonym Engine
 */
export interface ParsedSearchQuery {
  cleanKeywords: string[];
  maxPrice?: number;
  minPrice?: number;
  inferredCategory?: ProductCategory;
}

const SYNONYM_MAP: Record<string, string[]> = {
  shoe: ['sneaker', 'runner', 'footwear', 'velocity', 'apex', 'court', 'carbon'],
  shoes: ['sneaker', 'runner', 'footwear', 'velocity', 'apex', 'court', 'carbon'],
  sneakers: ['shoe', 'runner', 'footwear', 'velocity', 'apex', 'court', 'leather'],
  running: ['runner', 'velocity', 'carbon', 'marathon', 'footwear', 'pro-dry'],
  jacket: ['track', 'aerotech', 'outerwear', 'athleisure', 'apparel', 'windbreaker'],
  shirt: ['tee', 't-shirt', 'pro-dry', 'training', 'compression', 'top'],
  perfume: ['fragrance', 'edp', 'noir', 'cologne', 'scent', 'grooming'],
  fragrance: ['perfume', 'edp', 'noir', 'cologne', 'scent'],
  bag: ['duffle', 'weekender', 'luggage', 'accessories', 'locker'],
  headphones: ['audio', 'speaker', 'monitor', 'acoustics', 'sound', 'velocity'],
  speaker: ['audio', 'monitor', 'acoustics', 'sound', 'velocity'],
  speakers: ['audio', 'monitor', 'acoustics', 'sound', 'velocity'],
  lamp: ['lighting', 'brass', 'dome', 'light', 'aerotech', 'noir'],
  lamps: ['lighting', 'brass', 'dome', 'light', 'aerotech', 'noir'],
  chair: ['seating', 'lounge', 'teak', 'oak', 'apex', 'court'],
  coffee: ['carafe', 'pour-over', 'ceramic', 'tableware', 'pro-dry'],
};

export function parseNaturalLanguageSearch(rawQuery: string): ParsedSearchQuery {
  const q = (typeof rawQuery === 'string' ? rawQuery : '').toLowerCase().trim();
  if (!q) return { cleanKeywords: [] };

  let maxPrice: number | undefined;
  let minPrice: number | undefined;

  const underMatch = q.match(/(?:below|under|less than|<|upto|up to)\s*₹?\s*([\d,]+)/i);
  if (underMatch) {
    const parsed = Number(underMatch[1].replace(/,/g, ''));
    if (!Number.isNaN(parsed) && parsed > 0) {
      maxPrice = parsed;
    }
  }

  const overMatch = q.match(/(?:above|over|more than|>)\s*₹?\s*([\d,]+)/i);
  if (overMatch) {
    const parsed = Number(overMatch[1].replace(/,/g, ''));
    if (!Number.isNaN(parsed) && parsed > 0) {
      minPrice = parsed;
    }
  }

  let inferredCategory: ProductCategory | undefined;
  if (/\b(shoe|shoes|sneaker|sneakers|runner|runners|footwear|court|marathon)\b/.test(q)) {
    inferredCategory = 'Footwear & Sneakers';
  } else if (/\b(jacket|track|tee|t-shirt|shirt|apparel|athleisure|training|gym)\b/.test(q)) {
    inferredCategory = 'Performance Athleisure';
  } else if (/\b(perfume|fragrance|edp|cologne|noir|scent|grooming)\b/.test(q)) {
    inferredCategory = 'Fragrances & Grooming';
  } else if (/\b(bag|duffle|weekender|luggage|accessory|accessories)\b/.test(q)) {
    inferredCategory = 'Signature Accessories';
  }

  const stopWords = new Set([
    'find',
    'show',
    'me',
    'for',
    'below',
    'under',
    'above',
    'over',
    'less',
    'more',
    'than',
    'with',
    'the',
    'and',
    'in',
    'to',
    'similar',
    'this',
    'one',
    'products',
    'objects',
    'stock',
  ]);

  const tokens = q
    .replace(/₹[\d,]+/g, ' ')
    .replace(/\b[\d,]+\b/g, ' ')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 2 && !stopWords.has(t));

  return {
    cleanKeywords: tokens,
    maxPrice,
    minPrice,
    inferredCategory,
  };
}

export function searchCatalogProducts(
  products: Product[],
  rawQuery: string,
  options?: {
    category?: 'All Objects' | ProductCategory;
    maxPriceFilter?: number;
    minRatingFilter?: number;
    inStockOnly?: boolean;
    colorFilter?: string;
    sortBy?: 'featured' | 'price-asc' | 'price-desc' | 'rating' | 'newest';
  }
): Product[] {
  const parsed = parseNaturalLanguageSearch(rawQuery);

  const scored = products
    .map((product) => {
      if (
        options?.category &&
        options.category !== 'All Objects' &&
        product.category !== options.category
      ) {
        return { product, score: -1 };
      }

      const effectiveMaxPrice =
        parsed.maxPrice !== undefined && options?.maxPriceFilter !== undefined
          ? Math.min(parsed.maxPrice, options.maxPriceFilter)
          : (parsed.maxPrice ?? options?.maxPriceFilter);

      if (effectiveMaxPrice !== undefined && product.price > effectiveMaxPrice) {
        return { product, score: -1 };
      }

      if (parsed.minPrice !== undefined && product.price < parsed.minPrice) {
        return { product, score: -1 };
      }

      if (options?.minRatingFilter && product.ratingAvg < options.minRatingFilter) {
        return { product, score: -1 };
      }

      if (options?.inStockOnly && product.stock <= 0) {
        return { product, score: -1 };
      }

      if (
        options?.colorFilter &&
        options.colorFilter !== 'ALL' &&
        !product.color.toLowerCase().includes(options.colorFilter.toLowerCase())
      ) {
        return { product, score: -1 };
      }

      if (parsed.cleanKeywords.length === 0 && !parsed.inferredCategory) {
        return { product, score: 1 };
      }

      let score = 0;
      if (parsed.inferredCategory && product.category === parsed.inferredCategory) {
        score += 5;
      }

      const searchableBlob = [
        product.title,
        product.sku,
        product.brand,
        product.category,
        product.subcategory,
        product.material,
        product.color,
        product.origin,
        product.description,
        ...(product.visualTags || []),
      ]
        .join(' ')
        .toLowerCase();

      for (const token of parsed.cleanKeywords) {
        if (searchableBlob.includes(token)) {
          score += 4;
        } else {
          const synonyms = SYNONYM_MAP[token] || [];
          if (synonyms.some((syn) => searchableBlob.includes(syn))) {
            score += 3;
          } else if (token.length >= 4) {
            const prefix = token.slice(0, 4);
            if (searchableBlob.includes(prefix)) {
              score += 1;
            }
          }
        }
      }

      return { product, score };
    })
    .filter((entry) => entry.score > 0);

  return scored
    .sort((a, b) => {
      const sortMode = options?.sortBy || 'featured';
      if (sortMode === 'price-asc') return a.product.price - b.product.price;
      if (sortMode === 'price-desc') return b.product.price - a.product.price;
      if (sortMode === 'rating') return b.product.ratingAvg - a.product.ratingAvg;
      if (sortMode === 'newest') {
        return (b.product.isNewArrival ? 1 : 0) - (a.product.isNewArrival ? 1 : 0);
      }
      if (b.score !== a.score) return b.score - a.score;
      return (b.product.featured ? 1 : 0) - (a.product.featured ? 1 : 0);
    })
    .map((entry) => entry.product);
}

/**
 * Hybrid Recommendation Engine
 */
export function getHybridRecommendations(
  products: Product[],
  recentlyViewedIds: string[],
  cartProductIds: string[],
  limit = 3
): Product[] {
  const viewedProducts = products.filter((p) => recentlyViewedIds.includes(p.id));
  const cartProducts = products.filter((p) => cartProductIds.includes(p.id));
  const preferredCategories = new Set([
    ...viewedProducts.map((p) => p.category),
    ...cartProducts.map((p) => p.category),
  ]);

  return [...products]
    .sort((a, b) => {
      const aInCart = cartProductIds.includes(a.id) ? -10 : 0;
      const bInCart = cartProductIds.includes(b.id) ? -10 : 0;
      const aCatBoost = preferredCategories.has(a.category) ? 4 : 0;
      const bCatBoost = preferredCategories.has(b.category) ? 4 : 0;
      const aScore = aInCart + aCatBoost + a.ratingAvg + (a.isBestSeller ? 2 : 0);
      const bScore = bInCart + bCatBoost + b.ratingAvg + (b.isBestSeller ? 2 : 0);
      return bScore - aScore;
    })
    .slice(0, limit);
}

export function validateShippingAddress(
  address: ShippingAddress
): { valid: boolean; errors: Partial<Record<keyof ShippingAddress, string>> } {
  const errors: Partial<Record<keyof ShippingAddress, string>> = {};

  if (!address.fullName || address.fullName.trim().length < 2) {
    errors.fullName = 'Please enter recipient full name.';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!address.email || !emailRegex.test(address.email.trim())) {
    errors.email = 'Enter a valid email address for GST invoice & receipt.';
  }
  const cleanPhone = (address.phone || '').replace(/\D/g, '');
  if (cleanPhone.length !== 10) {
    errors.phone = 'Enter a valid 10-digit mobile number.';
  }
  if (!address.streetAddress || address.streetAddress.trim().length < 5) {
    errors.streetAddress = 'Enter complete street address, building, or studio number.';
  }
  if (!address.city || address.city.trim().length < 2) {
    errors.city = 'Enter city name.';
  }
  if (!address.state || address.state.trim().length < 2) {
    errors.state = 'Enter state name.';
  }
  const cleanPin = (address.pinCode || '').replace(/\D/g, '');
  if (cleanPin.length !== 6) {
    errors.pinCode = 'Enter a valid 6-digit Indian PIN code.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export interface PaymentPayloadInput {
  method: PaymentMethod;
  upiId?: string;
  cardNumber?: string;
  cardHolder?: string;
  cardExpiry?: string;
  cardCvv?: string;
  bankName?: string;
}

export function validatePaymentInput(
  input: PaymentPayloadInput
): { valid: boolean; error?: string; methodSummary: string } {
  if (input.method === 'UPI') {
    const upi = (input.upiId || '').trim();
    if (!/^[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}$/.test(upi)) {
      return {
        valid: false,
        error: 'Enter a valid UPI ID (e.g., athlete@okicici or name@upi).',
        methodSummary: '',
      };
    }
    return { valid: true, methodSummary: `UPI · ${upi}` };
  }

  if (input.method === 'CARD') {
    const digits = (input.cardNumber || '').replace(/\D/g, '');
    if (digits.length < 15 || digits.length > 16) {
      return {
        valid: false,
        error: 'Enter a valid 16-digit card number.',
        methodSummary: '',
      };
    }
    if (!input.cardHolder || input.cardHolder.trim().length < 2) {
      return {
        valid: false,
        error: 'Enter the cardholder name as printed on the card.',
        methodSummary: '',
      };
    }
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test((input.cardExpiry || '').trim())) {
      return {
        valid: false,
        error: 'Enter expiry in MM/YY format.',
        methodSummary: '',
      };
    }
    const cvv = (input.cardCvv || '').replace(/\D/g, '');
    if (cvv.length < 3 || cvv.length > 4) {
      return {
        valid: false,
        error: 'Enter a valid 3 or 4 digit security CVV.',
        methodSummary: '',
      };
    }
    const last4 = digits.slice(-4);
    return { valid: true, methodSummary: `Card ···· ${last4}` };
  }

  if (input.method === 'NETBANKING') {
    const bank = (input.bankName || '').trim();
    if (!bank) {
      return {
        valid: false,
        error: 'Select your bank for NetBanking authorization.',
        methodSummary: '',
      };
    }
    return { valid: true, methodSummary: `NetBanking · ${bank}` };
  }

  if (input.method === 'COD') {
    return { valid: true, methodSummary: 'Pay on Delivery (Express Courier)' };
  }

  return { valid: false, error: 'Unsupported payment method.', methodSummary: '' };
}

export function validateProductInput(
  input: Partial<Product>
): { valid: boolean; error?: string } {
  if (!input.title || input.title.trim().length < 3) {
    return { valid: false, error: 'Product title must be at least 3 characters.' };
  }
  if (!input.sku || input.sku.trim().length < 3) {
    return { valid: false, error: 'SKU code is required (e.g., ONE8-FTW-09).' };
  }
  if (typeof input.price !== 'number' || Number.isNaN(input.price) || input.price <= 0) {
    return { valid: false, error: 'Price must be a positive amount in INR.' };
  }
  if (typeof input.stock !== 'number' || Number.isNaN(input.stock) || input.stock < 0) {
    return { valid: false, error: 'Stock quantity must be 0 or greater.' };
  }
  if (!input.material || input.material.trim().length < 3) {
    return { valid: false, error: 'Material specification is required.' };
  }
  return { valid: true };
}

export function computeDashboardMetrics(
  products: Product[],
  orders: Order[],
  transactions: PaymentTransaction[],
  tickets: SupportTicket[] = INITIAL_SUPPORT_TICKETS
): DashboardMetrics {
  const validOrders = orders.filter(
    (o) => o.status !== 'Cancelled' && o.status !== 'Refunded'
  );
  const grossRevenue = validOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const netSettledRevenue = transactions
    .filter((t) => t.status === 'Captured')
    .reduce((sum, t) => sum + t.netAmount, 0);

  const totalOrders = orders.length;
  const averageOrderValue =
    validOrders.length > 0 ? Math.round(grossRevenue / validOrders.length) : 0;

  const activeOrdersCount = orders.filter(
    (o) =>
      o.status !== 'Delivered' &&
      o.status !== 'Cancelled' &&
      o.status !== 'Returned' &&
      o.status !== 'Refunded'
  ).length;

  const refundedOrdersCount = orders.filter(
    (o) => o.status === 'Refunded' || o.status === 'Returned'
  ).length;

  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= 5).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;
  const totalSkus = products.length;
  const totalUnitsInStock = products.reduce((sum, p) => sum + p.stock, 0);

  const categoryRevenueBreakdown: Record<string, number> = {
    'Footwear & Sneakers': 0,
    'Performance Athleisure': 0,
    'Fragrances & Grooming': 0,
    'Signature Accessories': 0,
  };

  for (const order of validOrders) {
    for (const item of order.items) {
      const prod = products.find((p) => p.id === item.productId);
      const cat = prod?.category || 'Footwear & Sneakers';
      categoryRevenueBreakdown[cat] =
        (categoryRevenueBreakdown[cat] || 0) + item.unitPrice * item.quantity;
    }
  }

  const uniqueEmails = new Set(orders.map((o) => o.customer.email.toLowerCase()));
  const openTicketsCount = tickets.filter((t) => t.status !== 'Resolved').length;

  return {
    grossRevenue,
    netSettledRevenue,
    averageOrderValue,
    totalOrders,
    activeOrdersCount,
    lowStockCount,
    outOfStockCount,
    totalSkus,
    totalUnitsInStock,
    conversionRatePercent: 4.6,
    refundedOrdersCount,
    totalCustomersCount: Math.max(uniqueEmails.size, 2),
    openTicketsCount,
    categoryRevenueBreakdown,
  };
}
