import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  ClipboardList,
  FolderKanban,
  HeartHandshake,
  History,
  LayoutDashboard,
  Lock,
  LogOut,
  PanelLeftOpen,
  UserCircle,
  X,
} from 'lucide-react';
import type { PageId, UserProfile } from '../types';
import { UserAvatar } from './UserAvatar';

interface SidebarProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  user: UserProfile;
  onLogout: () => void;
  lowStockCount: number;
  drawerOpen: boolean;
  onOpenDrawer: () => void;
  onCloseDrawer: () => void;
}

interface NavItem {
  id: PageId;
  label: string;
  shortLabel: string;
  icon: typeof LayoutDashboard;
  group: 'overview' | 'operations' | 'records' | 'admin';
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', shortLabel: 'Home', icon: LayoutDashboard, group: 'overview' },
  { id: 'add-donation', label: 'Add Donation', shortLabel: 'In', icon: ArrowDownToLine, group: 'operations' },
  { id: 'distribute-goods', label: 'Distribute Goods', shortLabel: 'Out', icon: ArrowUpFromLine, group: 'operations' },
  { id: 'inventory', label: 'Inventory', shortLabel: 'Stock', icon: Boxes, group: 'operations' },
  { id: 'donation-history', label: 'Donation History', shortLabel: 'In Log', icon: History, group: 'records' },
  { id: 'distribution-history', label: 'Distribution History', shortLabel: 'Out Log', icon: ClipboardList, group: 'records' },
  { id: 'catalog', label: 'Items & Categories', shortLabel: 'Items', icon: FolderKanban, group: 'admin' },
  { id: 'profile', label: 'Profile & NGO', shortLabel: 'Profile', icon: UserCircle, group: 'admin' },
];

export function Sidebar({
  activePage,
  onNavigate,
  user,
  onLogout,
  lowStockCount,
  drawerOpen,
  onOpenDrawer,
  onCloseDrawer,
}: SidebarProps) {
  const handleSelect = (page: PageId) => {
    onNavigate(page);
    onCloseDrawer();
  };

  const renderGroup = (title: string, group: NavItem['group']) => {
    const items = NAV_ITEMS.filter((item) => item.group === group);
    return (
      <div className="mb-5">
        <p className="px-3 mb-2 text-[11px] font-medium tracking-wider text-sky-200/55">
          {title}
        </p>
        <ul className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center justify-between gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-all whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 ${
                    isActive
                      ? 'bg-white/14 text-white font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]'
                      : 'text-sky-100/75 font-medium hover:bg-white/8 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        isActive ? 'text-emerald-300' : 'text-sky-200/60'
                      }`}
                      aria-hidden="true"
                    />
                    <span className="truncate tracking-[0.01em]">{item.label}</span>
                  </span>
                  {item.id === 'inventory' && lowStockCount > 0 && (
                    <span
                      aria-label={`${lowStockCount} items below threshold`}
                      className="rounded-md bg-amber-400/20 border border-amber-300/30 px-1.5 py-0.5 text-[11px] font-mono font-semibold text-amber-200 tabular-nums shrink-0"
                    >
                      {lowStockCount}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  const fullSidebarContent = (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#0A223D] via-[#0D2A4A] to-[#0B243E] text-white border-r border-white/10">
      {/* Registered NGO Brand Crest */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-white/10 shrink-0">
        <button
          type="button"
          onClick={() => handleSelect('dashboard')}
          className="flex items-center gap-3 text-left min-w-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 rounded-xl"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 shadow-sm shrink-0">
            <HeartHandshake className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-bold tracking-tight text-white truncate leading-tight">
              {user.ngo.name}
            </span>
            <span className="block text-[11px] font-mono text-emerald-300/90 font-medium truncate mt-0.5">
              {user.ngo.registrationNumber}
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={onCloseDrawer}
          aria-label="Close navigation menu"
          className="lg:hidden rounded-lg p-2 text-sky-200/70 hover:bg-white/10 hover:text-white shrink-0"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-3 py-5">
        {renderGroup('Overview', 'overview')}
        {renderGroup('Stock Operations', 'operations')}
        {renderGroup('Permanent Ledgers', 'records')}
        {renderGroup('Organization', 'admin')}
      </nav>

      {/* Immutable Ledger Assurance & Coordinator Profile */}
      <div className="border-t border-white/10 p-3.5 shrink-0 space-y-2.5 bg-slate-950/15">
        <div className="flex items-center gap-2 rounded-xl bg-white/6 border border-white/10 px-3 py-2 text-[11px] text-sky-100/80">
          <Lock className="h-3.5 w-3.5 text-emerald-300 shrink-0" aria-hidden="true" />
          <span className="leading-tight">Immutable ledger · Zero deletion</span>
        </div>

        <button
          type="button"
          onClick={() => handleSelect('profile')}
          className={`w-full flex items-center gap-3 rounded-xl p-2 text-left transition-colors ${
            activePage === 'profile' ? 'bg-white/14' : 'hover:bg-white/8'
          }`}
        >
          <UserAvatar name={user.displayName} avatarUrl={user.avatarUrl} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">{user.displayName}</p>
            <p className="text-xs text-sky-200/70 truncate">{user.email}</p>
          </div>
        </button>

        <button
          type="button"
          onClick={onLogout}
          className="w-full min-h-[40px] flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-sky-100 hover:bg-red-500/20 hover:text-red-100 hover:border-red-400/35 transition-colors whitespace-nowrap"
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Full Sidebar (lg+) */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block lg:w-64 shadow-xl shadow-slate-950/10">
        {fullSidebarContent}
      </aside>

      {/* Tablet Compact Oceanic Navigation Rail (md to lg) */}
      <aside
        aria-label="Tablet navigation rail"
        className="hidden md:flex lg:hidden fixed inset-y-0 left-0 z-30 w-[80px] flex-col items-center bg-gradient-to-b from-[#0A223D] via-[#0D2A4A] to-[#0B243E] text-white border-r border-white/10 py-3.5 shadow-xl shadow-slate-950/10"
      >
        <button
          type="button"
          onClick={onOpenDrawer}
          title="Expand full menu"
          aria-label="Expand full navigation menu"
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 shadow-sm hover:opacity-95 transition-opacity mb-4 shrink-0"
        >
          <HeartHandshake className="h-5 w-5" aria-hidden="true" />
        </button>

        <nav className="flex-1 w-full overflow-y-auto px-2 space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                title={item.label}
                onClick={() => handleSelect(item.id)}
                className={`relative w-full min-h-[52px] flex flex-col items-center justify-center rounded-xl px-1 py-1.5 transition-all ${
                  active
                    ? 'bg-white/15 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]'
                    : 'text-sky-200/70 hover:bg-white/8 hover:text-white'
                }`}
              >
                <span className="relative">
                  <Icon
                    className={`h-5 w-5 ${active ? 'text-emerald-300' : ''}`}
                    aria-hidden="true"
                  />
                  {item.id === 'inventory' && lowStockCount > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 rounded-full bg-amber-500 px-1 text-[10px] font-mono font-bold text-white flex items-center justify-center tabular-nums">
                      {lowStockCount}
                    </span>
                  )}
                </span>
                <span className="mt-1 text-[10px] font-semibold leading-none whitespace-nowrap">
                  {item.shortLabel}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="pt-2.5 border-t border-white/10 w-full flex flex-col items-center gap-2 px-2">
          <button
            type="button"
            onClick={onOpenDrawer}
            title="Expand sidebar labels"
            aria-label="Expand sidebar"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-sky-200/75 hover:bg-white/10 hover:text-white"
          >
            <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onLogout}
            title="Sign out"
            aria-label="Sign out"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-sky-200/75 hover:bg-red-500/20 hover:text-red-200"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </aside>

      {/* Expandable Slide-Over Drawer for Tablet */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-slate-950/55 backdrop-blur-xs"
            onClick={onCloseDrawer}
          />
          <aside className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl">
            {fullSidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
