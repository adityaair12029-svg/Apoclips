import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Lock,
  CheckCircle2,
  QrCode,
  CreditCard,
  Building2,
  Banknote,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Plus,
  Minus,
  Bookmark,
} from 'lucide-react';
import {
  Product,
  CartItem,
  ShippingAddress,
  PaymentMethod,
  PaymentDetailsInput,
  ShippingMethodId,
  Coupon,
  Order,
  PaymentTransaction,
  calculateCartTotals,
  validateShippingAddress,
  validatePaymentInput,
  formatINR,
} from '../utils/commerce';
import { ResilientImage } from './ResilientImage';

interface PaymentGatewayModalProps {
  isOpen: boolean;
  initialStep?: 'cart' | 'shipping';
  onClose: () => void;
  cart: CartItem[];
  products: Product[];
  coupons: Coupon[];
  onUpdateCartQty: (productId: string, quantity: number) => void;
  onToggleSaveForLater: (productId: string) => void;
  onClearCart: () => void;
  onCheckoutSuccess: (payload: {
    order: Order;
    transaction: PaymentTransaction;
    products: Product[];
    orders: Order[];
    transactions: PaymentTransaction[];
  }) => void;
  onNavigateToOrders: () => void;
}

export const PaymentGatewayModal: React.FC<PaymentGatewayModalProps> = ({
  isOpen,
  initialStep = 'cart',
  onClose,
  cart,
  products,
  coupons,
  onUpdateCartQty,
  onToggleSaveForLater,
  onCheckoutSuccess,
  onNavigateToOrders,
}) => {
  const [step, setStep] = useState<'cart' | 'shipping' | 'gateway' | 'otp' | 'receipt'>(
    initialStep
  );
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromoCode, setAppliedPromoCode] = useState('');
  const [promoFeedback, setPromoFeedback] = useState<string | null>(null);
  const [shippingMethod, setShippingMethod] =
    useState<ShippingMethodId>('STANDARD_WHITE_GLOVE');

  const [shipping, setShipping] = useState<ShippingAddress>({
    fullName: 'Vikramaditya Singhania',
    email: 'vikram@singhaniastudio.in',
    phone: '9820194820',
    streetAddress: '702, Wallace Apartments, Sleater Road',
    city: 'Mumbai',
    state: 'Maharashtra',
    pinCode: '400007',
  });
  const [shippingErrors, setShippingErrors] = useState<
    Partial<Record<keyof ShippingAddress, string>>
  >({});

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetailsInput>({
    upiId: 'vikram.studio@okicici',
    cardNumber: '4242 4242 4242 8890',
    cardName: 'VIKRAMADITYA SINGHANIA',
    cardExpiry: '09/29',
    cardCvv: '842',
    bankCode: 'HDFC Bank Corporate & Retail',
    codConfirmPhone: '9820194820',
  });
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState('482910');
  const [isProcessing, setIsProcessing] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(() => `idem_${Date.now()}`);

  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [completedTxn, setCompletedTxn] = useState<PaymentTransaction | null>(null);

  React.useEffect(() => {
    if (isOpen && step !== 'receipt') {
      setStep(initialStep);
      setPaymentError(null);
      setIdempotencyKey(`idem_${Date.now()}_${Math.random().toString(16).slice(2, 7)}`);
    }
  }, [isOpen, initialStep]);

  if (!isOpen) return null;

  const totals = calculateCartTotals(
    cart,
    products,
    appliedPromoCode,
    coupons,
    shippingMethod
  );

  const activeBagItems = cart
    .filter((i) => !i.savedForLater && i.quantity > 0)
    .map((item) => {
      const product = products.find((p) => p.id === item.productId);
      return product ? { product, item } : null;
    })
    .filter((x): x is { product: Product; item: CartItem } => x !== null);

  const savedLaterItems = cart
    .filter((i) => i.savedForLater)
    .map((item) => {
      const product = products.find((p) => p.id === item.productId);
      return product ? { product, item } : null;
    })
    .filter((x): x is { product: Product; item: CartItem } => x !== null);

  const handleApplyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    const matched = coupons.find((c) => c.code === code && c.active);
    if (!matched) {
      setAppliedPromoCode('');
      setPromoFeedback('Invalid or inactive code. Try ATELIER10, WELCOME15, or FIRST5000.');
      return;
    }
    const rawTotals = calculateCartTotals(cart, products, '', coupons, shippingMethod);
    if (rawTotals.subtotal < matched.minOrderAmount) {
      setAppliedPromoCode('');
      setPromoFeedback(
        `Code ${code} requires a minimum subtotal of ${formatINR(matched.minOrderAmount)}.`
      );
      return;
    }
    setAppliedPromoCode(code);
    setPromoFeedback(`Applied ${code}: ${matched.description}`);
  };

  const handleProceedToGateway = (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateShippingAddress(shipping);
    if (!check.valid) {
      setShippingErrors(check.errors);
      return;
    }
    setShippingErrors({});
    setPaymentError(null);
    setStep('gateway');
  };

  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);

    const check = validatePaymentInput(paymentMethod, paymentDetails);
    if (!check.valid) {
      setPaymentError(check.error || 'Please check your payment details.');
      return;
    }

    if (paymentMethod === 'CARD' && step !== 'otp') {
      setStep('otp');
      return;
    }

    await executeCheckoutSubmission();
  };

  const executeCheckoutSubmission = async () => {
    setIsProcessing(true);
    setPaymentError(null);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.filter((i) => !i.savedForLater),
          promoCode: appliedPromoCode,
          shippingAddress: shipping,
          shippingMethod,
          paymentMethod,
          paymentDetails,
          idempotencyKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPaymentError(data.error || 'Payment gateway authorization failed.');
        setIsProcessing(false);
        return;
      }

      setCompletedOrder(data.order);
      setCompletedTxn(data.transaction);
      onCheckoutSuccess(data);
      setIsProcessing(false);
      setStep('receipt');
    } catch (err: unknown) {
      setPaymentError(
        err instanceof Error ? err.message : 'Network error communicating with gateway.'
      );
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-stone-950/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Bag and VervePay Payment Gateway"
    >
      <div className="relative w-full max-w-2xl h-full bg-[#FAF8F5] border-l border-stone-200 flex flex-col justify-between overflow-hidden shadow-2xl">
        {/* Top Drawer Header */}
        <div className="px-6 py-4 bg-white border-b border-stone-200 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-stone-500">
              <span>VervePay Enterprise Checkout</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">
                {step === 'cart' && '01 / Bag & Coupons'}
                {step === 'shipping' && '02 / Delivery & Transit Method'}
                {step === 'gateway' && '03 / Payment Gateway'}
                {step === 'otp' && '04 / 3DS Bank Verification'}
                {step === 'receipt' && 'Verified Order & AWB Receipt'}
              </span>
            </div>
            <h2 className="font-display text-xl font-semibold text-stone-900">
              {step === 'cart' && `Shopping Bag (${totals.itemCount})`}
              {step === 'shipping' && 'Recipient & Dispatch Verification'}
              {step === 'gateway' && 'Select Payment Method'}
              {step === 'otp' && '3D Secure 2.0 Bank OTP Verification'}
              {step === 'receipt' &&
                `Order ${completedOrder?.id || ''} Confirmed — Preparing Shipment`}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => {
              if (step === 'receipt') {
                setStep('cart');
              }
              onClose();
            }}
            aria-label="Close checkout drawer"
            className="w-9 h-9 rounded-lg border border-stone-200 flex items-center justify-center text-stone-600 hover:text-stone-950 hover:bg-stone-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* STEP 1: SHOPPING BAG */}
          {step === 'cart' && (
            <>
              {activeBagItems.length === 0 ? (
                <div className="py-14 text-center space-y-4">
                  <p className="font-display text-2xl text-stone-700">
                    Your active shopping bag is empty.
                  </p>
                  <p className="text-sm text-stone-500 max-w-md mx-auto">
                    Explore our acoustic monitors, spun brass lighting, and sculpted oak furniture
                    to begin an allocation.
                  </p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-lg bg-stone-900 text-stone-50 text-xs font-medium hover:bg-stone-800 transition-colors"
                  >
                    Explore Featured Collection
                  </button>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-stone-200 border-t border-b border-stone-200">
                    {activeBagItems.map(({ product, item }) => (
                      <div key={product.id} className="py-4 flex items-center gap-4">
                        <div className="w-20 h-16 rounded-lg overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
                          <ResilientImage
                            src={product.imageUrl}
                            alt={product.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-stone-500 flex items-center gap-1.5">
                            <span>{product.category}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono">{product.sku}</span>
                          </div>
                          <h3 className="text-sm font-semibold text-stone-900 truncate">
                            {product.title}
                          </h3>
                          <p className="font-mono text-xs text-stone-700 mt-0.5 tabular-nums">
                            {formatINR(product.price)} each
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center border border-stone-300 rounded-md bg-white">
                            <button
                              type="button"
                              aria-label={`Decrease quantity of ${product.title}`}
                              onClick={() => onUpdateCartQty(product.id, item.quantity - 1)}
                              className="w-7 h-7 flex items-center justify-center text-stone-600 hover:text-stone-950"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-7 text-center font-mono text-xs font-medium tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              aria-label={`Increase quantity of ${product.title}`}
                              onClick={() =>
                                onUpdateCartQty(
                                  product.id,
                                  Math.min(Math.max(1, product.stock), item.quantity + 1)
                                )
                              }
                              className="w-7 h-7 flex items-center justify-center text-stone-600 hover:text-stone-950"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <button
                            type="button"
                            title="Save for later"
                            aria-label={`Save ${product.title} for later`}
                            onClick={() => onToggleSaveForLater(product.id)}
                            className="p-1.5 text-stone-400 hover:text-stone-900 transition-colors"
                          >
                            <Bookmark className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            aria-label={`Remove ${product.title} from bag`}
                            onClick={() => onUpdateCartQty(product.id, 0)}
                            className="p-1.5 text-stone-400 hover:text-red-700 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Trade / Collector Promo Code */}
                  <div className="bg-white p-4 rounded-lg border border-stone-200 space-y-2">
                    <label
                      htmlFor="promo-code-input"
                      className="block text-xs font-medium text-stone-700"
                    >
                      Promotional / Studio Code (<span className="font-mono">ATELIER10</span>,{' '}
                      <span className="font-mono">WELCOME15</span>, or{' '}
                      <span className="font-mono">FIRST5000</span>)
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="promo-code-input"
                        type="text"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value)}
                        placeholder="Enter ATELIER10"
                        className="flex-1 px-3 py-2 text-xs font-mono uppercase rounded-lg border border-stone-300 bg-[#FAF8F5] focus:outline-none focus:border-stone-900"
                      />
                      <button
                        type="button"
                        onClick={handleApplyPromo}
                        className="px-4 py-2 rounded-lg bg-stone-900 text-stone-50 text-xs font-medium hover:bg-stone-800 transition-colors whitespace-nowrap shrink-0"
                      >
                        Apply Code
                      </button>
                    </div>
                    {promoFeedback && (
                      <p className="text-xs text-stone-600">{promoFeedback}</p>
                    )}
                  </div>

                  {/* Cost Breakdown */}
                  <div className="bg-white p-5 rounded-lg border border-stone-200 space-y-2.5 text-sm">
                    <div className="flex justify-between text-stone-600">
                      <span>Subtotal ({totals.itemCount} items)</span>
                      <span className="font-mono tabular-nums">{formatINR(totals.subtotal)}</span>
                    </div>
                    {totals.discount > 0 && (
                      <div className="flex justify-between text-emerald-800">
                        <span>Privilege Discount ({totals.appliedPromo})</span>
                        <span className="font-mono tabular-nums">
                          -{formatINR(totals.discount)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-stone-600">
                      <span>GST (18% IGST / CGST+SGST)</span>
                      <span className="font-mono tabular-nums">{formatINR(totals.gstAmount)}</span>
                    </div>
                    <div className="flex justify-between text-stone-600">
                      <span>
                        {shippingMethod === 'EXPRESS_AIR_CRATE'
                          ? 'BlueDart Express Air Crate'
                          : 'Insured White-Glove Surface'}
                      </span>
                      <span className="font-mono tabular-nums">
                        {totals.shippingFee === 0 ? 'Complimentary' : formatINR(totals.shippingFee)}
                      </span>
                    </div>
                    <div className="pt-3 border-t border-stone-200 flex justify-between items-baseline font-semibold text-stone-900 text-base">
                      <span>Total Payable</span>
                      <span className="font-mono text-lg tabular-nums">
                        {formatINR(totals.totalAmount)}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* Saved For Later Items */}
              {savedLaterItems.length > 0 && (
                <div className="bg-white p-4 rounded-lg border border-stone-200 space-y-3">
                  <div className="text-xs font-semibold text-stone-700">
                    Saved for Later ({savedLaterItems.length})
                  </div>
                  <div className="divide-y divide-stone-200">
                    {savedLaterItems.map(({ product }) => (
                      <div
                        key={product.id}
                        className="py-2.5 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-medium text-stone-900">{product.title}</span>
                          <span className="font-mono text-stone-500 ml-2">
                            {formatINR(product.price)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onToggleSaveForLater(product.id)}
                          className="text-stone-900 font-medium underline"
                        >
                          Move Back to Bag
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* STEP 2: SHIPPING ADDRESS & SHIPPING METHOD */}
          {step === 'shipping' && (
            <form id="shipping-form" onSubmit={handleProceedToGateway} className="space-y-4">
              <div className="flex items-center justify-between bg-stone-100 px-4 py-2.5 rounded-lg border border-stone-200 text-xs">
                <span className="text-stone-600">
                  Insured doorstep delivery across all Indian PIN codes.
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShipping({
                      fullName: 'Kabir Bedi-Desai',
                      email: 'kabir@desaistudio.in',
                      phone: '9820445566',
                      streetAddress: '19, Carmichael Road, Malabar Hill',
                      city: 'Mumbai',
                      state: 'Maharashtra',
                      pinCode: '400026',
                    });
                    setShippingErrors({});
                  }}
                  className="font-medium text-stone-900 underline hover:text-stone-700 whitespace-nowrap"
                >
                  Fill Demo Address
                </button>
              </div>

              {/* Shipping Method Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShippingMethod('STANDARD_WHITE_GLOVE')}
                  className={`p-3.5 rounded-lg border text-left text-xs transition-colors ${
                    shippingMethod === 'STANDARD_WHITE_GLOVE'
                      ? 'border-stone-900 bg-stone-900 text-stone-50'
                      : 'border-stone-300 bg-white text-stone-800'
                  }`}
                >
                  <div className="font-semibold">Standard Insured White-Glove (4–5 Days)</div>
                  <div className="font-mono text-[11px] opacity-80 mt-0.5">
                    Complimentary above ₹25,000 (else ₹450)
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setShippingMethod('EXPRESS_AIR_CRATE')}
                  className={`p-3.5 rounded-lg border text-left text-xs transition-colors ${
                    shippingMethod === 'EXPRESS_AIR_CRATE'
                      ? 'border-stone-900 bg-stone-900 text-stone-50'
                      : 'border-stone-300 bg-white text-stone-800'
                  }`}
                >
                  <div className="font-semibold">BlueDart Express Air Crate (48 Hours)</div>
                  <div className="font-mono text-[11px] opacity-80 mt-0.5">
                    Priority Air Timber Crate · +₹1,800
                  </div>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="ship-fullname"
                    className="block text-xs font-medium text-stone-700 mb-1"
                  >
                    Recipient Full Name
                  </label>
                  <input
                    id="ship-fullname"
                    type="text"
                    value={shipping.fullName}
                    onChange={(e) => setShipping({ ...shipping, fullName: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-stone-300 bg-white focus:outline-none focus:border-stone-900"
                  />
                  {shippingErrors.fullName && (
                    <p className="text-xs text-red-700 mt-1">{shippingErrors.fullName}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="ship-email"
                    className="block text-xs font-medium text-stone-700 mb-1"
                  >
                    Email for Tax Invoice
                  </label>
                  <input
                    id="ship-email"
                    type="email"
                    value={shipping.email}
                    onChange={(e) => setShipping({ ...shipping, email: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-stone-300 bg-white focus:outline-none focus:border-stone-900"
                  />
                  {shippingErrors.email && (
                    <p className="text-xs text-red-700 mt-1">{shippingErrors.email}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="ship-phone"
                    className="block text-xs font-medium text-stone-700 mb-1"
                  >
                    10-Digit Mobile Number
                  </label>
                  <input
                    id="ship-phone"
                    type="tel"
                    value={shipping.phone}
                    onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm font-mono rounded-lg border border-stone-300 bg-white focus:outline-none focus:border-stone-900"
                  />
                  {shippingErrors.phone && (
                    <p className="text-xs text-red-700 mt-1">{shippingErrors.phone}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="ship-pincode"
                    className="block text-xs font-medium text-stone-700 mb-1"
                  >
                    6-Digit PIN Code
                  </label>
                  <input
                    id="ship-pincode"
                    type="text"
                    value={shipping.pinCode}
                    onChange={(e) => setShipping({ ...shipping, pinCode: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm font-mono rounded-lg border border-stone-300 bg-white focus:outline-none focus:border-stone-900"
                  />
                  {shippingErrors.pinCode && (
                    <p className="text-xs text-red-700 mt-1">{shippingErrors.pinCode}</p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="ship-street"
                  className="block text-xs font-medium text-stone-700 mb-1"
                >
                  Street Address, Residence, or Architectural Studio
                </label>
                <input
                  id="ship-street"
                  type="text"
                  value={shipping.streetAddress}
                  onChange={(e) => setShipping({ ...shipping, streetAddress: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-stone-300 bg-white focus:outline-none focus:border-stone-900"
                />
                {shippingErrors.streetAddress && (
                  <p className="text-xs text-red-700 mt-1">{shippingErrors.streetAddress}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="ship-city"
                    className="block text-xs font-medium text-stone-700 mb-1"
                  >
                    City
                  </label>
                  <input
                    id="ship-city"
                    type="text"
                    value={shipping.city}
                    onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-stone-300 bg-white focus:outline-none focus:border-stone-900"
                  />
                  {shippingErrors.city && (
                    <p className="text-xs text-red-700 mt-1">{shippingErrors.city}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="ship-state"
                    className="block text-xs font-medium text-stone-700 mb-1"
                  >
                    State
                  </label>
                  <input
                    id="ship-state"
                    type="text"
                    value={shipping.state}
                    onChange={(e) => setShipping({ ...shipping, state: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-stone-300 bg-white focus:outline-none focus:border-stone-900"
                  />
                  {shippingErrors.state && (
                    <p className="text-xs text-red-700 mt-1">{shippingErrors.state}</p>
                  )}
                </div>
              </div>
            </form>
          )}

          {/* STEP 3: VERVEPAY / RAZORPAY PAYMENT GATEWAY */}
          {step === 'gateway' && (
            <form id="gateway-form" onSubmit={handleInitiatePayment} className="space-y-5">
              <div className="bg-stone-900 text-stone-50 p-4 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-xs text-stone-400">
                    VervePay Merchant ID · <span className="font-mono">MID_VRV_IN_9081</span>
                  </div>
                  <div className="text-sm font-medium mt-0.5">
                    Delivering to {shipping.fullName} ({shipping.city} — {shipping.pinCode})
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-stone-400">Total Amount</div>
                  <div className="font-mono text-lg font-semibold tabular-nums">
                    {formatINR(totals.totalAmount)}
                  </div>
                </div>
              </div>

              {/* Payment Method Segmented Selector */}
              <div
                className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1 bg-stone-200/80 rounded-lg"
                role="tablist"
                aria-label="Payment Gateway Methods"
              >
                {(
                  [
                    { id: 'UPI', label: 'UPI / QR', icon: QrCode },
                    { id: 'CARD', label: 'Card (3DS)', icon: CreditCard },
                    { id: 'NETBANKING', label: 'NetBanking', icon: Building2 },
                    { id: 'COD', label: 'Pay on Delivery', icon: Banknote },
                  ] as const
                ).map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={paymentMethod === id}
                    onClick={() => {
                      setPaymentMethod(id);
                      setPaymentError(null);
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                      paymentMethod === id
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              {/* Method 1: UPI QR + VPA */}
              {paymentMethod === 'UPI' && (
                <div className="bg-white p-5 rounded-lg border border-stone-200 space-y-4">
                  <div className="flex flex-col sm:flex-row items-center gap-5 pb-4 border-b border-stone-200">
                    <div className="w-28 h-28 p-2 bg-white border border-stone-300 rounded-lg shrink-0 flex items-center justify-center">
                      <svg viewBox="0 0 100 100" className="w-full h-full text-stone-900">
                        <rect x="5" y="5" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="6" />
                        <rect x="13" y="13" width="12" height="12" fill="currentColor" />
                        <rect x="67" y="5" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="6" />
                        <rect x="75" y="13" width="12" height="12" fill="currentColor" />
                        <rect x="5" y="67" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="6" />
                        <rect x="13" y="75" width="12" height="12" fill="currentColor" />
                        <rect x="42" y="10" width="8" height="8" fill="currentColor" />
                        <rect x="52" y="20" width="8" height="14" fill="currentColor" />
                        <rect x="40" y="40" width="20" height="20" fill="currentColor" />
                        <rect x="12" y="44" width="18" height="8" fill="currentColor" />
                        <rect x="68" y="44" width="10" height="18" fill="currentColor" />
                        <rect x="84" y="52" width="10" height="10" fill="currentColor" />
                        <rect x="42" y="68" width="14" height="8" fill="currentColor" />
                        <rect x="64" y="72" width="26" height="8" fill="currentColor" />
                        <rect x="46" y="84" width="18" height="10" fill="currentColor" />
                        <rect x="76" y="84" width="18" height="10" fill="currentColor" />
                      </svg>
                    </div>
                    <div className="space-y-1.5 text-center sm:text-left">
                      <div className="text-xs font-semibold text-stone-900">
                        Scan Dynamic BharatQR / UPI QR
                      </div>
                      <p className="text-xs text-stone-600 leading-relaxed">
                        Compatible with Google Pay, PhonePe, Paytm, BHIM, and CRED UPI. Zero
                        gateway convenience fee on UPI settlements.
                      </p>
                      <div className="font-mono text-xs text-stone-800">
                        Merchant VPA: verve.atelier@axisbank · {formatINR(totals.totalAmount)}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="gateway-upi-id"
                      className="block text-xs font-medium text-stone-700 mb-1"
                    >
                      Or Enter Virtual Payment Address (UPI ID)
                    </label>
                    <input
                      id="gateway-upi-id"
                      type="text"
                      value={paymentDetails.upiId || ''}
                      onChange={(e) =>
                        setPaymentDetails({ ...paymentDetails, upiId: e.target.value })
                      }
                      placeholder="username@okicici"
                      className="w-full px-3.5 py-2 text-sm font-mono rounded-lg border border-stone-300 bg-[#FAF8F5] focus:outline-none focus:border-stone-900"
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      {['@okicici', '@okhdfcbank', '@ybl', '@axl'].map((suffix) => (
                        <button
                          key={suffix}
                          type="button"
                          onClick={() => {
                            const prefix =
                              (paymentDetails.upiId || 'collector').split('@')[0] || 'collector';
                            setPaymentDetails({ ...paymentDetails, upiId: `${prefix}${suffix}` });
                          }}
                          className="px-2.5 py-1 text-xs font-mono rounded border border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100"
                        >
                          {suffix}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Method 2: Credit / Debit Card */}
              {paymentMethod === 'CARD' && (
                <div className="bg-white p-5 rounded-lg border border-stone-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-stone-600">
                      Visa, Mastercard, RuPay & American Express (3D Secure 2.0)
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setPaymentDetails({
                          ...paymentDetails,
                          cardNumber: '4242 4242 4242 8890',
                          cardName: 'VIKRAMADITYA SINGHANIA',
                          cardExpiry: '09/29',
                          cardCvv: '842',
                        })
                      }
                      className="text-xs font-medium text-stone-900 underline"
                    >
                      Fill Test Card (4242)
                    </button>
                  </div>

                  <div>
                    <label
                      htmlFor="gateway-card-number"
                      className="block text-xs font-medium text-stone-700 mb-1"
                    >
                      16-Digit Card Number
                    </label>
                    <input
                      id="gateway-card-number"
                      type="text"
                      value={paymentDetails.cardNumber || ''}
                      onChange={(e) =>
                        setPaymentDetails({ ...paymentDetails, cardNumber: e.target.value })
                      }
                      placeholder="4242 4242 4242 8890"
                      className="w-full px-3.5 py-2 text-sm font-mono rounded-lg border border-stone-300 bg-[#FAF8F5] focus:outline-none focus:border-stone-900"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="gateway-card-name"
                      className="block text-xs font-medium text-stone-700 mb-1"
                    >
                      Name on Card
                    </label>
                    <input
                      id="gateway-card-name"
                      type="text"
                      value={paymentDetails.cardName || ''}
                      onChange={(e) =>
                        setPaymentDetails({ ...paymentDetails, cardName: e.target.value })
                      }
                      placeholder="VIKRAMADITYA SINGHANIA"
                      className="w-full px-3.5 py-2 text-sm uppercase rounded-lg border border-stone-300 bg-[#FAF8F5] focus:outline-none focus:border-stone-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="gateway-card-expiry"
                        className="block text-xs font-medium text-stone-700 mb-1"
                      >
                        Expiry Date (MM/YY)
                      </label>
                      <input
                        id="gateway-card-expiry"
                        type="text"
                        value={paymentDetails.cardExpiry || ''}
                        onChange={(e) =>
                          setPaymentDetails({ ...paymentDetails, cardExpiry: e.target.value })
                        }
                        placeholder="09/29"
                        className="w-full px-3.5 py-2 text-sm font-mono rounded-lg border border-stone-300 bg-[#FAF8F5] focus:outline-none focus:border-stone-900"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="gateway-card-cvv"
                        className="block text-xs font-medium text-stone-700 mb-1"
                      >
                        CVV / Security Code
                      </label>
                      <input
                        id="gateway-card-cvv"
                        type="password"
                        maxLength={4}
                        value={paymentDetails.cardCvv || ''}
                        onChange={(e) =>
                          setPaymentDetails({ ...paymentDetails, cardCvv: e.target.value })
                        }
                        placeholder="842"
                        className="w-full px-3.5 py-2 text-sm font-mono rounded-lg border border-stone-300 bg-[#FAF8F5] focus:outline-none focus:border-stone-900"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Method 3: NetBanking */}
              {paymentMethod === 'NETBANKING' && (
                <div className="bg-white p-5 rounded-lg border border-stone-200 space-y-3">
                  <div className="text-xs font-medium text-stone-700">
                    Select Your Preferred Indian Retail or Corporate Bank
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      'HDFC Bank Corporate & Retail',
                      'ICICI Bank Infinity',
                      'State Bank of India (SBI)',
                      'Axis Bank Burgundy',
                      'Kotak Mahindra Bank',
                      'Yes Bank Private',
                    ].map((bank) => (
                      <button
                        key={bank}
                        type="button"
                        onClick={() =>
                          setPaymentDetails({ ...paymentDetails, bankCode: bank })
                        }
                        className={`p-3 rounded-lg border text-left text-xs font-medium transition-colors ${
                          paymentDetails.bankCode === bank
                            ? 'border-stone-900 bg-stone-900 text-stone-50'
                            : 'border-stone-200 bg-[#FAF8F5] text-stone-800 hover:bg-stone-100'
                        }`}
                      >
                        {bank}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Method 4: Cash on Delivery (COD) */}
              {paymentMethod === 'COD' && (
                <div className="bg-white p-5 rounded-lg border border-stone-200 space-y-4">
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-stone-900">
                      Pay on Delivery (Cash / UPI-at-Doorstep)
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      Total payable at delivery:{' '}
                      <strong className="font-mono">{formatINR(totals.totalAmount)}</strong>.
                      Complimentary white-glove delivery is active on orders above ₹25,000.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="gateway-cod-phone"
                      className="block text-xs font-medium text-stone-700 mb-1"
                    >
                      Confirm 10-Digit Mobile Number for Dispatch Verification Call
                    </label>
                    <input
                      id="gateway-cod-phone"
                      type="tel"
                      value={paymentDetails.codConfirmPhone || ''}
                      onChange={(e) =>
                        setPaymentDetails({
                          ...paymentDetails,
                          codConfirmPhone: e.target.value,
                        })
                      }
                      placeholder="9820194820"
                      className="w-full px-3.5 py-2 text-sm font-mono rounded-lg border border-stone-300 bg-[#FAF8F5] focus:outline-none focus:border-stone-900"
                    />
                  </div>
                </div>
              )}

              {paymentError && (
                <div
                  role="alert"
                  className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 font-medium"
                >
                  {paymentError}
                </div>
              )}
            </form>
          )}

          {/* STEP 4: 3DS CARD OTP VERIFICATION */}
          {step === 'otp' && (
            <div className="bg-white p-6 rounded-lg border border-stone-200 space-y-5">
              <div className="flex items-center justify-between border-b border-stone-200 pb-4">
                <div>
                  <div className="text-xs text-stone-500">RBI Mandate · 3D Secure 2.0 ACS</div>
                  <h3 className="text-base font-semibold text-stone-900">
                    Issuing Bank One-Time Password
                  </h3>
                </div>
                <Lock className="w-5 h-5 text-stone-700" />
              </div>

              <div className="p-3.5 rounded-lg bg-stone-100 border border-stone-200 text-xs text-stone-700 flex items-center justify-between">
                <span>
                  Simulated SMS sent to +91 ······{shipping.phone.slice(-4)}: Use OTP{' '}
                  <strong className="font-mono text-stone-950">482910</strong> for{' '}
                  <span className="font-mono">{formatINR(totals.totalAmount)}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setOtpInput('482910')}
                  className="font-medium underline text-stone-900 ml-2 shrink-0"
                >
                  Fill 482910
                </button>
              </div>

              <div>
                <label
                  htmlFor="bank-otp-input"
                  className="block text-xs font-medium text-stone-700 mb-1"
                >
                  Enter 6-Digit Bank Verification OTP
                </label>
                <input
                  id="bank-otp-input"
                  type="text"
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  className="w-full px-4 py-2.5 text-center text-lg font-mono tracking-widest rounded-lg border border-stone-300 bg-[#FAF8F5] focus:outline-none focus:border-stone-900"
                />
              </div>

              {paymentError && (
                <div
                  role="alert"
                  className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800"
                >
                  {paymentError}
                </div>
              )}
            </div>
          )}

          {/* STEP 5: ORDER CONFIRMED RECEIPT */}
          {step === 'receipt' && completedOrder && completedTxn && (
            <div className="space-y-5" data-testid="order-confirmation-receipt">
              <div className="bg-white p-6 rounded-lg border border-stone-200 space-y-4">
                <div className="flex items-start justify-between gap-4 border-b border-stone-200 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-emerald-800 text-xs font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Payment Verified & Warehouse Allocation Locked</span>
                    </div>
                    <h3 className="font-display text-2xl font-semibold text-stone-900">
                      Order {completedOrder.id} Confirmed
                    </h3>
                    <p className="text-xs text-stone-600">
                      Recipient: {completedOrder.customer.fullName} ·{' '}
                      {completedOrder.customer.streetAddress}, {completedOrder.customer.city} (
                      {completedOrder.customer.pinCode})
                    </p>
                    <p className="text-xs font-mono text-stone-700">
                      Carrier: {completedOrder.carrier} · AWB: {completedOrder.trackingNumber}
                    </p>
                  </div>
                  <div className="text-right font-mono text-xs text-stone-500">
                    <div>TXN: {completedTxn.id}</div>
                    <div className="mt-0.5">{completedTxn.status}</div>
                  </div>
                </div>

                {/* Gateway Telemetry Metadata */}
                <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-[#FAF8F5] p-3.5 rounded-lg border border-stone-200">
                  <div>
                    <dt className="text-stone-500">Payment Instrument</dt>
                    <dd className="font-mono font-medium text-stone-900 mt-0.5">
                      {completedTxn.methodSummary}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-stone-500">Amount Settled</dt>
                    <dd className="font-mono font-semibold text-stone-900 mt-0.5 tabular-nums">
                      {formatINR(completedOrder.totalAmount)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-stone-500">HMAC Signature</dt>
                    <dd className="font-mono text-stone-700 mt-0.5 truncate">
                      {completedTxn.signatureHash}
                    </dd>
                  </div>
                </dl>

                {/* Itemized Receipt */}
                <div className="space-y-2 pt-2">
                  <div className="text-xs font-semibold text-stone-700">
                    Allocated Objects ({completedOrder.items.length})
                  </div>
                  <div className="divide-y divide-stone-200 border-t border-b border-stone-200">
                    {completedOrder.items.map((item) => (
                      <div
                        key={item.productId}
                        className="py-2.5 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-medium text-stone-900">{item.title}</span>
                          <span className="text-stone-500 ml-2 font-mono">
                            ({item.sku} × {item.quantity})
                          </span>
                        </div>
                        <span className="font-mono text-stone-900 tabular-nums">
                          {formatINR(item.unitPrice * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Tax & Shipping Breakdown */}
                  <div className="pt-2 space-y-1.5 text-xs text-stone-600">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-mono tabular-nums">
                        {formatINR(completedOrder.subtotal)}
                      </span>
                    </div>
                    {completedOrder.discount > 0 && (
                      <div className="flex justify-between text-emerald-800">
                        <span>Privilege Discount ({completedOrder.promoCode})</span>
                        <span className="font-mono tabular-nums">
                          -{formatINR(completedOrder.discount)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>GST (18% Tax Invoice)</span>
                      <span className="font-mono tabular-nums">
                        {formatINR(completedOrder.gstAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{completedOrder.carrier}</span>
                      <span className="font-mono tabular-nums">
                        {completedOrder.shippingFee === 0
                          ? 'Complimentary'
                          : formatINR(completedOrder.shippingFee)}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-stone-200 flex justify-between font-semibold text-stone-900 text-sm">
                      <span>Total Settled</span>
                      <span className="font-mono tabular-nums">
                        {formatINR(completedOrder.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Sticky Action Footer */}
        <div className="px-6 py-4 bg-white border-t border-stone-200 flex items-center justify-between gap-3">
          {step === 'cart' && (
            <>
              <div className="text-xs text-stone-500 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-stone-700" />
                <span>UPI · Visa · Mastercard · NetBanking · COD</span>
              </div>
              <button
                type="button"
                disabled={activeBagItems.length === 0}
                onClick={() => setStep('shipping')}
                className="px-5 py-2.5 rounded-lg bg-stone-900 text-stone-50 text-xs font-semibold hover:bg-stone-800 disabled:opacity-40 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                <span>Proceed to Checkout · {formatINR(totals.totalAmount)}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}

          {step === 'shipping' && (
            <>
              <button
                type="button"
                onClick={() => setStep('cart')}
                className="px-4 py-2.5 rounded-lg border border-stone-300 text-stone-700 text-xs font-medium hover:bg-stone-100 transition-colors flex items-center gap-1.5 whitespace-nowrap"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Bag</span>
              </button>
              <button
                type="submit"
                form="shipping-form"
                className="px-5 py-2.5 rounded-lg bg-stone-900 text-stone-50 text-xs font-semibold hover:bg-stone-800 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                <span>Continue to Payment Gateway</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}

          {step === 'gateway' && (
            <>
              <button
                type="button"
                onClick={() => setStep('shipping')}
                className="px-4 py-2.5 rounded-lg border border-stone-300 text-stone-700 text-xs font-medium hover:bg-stone-100 transition-colors flex items-center gap-1.5 whitespace-nowrap"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Edit Address</span>
              </button>
              <button
                type="submit"
                form="gateway-form"
                disabled={isProcessing}
                className="px-6 py-2.5 rounded-lg bg-stone-900 text-stone-50 text-xs font-semibold hover:bg-stone-800 disabled:opacity-50 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>
                  {isProcessing
                    ? 'Authorizing Gateway...'
                    : `Authorize & Pay ${formatINR(totals.totalAmount)}`}
                </span>
              </button>
            </>
          )}

          {step === 'otp' && (
            <>
              <button
                type="button"
                onClick={() => setStep('gateway')}
                className="px-4 py-2.5 rounded-lg border border-stone-300 text-stone-700 text-xs font-medium hover:bg-stone-100 transition-colors whitespace-nowrap"
              >
                Change Method
              </button>
              <button
                type="button"
                disabled={isProcessing || otpInput.trim().length < 4}
                onClick={executeCheckoutSubmission}
                className="px-6 py-2.5 rounded-lg bg-stone-900 text-stone-50 text-xs font-semibold hover:bg-stone-800 disabled:opacity-50 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>
                  {isProcessing
                    ? 'Verifying 3DS Token...'
                    : `Verify OTP & Complete Payment (${formatINR(totals.totalAmount)})`}
                </span>
              </button>
            </>
          )}

          {step === 'receipt' && (
            <>
              <button
                type="button"
                onClick={() => {
                  setStep('cart');
                  onClose();
                }}
                className="px-4 py-2.5 rounded-lg border border-stone-300 text-stone-700 text-xs font-medium hover:bg-stone-100 transition-colors whitespace-nowrap"
              >
                Continue Browsing Storefront
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep('cart');
                  onClose();
                  onNavigateToOrders();
                }}
                className="px-5 py-2.5 rounded-lg bg-stone-900 text-stone-50 text-xs font-semibold hover:bg-stone-800 transition-colors whitespace-nowrap shrink-0"
              >
                View Live Order Timeline & AWB
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
