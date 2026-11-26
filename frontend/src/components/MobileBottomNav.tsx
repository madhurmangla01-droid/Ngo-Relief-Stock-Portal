import { useState } from 'react';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  ClipboardList,
  FolderKanban,
  History,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  UserCircle,
  X,
} from 'lucide-react';
import type { PageId, UserProfile } from '../types';
import { UserAvatar } from './UserAvatar';

interface MobileBottomNavProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  user: UserProfile;
  onLogout: () => void;
  lowStockCount: number;
}

const PRIMARY_TABS: Array<{
  id: PageId;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'add-donation', label: 'Goods-In', icon: ArrowDownToLine },
  { id: 'inventory', label: 'Stock', icon: Boxes },
  { id: 'distribute-goods', label: 'Goods-Out', icon: ArrowUpFromLine },
];

const MORE_ITEMS: Array<{
  id: PageId;
  label: string;
  description: string;
  icon: typeof History;
}> = [
  {
    id: 'donation-history',
    label: 'Donation History',
    description: 'Permanent goods-in transaction ledger',
    icon: History,
  },
  {
    id: 'distribution-history',
    label: 'Distribution History',
    description: 'Permanent goods-out dispatch records',
    icon: ClipboardList,
  },
  {
    id: 'catalog',
    label: 'Items & Categories',
    description: 'Manage relief items and stock thresholds',
    icon: FolderKanban,
  },
  {
    id: 'profile',
    label: 'Profile & NGO Details',
    description: 'Update display name, photo & view NGO ID',
    icon: UserCircle,
  },
];

export function MobileBottomNav({
  activePage,
  onNavigate,
  user,
  onLogout,
  lowStockCount,
}: MobileBottomNavProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const isMoreActive = MORE_ITEMS.some((item) => item.id === activePage);

  const handleSelect = (page: PageId) => {
    onNavigate(page);
    setSheetOpen(false);
  };

  return (
    <>
      {/* Frosted Bottom Tab Dock — Mobile Only (< md) */}
      <nav
        aria-label="Mobile app navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-slate-200/90 bg-white/92 backdrop-blur-xl shadow-[0_-6px_24px_-8px_rgba(11,34,57,0.1)] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="grid grid-cols-5 h-[58px] items-center px-1.5">
          {PRIMARY_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activePage === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSelect(tab.id)}
                className={`relative flex flex-col items-center justify-center min-h-[48px] rounded-xl transition-colors ${
                  active ? 'text-[#0B223D]' : 'text-slate-400 active:text-slate-800'
                }`}
              >
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute top-0.5 h-1 w-7 rounded-full bg-gradient-to-r from-blue-700 to-emerald-600"
                  />
                )}
                <span className="relative mt-0.5">
                  <Icon
                    className={`h-5 w-5 ${active ? 'text-blue-700' : ''}`}
                    aria-hidden="true"
                  />
                  {tab.id === 'inventory' && lowStockCount > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 rounded-full bg-amber-600 px-1 text-[10px] font-mono font-bold text-white flex items-center justify-center tabular-nums">
                      {lowStockCount}
                    </span>
                  )}
                </span>
                <span
                  className={`mt-0.5 text-[10px] leading-tight whitespace-nowrap ${
                    active ? 'font-bold text-blue-800' : 'font-medium'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            aria-expanded={sheetOpen}
            className={`relative flex flex-col items-center justify-center min-h-[48px] rounded-xl transition-colors ${
              isMoreActive || sheetOpen ? 'text-blue-800' : 'text-slate-400 active:text-slate-800'
            }`}
          >
            {(isMoreActive || sheetOpen) && (
              <span
                aria-hidden="true"
                className="absolute top-0.5 h-1 w-7 rounded-full bg-gradient-to-r from-blue-700 to-emerald-600"
              />
            )}
            <Menu className="h-5 w-5 mt-0.5" aria-hidden="true" />
            <span
              className={`mt-0.5 text-[10px] leading-tight whitespace-nowrap ${
                isMoreActive || sheetOpen ? 'font-bold text-blue-800' : 'font-medium'
              }`}
            >
              More
            </span>
          </button>
        </div>
      </nav>

      {/* Rounded Bottom Action Sheet */}
      {sheetOpen && (
        <div className="md:hidden fixed inset-0 z-50" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs"
            onClick={() => setSheetOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 rounded-t-3xl bg-white shadow-2xl border-t border-slate-200 max-h-[85vh] flex flex-col pb-[env(safe-area-inset-bottom)]">
            <div className="pt-3 pb-2 flex flex-col items-center">
              <div className="h-1.5 w-10 rounded-full bg-slate-300" />
            </div>

            <div className="flex items-center justify-between gap-3 px-5 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3 min-w-0">
                <UserAvatar name={user.displayName} avatarUrl={user.avatarUrl} size="md" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{user.ngo.name}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {user.displayName} ·{' '}
                    <span className="font-mono text-emerald-700">
                      {user.ngo.registrationNumber}
                    </span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                aria-label="Close menu"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto px-4 py-3 space-y-1.5">
              {MORE_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center gap-3.5 rounded-2xl px-3.5 py-3 text-left min-h-[56px] transition-colors ${
                      active ? 'bg-blue-50 text-blue-900' : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${
                        active
                          ? 'bg-[#0B223D] text-emerald-300'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{item.label}</p>
                      <p className="text-xs text-slate-500 truncate">{item.description}</p>
                    </div>
                  </button>
                );
              })}

              <div className="pt-2 px-1">
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50/75 border border-emerald-200/75 px-3.5 py-2.5 text-xs text-emerald-950">
                  <Lock className="h-3.5 w-3.5 text-emerald-700 shrink-0" aria-hidden="true" />
                  <span>All donation &amp; distribution records are permanent and protected.</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setSheetOpen(false);
                  onLogout();
                }}
                className="w-full min-h-[46px] flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50/60 px-4 py-2.5 text-sm font-semibold text-red-700 active:bg-red-100"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
