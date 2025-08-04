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

const DashboardLayout: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const [openMenu, setOpenMenu] = React.useState<string | null>('Dashboard');
  const location = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();

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
    const currentTopLevelMenu = menuItems.find(item => 
      item.basePath && location.pathname.startsWith(item.basePath)
    );
    if (currentTopLevelMenu) {
      setOpenMenu(currentTopLevelMenu.name);
    }
  }, [location.pathname]);

  const menuItems = [
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

  return (
    <div className={`dashboard-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <nav className="dashboard-sidebar">
        <div className="sidebar-header">
          {!isSidebarCollapsed && <h1 className="sidebar-logo">eDrop WMS</h1>}
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
          <h2 className="dashboard-title">eDrop WMS Portal</h2>
          <div className="header-actions">
            <div className="notification-icon">
              <Bell />
              <span className="notification-badge">3</span>
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
