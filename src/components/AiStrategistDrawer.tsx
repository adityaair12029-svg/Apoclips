import React, { useState } from 'react';
import { X, Send, Cpu, Compass, BarChart3 } from 'lucide-react';

interface AiStrategistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_PROMPTS = [
  {
    mode: 'merchant' as const,
    label: 'Bundle & Margin Optimization',
    prompt:
      'Analyze our live catalog margins, low-stock SKUs, and gateway fees to design a high-converting 3-piece Architectural Listening Suite bundle with tiered INR pricing.',
  },
  {
    mode: 'merchant' as const,
    label: 'Inventory Restock Priority',
    prompt:
      'Which SKUs in our current catalog carry the highest stockout revenue risk, and how should we sequence production across our Ahmedabad, Jaipur, and Bengaluru workshops?',
  },
  {
    mode: 'concierge' as const,
    label: '450 sq ft Studio Acoustic Curation',
    prompt:
      'Recommend a complete acoustic, lighting, and seating curation for a 450 sq ft limestone architect studio under ₹1,75,000 including GST.',
  },
];

export const AiStrategistDrawer: React.FC<AiStrategistDrawerProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<'merchant' | 'concierge'>('merchant');
  const [query, setQuery] = useState(PRESET_PROMPTS[0].prompt);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    model: string;
    thinkingLevel: string;
    reply: string;
    apiNotice?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRunStrategist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/strategist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, mode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Unable to complete analysis.');
      } else {
        setResult(data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-stone-950/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="High-Thinking AI Merchandising and Spatial Strategist"
    >
      <div className="relative w-full max-w-xl h-full bg-[#FAF8F5] border-l border-stone-200 flex flex-col justify-between shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-stone-200 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-stone-500">
              <Cpu className="w-3.5 h-3.5 text-stone-700" />
              <span className="font-mono">gemini-4-argon · ThinkingLevel.HIGH</span>
            </div>
            <h2 className="font-display text-xl font-semibold text-stone-900">
              Atelier Reasoning & Merchandising Strategist
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close AI strategist drawer"
            className="w-9 h-9 rounded-lg border border-stone-200 flex items-center justify-center text-stone-600 hover:text-stone-950 hover:bg-stone-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Mode Selector */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-stone-200/80 rounded-lg">
            <button
              type="button"
              onClick={() => setMode('merchant')}
              className={`py-2 px-3 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                mode === 'merchant'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Merchant Pricing & Stock</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('concierge')}
              className={`py-2 px-3 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                mode === 'concierge'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Collector Spatial Concierge</span>
            </button>
          </div>

          {/* Preset Prompts */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-stone-600">
              Deep Reasoning Scenarios (Live Catalog + Ledger Context)
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESET_PROMPTS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setMode(preset.mode);
                    setQuery(preset.prompt);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-xs text-stone-800 hover:bg-stone-100 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Form */}
          <form onSubmit={handleRunStrategist} className="space-y-3">
            <label htmlFor="strategist-query" className="block text-xs font-medium text-stone-700">
              Strategic Query
            </label>
            <textarea
              id="strategist-query"
              rows={3}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a complex pricing, inventory allocation, or architectural pairing question..."
              className="w-full p-3.5 text-sm rounded-lg border border-stone-300 bg-white focus:outline-none focus:border-stone-900"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-stone-900 text-stone-50 text-xs font-semibold hover:bg-stone-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {loading
                  ? 'Running High-Thinking Analysis (gemini-4-argon)...'
                  : 'Run High-Thinking Synthesis'}
              </span>
            </button>
          </form>

          {error && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
              {error}
            </div>
          )}

          {result && (
            <div
              className="bg-white p-5 rounded-lg border border-stone-200 space-y-3"
              data-testid="ai-strategist-output"
            >
              <div className="flex items-center justify-between text-xs text-stone-500 border-b border-stone-200 pb-2">
                <span className="font-mono">Model: {result.model}</span>
                <span className="font-mono">Thinking: {result.thinkingLevel}</span>
              </div>
              <div className="text-xs sm:text-sm text-stone-800 whitespace-pre-line leading-relaxed">
                {result.reply}
              </div>
              {result.apiNotice && (
                <div className="pt-2 border-t border-stone-200 text-[11px] text-stone-500">
                  {result.apiNotice}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
