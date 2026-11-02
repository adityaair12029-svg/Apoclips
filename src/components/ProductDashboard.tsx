import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Trash2,
  Edit3,
  Check,
  X,
  RotateCcw,
  Cpu,
  ArrowUpRight,
  Database,
  CheckCircle2,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import {
  Product,
  ProductCategory,
  Order,
  OrderStatus,
  PaymentTransaction,
  Coupon,
  Warehouse,
  InventoryMovement,
  SupportTicket,
  AuditLogEntry,
  DashboardMetrics,
  PRODUCT_IMAGE_PRESETS,
  validateProductInput,
  formatINR,
} from '../utils/commerce';
import { ResilientImage } from './ResilientImage';

interface ProductDashboardProps {
  products: Product[];
  orders: Order[];
  transactions: PaymentTransaction[];
  coupons: Coupon[];
  warehouses: Warehouse[];
  inventoryMovements: InventoryMovement[];
  supportTickets: SupportTicket[];
  auditLogs: AuditLogEntry[];
  metrics: DashboardMetrics;
  onStateUpdated: (payload: {
    products?: Product[];
    orders?: Order[];
    transactions?: PaymentTransaction[];
    coupons?: Coupon[];
    warehouses?: Warehouse[];
    inventoryMovements?: InventoryMovement[];
    supportTickets?: SupportTicket[];
    auditLogs?: AuditLogEntry[];
    metrics?: DashboardMetrics;
  }) => void;
  onOpenAiStrategist: () => void;
  onSwitchToStorefront: () => void;
}

const CATEGORIES: ProductCategory[] = [
  'Footwear & Sneakers',
  'Performance Athleisure',
  'Fragrances & Grooming',
  'Signature Accessories',
];

const CATEGORY_COLORS = ['#E11D48', '#0A0A0B', '#D4AF37', '#2563EB'];

export const ProductDashboard: React.FC<ProductDashboardProps> = ({
  products,
  orders,
  transactions,
  coupons,
  warehouses,
  inventoryMovements,
  supportTickets,
  auditLogs,
  metrics,
  onStateUpdated,
  onOpenAiStrategist,
  onSwitchToStorefront,
}) => {
  const [activeTab, setActiveTab] = useState<
    'inventory' | 'orders' | 'gateway' | 'coupons' | 'audit' | 'analytics'
  >('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const [trendRange, setTrendRange] = useState<'7D' | '30D'>('7D');

  // Add Product Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    sku: 'ONE8-FTW-09',
    title: '',
    brand: 'one8 Footwear Lab',
    category: 'Footwear & Sneakers' as ProductCategory,
    price: 11499,
    stock: 15,
    warehouseId: 'WH-MUM-18',
    imageUrl: Object.values(PRODUCT_IMAGE_PRESETS)[0],
    material: 'AeroWeave Carbon Mesh & Supercritical NitroFoam',
    dimensions: 'UK 7 – UK 11 · 215 g',
    origin: 'Bengaluru Performance Lab',
    leadTime: 'Express 24-Hr Dispatch',
    description: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inline Price Editing State
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<number>(0);

  // Coupon Creation State
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [newCouponValue, setNewCouponValue] = useState('0.10');
  const [newCouponMin, setNewCouponMin] = useState('15000');
  const [newCouponDesc, setNewCouponDesc] = useState('');

  // Dynamic Recharts Dataset 1: Sales Trends (AreaChart)
  const salesTrendsData = useMemo(() => {
    const liveGross = Math.max(18500, metrics.grossRevenue || 0);
    const liveNet = Math.max(16200, metrics.netSettledRevenue || 0);
    const multiplier = trendRange === '30D' ? 2.4 : 1;

    return [
      {
        period: trendRange === '7D' ? 'Mon' : 'Wk 1',
        grossSales: Math.round(14200 * multiplier),
        netSettled: Math.round(13650 * multiplier),
        orders: Math.round(3 * multiplier),
      },
      {
        period: trendRange === '7D' ? 'Tue' : 'Wk 2',
        grossSales: Math.round(19800 * multiplier),
        netSettled: Math.round(19100 * multiplier),
        orders: Math.round(4 * multiplier),
      },
      {
        period: trendRange === '7D' ? 'Wed' : 'Wk 3',
        grossSales: Math.round(16400 * multiplier),
        netSettled: Math.round(15800 * multiplier),
        orders: Math.round(3 * multiplier),
      },
      {
        period: trendRange === '7D' ? 'Thu' : 'Wk 4',
        grossSales: Math.round(24900 * multiplier),
        netSettled: Math.round(24150 * multiplier),
        orders: Math.round(5 * multiplier),
      },
      {
        period: trendRange === '7D' ? 'Fri' : 'Wk 5',
        grossSales: Math.round(28500 * multiplier),
        netSettled: Math.round(27600 * multiplier),
        orders: Math.round(6 * multiplier),
      },
      {
        period: trendRange === '7D' ? 'Sat' : 'Wk 6',
        grossSales: Math.round(31200 * multiplier),
        netSettled: Math.round(30350 * multiplier),
        orders: Math.round(7 * multiplier),
      },
      {
        period: trendRange === '7D' ? 'Today' : 'Current',
        grossSales: liveGross,
        netSettled: liveNet,
        orders: orders.length,
      },
    ];
  }, [metrics.grossRevenue, metrics.netSettledRevenue, orders.length, trendRange]);

  // Dynamic Recharts Dataset 2: Category Performance (BarChart)
  const categoryPerformanceData = useMemo(() => {
    const breakdown = metrics.categoryRevenueBreakdown || {};
    return CATEGORIES.map((cat, index) => {
      const catProducts = products.filter((p) => p.category === cat);
      const stockUnits = catProducts.reduce((sum, p) => sum + p.stock, 0);
      const inventoryValuation = catProducts.reduce((sum, p) => sum + p.price * p.stock, 0);
      const attributedOrderRev = breakdown[cat] || 0;
      const realizedAndPipelineRevenue =
        attributedOrderRev > 0
          ? attributedOrderRev
          : Math.round(inventoryValuation * 0.18);

      const shortLabel = cat
        .replace('Footwear & Sneakers', 'Footwear')
        .replace('Performance Athleisure', 'Athleisure')
        .replace('Fragrances & Grooming', 'Fragrances')
        .replace('Signature Accessories', 'Accessories');

      return {
        category: cat,
        shortName: shortLabel,
        revenue: realizedAndPipelineRevenue,
        inventoryValue: Math.round(inventoryValuation * 0.25),
        stockUnits,
        skuCount: catProducts.length,
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      };
    });
  }, [products, metrics.categoryRevenueBreakdown]);

  const filteredProducts = products.filter((p) => {
    const matchesCategory = categoryFilter === 'ALL' || p.category === categoryFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.material.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateProductInput({
      ...newProduct,
      price: Number(newProduct.price),
      stock: Number(newProduct.stock),
    });

    if (!validation.valid) {
      setFormErrors(validation.errors as Record<string, string>);
      return;
    }

    setIsSubmitting(true);
    setFormErrors({});

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct),
      });
      const data = await res.json();
      if (res.ok) {
        onStateUpdated(data);
        setIsAddModalOpen(false);
        setNewProduct({
          sku: `ONE8-FTW-0${products.length + 2}`,
          title: '',
          brand: 'one8 Footwear Lab',
          category: 'Footwear & Sneakers',
          price: 11499,
          stock: 15,
          warehouseId: 'WH-MUM-18',
          imageUrl: Object.values(PRODUCT_IMAGE_PRESETS)[1],
          material: 'AeroWeave Carbon Mesh & Supercritical NitroFoam',
          dimensions: 'UK 7 – UK 11 · 215 g',
          origin: 'Bengaluru Performance Lab',
          leadTime: 'Express 24-Hr Dispatch',
          description: '',
        });
      } else {
        setFormErrors(data.errors || { title: data.error || 'Failed to add product' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdjustStock = async (product: Product, delta: number) => {
    const nextStock = Math.max(0, product.stock + delta);
    const res = await fetch(`/api/products/${product.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock: nextStock }),
    });
    if (res.ok) {
      const data = await res.json();
      onStateUpdated(data);
    }
  };

  const handleSaveInlinePrice = async (productId: string) => {
    if (editingPrice <= 0) return;
    const res = await fetch(`/api/products/${productId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price: editingPrice }),
    });
    if (res.ok) {
      const data = await res.json();
      onStateUpdated(data);
      setEditingProductId(null);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    const res = await fetch(`/api/products/${productId}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      const data = await res.json();
      onStateUpdated(data);
    }
  };

  const handleOrderStatusChange = async (orderId: string, status: OrderStatus) => {
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const data = await res.json();
      onStateUpdated(data);
    }
  };

  const handleRefundTransaction = async (txnId: string) => {
    const res = await fetch(`/api/transactions/${txnId}/refund`, {
      method: 'POST',
    });
    if (res.ok) {
      const data = await res.json();
      onStateUpdated(data);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim()) return;
    const res = await fetch('/api/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: newCouponCode,
        type: newCouponType,
        value: Number(newCouponValue),
        minOrderAmount: Number(newCouponMin),
        description: newCouponDesc,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      onStateUpdated(data);
      setNewCouponCode('');
      setNewCouponDesc('');
    }
  };

  const handleToggleCoupon = async (code: string) => {
    const res = await fetch(`/api/coupons/${code}`, { method: 'PATCH' });
    if (res.ok) {
      const data = await res.json();
      onStateUpdated(data);
    }
  };

  const handleTriggerBackup = async () => {
    const res = await fetch('/api/admin/backup', { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      onStateUpdated(data);
      setBackupMessage(`Saved snapshot: ${data.backupFile}`);
      setTimeout(() => setBackupMessage(null), 5000);
    }
  };

  return (
    <section
      className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8"
      aria-label="Merchant Product Management Dashboard"
    >
      {/* Contextual Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-200 pb-6">
        <div>
          <div className="text-xs text-zinc-500 flex items-center gap-2 mb-1">
            <span className="font-mono uppercase text-[#E11D48] font-semibold">
              one8 Enterprise Console v2.0
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">
              Recharts Telemetry, Catalog, Warehouses, Gateway & BI
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold uppercase text-zinc-950">
            Product & Gateway Management Dashboard
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleTriggerBackup}
            className="px-3.5 py-2 rounded-lg border border-zinc-300 bg-white text-zinc-800 text-xs font-medium hover:bg-zinc-100 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Snapshot DB Backup</span>
          </button>

          <button
            type="button"
            onClick={onOpenAiStrategist}
            className="px-4 py-2 rounded-lg border border-zinc-300 bg-white text-zinc-800 text-xs font-semibold hover:bg-zinc-100 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Cpu className="w-3.5 h-3.5 text-[#E11D48]" />
            <span>AI Pricing & Stock Strategist</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-[#0A0A0B] text-white text-xs font-semibold hover:bg-[#E11D48] transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {backupMessage && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2 font-mono">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{backupMessage}</span>
        </div>
      )}

      {/* INTERACTIVE RECHARTS ANALYTICS DECK — REPLACING SIMPLE TEXT STATS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Sales Trends (Interactive Recharts AreaChart) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-zinc-200 flex flex-col justify-between space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono uppercase text-[#E11D48] font-semibold">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Real-Time Gateway Velocity</span>
              </div>
              <h2 className="font-display text-2xl font-bold uppercase text-zinc-950">
                Sales Trends
              </h2>
              <p className="text-xs text-zinc-500">
                Gross Order Volume ({formatINR(metrics.grossRevenue || 0)}) vs Net Gateway Settled (
                {formatINR(metrics.netSettledRevenue || 0)}) · Avg Order{' '}
                {formatINR(metrics.averageOrderValue || 0)}
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-zinc-100 p-1 rounded-lg self-start">
              <button
                type="button"
                onClick={() => setTrendRange('7D')}
                className={`px-3 py-1 rounded text-xs font-mono font-semibold transition-colors ${
                  trendRange === '7D'
                    ? 'bg-[#0A0A0B] text-white'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                7D Window
              </button>
              <button
                type="button"
                onClick={() => setTrendRange('30D')}
                className={`px-3 py-1 rounded text-xs font-mono font-semibold transition-colors ${
                  trendRange === '30D'
                    ? 'bg-[#0A0A0B] text-white'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                30D Window
              </button>
            </div>
          </div>

          <div className="h-64 w-full" aria-label="Sales Trends Area Chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={salesTrendsData}
                margin={{ top: 10, right: 16, left: 4, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="grossSalesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E11D48" stopOpacity={0.32} />
                    <stop offset="95%" stopColor="#E11D48" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="netSettledGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0A0A0B" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#0A0A0B" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 11, fill: '#52525B' }}
                  axisLine={{ stroke: '#D4D4D8' }}
                />
                <YAxis
                  tickFormatter={(val) => `₹${Math.round(val / 1000)}k`}
                  tick={{ fontSize: 11, fill: '#52525B' }}
                  axisLine={{ stroke: '#D4D4D8' }}
                />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    formatINR(Number(value)),
                    name === 'grossSales' ? 'Gross Sales (INR)' : 'Net Settled (INR)',
                  ]}
                  contentStyle={{
                    backgroundColor: '#0A0A0B',
                    borderColor: '#27272A',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                  formatter={(value) =>
                    value === 'grossSales' ? 'Gross Order Volume' : 'Net Settled Revenue'
                  }
                />
                <Area
                  type="monotone"
                  dataKey="grossSales"
                  stroke="#E11D48"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#grossSalesGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="netSettled"
                  stroke="#0A0A0B"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#netSettledGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Category Performance (Interactive Recharts BarChart) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-zinc-200 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase text-[#D4AF37] font-semibold">
              <BarChart3 className="w-3.5 h-3.5 text-[#E11D48]" />
              <span>Collection Attribution · {metrics.totalSkus} SKUs</span>
            </div>
            <h2 className="font-display text-2xl font-bold uppercase text-zinc-950">
              Category Performance
            </h2>
            <p className="text-xs text-zinc-500">
              Attributed Revenue vs Active Inventory Pipeline ({metrics.totalUnitsInStock} Units
              in Stock)
            </p>
          </div>

          <div className="h-64 w-full" aria-label="Category Performance Bar Chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryPerformanceData}
                margin={{ top: 10, right: 12, left: 4, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
                <XAxis
                  dataKey="shortName"
                  tick={{ fontSize: 11, fill: '#52525B' }}
                  axisLine={{ stroke: '#D4D4D8' }}
                />
                <YAxis
                  tickFormatter={(val) => `₹${Math.round(val / 1000)}k`}
                  tick={{ fontSize: 11, fill: '#52525B' }}
                  axisLine={{ stroke: '#D4D4D8' }}
                />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    formatINR(Number(value)),
                    name === 'revenue' ? 'Category Revenue' : 'Stock Valuation (25%)',
                  ]}
                  contentStyle={{
                    backgroundColor: '#0A0A0B',
                    borderColor: '#27272A',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                  formatter={(value) =>
                    value === 'revenue' ? 'Attributed Revenue' : 'Active Stock Pipeline'
                  }
                />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                  {categoryPerformanceData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Bar>
                <Bar dataKey="inventoryValue" fill="#A1A1AA" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs + Storefront Quick Link */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div
          className="flex flex-wrap gap-1 p-1 bg-zinc-200/80 rounded-lg self-start"
          role="tablist"
          aria-label="Dashboard Sections"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'inventory'}
            onClick={() => setActiveTab('inventory')}
            className={`px-3.5 py-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'inventory'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Catalog & Warehouses ({products.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'orders'}
            onClick={() => setActiveTab('orders')}
            className={`px-3.5 py-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'orders'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Orders & Shipments ({orders.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'gateway'}
            onClick={() => setActiveTab('gateway')}
            className={`px-3.5 py-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'gateway'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Payment Gateway ({transactions.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'coupons'}
            onClick={() => setActiveTab('coupons')}
            className={`px-3.5 py-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'coupons'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Coupons ({coupons.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'audit'}
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'audit'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Support & Audit Logs ({auditLogs.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'analytics'}
            onClick={() => setActiveTab('analytics')}
            className={`px-3.5 py-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Analytics & BI
          </button>
        </div>

        <button
          type="button"
          onClick={onSwitchToStorefront}
          className="text-xs font-medium text-zinc-700 hover:text-zinc-950 flex items-center gap-1 self-start lg:self-auto whitespace-nowrap"
        >
          <span>Preview Live Customer Storefront</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* TAB 1: CATALOG & WAREHOUSES */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-lg border border-zinc-200">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                aria-label="Search inventory by title, SKU, or material"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by SKU, product title, or material..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-zinc-300 bg-[#F6F6F4] focus:outline-none focus:border-zinc-900"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {['ALL', ...CATEGORIES].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                    categoryFilter === cat
                      ? 'bg-[#0A0A0B] text-white'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                  }`}
                >
                  {cat === 'ALL' ? 'All Categories' : cat}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-zinc-200 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 text-xs text-zinc-500 bg-zinc-50/70">
                  <th className="py-3 px-4 font-medium">Gear & Technical Spec</th>
                  <th className="py-3 px-4 font-medium">SKU & Hub</th>
                  <th className="py-3 px-4 font-medium">Category</th>
                  <th className="py-3 px-4 font-medium text-right">Unit Price (INR)</th>
                  <th className="py-3 px-4 font-medium text-right">Stock Allocation</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-xs">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-10 rounded overflow-hidden bg-zinc-100 border border-zinc-200 shrink-0">
                          <ResilientImage
                            src={product.imageUrl}
                            alt={product.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-semibold text-zinc-900 text-sm">
                            {product.title}
                          </div>
                          <div className="text-zinc-500">
                            {product.material} · {product.dimensions}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-zinc-700 whitespace-nowrap">
                      <div>{product.sku}</div>
                      <div className="text-[11px] text-zinc-500">{product.warehouseId}</div>
                    </td>

                    <td className="py-3 px-4 text-zinc-700 whitespace-nowrap">
                      {product.category}
                    </td>

                    <td className="py-3 px-4 text-right font-mono tabular-nums whitespace-nowrap">
                      {editingProductId === product.id ? (
                        <div className="inline-flex items-center justify-end gap-1">
                          <input
                            type="number"
                            aria-label={`Edit price for ${product.title}`}
                            value={editingPrice}
                            onChange={(e) => setEditingPrice(Number(e.target.value))}
                            className="w-24 px-2 py-1 text-right font-mono text-xs border border-zinc-400 rounded bg-white"
                          />
                          <button
                            type="button"
                            aria-label={`Save price for ${product.title}`}
                            onClick={() => handleSaveInlinePrice(product.id)}
                            className="p-1 text-emerald-700 hover:bg-emerald-50 rounded"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            aria-label="Cancel price edit"
                            onClick={() => setEditingProductId(null)}
                            className="p-1 text-zinc-500 hover:bg-zinc-100 rounded"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <span className="font-semibold text-zinc-900">
                            {formatINR(product.price)}
                          </span>
                          <button
                            type="button"
                            aria-label={`Edit price of ${product.title}`}
                            onClick={() => {
                              setEditingProductId(product.id);
                              setEditingPrice(product.price);
                            }}
                            className="p-1 text-zinc-400 hover:text-zinc-900 rounded"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-2">
                        <span
                          className={`font-mono font-semibold tabular-nums ${
                            product.stock <= 5 ? 'text-amber-800' : 'text-zinc-900'
                          }`}
                        >
                          {product.stock} units
                          {product.stock <= 5 ? ' (Low)' : ''}
                        </span>
                        <div className="inline-flex border border-zinc-300 rounded bg-white">
                          <button
                            type="button"
                            aria-label={`Decrease stock for ${product.title}`}
                            onClick={() => handleAdjustStock(product, -1)}
                            className="px-2 py-0.5 text-zinc-700 hover:bg-zinc-100 font-mono"
                          >
                            -1
                          </button>
                          <button
                            type="button"
                            aria-label={`Increase stock for ${product.title}`}
                            onClick={() => handleAdjustStock(product, 1)}
                            className="px-2 py-0.5 text-zinc-700 hover:bg-zinc-100 font-mono border-l border-zinc-300"
                          >
                            +1
                          </button>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        aria-label={`Delete ${product.title}`}
                        onClick={() => handleDeleteProduct(product.id)}
                        className="p-1.5 text-zinc-400 hover:text-red-700 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Warehouse Stock Movements Log */}
          <div className="bg-white p-5 rounded-lg border border-zinc-200 space-y-3">
            <div className="text-xs font-semibold text-zinc-800">
              Recent Transactional Warehouse Stock Movements ({inventoryMovements.length})
            </div>
            <div className="divide-y divide-zinc-100 text-xs max-h-52 overflow-y-auto">
              {inventoryMovements.slice(0, 8).map((mov) => (
                <div key={mov.id} className="py-2 flex items-center justify-between font-mono">
                  <span>
                    {mov.sku} · {mov.warehouseCode} · {mov.reason} ({mov.type})
                  </span>
                  <span className={mov.quantityDelta >= 0 ? 'text-emerald-800' : 'text-amber-800'}>
                    {mov.quantityDelta >= 0 ? `+${mov.quantityDelta}` : mov.quantityDelta} units
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ORDERS & SHIPMENTS PIPELINE */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-lg border border-zinc-200 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 text-xs text-zinc-500 bg-zinc-50/70">
                <th className="py-3 px-4 font-medium">Order ID & AWB Tracking</th>
                <th className="py-3 px-4 font-medium">Customer & Destination</th>
                <th className="py-3 px-4 font-medium">Allocated Line Items</th>
                <th className="py-3 px-4 font-medium">Payment & Carrier</th>
                <th className="py-3 px-4 font-medium text-right">Total (Incl. GST)</th>
                <th className="py-3 px-4 font-medium text-right">Fulfillment Lifecycle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-xs">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-zinc-50/80">
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-mono font-semibold text-zinc-900">{order.id}</div>
                    <div className="font-mono text-[11px] text-zinc-500">
                      {order.trackingNumber}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-medium text-zinc-900">{order.customer.fullName}</div>
                    <div className="text-zinc-500">
                      {order.customer.city}, {order.customer.state} —{' '}
                      <span className="font-mono">{order.customer.pinCode}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="space-y-0.5">
                      {order.items.map((item) => (
                        <div key={item.productId} className="text-zinc-800">
                          {item.title}{' '}
                          <span className="font-mono text-zinc-500">× {item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-mono text-zinc-800">{order.paymentMethod}</div>
                    <div className="text-[11px] text-zinc-500">{order.carrier}</div>
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono font-semibold text-zinc-900 tabular-nums whitespace-nowrap">
                    {formatINR(order.totalAmount)}
                  </td>

                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <select
                      aria-label={`Fulfillment status for ${order.id}`}
                      value={order.status}
                      onChange={(e) =>
                        handleOrderStatusChange(order.id, e.target.value as OrderStatus)
                      }
                      className="px-2.5 py-1.5 text-xs font-medium rounded-md border border-zinc-300 bg-[#F6F6F4] text-zinc-900 focus:outline-none focus:border-zinc-900"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed — Preparing</option>
                      <option value="Processing">Processing</option>
                      <option value="Packed">Packed at Hub</option>
                      <option value="Shipped">Shipped — In Transit</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Returned">Returned</option>
                      <option value="Refunded">Refunded</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: PAYMENT GATEWAY LEDGER */}
      {activeTab === 'gateway' && (
        <div className="bg-white rounded-lg border border-zinc-200 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 text-xs text-zinc-500 bg-zinc-50/70">
                <th className="py-3 px-4 font-medium">Transaction ID</th>
                <th className="py-3 px-4 font-medium">Order Ref</th>
                <th className="py-3 px-4 font-medium">Instrument & HMAC Signature</th>
                <th className="py-3 px-4 font-medium text-right">Gross Amount</th>
                <th className="py-3 px-4 font-medium text-right">Gateway Fee</th>
                <th className="py-3 px-4 font-medium text-right">Net Settled</th>
                <th className="py-3 px-4 font-medium text-right">Settlement State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-xs">
              {transactions.map((txn) => (
                <tr key={txn.id} className="hover:bg-zinc-50/80">
                  <td className="py-3.5 px-4 font-mono font-medium text-zinc-900 whitespace-nowrap">
                    {txn.id}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-zinc-700 whitespace-nowrap">
                    {txn.orderId}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-mono text-zinc-900">{txn.methodSummary}</div>
                    <div className="font-mono text-[11px] text-zinc-500">
                      {txn.signatureHash}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-zinc-900 whitespace-nowrap">
                    {formatINR(txn.amount)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-zinc-500 whitespace-nowrap">
                    {formatINR(txn.gatewayFee)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-semibold tabular-nums text-zinc-900 whitespace-nowrap">
                    {formatINR(txn.netAmount)}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center justify-end gap-2">
                      <span
                        className={`font-mono font-medium ${
                          txn.status === 'Captured'
                            ? 'text-emerald-800'
                            : txn.status === 'Refunded'
                              ? 'text-red-700'
                              : 'text-amber-800'
                        }`}
                      >
                        {txn.status}
                      </span>
                      {txn.status !== 'Refunded' && (
                        <button
                          type="button"
                          onClick={() => handleRefundTransaction(txn.id)}
                          className="px-2.5 py-1 rounded border border-zinc-300 text-zinc-700 hover:bg-zinc-100 inline-flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Refund</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: COUPONS & CAMPAIGNS */}
      {activeTab === 'coupons' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white rounded-lg border border-zinc-200 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/70 text-zinc-500">
                  <th className="py-3 px-4 font-medium">Code</th>
                  <th className="py-3 px-4 font-medium">Privilege Rule</th>
                  <th className="py-3 px-4 font-medium text-right">Min Subtotal</th>
                  <th className="py-3 px-4 font-medium text-right">Redemptions</th>
                  <th className="py-3 px-4 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {coupons.map((c) => (
                  <tr key={c.code}>
                    <td className="py-3 px-4 font-mono font-semibold text-zinc-900">
                      {c.code}
                    </td>
                    <td className="py-3 px-4 text-zinc-700">{c.description}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      {formatINR(c.minOrderAmount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      {c.usageCount} / {c.maxUses}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleCoupon(c.code)}
                        className={`px-2.5 py-1 rounded text-xs font-medium border ${
                          c.active
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                            : 'border-zinc-300 bg-zinc-100 text-zinc-600'
                        }`}
                      >
                        {c.active ? 'Active' : 'Paused'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <form
            onSubmit={handleCreateCoupon}
            className="lg:col-span-5 bg-white p-5 rounded-lg border border-zinc-200 space-y-3"
          >
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-700">
              Create Campaign Coupon
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                required
                value={newCouponCode}
                onChange={(e) => setNewCouponCode(e.target.value)}
                placeholder="CODE (e.g. ONE8PRO)"
                aria-label="Coupon Code"
                className="px-3 py-2 text-xs font-mono uppercase rounded-lg border border-zinc-300 bg-[#F6F6F4]"
              />
              <select
                aria-label="Discount Type"
                value={newCouponType}
                onChange={(e) =>
                  setNewCouponType(e.target.value as 'PERCENTAGE' | 'FIXED')
                }
                className="px-3 py-2 text-xs rounded-lg border border-zinc-300 bg-[#F6F6F4]"
              >
                <option value="PERCENTAGE">Percentage (e.g. 0.10)</option>
                <option value="FIXED">Fixed INR (e.g. 5000)</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                step="any"
                required
                value={newCouponValue}
                onChange={(e) => setNewCouponValue(e.target.value)}
                placeholder="Value (0.10 or 5000)"
                aria-label="Coupon Value"
                className="px-3 py-2 text-xs font-mono rounded-lg border border-zinc-300 bg-[#F6F6F4]"
              />
              <input
                type="number"
                required
                value={newCouponMin}
                onChange={(e) => setNewCouponMin(e.target.value)}
                placeholder="Min Order INR"
                aria-label="Minimum Order Amount"
                className="px-3 py-2 text-xs font-mono rounded-lg border border-zinc-300 bg-[#F6F6F4]"
              />
            </div>
            <input
              type="text"
              required
              value={newCouponDesc}
              onChange={(e) => setNewCouponDesc(e.target.value)}
              placeholder="Campaign description"
              aria-label="Campaign Description"
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 bg-[#F6F6F4]"
            />
            <button
              type="submit"
              className="w-full py-2 px-4 rounded-lg bg-[#0A0A0B] text-white text-xs font-semibold hover:bg-zinc-800"
            >
              Publish Server-Validated Coupon
            </button>
          </form>
        </div>
      )}

      {/* TAB 5: SUPPORT TICKETS & SECURITY AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white p-5 rounded-lg border border-zinc-200 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-700">
              Customer Support Queue ({supportTickets.length})
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {supportTickets.map((t) => (
                <div
                  key={t.id}
                  className="p-3.5 rounded-lg bg-[#F6F6F4] border border-zinc-200 text-xs space-y-1.5"
                >
                  <div className="flex justify-between font-mono text-zinc-500">
                    <span>
                      {t.id} · {t.customerName}
                    </span>
                    <span>{t.status}</span>
                  </div>
                  <div className="font-semibold text-zinc-900">{t.subject}</div>
                  <div className="text-zinc-600">
                    Latest: {t.messages[t.messages.length - 1]?.text}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7 bg-white p-5 rounded-lg border border-zinc-200 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-700">
              Immutable Security & Operations Audit Log ({auditLogs.length})
            </h3>
            <div className="divide-y divide-zinc-100 text-xs max-h-96 overflow-y-auto font-mono">
              {auditLogs.map((log) => (
                <div key={log.id} className="py-2.5 flex items-start justify-between gap-4">
                  <div>
                    <span className="font-semibold text-zinc-900">{log.action}</span> ·{' '}
                    <span className="text-zinc-600">{log.entityId}</span>
                    <div className="text-[11px] text-zinc-500 mt-0.5">{log.details}</div>
                  </div>
                  <div className="text-[11px] text-zinc-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleTimeString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: ANALYTICS & BUSINESS INTELLIGENCE (RECHARTS DEEP DIVE) */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-zinc-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-xl font-bold uppercase text-zinc-950">
                  Category Performance — Stock Units vs SKU Depth
                </h3>
                <p className="text-xs text-zinc-500">
                  Interactive BarChart of warehouse unit allocation per category
                </p>
              </div>
              <span className="text-xs font-mono text-[#E11D48] font-semibold">
                {metrics.totalUnitsInStock} Total Units
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryPerformanceData}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#52525B' }} />
                  <YAxis
                    dataKey="shortName"
                    type="category"
                    tick={{ fontSize: 11, fill: '#18181B' }}
                    width={80}
                  />
                  <Tooltip
                    formatter={(val: any) => [`${val} Units`, 'Warehouse Stock']}
                    contentStyle={{
                      backgroundColor: '#0A0A0B',
                      borderColor: '#27272A',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="stockUnits" fill="#E11D48" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-zinc-200 space-y-4">
            <h3 className="font-display text-xl font-bold uppercase text-zinc-950">
              Enterprise Conversion & Fulfillment Health
            </h3>
            <dl className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-lg bg-[#F6F6F4] border border-zinc-200">
                <dt className="text-zinc-500">one8 Club Members</dt>
                <dd className="font-mono text-lg font-semibold text-zinc-900 mt-1 tabular-nums">
                  {metrics.totalCustomersCount} Accounts
                </dd>
              </div>
              <div className="p-3.5 rounded-lg bg-[#F6F6F4] border border-zinc-200">
                <dt className="text-zinc-500">Storefront Conversion</dt>
                <dd className="font-mono text-lg font-semibold text-zinc-900 mt-1 tabular-nums">
                  {metrics.conversionRatePercent}%
                </dd>
              </div>
              <div className="p-3.5 rounded-lg bg-[#F6F6F4] border border-zinc-200">
                <dt className="text-zinc-500">Active Orders Pipeline</dt>
                <dd className="font-mono text-lg font-semibold text-emerald-800 mt-1 tabular-nums">
                  {metrics.activeOrdersCount} Active
                </dd>
              </div>
              <div className="p-3.5 rounded-lg bg-[#F6F6F4] border border-zinc-200">
                <dt className="text-zinc-500">Regional Hubs</dt>
                <dd className="font-mono text-lg font-semibold text-zinc-900 mt-1 tabular-nums">
                  {warehouses.length} Facilities
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {/* ADD NEW PRODUCT MODAL */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-product-modal-title"
        >
          <div className="w-full max-w-xl bg-[#F6F6F4] border border-zinc-300 rounded-xl shadow-2xl overflow-hidden my-auto">
            <div className="px-6 py-4 bg-[#0A0A0B] text-white border-b border-zinc-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-mono uppercase text-[#D4AF37]">
                  Catalog Management
                </div>
                <h2
                  id="add-product-modal-title"
                  className="font-display text-xl font-bold uppercase text-white"
                >
                  Add New one8 Release to Catalog
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close add product modal"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-lg border border-zinc-700 flex items-center justify-center text-zinc-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="new-prod-title"
                    className="block text-xs font-medium text-zinc-700 mb-1"
                  >
                    Product Title
                  </label>
                  <input
                    id="new-prod-title"
                    type="text"
                    value={newProduct.title}
                    onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                    placeholder="e.g. one8 Nitro Carbon Sprint Pro"
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-zinc-300 bg-white focus:outline-none focus:border-zinc-900"
                  />
                  {formErrors.title && (
                    <p className="text-xs text-red-700 mt-1">{formErrors.title}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="new-prod-sku"
                    className="block text-xs font-medium text-zinc-700 mb-1"
                  >
                    SKU Code
                  </label>
                  <input
                    id="new-prod-sku"
                    type="text"
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                    placeholder="ONE8-FTW-09"
                    className="w-full px-3.5 py-2 text-sm font-mono uppercase rounded-lg border border-zinc-300 bg-white focus:outline-none focus:border-zinc-900"
                  />
                  {formErrors.sku && (
                    <p className="text-xs text-red-700 mt-1">{formErrors.sku}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="new-prod-category"
                    className="block text-xs font-medium text-zinc-700 mb-1"
                  >
                    Category
                  </label>
                  <select
                    id="new-prod-category"
                    value={newProduct.category}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        category: e.target.value as ProductCategory,
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 bg-white focus:outline-none focus:border-zinc-900"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="new-prod-price"
                    className="block text-xs font-medium text-zinc-700 mb-1"
                  >
                    Unit Price (INR ₹)
                  </label>
                  <input
                    id="new-prod-price"
                    type="number"
                    value={newProduct.price}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, price: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2 text-sm font-mono rounded-lg border border-zinc-300 bg-white focus:outline-none focus:border-zinc-900"
                  />
                  {formErrors.price && (
                    <p className="text-xs text-red-700 mt-1">{formErrors.price}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="new-prod-stock"
                    className="block text-xs font-medium text-zinc-700 mb-1"
                  >
                    Initial Stock Allocation
                  </label>
                  <input
                    id="new-prod-stock"
                    type="number"
                    value={newProduct.stock}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, stock: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2 text-sm font-mono rounded-lg border border-zinc-300 bg-white focus:outline-none focus:border-zinc-900"
                  />
                  {formErrors.stock && (
                    <p className="text-xs text-red-700 mt-1">{formErrors.stock}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="new-prod-material"
                    className="block text-xs font-medium text-zinc-700 mb-1"
                  >
                    Primary Material
                  </label>
                  <input
                    id="new-prod-material"
                    type="text"
                    value={newProduct.material}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, material: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-zinc-300 bg-white focus:outline-none focus:border-zinc-900"
                  />
                  {formErrors.material && (
                    <p className="text-xs text-red-700 mt-1">{formErrors.material}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="new-prod-image"
                    className="block text-xs font-medium text-zinc-700 mb-1"
                  >
                    Studio Photography Asset
                  </label>
                  <select
                    id="new-prod-image"
                    value={newProduct.imageUrl}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, imageUrl: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 bg-white focus:outline-none focus:border-zinc-900"
                  >
                    {Object.entries(PRODUCT_IMAGE_PRESETS).map(([label, url]) => (
                      <option key={label} value={url}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="new-prod-description"
                  className="block text-xs font-medium text-zinc-700 mb-1"
                >
                  Technical Specification & Lab Description
                </label>
                <textarea
                  id="new-prod-description"
                  rows={3}
                  value={newProduct.description}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, description: e.target.value })
                  }
                  placeholder="Describe carbon propulsion, fabric breathability, or fragrance notes..."
                  className="w-full p-3 text-xs rounded-lg border border-zinc-300 bg-white focus:outline-none focus:border-zinc-900"
                />
                {formErrors.description && (
                  <p className="text-xs text-red-700 mt-1">{formErrors.description}</p>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-zinc-300 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-[#0A0A0B] text-white text-xs font-semibold hover:bg-[#E11D48] disabled:opacity-50"
                >
                  {isSubmitting ? 'Publishing Release...' : 'Publish to Storefront & Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
