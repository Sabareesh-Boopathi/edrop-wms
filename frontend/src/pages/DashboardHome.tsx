import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
  Package, Truck, Users, DollarSign, TrendingUp, TrendingDown, ArrowUp, ArrowDown,
  Clock, BarChart3, PieChart, Activity, Zap, Target, ShieldCheck,
  Timer, RefreshCw, Bell, Settings, AlertTriangle, CheckCircle,
  Warehouse, Box, ClipboardList, PauseCircle, Wrench, PackageCheck
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, RadialBarChart, RadialBar
} from 'recharts';
import '../pages/Dashboard.css';
import SectionHeader from '../components/SectionHeader';

// Services
import * as inboundService from '../services/inboundService';
import * as outboundService from '../services/outboundService';
import * as userService from '../services/userService';
import * as vehicleService from '../services/vehicleService';
import * as driverService from '../services/driverService';
import * as crateService from '../services/crateService';
import * as communityService from '../services/communityService';
import * as customerService from '../services/customerService';
import * as productService from '../services/productService';
import * as orderService from '../services/orderService';
import * as vendorService from '../services/vendorService';
import * as milestoneService from '../services/milestoneService';
import * as notificationService from '../services/notificationService';
import { useGetOrdersQuery, useGetPickTasksQuery, useGetDispatchRoutesQuery } from '../store/api';

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5
    }
  }
};

const pulseVariants: Variants = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [0.7, 1, 0.7],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

const fmtINR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export default function DashboardHome() {
  // State variables
  const [loading, setLoading] = useState<boolean>(true);
  const [inKpi, setInKpi] = useState<any>({});
  const [pickStats, setPickStats] = useState<any>({});
  const [dispatchStats, setDispatchStats] = useState<any>({});
  const [invTotals, setInvTotals] = useState<any>({});
  const [rackStats, setRackStats] = useState<any>({});
  const [binStats, setBinStats] = useState<any>({});
  const [bayKpi, setBayKpi] = useState<any>({});
  const [userStats, setUserStats] = useState<any>({});
  const [vehicleStats, setVehicleStats] = useState<any>({});
  const [driverStats, setDriverStats] = useState<any>({});
  const [crateStats, setCrateStats] = useState<any>({});
  const [communityStats, setCommunityStats] = useState<any>({});
  const [customerStats, setCustomerStats] = useState<any>({});
  const [productStats, setProductStats] = useState<any>({});
  const [vendorStats, setVendorStats] = useState<any>({});
  const [orderStats, setOrderStats] = useState<any>({});
  const [milestones, setMilestones] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [warehouseId] = useState<string | null>(null);

  // Sample data for charts
  const performanceChart = [
    { name: '6 AM', orders: 12, revenue: 24000 },
    { name: '9 AM', orders: 25, revenue: 48000 },
    { name: '12 PM', orders: 38, revenue: 72000 },
    { name: '3 PM', orders: 45, revenue: 89000 },
    { name: '6 PM', orders: 52, revenue: 105000 },
    { name: '9 PM', orders: 28, revenue: 58000 }
  ];

  const warehouseUtilization = [
    { name: 'Occupied', value: rackStats.utilPct || 75, color: '#22c55e' },
    { name: 'Available', value: 100 - (rackStats.utilPct || 75), color: '#e5e7eb' }
  ];

  const performanceData = {
    overallEfficiency: 92,
    qualityScore: 98,
    onTimeDelivery: 94
  };

  const realTimeMetrics = {
    todayShipments: vehicleStats.inService || 8,
    customerSatisfaction: 96
  };

  // Data loading effect
  useEffect(() => {
    const ac = new AbortController();
    loadDashboardData();
    return () => {
      ac.abort();
    };
  }, [warehouseId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Load all data concurrently
      await Promise.all([
        loadInboundData(),
        loadOutboundData(),
        loadInventoryData(),
        loadUserData(),
        loadVehicleData(),
        loadDriverData(),
        loadCrateData(),
        loadCommunityData(),
        loadCustomerData(),
        loadProductData(),
        loadVendorData(),
        loadOrderData(),
        loadMilestones(),
        loadNotifications()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInboundData = async () => {
    try {
      const kpi = await inboundService.computeKpis(/* warehouseId || undefined */);
      setInKpi(kpi);
    } catch (e) { 
      setInKpi({ totalReceipts: 0, openReceipts: 0, completedToday: 0, pending: 0, binsAllocated: 0 }); 
    }
  };

  const loadOutboundData = async () => {
    try {
  const pickTasks = await outboundService.fetchPickTasks();
      const total = pickTasks.length;
      const inProgress = pickTasks.filter((task: any) => task.status === 'in_progress').length;
      const completed = pickTasks.filter((task: any) => task.status === 'completed').length;
      setPickStats({ total, inProgress, completed });

  const dispatchRoutes = await outboundService.fetchDispatchRoutes();
      const ready = dispatchRoutes.filter((route: any) => route.status === 'ready').length;
      const dispatched = dispatchRoutes.filter((route: any) => route.status === 'dispatched').length;
      const pending = dispatchRoutes.filter((route: any) => route.status === 'pending').length;
      setDispatchStats({ ready, dispatched, pending });
    } catch (e) { 
      setPickStats({ total: 0, inProgress: 0, completed: 0 });
      setDispatchStats({ ready: 0, dispatched: 0, pending: 0 });
    }
  };

  const loadInventoryData = async () => {
    try {
      // Since inventoryService doesn't exist, use hardcoded values
      setInvTotals({ totalSkus: 156, totalQty: 25000, totalValue: 1250000 });
      setRackStats({ utilPct: 75 });
      setBinStats({ total: 500, occupied: 375 });
      setBayKpi({ total: 12, occupied: 9 });
    } catch (e) { 
      setInvTotals({ totalSkus: 0, totalQty: 0, totalValue: 0 });
      setRackStats({ utilPct: 0 });
      setBinStats({ total: 0, occupied: 0 });
      setBayKpi({ total: 0, occupied: 0 });
    }
  };

  const loadUserData = async () => {
    try {
      const us = await userService.getUsers();
      const users = us.length;
      const active = us.filter((u: any) => (u.status || '').toUpperCase() === 'ACTIVE').length;
      setUserStats({ users, active });
    } catch (e) { 
      setUserStats({ users: 0, active: 0 }); 
    }
  };

  const loadVehicleData = async () => {
    try {
      const vehs = await vehicleService.listVehicles(warehouseId ? { warehouse_id: warehouseId } : undefined);
      const total = vehs.length;
      const available = vehs.filter((v: any) => v.status === 'AVAILABLE').length;
      const inService = vehs.filter((v: any) => v.status === 'IN_SERVICE').length;
      const maintenance = vehs.filter((v: any) => v.status === 'MAINTENANCE').length;
      setVehicleStats({ total, available, inService, maintenance });
    } catch (e) { 
      setVehicleStats({ total: 0, available: 0, inService: 0, maintenance: 0 }); 
    }
  };

  const loadDriverData = async () => {
    try {
      const drs = await driverService.listDrivers(warehouseId ? { warehouse_id: warehouseId } : undefined);
      const total = drs.length;
      const active = drs.filter((d: any) => d.status === 'ACTIVE').length;
      setDriverStats({ total, active });
    } catch (e) { 
      setDriverStats({ total: 0, active: 0 }); 
    }
  };

  const loadCrateData = async () => {
    try {
      const cs = await crateService.getCrates();
      const rows = Array.isArray(cs) ? cs : [];
      const filtered = warehouseId ? rows.filter((c: any) => c.warehouse_id === warehouseId) : rows;
      const total = filtered.length;
      const inUse = filtered.filter((c: any) => c.status === 'in_use').length;
      const damaged = filtered.filter((c: any) => c.status === 'damaged').length;
      setCrateStats({ total, inUse, damaged });
    } catch (e) { 
      setCrateStats({ total: 0, inUse: 0, damaged: 0 }); 
    }
  };

  const loadCommunityData = async () => {
    try {
      const comms = await communityService.listCommunities(warehouseId ? { warehouse_id: warehouseId } : undefined);
      setCommunityStats({ communities: comms.length });
    } catch (e) { 
      setCommunityStats({ communities: 0 }); 
    }
  };

  const loadCustomerData = async () => {
    try {
      const custs = await customerService.listCustomers(warehouseId ? { warehouse_id: warehouseId } : undefined);
      setCustomerStats({ customers: custs.length });
    } catch (e) { 
      setCustomerStats({ customers: 0 }); 
    }
  };

  const loadProductData = async () => {
    try {
      const prods = await productService.listProducts();
      setProductStats({ products: prods.length });
    } catch (e) { 
      setProductStats({ products: 0 }); 
    }
  };

  const loadVendorData = async () => {
    try {
      const vends = await vendorService.getVendors();
      setVendorStats({ vendors: vends.length });
    } catch (e) { 
      setVendorStats({ vendors: 0 }); 
    }
  };

  const loadOrderData = async () => {
    try {
  const orders = await orderService.getOrders({ limit: 100 });
      const ordersCount = orders.length;
      const amount = orders.reduce((s: number, o: any) => s + Number(o.total_amount || 0), 0);
      setOrderStats({ orders: ordersCount, amount });
    } catch (err: any) {
      try {
        const mine = await orderService.getMyOrders();
        const ordersCount = mine.length;
        const amount = mine.reduce((s: number, o: any) => s + Number(o.total_amount || 0), 0);
        setOrderStats({ orders: ordersCount, amount });
      } catch (e) {
        setOrderStats({ orders: 0, amount: 0 });
      }
    }
  };

  // RTK Query enhancements (non-blocking): compute summary live when available
  const { data: qOrders } = useGetOrdersQuery({ limit: 100 });
  const { data: qPicks } = useGetPickTasksQuery();
  const { data: qDispatch } = useGetDispatchRoutesQuery();

  useEffect(() => {
    if (qOrders && qOrders.length >= 0) {
      const amount = qOrders.reduce((s, o) => s + Number((o as any).total_amount || 0), 0);
      setOrderStats((prev: any) => ({ ...prev, orders: qOrders.length, amount }));
    }
  }, [qOrders]);

  useEffect(() => {
    if (qPicks) {
      const total = qPicks.length;
      const inProgress = qPicks.filter((t: any) => t.status === 'in_progress').length;
      const completed = qPicks.filter((t: any) => t.status === 'completed').length;
      setPickStats((prev: any) => ({ ...prev, total, inProgress, completed }));
    }
  }, [qPicks]);

  useEffect(() => {
    if (qDispatch) {
      const ready = qDispatch.filter((r: any) => r.status === 'ready').length;
      const dispatched = qDispatch.filter((r: any) => r.status === 'dispatched').length;
      const pending = qDispatch.filter((r: any) => r.status === 'pending').length;
      setDispatchStats((prev: any) => ({ ...prev, ready, dispatched, pending }));
    }
  }, [qDispatch]);

  const loadMilestones = async () => {
    try {
      const ms = await milestoneService.getMilestones();
      setMilestones(ms);
    } catch (e) { 
      setMilestones([]); 
    }
  };

  const loadNotifications = async () => {
    try {
      const ns = await notificationService.getMyNotifications();
      setNotices(ns);
    } catch (e) { 
      setNotices([]); 
    }
  };

  return (
    <motion.div
      className="dashboard-home"
      initial="hidden"
      animate="show"
      variants={containerVariants}
    >
      {/* Modern Dashboard Header */}
      <motion.section className="modern-dashboard-header" variants={itemVariants}>
        <div className="header-container">
          <div className="header-left">
            <motion.div 
              className="welcome-section"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
            >
              <h1 className="dashboard-greeting">Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}</h1>
              <p className="dashboard-subtitle">Welcome to your Warehouse Management Command Center</p>
            </motion.div>
          </div>
          <div className="header-right">
            <motion.div 
              className="header-controls"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <div className="current-time">
                <Clock size={16} />
                <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="notification-bell">
                <Bell size={18} />
                <span className="notification-count">{notices.length}</span>
              </div>
              <div className="user-profile">
                <div className="profile-avatar">
                  <Users size={16} />
                </div>
                <span className="profile-name">Admin</span>
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Real-time Status Bar */}
        <motion.div 
          className="realtime-status-bar"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <div className="status-items">
            <div className="status-item operational">
              <div className="status-dot"></div>
              <span>All Systems Operational</span>
            </div>
            <div className="status-item">
              <Activity size={14} />
              <span>Real-time Sync: Active</span>
            </div>
            <div className="status-item">
              <Zap size={14} />
              <span>Network: Excellent</span>
            </div>
            <div className="status-item">
              <ShieldCheck size={14} />
              <span>Security: Protected</span>
            </div>
          </div>
        </motion.div>
      </motion.section>

      {/* Enhanced Hero Section with Background */}
      <motion.section className="hero-section" variants={itemVariants}>
        <div className="hero-background">
          <div className="hero-pattern"></div>
          <div className="hero-gradient"></div>
        </div>
        
        <div className="hero-content">
          <motion.div
            className="hero-header"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <div className="hero-title-group">
              <h1 className="hero-title">WMS Control Center</h1>
              <p className="hero-subtitle">Intelligent Warehouse Operations Dashboard</p>
            </div>
            
            <div className="hero-stats-bar">
              <motion.div 
                className="hero-stat-item"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                <div className="stat-icon success">
                  <Activity size={20} />
                </div>
                <div className="stat-info">
                  <span className="stat-value">99.2%</span>
                  <span className="stat-label">Uptime</span>
                </div>
              </motion.div>
              
              <motion.div 
                className="hero-stat-item"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                <div className="stat-icon info">
                  <Users size={20} />
                </div>
                <div className="stat-info">
                  <span className="stat-value">{userStats.active || 0}</span>
                  <span className="stat-label">Active Users</span>
                </div>
              </motion.div>
              
              <motion.div 
                className="hero-stat-item"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
              >
                <div className="stat-icon warning">
                  <Clock size={20} />
                </div>
                <div className="stat-info">
                  <span className="stat-value">14:32</span>
                  <span className="stat-label">Shift Time</span>
                </div>
              </motion.div>
              
              <motion.div
                className="live-status"
                variants={pulseVariants}
                animate="animate"
              >
                <div className="live-dot"></div>
                <span>Live Data Stream</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Primary KPI Dashboard */}
      <motion.section className="kpi-grid-section" variants={itemVariants}>
        <SectionHeader
          title="Performance Metrics"
          right={(
            <>
              <button className="refresh-btn" aria-label="Refresh metrics">
                <RefreshCw size={16} />
                Refresh
              </button>
              <button className="export-btn" aria-label="Export metrics">
                <BarChart3 size={16} />
                Export
              </button>
            </>
          )}
        />
        
        <div className="kpi-grid">
          {/* Primary KPIs Row */}
          <motion.div className="kpi-card primary revenue-card" variants={itemVariants}>
            <div className="kpi-header">
              <div className="kpi-icon-wrapper revenue">
                <DollarSign size={24} />
              </div>
              <div className="kpi-trend-indicator positive">
                <TrendingUp size={16} />
                <span>+12.5%</span>
              </div>
            </div>
            <div className="kpi-content">
              <h3 className="kpi-value" aria-live="polite">
                {loading ? (
                  <span className="skeleton skeleton-line" style={{ width: 120 }} />
                ) : (
                  fmtINR.format(orderStats.amount || 0)
                )}
              </h3>
              <p className="kpi-label">Total Revenue</p>
              <div className="kpi-meta">
                <span className="kpi-period">This Month</span>
                <span className="kpi-comparison">vs last month</span>
              </div>
            </div>
            <div className="kpi-chart-mini">
              <div className="mini-bars">
                <div className="bar" style={{ height: '60%' }}></div>
                <div className="bar" style={{ height: '80%' }}></div>
                <div className="bar" style={{ height: '45%' }}></div>
                <div className="bar" style={{ height: '90%' }}></div>
                <div className="bar" style={{ height: '75%' }}></div>
                <div className="bar" style={{ height: '100%' }}></div>
              </div>
            </div>
          </motion.div>

          <motion.div className="kpi-card primary orders-card" variants={itemVariants}>
            <div className="kpi-header">
              <div className="kpi-icon-wrapper orders">
                <Package size={24} />
              </div>
              <div className="kpi-trend-indicator positive">
                <TrendingUp size={16} />
                <span>+8.2%</span>
              </div>
            </div>
            <div className="kpi-content">
              <h3 className="kpi-value" aria-live="polite">
                {loading ? (
                  <span className="skeleton skeleton-line" style={{ width: 60 }} />
                ) : (
                  orderStats.orders || 0
                )}
              </h3>
              <p className="kpi-label">Orders Processed</p>
              <div className="kpi-meta">
                <span className="kpi-period">Today</span>
                <span className="kpi-comparison">vs yesterday</span>
              </div>
            </div>
            <div className="kpi-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '78%' }}></div>
              </div>
              <span className="progress-text">78% of daily target</span>
            </div>
          </motion.div>

          <motion.div className="kpi-card primary efficiency-card" variants={itemVariants}>
            <div className="kpi-header">
              <div className="kpi-icon-wrapper efficiency">
                <Zap size={24} />
              </div>
              <div className="kpi-trend-indicator positive">
                <TrendingUp size={16} />
                <span>+5.3%</span>
              </div>
            </div>
            <div className="kpi-content">
              <h3 className="kpi-value" aria-live="polite">
                {loading ? (
                  <span className="skeleton skeleton-line" style={{ width: 50 }} />
                ) : (
                  `${performanceData.overallEfficiency}%`
                )}
              </h3>
              <p className="kpi-label">Overall Efficiency</p>
              <div className="kpi-meta">
                <span className="kpi-period">Real-time</span>
                <span className="kpi-comparison">Peak: 95.2%</span>
              </div>
            </div>
            <div className="kpi-radial">
              <div className="radial-progress" style={{ '--progress': `${performanceData.overallEfficiency}%` } as React.CSSProperties}>
                <div className="radial-center">
                  <ShieldCheck size={20} />
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div className="kpi-card primary shipments-card" variants={itemVariants}>
            <div className="kpi-header">
              <div className="kpi-icon-wrapper shipments">
                <Truck size={24} />
              </div>
              <div className="kpi-trend-indicator positive">
                <TrendingUp size={16} />
                <span>+15.2%</span>
              </div>
            </div>
            <div className="kpi-content">
              <h3 className="kpi-value" aria-live="polite">
                {loading ? (
                  <span className="skeleton skeleton-line" style={{ width: 40 }} />
                ) : (
                  realTimeMetrics.todayShipments
                )}
              </h3>
              <p className="kpi-label">Active Shipments</p>
              <div className="kpi-meta">
                <span className="kpi-period">In Transit</span>
                <span className="kpi-comparison">{vehicleStats.available || 0} vehicles ready</span>
              </div>
            </div>
            <div className="kpi-status-dots">
              <div className="status-dot active" title="In Transit"></div>
              <div className="status-dot warning" title="Delayed"></div>
              <div className="status-dot success" title="Delivered"></div>
              <div className="status-dot pending" title="Pending"></div>
            </div>
          </motion.div>

          {/* Secondary KPIs Row */}
          <motion.div className="kpi-card secondary inventory-card" variants={itemVariants}>
            <div className="kpi-icon-small">
              <Box size={20} />
            </div>
            <div className="kpi-content-compact">
              <h4 aria-live="polite">
                {loading ? <span className="skeleton skeleton-line" style={{ width: 50, height: 20 }} /> : (invTotals.totalSkus || 156)}
              </h4>
              <p>SKUs in Stock</p>
              <span className="kpi-badge success">Optimal</span>
            </div>
          </motion.div>

          <motion.div className="kpi-card secondary warehouse-card" variants={itemVariants}>
            <div className="kpi-icon-small">
              <Warehouse size={20} />
            </div>
            <div className="kpi-content-compact">
              <h4 aria-live="polite">
                {loading ? <span className="skeleton skeleton-line" style={{ width: 40, height: 20 }} /> : `${rackStats.utilPct || 75}%`}
              </h4>
              <p>Warehouse Utilization</p>
              <span className="kpi-badge warning">High</span>
            </div>
          </motion.div>

          <motion.div className="kpi-card secondary quality-card" variants={itemVariants}>
            <div className="kpi-icon-small">
              <Target size={20} />
            </div>
            <div className="kpi-content-compact">
              <h4 aria-live="polite">
                {loading ? <span className="skeleton skeleton-line" style={{ width: 40, height: 20 }} /> : `${performanceData.qualityScore}%`}
              </h4>
              <p>Quality Score</p>
              <span className="kpi-badge success">Excellent</span>
            </div>
          </motion.div>

          <motion.div className="kpi-card secondary delivery-card" variants={itemVariants}>
            <div className="kpi-icon-small">
              <Timer size={20} />
            </div>
            <div className="kpi-content-compact">
              <h4 aria-live="polite">
                {loading ? <span className="skeleton skeleton-line" style={{ width: 50, height: 20 }} /> : `${performanceData.onTimeDelivery}%`}
              </h4>
              <p>On-Time Delivery</p>
              <span className="kpi-badge success">Target Met</span>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Quick Actions Hub */}
      <motion.section className="quick-actions-hub" variants={itemVariants}>
        <div className="section-header">
          <h2>Quick Actions</h2>
          <p>Streamlined access to critical operations</p>
        </div>
        
        <div className="actions-grid">
          <motion.div className="action-category" variants={itemVariants}>
            <div className="category-header">
              <div className="category-icon inbound">
                <ArrowDown size={24} />
              </div>
              <div className="category-info">
                <h3>Inbound Operations</h3>
                <span className="category-status">{inKpi.openReceipts || 0} active tasks</span>
              </div>
              <div className="category-badge">
                <span>{inKpi.pending || 0}</span>
              </div>
            </div>
            <div className="action-buttons">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link to="/inbound/goods-in" className="action-btn primary">
                <Warehouse size={18} />
                <span>Goods Receipt</span>
                <div className="btn-notification">{inKpi.pending || 0}</div>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link to="/inbound/bin-allocation" className="action-btn secondary">
                <Box size={18} />
                <span>Put Away</span>
                </Link>
              </motion.div>
            </div>
          </motion.div>

          <motion.div className="action-category" variants={itemVariants}>
            <div className="category-header">
              <div className="category-icon outbound">
                <ArrowUp size={24} />
              </div>
              <div className="category-info">
                <h3>Outbound Operations</h3>
                <span className="category-status">{pickStats.total || 0} orders in queue</span>
              </div>
              <div className="category-badge">
                <span>{pickStats.inProgress || 0}</span>
              </div>
            </div>
            <div className="action-buttons">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link to="/outbound/pick-list" className="action-btn primary">
                <ClipboardList size={18} />
                <span>Pick Management</span>
                <div className="btn-notification">{pickStats.inProgress || 0}</div>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link to="/outbound/dispatch-console" className="action-btn secondary">
                <Truck size={18} />
                <span>Dispatch Center</span>
                </Link>
              </motion.div>
            </div>
          </motion.div>

          <motion.div className="action-category" variants={itemVariants}>
            <div className="category-header">
              <div className="category-icon inventory">
                <Package size={24} />
              </div>
              <div className="category-info">
                <h3>Inventory Management</h3>
                <span className="category-status">{rackStats.utilPct || 75}% capacity used</span>
              </div>
              <div className="category-badge warning">
                <span>!</span>
              </div>
            </div>
            <div className="action-buttons">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link to="/inventory/stock-overview" className="action-btn primary">
                <BarChart3 size={18} />
                <span>Stock Overview</span>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link to="/inventory/stock-adjustment" className="action-btn secondary">
                <RefreshCw size={18} />
                <span>Cycle Count</span>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Real-time Operations Monitor */}
      <motion.section className="realtime-operations-monitor" variants={itemVariants}>
        <SectionHeader
          title="Live Operations Monitor"
          right={(
            <div className="monitor-controls">
            <button className="monitor-btn active">
              <Activity size={16} />
              Live View
            </button>
            <button className="monitor-btn">
              <BarChart3 size={16} />
              Analytics
            </button>
            <button className="monitor-btn">
              <Settings size={16} />
              Configure
            </button>
            </div>
          )}
        />
        
        <div className="operations-grid">
          <motion.div className="operation-monitor inbound-monitor" variants={itemVariants}>
            <div className="monitor-header">
              <div className="monitor-icon inbound">
                <ArrowDown size={20} />
              </div>
              <div className="monitor-title">
                <h3>Inbound Flow</h3>
                <span className="monitor-status active">Active</span>
              </div>
              <div className="monitor-value">
                <span className="value" aria-live="polite">{loading ? <span className="skeleton skeleton-line" style={{ width: 30, height: 20 }} /> : (inKpi.openReceipts || 0)}</span>
                <span className="unit">receipts</span>
              </div>
            </div>
            <div className="monitor-chart" aria-label="Inbound flow chart">
              <div className="flow-visualization">
                <div className="flow-item">
                  <div className="flow-dot active"></div>
                  <span>Receiving</span>
                  <span className="flow-count" aria-live="polite">{loading ? <span className="skeleton skeleton-line" style={{ width: 24, height: 16 }} /> : (inKpi.pending || 0)}</span>
                </div>
                <div className="flow-arrow">→</div>
                <div className="flow-item">
                  <div className="flow-dot processing"></div>
                  <span>Processing</span>
                  <span className="flow-count" aria-live="polite">{loading ? <span className="skeleton skeleton-line" style={{ width: 24, height: 16 }} /> : (inKpi.binsAllocated || 0)}</span>
                </div>
                <div className="flow-arrow">→</div>
                <div className="flow-item">
                  <div className="flow-dot complete"></div>
                  <span>Complete</span>
                  <span className="flow-count" aria-live="polite">{loading ? <span className="skeleton skeleton-line" style={{ width: 24, height: 16 }} /> : (inKpi.completedToday || 0)}</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div className="operation-monitor outbound-monitor" variants={itemVariants}>
            <div className="monitor-header">
              <div className="monitor-icon outbound">
                <ArrowUp size={20} />
              </div>
              <div className="monitor-title">
                <h3>Outbound Flow</h3>
                <span className="monitor-status active">Active</span>
              </div>
              <div className="monitor-value">
                <span className="value" aria-live="polite">{loading ? <span className="skeleton skeleton-line" style={{ width: 30, height: 20 }} /> : (pickStats.total || 0)}</span>
                <span className="unit">orders</span>
              </div>
            </div>
            <div className="monitor-chart" aria-label="Outbound flow chart">
              <div className="flow-visualization">
                <div className="flow-item">
                  <div className="flow-dot active"></div>
                  <span>Picking</span>
                  <span className="flow-count" aria-live="polite">{loading ? <span className="skeleton skeleton-line" style={{ width: 24, height: 16 }} /> : (pickStats.inProgress || 0)}</span>
                </div>
                <div className="flow-arrow">→</div>
                <div className="flow-item">
                  <div className="flow-dot processing"></div>
                  <span>Packing</span>
                  <span className="flow-count" aria-live="polite">{loading ? <span className="skeleton skeleton-line" style={{ width: 24, height: 16 }} /> : (pickStats.completed || 0)}</span>
                </div>
                <div className="flow-arrow">→</div>
                <div className="flow-item">
                  <div className="flow-dot complete"></div>
                  <span>Dispatch</span>
                  <span className="flow-count" aria-live="polite">{loading ? <span className="skeleton skeleton-line" style={{ width: 24, height: 16 }} /> : (dispatchStats.dispatched || 0)}</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div className="operation-monitor inventory-monitor" variants={itemVariants}>
            <div className="monitor-header">
              <div className="monitor-icon inventory">
                <Package size={20} />
              </div>
              <div className="monitor-title">
                <h3>Inventory Status</h3>
                <span className="monitor-status warning">Monitor</span>
              </div>
              <div className="monitor-value">
                <span className="value" aria-live="polite">{loading ? <span className="skeleton skeleton-line" style={{ width: 30, height: 20 }} /> : (rackStats.utilPct || 75)}</span>
                <span className="unit">% full</span>
              </div>
            </div>
            <div className="monitor-chart" aria-label="Inventory capacity chart">
              <div className="capacity-visualization">
                <div className="capacity-bar">
                  <div 
                    className="capacity-fill" 
                    style={{ width: `${rackStats.utilPct || 75}%` }}
                  ></div>
                </div>
                <div className="capacity-labels">
                  <span className="capacity-label" aria-live="polite">{loading ? <span className="skeleton skeleton-line" style={{ width: 100, height: 14 }} /> : `Available: ${binStats.total - binStats.occupied || 125}`}</span>
                  <span className="capacity-label" aria-live="polite">{loading ? <span className="skeleton skeleton-line" style={{ width: 90, height: 14 }} /> : `Occupied: ${binStats.occupied || 375}`}</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div className="operation-monitor fleet-monitor" variants={itemVariants}>
            <div className="monitor-header">
              <div className="monitor-icon fleet">
                <Truck size={20} />
              </div>
              <div className="monitor-title">
                <h3>Fleet Status</h3>
                <span className="monitor-status active">Operational</span>
              </div>
              <div className="monitor-value">
                <span className="value" aria-live="polite">{loading ? <span className="skeleton skeleton-line" style={{ width: 30, height: 20 }} /> : (vehicleStats.inService || 8)}</span>
                <span className="unit">active</span>
              </div>
            </div>
            <div className="monitor-chart" aria-label="Fleet status chart">
              <div className="fleet-visualization">
                <div className="fleet-stats">
                  <div className="fleet-stat">
                    <div className="fleet-dot available"></div>
                    <span aria-live="polite">{loading ? <span className="skeleton skeleton-line" style={{ width: 120, height: 14 }} /> : `Available: ${vehicleStats.available || 12}`}</span>
                  </div>
                  <div className="fleet-stat">
                    <div className="fleet-dot maintenance"></div>
                    <span aria-live="polite">{loading ? <span className="skeleton skeleton-line" style={{ width: 130, height: 14 }} /> : `Maintenance: ${vehicleStats.maintenance || 2}`}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* WMS Command Center */}
      <motion.section className="command-center" variants={itemVariants}>
        <motion.div className="command-center-header" variants={itemVariants}>
          <div className="header-content">
            <h2>WMS Command Center</h2>
            <p>Centralized control for all warehouse operations</p>
          </div>
          <div className="command-status">
            <div className="status-indicator active">
              <div className="status-dot"></div>
              <span>All Systems Operational</span>
            </div>
            <div className="shift-info">
              <Clock size={16} />
              <span>Shift 1: 06:00 - 14:00</span>
            </div>
          </div>
        </motion.div>

        {/* Primary Operations Grid */}
        <motion.div className="primary-operations" variants={containerVariants}>
          <motion.div className="operation-category" variants={itemVariants}>
            <div className="category-header">
              <div className="category-icon inbound">
                <ArrowDown />
              </div>
              <div className="category-info">
                <h3>Inbound Operations</h3>
                <span className="category-status">{inKpi.openReceipts || 0} Active Tasks</span>
              </div>
            </div>
            <div className="operation-actions">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link to="/inbound/goods-in" className="operation-btn primary">
                <Warehouse size={18} />
                <span>Goods Receipt</span>
                <div className="btn-badge">{inKpi.pending || 0}</div>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link to="/inbound/bin-allocation" className="operation-btn secondary">
                <Box size={18} />
                <span>Put Away</span>
                <div className="btn-badge">{inKpi.binsAllocated || 0}</div>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link to="/inbound/quality-check" className="operation-btn secondary">
                <CheckCircle size={18} />
                <span>Quality Check</span>
                <div className="btn-badge">1</div>
                </Link>
              </motion.div>
            </div>
          </motion.div>

          <motion.div className="operation-category" variants={itemVariants}>
            <div className="category-header">
              <div className="category-icon outbound">
                <ArrowUp />
              </div>
              <div className="category-info">
                <h3>Outbound Operations</h3>
                <span className="category-status">{pickStats.total || 0} Active Orders</span>
              </div>
            </div>
            <div className="operation-actions">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link to="/outbound/pick-list" className="operation-btn primary">
                <ClipboardList size={18} />
                <span>Picking</span>
                <div className="btn-badge">{pickStats.inProgress || 0}</div>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link to="/outbound/packing" className="operation-btn secondary">
                <Package size={18} />
                <span>Packing</span>
                <div className="btn-badge">{pickStats.completed || 0}</div>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link to="/outbound/dispatch-console" className="operation-btn secondary">
                <Truck size={18} />
                <span>Dispatch</span>
                <div className="btn-badge">{dispatchStats.ready || 0}</div>
                </Link>
              </motion.div>
            </div>
          </motion.div>

          <motion.div className="operation-category" variants={itemVariants}>
            <div className="category-header">
              <div className="category-icon inventory">
                <Package />
              </div>
              <div className="category-info">
                <h3>Inventory Management</h3>
                <span className="category-status">{rackStats.utilPct || 0}% Utilized</span>
              </div>
            </div>
            <div className="operation-actions">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link to="/inventory/stock-overview" className="operation-btn primary">
                <BarChart3 size={18} />
                <span>Stock Overview</span>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link to="/inventory/stock-adjustment" className="operation-btn secondary">
                <RefreshCw size={18} />
                <span>Cycle Count</span>
                <div className="btn-badge alert">!</div>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link to="/inventory/stock-overview" className="operation-btn secondary">
                <TrendingUp size={18} />
                <span>Replenishment</span>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* Quick Commands Grid */}
        <motion.div className="quick-commands" variants={containerVariants}>
          <div className="commands-section">
            <h3>Quick Commands</h3>
            <div className="commands-grid">
              <motion.button className="command-btn emergency" variants={itemVariants}>
                <AlertTriangle size={20} />
                <span>Emergency Stop</span>
              </motion.button>
              <motion.button className="command-btn warning" variants={itemVariants}>
                <PauseCircle size={20} />
                <span>Pause Operations</span>
              </motion.button>
              <motion.button className="command-btn info" variants={itemVariants}>
                <Users size={20} />
                <span>Staff Override</span>
              </motion.button>
              <motion.button className="command-btn success" variants={itemVariants}>
                <CheckCircle size={20} />
                <span>Force Complete</span>
              </motion.button>
            </div>
          </div>

          <div className="system-controls">
            <h3>System Controls</h3>
            <div className="controls-grid">
              <motion.div variants={itemVariants}>
                <Link to="/administration/users-roles" className="control-card">
                <div className="control-icon">
                  <Users size={20} />
                </div>
                <div className="control-info">
                  <span className="control-title">User Management</span>
                  <span className="control-desc">{userStats.active || 0} Active Users</span>
                </div>
                </Link>
              </motion.div>
              <motion.div variants={itemVariants}>
                <Link to="/administration/system-configuration" className="control-card">
                <div className="control-icon">
                  <Settings size={20} />
                </div>
                <div className="control-info">
                  <span className="control-title">System Settings</span>
                  <span className="control-desc">All Systems OK</span>
                </div>
                </Link>
              </motion.div>
              <motion.div variants={itemVariants}>
                <Link to="/reports/stock-movement" className="control-card">
                <div className="control-icon">
                  <BarChart3 size={20} />
                </div>
                <div className="control-info">
                  <span className="control-title">Analytics</span>
                  <span className="control-desc">Real-time Reports</span>
                </div>
                </Link>
              </motion.div>
              <motion.div variants={itemVariants}>
                <Link to="/administration/fleet/vehicles" className="control-card">
                <div className="control-icon">
                  <Wrench size={20} />
                </div>
                <div className="control-info">
                  <span className="control-title">Maintenance</span>
                  <span className="control-desc">{vehicleStats.maintenance || 0} Scheduled</span>
                </div>
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Live Activity Feed */}
        <motion.div className="activity-feed" variants={itemVariants}>
          <div className="feed-header">
            <h3>Live Activity Feed</h3>
            <div className="feed-controls">
              <button className="feed-btn active" aria-label="Show all activity">All</button>
              <button className="feed-btn" aria-label="Show critical activity">Critical</button>
              <button className="feed-btn" aria-label="Show warnings">Warnings</button>
            </div>
          </div>
          <div className="feed-content">
            {loading ? (
              <>
                <div className="activity-item">
                  <div className="activity-icon"><span className="skeleton" style={{ width: 16, height: 16, borderRadius: 4 }} /></div>
                  <div className="activity-details">
                    <span className="skeleton skeleton-line" style={{ width: 220, height: 16 }} />
                    <span className="skeleton skeleton-line" style={{ width: 100, height: 12 }} />
                  </div>
                </div>
                <div className="activity-item">
                  <div className="activity-icon"><span className="skeleton" style={{ width: 16, height: 16, borderRadius: 4 }} /></div>
                  <div className="activity-details">
                    <span className="skeleton skeleton-line" style={{ width: 240, height: 16 }} />
                    <span className="skeleton skeleton-line" style={{ width: 80, height: 12 }} />
                  </div>
                </div>
              </>
            ) : (
            <div className="activity-item success">
              <div className="activity-icon">
                <CheckCircle size={16} />
              </div>
              <div className="activity-details">
                <span className="activity-message">Order #{orderStats.orders > 0 ? `WO-2024-${orderStats.orders}` : 'WO-2024-1234'} picked successfully</span>
                <span className="activity-time">2 minutes ago</span>
              </div>
            </div>
            )}
            <div className="activity-item info">
              <div className="activity-icon">
                <Package size={16} />
              </div>
              <div className="activity-details">
                <span className="activity-message">New shipment received at Bay {bayKpi.occupied || 3}</span>
                <span className="activity-time">5 minutes ago</span>
              </div>
            </div>
            <div className="activity-item warning">
              <div className="activity-icon">
                <AlertTriangle size={16} />
              </div>
              <div className="activity-details">
                <span className="activity-message">Low stock alert: SKU-ABC123 ({invTotals.totalSkus || 150} units remaining)</span>
                <span className="activity-time">8 minutes ago</span>
              </div>
            </div>
            <div className="activity-item success">
              <div className="activity-icon">
                <Truck size={16} />
              </div>
              <div className="activity-details">
                <span className="activity-message">Delivery DEL-5678 dispatched to Route A</span>
                <span className="activity-time">12 minutes ago</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.section>

      {/* Productivity Insights */}
      <motion.section className="productivity-insights" variants={itemVariants}>
        <div className="section-header">
          <h2>Productivity Insights</h2>
          <div className="insights-period">
            <select className="period-selector">
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>
        
        <div className="insights-grid">
          <motion.div className="insight-card throughput-card" variants={itemVariants}>
            <div className="insight-header">
              <div className="insight-icon">
                <TrendingUp size={24} />
              </div>
              <div className="insight-trend positive">
                <span>+12.5%</span>
                <TrendingUp size={16} />
              </div>
            </div>
            <div className="insight-content">
              <h3>Throughput Rate</h3>
              <div className="insight-value">
                <span className="value">847</span>
                <span className="unit">orders/hour</span>
              </div>
              <div className="insight-comparison">
                vs. 754 yesterday
              </div>
            </div>
            <div className="insight-chart">
              <div className="mini-line-chart">
                <div className="chart-point" style={{ height: '60%' }}></div>
                <div className="chart-point" style={{ height: '45%' }}></div>
                <div className="chart-point" style={{ height: '80%' }}></div>
                <div className="chart-point" style={{ height: '70%' }}></div>
                <div className="chart-point" style={{ height: '90%' }}></div>
                <div className="chart-point" style={{ height: '85%' }}></div>
              </div>
            </div>
          </motion.div>

          <motion.div className="insight-card accuracy-card" variants={itemVariants}>
            <div className="insight-header">
              <div className="insight-icon">
                <Target size={24} />
              </div>
              <div className="insight-trend positive">
                <span>+2.1%</span>
                <TrendingUp size={16} />
              </div>
            </div>
            <div className="insight-content">
              <h3>Pick Accuracy</h3>
              <div className="insight-value">
                <span className="value">99.7</span>
                <span className="unit">%</span>
              </div>
              <div className="insight-comparison">
                Target: 99.5%
              </div>
            </div>
            <div className="insight-progress">
              <div className="progress-ring">
                <div className="progress-circle" style={{ '--progress': '99.7' } as React.CSSProperties}>
                  <div className="progress-center">
                    <CheckCircle size={20} />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div className="insight-card cost-card" variants={itemVariants}>
            <div className="insight-header">
              <div className="insight-icon">
                <DollarSign size={24} />
              </div>
              <div className="insight-trend negative">
                <span>-5.2%</span>
                <TrendingDown size={16} />
              </div>
            </div>
            <div className="insight-content">
              <h3>Cost per Order</h3>
              <div className="insight-value">
                <span className="value">{fmtINR.format(145)}</span>
                <span className="unit">avg</span>
              </div>
              <div className="insight-comparison">
                vs. {fmtINR.format(153)} last week
              </div>
            </div>
            <div className="insight-savings">
              <div className="savings-badge">
                <span className="savings-icon">💰</span>
                <span>Saved {fmtINR.format(8200)} this week</span>
              </div>
            </div>
          </motion.div>

          <motion.div className="insight-card utilization-card" variants={itemVariants}>
            <div className="insight-header">
              <div className="insight-icon">
                <Activity size={24} />
              </div>
              <div className="insight-trend positive">
                <span>+7.8%</span>
                <TrendingUp size={16} />
              </div>
            </div>
            <div className="insight-content">
              <h3>Space Utilization</h3>
              <div className="insight-value">
                <span className="value">{rackStats.utilPct || 75}</span>
                <span className="unit">%</span>
              </div>
              <div className="insight-comparison">
                Optimal range: 70-85%
              </div>
            </div>
            <div className="insight-bars">
              <div className="utilization-bars">
                <div className="util-bar optimal" style={{ height: '75%' }}></div>
                <div className="util-bar good" style={{ height: '60%' }}></div>
                <div className="util-bar excellent" style={{ height: '80%' }}></div>
                <div className="util-bar good" style={{ height: '70%' }}></div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Performance Indicators */}
        <motion.div className="performance-indicators" variants={itemVariants}>
          <div className="indicators-header">
            <h3>Key Performance Indicators</h3>
            <div className="update-time">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
          <div className="indicators-grid">
            <div className="indicator-item">
              <div className="indicator-label">Order Fulfillment Rate</div>
              <div className="indicator-value excellent">98.2%</div>
              <div className="indicator-bar">
                <div className="bar-fill" style={{ width: '98.2%' }}></div>
              </div>
            </div>
            <div className="indicator-item">
              <div className="indicator-label">Inventory Turnover</div>
              <div className="indicator-value good">12.4x</div>
              <div className="indicator-bar">
                <div className="bar-fill" style={{ width: '85%' }}></div>
              </div>
            </div>
            <div className="indicator-item">
              <div className="indicator-label">Labor Productivity</div>
              <div className="indicator-value excellent">127%</div>
              <div className="indicator-bar">
                <div className="bar-fill" style={{ width: '127%' }}></div>
              </div>
            </div>
            <div className="indicator-item">
              <div className="indicator-label">Cycle Time</div>
              <div className="indicator-value good">2.3 hrs</div>
              <div className="indicator-bar">
                <div className="bar-fill" style={{ width: '76%' }}></div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.section>

      {/* Analytics Dashboard */}
      <motion.section className="analytics-section" variants={itemVariants}>
        <motion.div className="section-header" variants={itemVariants}>
          <h2>Performance Analytics</h2>
          <div className="view-controls">
            <button className="view-btn active">Today</button>
            <button className="view-btn">Week</button>
            <button className="view-btn">Month</button>
          </div>
        </motion.div>

        <div className="analytics-grid">
          <motion.div className="chart-card primary" variants={itemVariants}>
            <div className="chart-header">
              <h3>Orders & Revenue Trend</h3>
              <div className="chart-legend">
                <div className="legend-item orders">
                  <div className="legend-dot"></div>
                  <span>Orders</span>
                </div>
                <div className="legend-item revenue">
                  <div className="legend-dot"></div>
                  <span>Revenue</span>
                </div>
              </div>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={performanceChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '8px' 
                    }} 
                  />
                  <Area type="monotone" dataKey="orders" stroke="#6366f1" fillOpacity={1} fill="url(#colorOrders)" strokeWidth={2} />
                  <Area type="monotone" dataKey="revenue" stroke="#22c55e" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div className="chart-card secondary" variants={itemVariants}>
            <div className="chart-header">
              <h3>Warehouse Utilization</h3>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={200}>
                <RadialBarChart cx="50%" cy="50%" innerRadius="40%" outerRadius="90%" data={warehouseUtilization}>
                  <RadialBar 
                    dataKey="value" 
                    cornerRadius={4} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '8px' 
                    }} 
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div className="utilization-legend">
              {warehouseUtilization.map((item, index) => (
                <div key={index} className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: item.color }}></div>
                  <span>{item.name}: {item.value}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Summary Section */}
      <motion.section className="summary-section" variants={itemVariants}>
        <div className="summary-grid">
          <motion.div className="summary-card notifications" variants={itemVariants}>
            <div className="card-header">
              <h3>Recent Notifications</h3>
              <Bell size={20} />
            </div>
            <div className="notification-list">
              {loading ? (
                [0,1,2].map((i) => (
                  <div key={`notif-skel-${i}`} className="notification-item">
                    <div className="notification-icon"><span className="skeleton" style={{ width: 14, height: 14, borderRadius: 3 }} /></div>
                    <div className="notification-content">
                      <div className="notification-title"><span className="skeleton skeleton-line" style={{ width: 180, height: 14 }} /></div>
                      <div className="notification-message"><span className="skeleton skeleton-line" style={{ width: 220, height: 12 }} /></div>
                    </div>
                  </div>
                ))
              ) : (
              notices.slice(0, 3).map((notice, index) => (
                <div key={index} className={`notification-item ${notice.read ? '' : 'unread'}`}>
                  <div className="notification-icon">
                    <Bell size={14} />
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">{notice.title}</div>
                    <div className="notification-message">{notice.message}</div>
                  </div>
                </div>
              ))
              )}
              {!loading && notices.length === 0 && (
                <div className="no-notifications">No new notifications</div>
              )}
            </div>
          </motion.div>

          <motion.div className="summary-card milestones" variants={itemVariants}>
            <div className="card-header">
              <h3>Recent Milestones</h3>
              <Target size={20} />
            </div>
            <div className="milestone-list">
              <AnimatePresence>
                {loading ? (
                  [0,1,2].map((i) => (
                    <div key={`ms-skel-${i}`} className="milestone-item">
                      <div className="milestone-progress">
                        <div className="progress-circle" style={{ '--progress': `0%` } as React.CSSProperties}>
                          <span className="skeleton" style={{ width: 20, height: 10 }} />
                        </div>
                      </div>
                      <div className="milestone-content">
                        <div className="milestone-title"><span className="skeleton skeleton-line" style={{ width: 200, height: 14 }} /></div>
                      </div>
                    </div>
                  ))
                ) : (
                milestones.slice(0, 3).map((milestone) => (
                  <motion.div
                    key={milestone.id}
                    className="milestone-item"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <div className="milestone-progress">
                      <div className="progress-circle" style={{ '--progress': `${milestone.milestone_value}%` } as React.CSSProperties}>
                        {milestone.milestone_value}%
                      </div>
                    </div>
                    <div className="milestone-content">
                      <div className="milestone-title">{milestone.title}</div>
                    </div>
                  </motion.div>
                ))
                )}
              </AnimatePresence>
              {!loading && milestones.length === 0 && (
                <div className="no-milestones">No recent milestones</div>
              )}
            </div>
          </motion.div>
        </div>
      </motion.section>
    </motion.div>
  );
}