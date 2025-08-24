import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
  Package, Truck, Users, DollarSign, TrendingUp, ArrowUp, ArrowDown,
  Clock, BarChart3, PieChart, Activity, Zap, Target, ShieldCheck,
  Timer, RefreshCw, Bell, Settings, AlertTriangle, CheckCircle,
  Warehouse, Box, ClipboardList, PauseCircle, Wrench, PackageCheck
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, RadialBarChart, RadialBar
} from 'recharts';
import { KpiCard } from '../components/KpiCard';
import '../assets/styles/Dashboard.css';

// Services
import { inboundService } from '../services/inboundService';
import { outboundService } from '../services/outboundService';
import { inventoryService } from '../services/inventoryService';
import { userService } from '../services/userService';
import { vehicleService } from '../services/vehicleService';
import { driverService } from '../services/driverService';
import { crateService } from '../services/crateService';
import { communityService } from '../services/communityService';
import { customerService } from '../services/customerService';
import { productService } from '../services/productService';
import { orderService } from '../services/orderService';
import { vendorService } from '../services/vendorService';
import { milestoneService } from '../services/milestoneService';
import { notificationService } from '../services/notificationService';

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
  const [warehouseId] = useState<number | null>(null);

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
    loadDashboardData();
  }, [warehouseId]);

  const loadDashboardData = async () => {
    try {
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
    }
  };

  const loadInboundData = async () => {
    try {
      const kpi = await inboundService.getInboundKpi(warehouseId || undefined);
      setInKpi(kpi);
    } catch (e) { 
      setInKpi({ totalReceipts: 0, openReceipts: 0, completedToday: 0, pending: 0, binsAllocated: 0 }); 
    }
  };

  const loadOutboundData = async () => {
    try {
      const pick = await outboundService.getPickStats(warehouseId || undefined);
      setPickStats(pick);
      const dispatch = await outboundService.getDispatchStats(warehouseId || undefined);
      setDispatchStats(dispatch);
    } catch (e) { 
      setPickStats({ total: 0, inProgress: 0, completed: 0 });
      setDispatchStats({ ready: 0, dispatched: 0, pending: 0 });
    }
  };

  const loadInventoryData = async () => {
    try {
      const inv = await inventoryService.getInventoryTotals(warehouseId || undefined);
      setInvTotals(inv);
      const racks = await inventoryService.getRackStats(warehouseId || undefined);
      setRackStats(racks);
      const bins = await inventoryService.getBinStats(warehouseId || undefined);
      setBinStats(bins);
      const bays = await inventoryService.getBayKpi(warehouseId || undefined);
      setBayKpi(bays);
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
      const available = vehs.filter(v => v.status === 'AVAILABLE').length;
      const inService = vehs.filter(v => v.status === 'IN_SERVICE').length;
      const maintenance = vehs.filter(v => v.status === 'MAINTENANCE').length;
      setVehicleStats({ total, available, inService, maintenance });
    } catch (e) { 
      setVehicleStats({ total: 0, available: 0, inService: 0, maintenance: 0 }); 
    }
  };

  const loadDriverData = async () => {
    try {
      const drs = await driverService.listDrivers(warehouseId ? { warehouse_id: warehouseId } : undefined);
      const total = drs.length;
      const active = drs.filter(d => d.status === 'ACTIVE').length;
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
      const vends = await vendorService.listVendors();
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
      const ns = await notificationService.getNotifications();
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
      {/* Hero KPI Section */}
      <motion.section className="hero-kpi-section" variants={itemVariants}>
        <div className="hero-header">
          <motion.div
            className="hero-title"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <h1>Dashboard Overview</h1>
            <p>Real-time insights and operational excellence</p>
          </motion.div>
          <motion.div
            className="live-indicator"
            variants={pulseVariants}
            animate="animate"
          >
            <div className="pulse-dot"></div>
            <span>Live Data</span>
          </motion.div>
        </div>

        <motion.div className="hero-kpis" variants={containerVariants}>
          <motion.div variants={itemVariants}>
            <div className="hero-kpi revenue">
              <div className="kpi-icon">
                <DollarSign />
              </div>
              <div className="kpi-content">
                <h3>{fmtINR.format(orderStats.amount || 0)}</h3>
                <p>Total Revenue</p>
                <div className="kpi-trend positive">
                  <TrendingUp size={16} />
                  <span>+12.5%</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="hero-kpi orders">
              <div className="kpi-icon">
                <Package />
              </div>
              <div className="kpi-content">
                <h3>{orderStats.orders || 0}</h3>
                <p>Orders Processed</p>
                <div className="kpi-trend positive">
                  <TrendingUp size={16} />
                  <span>+8.2%</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="hero-kpi efficiency">
              <div className="kpi-icon">
                <Zap />
              </div>
              <div className="kpi-content">
                <h3>{performanceData.overallEfficiency}%</h3>
                <p>Overall Efficiency</p>
                <div className="kpi-trend positive">
                  <TrendingUp size={16} />
                  <span>+5.3%</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="hero-kpi shipments">
              <div className="kpi-icon">
                <Truck />
              </div>
              <div className="kpi-content">
                <h3>{realTimeMetrics.todayShipments}</h3>
                <p>Today's Shipments</p>
                <div className="kpi-trend positive">
                  <TrendingUp size={16} />
                  <span>+15.2%</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
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
              <motion.a 
                href="/inbound/goods-in" 
                className="operation-btn primary"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Warehouse size={18} />
                <span>Goods Receipt</span>
                <div className="btn-badge">{inKpi.pending || 0}</div>
              </motion.a>
              <motion.a 
                href="/inbound/putaway" 
                className="operation-btn secondary"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Box size={18} />
                <span>Put Away</span>
                <div className="btn-badge">{inKpi.binsAllocated || 0}</div>
              </motion.a>
              <motion.a 
                href="/inbound/quality-check" 
                className="operation-btn secondary"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <CheckCircle size={18} />
                <span>Quality Check</span>
                <div className="btn-badge">1</div>
              </motion.a>
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
              <motion.a 
                href="/outbound/pick-list" 
                className="operation-btn primary"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ClipboardList size={18} />
                <span>Picking</span>
                <div className="btn-badge">{pickStats.inProgress || 0}</div>
              </motion.a>
              <motion.a 
                href="/outbound/packing" 
                className="operation-btn secondary"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Package size={18} />
                <span>Packing</span>
                <div className="btn-badge">{pickStats.completed || 0}</div>
              </motion.a>
              <motion.a 
                href="/outbound/dispatch" 
                className="operation-btn secondary"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Truck size={18} />
                <span>Dispatch</span>
                <div className="btn-badge">{dispatchStats.ready || 0}</div>
              </motion.a>
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
              <motion.a 
                href="/inventory/stock-overview" 
                className="operation-btn primary"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <BarChart3 size={18} />
                <span>Stock Overview</span>
              </motion.a>
              <motion.a 
                href="/inventory/cycle-count" 
                className="operation-btn secondary"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <RefreshCw size={18} />
                <span>Cycle Count</span>
                <div className="btn-badge alert">!</div>
              </motion.a>
              <motion.a 
                href="/inventory/replenishment" 
                className="operation-btn secondary"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <TrendingUp size={18} />
                <span>Replenishment</span>
              </motion.a>
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
              <motion.a href="/administration/users" className="control-card" variants={itemVariants}>
                <div className="control-icon">
                  <Users size={20} />
                </div>
                <div className="control-info">
                  <span className="control-title">User Management</span>
                  <span className="control-desc">{userStats.active || 0} Active Users</span>
                </div>
              </motion.a>
              <motion.a href="/administration/settings" className="control-card" variants={itemVariants}>
                <div className="control-icon">
                  <Settings size={20} />
                </div>
                <div className="control-info">
                  <span className="control-title">System Settings</span>
                  <span className="control-desc">All Systems OK</span>
                </div>
              </motion.a>
              <motion.a href="/reports/analytics" className="control-card" variants={itemVariants}>
                <div className="control-icon">
                  <BarChart3 size={20} />
                </div>
                <div className="control-info">
                  <span className="control-title">Analytics</span>
                  <span className="control-desc">Real-time Reports</span>
                </div>
              </motion.a>
              <motion.a href="/administration/maintenance" className="control-card" variants={itemVariants}>
                <div className="control-icon">
                  <Wrench size={20} />
                </div>
                <div className="control-info">
                  <span className="control-title">Maintenance</span>
                  <span className="control-desc">{vehicleStats.maintenance || 0} Scheduled</span>
                </div>
              </motion.a>
            </div>
          </div>
        </motion.div>

        {/* Live Activity Feed */}
        <motion.div className="activity-feed" variants={itemVariants}>
          <div className="feed-header">
            <h3>Live Activity Feed</h3>
            <div className="feed-controls">
              <button className="feed-btn active">All</button>
              <button className="feed-btn">Critical</button>
              <button className="feed-btn">Warnings</button>
            </div>
          </div>
          <div className="feed-content">
            <div className="activity-item success">
              <div className="activity-icon">
                <CheckCircle size={16} />
              </div>
              <div className="activity-details">
                <span className="activity-message">Order #{orderStats.orders > 0 ? `WO-2024-${orderStats.orders}` : 'WO-2024-1234'} picked successfully</span>
                <span className="activity-time">2 minutes ago</span>
              </div>
            </div>
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
              {notices.slice(0, 3).map((notice, index) => (
                <div key={index} className={`notification-item ${notice.read ? '' : 'unread'}`}>
                  <div className="notification-icon">
                    <Bell size={14} />
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">{notice.title}</div>
                    <div className="notification-message">{notice.message}</div>
                  </div>
                </div>
              ))}
              {notices.length === 0 && (
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
                {milestones.slice(0, 3).map((milestone) => (
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
                ))}
              </AnimatePresence>
              {milestones.length === 0 && (
                <div className="no-milestones">No recent milestones</div>
              )}
            </div>
          </motion.div>
        </div>
      </motion.section>
    </motion.div>
  );
}
