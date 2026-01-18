import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { orderService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import '../assets/styles/orders.css';

const Orders = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        const ordersData = await orderService.getMyOrders();
        // Normalize orders data - ensure items array and proper formatting
        const normalizedOrders = Array.isArray(ordersData) 
          ? ordersData.map(order => ({
              ...order,
              items: order.items || [],
              createdAt: order.createdAt || new Date().toISOString(),
            }))
          : [];
        setOrders(normalizedOrders);
        setError(null);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load orders. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [isAuthenticated, navigate]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status) => {
    const statusLower = (status || '').toLowerCase();
    if (statusLower === 'paid') return '#28a745';
    if (statusLower === 'pending') return '#ffc107';
    if (statusLower === 'cancelled') return '#dc3545';
    if (statusLower === 'delivered') return '#007bff';
    return '#666';
  };

  if (loading) {
    return (
      <div className="orders-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="orders-container">
        <div className="orders-header">
          <h1>My Orders</h1>
          <p>View and manage your order history</p>
        </div>

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="no-orders">
            <i className="fas fa-box-open"></i>
            <h3>No Orders Yet</h3>
            <p>You haven't placed any orders yet. Start shopping!</p>
            <Link to="/" className="continue-shopping-btn">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <div className="order-card" key={order.id}>
                <div className="order-card-header">
                  <div className="order-id">Order #{order.id}</div>
                  <div 
                    className="order-status" 
                    style={{ color: getStatusColor(order.status) }}
                  >
                    {order.status || 'PENDING'}
                  </div>
                </div>

                <div className="order-date">
                  Ordered on {formatDate(order.createdAt)}
                </div>

                <div className="order-items-list">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item, index) => (
                      <div className="order-item" key={index}>
                        <div className="order-item-image">
                          <img 
                            src={item.productImage || 'https://via.placeholder.com/80x80?text=Product'} 
                            alt={item.productName || 'Product'}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/80x80?text=Product';
                            }}
                          />
                        </div>
                        <div className="order-item-details">
                          <div className="order-item-name">{item.productName || 'Product'}</div>
                          <div className="order-item-meta">
                            <span>Qty: {item.quantity || 1}</span>
                            <span className="order-item-price">
                              Rs. {Number(item.price || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-items">No items in this order</div>
                  )}
                </div>

                <div className="order-card-footer">
                  <div className="order-total">
                    Total: Rs. {Number(order.totalPrice || 0).toFixed(2)}
                  </div>
                  <button 
                    className="view-details-btn"
                    onClick={() => navigate(`/profile?tab=orders&orderId=${order.id}`)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;

