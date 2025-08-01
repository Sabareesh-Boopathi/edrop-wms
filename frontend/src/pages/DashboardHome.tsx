import React from 'react';
import './Dashboard.css';
import { 
  Package, DollarSign, UserPlus, ArrowUpRight, ArrowDownRight, MoreHorizontal,
  ArrowLeftRight
} from 'lucide-react';

const DashboardHome: React.FC = () => {
  return (
    <>
      <section className="kpi-section">
        <div className="kpi-card kpi-card-1">
          <div className="kpi-card-header">
            <div className="kpi-card-icon"><DollarSign /></div>
            <MoreHorizontal className="kpi-card-menu" />
          </div>
          <div className="kpi-card-body">
            <h3>$5,280.50</h3>
            <p>Total Earning</p>
          </div>
          <div className="kpi-card-footer">
            <span className="kpi-trend"><ArrowUpRight /> 12.5%</span>
          </div>
        </div>
        <div className="kpi-card kpi-card-2">
          <div className="kpi-card-header">
            <div className="kpi-card-icon"><Package /></div>
            <MoreHorizontal className="kpi-card-menu" />
          </div>
          <div className="kpi-card-body">
            <h3>1,280</h3>
            <p>Total Orders</p>
          </div>
          <div className="kpi-card-footer">
            <span className="kpi-trend"><ArrowUpRight /> 8.2%</span>
          </div>
        </div>
        <div className="kpi-card kpi-card-3">
          <div className="kpi-card-header">
            <div className="kpi-card-icon"><UserPlus /></div>
            <MoreHorizontal className="kpi-card-menu" />
          </div>
          <div className="kpi-card-body">
            <h3>250</h3>
            <p>New Customers</p>
          </div>
          <div className="kpi-card-footer">
            <span className="kpi-trend"><ArrowDownRight /> 1.5%</span>
          </div>
        </div>
        <div className="kpi-card kpi-card-4">
          <div className="kpi-card-header">
            <div className="kpi-card-icon"><ArrowLeftRight /></div>
            <MoreHorizontal className="kpi-card-menu" />
          </div>
          <div className="kpi-card-body">
            <h3>52</h3>
            <p>Returns</p>
          </div>
          <div className="kpi-card-footer">
            <span className="kpi-trend"><ArrowUpRight /> 5%</span>
          </div>
        </div>
      </section>

      <section className="charts-section">
        <div className="main-chart-card">
          <div className="trend-card-header">
            <h4>Order & Revenue</h4>
            <div className="trend-card-toggle">
              <button className="active">Month</button>
              <button>Year</button>
            </div>
          </div>
          <div className="chart-placeholder tall-chart">Chart</div>
        </div>
        <div className="side-chart-card">
          <div className="trend-card-header">
            <h4>Warehouse Workload</h4>
          </div>
          <div className="pie-chart-placeholder">
            <div className="pie-chart"></div>
            <div className="pie-chart-legend">
              <div><span className="dot receiving"></span>Receiving: 30%</div>
              <div><span className="dot picking"></span>Picking: 45%</div>
              <div><span className="dot shipping"></span>Shipping: 25%</div>
            </div>
          </div>
        </div>
      </section>

      <section className="data-section">
        <div className="data-card">
          <div className="trend-card-header">
            <h4>Recent Activity</h4>
          </div>
          <ul className="activity-list">
            <li>Order #12345 was shipped.</li>
            <li>New stock received for SKU #5678.</li>
            <li>User John Doe logged in.</li>
            <li>Return processed for order #12321.</li>
          </ul>
        </div>
        <div className="data-card">
          <div className="trend-card-header">
            <h4>Top Selling Products</h4>
          </div>
          <table className="product-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Sales</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Product A</td>
                <td>#5678</td>
                <td>520</td>
              </tr>
              <tr>
                <td>Product B</td>
                <td>#9123</td>
                <td>450</td>
              </tr>
              <tr>
                <td>Product C</td>
                <td>#4455</td>
                <td>310</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};

export default DashboardHome;
