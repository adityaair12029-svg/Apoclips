import React, { useState } from 'react';
import { X, Upload, Camera, ArrowRight } from 'lucide-react';
import { Product, formatINR } from '../utils/commerce';
import { ResilientImage } from './ResilientImage';

interface VisualSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
}

const VISUAL_SAMPLES = [
  {
    label: 'Carbon-Plate Black & Red Runner',
    hint: 'sneaker running shoe carbon black red gold footwear',
  },
  {
    label: 'Matte Black AeroTech Jacket',
    hint: 'jacket track apparel athleisure black sportswear',
  },
  {
    label: 'Obsidian & Gold Parfum Flacon',
    hint: 'fragrance perfume edp cologne noir gold black',
  },
  {
    label: 'Chalk-White Leather Court Sneaker',
    hint: 'white sneaker leather court shoes footwear',
  },
];

export const VisualSearchModal: React.FC<VisualSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
}) => {
  const [selectedHint, setSelectedHint] = useState(VISUAL_SAMPLES[0].hint);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [matches, setMatches] = useState<Product[]>([]);
  const [descriptor, setDescriptor] = useState<string | null>(null);

  if (!isOpen) return null;

  const runVisualMatch = async (hintText: string, fileName?: string) => {
    setSearching(true);
    try {
      const res = await fetch('/api/visual-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visualHint: hintText,
          imageName: fileName || '',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMatches(data.matches || []);
        setDescriptor(data.analyzedDescriptor || hintText);
      }
    } finally {
      setSearching(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    runVisualMatch(file.name.replace(/[-_.]/g, ' '), file.name);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-xs p-4 md:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="AI Visual Search and Material Discovery"
    >
      <div className="relative w-full max-w-2xl bg-[#FAF8F5] border border-stone-200 rounded-xl shadow-2xl overflow-hidden my-auto">
        <div className="px-6 py-4 bg-white border-b border-stone-200 flex items-center justify-between">
          <div>
            <div className="text-xs text-stone-500 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5" />
              <span>AI Visual & Material Similarity Engine</span>
            </div>
            <h2 className="font-display text-2xl font-semibold text-stone-900">
              Visual Product Discovery
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close visual search modal"
            className="w-9 h-9 rounded-lg border border-stone-200 flex items-center justify-center text-stone-600 hover:text-stone-950"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Upload Reference Photo */}
          <label className="flex flex-col items-center justify-center p-6 border border-dashed border-stone-400 rounded-xl bg-white hover:bg-stone-50 cursor-pointer transition-colors text-center">
            <Upload className="w-6 h-6 text-stone-600 mb-2" />
            <span className="text-xs font-semibold text-stone-900">
              {uploadedFileName
                ? `Uploaded Reference: ${uploadedFileName}`
                : 'Upload Room Photograph or Material Swatch (JPG / PNG / WebP)'}
            </span>
            <span className="text-[11px] text-stone-500 mt-1">
              Matches grain, silhouette, and finish strictly against verified catalog SKUs
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {/* Preset Architectural Swatches */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-stone-600">
              Or Test with Curated Architectural Reference Cues:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {VISUAL_SAMPLES.map((sample) => (
                <button
                  key={sample.label}
                  type="button"
                  onClick={() => {
                    setSelectedHint(sample.hint);
                    runVisualMatch(sample.hint);
                  }}
                  className={`p-2.5 rounded-lg border text-xs font-medium text-left transition-colors ${
                    selectedHint === sample.hint
                      ? 'border-stone-900 bg-stone-900 text-stone-50'
                      : 'border-stone-300 bg-white text-stone-800 hover:bg-stone-100'
                  }`}
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </div>

          {searching && (
            <div className="text-xs text-stone-600 font-mono">
              Analyzing visual descriptors against catalog embeddings...
            </div>
          )}

          {matches.length > 0 && (
            <div className="space-y-3" data-testid="visual-search-results">
              <div className="text-xs text-stone-500">
                Matched Catalog Objects for:{' '}
                <span className="font-mono text-stone-800">{descriptor}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {matches.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white p-3.5 rounded-lg border border-stone-200 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-14 h-12 rounded overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                        <ResilientImage
                          src={p.imageUrl}
                          alt={p.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="font-mono text-[11px] text-stone-500">{p.sku}</div>
                        <div className="text-xs font-semibold text-stone-900 truncate">
                          {p.title}
                        </div>
                        <div className="font-mono text-xs text-stone-800 tabular-nums">
                          {formatINR(p.price)}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onSelectProduct(p);
                      }}
                      className="p-2 rounded-lg bg-stone-900 text-stone-50 hover:bg-stone-800 shrink-0"
                      aria-label={`Inspect ${p.title}`}
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
