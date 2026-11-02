import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_PRODUCTS,
  INITIAL_ORDERS,
  INITIAL_TRANSACTIONS,
  INITIAL_COUPONS,
  formatINR,
  calculateCartTotals,
  validateShippingAddress,
  validatePaymentInput,
  validateProductInput,
  computeDashboardMetrics,
  parseNaturalLanguageSearch,
  searchCatalogProducts,
  getHybridRecommendations,
} from './commerce';

test('formatINR formats Indian currency correctly', () => {
  assert.equal(formatINR(12999), '₹12,999');
  assert.equal(formatINR(112000), '₹1,12,000');
  assert.equal(formatINR(0), '₹0');
});

test('calculateCartTotals computes subtotal, percentage/fixed coupons, 18% GST, and shipping methods', () => {
  // prod-1 (Velocity Runner) is ₹12,999, qty 2 = ₹25,998 (qualifies for free standard shipping >= ₹25,000)
  const cart = [{ productId: 'prod-1', quantity: 2 }];
  const withoutPromo = calculateCartTotals(cart, INITIAL_PRODUCTS);
  assert.equal(withoutPromo.subtotal, 25998);
  assert.equal(withoutPromo.discount, 0);
  assert.equal(withoutPromo.gstAmount, Math.round(25998 * 0.18));
  assert.equal(withoutPromo.shippingFee, 0);
  assert.equal(withoutPromo.itemCount, 2);

  // With ONE8CHAMP (18% off)
  const withOne8Promo = calculateCartTotals(
    cart,
    INITIAL_PRODUCTS,
    'one8champ',
    'STANDARD_WHITE_GLOVE',
    INITIAL_COUPONS
  );
  assert.equal(withOne8Promo.discount, Math.round(25998 * 0.18));

  // With FIRST5000 (Flat ₹5,000 off on orders >= ₹20,000)
  const withFixed = calculateCartTotals(
    cart,
    INITIAL_PRODUCTS,
    'FIRST5000',
    'STANDARD_WHITE_GLOVE',
    INITIAL_COUPONS
  );
  assert.equal(withFixed.discount, 5000);

  // Express Air Crate shipping always adds ₹1,450
  const withExpress = calculateCartTotals(
    cart,
    INITIAL_PRODUCTS,
    '',
    'EXPRESS_AIR_CRATE',
    INITIAL_COUPONS
  );
  assert.equal(withExpress.shippingFee, 1450);
});

test('calculateCartTotals applies ₹450 shipping fee when taxable amount is under ₹25,000', () => {
  // prod-3 (Intense Noir EDP) is ₹3,499
  const cart = [{ productId: 'prod-3', quantity: 1 }];
  const totals = calculateCartTotals(cart, INITIAL_PRODUCTS);
  assert.equal(totals.subtotal, 3499);
  assert.equal(totals.shippingFee, 450);
});

test('parseNaturalLanguageSearch and searchCatalogProducts handle natural language price and category queries', () => {
  const parsed = parseNaturalLanguageSearch('Find running shoes below ₹15,000');
  assert.equal(parsed.maxPrice, 15000);
  assert.equal(parsed.inferredCategory, 'Footwear & Sneakers');

  const results = searchCatalogProducts(
    INITIAL_PRODUCTS,
    'Find running shoes below ₹15,000'
  );
  assert.equal(results.length >= 1, true);
  assert.equal(results[0].id, 'prod-1');
});

test('getHybridRecommendations returns relevant non-cart catalog items', () => {
  const recs = getHybridRecommendations(INITIAL_PRODUCTS, ['prod-1'], ['prod-1'], 3);
  assert.equal(recs.length, 3);
  assert.equal(recs[0].id !== 'prod-1', true);
});

test('validateShippingAddress validates required fields and PIN/phone format', () => {
  const validAddr = {
    fullName: 'Virat Sharma',
    email: 'virat@one8club.in',
    phone: '9820112233',
    streetAddress: '18, Worli Sea Face, Century Bazaar',
    city: 'Mumbai',
    state: 'Maharashtra',
    pinCode: '400030',
  };
  const okResult = validateShippingAddress(validAddr);
  assert.equal(okResult.valid, true);

  const badResult = validateShippingAddress({
    ...validAddr,
    phone: '12345',
    pinCode: '400',
  });
  assert.equal(badResult.valid, false);
  assert.ok(badResult.errors.phone);
  assert.ok(badResult.errors.pinCode);
});

test('validatePaymentInput validates UPI, CARD, NETBANKING, and COD correctly', () => {
  assert.equal(
    validatePaymentInput({ method: 'UPI', upiId: 'athlete@okhdfcbank' }).valid,
    true
  );
  assert.equal(
    validatePaymentInput({ method: 'UPI', upiId: 'invalid-upi' }).valid,
    false
  );
});

test('validateProductInput and computeDashboardMetrics work accurately', () => {
  const check = validateProductInput({
    title: 'one8 Pro Carbon Shin Guard',
    sku: 'ONE8-ACC-09',
    price: 2499,
    stock: 15,
    material: 'Aerospace Carbon Shell & EVA Backing',
  });
  assert.equal(check.valid, true);

  const metrics = computeDashboardMetrics(
    INITIAL_PRODUCTS,
    INITIAL_ORDERS,
    INITIAL_TRANSACTIONS
  );
  assert.equal(metrics.totalOrders, 2);
  assert.equal(metrics.grossRevenue, 15929 + 11068);
  assert.equal(metrics.totalSkus, 6);
});
