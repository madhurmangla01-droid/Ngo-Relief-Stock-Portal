import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

interface StockBadgeProps {
  status: 'out' | 'low' | 'healthy';
  currentStock?: number;
  minThreshold?: number;
}

export function StockBadge({ status, currentStock, minThreshold }: StockBadgeProps) {
  if (status === 'out') {
    return (
      <span
        title={
          minThreshold !== undefined
            ? `Out of stock (minimum threshold: ${minThreshold})`
            : 'Out of stock'
        }
        className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 whitespace-nowrap shrink-0"
      >
        <XCircle className="h-3.5 w-3.5 text-red-600 shrink-0" aria-hidden="true" />
        <span>Out of Stock</span>
      </span>
    );
  }

  if (status === 'low') {
    return (
      <span
        title={
          currentStock !== undefined && minThreshold !== undefined
            ? `Stock (${currentStock}) is below minimum threshold (${minThreshold})`
            : 'Below minimum stock threshold'
        }
        className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 whitespace-nowrap shrink-0"
      >
        <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" aria-hidden="true" />
        <span>Low Stock</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 whitespace-nowrap shrink-0">
      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
      <span>In Stock</span>
    </span>
  );
}
