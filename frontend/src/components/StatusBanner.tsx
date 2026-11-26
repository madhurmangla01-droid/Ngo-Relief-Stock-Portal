import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

interface StatusBannerProps {
  variant: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onDismiss?: () => void;
}

const STYLES = {
  success: {
    container: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    icon: CheckCircle2,
    iconColor: 'text-emerald-600',
  },
  error: {
    container: 'bg-red-50 border-red-200 text-red-900',
    icon: AlertCircle,
    iconColor: 'text-red-600',
  },
  warning: {
    container: 'bg-amber-50 border-amber-200 text-amber-950',
    icon: AlertCircle,
    iconColor: 'text-amber-600',
  },
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-900',
    icon: Info,
    iconColor: 'text-blue-600',
  },
} as const;

export function StatusBanner({ variant, message, onDismiss }: StatusBannerProps) {
  const cfg = STYLES[variant];
  const Icon = cfg.icon;

  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${cfg.container}`}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${cfg.iconColor}`} aria-hidden="true" />
        <p className="leading-snug">{message}</p>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="rounded-md p-1 opacity-70 hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 shrink-0 transition-opacity"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
