import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDownToLine, Boxes, Plus } from 'lucide-react';
import { StatusBanner } from '../components/StatusBanner';
import { api } from '../services/api';
import type { CategoryRecord, DonorRecord, ItemRecord, PageId } from '../types';

interface AddDonationPageProps {
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

export function AddDonationPage({
  preselectedItemId,
  onNavigate,
  onStockChanged,
}: AddDonationPageProps) {
  const [items, setItems] = useState<ItemRecord[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [donors, setDonors] = useState<DonorRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [donorName, setDonorName] = useState('');
  const [donorContact, setDonorContact] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [isNewItem, setIsNewItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [donationDate, setDonationDate] = useState(getTodayDate());
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const [itemsRes, catRes, donorsRes] = await Promise.all([
        api.getItems(),
        api.getCategories(),
        api.getDonors(),
      ]);
      setItems(itemsRes.items);
      setCategories(catRes.categories);
      setDonors(donorsRes.donors);

      if (preselectedItemId) {
        const match = itemsRes.items.find((i) => i.id === preselectedItemId);
        if (match) {
          setIsNewItem(false);
          setSelectedItemId(String(match.id));
          setSelectedCategoryId(String(match.categoryId));
          setUnit(match.unit);
        }
      } else if (itemsRes.items.length > 0 && !selectedItemId) {
        const first = itemsRes.items[0];
        setSelectedItemId(String(first.id));
        setSelectedCategoryId(String(first.categoryId));
        setUnit(first.unit);
      } else if (catRes.categories.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(String(catRes.categories[0].id));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load catalog data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, [preselectedItemId]);

  const selectedItem = useMemo(
    () => items.find((i) => String(i.id) === selectedItemId) ?? null,
    [items, selectedItemId]
  );

  const handleSelectItem = (value: string) => {
    if (value === 'new') {
      setIsNewItem(true);
      setSelectedItemId('new');
      setNewItemName('');
      setUnit('');
      if (categories.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(String(categories[0].id));
      }
      return;
    }
    setIsNewItem(false);
    setSelectedItemId(value);
    const found = items.find((i) => String(i.id) === value);
    if (found) {
      setSelectedCategoryId(String(found.categoryId));
      setUnit(found.unit);
    }
  };

  const parsedQty = Number(quantity);
  const validQty = Number.isFinite(parsedQty) && parsedQty > 0 ? parsedQty : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!donorName.trim()) {
      setError('Donor name is required.');
      return;
    }
    if (isNewItem) {
      if (!newItemName.trim()) {
        setError('Please enter the new item name.');
        return;
      }
      if (!selectedCategoryId) {
        setError('Please select an item category.');
        return;
      }
    } else if (!selectedItemId) {
      setError('Please select an item.');
      return;
    }

    if (!unit.trim()) {
      setError('Unit is required (e.g., kg, pieces, kits, boxes).');
      return;
    }
    if (!Number.isFinite(parsedQty) || parsedQty <= 0) {
      setError('Quantity must be a positive number greater than 0.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(donationDate)) {
      setError('Please enter a valid donation date.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.createDonation(
        isNewItem
          ? {
              donorName: donorName.trim(),
              donorContact: donorContact.trim() || undefined,
              itemId: 'new',
              itemName: newItemName.trim(),
              categoryId: Number(selectedCategoryId),
              quantity: parsedQty,
              unit: unit.trim(),
              donationDate,
              notes: notes.trim() || undefined,
            }
          : {
              donorName: donorName.trim(),
              donorContact: donorContact.trim() || undefined,
              itemId: Number(selectedItemId),
              quantity: parsedQty,
              unit: unit.trim(),
              donationDate,
              notes: notes.trim() || undefined,
            }
      );

      setSuccess(
        `Recorded donation of ${res.donation.quantity} ${res.donation.unit} of ${res.donation.itemName} from ${res.donation.donorName}. Current available stock is now ${res.donation.updatedStock} ${res.donation.unit}.`
      );
      setQuantity('');
      setNotes('');
      setDonorContact('');
      if (isNewItem) {
        setIsNewItem(false);
        setNewItemName('');
        setSelectedItemId(String(res.donation.itemId));
      }
      await loadCatalog();
      onStockChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record donation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Record Incoming Donation
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Log received goods from donors. Inventory stock increases automatically when saved.
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
          {/* Donor Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="donor-name"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Donor Name <span className="text-red-600">*</span>
              </label>
              <input
                id="donor-name"
                type="text"
                list="donor-suggestions"
                required
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                placeholder="Individual or organization name"
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
              <datalist id="donor-suggestions">
                {donors.map((d) => (
                  <option key={d.id} value={d.name} />
                ))}
              </datalist>
            </div>

            <div>
              <label
                htmlFor="donor-contact"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Donor Contact <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                id="donor-contact"
                type="text"
                value={donorContact}
                onChange={(e) => setDonorContact(e.target.value)}
                placeholder="Phone or email"
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
          </div>

          {/* Item Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="donation-item"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Item Name <span className="text-red-600">*</span>
              </label>
              <select
                id="donation-item"
                disabled={loading}
                value={isNewItem ? 'new' : selectedItemId}
                onChange={(e) => handleSelectItem(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.currentStock} {item.unit} in stock)
                  </option>
                ))}
                <option value="new">+ Create a new item...</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="donation-category"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Item Category <span className="text-red-600">*</span>
              </label>
              <select
                id="donation-category"
                disabled={!isNewItem}
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 disabled:bg-slate-50 disabled:text-slate-600 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isNewItem && (
            <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4">
              <label
                htmlFor="new-item-name"
                className="block text-sm font-medium text-blue-950 mb-1.5"
              >
                New Item Name <span className="text-red-600">*</span>
              </label>
              <input
                id="new-item-name"
                type="text"
                required
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="e.g., Drinking Water Bottles"
                className="w-full rounded-lg border border-blue-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
          )}

          {/* Quantity, Unit & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="donation-qty"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Quantity <span className="text-red-600">*</span>
              </label>
              <input
                id="donation-qty"
                type="number"
                min="0.01"
                step="any"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g., 50"
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-mono tabular-nums text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>

            <div>
              <label
                htmlFor="donation-unit"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Unit <span className="text-red-600">*</span>
              </label>
              <input
                id="donation-unit"
                type="text"
                required
                readOnly={!isNewItem}
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="kg, pieces, kits"
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 read-only:bg-slate-50 read-only:text-slate-600 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>

            <div>
              <label
                htmlFor="donation-date"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Donation Date <span className="text-red-600">*</span>
              </label>
              <input
                id="donation-date"
                type="date"
                required
                value={donationDate}
                onChange={(e) => setDonationDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-mono tabular-nums text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label
              htmlFor="donation-notes"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Notes <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="donation-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Batch details, packaging notes, or drop-off reference"
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setDonorName('');
                setDonorContact('');
                setQuantity('');
                setNotes('');
                setError(null);
              }}
              className="min-h-[44px] rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Clear Form
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 min-h-[44px] rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-900/15 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-60 transition-all whitespace-nowrap"
            >
              <ArrowDownToLine className="h-4 w-4" aria-hidden="true" />
              <span>{submitting ? 'Saving Donation...' : 'Record Goods-In'}</span>
            </button>
          </div>
        </form>

        {/* Live Stock Impact Panel */}
        <aside className="surface-card rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700">
              <Boxes className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Stock Impact Preview</h3>
              <p className="text-xs text-slate-500">Updates automatically on save</p>
            </div>
          </div>

          <dl className="space-y-3 pt-3 border-t border-slate-100 text-sm">
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-500">Item</dt>
              <dd className="font-semibold text-slate-900 text-right truncate max-w-[180px]">
                {isNewItem ? newItemName.trim() || 'New item' : selectedItem?.name ?? '—'}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-500">Current Stock</dt>
              <dd className="font-mono tabular-nums font-medium text-slate-700">
                {isNewItem ? 0 : selectedItem?.currentStock ?? 0} {unit || ''}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-500">Incoming Goods</dt>
              <dd className="font-mono tabular-nums font-semibold text-emerald-700">
                +{validQty} {unit || ''}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
              <dt className="font-semibold text-slate-900">Projected Stock</dt>
              <dd className="font-mono tabular-nums text-base font-bold text-slate-900">
                {(isNewItem ? 0 : selectedItem?.currentStock ?? 0) + validQty} {unit || ''}
              </dd>
            </div>
          </dl>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => onNavigate('inventory')}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              View Live Inventory
            </button>
            <button
              type="button"
              onClick={() => onNavigate('catalog')}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Manage Items &amp; Categories</span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
