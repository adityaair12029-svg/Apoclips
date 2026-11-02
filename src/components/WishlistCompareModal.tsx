import React from 'react';
import { X, Trash2, ShoppingBag } from 'lucide-react';
import { Product, formatINR } from '../utils/commerce';
import { ResilientImage } from './ResilientImage';

interface WishlistCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  wishlistIds: string[];
  compareIds: string[];
  onRemoveWishlist: (id: string) => void;
  onRemoveCompare: (id: string) => void;
  onMoveToBag: (product: Product) => void;
}

export const WishlistCompareModal: React.FC<WishlistCompareModalProps> = ({
  isOpen,
  onClose,
  products,
  wishlistIds,
  compareIds,
  onRemoveWishlist,
  onRemoveCompare,
  onMoveToBag,
}) => {
  if (!isOpen) return null;

  const wishlistedProducts = products.filter((p) => wishlistIds.includes(p.id));
  const comparedProducts = products.filter((p) => compareIds.includes(p.id));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-xs p-4 md:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Saved Wishlist and Side-by-Side Product Comparison"
    >
      <div className="relative w-full max-w-5xl bg-[#FAF8F5] border border-stone-200 rounded-xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 bg-white border-b border-stone-200 flex items-center justify-between">
          <div>
            <div className="text-xs text-stone-500">
              Collector Shortlist · Persistent Storage
            </div>
            <h2 className="font-display text-2xl font-semibold text-stone-900">
              Saved Wishlist ({wishlistedProducts.length}) & Side-by-Side Comparison (
              {comparedProducts.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close wishlist and comparison modal"
            className="w-9 h-9 rounded-lg border border-stone-200 flex items-center justify-center text-stone-600 hover:text-stone-950"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-8">
          {/* SECTION 1: SIDE-BY-SIDE TECHNICAL COMPARISON */}
          <div className="space-y-3">
            <h3 className="font-display text-xl font-semibold text-stone-900">
              01. Side-by-Side Architectural & Technical Comparison
            </h3>
            {comparedProducts.length === 0 ? (
              <div className="p-6 bg-white rounded-lg border border-stone-200 text-xs text-stone-500">
                No products selected for comparison yet. Click "Compare" on any product card to
                inspect specifications side by side.
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-stone-200 overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50/70">
                      <th className="py-3 px-4 font-medium text-stone-500 w-40">Specification</th>
                      {comparedProducts.map((p) => (
                        <th key={p.id} className="py-3 px-4 font-semibold text-stone-900 min-w-52">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="font-mono text-[11px] text-stone-500">{p.sku}</span>
                            <button
                              type="button"
                              aria-label={`Remove ${p.title} from comparison`}
                              onClick={() => onRemoveCompare(p.id)}
                              className="text-stone-400 hover:text-red-700"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="text-sm font-semibold">{p.title}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    <tr>
                      <td className="py-2.5 px-4 text-stone-500">Unit Price (INR)</td>
                      {comparedProducts.map((p) => (
                        <td
                          key={p.id}
                          className="py-2.5 px-4 font-mono font-semibold text-stone-900 tabular-nums"
                        >
                          {formatINR(p.price)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 text-stone-500">Brand & Origin</td>
                      {comparedProducts.map((p) => (
                        <td key={p.id} className="py-2.5 px-4 text-stone-800">
                          {p.brand} · {p.origin}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 text-stone-500">Primary Material</td>
                      {comparedProducts.map((p) => (
                        <td key={p.id} className="py-2.5 px-4 text-stone-800">
                          {p.material}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 text-stone-500">Dimensions</td>
                      {comparedProducts.map((p) => (
                        <td key={p.id} className="py-2.5 px-4 font-mono text-stone-800">
                          {p.dimensions}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 text-stone-500">Rating & Reviews</td>
                      {comparedProducts.map((p) => (
                        <td key={p.id} className="py-2.5 px-4 font-mono text-stone-800">
                          ★ {p.ratingAvg.toFixed(1)} ({p.reviewCount} reviews)
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 text-stone-500">Warranty & Availability</td>
                      {comparedProducts.map((p) => (
                        <td key={p.id} className="py-2.5 px-4 text-stone-800">
                          {p.warranty} · {p.stock} units in stock
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-stone-500">Action</td>
                      {comparedProducts.map((p) => (
                        <td key={p.id} className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => onMoveToBag(p)}
                            className="px-3.5 py-1.5 rounded bg-stone-900 text-stone-50 text-xs font-medium hover:bg-stone-800"
                          >
                            Add to Bag
                          </button>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SECTION 2: SAVED WISHLIST */}
          <div className="space-y-3">
            <h3 className="font-display text-xl font-semibold text-stone-900">
              02. Saved Collector Wishlist ({wishlistedProducts.length})
            </h3>
            {wishlistedProducts.length === 0 ? (
              <div className="p-6 bg-white rounded-lg border border-stone-200 text-xs text-stone-500">
                Your wishlist is empty. Save architectural objects to monitor stock allocations and
                move them to your bag anytime.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {wishlistedProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white p-4 rounded-lg border border-stone-200 flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-14 rounded overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                        <ResilientImage
                          src={product.imageUrl}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-mono text-stone-500">{product.sku}</div>
                        <div className="text-sm font-semibold text-stone-900 truncate">
                          {product.title}
                        </div>
                        <div className="font-mono text-xs text-stone-800 tabular-nums">
                          {formatINR(product.price)} · {product.stock} in stock
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-100">
                      <button
                        type="button"
                        onClick={() => onRemoveWishlist(product.id)}
                        className="text-xs text-stone-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                      <button
                        type="button"
                        onClick={() => onMoveToBag(product)}
                        className="px-3 py-1.5 rounded bg-stone-900 text-stone-50 text-xs font-medium hover:bg-stone-800 flex items-center gap-1.5"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Move to Bag</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
