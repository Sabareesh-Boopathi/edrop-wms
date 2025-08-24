import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Login from './pages/Login';
import DashboardLayout from './pages/DashboardLayout';
import DashboardHome from './pages/DashboardHome';
import GoodsIn from './pages/inbound/GoodsIn';
import QualityCheck from './pages/inbound/QualityCheck';
import BinAllocation from './pages/inbound/BinAllocation';
import StockOverview from './pages/inventory/StockOverview';
import StockAdjustment from './pages/inventory/StockAdjustment';
import CrateInventory from './pages/inventory/CrateInventory';
import PickList from './pages/outbound/PickList';
import Packing from './pages/outbound/Packing';
import RouteBinning from './pages/outbound/RouteBinning';
import DispatchConsole from './pages/outbound/DispatchConsole';
import ReturnsManagement from './pages/returns_waste/ReturnsManagement';
import CharityDisposalRouting from './pages/returns_waste/CharityDisposalRouting';
import CrateSanitization from './pages/returns_waste/CrateSanitization';
const WarehouseManagement = React.lazy(() => import('./pages/administration/WarehouseManagement'));
const UsersAndRoles = React.lazy(() => import('./pages/administration/UsersAndRoles'));
const Vendors = React.lazy(() => import('./pages/administration/Vendors'));
const Communities = React.lazy(() => import('./pages/administration/Communities'));
const Customers = React.lazy(() => import('./pages/administration/Customers'));
const Drivers = React.lazy(() => import('./pages/administration/fleet/Drivers'));
const Vehicles = React.lazy(() => import('./pages/administration/fleet/Vehicles'));
const CrateManagement = React.lazy(() => import('./pages/administration/CrateManagement'));
const BinManagement = React.lazy(() => import('./pages/administration/BinManagement'));
const BayManagement = React.lazy(() => import('./pages/administration/BayManagement'));
const SystemConfiguration = React.lazy(() => import('./pages/administration/SystemConfiguration'));
import StockMovement from './pages/reports/StockMovement';
import FulfillmentAccuracy from './pages/reports/FulfillmentAccuracy';
import CrateUtilization from './pages/reports/CrateUtilization';
import EmissionSavings from './pages/reports/EmissionSavings';
import AuditLog from './pages/reports/AuditLog';
import MobileAppSync from './pages/tools/MobileAppSync';
import BarcodeGenerator from './pages/tools/BarcodeGenerator';
import FreshnessMonitoring from './pages/tools/FreshnessMonitoring';
import { Toaster } from './components/ui/sonner';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { ConfigProvider } from './contexts/ConfigContext';
import { useAuth } from './contexts/AuthContext';
import LoadingOverlay from './components/LoadingOverlay';

function App() {
  return (
    <>
      <Router>
        <ConfigProvider>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <DashboardRoutes />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </ConfigProvider>
      </Router>
      <Toaster />
    </>
  );
}

const SuspenseWrap: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <React.Suspense fallback={<LoadingOverlay label="Loading module" /> }>
    {children}
  </React.Suspense>
);

const DashboardRoutes = () => (
  <Routes>
    <Route path="/" element={<DashboardLayout />}>
      <Route index element={<Navigate to="/dashboard" replace />} />
      <Route path="dashboard" element={<DashboardHome />} />
      
      <Route path="inbound/goods-in" element={<GoodsIn />} />
      <Route path="inbound/quality-check" element={<QualityCheck />} />
      <Route path="inbound/bin-allocation" element={<BinAllocation />} />

      <Route path="inventory/stock-overview" element={<StockOverview />} />
      <Route path="inventory/stock-adjustment" element={<StockAdjustment />} />
      <Route path="inventory/crate-inventory" element={<CrateInventory />} />

      <Route path="outbound/pick-list" element={<PickList />} />
      <Route path="outbound/packing" element={<Packing />} />
      <Route path="outbound/route-binning" element={<RouteBinning />} />
      <Route path="outbound/dispatch-console" element={<DispatchConsole />} />

      <Route path="returns-waste/returns-management" element={<ReturnsManagement />} />
      <Route path="returns-waste/charity-disposal-routing" element={<CharityDisposalRouting />} />
      <Route path="returns-waste/crate-sanitization" element={<CrateSanitization />} />

  <Route path="administration/warehouse-management" element={<SuspenseWrap><WarehouseManagement /></SuspenseWrap>} />
  <Route path="administration/bay-management" element={<SuspenseWrap><BayManagement /></SuspenseWrap>} />
  <Route
    path="administration/users-roles"
    element={<AdminOrManagerOnly>
      <SuspenseWrap><UsersAndRoles /></SuspenseWrap>
    </AdminOrManagerOnly>}
  />
  <Route path="administration/vendors" element={<SuspenseWrap><Vendors /></SuspenseWrap>} />
  <Route path="administration/communities" element={<SuspenseWrap><Communities /></SuspenseWrap>} />
  <Route path="administration/customers" element={<SuspenseWrap><Customers /></SuspenseWrap>} />
  <Route path="administration/fleet/drivers" element={<SuspenseWrap><Drivers /></SuspenseWrap>} />
  <Route path="administration/fleet/vehicles" element={<SuspenseWrap><Vehicles /></SuspenseWrap>} />
  <Route path="administration/crate-management" element={<SuspenseWrap><CrateManagement /></SuspenseWrap>} />
  <Route path="administration/bin-management" element={<SuspenseWrap><BinManagement /></SuspenseWrap>} />
  <Route path="administration/system-configuration" element={<SuspenseWrap><SystemConfiguration /></SuspenseWrap>} />

      <Route path="reports/stock-movement" element={<StockMovement />} />
      <Route path="reports/fulfillment-accuracy" element={<FulfillmentAccuracy />} />
      <Route path="reports/crate-utilization" element={<CrateUtilization />} />
      <Route path="reports/emission-savings" element={<EmissionSavings />} />
  <Route path="reports/audit-log" element={<AuditLog />} />

      <Route path="tools/mobile-app-sync" element={<MobileAppSync />} />
      <Route path="tools/barcode-generator" element={<BarcodeGenerator />} />
      <Route path="tools/freshness-monitoring" element={<FreshnessMonitoring />} />
    </Route>
  </Routes>
);

const AdminOrManagerOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

export default App;
