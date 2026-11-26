import { useEffect, useState } from 'react';
import { ArrowUpFromLine, Lock, RotateCcw, Search } from 'lucide-react';
import { StatusBanner } from '../components/StatusBanner';
import { api } from '../services/api';
import type { CategoryRecord, DistributionRecord, PageId } from '../types';

interface DistributionHistoryPageProps {
  onNavigate: (page: PageId) => void;
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(n);
}

function formatDispatchId(id: number): string {
  return `DST-${String(id).padStart(4, '0')}`;
}

export function DistributionHistoryPage({ onNavigate }: DistributionHistoryPageProps) {
  const [distributions, setDistributions] = useState<DistributionRecord[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [itemFilter, setItemFilter] = useState('');
  const [beneficiaryFilter, setBeneficiaryFilter] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    api
      .getCategories()
      .then((res) => setCategories(res.categories))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.getDistributions({
          item: itemFilter,
          beneficiary: beneficiaryFilter,
          categoryId,
          dateFrom,
          dateTo,
        });
        if (active) setDistributions(res.distributions);
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Unable to load distribution history.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }, 150);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [itemFilter, beneficiaryFilter, categoryId, dateFrom, dateTo]);

  const hasFilters = Boolean(itemFilter || beneficiaryFilter || categoryId || dateFrom || dateTo);

  const resetFilters = () => {
    setItemFilter('');
    setBeneficiaryFilter('');
    setCategoryId('');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Distribution History (Permanent Ledger)
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Every outgoing goods-out dispatch is permanently recorded for full NGO accountability.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('distribute-goods')}
          className="hidden sm:inline-flex items-center gap-2 min-h-[42px] rounded-xl bg-gradient-to-r from-[#0F2F55] to-[#1D4ED8] px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-900/15 hover:from-[#0A223D] hover:to-[#1E40AF] transition-all whitespace-nowrap shrink-0"
        >
          <ArrowUpFromLine className="h-4 w-4" aria-hidden="true" />
          <span>Distribute Goods</span>
        </button>
      </div>

      {error && <StatusBanner variant="error" message={error} onDismiss={() => setError(null)} />}

      {/* Filter Panel */}
      <div className="surface-card rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="text"
              value={itemFilter}
              onChange={(e) => setItemFilter(e.target.value)}
              placeholder="Filter by item..."
              className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="text"
              value={beneficiaryFilter}
              onChange={(e) => setBeneficiaryFilter(e.target.value)}
              placeholder="Beneficiary or location..."
              className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          <select
            aria-label="Filter by category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <input
            type="date"
            aria-label="From date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-mono tabular-nums text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
          />

          <input
            type="date"
            aria-label="To date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-mono tabular-nums text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
          />
        </div>

        {hasFilters && (
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-700"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Results Ledger */}
      <div className="surface-card rounded-2xl overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 py-3.5 border-b border-slate-200 bg-slate-50/50 text-xs text-slate-600">
          <span>
            Showing{' '}
            <strong className="text-slate-900 font-mono tabular-nums">{distributions.length}</strong>{' '}
            permanent goods-out record{distributions.length === 1 ? '' : 's'}
          </span>
          <span className="inline-flex items-center gap-1.5 text-emerald-800 font-medium">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Tamper-proof ledger</span>
          </span>
        </div>

        {loading && distributions.length === 0 ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : distributions.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-semibold text-slate-900">No distributions found</p>
            <p className="text-xs text-slate-500 mt-1">
              {hasFilters
                ? 'No dispatches matched your current filters.'
                : 'Record an outgoing distribution to see it listed here.'}
            </p>
            {hasFilters ? (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 min-h-[44px] rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Reset Filters
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate('distribute-goods')}
                className="mt-4 min-h-[44px] rounded-xl bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800"
              >
                Record First Distribution
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile Receipt-Style Dispatch List (< md) */}
            <div className="md:hidden divide-y divide-slate-100">
              {distributions.map((ds) => (
                <div key={ds.id} className="p-4 flex items-start gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 shrink-0 mt-0.5">
                    <ArrowUpFromLine className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold text-slate-900 truncate">{ds.itemName}</p>
                      <p className="text-sm font-mono tabular-nums font-bold text-blue-700 whitespace-nowrap shrink-0">
                        −{formatNumber(ds.quantity)} {ds.unit}
                      </p>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      To <span className="font-medium text-slate-800">{ds.beneficiaryLocation}</span>{' '}
                      · {ds.categoryName}
                    </p>
                    {ds.notes && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{ds.notes}</p>
                    )}
                    <p className="text-[11px] font-mono text-slate-400 mt-1.5">
                      {formatDispatchId(ds.id)} · {ds.distributionDate} · {ds.recordedBy}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Tablet & Desktop Table (md+) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500">
                    <th className="px-5 py-3">Ref &amp; Date</th>
                    <th className="px-4 py-3">Item</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3 text-right">Quantity</th>
                    <th className="px-4 py-3">Beneficiary / Location</th>
                    <th className="px-4 py-3">Notes</th>
                    <th className="px-5 py-3">Recorded By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {distributions.map((ds) => (
                    <tr key={ds.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <p className="font-mono tabular-nums text-xs font-semibold text-slate-900">
                          {formatDispatchId(ds.id)}
                        </p>
                        <p className="font-mono tabular-nums text-xs text-slate-500">
                          {ds.distributionDate}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-900 whitespace-nowrap">
                        {ds.itemName}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                        {ds.categoryName}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono tabular-nums font-semibold text-blue-700 whitespace-nowrap">
                        −{formatNumber(ds.quantity)} {ds.unit}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-900">
                        {ds.beneficiaryLocation}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 max-w-xs">
                        <p className="line-clamp-2 text-xs leading-relaxed">{ds.notes || '—'}</p>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                        {ds.recordedBy}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
