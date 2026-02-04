import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminAuthService, getAdminUser, adminDashboardService } from '../services/adminApi';
import {
  FiBox, FiUsers, FiShoppingBag, FiTrendingUp, FiSettings,
  FiSearch, FiBell, FiLogOut, FiPieChart, FiActivity, FiStar
} from 'react-icons/fi';
import './AdminDashboard.css';

export function AdminDashboard() {
  const navigate = useNavigate();
  const adminUser = getAdminUser();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
    salesHistory: [],
    topProducts: [],
    categoryEarnings: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await adminDashboardService.getStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const handleLogout = () => {
    adminAuthService.logout();
    navigate('/admin/login');
  };

  // Path generation for Area Chart
  const generateAreaPath = () => {
    if (!stats.salesHistory || stats.salesHistory.length < 2) return "M0,150 L800,150";
    const maxVal = Math.max(...stats.salesHistory.map(h => h.revenue || 0), 1000);
    const points = stats.salesHistory.map((h, i) => {
      const x = (i / (stats.salesHistory.length - 1)) * 800;
      const y = 200 - ((h.revenue || 0) / maxVal) * 150;
      return `${x},${y}`;
    });
    return `M0,200 L${points[0]} ${points.slice(1).map(p => `L${p}`).join(' ')} L800,200 Z`;
  };

  const generateLinePath = () => {
    if (!stats.salesHistory || stats.salesHistory.length < 2) return "M0,150 L800,150";
    const maxVal = Math.max(...stats.salesHistory.map(h => h.revenue || 0), 1000);
    const points = stats.salesHistory.map((h, i) => {
      const x = (i / (stats.salesHistory.length - 1)) * 800;
      const y = 200 - ((h.revenue || 0) / maxVal) * 150;
      return `${x},${y}`;
    });
    return `M${points[0]} ${points.slice(1).map(p => `L${p}`).join(' ')}`;
  };

  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-logo">K</div>
          <div className="admin-logo-text">
            <h2>Kishore S</h2>
            <span>PRO ADMIN</span>
          </div>
        </div>

        <div className="admin-sidebar-section">
          <span className="section-label">MAIN</span>
          <nav className="admin-nav">
            <Link to="/admin/dashboard" className="admin-nav-item active">
              <FiActivity className="nav-icon" />
              <span>Dashboard</span>
            </Link>
            <Link to="/admin/products" className="admin-nav-item">
              <FiShoppingBag className="nav-icon" />
              <span>E-Commerce</span>
              <span className="badge hot">Hot</span>
            </Link>
            <Link to="#" className="admin-nav-item">
              <FiBox className="nav-icon" />
              <span>Apps</span>
            </Link>
          </nav>
        </div>

        <div className="admin-sidebar-section">
          <span className="section-label">COMPONENT</span>
          <nav className="admin-nav">
            <Link to="#" className="admin-nav-item">
              <FiPieChart className="nav-icon" />
              <span>Charts</span>
            </Link>
            <Link to="#" className="admin-nav-item">
              <FiSettings className="nav-icon" />
              <span>Settings</span>
            </Link>
          </nav>
        </div>

        <div className="admin-sidebar-footer">
          <button onClick={handleLogout} className="admin-logout-btn">
            <FiLogOut /> <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div className="header-left">
            <button className="menu-toggle"><FiActivity /></button>
            <div className="admin-search">
              <FiSearch />
              <input type="text" placeholder="Search..." />
            </div>
          </div>
          <div className="header-right">
            <FiSettings className="header-icon" />
            <FiPieChart className="header-icon" />
            <div className="notification-bell">
              <FiBell className="header-icon" />
              <span className="bell-badge">{stats.totalOrders > 9 ? '9+' : stats.totalOrders}</span>
            </div>
            <div className="admin-user-profile">
              <img src="https://ui-avatars.com/api/?name=Kishore+S&background=random" alt="Admin" />
              <span>Kishore S</span>
            </div>
          </div>
        </header>

        <div className="admin-content">
          <div className="dashboard-hero">
            <div className="hero-charts-main">
              <div className="chart-card sales-analytics">
                <div className="chart-header">
                  <h3>Sales Analytics</h3>
                  <div className="chart-filters">
                    <select><option>Current View</option></select>
                  </div>
                </div>
                <div className="stats-row">
                  <div className="mini-stat">
                    <span className="label">Users</span>
                    <span className="value">{loading ? '...' : stats.totalUsers.toLocaleString()}</span>
                    <span className="trend positive"><FiTrendingUp /> Active</span>
                  </div>
                  <div className="mini-stat">
                    <span className="label">Orders</span>
                    <span className="value">{loading ? '...' : stats.totalOrders.toLocaleString()}</span>
                    <span className="trend positive"><FiTrendingUp /> Real-time</span>
                  </div>
                  <div className="mini-stat">
                    <span className="label">Revenue</span>
                    <span className="value">Rs. {loading ? '...' : stats.totalRevenue.toLocaleString()}</span>
                    <span className="trend positive"><FiTrendingUp /> Total</span>
                  </div>
                </div>
                <div className="main-area-chart">
                  <svg viewBox="0 0 800 200" className="svg-chart">
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    {!loading && (
                      <>
                        <path d={generateAreaPath()} fill="url(#chartGradient)" />
                        <path d={generateLinePath()} fill="none" stroke="#10b981" strokeWidth="3" />
                        {stats.salesHistory.map((h, i) => (
                          <circle
                            key={i}
                            cx={(i / (stats.salesHistory.length - 1)) * 800}
                            cy={200 - ((h.revenue || 0) / Math.max(...stats.salesHistory.map(h => h.revenue || 0), 1000)) * 150}
                            r="4"
                            fill="#10b981"
                          />
                        ))}
                      </>
                    )}
                  </svg>
                  <div className="chart-labels">
                    {stats.salesHistory.map((h, i) => <span key={i}>{h.date}</span>)}
                  </div>
                </div>
              </div>

              <div className="hero-charts-side">
                <div className="chart-card secondary-chart">
                  <h3>Top 5 Products</h3>
                  <div className="donut-chart-container">
                    <svg viewBox="0 0 100 100" className="donut-chart">
                      <circle cx="50" cy="50" r="40" fill="transparent" stroke="#e2e8f0" strokeWidth="10" />
                      {/* Dynamically draw donut segments if time permits, for now show top 2 as segments */}
                      <circle cx="50" cy="50" r="40" fill="transparent" stroke="#fbbf24" strokeWidth="10" strokeDasharray="60 190" strokeDashoffset="0" />
                      <circle cx="50" cy="50" r="40" fill="transparent" stroke="#10b981" strokeWidth="10" strokeDasharray="80 170" strokeDashoffset="-60" />
                    </svg>
                    <div className="donut-legend">
                      {stats.topProducts.map((p, i) => (
                        <div key={i} className="legend-item">
                          <span className="dot" style={{ backgroundColor: i === 0 ? '#fbbf24' : '#10b981' }}></span>
                          {p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="chart-card secondary-chart">
                  <h3>Conversion Rate</h3>
                  <div className="conversion-display">
                    <div className="progress-circle">
                      <svg viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#eee" strokeWidth="8" />
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#10b981" strokeWidth="8" strokeDasharray="210 280" />
                      </svg>
                      <div className="circle-text">
                        <span className="percent">33%</span>
                        <span className="change">+2%</span>
                      </div>
                    </div>
                    <div className="conversion-info">
                      <span className="label">Total Products</span>
                      <span className="value">{stats.totalProducts}</span>
                      <span className="trend positive">Live</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="dashboard-bottom-grid">
              <div className="chart-card">
                <h3>Earnings By Category</h3>
                <div className="pie-chart-container">
                  <div className="mock-pie" style={{
                    background: `conic-gradient(#fbbf24 0% 40%, #10b981 40% 100%)`
                  }}></div>
                  <div className="pie-legend">
                    {Object.keys(stats.categoryEarnings).slice(0, 3).map((cat, i) => (
                      <div key={i} className="legend-item">
                        <span className="dot" style={{ backgroundColor: i === 0 ? '#fbbf24' : '#10b981' }}></span>
                        {cat}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="stat-summary-cards">
                <div className="mini-stat-card">
                  <div className="stat-content">
                    <span className="value">{stats.totalProducts}</span>
                    <span className="label">ACTIVE PRODUCTS</span>
                  </div>
                  <div className="mini-graph yellow"></div>
                </div>
                <div className="mini-stat-card">
                  <div className="stat-content">
                    <span className="value">{stats.totalUsers}</span>
                    <span className="label">REGISTERED USERS</span>
                  </div>
                  <div className="mini-graph blue"></div>
                </div>
              </div>

              <div className="chart-card recent-reviews">
                <div className="card-header">
                  <h3>Real-time Activity</h3>
                  <select><option>Recent Orders</option></select>
                </div>
                {/* Repurposing reviews for recent orders display */}
                <div className="review-item">
                  <div className="review-stars">
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>System Online</span>
                  </div>
                  <span className="review-author">Monitoring orders and inventory</span>
                  <p>All core systems are operational. Last data sync: {new Date().toLocaleTimeString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );

}

export default AdminDashboard;
