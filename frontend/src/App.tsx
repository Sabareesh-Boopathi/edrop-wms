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
import WarehouseManagement from './pages/administration/WarehouseManagement';
import UsersAndRoles from './pages/administration/UsersAndRoles';
import Vendors from './pages/administration/Vendors';
import CrateManagement from './pages/administration/CrateManagement';
import BinManagement from './pages/administration/BinManagement';
import SystemConfiguration from './pages/administration/SystemConfiguration';
import StockMovement from './pages/reports/StockMovement';
import FulfillmentAccuracy from './pages/reports/FulfillmentAccuracy';
import CrateUtilization from './pages/reports/CrateUtilization';
import EmissionSavings from './pages/reports/EmissionSavings';
import MobileAppSync from './pages/tools/MobileAppSync';
import BarcodeGenerator from './pages/tools/BarcodeGenerator';
import FreshnessMonitoring from './pages/tools/FreshnessMonitoring';
import { Toaster } from 'components/ui/sonner';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <>
      <Router>
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
      </Router>
      <Toaster />
    </>
  );
}

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

      <Route path="administration/warehouse-management" element={<WarehouseManagement />} />
      <Route path="administration/users-roles" element={<UsersAndRoles />} />
      <Route path="administration/vendors" element={<Vendors />} />
      <Route path="administration/crate-management" element={<CrateManagement />} />
      <Route path="administration/bin-management" element={<BinManagement />} />
      <Route path="administration/system-configuration" element={<SystemConfiguration />} />

      <Route path="reports/stock-movement" element={<StockMovement />} />
      <Route path="reports/fulfillment-accuracy" element={<FulfillmentAccuracy />} />
      <Route path="reports/crate-utilization" element={<CrateUtilization />} />
      <Route path="reports/emission-savings" element={<EmissionSavings />} />

      <Route path="tools/mobile-app-sync" element={<MobileAppSync />} />
      <Route path="tools/barcode-generator" element={<BarcodeGenerator />} />
      <Route path="tools/freshness-monitoring" element={<FreshnessMonitoring />} />
    </Route>
  </Routes>
);

export default App;
