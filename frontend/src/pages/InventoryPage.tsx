import { useEffect, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Check,
  Pencil,
  Search,
  X,
} from 'lucide-react';
import { StatusBanner } from '../components/StatusBanner';
import { StockBadge } from '../components/StockBadge';
import { api } from '../services/api';
import type { CategoryRecord, InventoryRecord, PageId } from '../types';

interface InventoryPageProps {
  initialStatusFilter?: string;
  onNavigate: (page: PageId, options?: { itemId?: number }) => void;
  onStockChanged: () => void;
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(n);
}

export function InventoryPage({
  initialStatusFilter = 'all',
  onNavigate,
  onStockChanged,
}: InventoryPageProps) {
  const [rows, setRows] = useState<InventoryRecord[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);

  const [editingThresholdId, setEditingThresholdId] = useState<number | null>(null);
  const [thresholdDraft, setThresholdDraft] = useState('');
  const [savingThreshold, setSavingThreshold] = useState(false);

  useEffect(() => {
    setStatusFilter(initialStatusFilter);
  }, [initialStatusFilter]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [invRes, catRes] = await Promise.all([
        api.getInventory({ search, categoryId, status: statusFilter }),
        api.getCategories(),
      ]);
      setRows(invRes.inventory);
      setCategories(catRes.categories);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadData();
    }, 150);
    return () => window.clearTimeout(timer);
  }, [search, categoryId, statusFilter]);

  const startEditingThreshold = (row: InventoryRecord) => {
    setEditingThresholdId(row.itemId);
    setThresholdDraft(String(row.minThreshold));
    setError(null);
    setFeedback(null);
  };

  const saveThreshold = async (itemId: number) => {
    const num = Number(thresholdDraft);
    if (!Number.isFinite(num) || num < 0) {
      setError('Minimum threshold must be a number of 0 or greater.');
      return;
    }
    setSavingThreshold(true);
    setError(null);
    try {
      const res = await api.updateThreshold(itemId, num);
      setEditingThresholdId(null);
      setFeedback(
        `Updated minimum threshold for ${res.item.itemName} to ${res.item.minThreshold} ${res.item.unit}.`
      );
      await loadData();
      onStockChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update threshold.');
    } finally {
      setSavingThreshold(false);
    }
  };

  const lowCount = rows.filter((r) => r.stockStatus === 'low').length;
  const outCount = rows.filter((r) => r.stockStatus === 'out').length;

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Inventory &amp; Item Movement
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Monitor cumulative receipts, distributions, available stock, and low-stock threshold
            badges.
          </p>
        </div>

        <div className="hidden sm:flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('add-donation')}
            className="inline-flex items-center gap-1.5 min-h-[40px] rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-emerald-900/15 hover:from-emerald-700 hover:to-teal-700 transition-all whitespace-nowrap"
          >
            <ArrowDownToLine className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Add Donation</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('distribute-goods')}
            className="inline-flex items-center gap-1.5 min-h-[40px] rounded-xl bg-gradient-to-r from-[#0F2F55] to-[#1D4ED8] px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-blue-900/15 hover:from-[#0A223D] hover:to-[#1E40AF] transition-all whitespace-nowrap"
          >
            <ArrowUpFromLine className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Distribute Goods</span>
          </button>
        </div>
      </div>

      {error && <StatusBanner variant="error" message={error} onDismiss={() => setError(null)} />}
      {feedback && (
        <StatusBanner variant="success" message={feedback} onDismiss={() => setFeedback(null)} />
      )}

      {/* Filters Toolbar */}
      <div className="surface-card rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items or categories..."
              className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          <select
            aria-label="Filter by category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Segmented Status Controls */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 overflow-x-auto">
          {[
            { id: 'all', label: 'All Items' },
            { id: 'low', label: 'Below Threshold' },
            { id: 'out', label: 'Out of Stock' },
            { id: 'healthy', label: 'In Stock' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`min-h-[38px] rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                statusFilter === tab.id
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Results */}
      <div className="surface-card rounded-2xl overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 py-3.5 border-b border-slate-200 bg-slate-50/50 text-xs text-slate-600">
          <span>
            Showing <strong className="text-slate-900 font-mono tabular-nums">{rows.length}</strong>{' '}
            inventory item{rows.length === 1 ? '' : 's'}
          </span>
          {(lowCount > 0 || outCount > 0) && (
            <span className="font-medium text-amber-800">
              {outCount} out of stock · {lowCount} below minimum threshold
            </span>
          )}
        </div>

        {loading && rows.length === 0 ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-semibold text-slate-900">No matching inventory items</p>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your search or filter criteria, or add a new item in Items &amp;
              Categories.
            </p>
            {(search || categoryId || statusFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setCategoryId('');
                  setStatusFilter('all');
                }}
                className="mt-4 min-h-[44px] rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile App Card List (< md) */}
            <div className="md:hidden divide-y divide-slate-100">
              {rows.map((row) => {
                const isEditing = editingThresholdId === row.itemId;
                return (
                  <div
                    key={row.itemId}
                    className={`p-4 space-y-3 ${
                      row.stockStatus === 'out'
                        ? 'bg-red-50/25'
                        : row.stockStatus === 'low'
                          ? 'bg-amber-50/25'
                          : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{row.itemName}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {row.categoryName} · {row.unit}
                        </p>
                      </div>
                      <StockBadge
                        status={row.stockStatus}
                        currentStock={row.currentStock}
                        minThreshold={row.minThreshold}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-center">
                      <div>
                        <p className="text-[11px] text-slate-500">Received</p>
                        <p className="text-xs font-mono tabular-nums font-semibold text-emerald-700 mt-0.5">
                          {formatNumber(row.totalReceived)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500">Distributed</p>
                        <p className="text-xs font-mono tabular-nums font-semibold text-blue-700 mt-0.5">
                          {formatNumber(row.totalDistributed)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500">Available</p>
                        <p className="text-sm font-mono tabular-nums font-bold text-slate-900 mt-0.5">
                          {formatNumber(row.currentStock)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            aria-label={`Minimum threshold for ${row.itemName}`}
                            value={thresholdDraft}
                            onChange={(e) => setThresholdDraft(e.target.value)}
                            className="w-20 min-h-[38px] rounded-lg border border-blue-400 bg-white px-2 text-xs font-mono tabular-nums"
                          />
                          <button
                            type="button"
                            disabled={savingThreshold}
                            onClick={() => saveThreshold(row.itemId)}
                            aria-label="Save threshold"
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingThresholdId(null)}
                            aria-label="Cancel threshold edit"
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-200 text-slate-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEditingThreshold(row)}
                          className="inline-flex items-center gap-1.5 min-h-[38px] rounded-lg px-2 text-xs text-slate-600 active:bg-slate-100"
                        >
                          <span>
                            Min:{' '}
                            <strong className="font-mono text-slate-900">
                              {formatNumber(row.minThreshold)}
                            </strong>
                          </span>
                          <Pencil className="h-3 w-3 text-slate-400" aria-hidden="true" />
                        </button>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onNavigate('add-donation', { itemId: row.itemId })}
                          className="min-h-[40px] rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 text-xs font-semibold text-emerald-800 active:bg-emerald-100"
                        >
                          + In
                        </button>
                        <button
                          type="button"
                          disabled={row.currentStock <= 0}
                          onClick={() => onNavigate('distribute-goods', { itemId: row.itemId })}
                          className="min-h-[40px] rounded-xl border border-blue-200 bg-blue-50 px-3.5 text-xs font-semibold text-blue-800 active:bg-blue-100 disabled:opacity-40"
                        >
                          − Out
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tablet & Desktop Table (md+) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500">
                    <th className="px-5 py-3">Item Name</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3 text-right">Received</th>
                    <th className="px-4 py-3 text-right">Distributed</th>
                    <th className="px-4 py-3 text-right">Available Stock</th>
                    <th className="px-4 py-3 text-right">Min Threshold</th>
                    <th className="px-4 py-3">Stock Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {rows.map((row) => {
                    const isEditing = editingThresholdId === row.itemId;
                    const rowBg =
                      row.stockStatus === 'out'
                        ? 'bg-red-50/30 hover:bg-red-50/60'
                        : row.stockStatus === 'low'
                          ? 'bg-amber-50/30 hover:bg-amber-50/60'
                          : 'hover:bg-slate-50/70';

                    return (
                      <tr key={row.itemId} className={`transition-colors ${rowBg}`}>
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-slate-900">{row.itemName}</p>
                          <p className="text-xs text-slate-500">Unit: {row.unit}</p>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                          {row.categoryName}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono tabular-nums text-emerald-700 font-medium whitespace-nowrap">
                          {formatNumber(row.totalReceived)} {row.unit}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono tabular-nums text-blue-700 font-medium whitespace-nowrap">
                          {formatNumber(row.totalDistributed)} {row.unit}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono tabular-nums font-bold text-slate-900 whitespace-nowrap">
                          {formatNumber(row.currentStock)} {row.unit}
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          {isEditing ? (
                            <div className="inline-flex items-center gap-1 justify-end">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                aria-label={`Minimum threshold for ${row.itemName}`}
                                value={thresholdDraft}
                                onChange={(e) => setThresholdDraft(e.target.value)}
                                className="w-20 rounded-md border border-blue-400 bg-white px-2 py-1 text-right text-xs font-mono tabular-nums focus:outline-none"
                              />
                              <button
                                type="button"
                                disabled={savingThreshold}
                                onClick={() => saveThreshold(row.itemId)}
                                aria-label="Save threshold"
                                className="rounded-md bg-emerald-600 p-1 text-white hover:bg-emerald-700"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingThresholdId(null)}
                                aria-label="Cancel threshold edit"
                                className="rounded-md bg-slate-200 p-1 text-slate-700 hover:bg-slate-300"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startEditingThreshold(row)}
                              title="Click to adjust minimum stock threshold"
                              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono tabular-nums text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                            >
                              <span>
                                {formatNumber(row.minThreshold)} {row.unit}
                              </span>
                              <Pencil className="h-3 w-3 text-slate-400" aria-hidden="true" />
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <StockBadge
                            status={row.stockStatus}
                            currentStock={row.currentStock}
                            minThreshold={row.minThreshold}
                          />
                        </td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onNavigate('add-donation', { itemId: row.itemId })}
                              className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors"
                            >
                              + In
                            </button>
                            <button
                              type="button"
                              disabled={row.currentStock <= 0}
                              onClick={() => onNavigate('distribute-goods', { itemId: row.itemId })}
                              className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-800 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                              − Out
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
