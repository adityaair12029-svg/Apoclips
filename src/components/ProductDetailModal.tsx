import React, { useState } from 'react';
import {
  X,
  Plus,
  Minus,
  ShieldCheck,
  Truck,
  ArrowUpRight,
  Heart,
  Scale,
  ZoomIn,
  CheckCircle2,
} from 'lucide-react';
import { Product, ProductReview, formatINR } from '../utils/commerce';
import { ResilientImage } from './ResilientImage';

interface ProductDetailModalProps {
  product: Product | null;
  reviews: ProductReview[];
  isWishlisted: boolean;
  isCompared: boolean;
  onClose: () => void;
  onAddToCart: (
    product: Product,
    quantity: number,
    openCheckoutImmediately?: boolean,
    variantId?: string
  ) => void;
  onToggleWishlist: (productId: string) => void;
  onToggleCompare: (productId: string) => void;
  onReviewSubmitted: (updatedProducts: Product[], updatedReviews: ProductReview[]) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  reviews,
  isWishlisted,
  isCompared,
  onClose,
  onAddToCart,
  onToggleWishlist,
  onToggleCompare,
  onReviewSubmitted,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  // Review Form State
  const [reviewAuthor, setReviewAuthor] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (product) {
      setQuantity(1);
      setActiveImageIdx(0);
      setIsZoomed(false);
      setSelectedVariantId(product.variants?.[0]?.id || '');
      setReviewMessage(null);
    }
  }, [product]);

  if (!product) return null;

  const maxQty = Math.max(1, product.stock);
  const gallery =
    product.galleryUrls && product.galleryUrls.length > 0
      ? product.galleryUrls
      : [product.imageUrl];

  const activeVariant = product.variants?.find((v) => v.id === selectedVariantId);
  const effectivePrice = product.price + (activeVariant?.priceDelta || 0);
  const productReviews = reviews.filter(
    (r) => r.productId === product.id && r.status === 'Approved'
  );

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewAuthor.trim() || !reviewTitle.trim() || !reviewComment.trim()) return;
    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/products/${product.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName: reviewAuthor,
          rating: reviewRating,
          title: reviewTitle,
          comment: reviewComment,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        onReviewSubmitted(data.products, data.reviews);
        setReviewAuthor('');
        setReviewTitle('');
        setReviewComment('');
        setReviewMessage('Verified review published to catalog.');
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-xs p-4 md:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdp-modal-title"
    >
      <div className="relative w-full max-w-5xl bg-[#FAF8F5] border border-stone-200 rounded-xl shadow-xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close product details"
          className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-lg bg-[#FAF8F5]/90 border border-stone-200 text-stone-700 hover:text-stone-950 hover:bg-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 items-stretch">
            {/* Left Column: Multi-Image Studio Gallery & Zoom */}
            <div className="md:col-span-6 bg-stone-100 flex flex-col justify-between p-4 sm:p-6 border-b md:border-b-0 md:border-r border-stone-200">
              <div
                onClick={() => setIsZoomed((z) => !z)}
                className="relative rounded-lg overflow-hidden bg-white border border-stone-200 cursor-zoom-in flex-1 flex items-center justify-center min-h-[280px]"
              >
                <ResilientImage
                  src={gallery[activeImageIdx] || product.imageUrl}
                  alt={product.title}
                  fallbackLabel={product.title}
                  className={`w-full h-full max-h-[420px] object-cover transition-transform duration-200 ${
                    isZoomed ? 'scale-125' : 'scale-100'
                  }`}
                />
                <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded bg-stone-900/80 text-stone-50 text-[11px] flex items-center gap-1">
                  <ZoomIn className="w-3 h-3" />
                  <span>{isZoomed ? 'Reset Zoom' : 'Click to Zoom'}</span>
                </span>
              </div>

              {gallery.length > 1 && (
                <div className="flex items-center gap-2.5 mt-3">
                  {gallery.map((imgUrl, idx) => (
                    <button
                      key={imgUrl + idx}
                      type="button"
                      onClick={() => setActiveImageIdx(idx)}
                      className={`w-16 h-12 rounded overflow-hidden border transition-colors ${
                        activeImageIdx === idx
                          ? 'border-stone-950 ring-1 ring-stone-950'
                          : 'border-stone-300 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <ResilientImage
                        src={imgUrl}
                        alt={`${product.title} view ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Contiguous Purchase Module */}
            <div className="md:col-span-6 p-6 md:p-8 flex flex-col justify-between">
              <div>
                {/* Zero-pill metadata line */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 mb-2">
                  <span>{product.brand}</span>
                  <span aria-hidden="true">·</span>
                  <span>{product.category}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono">{product.sku}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-stone-800">
                    ★ {product.ratingAvg.toFixed(1)} ({product.reviewCount} reviews)
                  </span>
                </div>

                <h2
                  id="pdp-modal-title"
                  className="font-display text-2xl md:text-3xl font-semibold text-stone-900 leading-tight mb-3"
                >
                  {product.title}
                </h2>

                <div className="flex flex-wrap items-baseline gap-3 mb-4 pb-4 border-b border-stone-200">
                  <span className="font-mono text-2xl font-semibold text-stone-900 tabular-nums">
                    {formatINR(effectivePrice)}
                  </span>
                  {product.mrp && product.mrp > effectivePrice && (
                    <span className="font-mono text-sm text-stone-400 line-through tabular-nums">
                      {formatINR(product.mrp)}
                    </span>
                  )}
                  <span className="text-xs text-stone-500">
                    Excl. 18% GST · Free white-glove transit above ₹25,000
                  </span>
                </div>

                <p className="text-sm text-stone-700 leading-relaxed mb-5">
                  {product.description}
                </p>

                {/* Variant Selection */}
                {product.variants && product.variants.length > 0 && (
                  <div className="mb-5">
                    <div className="text-xs font-medium text-stone-700 mb-2">
                      Select Architectural Finish / Variant
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {product.variants.map((variant) => (
                        <button
                          key={variant.id}
                          type="button"
                          onClick={() => setSelectedVariantId(variant.id)}
                          className={`p-2.5 rounded-lg border text-left text-xs transition-colors ${
                            selectedVariantId === variant.id
                              ? 'border-stone-900 bg-stone-900 text-stone-50'
                              : 'border-stone-300 bg-white text-stone-800 hover:bg-stone-100'
                          }`}
                        >
                          <div className="font-medium">{variant.name}</div>
                          <div className="font-mono text-[11px] opacity-80">
                            {variant.priceDelta > 0
                              ? `+${formatINR(variant.priceDelta)}`
                              : 'Standard Finish'}{' '}
                            · {variant.stock} in stock
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Architectural Specifications */}
                <dl className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-xs border-t border-b border-stone-200 py-3.5 mb-5">
                  <div>
                    <dt className="text-stone-500">Material & Finish</dt>
                    <dd className="font-medium text-stone-900">{product.material}</dd>
                  </div>
                  <div>
                    <dt className="text-stone-500">Dimensions</dt>
                    <dd className="font-mono text-stone-900">{product.dimensions}</dd>
                  </div>
                  <div>
                    <dt className="text-stone-500">Warranty & Origin</dt>
                    <dd className="font-medium text-stone-900">
                      {product.warranty} · {product.origin}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-stone-500">Warehouse Stock</dt>
                    <dd className="font-mono text-stone-900">
                      {product.stock > 0
                        ? `${product.stock} units (${product.warehouseId})`
                        : 'Out of stock'}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Purchase & Secondary Actions */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-stone-300 rounded-lg bg-white">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-10 h-10 flex items-center justify-center text-stone-700 hover:text-stone-950"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-10 text-center font-mono text-sm font-medium tabular-nums">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                      className="w-10 h-10 flex items-center justify-center text-stone-700 hover:text-stone-950"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={product.stock <= 0}
                    onClick={() => {
                      onAddToCart(product, quantity, false, selectedVariantId);
                      onClose();
                    }}
                    className="flex-1 py-2.5 px-5 rounded-lg bg-stone-900 text-stone-50 text-sm font-medium hover:bg-stone-800 disabled:opacity-40 transition-colors whitespace-nowrap shrink-0"
                  >
                    {product.stock > 0
                      ? `Add to Bag · ${formatINR(effectivePrice * quantity)}`
                      : 'Currently Unavailable'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => onToggleWishlist(product.id)}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                      isWishlisted
                        ? 'border-stone-900 bg-stone-200 text-stone-950'
                        : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <Heart className="w-3.5 h-3.5" />
                    <span>{isWishlisted ? 'Saved in Wishlist' : 'Save to Wishlist'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleCompare(product.id)}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                      isCompared
                        ? 'border-stone-900 bg-stone-200 text-stone-950'
                        : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <Scale className="w-3.5 h-3.5" />
                    <span>{isCompared ? 'In Comparison' : 'Compare Specs'}</span>
                  </button>
                </div>

                {product.stock > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      onAddToCart(product, quantity, true, selectedVariantId);
                      onClose();
                    }}
                    className="w-full py-2 px-4 rounded-lg border border-stone-300 bg-white text-stone-900 text-xs font-semibold hover:bg-stone-100 transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <span>Instant Checkout via VervePay Gateway</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}

                <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-stone-700" />
                    256-bit HMAC Verified Gateway
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-stone-700" />
                    Insured Atelier Transit
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section: Verified Reviews & Submit Review */}
          <div className="border-t border-stone-200 p-6 md:p-8 bg-white grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-7 space-y-4">
              <h3 className="font-display text-xl font-semibold text-stone-900">
                Verified Collector & Architect Reviews ({productReviews.length})
              </h3>
              {productReviews.length === 0 ? (
                <p className="text-xs text-stone-500">
                  Be the first collector to review {product.title}.
                </p>
              ) : (
                <div className="space-y-3">
                  {productReviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-4 rounded-lg bg-[#FAF8F5] border border-stone-200 space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs text-stone-500">
                        <span className="font-semibold text-stone-900">
                          {rev.authorName} · ★ {rev.rating}/5
                        </span>
                        <span>
                          {rev.verifiedPurchase ? 'Verified Commission' : 'Studio Review'}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-stone-800">{rev.title}</div>
                      <p className="text-xs text-stone-600 leading-relaxed">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleReviewSubmit} className="md:col-span-5 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-700">
                Log a Commission Review
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  required
                  value={reviewAuthor}
                  onChange={(e) => setReviewAuthor(e.target.value)}
                  placeholder="Your Name / Studio"
                  aria-label="Reviewer Name"
                  className="col-span-2 px-3 py-1.5 text-xs rounded-lg border border-stone-300 bg-[#FAF8F5]"
                />
                <select
                  aria-label="Review Rating"
                  value={reviewRating}
                  onChange={(e) => setReviewRating(Number(e.target.value))}
                  className="px-2 py-1.5 text-xs font-mono rounded-lg border border-stone-300 bg-[#FAF8F5]"
                >
                  <option value={5}>5 ★</option>
                  <option value={4}>4 ★</option>
                  <option value={3}>3 ★</option>
                </select>
              </div>
              <input
                type="text"
                required
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                placeholder="Review Headline"
                aria-label="Review Headline"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 bg-[#FAF8F5]"
              />
              <textarea
                rows={2}
                required
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share acoustic, finish, or spatial observations..."
                aria-label="Review Comment"
                className="w-full p-2.5 text-xs rounded-lg border border-stone-300 bg-[#FAF8F5]"
              />
              <button
                type="submit"
                disabled={submittingReview}
                className="w-full py-2 px-4 rounded-lg bg-stone-900 text-stone-50 text-xs font-medium hover:bg-stone-800"
              >
                {submittingReview ? 'Publishing...' : 'Publish Verified Review'}
              </button>
              {reviewMessage && (
                <p className="text-xs text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{reviewMessage}</span>
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
