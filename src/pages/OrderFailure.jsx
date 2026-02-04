import React, { useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { FaTimesCircle, FaHome, FaRedo } from 'react-icons/fa';
import { orderService } from '../services/api';
import '../assets/styles/order-failure.css';

const OrderFailure = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const reason = searchParams.get('reason') || 'Payment failed or was cancelled';

  const getReasonMessage = (reason) => {
    const reasonMap = {
      'payment_cancelled': 'Payment was cancelled. Please try again.',
      'payment_failed': 'Payment failed. Please check your payment details and try again.',
      'network_error': 'Network error occurred. Please check your connection and try again.',
      'timeout': 'Payment request timed out. Please try again.',
      'insufficient_funds': 'Insufficient funds. Please use a different payment method.',
    };
    return reasonMap[reason] || decodeURIComponent(reason);
  };

  useEffect(() => {
    if (!orderId) {
      return;
    }

    let isActive = true;
    let attempts = 0;
    const maxAttempts = 24;
    const pollIntervalMs = 5000;

    const pollOrderStatus = async () => {
      try {
        const order = await orderService.getOrderById(orderId);
        if (!isActive) {
          return;
        }

        if (order?.status === 'PAID') {
          navigate(`/order-success?orderId=${orderId}`);
          return;
        }
      } catch (error) {
        // Ignore polling errors and keep retrying until max attempts.
      }

      attempts += 1;
      if (isActive && attempts < maxAttempts) {
        setTimeout(pollOrderStatus, pollIntervalMs);
      }
    };

    pollOrderStatus();

    return () => {
      isActive = false;
    };
  }, [orderId, navigate]);

  return (
    <div className="order-failure-page">
      <div className="failure-container">
        <div className="failure-icon">
          <FaTimesCircle />
        </div>
        <h1 className="failure-title">Payment Failed</h1>
        <p className="failure-message">
          {getReasonMessage(reason)}
        </p>

        {orderId && (
          <div className="order-info">
            <p>Order ID: <strong>#{orderId}</strong></p>
            <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
              Your order has been created but payment is pending. You can retry payment from your orders page.
            </p>
          </div>
        )}

        <div className="failure-actions">
          <button onClick={() => navigate('/checkout')} className="btn btn-primary">
            <FaRedo /> Try Again
          </button>
          <Link to="/" className="btn btn-secondary">
            <FaHome /> Go to Home
          </Link>
        </div>

        <div className="help-section">
          <h3>Need Help?</h3>
          <ul>
            <li>Check your payment method details</li>
            <li>Ensure you have sufficient balance</li>
            <li>Contact support if the issue persists</li>
            {orderId && <li>You can retry payment from your orders page</li>}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default OrderFailure;

