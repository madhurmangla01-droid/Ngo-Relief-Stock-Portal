import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  Boxes,
  Lock,
  PackageCheck,
} from 'lucide-react';
import { StatusBanner } from '../components/StatusBanner';
import { StockBadge } from '../components/StockBadge';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { DASHBOARD_BANNER_IMAGE, type DashboardData, type PageId } from '../types';

interface DashboardPageProps {
  onNavigate: (page: PageId, options?: { itemId?: number; inventoryStatus?: string }) => void;
  onAlertsCountChange: (count: number) => void;
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(n);
}

function formatRef(prefix: 'DON' | 'DST', id: number): string {
  return `${prefix}-${String(id).padStart(4, '0')}`;
}

export function DashboardPage({ onNavigate, onAlertsCountChange }: DashboardPageProps) {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bannerFallback, setBannerFallback] = useState(false);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getDashboard();
      setData(res);
      onAlertsCountChange(res.summary.alertsCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load dashboard summary.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="h-52 rounded-3xl bg-slate-200/70 animate-pulse" />
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((k) => (
            <div key={k} className="h-32 rounded-2xl surface-card p-5 animate-pulse">
              <div className="h-3 w-24 bg-slate-200 rounded mb-4" />
              <div className="h-7 w-20 bg-slate-200 rounded mb-2" />
              <div className="h-3 w-32 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 rounded-2xl surface-card animate-pulse" />
          <div className="h-80 rounded-2xl surface-card animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <StatusBanner variant="error" message={error} />
        <button
          type="button"
          onClick={loadDashboard}
          className="rounded-xl bg-gradient-to-r from-[#0F2F55] to-[#1D4ED8] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-95"
        >
          Retry Loading Dashboard
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { summary, categoryOverview, lowStockItems, recentDonations, recentDistributions } = data;
  const maxCategoryReceived = Math.max(...categoryOverview.map((c) => c.totalReceived), 1);

  // Real-data metrics for Hero Banner & SVG Stock Health Ring
  const fulfillmentRate =
    summary.totalReceivedUnits > 0
      ? Math.min(100, Math.round((summary.totalDistributedUnits / summary.totalReceivedUnits) * 100))
      : 0;

  const totalItems = Math.max(summary.totalItems, 0);
  const healthyCount = Math.max(0, totalItems - summary.lowStockCount - summary.outOfStockCount);
  const healthyPct = totalItems > 0 ? Math.round((healthyCount / totalItems) * 100) : 100;

  // SVG Ring geometry (circumference of r=36 is ~226.19)
  const ringRadius = 36;
  const circumference = 2 * Math.PI * ringRadius;
  const safeTotal = Math.max(totalItems, 1);
  const healthyLen = (healthyCount / safeTotal) * circumference;
  const lowLen = (summary.lowStockCount / safeTotal) * circumference;
  const outLen = (summary.outOfStockCount / safeTotal) * circumference;

  const firstName = user?.displayName?.split(' ')[0] || 'Coordinator';

  return (
    <div className="space-y-6 sm:space-y-7">
      {/* Flagship Editorial Relief Operations Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-[#0A223D] text-white shadow-xl shadow-slate-900/12">
        {!bannerFallback && (
          <img
            src={DASHBOARD_BANNER_IMAGE}
            alt="Organized humanitarian relief supplies center"
            referrerPolicy="no-referrer"
            onError={() => setBannerFallback(true)}
            className="absolute inset-0 h-full w-full object-cover object-center scale-[1.01]"
          />
        )}
        <div
          className="absolute inset-0 bg-gradient-to-r from-[#081C34]/94 via-[#0C2B4D]/84 to-[#064E3B]/62"
          aria-hidden="true"
        />

        <div className="relative z-10 p-6 sm:p-8 lg:p-9 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <p className="text-xs font-medium tracking-wide text-emerald-300/95">
              {user ? (
                <>
                  {user.ngo.name} <span className="text-white/40 mx-1">·</span>{' '}
                  <span className="font-mono">{user.ngo.registrationNumber}</span>{' '}
                  <span className="text-white/40 mx-1">·</span> {user.ngo.cityState}
                </>
              ) : (
                'Verified Relief Operations Center'
              )}
            </p>
            <h2 className="text-2xl sm:text-3xl lg:text-[2.1rem] font-semibold tracking-tight text-white leading-[1.15]">
              Good to see you, {firstName}.
            </h2>
            <p className="text-sm sm:text-[15px] text-sky-100/85 leading-relaxed max-w-xl">
              <strong className="font-mono text-white font-semibold">{fulfillmentRate}%</strong> of
              all donated supplies have already reached community beneficiaries across{' '}
              <strong className="font-mono text-white font-semibold">
                {summary.distributionCount}
              </strong>{' '}
              verified dispatches, with{' '}
              <strong className="font-mono text-emerald-300 font-semibold">
                {formatNumber(summary.currentAvailableStock)}
              </strong>{' '}
              units currently ready in storage.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('add-donation')}
              className="inline-flex items-center gap-2 min-h-[46px] rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-md shadow-emerald-950/25 hover:from-emerald-400 hover:to-teal-400 active:scale-[0.99] transition-all whitespace-nowrap"
            >
              <ArrowDownToLine className="h-4 w-4" aria-hidden="true" />
              <span>Record Donation</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('distribute-goods')}
              className="inline-flex items-center gap-2 min-h-[46px] rounded-xl bg-white/14 backdrop-blur-md border border-white/25 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/22 active:scale-[0.99] transition-all whitespace-nowrap"
            >
              <ArrowUpFromLine className="h-4 w-4" aria-hidden="true" />
              <span>Distribute Goods</span>
            </button>
          </div>
        </div>
      </section>

      {/* 4 Elevated Summary KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3.5 sm:gap-5">
        <div className="surface-card-interactive rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] sm:text-xs font-semibold text-slate-500 leading-snug">
              Total Received
            </p>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0">
              <ArrowDownToLine className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>
          <p className="mt-3 text-2xl sm:text-[1.9rem] font-bold font-mono tabular-nums tracking-tight text-slate-900">
            {formatNumber(summary.totalReceivedUnits)}
          </p>
          <p className="mt-1.5 text-[11px] sm:text-xs text-slate-500">
            {summary.donationCount} receipts · {summary.totalDonors} donors
          </p>
        </div>

        <div className="surface-card-interactive rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] sm:text-xs font-semibold text-slate-500 leading-snug">
              Total Distributed
            </p>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700 border border-blue-100 shrink-0">
              <ArrowUpFromLine className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>
          <p className="mt-3 text-2xl sm:text-[1.9rem] font-bold font-mono tabular-nums tracking-tight text-slate-900">
            {formatNumber(summary.totalDistributedUnits)}
          </p>
          <p className="mt-1.5 text-[11px] sm:text-xs text-slate-500">
            {summary.distributionCount} dispatches · {fulfillmentRate}% issued
          </p>
        </div>

        <div className="surface-card-interactive rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] sm:text-xs font-semibold text-slate-500 leading-snug">
              Available Stock
            </p>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-800 border border-sky-100 shrink-0">
              <Boxes className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>
          <p className="mt-3 text-2xl sm:text-[1.9rem] font-bold font-mono tabular-nums tracking-tight text-slate-900">
            {formatNumber(summary.currentAvailableStock)}
          </p>
          <p className="mt-1.5 text-[11px] sm:text-xs text-slate-500">
            {summary.totalItems} items · {summary.totalCategories} categories
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('inventory', { inventoryStatus: 'low' })}
          className="text-left surface-card-interactive rounded-2xl p-4 sm:p-5 focus-visible:outline-2 focus-visible:outline-blue-600"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] sm:text-xs font-semibold text-slate-500 leading-snug">
              Low Stock Alerts
            </p>
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-xl border shrink-0 ${
                summary.alertsCount > 0
                  ? 'bg-amber-50 text-amber-700 border-amber-200/80'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-100'
              }`}
            >
              {summary.alertsCount > 0 ? (
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              ) : (
                <PackageCheck className="h-4 w-4" aria-hidden="true" />
              )}
            </span>
          </div>
          <p
            className={`mt-3 text-2xl sm:text-[1.9rem] font-bold font-mono tabular-nums tracking-tight ${
              summary.alertsCount > 0 ? 'text-amber-700' : 'text-emerald-700'
            }`}
          >
            {summary.alertsCount}
          </p>
          <p className="mt-1.5 text-[11px] sm:text-xs text-slate-500">
            {summary.outOfStockCount} out · {summary.lowStockCount} below minimum
          </p>
        </button>
      </div>

      {/* Category Stock Overview & Stock Health / Watchlist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stock Overview by Category */}
        <section className="lg:col-span-2 surface-card rounded-2xl p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Stock Overview by Category
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Current available relief balance compared against cumulative donations received
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('inventory')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 whitespace-nowrap"
            >
              <span>Full Inventory</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          {categoryOverview.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">
              No categories configured yet.
            </p>
          ) : (
            <div className="space-y-5">
              {categoryOverview.map((cat) => {
                const receivedPct = Math.max(
                  8,
                  Math.round((cat.totalReceived / maxCategoryReceived) * 100)
                );
                const availableShare =
                  cat.totalReceived > 0
                    ? Math.round((cat.currentStock / cat.totalReceived) * 100)
                    : 0;
                return (
                  <div key={cat.categoryId} className="space-y-2">
                    <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-semibold text-slate-900 truncate">
                          {cat.categoryName}
                        </span>
                        <span className="text-xs text-slate-400">
                          {cat.itemCount} {cat.itemCount === 1 ? 'item' : 'items'}
                        </span>
                        {cat.belowThresholdCount > 0 && (
                          <span className="text-xs font-semibold text-amber-700">
                            · {cat.belowThresholdCount} low
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs font-mono tabular-nums text-slate-600">
                        <span>
                          Available:{' '}
                          <strong className="text-slate-900">
                            {formatNumber(cat.currentStock)}
                          </strong>
                        </span>
                        <span className="text-slate-400">
                          In {formatNumber(cat.totalReceived)} · Out{' '}
                          {formatNumber(cat.totalDistributed)}
                        </span>
                      </div>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-sky-100 relative overflow-hidden"
                        style={{ width: `${receivedPct}%` }}
                      >
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#0F2F55] via-[#1D4ED8] to-[#059669] transition-all duration-300"
                          style={{ width: `${availableShare}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Warehouse Readiness Ring + Attention Needed Watchlist */}
        <section className="surface-card rounded-2xl p-5 sm:p-6 flex flex-col">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Stock Readiness</h3>
              <p className="text-xs text-slate-500 mt-0.5">Threshold status across all items</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('inventory', { inventoryStatus: 'low' })}
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 whitespace-nowrap"
            >
              View all
            </button>
          </div>

          {/* Bespoke SVG Stock Health Ring */}
          <div className="flex items-center gap-4 pb-5 mb-4 border-b border-slate-100">
            <div className="relative h-24 w-24 shrink-0">
              <svg
                viewBox="0 0 96 96"
                className="h-24 w-24 -rotate-90"
                role="img"
                aria-label={`${healthyPct}% of relief items are above minimum stock threshold`}
              >
                <circle
                  cx="48"
                  cy="48"
                  r={ringRadius}
                  fill="none"
                  stroke="#E2E8F0"
                  strokeWidth="9"
                />
                {healthyLen > 0 && (
                  <circle
                    cx="48"
                    cy="48"
                    r={ringRadius}
                    fill="none"
                    stroke="#059669"
                    strokeWidth="9"
                    strokeDasharray={`${healthyLen} ${circumference}`}
                    strokeDashoffset={0}
                    strokeLinecap="butt"
                  />
                )}
                {lowLen > 0 && (
                  <circle
                    cx="48"
                    cy="48"
                    r={ringRadius}
                    fill="none"
                    stroke="#D97706"
                    strokeWidth="9"
                    strokeDasharray={`${lowLen} ${circumference}`}
                    strokeDashoffset={-healthyLen}
                    strokeLinecap="butt"
                  />
                )}
                {outLen > 0 && (
                  <circle
                    cx="48"
                    cy="48"
                    r={ringRadius}
                    fill="none"
                    stroke="#DC2626"
                    strokeWidth="9"
                    strokeDasharray={`${outLen} ${circumference}`}
                    strokeDashoffset={-(healthyLen + lowLen)}
                    strokeLinecap="butt"
                  />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono tabular-nums text-lg font-bold text-slate-900 leading-none">
                  {healthyPct}%
                </span>
                <span className="text-[10px] font-medium text-slate-500 mt-0.5">Ready</span>
              </div>
            </div>

            <div className="space-y-1.5 flex-1 min-w-0 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 shrink-0" />
                  In Stock
                </span>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  {healthyCount}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0" />
                  Low Stock
                </span>
                <span className="font-mono tabular-nums font-semibold text-amber-700">
                  {summary.lowStockCount}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-600 shrink-0" />
                  Out of Stock
                </span>
                <span className="font-mono tabular-nums font-semibold text-red-700">
                  {summary.outOfStockCount}
                </span>
              </div>
            </div>
          </div>

          {lowStockItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
              <PackageCheck className="h-7 w-7 text-emerald-600 mb-2" aria-hidden="true" />
              <p className="text-sm font-semibold text-slate-900">All items well stocked</p>
              <p className="text-xs text-slate-500 mt-1">
                Every item is currently at or above its minimum stock threshold.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 flex-1">
              {lowStockItems.slice(0, 4).map((item) => (
                <li
                  key={item.itemId}
                  className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{item.itemName}</p>
                    <p className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                      {formatNumber(item.currentStock)} / min {formatNumber(item.minThreshold)}{' '}
                      {item.unit}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <StockBadge
                      status={item.stockStatus}
                      currentStock={item.currentStock}
                      minThreshold={item.minThreshold}
                    />
                    <button
                      type="button"
                      onClick={() => onNavigate('add-donation', { itemId: item.itemId })}
                      className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors whitespace-nowrap"
                    >
                      Restock
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Permanent Ledger Activity: Recent Donations & Recent Distributions */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Donations */}
        <section className="surface-card rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-slate-100 bg-slate-50/40">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0">
                <ArrowDownToLine className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900 truncate">Recent Donations</h3>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Lock className="h-3 w-3 text-emerald-600 shrink-0" aria-hidden="true" />
                  <span>Permanent goods-in receipts</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('donation-history')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 whitespace-nowrap shrink-0"
            >
              <span>Full Ledger</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          {recentDonations.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-500">No donations recorded yet.</p>
              <button
                type="button"
                onClick={() => onNavigate('add-donation')}
                className="mt-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-semibold text-white hover:opacity-95"
              >
                Record First Donation
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentDonations.map((d) => (
                <li
                  key={d.id}
                  className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-emerald-50/30 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{d.itemName}</p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {d.donorName} · {d.categoryName}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-mono tabular-nums font-bold text-emerald-700">
                      +{formatNumber(d.quantity)} {d.unit}
                    </p>
                    <p className="text-[11px] font-mono tabular-nums text-slate-400 mt-0.5">
                      {formatRef('DON', d.id)} · {d.donationDate}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recent Distributions */}
        <section className="surface-card rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-slate-100 bg-slate-50/40">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-700 border border-blue-100 shrink-0">
                <ArrowUpFromLine className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900 truncate">
                  Recent Distributions
                </h3>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Lock className="h-3 w-3 text-blue-600 shrink-0" aria-hidden="true" />
                  <span>Permanent goods-out dispatches</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('distribution-history')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 whitespace-nowrap shrink-0"
            >
              <span>Full Ledger</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          {recentDistributions.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-500">No distributions recorded yet.</p>
              <button
                type="button"
                onClick={() => onNavigate('distribute-goods')}
                className="mt-3 rounded-xl bg-gradient-to-r from-[#0F2F55] to-[#1D4ED8] px-4 py-2 text-xs font-semibold text-white hover:opacity-95"
              >
                Record First Distribution
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentDistributions.map((ds) => (
                <li
                  key={ds.id}
                  className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-blue-50/30 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{ds.itemName}</p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {ds.beneficiaryLocation} · {ds.categoryName}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-mono tabular-nums font-bold text-blue-700">
                      −{formatNumber(ds.quantity)} {ds.unit}
                    </p>
                    <p className="text-[11px] font-mono tabular-nums text-slate-400 mt-0.5">
                      {formatRef('DST', ds.id)} · {ds.distributionDate}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
