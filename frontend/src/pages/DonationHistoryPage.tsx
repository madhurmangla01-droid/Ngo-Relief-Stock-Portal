import { useEffect, useState } from 'react';
import { ArrowDownToLine, Lock, RotateCcw, Search } from 'lucide-react';
import { StatusBanner } from '../components/StatusBanner';
import { api } from '../services/api';
import type { CategoryRecord, DonationRecord, PageId } from '../types';

interface DonationHistoryPageProps {
  onNavigate: (page: PageId) => void;
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(n);
}

function formatReceiptId(id: number): string {
  return `DON-${String(id).padStart(4, '0')}`;
}

export function DonationHistoryPage({ onNavigate }: DonationHistoryPageProps) {
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [itemFilter, setItemFilter] = useState('');
  const [donorFilter, setDonorFilter] = useState('');
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
        const res = await api.getDonations({
          item: itemFilter,
          donor: donorFilter,
          categoryId,
          dateFrom,
          dateTo,
        });
        if (active) setDonations(res.donations);
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Unable to load donation history.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }, 150);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [itemFilter, donorFilter, categoryId, dateFrom, dateTo]);

  const hasFilters = Boolean(itemFilter || donorFilter || categoryId || dateFrom || dateTo);

  const resetFilters = () => {
    setItemFilter('');
    setDonorFilter('');
    setCategoryId('');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Donation History (Permanent Ledger)
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Every incoming goods-in transaction is permanently archived and cannot be deleted.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('add-donation')}
          className="hidden sm:inline-flex items-center gap-2 min-h-[42px] rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-900/15 hover:from-emerald-700 hover:to-teal-700 transition-all whitespace-nowrap shrink-0"
        >
          <ArrowDownToLine className="h-4 w-4" aria-hidden="true" />
          <span>Add Donation</span>
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
              value={donorFilter}
              onChange={(e) => setDonorFilter(e.target.value)}
              placeholder="Filter by donor..."
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
            Showing <strong className="text-slate-900 font-mono tabular-nums">{donations.length}</strong>{' '}
            permanent goods-in record{donations.length === 1 ? '' : 's'}
          </span>
          <span className="inline-flex items-center gap-1.5 text-emerald-800 font-medium">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Tamper-proof ledger</span>
          </span>
        </div>

        {loading && donations.length === 0 ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : donations.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-semibold text-slate-900">No donations found</p>
            <p className="text-xs text-slate-500 mt-1">
              {hasFilters
                ? 'No records matched your search criteria.'
                : 'Record an incoming donation to populate this ledger.'}
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
                onClick={() => onNavigate('add-donation')}
                className="mt-4 min-h-[44px] rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
              >
                Add First Donation
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile Receipt-Style Transaction List (< md) */}
            <div className="md:hidden divide-y divide-slate-100">
              {donations.map((d) => (
                <div key={d.id} className="p-4 flex items-start gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 shrink-0 mt-0.5">
                    <ArrowDownToLine className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold text-slate-900 truncate">{d.itemName}</p>
                      <p className="text-sm font-mono tabular-nums font-bold text-emerald-700 whitespace-nowrap shrink-0">
                        +{formatNumber(d.quantity)} {d.unit}
                      </p>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      From <span className="font-medium text-slate-800">{d.donorName}</span> ·{' '}
                      {d.categoryName}
                    </p>
                    {d.notes && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{d.notes}</p>
                    )}
                    <p className="text-[11px] font-mono text-slate-400 mt-1.5">
                      {formatReceiptId(d.id)} · {d.donationDate} · {d.recordedBy}
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
                    <th className="px-4 py-3">Donor</th>
                    <th className="px-4 py-3">Item</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3 text-right">Quantity</th>
                    <th className="px-4 py-3">Notes</th>
                    <th className="px-5 py-3">Recorded By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {donations.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <p className="font-mono tabular-nums text-xs font-semibold text-slate-900">
                          {formatReceiptId(d.id)}
                        </p>
                        <p className="font-mono tabular-nums text-xs text-slate-500">
                          {d.donationDate}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-slate-900">{d.donorName}</p>
                        {d.donorContact && (
                          <p className="text-xs text-slate-500">{d.donorContact}</p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-900 whitespace-nowrap">
                        {d.itemName}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                        {d.categoryName}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono tabular-nums font-semibold text-emerald-700 whitespace-nowrap">
                        +{formatNumber(d.quantity)} {d.unit}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 max-w-xs">
                        <p className="line-clamp-2 text-xs leading-relaxed">{d.notes || '—'}</p>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                        {d.recordedBy}
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
