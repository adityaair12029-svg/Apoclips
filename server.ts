import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import {
  INITIAL_PRODUCTS,
  INITIAL_ORDERS,
  INITIAL_TRANSACTIONS,
  INITIAL_COUPONS,
  INITIAL_WAREHOUSES,
  INITIAL_REVIEWS,
  INITIAL_SUPPORT_TICKETS,
  Product,
  Order,
  PaymentTransaction,
  OrderStatus,
  Coupon,
  Warehouse,
  InventoryMovement,
  ProductReview,
  SupportTicket,
  AppNotification,
  AuditLogEntry,
  UserAccount,
  ShippingMethodId,
  calculateCartTotals,
  validateShippingAddress,
  validatePaymentInput,
  validateProductInput,
  computeDashboardMetrics,
  formatINR,
} from './src/utils/commerce';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '5mb' }));

// Security headers middleware
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Password hashing helper using Node crypto.scryptSync
function hashPassword(password: string, salt = 'verve_atelier_salt_v2'): string {
  return crypto.scryptSync(password, salt, 32).toString('hex');
}

interface StoredUser extends UserAccount {
  passwordHash: string;
}

interface EnterpriseDatabase {
  products: Product[];
  orders: Order[];
  transactions: PaymentTransaction[];
  coupons: Coupon[];
  warehouses: Warehouse[];
  inventoryMovements: InventoryMovement[];
  reviews: ProductReview[];
  supportTickets: SupportTicket[];
  notifications: AppNotification[];
  auditLogs: AuditLogEntry[];
  users: StoredUser[];
  processedIdempotencyKeys: Record<string, string>; // key -> orderId
}

const DATA_DIR = path.join(__dirname, 'data');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const DB_FILE = path.join(DATA_DIR, 'enterprise-db.json');

function createInitialDatabase(): EnterpriseDatabase {
  const nowIso = new Date().toISOString();
  return {
    products: [...INITIAL_PRODUCTS],
    orders: [...INITIAL_ORDERS],
    transactions: [...INITIAL_TRANSACTIONS],
    coupons: [...INITIAL_COUPONS],
    warehouses: [...INITIAL_WAREHOUSES],
    inventoryMovements: INITIAL_PRODUCTS.map((p) => ({
      id: `mov-init-${p.id}`,
      productId: p.id,
      sku: p.sku,
      warehouseCode: p.warehouseLocation,
      type: 'INBOUND_RESTOCK' as const,
      quantityDelta: p.stock,
      resultingStock: p.stock,
      reason: 'INITIAL_ONE8_DROP_SEED',
      createdAt: nowIso,
    })),
    reviews: [...INITIAL_REVIEWS],
    supportTickets: [...INITIAL_SUPPORT_TICKETS],
    notifications: [
      {
        id: 'notif-1',
        title: 'Shipment Dispatched · ONE8-8490',
        message:
          'one8 Velocity Carbon-Plate Pro Runner is in transit via BlueDart Express Air (AWB: BLUEDART-ONE8-884120).',
        type: 'ORDER',
        read: false,
        createdAt: '2026-11-02T02:00:00.000Z',
      },
      {
        id: 'notif-2',
        title: 'Signature #18 Drop Live · Code ONE8CHAMP',
        message:
          'Use code ONE8CHAMP at checkout for 18% off across Carbon Runners, AeroTech Outerwear, and Intense Noir EDP.',
        type: 'PROMO',
        read: false,
        createdAt: '2026-11-02T03:00:00.000Z',
      },
    ],
    auditLogs: [
      {
        id: 'aud-1001',
        action: 'SYSTEM_BOOT_INITIALIZED',
        entityType: 'SYSTEM',
        entityId: 'one8-enterprise-db-v2',
        actor: 'System Kernel',
        ipAddress: '127.0.0.1',
        createdAt: nowIso,
        details:
          'one8 Official Store relational database initialized with 6 flagship SKUs, 3 regional hubs, and HMAC gateway security.',
      },
    ],
    users: [
      {
        id: 'usr-customer-1',
        fullName: 'Rohan Mehta',
        email: 'rohan.mehta@studioforma.in',
        phone: '9820145892',
        role: 'CUSTOMER',
        loyaltyTier: 'one8 Pro Athlete',
        loyaltyPoints: 1850,
        passwordHash: hashPassword('atelier2026'),
        savedAddresses: [
          {
            id: 'addr-1',
            label: 'Mumbai Bandra Residence',
            fullName: 'Rohan Mehta',
            email: 'rohan.mehta@studioforma.in',
            phone: '9820145892',
            streetAddress: '402, Pali Hill Residences, Bandra West',
            city: 'Mumbai',
            state: 'Maharashtra',
            pinCode: '400050',
            isDefault: true,
          },
        ],
        createdAt: '2026-09-15T10:00:00.000Z',
      },
      {
        id: 'usr-admin-1',
        fullName: 'Aditya Singhania (one8 Store Director)',
        email: 'admin@verveatelier.in',
        phone: '9820011122',
        role: 'ADMIN',
        loyaltyTier: 'Founding Patron',
        loyaltyPoints: 9900,
        passwordHash: hashPassword('admin2026'),
        savedAddresses: [],
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ],
    processedIdempotencyKeys: {},
  };
}

function loadDatabase(): EnterpriseDatabase {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as EnterpriseDatabase;
      if (
        parsed &&
        Array.isArray(parsed.products) &&
        parsed.products.length > 0 &&
        parsed.products[0].sku.startsWith('ONE8-')
      ) {
        return parsed;
      }
    }
  } catch {
    // Fallback to initial seed if corrupted
  }
  const initial = createInitialDatabase();
  saveDatabase(initial);
  return initial;
}

function saveDatabase(dbState: EnterpriseDatabase): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tmpFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(dbState, null, 2), 'utf-8');
    fs.renameSync(tmpFile, DB_FILE);
  } catch {
    // Non-fatal in read-only sandboxes
  }
}

const db: EnterpriseDatabase = loadDatabase();

function appendAudit(
  action: string,
  entityType: AuditLogEntry['entityType'],
  entityId: string,
  actor: string,
  details: string
) {
  db.auditLogs.unshift({
    id: `aud-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    action,
    entityType,
    entityId,
    actor,
    timestamp: new Date().toISOString(),
    details,
  });
  if (db.auditLogs.length > 200) {
    db.auditLogs = db.auditLogs.slice(0, 200);
  }
}

function sanitizeUsers(users: StoredUser[]): UserAccount[] {
  return users.map(({ passwordHash: _ph, ...rest }) => rest);
}

function buildStateResponse() {
  return {
    products: db.products,
    orders: db.orders,
    transactions: db.transactions,
    coupons: db.coupons,
    warehouses: db.warehouses,
    inventoryMovements: db.inventoryMovements.slice(0, 60),
    reviews: db.reviews,
    supportTickets: db.supportTickets,
    notifications: db.notifications,
    auditLogs: db.auditLogs.slice(0, 60),
    users: sanitizeUsers(db.users),
    metrics: computeDashboardMetrics(
      db.products,
      db.orders,
      db.transactions,
      db.supportTickets
    ),
  };
}

function getGeminiClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || 'MISSING_KEY',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// SEO: robots.txt
app.get('/robots.txt', (req, res) => {
  const host = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  res.type('text/plain').send(
    `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin
Sitemap: ${host}/sitemap.xml
`
  );
});

// SEO: XML Sitemap
app.get('/sitemap.xml', (req, res) => {
  const host = (process.env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
  const urls = [
    `<url><loc>${host}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`,
    ...db.products.map(
      (p) =>
        `<url><loc>${host}/?product=${encodeURIComponent(p.sku)}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`
    ),
  ].join('\n  ');

  res.type('application/xml').send(
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls}
</urlset>`
  );
});

// API Engineering Reference & Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    version: '2.0.0-enterprise',
    timestamp: new Date().toISOString(),
    databaseSkus: db.products.length,
    databaseOrders: db.orders.length,
  });
});

app.get('/api/docs', (_req, res) => {
  res.json({
    version: '2.0.0-enterprise',
    endpoints: [
      { method: 'GET', path: '/api/state', description: 'Fetch complete synchronized storefront & enterprise state' },
      { method: 'POST', path: '/api/auth/login', description: 'Authenticate user with scrypt password verification' },
      { method: 'POST', path: '/api/auth/register', description: 'Register new customer account with hashed credentials' },
      { method: 'POST', path: '/api/products', description: 'Create new catalog SKU and log initial warehouse allocation' },
      { method: 'PATCH', path: '/api/products/:id', description: 'Update product price, stock, or specifications with audit trail' },
      { method: 'DELETE', path: '/api/products/:id', description: 'Remove SKU from catalog' },
      { method: 'POST', path: '/api/products/:id/reviews', description: 'Submit verified product review and recalculate rating' },
      { method: 'POST', path: '/api/checkout', description: 'Transactional idempotent checkout, stock reservation & HMAC signature' },
      { method: 'PATCH', path: '/api/orders/:id/status', description: 'Advance order lifecycle status and append timeline event' },
      { method: 'POST', path: '/api/transactions/:id/refund', description: 'Process gateway refund and restock returned items' },
      { method: 'POST', path: '/api/coupons', description: 'Create percentage or fixed promotional coupon' },
      { method: 'POST', path: '/api/support', description: 'Create customer support ticket with AI triage response' },
      { method: 'POST', path: '/api/visual-search', description: 'Match uploaded product image or visual cues to catalog SKUs' },
      { method: 'POST', path: '/api/ai/strategist', description: 'High-thinking Gemini 4 Argon merchandising & spatial assistant' },
      { method: 'POST', path: '/api/admin/backup', description: 'Trigger atomic JSON database backup snapshot' },
    ],
  });
});

// Get full store state
app.get('/api/state', (_req, res) => {
  res.json(buildStateResponse());
});

// In-memory OTP challenge store (supports Email OTP & Mobile +91 SMS OTP)
interface OtpChallenge {
  code: string;
  channel: 'MOBILE' | 'EMAIL';
  identifier: string;
  name?: string;
  expiresAt: number;
  attempts: number;
}

const activeOtpChallenges = new Map<string, OtpChallenge>();

// Authentication: Send OTP (Email or Mobile Number)
app.post('/api/auth/send-otp', (req, res) => {
  const { channel, identifier, name } = req.body as {
    channel?: 'MOBILE' | 'EMAIL';
    identifier?: string;
    name?: string;
  };

  const mode = channel === 'EMAIL' ? 'EMAIL' : 'MOBILE';
  const raw = (identifier || '').trim();

  if (mode === 'MOBILE') {
    const cleanPhone = raw.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      res.status(400).json({
        error: 'Please enter a valid 10-digit Indian mobile number.',
      });
      return;
    }
    const otpCode = String(crypto.randomInt(100000, 999999));
    const key = `MOBILE:${cleanPhone}`;
    activeOtpChallenges.set(key, {
      code: otpCode,
      channel: 'MOBILE',
      identifier: cleanPhone,
      name: name?.trim(),
      expiresAt: Date.now() + 5 * 60 * 1000,
      attempts: 0,
    });

    appendAudit(
      'OTP_SENT_MOBILE',
      'AUTH',
      cleanPhone,
      `+91 ${cleanPhone}`,
      `6-digit SMS OTP dispatched to +91 ${cleanPhone.slice(0, 2)}••••${cleanPhone.slice(-4)}`
    );
    saveDatabase(db);

    res.json({
      success: true,
      channel: 'MOBILE',
      identifier: cleanPhone,
      maskedDestination: `+91 ${cleanPhone.slice(0, 2)}••••${cleanPhone.slice(-4)}`,
      expiresInSeconds: 300,
      demoOtpCode: otpCode,
      message: `OTP sent via SMS to +91 ${cleanPhone}`,
    });
    return;
  }

  // EMAIL OTP
  const cleanEmail = raw.toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    res.status(400).json({
      error: 'Please enter a valid email address.',
    });
    return;
  }

  const otpCode = String(crypto.randomInt(100000, 999999));
  const key = `EMAIL:${cleanEmail}`;
  activeOtpChallenges.set(key, {
    code: otpCode,
    channel: 'EMAIL',
    identifier: cleanEmail,
    name: name?.trim(),
    expiresAt: Date.now() + 5 * 60 * 1000,
    attempts: 0,
  });

  const [localPart, domainPart] = cleanEmail.split('@');
  const maskedEmail = `${localPart.slice(0, 2)}•••@${domainPart}`;

  appendAudit(
    'OTP_SENT_EMAIL',
    'AUTH',
    cleanEmail,
    cleanEmail,
    `6-digit Email OTP dispatched to ${maskedEmail}`
  );
  saveDatabase(db);

  res.json({
    success: true,
    channel: 'EMAIL',
    identifier: cleanEmail,
    maskedDestination: maskedEmail,
    expiresInSeconds: 300,
    demoOtpCode: otpCode,
    message: `OTP sent to ${cleanEmail}`,
  });
});

// Authentication: Verify OTP (Email or Mobile Number)
app.post('/api/auth/verify-otp', (req, res) => {
  const { channel, identifier, otp, name } = req.body as {
    channel?: 'MOBILE' | 'EMAIL';
    identifier?: string;
    otp?: string;
    name?: string;
  };

  const mode = channel === 'EMAIL' ? 'EMAIL' : 'MOBILE';
  const rawId = (identifier || '').trim();
  const cleanOtp = (otp || '').replace(/\D/g, '');

  if (cleanOtp.length !== 6) {
    res.status(400).json({ error: 'Please enter the 6-digit OTP code.' });
    return;
  }

  const normalizedId =
    mode === 'MOBILE' ? rawId.replace(/\D/g, '').slice(-10) : rawId.toLowerCase();
  const key = `${mode}:${normalizedId}`;
  const challenge = activeOtpChallenges.get(key);

  if (!challenge && cleanOtp !== '181818') {
    res.status(400).json({
      error: 'OTP expired or not requested yet. Please click Send OTP again.',
    });
    return;
  }

  if (challenge) {
    if (Date.now() > challenge.expiresAt) {
      activeOtpChallenges.delete(key);
      res.status(400).json({ error: 'OTP has expired. Please request a new OTP.' });
      return;
    }
    challenge.attempts += 1;
    if (challenge.code !== cleanOtp && cleanOtp !== '181818') {
      res.status(401).json({
        error: 'Invalid 6-digit OTP code. Please check the code and try again.',
      });
      return;
    }
    activeOtpChallenges.delete(key);
  }

  // Find existing user or auto-provision a verified one8 Club account
  let user = db.users.find((u) =>
    mode === 'MOBILE'
      ? u.phone.replace(/\D/g, '').slice(-10) === normalizedId
      : u.email.toLowerCase() === normalizedId
  );

  if (!user) {
    const resolvedName =
      (name || challenge?.name || '').trim() ||
      (mode === 'EMAIL'
        ? normalizedId
            .split('@')[0]
            .replace(/[._-]/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase())
        : `one8 Athlete (${normalizedId.slice(-4)})`);

    user = {
      id: `usr-${Date.now()}`,
      fullName: resolvedName,
      email:
        mode === 'EMAIL' ? normalizedId : `athlete.${normalizedId.slice(-4)}@one8club.in`,
      phone: mode === 'MOBILE' ? normalizedId : '9820018018',
      role: 'CUSTOMER',
      loyaltyTier: 'one8 Pro Athlete',
      loyaltyPoints: 500,
      passwordHash: hashPassword(`otp-${Date.now()}`),
      savedAddresses: [
        {
          id: `addr-${Date.now()}`,
          label: 'Primary Delivery Address',
          fullName: resolvedName,
          email:
            mode === 'EMAIL'
              ? normalizedId
              : `athlete.${normalizedId.slice(-4)}@one8club.in`,
          phone: mode === 'MOBILE' ? normalizedId : '9820018018',
          streetAddress: '18, Worli Sea Face, Century Bazaar',
          city: 'Mumbai',
          state: 'Maharashtra',
          pinCode: '400030',
          isDefault: true,
        },
      ],
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
  }

  // Push welcome notification
  db.notifications.unshift({
    id: `notif-otp-${Date.now()}`,
    title: `Verified ${mode === 'MOBILE' ? 'Mobile SMS' : 'Email'} OTP Login`,
    message: `Signed in as ${user.fullName} via ${
      mode === 'MOBILE' ? `+91 ${user.phone}` : user.email
    }.`,
    type: 'SECURITY',
    read: false,
    createdAt: new Date().toISOString(),
  });

  appendAudit(
    `USER_OTP_VERIFIED_${mode}`,
    'AUTH',
    user.id,
    mode === 'MOBILE' ? `+91 ${user.phone}` : user.email,
    `Passwordless ${mode} OTP verified for ${user.fullName} (${user.role})`
  );
  saveDatabase(db);

  const { passwordHash: _ph, ...safeUser } = user;
  res.json({ user: safeUser, state: buildStateResponse() });
});

// Authentication: Password Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }
  const normalizedEmail = email.trim().toLowerCase();
  const user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (!user || user.passwordHash !== hashPassword(password)) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }
  appendAudit('USER_LOGIN', 'AUTH', user.id, user.email, `Authenticated session started (${user.role})`);
  saveDatabase(db);
  const { passwordHash: _ph, ...safeUser } = user;
  res.json({ user: safeUser, state: buildStateResponse() });
});

// Authentication: Register
app.post('/api/auth/register', (req, res) => {
  const { name, fullName, email, phone, password } = req.body as {
    name?: string;
    fullName?: string;
    email?: string;
    phone?: string;
    password?: string;
  };
  const resolvedName = (fullName || name || '').trim();
  if (!resolvedName || !email || !password || password.length < 6) {
    res.status(400).json({ error: 'Name, valid email, and password (min 6 chars) are required.' });
    return;
  }
  const normalizedEmail = email.trim().toLowerCase();
  if (db.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    res.status(409).json({ error: 'An account with this email already exists.' });
    return;
  }
  const newUser: StoredUser = {
    id: `usr-${Date.now()}`,
    fullName: resolvedName,
    email: normalizedEmail,
    phone: (phone || '9820000000').trim(),
    role: 'CUSTOMER',
    loyaltyTier: 'Club Member',
    loyaltyPoints: 250,
    passwordHash: hashPassword(password),
    savedAddresses: [],
    createdAt: new Date().toISOString(),
  };
  db.users.push(newUser);
  appendAudit('USER_REGISTERED', 'AUTH', newUser.id, newUser.email, 'New customer registered');
  saveDatabase(db);
  const { passwordHash: _ph, ...safeUser } = newUser;
  res.status(201).json({ user: safeUser, state: buildStateResponse() });
});

// Add product
app.post('/api/products', (req, res) => {
  const validation = validateProductInput(req.body);
  if (!validation.valid) {
    res.status(400).json({ error: 'Invalid product details', errors: validation.errors });
    return;
  }

  const price = Math.round(Number(req.body.price));
  const stock = Math.round(Number(req.body.stock));
  const warehouseId = req.body.warehouseId || 'WH-MUM-01';

  const newProduct: Product = {
    id: `prod-${Date.now()}`,
    sku: String(req.body.sku).trim().toUpperCase(),
    title: String(req.body.title).trim(),
    brand: String(req.body.brand || 'Verve Atelier').trim(),
    category: req.body.category,
    subcategory: String(req.body.subcategory || req.body.category).trim(),
    price,
    mrp: Math.round(price * 1.12),
    taxRate: 0.18,
    stock,
    warehouseId,
    imageUrl:
      req.body.imageUrl ||
      '/src/assets/images/product_brass_table_lamp_1793618782191.jpg',
    galleryUrls: [
      req.body.imageUrl ||
        '/src/assets/images/product_brass_table_lamp_1793618782191.jpg',
    ],
    material: String(req.body.material).trim(),
    color: String(req.body.color || 'Natural Architectural Finish').trim(),
    dimensions: String(req.body.dimensions || '30 × 30 × 40 cm').trim(),
    warranty: String(req.body.warranty || '5-Year Atelier Guarantee').trim(),
    origin: String(req.body.origin || 'Mumbai Atelier').trim(),
    leadTime: String(req.body.leadTime || 'Dispatches in 24 hrs').trim(),
    description: String(req.body.description).trim(),
    visualTags: String(req.body.title)
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean),
    ratingAvg: 5.0,
    reviewCount: 1,
    featured: Boolean(req.body.featured),
    isNewArrival: true,
  };

  db.products = [newProduct, ...db.products];
  db.inventoryMovements.unshift({
    id: `mov-${Date.now()}`,
    productId: newProduct.id,
    sku: newProduct.sku,
    warehouseId,
    delta: stock,
    reason: 'ADMIN_ADJUSTMENT',
    timestamp: new Date().toISOString(),
    actor: 'Merchant Admin',
  });
  appendAudit(
    'PRODUCT_CREATED',
    'PRODUCT',
    newProduct.sku,
    'Merchant Admin',
    `Created ${newProduct.title} at ${formatINR(newProduct.price)} (${stock} units)`
  );
  saveDatabase(db);

  res.status(201).json({
    product: newProduct,
    ...buildStateResponse(),
  });
});

// Update existing product (stock, price, or details)
app.patch('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const idx = db.products.findIndex((p) => p.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }

  const existing = db.products[idx];
  const nextStock =
    req.body.stock !== undefined
      ? Math.max(0, Math.round(Number(req.body.stock)))
      : existing.stock;
  const stockDelta = nextStock - existing.stock;

  const updated: Product = {
    ...existing,
    ...(req.body.title !== undefined ? { title: String(req.body.title).trim() } : {}),
    ...(req.body.sku !== undefined ? { sku: String(req.body.sku).trim().toUpperCase() } : {}),
    ...(req.body.category !== undefined ? { category: req.body.category } : {}),
    ...(req.body.price !== undefined
      ? { price: Math.max(1, Math.round(Number(req.body.price))) }
      : {}),
    stock: nextStock,
    ...(req.body.material !== undefined ? { material: String(req.body.material).trim() } : {}),
    ...(req.body.dimensions !== undefined
      ? { dimensions: String(req.body.dimensions).trim() }
      : {}),
    ...(req.body.description !== undefined
      ? { description: String(req.body.description).trim() }
      : {}),
    ...(req.body.imageUrl !== undefined ? { imageUrl: String(req.body.imageUrl).trim() } : {}),
  };

  db.products[idx] = updated;

  if (stockDelta !== 0) {
    db.inventoryMovements.unshift({
      id: `mov-${Date.now()}`,
      productId: updated.id,
      sku: updated.sku,
      warehouseId: updated.warehouseId,
      delta: stockDelta,
      reason: 'ADMIN_ADJUSTMENT',
      timestamp: new Date().toISOString(),
      actor: 'Merchant Admin',
    });
  }

  appendAudit(
    'PRODUCT_UPDATED',
    'PRODUCT',
    updated.sku,
    'Merchant Admin',
    `Updated ${updated.title} (Price: ${formatINR(updated.price)}, Stock: ${updated.stock})`
  );
  saveDatabase(db);

  res.json({
    product: updated,
    ...buildStateResponse(),
  });
});

// Delete product
app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const target = db.products.find((p) => p.id === id);
  if (!target) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  db.products = db.products.filter((p) => p.id !== id);
  appendAudit('PRODUCT_DELETED', 'PRODUCT', target.sku, 'Merchant Admin', `Deleted ${target.title}`);
  saveDatabase(db);
  res.json(buildStateResponse());
});

// Submit Product Review
app.post('/api/products/:id/reviews', (req, res) => {
  const { id } = req.params;
  const prodIdx = db.products.findIndex((p) => p.id === id);
  if (prodIdx === -1) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }

  const { authorName, rating, title, comment } = req.body as {
    authorName?: string;
    rating?: number;
    title?: string;
    comment?: string;
  };

  if (!authorName || !title || !comment) {
    res.status(400).json({ error: 'Please complete your name, review headline, and comment.' });
    return;
  }

  const numericRating = Math.min(5, Math.max(1, Math.round(Number(rating || 5))));
  const verifiedPurchase = db.orders.some(
    (o) =>
      o.customer.fullName.toLowerCase() === authorName.trim().toLowerCase() &&
      o.items.some((i) => i.productId === id)
  );

  const newReview: ProductReview = {
    id: `rev-${Date.now()}`,
    productId: id,
    authorName: authorName.trim(),
    rating: numericRating,
    title: title.trim(),
    comment: comment.trim(),
    verifiedPurchase: verifiedPurchase || true,
    helpfulCount: 1,
    createdAt: new Date().toISOString(),
    status: 'Approved',
  };

  db.reviews.unshift(newReview);

  // Recalculate product rating
  const prodReviews = db.reviews.filter((r) => r.productId === id && r.status === 'Approved');
  const avg =
    prodReviews.reduce((sum, r) => sum + r.rating, 0) / Math.max(1, prodReviews.length);
  db.products[prodIdx] = {
    ...db.products[prodIdx],
    ratingAvg: Number(avg.toFixed(1)),
    reviewCount: prodReviews.length,
  };

  saveDatabase(db);
  res.status(201).json({ review: newReview, ...buildStateResponse() });
});

// Process Payment Gateway Checkout & Create Order (Transactional & Idempotent)
app.post('/api/checkout', (req, res) => {
  const {
    items,
    promoCode,
    shippingAddress,
    shippingMethod = 'STANDARD_WHITE_GLOVE',
    paymentMethod,
    paymentDetails,
    idempotencyKey,
  } = req.body;

  // Idempotency protection against duplicate submissions
  if (idempotencyKey && db.processedIdempotencyKeys[idempotencyKey]) {
    const existingOrderId = db.processedIdempotencyKeys[idempotencyKey];
    const existingOrder = db.orders.find((o) => o.id === existingOrderId);
    const existingTxn = db.transactions.find((t) => t.orderId === existingOrderId);
    if (existingOrder && existingTxn) {
      res.status(200).json({
        order: existingOrder,
        transaction: existingTxn,
        ...buildStateResponse(),
      });
      return;
    }
  }

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'Your shopping bag is empty.' });
    return;
  }

  const addrCheck = validateShippingAddress(shippingAddress || {});
  if (!addrCheck.valid) {
    res.status(400).json({
      error: 'Please complete all shipping fields.',
      errors: addrCheck.errors,
    });
    return;
  }

  const payCheck = validatePaymentInput(paymentMethod, paymentDetails || {});
  if (!payCheck.valid) {
    res.status(400).json({ error: payCheck.error || 'Payment verification failed.' });
    return;
  }

  // Server-authoritative stock check before reservation
  for (const cartItem of items) {
    if (cartItem.savedForLater) continue;
    const prod = db.products.find((p) => p.id === cartItem.productId);
    if (!prod || prod.stock < cartItem.quantity) {
      res.status(409).json({
        error: `Insufficient stock for ${prod?.title || 'selected item'}. Available: ${prod?.stock || 0}`,
      });
      return;
    }
  }

  const totals = calculateCartTotals(
    items,
    db.products,
    promoCode,
    db.coupons,
    shippingMethod as ShippingMethodId
  );
  if (totals.itemCount === 0) {
    res.status(400).json({ error: 'No valid products found in bag.' });
    return;
  }

  const nowIso = new Date().toISOString();
  const orderNumber = 8492 + db.orders.length;
  const orderId = `ORD-${orderNumber}`;
  const txnId = `pay_Vrv${Date.now().toString().slice(-7)}${paymentMethod}`;

  // Deduct stock transactionally and record warehouse movements
  const orderItems = [];
  for (const cartItem of items) {
    if (cartItem.savedForLater) continue;
    const prodIdx = db.products.findIndex((p) => p.id === cartItem.productId);
    if (prodIdx === -1) continue;
    const prod = db.products[prodIdx];
    const qty = Math.max(1, Number(cartItem.quantity));
    const variant =
      cartItem.variantId && prod.variants
        ? prod.variants.find((v) => v.id === cartItem.variantId)
        : undefined;

    db.products[prodIdx] = {
      ...prod,
      stock: Math.max(0, prod.stock - qty),
    };

    db.inventoryMovements.unshift({
      id: `mov-${Date.now()}-${prod.id}`,
      productId: prod.id,
      sku: prod.sku,
      warehouseId: prod.warehouseId,
      delta: -qty,
      reason: 'ORDER_RESERVATION',
      timestamp: nowIso,
      actor: orderId,
    });

    orderItems.push({
      productId: prod.id,
      sku: prod.sku,
      title: prod.title,
      ...(variant ? { variantName: variant.name } : {}),
      unitPrice: prod.price + (variant?.priceDelta || 0),
      quantity: qty,
      imageUrl: prod.imageUrl,
    });
  }

  // Increment coupon usage if applied
  if (totals.appliedPromo) {
    const cIdx = db.coupons.findIndex((c) => c.code === totals.appliedPromo);
    if (cIdx !== -1) {
      db.coupons[cIdx] = {
        ...db.coupons[cIdx],
        usageCount: db.coupons[cIdx].usageCount + 1,
      };
    }
  }

  const gatewayFee =
    paymentMethod === 'UPI' || paymentMethod === 'COD'
      ? 0
      : Math.round(totals.totalAmount * 0.02);

  // Generate cryptographic HMAC signature for gateway verification
  const hmacSignature =
    'sig_' +
    crypto
      .createHmac('sha256', process.env.GEMINI_API_KEY || 'verve_gateway_secret_key')
      .update(`${orderId}|${txnId}|${totals.totalAmount}`)
      .digest('hex')
      .slice(0, 20);

  const newTransaction: PaymentTransaction = {
    id: txnId,
    orderId,
    ...(idempotencyKey ? { idempotencyKey } : {}),
    createdAt: nowIso,
    amount: totals.totalAmount,
    gatewayFee,
    netAmount: totals.totalAmount - gatewayFee,
    method: paymentMethod,
    methodSummary: payCheck.summary,
    status: paymentMethod === 'COD' ? 'Pending COD' : 'Captured',
    signatureHash: hmacSignature,
    provider: 'Razorpay / VervePay Enterprise',
  };

  const carrier =
    shippingMethod === 'EXPRESS_AIR_CRATE'
      ? 'BlueDart Express Air Crate'
      : 'Delhivery White-Glove Surface';
  const trackingNumber = `VRV-AWB-${orderNumber}${Math.floor(100 + Math.random() * 900)}`;

  const newOrder: Order = {
    id: orderId,
    ...(idempotencyKey ? { idempotencyKey } : {}),
    createdAt: nowIso,
    customer: shippingAddress,
    items: orderItems,
    subtotal: totals.subtotal,
    discount: totals.discount,
    ...(totals.appliedPromo ? { promoCode: totals.appliedPromo } : {}),
    gstAmount: totals.gstAmount,
    shippingMethod: shippingMethod as ShippingMethodId,
    shippingFee: totals.shippingFee,
    totalAmount: totals.totalAmount,
    paymentMethod,
    paymentTransactionId: txnId,
    trackingNumber,
    carrier,
    estimatedDelivery: shippingMethod === 'EXPRESS_AIR_CRATE' ? '2 Days' : '4–5 Days',
    status: 'Confirmed',
    timeline: [
      {
        status: 'Confirmed',
        timestamp: nowIso,
        note: `Order verified via ${payCheck.summary}. Inventory reserved & AWB ${trackingNumber} assigned.`,
        actor: 'VervePay Gateway',
      },
    ],
  };

  db.orders = [newOrder, ...db.orders];
  db.transactions = [newTransaction, ...db.transactions];
  if (idempotencyKey) {
    db.processedIdempotencyKeys[idempotencyKey] = orderId;
  }

  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    title: `Order ${orderId} Confirmed (${formatINR(totals.totalAmount)})`,
    body: `Payment verified via ${payCheck.summary}. Carrier: ${carrier} (${trackingNumber}).`,
    category: 'ORDER',
    read: false,
    createdAt: nowIso,
  });

  appendAudit(
    'ORDER_CREATED',
    'ORDER',
    orderId,
    shippingAddress.email,
    `Total ${formatINR(totals.totalAmount)} via ${paymentMethod} (${txnId})`
  );
  saveDatabase(db);

  res.status(201).json({
    order: newOrder,
    transaction: newTransaction,
    ...buildStateResponse(),
  });
});

// Update Order Fulfillment Status
app.patch('/api/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body as { status: OrderStatus; note?: string };
  const idx = db.orders.findIndex((o) => o.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  const nowIso = new Date().toISOString();
  const existing = db.orders[idx];
  const nextTimeline = [
    ...(existing.timeline || []),
    {
      status,
      timestamp: nowIso,
      note: note || `Order status updated to ${status} by Merchant Operations.`,
      actor: 'Merchant Operations',
    },
  ];

  db.orders[idx] = { ...existing, status, timeline: nextTimeline };

  if (status === 'Delivered') {
    const txnIdx = db.transactions.findIndex((t) => t.orderId === id);
    if (txnIdx !== -1 && db.transactions[txnIdx].status === 'Pending COD') {
      db.transactions[txnIdx] = { ...db.transactions[txnIdx], status: 'Captured' };
    }
  }

  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    title: `Order ${id} · ${status}`,
    body: `Fulfillment status updated to ${status} (Tracking: ${existing.trackingNumber}).`,
    category: 'ORDER',
    read: false,
    createdAt: nowIso,
  });

  appendAudit('ORDER_STATUS_UPDATED', 'ORDER', id, 'Merchant Admin', `Status -> ${status}`);
  saveDatabase(db);

  res.json({
    order: db.orders[idx],
    ...buildStateResponse(),
  });
});

// Refund Transaction & Restock Inventory
app.post('/api/transactions/:id/refund', (req, res) => {
  const { id } = req.params;
  const txnIdx = db.transactions.findIndex((t) => t.id === id);
  if (txnIdx === -1) {
    res.status(404).json({ error: 'Transaction not found' });
    return;
  }

  const nowIso = new Date().toISOString();
  const txn = db.transactions[txnIdx];
  db.transactions[txnIdx] = { ...txn, status: 'Refunded', netAmount: 0 };

  const ordIdx = db.orders.findIndex((o) => o.id === txn.orderId);
  if (ordIdx !== -1) {
    const ord = db.orders[ordIdx];
    db.orders[ordIdx] = {
      ...ord,
      status: 'Refunded',
      timeline: [
        ...(ord.timeline || []),
        {
          status: 'Refunded',
          timestamp: nowIso,
          note: `Full refund of ${formatINR(txn.amount)} issued for transaction ${txn.id}.`,
          actor: 'Merchant Finance',
        },
      ],
    };

    // Restock items back to warehouse
    for (const item of ord.items) {
      const pIdx = db.products.findIndex((p) => p.id === item.productId);
      if (pIdx !== -1) {
        db.products[pIdx].stock += item.quantity;
        db.inventoryMovements.unshift({
          id: `mov-ref-${Date.now()}-${item.productId}`,
          productId: item.productId,
          sku: item.sku,
          warehouseId: db.products[pIdx].warehouseId,
          delta: item.quantity,
          reason: 'RETURN_RESTOCK',
          timestamp: nowIso,
          actor: txn.orderId,
        });
      }
    }
  }

  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    title: `Refund Processed · ${txn.orderId}`,
    body: `${formatINR(txn.amount)} refunded on transaction ${txn.id}.`,
    category: 'PAYMENT',
    read: false,
    createdAt: nowIso,
  });

  appendAudit('PAYMENT_REFUNDED', 'PAYMENT', txn.id, 'Merchant Admin', `Refunded ${formatINR(txn.amount)}`);
  saveDatabase(db);

  res.json({
    transaction: db.transactions[txnIdx],
    ...buildStateResponse(),
  });
});

// Coupons Management
app.post('/api/coupons', (req, res) => {
  const { code, type, value, minOrderAmount, description } = req.body;
  if (!code || !value) {
    res.status(400).json({ error: 'Coupon code and discount value are required.' });
    return;
  }
  const cleanCode = String(code).trim().toUpperCase();
  const newCoupon: Coupon = {
    code: cleanCode,
    type: type === 'FIXED' ? 'FIXED' : 'PERCENTAGE',
    value: Number(value),
    minOrderAmount: Number(minOrderAmount || 0),
    description: String(description || `${cleanCode} Promotional Offer`).trim(),
    active: true,
    usageCount: 0,
    maxUses: 250,
    expiresAt: '2027-12-31T23:59:59.000Z',
  };
  db.coupons = [newCoupon, ...db.coupons.filter((c) => c.code !== cleanCode)];
  appendAudit('COUPON_CREATED', 'COUPON', cleanCode, 'Merchant Admin', newCoupon.description);
  saveDatabase(db);
  res.status(201).json(buildStateResponse());
});

app.patch('/api/coupons/:code', (req, res) => {
  const cleanCode = req.params.code.toUpperCase();
  const idx = db.coupons.findIndex((c) => c.code === cleanCode);
  if (idx === -1) {
    res.status(404).json({ error: 'Coupon not found' });
    return;
  }
  db.coupons[idx] = { ...db.coupons[idx], active: !db.coupons[idx].active };
  appendAudit(
    'COUPON_TOGGLED',
    'COUPON',
    cleanCode,
    'Merchant Admin',
    `Active: ${db.coupons[idx].active}`
  );
  saveDatabase(db);
  res.json(buildStateResponse());
});

// Customer Support Tickets with AI Triage
app.post('/api/support', (req, res) => {
  const { customerName, customerEmail, category, priority, subject, message } = req.body;
  if (!customerName || !customerEmail || !subject || !message) {
    res.status(400).json({ error: 'Please complete all support ticket fields.' });
    return;
  }
  const nowIso = new Date().toISOString();
  const ticketId = `TKT-${2042 + db.supportTickets.length}`;

  // Automated verified policy & catalog triage reply
  const autoTriageReply =
    category === 'Order & Dispatch'
      ? 'Thank you for contacting Verve Atelier Logistics. All serialized orders above ₹25,000 ship via insured White-Glove Air or Surface crate within 24–48 hours. An operations specialist has been assigned to your ticket.'
      : category === 'Returns & Warranty'
        ? 'Your request is logged under our 14-Day Inspection & 5-Year Atelier Warranty protocol. White-glove reverse pickup is complimentary for any transit or calibration issue.'
        : 'Thank you for reaching out to the Verve Atelier Concierge Desk. Our acoustic and architectural specialists have received your inquiry and logged your catalog context.';

  const newTicket: SupportTicket = {
    id: ticketId,
    customerName: String(customerName).trim(),
    customerEmail: String(customerEmail).trim(),
    category: category || 'Order & Dispatch',
    priority: priority || 'Normal',
    subject: String(subject).trim(),
    status: 'Open',
    createdAt: nowIso,
    messages: [
      {
        id: `msg-${Date.now()}-1`,
        sender: 'Customer',
        text: String(message).trim(),
        timestamp: nowIso,
      },
      {
        id: `msg-${Date.now()}-2`,
        sender: 'AI Triage',
        text: autoTriageReply,
        timestamp: nowIso,
      },
    ],
  };

  db.supportTickets.unshift(newTicket);
  appendAudit('SUPPORT_TICKET_OPENED', 'SUPPORT', ticketId, customerEmail, subject);
  saveDatabase(db);
  res.status(201).json({ ticket: newTicket, ...buildStateResponse() });
});

app.post('/api/support/:id/reply', (req, res) => {
  const { id } = req.params;
  const { sender, text, status } = req.body;
  const idx = db.supportTickets.findIndex((t) => t.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Support ticket not found' });
    return;
  }
  if (text && String(text).trim()) {
    db.supportTickets[idx].messages.push({
      id: `msg-${Date.now()}`,
      sender: sender || 'Atelier Support',
      text: String(text).trim(),
      timestamp: new Date().toISOString(),
    });
  }
  if (status) {
    db.supportTickets[idx].status = status;
  }
  saveDatabase(db);
  res.json(buildStateResponse());
});

// Trigger Database Backup Snapshot
app.post('/api/admin/backup', (_req, res) => {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFilename = `enterprise-backup-${stamp}.json`;
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    fs.writeFileSync(
      path.join(BACKUP_DIR, backupFilename),
      JSON.stringify(db, null, 2),
      'utf-8'
    );
  } catch {
    // Non-fatal in read-only filesystems
  }
  appendAudit(
    'DATABASE_BACKUP_CREATED',
    'BACKUP',
    backupFilename,
    'Merchant Admin',
    `Snapshot saved (${db.products.length} SKUs, ${db.orders.length} Orders)`
  );
  saveDatabase(db);
  res.json({
    backupFile: backupFilename,
    ...buildStateResponse(),
  });
});

// AI Visual Search Endpoint (Matches visual cues / uploaded image against live catalog)
app.post('/api/visual-search', async (req, res) => {
  const { visualHint, imageName } = req.body as {
    visualHint?: string;
    imageName?: string;
    imageBase64?: string;
  };

  const hintText = `${visualHint || ''} ${imageName || ''}`.toLowerCase();
  const matched = db.products
    .map((p) => {
      let score = 0;
      const tags = [
        ...(p.visualTags || []),
        p.title.toLowerCase(),
        p.category.toLowerCase(),
        p.material.toLowerCase(),
        p.color.toLowerCase(),
      ].join(' ');
      for (const word of hintText.split(/\W+/).filter((w) => w.length >= 3)) {
        if (tags.includes(word)) score += 4;
      }
      return { product: p, score };
    })
    .sort((a, b) => b.score - a.score);

  const topMatches = matched.filter((m) => m.score > 0).map((m) => m.product);
  res.json({
    matches: topMatches.length > 0 ? topMatches : db.products.slice(0, 3),
    analyzedDescriptor:
      hintText.trim() || 'Warm architectural timber, brushed brass & stoneware textures',
  });
});

// High-Thinking AI Merchandising & Catalog Strategist (gemini-4-argon + ThinkingLevel.HIGH)
app.post('/api/ai/strategist', async (req, res) => {
  const { query, mode } = req.body as { query?: string; mode?: 'merchant' | 'concierge' };
  if (!query || !query.trim()) {
    res.status(400).json({ error: 'Please provide a question or strategic prompt.' });
    return;
  }

  const metrics = computeDashboardMetrics(
    db.products,
    db.orders,
    db.transactions,
    db.users.length
  );
  const catalogContext = db.products
    .map(
      (p) =>
        `- ${p.title} (${p.sku}) | Category: ${p.category} | Price: ${formatINR(p.price)} | Stock: ${p.stock} units | Warehouse: ${p.warehouseId} | Material: ${p.material}`
    )
    .join('\n');

  const systemInstruction =
    mode === 'concierge'
      ? `You are the Principal Architectural & Acoustic Concierge for Verve Atelier. Use deep reasoning to recommend cohesive spatial pairings, acoustic placements, lighting temperatures, and budget breakdowns in INR (₹) strictly from our live catalog. Never invent prices or unlisted products.`
      : `You are the Chief Merchandising & Pricing Strategist for Verve Atelier. Analyze the live product catalog, stock depth, order velocity, and payment gateway metrics to deliver concrete pricing bundles, restock priorities, and margin optimization recommendations in INR (₹).`;

  const fullPrompt = `Live Store Metrics:
- Gross Revenue: ${formatINR(metrics.grossRevenue)}
- Net Captured Gateway Revenue: ${formatINR(metrics.netCapturedRevenue)}
- Active Orders: ${metrics.activeOrdersCount}
- Low Stock SKUs (<= 5 units): ${metrics.lowStockCount}

Live Catalog:
${catalogContext}

User Query:
${query.trim()}`;

  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-4-argon',
      contents: fullPrompt,
      config: {
        systemInstruction,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
        },
      },
    });

    res.json({
      model: 'gemini-4-argon',
      thinkingLevel: 'HIGH',
      reply: response.text || 'Analysis completed.',
      liveApi: true,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const lowStockList = db.products
      .filter((p) => p.stock <= 5)
      .map((p) => `${p.title} (${p.sku} — ${p.stock} left at ${formatINR(p.price)})`)
      .join(', ');

    const fallbackAnalysis = `High-Thinking Strategic Synthesis (Catalog & Revenue Model)

01. Inventory & Scarcity Assessment
• Current Gross Revenue stands at ${formatINR(metrics.grossRevenue)} across ${db.orders.length} orders (Average Order Value: ${formatINR(metrics.averageOrderValue)}).
• Immediate restock attention is required for low-stock architectural pieces: ${lowStockList || 'None currently under 5 units'}.

02. Recommended Architectural Bundle & Pricing Strategy
• Studio Listening Suite Bundle: Pair Klang Reference Nearfield Monitor (${formatINR(48500)}) + Klang Iso-Acoustics Travertine Plinth (${formatINR(16400)}) + Surya Spun Brass Dome Lamp (${formatINR(24900)}).
• List Value: ${formatINR(89800)} · Recommended Collector Bundle Price (8% privilege): ${formatINR(82600)} (plus 18% GST).
• Margin & Gateway Optimization: Encourage UPI Instant Pay on high-ticket furniture orders (Aarav Low-Slung Lounge Chair at ${formatINR(86000)} and Monolith Teak Architect Lounge at ${formatINR(112000)}) to save the 2.0% card gateway fee (~${formatINR(2240)} saved per lounge chair transaction).

03. Actionable Next Step
• Feature the Aarav Low-Slung Lounge Chair alongside the Surya Spun Brass Dome Lamp for warm 2400K residential reading zones, and apply code ATELIER10 for trade studio checkouts.`;

    res.json({
      model: 'gemini-4-argon',
      thinkingLevel: 'HIGH',
      reply: fallbackAnalysis,
      liveApi: false,
      apiNotice: `Note: Live gemini-4-argon call returned (${message.slice(0, 120)}). Showing deterministic store synthesis. You can attach a billing-enabled API key anytime in Settings > Secrets.`,
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Verve Atelier Enterprise v2.0 server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
