import React from 'react';
import './Dashboard.css';
import { 
  Home, Package, Truck, Users, BarChart2, ChevronsLeft, ChevronsRight, 
  Bell, User, ArrowLeftRight, ChevronDown, Warehouse, Recycle, Wrench, FileText,
  Inbox, CheckSquare, MapPin, ListChecks, Box, Route, Trash2, HandHeart, Sparkles,
  Building, UserCog, Contact, PackageSearch, Scan, Thermometer, LogOut
} from 'lucide-react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getMyNotifications, getMyUnreadCount, markNotificationAsRead } from '../services/notificationService';
import { useConfig } from '../contexts/ConfigContext';

// Types for menu items
type SubItem = { name: string; path: string };
interface MenuItem { name: string; icon: any; path?: string; basePath: string; subItems: SubItem[] }

const menuItems: MenuItem[] = [
  { name: 'Dashboard', icon: Home, path: '/dashboard', basePath: '/dashboard', subItems: [] },
  { 
    name: 'Inbound', 
    icon: Inbox, 
    basePath: '/inbound',
    subItems: [
      { name: 'Goods In', path: '/inbound/goods-in' },
      { name: 'Quality Check', path: '/inbound/quality-check' },
      { name: 'Bin Allocation', path: '/inbound/bin-allocation' },
    ] 
  },
  { 
    name: 'Inventory', 
    icon: Warehouse, 
    basePath: '/inventory',
    subItems: [
      { name: 'Stock Overview', path: '/inventory/stock-overview' },
      { name: 'Stock Adjustment', path: '/inventory/stock-adjustment' },
      { name: 'Crate Inventory', path: '/inventory/crate-inventory' },
    ]
  },
  { 
    name: 'Outbound', 
    icon: Truck, 
    basePath: '/outbound',
    subItems: [
      { name: 'Pick List', path: '/outbound/pick-list' },
      { name: 'Packing', path: '/outbound/packing' },
      { name: 'Route Binning', path: '/outbound/route-binning' },
      { name: 'Dispatch Console', path: '/outbound/dispatch-console' },
    ]
  },
  { 
    name: 'Returns & Waste', 
    icon: Recycle, 
    basePath: '/returns-waste',
    subItems: [
      { name: 'Returns Management', path: '/returns-waste/returns-management' },
      { name: 'Charity/Disposal', path: '/returns-waste/charity-disposal-routing' },
      { name: 'Crate Sanitization', path: '/returns-waste/crate-sanitization' },
    ]
  },
  { 
    name: 'Administration', 
    icon: UserCog, 
    basePath: '/administration',
    subItems: [
      { name: 'Warehouse Mgmt', path: '/administration/warehouse-management' },
      { name: 'Users & Roles', path: '/administration/users-roles' },
      { name: 'Vendors', path: '/administration/vendors' },
      { name: 'Crate Management', path: '/administration/crate-management' },
      { name: 'Bin Management', path: '/administration/bin-management' },
      { name: 'System Config', path: '/administration/system-configuration' },
    ]
  },
  { 
    name: 'Reports', 
    icon: FileText, 
    basePath: '/reports',
    subItems: [
      { name: 'Stock Movement', path: '/reports/stock-movement' },
      { name: 'Fulfillment Accuracy', path: '/reports/fulfillment-accuracy' },
      { name: 'Crate Utilization', path: '/reports/crate-utilization' },
      { name: 'Emission Savings', path: '/reports/emission-savings' },
  { name: 'Audit Log', path: '/reports/audit-log' },
    ]
  },
  { 
    name: 'Tools', 
    icon: Wrench, 
    basePath: '/tools',
    subItems: [
      { name: 'Mobile App Sync', path: '/tools/mobile-app-sync' },
      { name: 'Barcode Generator', path: '/tools/barcode-generator' },
      { name: 'Freshness Monitoring', path: '/tools/freshness-monitoring' },
    ]
  },
];

const DashboardLayout: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const [openMenu, setOpenMenu] = React.useState<string | null>('Dashboard');
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [unread, setUnread] = React.useState<number>(0);
  const [showNotif, setShowNotif] = React.useState(false);
  const location = useLocation();
  const { logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { config, formatDateTime } = useConfig();

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleMenuClick = (menu: string) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  React.useEffect(() => {
    const currentTopLevelMenu = menuItems.find((item) => 
      item.basePath && location.pathname.startsWith(item.basePath)
    );
    if (currentTopLevelMenu) {
      setOpenMenu(currentTopLevelMenu.name);
    }
  }, [location.pathname]);

  React.useEffect(() => {
    const load = async () => {
      try {
        if (!isAuthenticated) return;
        const [list, count] = await Promise.all([
          getMyNotifications(0, 10),
          getMyUnreadCount(),
        ]);
        setNotifications(list);
        setUnread(count);
      } catch (e) {
        console.debug('Notification polling failed', e);
      }
    };
    load();
    // poll every 20s
    const timer = setInterval(load, 20000);
    return () => clearInterval(timer);
  }, [isAuthenticated]);

  const handleClickNotif = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      setUnread((prev) => Math.max(0, prev - 1));
    } catch (e) {
      console.debug('Failed to mark notification as read', e);
    }
  };

  return (
    <div className={`dashboard-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <nav className="dashboard-sidebar">
        <div className="sidebar-header">
          {!isSidebarCollapsed && <h1 className="sidebar-logo">{config.appName || 'eDrop WMS'}</h1>}
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            {isSidebarCollapsed ? <ChevronsRight /> : <ChevronsLeft />}
          </button>
        </div>
        <ul className="sidebar-menu">
          {menuItems.map((item) => (
            <li key={item.name} className={`${openMenu === item.name ? 'open' : ''} ${location.pathname.startsWith(item.basePath) ? 'active-parent' : ''}`}>
              {item.path ? (
                <Link to={item.path} onClick={() => handleMenuClick(item.name)}>
                  <item.icon />
                  {!isSidebarCollapsed && <span>{item.name}</span>}
                </Link>
              ) : (
                <a onClick={() => handleMenuClick(item.name)}>
                  <item.icon />
                  {!isSidebarCollapsed && <span>{item.name}</span>}
                  {!isSidebarCollapsed && item.subItems.length > 0 && <ChevronDown className="submenu-arrow" />}
                </a>
              )}
              {!isSidebarCollapsed && item.subItems.length > 0 && (
                <ul className="submenu">
                  {item.subItems.map((subItem) => (
                    <li key={subItem.name}>
                      <Link to={subItem.path} className={location.pathname === subItem.path ? 'active' : ''}>
                        {subItem.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-button">
            <LogOut />
            {!isSidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </nav>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <h2 className="dashboard-title">{config.appName || 'eDrop WMS'} Portal</h2>
          <div className="header-actions">
            <div className="notification-icon" onClick={() => setShowNotif((v) => !v)}>
              <Bell />
              {unread > 0 && <span className="notification-badge">{unread}</span>}
              {showNotif && (
                <div className="notification-dropdown">
                  {notifications.length === 0 ? (
                    <div className="notification-empty">No notifications</div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className={`notification-item ${n.is_read ? 'read' : 'unread'}`} onClick={() => handleClickNotif(n.id)}>
                        <div className="notification-title">{n.title}</div>
                        {n.message && <div className="notification-message">{n.message}</div>}
                        <div className="notification-time">{formatDateTime(n.created_at)}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            <div className="profile-icon">
              <User />
            </div>
          </div>
        </header>
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
