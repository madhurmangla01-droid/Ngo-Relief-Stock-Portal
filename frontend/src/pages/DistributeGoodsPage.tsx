import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowUpFromLine, Boxes } from 'lucide-react';
import { StatusBanner } from '../components/StatusBanner';
import { StockBadge } from '../components/StockBadge';
import { api } from '../services/api';
import type { ItemRecord, PageId } from '../types';

interface DistributeGoodsPageProps {
  preselectedItemId?: number | null;
  onNavigate: (page: PageId) => void;
  onStockChanged: () => void;
}

function getTodayDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function DistributeGoodsPage({
  preselectedItemId,
  onNavigate,
  onStockChanged,
}: DistributeGoodsPageProps) {
  const [items, setItems] = useState<ItemRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [beneficiaryLocation, setBeneficiaryLocation] = useState('');
  const [distributionDate, setDistributionDate] = useState(getTodayDate());
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await api.getItems();
      setItems(res.items);

      if (preselectedItemId) {
        const match = res.items.find((i) => i.id === preselectedItemId);
        if (match) {
          setSelectedItemId(String(match.id));
          return;
        }
      }
      if (!selectedItemId && res.items.length > 0) {
        const firstAvailable = res.items.find((i) => i.currentStock > 0) ?? res.items[0];
        setSelectedItemId(String(firstAvailable.id));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load inventory items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [preselectedItemId]);

  const selectedItem = useMemo(
    () => items.find((i) => String(i.id) === selectedItemId) ?? null,
    [items, selectedItemId]
  );

  const parsedQty = Number(quantity);
  const validQty = Number.isFinite(parsedQty) && parsedQty > 0 ? parsedQty : 0;
  const availableStock = selectedItem?.currentStock ?? 0;
  const exceedsStock = validQty > availableStock;
  const remainingStock = Math.max(0, availableStock - validQty);
  const willDropBelowThreshold =
    selectedItem !== null &&
    !exceedsStock &&
    validQty > 0 &&
    remainingStock < selectedItem.minThreshold;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedItem) {
      setError('Please select an item to distribute.');
      return;
    }
    if (!Number.isFinite(parsedQty) || parsedQty <= 0) {
      setError('Distribution quantity must be a positive number greater than 0.');
      return;
    }
    if (parsedQty > selectedItem.currentStock) {
      setError(
        `Cannot distribute ${parsedQty} ${selectedItem.unit}. Only ${selectedItem.currentStock} ${selectedItem.unit} available in stock.`
      );
      return;
    }
    if (!beneficiaryLocation.trim()) {
      setError('Beneficiary or distribution location is required.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(distributionDate)) {
      setError('Please provide a valid distribution date.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.createDistribution({
        itemId: selectedItem.id,
        quantity: parsedQty,
        beneficiaryLocation: beneficiaryLocation.trim(),
        distributionDate,
        notes: notes.trim() || undefined,
      });

      setSuccess(
        `Recorded distribution of ${res.distribution.quantity} ${res.distribution.unit} of ${res.distribution.itemName} to ${res.distribution.beneficiaryLocation}. Remaining stock: ${res.distribution.remainingStock} ${res.distribution.unit}.`
      );
      setQuantity('');
      setBeneficiaryLocation('');
      setNotes('');
      await loadItems();
      onStockChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record distribution.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentStatus: 'out' | 'low' | 'healthy' = !selectedItem
    ? 'healthy'
    : selectedItem.currentStock <= 0
      ? 'out'
      : selectedItem.currentStock < selectedItem.minThreshold
        ? 'low'
        : 'healthy';

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Distribute Goods (Goods-Out)
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Issue relief supplies to beneficiaries or outreach locations. Stock decreases automatically
          and cannot go below zero.
        </p>
      </div>

      {error && <StatusBanner variant="error" message={error} onDismiss={() => setError(null)} />}
      {success && (
        <StatusBanner variant="success" message={success} onDismiss={() => setSuccess(null)} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-2 surface-card rounded-2xl p-5 sm:p-7 space-y-5"
          noValidate
        >
          <div>
            <label
              htmlFor="dist-item"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Select Item <span className="text-red-600">*</span>
            </label>
            <select
              id="dist-item"
              disabled={loading}
              value={selectedItemId}
              onChange={(e) => {
                setSelectedItemId(e.target.value);
                setError(null);
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            >
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} — {item.categoryName} ({item.currentStock} {item.unit} available)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="dist-qty" className="block text-sm font-medium text-slate-700">
                  Quantity ({selectedItem?.unit ?? 'units'}) <span className="text-red-600">*</span>
                </label>
                {selectedItem && selectedItem.currentStock > 0 && (
                  <button
                    type="button"
                    onClick={() => setQuantity(String(selectedItem.currentStock))}
                    className="text-xs font-semibold text-blue-700 hover:text-blue-800"
                  >
                    Use max ({selectedItem.currentStock})
                  </button>
                )}
              </div>
              <input
                id="dist-qty"
                type="number"
                min="0.01"
                step="any"
                max={availableStock > 0 ? availableStock : undefined}
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity to issue"
                className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm font-mono tabular-nums text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                  exceedsStock
                    ? 'border-red-400 focus:border-red-600 focus:ring-red-600/20'
                    : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/20'
                }`}
              />
              {exceedsStock && (
                <p className="mt-1.5 text-xs font-medium text-red-700">
                  Exceeds available stock ({availableStock} {selectedItem?.unit}).
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="dist-date"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Distribution Date <span className="text-red-600">*</span>
              </label>
              <input
                id="dist-date"
                type="date"
                required
                value={distributionDate}
                onChange={(e) => setDistributionDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-mono tabular-nums text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="dist-location"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Beneficiary or Distribution Location <span className="text-red-600">*</span>
            </label>
            <input
              id="dist-location"
              type="text"
              required
              value={beneficiaryLocation}
              onChange={(e) => setBeneficiaryLocation(e.target.value)}
              placeholder="e.g., Eastward Community Shelter, Zone B Clinic, or beneficiary group"
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          <div>
            <label
              htmlFor="dist-notes"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Notes <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="dist-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Recipient headcount, volunteer hand-off details, or camp reference"
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setQuantity('');
                setBeneficiaryLocation('');
                setNotes('');
                setError(null);
              }}
              className="min-h-[44px] rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Clear Form
            </button>
            <button
              type="submit"
              disabled={submitting || exceedsStock || availableStock <= 0}
              className="inline-flex items-center gap-2 min-h-[44px] rounded-xl bg-gradient-to-r from-[#0F2F55] to-[#1D4ED8] px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-900/15 hover:from-[#0A223D] hover:to-[#1E40AF] disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
            >
              <ArrowUpFromLine className="h-4 w-4" aria-hidden="true" />
              <span>{submitting ? 'Recording...' : 'Record Goods-Out'}</span>
            </button>
          </div>
        </form>

        {/* Live Stock Verification Card */}
        <aside className="surface-card rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 border border-blue-100 text-blue-700">
                <Boxes className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Stock Verification</h3>
                <p className="text-xs text-slate-500">Live available balance</p>
              </div>
            </div>
            {selectedItem && (
              <StockBadge
                status={currentStatus}
                currentStock={selectedItem.currentStock}
                minThreshold={selectedItem.minThreshold}
              />
            )}
          </div>

          <dl className="space-y-3 pt-3 border-t border-slate-100 text-sm">
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-500">Selected Item</dt>
              <dd className="font-semibold text-slate-900 text-right truncate max-w-[170px]">
                {selectedItem?.name ?? '—'}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-500">Available Now</dt>
              <dd className="font-mono tabular-nums font-semibold text-slate-900">
                {availableStock} {selectedItem?.unit ?? ''}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-500">Min Threshold</dt>
              <dd className="font-mono tabular-nums text-slate-600">
                {selectedItem?.minThreshold ?? 0} {selectedItem?.unit ?? ''}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-500">Outgoing Quantity</dt>
              <dd className="font-mono tabular-nums font-semibold text-blue-700">
                −{validQty} {selectedItem?.unit ?? ''}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
              <dt className="font-semibold text-slate-900">Remaining Stock</dt>
              <dd
                className={`font-mono tabular-nums text-base font-bold ${
                  exceedsStock
                    ? 'text-red-700'
                    : willDropBelowThreshold
                      ? 'text-amber-700'
                      : 'text-emerald-700'
                }`}
              >
                {exceedsStock ? 'Insufficient' : `${remainingStock} ${selectedItem?.unit ?? ''}`}
              </dd>
            </div>
          </dl>

          {availableStock <= 0 && selectedItem && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800 space-y-2">
              <p className="font-semibold">This item is currently out of stock.</p>
              <button
                type="button"
                onClick={() => onNavigate('add-donation')}
                className="font-semibold underline underline-offset-2 text-red-900"
              >
                Record a donation first
              </button>
            </div>
          )}

          {willDropBelowThreshold && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
              <p>
                This distribution will bring stock below the minimum threshold of{' '}
                <strong>
                  {selectedItem.minThreshold} {selectedItem.unit}
                </strong>
                .
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
