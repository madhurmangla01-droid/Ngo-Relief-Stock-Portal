import { useCallback, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Header } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Sidebar } from './components/Sidebar';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AddDonationPage } from './pages/AddDonationPage';
import { AuthPage } from './pages/AuthPage';
import { CatalogManagementPage } from './pages/CatalogManagementPage';
import { DashboardPage } from './pages/DashboardPage';
import { DistributeGoodsPage } from './pages/DistributeGoodsPage';
import { DistributionHistoryPage } from './pages/DistributionHistoryPage';
import { DonationHistoryPage } from './pages/DonationHistoryPage';
import { InventoryPage } from './pages/InventoryPage';
import { ProfilePage } from './pages/ProfilePage';
import { api } from './services/api';
import type { PageId } from './types';

function WorkspaceShell() {
  const { user, isAuthenticated, logout } = useAuth();
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [preselectedItemId, setPreselectedItemId] = useState<number | null>(null);
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState<string>('all');
  const [lowStockCount, setLowStockCount] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const refreshAlertsBadge = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await api.getDashboard();
      setLowStockCount(data.summary.alertsCount);
    } catch {
      // Non-critical nav counter refresh
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshAlertsBadge();
    } else {
      setActivePage('dashboard');
      setLowStockCount(0);
      setDrawerOpen(false);
    }
  }, [isAuthenticated, refreshAlertsBadge]);

  const handleNavigate = useCallback(
    (page: PageId, options?: { itemId?: number; inventoryStatus?: string }) => {
      setPreselectedItemId(options?.itemId ?? null);
      if (page === 'inventory') {
        setInventoryStatusFilter(options?.inventoryStatus ?? 'all');
      }
      setActivePage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    []
  );

  if (!isAuthenticated || !user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen app-canvas text-slate-900">
      <Sidebar
        activePage={activePage}
        onNavigate={(page) => handleNavigate(page)}
        user={user}
        onLogout={logout}
        lowStockCount={lowStockCount}
        drawerOpen={drawerOpen}
        onOpenDrawer={() => setDrawerOpen(true)}
        onCloseDrawer={() => setDrawerOpen(false)}
      />

      {/* Responsive layout offset: 0 on mobile, 80px rail on tablet, 256px sidebar on desktop */}
      <div className="md:pl-[80px] lg:pl-64 flex flex-col min-h-screen">
        <Header
          activePage={activePage}
          user={user}
          onNavigate={(page) => handleNavigate(page)}
        />

        <main className="flex-1 px-4 pt-5 pb-24 md:pb-8 sm:px-6 lg:px-8 max-w-[1440px] w-full mx-auto">
          <motion.div
            key={activePage}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          >
            {activePage === 'dashboard' && (
              <DashboardPage
                onNavigate={handleNavigate}
                onAlertsCountChange={setLowStockCount}
              />
            )}
            {activePage === 'add-donation' && (
              <AddDonationPage
                preselectedItemId={preselectedItemId}
                onNavigate={(page) => handleNavigate(page)}
                onStockChanged={refreshAlertsBadge}
              />
            )}
            {activePage === 'inventory' && (
              <InventoryPage
                initialStatusFilter={inventoryStatusFilter}
                onNavigate={handleNavigate}
                onStockChanged={refreshAlertsBadge}
              />
            )}
            {activePage === 'distribute-goods' && (
              <DistributeGoodsPage
                preselectedItemId={preselectedItemId}
                onNavigate={(page) => handleNavigate(page)}
                onStockChanged={refreshAlertsBadge}
              />
            )}
            {activePage === 'donation-history' && (
              <DonationHistoryPage onNavigate={(page) => handleNavigate(page)} />
            )}
            {activePage === 'distribution-history' && (
              <DistributionHistoryPage onNavigate={(page) => handleNavigate(page)} />
            )}
            {activePage === 'catalog' && (
              <CatalogManagementPage onStockChanged={refreshAlertsBadge} />
            )}
            {activePage === 'profile' && <ProfilePage />}
          </motion.div>
        </main>
      </div>

      {/* Native-feeling Mobile App Bottom Navigation */}
      <MobileBottomNav
        activePage={activePage}
        onNavigate={(page) => handleNavigate(page)}
        user={user}
        onLogout={logout}
        lowStockCount={lowStockCount}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <WorkspaceShell />
    </AuthProvider>
  );
}
