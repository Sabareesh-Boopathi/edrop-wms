import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { api } from '../../store/api';
import DashboardHome from '../DashboardHome';
import { BrowserRouter } from 'react-router-dom';

// Create a minimal store with RTK Query slice
const store = configureStore({
  reducer: { [api.reducerPath]: api.reducer },
  middleware: (gDM) => gDM().concat(api.middleware),
});

// Mock service modules used in DashboardHome to avoid network calls
jest.mock('../../services/inboundService', () => ({ computeKpis: jest.fn(async () => ({ totalReceipts: 1, openReceipts: 1, completedToday: 0, pending: 1, binsAllocated: 0 })) }));
jest.mock('../../services/outboundService', () => ({ fetchPickTasks: jest.fn(async () => ([])), fetchDispatchRoutes: jest.fn(async () => ([])) }));
jest.mock('../../services/userService', () => ({ getUsers: jest.fn(async () => ([])) }));
jest.mock('../../services/vehicleService', () => ({ listVehicles: jest.fn(async () => ([])) }));
jest.mock('../../services/driverService', () => ({ listDrivers: jest.fn(async () => ([])) }));
jest.mock('../../services/crateService', () => ({ getCrates: jest.fn(async () => ([])) }));
jest.mock('../../services/communityService', () => ({ listCommunities: jest.fn(async () => ([])) }));
jest.mock('../../services/customerService', () => ({ listCustomers: jest.fn(async () => ([])) }));
jest.mock('../../services/productService', () => ({ listProducts: jest.fn(async () => ([])) }));
jest.mock('../../services/orderService', () => ({ getOrders: jest.fn(async () => ([])), getMyOrders: jest.fn(async () => ([])) }));
jest.mock('../../services/vendorService', () => ({ getVendors: jest.fn(async () => ([])) }));
jest.mock('../../services/milestoneService', () => ({ getMilestones: jest.fn(async () => ([])) }));
jest.mock('../../services/notificationService', () => ({ getMyNotifications: jest.fn(async () => ([])) }));

// Mock RTK Query base fetch to avoid actual network
jest.spyOn(global, 'fetch').mockImplementation(() => Promise.resolve(new Response(JSON.stringify([]))) as any);

describe('DashboardHome smoke', () => {
  it('renders section headers and KPI skeletons without crashing', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <DashboardHome />
        </BrowserRouter>
      </Provider>
    );

    // Expect key headings to exist
    expect(screen.getByText(/Performance Metrics/i)).toBeInTheDocument();
    expect(screen.getByText(/Live Operations Monitor/i)).toBeInTheDocument();
    expect(screen.getByText(/Productivity Insights/i)).toBeInTheDocument();

    // Skeletons present initially
    expect(document.querySelectorAll('.skeleton').length).toBeGreaterThan(0);
  });
});
