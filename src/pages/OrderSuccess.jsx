import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { orderService } from '../services/api';
import { FaCheckCircle, FaHome, FaShoppingBag } from 'react-icons/fa';
import '../assets/styles/order-success.css';

const OrderSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const paymentId = searchParams.get('paymentId');
  const paymentMethod = searchParams.get('paymentMethod');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }

      try {
        const orderData = await orderService.getOrderById(orderId);
        setOrder(orderData);
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="order-success-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading order details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="order-success-page">
      <div className="success-container">
        <div className="success-icon">
          <FaCheckCircle />
        </div>
        <h1 className="success-title">Order Placed Successfully!</h1>
        <p className="success-message">
          Thank you for your order. We've received your order and will begin processing it right away.
        </p>

        {orderId && (
          <div className="order-details">
            <div className="detail-row">
              <span className="detail-label">Order ID:</span>
              <span className="detail-value">#{orderId}</span>
            </div>
            {paymentMethod && (
              <div className="detail-row">
                <span className="detail-label">Payment Method:</span>
                <span className="detail-value">{paymentMethod}</span>
              </div>
            )}
            {paymentId && (
              <div className="detail-row">
                <span className="detail-label">Payment ID:</span>
                <span className="detail-value">{paymentId}</span>
              </div>
            )}
            {order && order.totalPrice && (
              <div className="detail-row">
                <span className="detail-label">Total Amount:</span>
                <span className="detail-value">Rs. {Number(order.totalPrice).toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        <div className="success-actions">
          <Link to="/" className="btn btn-primary">
            <FaHome /> Continue Shopping
          </Link>
          <Link to="/orders" className="btn btn-secondary">
            <FaShoppingBag /> View Orders
          </Link>
        </div>

        <div className="whats-next">
          <h3>What's Next?</h3>
          <ul>
            <li>You will receive an order confirmation email shortly</li>
            <li>We'll notify you once your order has been shipped</li>
            <li>Track your order status in your account</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;

