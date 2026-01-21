import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminAuthService, getAdminUser, adminProductService } from '../services/adminApi';
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
          <h2>GROOMUP</h2>
          <span>Admin Panel</span>
        </div>
        <nav className="admin-nav">
          <Link to="/admin/dashboard" className="admin-nav-item active">
            <span className="nav-icon">&#9632;</span>
            Dashboard
          </Link>
          <Link to="/admin/products" className="admin-nav-item">
            <span className="nav-icon">&#9642;</span>
            Products
          </Link>
        </nav>
        <div className="admin-sidebar-footer">
          <button onClick={handleLogout} className="admin-logout-btn">
            Sign Out
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <h1>Dashboard</h1>
          <div className="admin-user-info">
            <span>{adminUser?.email || 'Admin'}</span>
          </div>
        </header>

        <div className="admin-content">
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <div className="stat-icon products-icon">&#9642;</div>
              <div className="stat-info">
                <span className="stat-value">{loading ? '...' : stats.totalProducts}</span>
                <span className="stat-label">Total Products</span>
              </div>
            </div>
          </div>

          <div className="admin-quick-actions">
            <h2>Quick Actions</h2>
            <div className="quick-actions-grid">
              <Link to="/admin/products" className="quick-action-card">
                <span className="qa-icon">&#9642;</span>
                <span className="qa-title">Manage Products</span>
                <span className="qa-desc">View, add, edit, or delete products</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
