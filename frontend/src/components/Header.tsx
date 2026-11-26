import { ArrowDownToLine, HeartHandshake } from 'lucide-react';
import type { PageId, UserProfile } from '../types';
import { UserAvatar } from './UserAvatar';

interface HeaderProps {
  activePage: PageId;
  user: UserProfile;
  onNavigate: (page: PageId) => void;
}

const PAGE_TITLES: Record<PageId, string> = {
  dashboard: 'Dashboard',
  'add-donation': 'Add Donation',
  inventory: 'Inventory & Stock',
  'distribute-goods': 'Distribute Goods',
  'donation-history': 'Donation History',
  'distribution-history': 'Distribution History',
  catalog: 'Items & Categories',
  profile: 'Profile & NGO',
};

export function Header({ activePage, user, onNavigate }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-14 md:h-16 items-center justify-between gap-3 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl px-4 sm:px-6 lg:px-8">
      {/* Left: Mobile Brand + Page Title / Tablet & Desktop Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={() => onNavigate('dashboard')}
          aria-label="Go to Dashboard"
          className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#0B223D] to-[#1D4ED8] text-white shadow-sm shrink-0"
        >
          <HeartHandshake className="h-4 w-4 text-emerald-300" aria-hidden="true" />
        </button>

        <div className="min-w-0">
          <div className="hidden md:flex items-center gap-2.5 text-sm min-w-0">
            <span className="text-slate-400 font-medium whitespace-nowrap truncate max-w-[190px]">
              {user.ngo.name}
            </span>
            <span className="text-slate-300" aria-hidden="true">
              /
            </span>
            <h1 className="text-lg lg:text-xl font-semibold tracking-tight text-slate-900 truncate">
              {PAGE_TITLES[activePage]}
            </h1>
          </div>

          <div className="md:hidden min-w-0">
            <h1 className="text-base font-semibold tracking-tight text-slate-900 truncate leading-tight">
              {PAGE_TITLES[activePage]}
            </h1>
            <p className="text-[11px] text-slate-500 truncate leading-tight">
              {user.ngo.name}
            </p>
          </div>
        </div>
      </div>

      {/* Right: Quick Action + Coordinator Profile Chip */}
      <div className="flex items-center gap-2.5 shrink-0">
        {activePage !== 'add-donation' && (
          <button
            type="button"
            onClick={() => onNavigate('add-donation')}
            className="hidden sm:inline-flex items-center gap-1.5 min-h-[40px] rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-emerald-900/15 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            <ArrowDownToLine className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Record Donation</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => onNavigate('profile')}
          title="Edit profile & view NGO details"
          className="flex items-center gap-2.5 min-h-[40px] rounded-xl border border-slate-200/90 bg-white/90 pl-1.5 pr-2 md:pr-3 py-1 hover:border-blue-300 hover:bg-blue-50/30 transition-all focus-visible:outline-2 focus-visible:outline-blue-600 shrink-0"
        >
          <UserAvatar name={user.displayName} avatarUrl={user.avatarUrl} size="sm" />
          <div className="hidden md:block text-left max-w-[155px]">
            <p className="text-xs font-semibold text-slate-900 truncate leading-tight">
              {user.displayName}
            </p>
            <p className="text-[11px] font-mono text-emerald-700 truncate leading-tight">
              {user.ngo.registrationNumber}
            </p>
          </div>
        </button>
      </div>
    </header>
  );
}
