import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminAuthService, getAdminUser, adminProductService } from '../services/adminApi';
import { 
  FiBox, FiUsers, FiShoppingBag, FiTrendingUp, FiSettings, 
  FiSearch, FiBell, FiLogOut, FiPieChart, FiActivity, FiStar 
} from 'react-icons/fi';
import './AdminDashboard.css';

export function AdminDashboard() {
  const navigate = useNavigate();
  const adminUser = getAdminUser();
  const [stats, setStats] = useState({ totalProducts: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const products = await adminProductService.getAllProducts();
        setStats({
          totalProducts: Array.isArray(products) ? products.length : 0
        });
      } catch {
        setStats({ totalProducts: 0 });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleLogout = () => {
    adminAuthService.logout();
    navigate('/admin/login');
  };

  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-logo">P</div>
          <div className="admin-logo-text">
            <h2>Philbert</h2>
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
              <span className="bell-badge">5</span>
            </div>
            <div className="admin-user-profile">
              <img src="https://ui-avatars.com/api/?name=Admin&background=random" alt="Admin" />
              <span>{adminUser?.email?.split('@')[0] || 'Admin'}</span>
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
                    <select><option>January</option></select>
                  </div>
                </div>
                <div className="stats-row">
                  <div className="mini-stat">
                    <span className="label">Traffic</span>
                    <span className="value">324,222</span>
                    <span className="trend positive"><FiTrendingUp /> +15%</span>
                  </div>
                  <div className="mini-stat">
                    <span className="label">Orders</span>
                    <span className="value">{loading ? '...' : (stats.totalProducts * 12).toLocaleString()}</span>
                    <span className="trend positive"><FiTrendingUp /> +4%</span>
                  </div>
                  <div className="mini-stat">
                    <span className="label">Revenue</span>
                    <span className="value">$324,222</span>
                    <span className="trend negative"><FiTrendingUp /> -5%</span>
                  </div>
                </div>
                <div className="main-area-chart">
                  {/* Mock SVG Area Chart */}
                  <svg viewBox="0 0 800 200" className="svg-chart">
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <path d="M0,150 Q100,50 200,120 T400,80 T600,140 T800,100 L800,200 L0,200 Z" fill="url(#chartGradient)" />
                    <path d="M0,150 Q100,50 200,120 T400,80 T600,140 T800,100" fill="none" stroke="#10b981" strokeWidth="3" />
                    {/* Points */}
                    <circle cx="200" cy="120" r="4" fill="#10b981" />
                    <circle cx="400" cy="80" r="4" fill="#10b981" />
                    <circle cx="600" cy="140" r="4" fill="#10b981" />
                  </svg>
                  <div className="chart-labels">
                    <span>02</span><span>04</span><span>06</span><span>08</span><span>10</span><span>12</span><span>14</span><span>16</span>
                  </div>
                </div>
              </div>

              <div className="hero-charts-side">
                <div className="chart-card secondary-chart">
                  <h3>Top 5 Products</h3>
                  <div className="donut-chart-container">
                    <svg viewBox="0 0 100 100" className="donut-chart">
                      <circle cx="50" cy="50" r="40" fill="transparent" stroke="#e2e8f0" strokeWidth="10" />
                      <circle cx="50" cy="50" r="40" fill="transparent" stroke="#fbbf24" strokeWidth="10" strokeDasharray="60 190" strokeDashoffset="0" />
                      <circle cx="50" cy="50" r="40" fill="transparent" stroke="#10b981" strokeWidth="10" strokeDasharray="80 170" strokeDashoffset="-60" />
                    </svg>
                    <div className="donut-legend">
                      <div className="legend-item"><span className="dot" style={{backgroundColor: '#fbbf24'}}></span> Paleo Bars</div>
                      <div className="legend-item"><span className="dot" style={{backgroundColor: '#10b981'}}></span> Bow Ties</div>
                    </div>
                  </div>
                </div>
                
                <div className="chart-card secondary-chart">
                  <h3>Conversion Rate</h3>
                  <div className="conversion-display">
                    <div className="progress-circle">
                      <svg viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#eee" strokeWidth="8"/>
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#10b981" strokeWidth="8" strokeDasharray="210 280" />
                      </svg>
                      <div className="circle-text">
                        <span className="percent">33%</span>
                        <span className="change">+33%</span>
                      </div>
                    </div>
                    <div className="conversion-info">
                        <span className="label">Cart Abandonment</span>
                        <span className="value">73%</span>
                        <span className="trend positive">+15%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="dashboard-bottom-grid">
               <div className="chart-card">
                  <h3>Earnings By Item Type</h3>
                  <div className="pie-chart-container">
                     {/* Simplified Pie Mock */}
                     <div className="mock-pie"></div>
                     <div className="pie-legend">
                        <div className="legend-item"><span className="dot" style={{backgroundColor: '#fbbf24'}}></span> Paleo Bars</div>
                        <div className="legend-item"><span className="dot" style={{backgroundColor: '#10b981'}}></span> Bow Ties</div>
                     </div>
                  </div>
               </div>

               <div className="stat-summary-cards">
                  <div className="mini-stat-card">
                    <div className="stat-content">
                       <span className="value">$15,678</span>
                       <span className="label">VISITS</span>
                    </div>
                    <div className="mini-graph yellow"></div>
                  </div>
                  <div className="mini-stat-card">
                    <div className="stat-content">
                       <span className="value">46.41%</span>
                       <span className="label">BOUNCE RATE</span>
                    </div>
                    <div className="mini-graph blue"></div>
                  </div>
               </div>

               <div className="chart-card recent-reviews">
                  <div className="card-header">
                    <h3>Recent Reviews</h3>
                    <select><option>Sort By Newest</option></select>
                  </div>
                  <div className="review-item">
                    <div className="review-stars">
                       <FiStar className="filled"/><FiStar className="filled"/><FiStar className="filled"/><FiStar className="filled"/><FiStar />
                       <span>for Paleo Bars</span>
                    </div>
                    <span className="review-author">By Jens Brincker 11 day ago</span>
                    <p>Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit.</p>
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
