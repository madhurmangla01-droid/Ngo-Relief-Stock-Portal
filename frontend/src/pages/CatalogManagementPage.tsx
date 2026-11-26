import React, { useEffect, useState } from 'react';
import { Lock, Pencil, Plus } from 'lucide-react';
import { StatusBanner } from '../components/StatusBanner';
import { api } from '../services/api';
import type { CategoryRecord, ItemRecord } from '../types';

interface CatalogManagementPageProps {
  onStockChanged: () => void;
}

export function CatalogManagementPage({ onStockChanged }: CatalogManagementPageProps) {
  const [activeTab, setActiveTab] = useState<'items' | 'categories'>('items');
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [items, setItems] = useState<ItemRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Item form state
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemCategoryId, setItemCategoryId] = useState('');
  const [itemUnit, setItemUnit] = useState('pieces');
  const [itemMinThreshold, setItemMinThreshold] = useState('15');

  // Category form state
  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');

  const [saving, setSaving] = useState(false);

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const [catRes, itemRes] = await Promise.all([api.getCategories(), api.getItems()]);
      setCategories(catRes.categories);
      setItems(itemRes.items);
      if (!itemCategoryId && catRes.categories.length > 0) {
        setItemCategoryId(String(catRes.categories[0].id));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load items and categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const resetItemForm = () => {
    setEditingItemId(null);
    setItemName('');
    setItemUnit('pieces');
    setItemMinThreshold('15');
    if (categories.length > 0) setItemCategoryId(String(categories[0].id));
  };

  const resetCatForm = () => {
    setEditingCatId(null);
    setCatName('');
    setCatDesc('');
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!itemName.trim()) {
      setError('Item name is required.');
      return;
    }
    if (!itemCategoryId) {
      setError('Please select a category.');
      return;
    }
    if (!itemUnit.trim()) {
      setError('Unit is required.');
      return;
    }
    const threshold = Number(itemMinThreshold);
    if (!Number.isFinite(threshold) || threshold < 0) {
      setError('Minimum threshold must be 0 or greater.');
      return;
    }

    setSaving(true);
    try {
      if (editingItemId) {
        const res = await api.updateItem(editingItemId, {
          name: itemName.trim(),
          categoryId: Number(itemCategoryId),
          unit: itemUnit.trim(),
          minThreshold: threshold,
        });
        setSuccess(`Updated item "${res.item.name}".`);
      } else {
        const res = await api.createItem({
          name: itemName.trim(),
          categoryId: Number(itemCategoryId),
          unit: itemUnit.trim(),
          minThreshold: threshold,
        });
        setSuccess(`Added new item "${res.item.name}" to the permanent catalog.`);
      }
      resetItemForm();
      await loadCatalog();
      onStockChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save item.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!catName.trim()) {
      setError('Category name is required.');
      return;
    }

    setSaving(true);
    try {
      if (editingCatId) {
        const res = await api.updateCategory(editingCatId, {
          name: catName.trim(),
          description: catDesc.trim() || undefined,
        });
        setSuccess(`Updated category "${res.category.name}".`);
      } else {
        const res = await api.createCategory({
          name: catName.trim(),
          description: catDesc.trim() || undefined,
        });
        setSuccess(`Created category "${res.category.name}".`);
      }
      resetCatForm();
      await loadCatalog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save category.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Items &amp; Categories Management
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Define relief items, measurement units, categories, and minimum stock alert thresholds.
          </p>
        </div>

        <div className="inline-flex rounded-xl bg-slate-100 p-1 self-start">
          <button
            type="button"
            onClick={() => {
              setActiveTab('items');
              setError(null);
            }}
            className={`min-h-[40px] rounded-lg px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'items'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Items ({items.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('categories');
              setError(null);
            }}
            className={`min-h-[40px] rounded-lg px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'categories'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Categories ({categories.length})
          </button>
        </div>
      </div>

      {/* Permanent Audit Policy Notice */}
      <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200/80 bg-emerald-50/70 px-4 py-3 text-xs sm:text-sm text-emerald-950">
        <Lock className="h-4 w-4 text-emerald-700 shrink-0" aria-hidden="true" />
        <p>
          <strong>Permanent Record Policy:</strong> Items, categories, donations, and distributions
          can be added or updated, but never deleted—preserving a complete NGO audit trail.
        </p>
      </div>

      {error && <StatusBanner variant="error" message={error} onDismiss={() => setError(null)} />}
      {success && (
        <StatusBanner variant="success" message={success} onDismiss={() => setSuccess(null)} />
      )}

      {activeTab === 'items' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Add / Edit Item Form */}
          <form
            onSubmit={handleSaveItem}
            className="surface-card rounded-2xl p-5 sm:p-6 space-y-4"
            noValidate
          >
            <h3 className="text-base font-bold text-slate-900">
              {editingItemId ? 'Edit Item Details' : 'Add New Relief Item'}
            </h3>

            <div>
              <label
                htmlFor="cat-item-name"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Item Name <span className="text-red-600">*</span>
              </label>
              <input
                id="cat-item-name"
                type="text"
                required
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g., Cooking Oil Bottles"
                className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>

            <div>
              <label
                htmlFor="cat-item-category"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Category <span className="text-red-600">*</span>
              </label>
              <select
                id="cat-item-category"
                value={itemCategoryId}
                onChange={(e) => setItemCategoryId(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="cat-item-unit"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Unit <span className="text-red-600">*</span>
                </label>
                <input
                  id="cat-item-unit"
                  type="text"
                  required
                  value={itemUnit}
                  onChange={(e) => setItemUnit(e.target.value)}
                  placeholder="kg, kits, pcs"
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                />
              </div>
              <div>
                <label
                  htmlFor="cat-item-threshold"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Min Threshold
                </label>
                <input
                  id="cat-item-threshold"
                  type="number"
                  min="0"
                  step="any"
                  value={itemMinThreshold}
                  onChange={(e) => setItemMinThreshold(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-mono tabular-nums text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#0F2F55] to-[#1D4ED8] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-900/15 hover:from-[#0A223D] hover:to-[#1E40AF] disabled:opacity-60 transition-all"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>{editingItemId ? 'Update Item' : 'Add Item'}</span>
              </button>
              {editingItemId && (
                <button
                  type="button"
                  onClick={resetItemForm}
                  className="min-h-[44px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          {/* Items List — Mobile Cards + Tablet/Desktop Table */}
          <div className="lg:col-span-2 surface-card rounded-2xl overflow-hidden">
            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-slate-100">
              {loading && items.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-500">Loading items...</div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{item.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {item.categoryName} · Stock{' '}
                        <span className="font-mono font-semibold text-slate-800">
                          {item.currentStock} {item.unit}
                        </span>{' '}
                        · Min{' '}
                        <span className="font-mono">
                          {item.minThreshold}
                        </span>
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label={`Edit ${item.name}`}
                      onClick={() => {
                        setEditingItemId(item.id);
                        setItemName(item.name);
                        setItemCategoryId(String(item.categoryId));
                        setItemUnit(item.unit);
                        setItemMinThreshold(String(item.minThreshold));
                        setError(null);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 active:bg-blue-50 active:text-blue-700 shrink-0"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Tablet & Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500">
                    <th className="px-5 py-3">Item</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3 text-right">Stock</th>
                    <th className="px-4 py-3 text-right">Threshold</th>
                    <th className="px-5 py-3 text-right">Edit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {loading && items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-500">
                        Loading items...
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-slate-900">{item.name}</p>
                          <p className="text-xs text-slate-500">Unit: {item.unit}</p>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                          {item.categoryName}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono tabular-nums font-medium text-slate-900 whitespace-nowrap">
                          {item.currentStock} {item.unit}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono tabular-nums text-slate-600 whitespace-nowrap">
                          {item.minThreshold} {item.unit}
                        </td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            aria-label={`Edit ${item.name}`}
                            onClick={() => {
                              setEditingItemId(item.id);
                              setItemName(item.name);
                              setItemCategoryId(String(item.categoryId));
                              setItemUnit(item.unit);
                              setItemMinThreshold(String(item.minThreshold));
                              setError(null);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Edit</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Add / Edit Category Form */}
          <form
            onSubmit={handleSaveCategory}
            className="surface-card rounded-2xl p-5 sm:p-6 space-y-4"
            noValidate
          >
            <h3 className="text-base font-bold text-slate-900">
              {editingCatId ? 'Edit Category' : 'Add New Category'}
            </h3>

            <div>
              <label
                htmlFor="cat-name"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Category Name <span className="text-red-600">*</span>
              </label>
              <input
                id="cat-name"
                type="text"
                required
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="e.g., Shelter & Bedding"
                className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>

            <div>
              <label
                htmlFor="cat-desc"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Description <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                id="cat-desc"
                rows={3}
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                placeholder="Brief summary of supplies grouped under this category"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#0F2F55] to-[#1D4ED8] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-900/15 hover:from-[#0A223D] hover:to-[#1E40AF] disabled:opacity-60 transition-all"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>{editingCatId ? 'Update Category' : 'Add Category'}</span>
              </button>
              {editingCatId && (
                <button
                  type="button"
                  onClick={resetCatForm}
                  className="min-h-[44px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          {/* Categories List — Mobile Cards + Tablet/Desktop Table */}
          <div className="lg:col-span-2 surface-card rounded-2xl overflow-hidden">
            <div className="md:hidden divide-y divide-slate-100">
              {categories.map((cat) => (
                <div key={cat.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{cat.name}</p>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                      {cat.description || 'No description'} ·{' '}
                      <span className="font-mono font-medium text-slate-700">
                        {cat.itemCount} items
                      </span>
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Edit ${cat.name}`}
                    onClick={() => {
                      setEditingCatId(cat.id);
                      setCatName(cat.name);
                      setCatDesc(cat.description ?? '');
                      setError(null);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 shrink-0"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500">
                    <th className="px-5 py-3">Category</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3 text-right">Items</th>
                    <th className="px-5 py-3 text-right">Edit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-slate-900 whitespace-nowrap">
                        {cat.name}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600">
                        {cat.description || '—'}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono tabular-nums text-slate-700">
                        {cat.itemCount}
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          aria-label={`Edit ${cat.name}`}
                          onClick={() => {
                            setEditingCatId(cat.id);
                            setCatName(cat.name);
                            setCatDesc(cat.description ?? '');
                            setError(null);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
