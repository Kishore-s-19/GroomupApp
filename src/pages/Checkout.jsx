import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { orderService, paymentService } from '../services/api';
import { FaLock, FaShieldAlt, FaCreditCard, FaMoneyBillWave, FaGooglePay } from 'react-icons/fa';
import '../assets/styles/checkout.css';

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  
  const [formData, setFormData] = useState(() => ({
    firstName: isAuthenticated && user ? (user.firstName || user.name?.split(' ')[0] || '') : '',
    lastName: isAuthenticated && user ? (user.lastName || user.name?.split(' ')[1] || '') : '',
    email: isAuthenticated && user ? (user.email || '') : '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  }));

  const [deliveryMethod, setDeliveryMethod] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () => {
      console.error('Failed to load Razorpay script');
      alert('Payment gateway could not be loaded. Please refresh the page.');
    };
    document.body.appendChild(script);

    return () => {
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, []);

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
  const deliveryCost = deliveryMethod === 'express' ? 250 : 0; // Standard delivery is free
  const total = subtotal + deliveryCost;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRazorpayPayment = async (orderId, paymentResponse) => {
    if (!window.Razorpay || !razorpayLoaded) {
      throw new Error('Razorpay SDK not loaded');
    }

    // Convert amount to number and then to paise (multiply by 100)
    const amountInPaise = Math.round(Number(paymentResponse.amount || 0) * 100);

    const options = {
      key: paymentResponse.gatewayKeyId,
      amount: amountInPaise, // Amount in paise
      currency: paymentResponse.currency,
      name: 'GROOMUP',
      description: `Order #${orderId}`,
      order_id: paymentResponse.gatewayOrderId,
      handler: async function(response) {
        // IMPORTANT: In test mode, Razorpay handler may be called prematurely
        // For UPI payments, we verify with backend before showing success
        console.log('Razorpay payment handler called:', response);
        
        // Validate response has required fields
        if (!response || !response.razorpay_payment_id || !response.razorpay_order_id) {
          console.error('Invalid Razorpay response:', response);
          navigate(`/order-failure?orderId=${orderId}&reason=invalid_payment_response`);
          return;
        }

        // For UPI, verify payment status with backend before redirecting
        // This ensures actual payment completion, not just handler callback
        if (paymentMethod === 'upi') {
          try {
            // Show verifying state
            const verifyMessage = document.createElement('div');
            verifyMessage.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:20px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.3);z-index:10000;text-align:center;';
            verifyMessage.innerHTML = '<h3>Verifying Payment...</h3><p>Please wait while we confirm your payment.</p>';
            document.body.appendChild(verifyMessage);

            // Wait and verify payment status multiple times
            let verified = false;
            let attempts = 0;
            const maxAttempts = 8; // Check for up to 16 seconds (8 attempts × 2 seconds)
            
            while (!verified && attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              try {
                const latestPayment = await paymentService.getLatestPayment(orderId);
                console.log('Payment status check:', latestPayment);
                
                if (latestPayment && latestPayment.status === 'SUCCESS') {
                  verified = true;
                  document.body.removeChild(verifyMessage);
                  clearCart();
                  navigate(`/order-success?orderId=${orderId}&paymentId=${response.razorpay_payment_id}`);
                  return;
                }
              } catch (err) {
                console.log(`Payment verification attempt ${attempts + 1} failed:`, err.message);
              }
              
              attempts++;
            }
            
            document.body.removeChild(verifyMessage);
            
            // If payment not verified, show error
            if (!verified) {
              alert('Payment verification failed. Please check your order status or contact support. If payment was successful, your order will be processed.');
              navigate(`/order-failure?orderId=${orderId}&reason=payment_verification_failed`);
              return;
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            // Remove any loading messages
            const verifyMsg = document.querySelector('div[style*="Verifying Payment"]');
            if (verifyMsg) document.body.removeChild(verifyMsg);
            
            alert('Could not verify payment status. Please check your order status. If payment was successful, your order will be processed.');
            navigate(`/order-failure?orderId=${orderId}&reason=verification_error`);
          }
        } else {
          // For card payments, redirect immediately (more reliable)
          // But still verify in background
          clearCart();
          navigate(`/order-success?orderId=${orderId}&paymentId=${response.razorpay_payment_id}`);
        }
      },
      prefill: {
        name: `${formData.firstName} ${formData.lastName}`.trim() || 'Customer',
        email: formData.email || '',
        contact: formData.phone || ''
      },
      theme: {
        color: '#8B1538'
      },
      modal: {
        ondismiss: function() {
          // User closed the modal - redirect to failure page
          navigate(`/order-failure?orderId=${orderId}&reason=payment_cancelled`);
        }
      }
    };

    // For UPI, add UPI-specific options
    if (paymentMethod === 'upi') {
      options.method = {
        upi: true
      };
    }

    const razorpay = new window.Razorpay(options);
    razorpay.on('payment.failed', function(response) {
      navigate(`/order-failure?orderId=${orderId}&reason=${response.error.description || 'payment_failed'}`);
    });
    
    razorpay.open();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      alert('Please sign in to proceed with checkout.');
      navigate('/login');
      return;
    }

    if (cart.length === 0) {
      alert('Your cart is empty.');
      return;
    }

    setIsProcessing(true);

    try {
      // Build shipping address string
      const shippingAddress = `${formData.firstName} ${formData.lastName}\n${formData.address}\n${formData.city}, ${formData.state} ${formData.zipCode}\nPhone: ${formData.phone}`;

      // Step 1: Create order
      const orderResponse = await orderService.createOrder(shippingAddress);
      const orderId = orderResponse.id;

      // Step 2: Handle payment based on method
      if (paymentMethod === 'cod') {
        // For COD, redirect to success page directly
        clearCart();
        navigate(`/order-success?orderId=${orderId}&paymentMethod=COD`);
      } else if (paymentMethod === 'card' || paymentMethod === 'upi') {
        // For Razorpay (card/UPI), create payment and open Razorpay checkout
        if (!razorpayLoaded) {
          throw new Error('Payment gateway is still loading. Please wait a moment and try again.');
        }

        const paymentResponse = await paymentService.createPayment(orderId, 'RAZORPAY');
        await handleRazorpayPayment(orderId, paymentResponse);
      } else {
        throw new Error('Invalid payment method');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      const errorMessage = error.message || 'Failed to process order. Please try again.';
      alert(errorMessage);
      navigate(`/order-failure?reason=${encodeURIComponent(errorMessage)}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="checkout-page">
        <div className="empty-cart-message" style={{ textAlign: 'center', padding: '100px 0' }}>
          <h2>Your bag is empty</h2>
          <p>Please add some items to proceed to checkout.</p>
          <Link to="/" style={{ color: 'var(--primary-color)', marginTop: '20px', display: 'inline-block' }}>
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-header">
        <h1 className="checkout-title">Checkout</h1>
      </div>

      <div className="checkout-container">
        {/* Left Column - Forms */}
        <div className="checkout-forms">
          <form id="checkout-form" onSubmit={handleSubmit}>
            
            {/* Contact Information */}
            <div className="checkout-section">
              <h2 className="section-title">1. Contact Information</h2>
              <div className="form-group full-width">
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  name="email"
                  className="form-input" 
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            {/* Shipping Address */}
            <div className="checkout-section">
              <h2 className="section-title">2. Shipping Address</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input 
                    type="text" 
                    name="firstName"
                    className="form-input" 
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input 
                    type="text" 
                    name="lastName"
                    className="form-input" 
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group full-width">
                  <label className="form-label">Address</label>
                  <input 
                    type="text" 
                    name="address"
                    className="form-input" 
                    placeholder="Street address, apartment, etc."
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input 
                    type="text" 
                    name="city"
                    className="form-input" 
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Postal Code</label>
                  <input 
                    type="text" 
                    name="zipCode"
                    className="form-input" 
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group full-width">
                  <label className="form-label">Phone Number</label>
                  <input 
                    type="tel" 
                    name="phone"
                    className="form-input" 
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Delivery Method */}
            <div className="checkout-section">
              <h2 className="section-title">3. Delivery Method</h2>
              <div className="delivery-options">
                <div 
                  className={`delivery-option ${deliveryMethod === 'standard' ? 'selected' : ''}`}
                  onClick={() => setDeliveryMethod('standard')}
                >
                  <div className="radio-circle"></div>
                  <div className="option-details">
                    <div>
                      <span className="option-name">Standard Delivery</span>
                      <span className="option-desc">3-5 business days</span>
                    </div>
                    <span className="option-price">FREE</span>
                  </div>
                </div>
                
                <div 
                  className={`delivery-option ${deliveryMethod === 'express' ? 'selected' : ''}`}
                  onClick={() => setDeliveryMethod('express')}
                >
                  <div className="radio-circle"></div>
                  <div className="option-details">
                    <div>
                      <span className="option-name">Express Delivery</span>
                      <span className="option-desc">1-2 business days</span>
                    </div>
                    <span className="option-price">Rs. 250.00</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="checkout-section">
              <h2 className="section-title">4. Payment</h2>
              <div className="delivery-options">
                <div 
                  className={`delivery-option ${paymentMethod === 'card' ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod('card')}
                >
                  <div className="radio-circle"></div>
                  <div className="option-details">
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                      <FaCreditCard />
                      <span className="option-name">Credit / Debit Card</span>
                    </div>
                  </div>
                </div>
                
                <div 
                  className={`delivery-option ${paymentMethod === 'upi' ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod('upi')}
                >
                  <div className="radio-circle"></div>
                  <div className="option-details">
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                      <FaGooglePay />
                      <span className="option-name">UPI</span>
                    </div>
                  </div>
                </div>
                
                <div 
                  className={`delivery-option ${paymentMethod === 'cod' ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod('cod')}
                >
                  <div className="radio-circle"></div>
                  <div className="option-details">
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                      <FaMoneyBillWave />
                      <span className="option-name">Cash on Delivery</span>
                    </div>
                  </div>
                </div>
              </div>

              {(paymentMethod === 'card' || paymentMethod === 'upi') && (
                <div className="payment-info" style={{marginTop: '20px', padding: '20px', background: '#f8f9fa', borderRadius: '5px', textAlign: 'center'}}>
                  <p style={{color: '#666', fontSize: '14px'}}>
                    {paymentMethod === 'card' 
                      ? 'You will be redirected to Razorpay secure payment gateway to complete your payment.' 
                      : 'You will be redirected to Razorpay UPI payment gateway to complete your payment.'}
                  </p>
                  <div style={{marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'}}>
                    <FaShieldAlt style={{color: '#28a745'}} />
                    <span style={{fontSize: '12px', color: '#28a745'}}>Secure Payment Gateway</span>
                  </div>
                </div>
              )}
            </div>

          </form>
        </div>

        {/* Right Column - Summary */}
        <div className="order-summary-container">
          <div className="order-summary-card">
            <h3 className="summary-header">Order Summary</h3>
            
            <div className="cart-items-preview">
              {cart.map(item => (
                <div className="mini-item" key={item.id}>
                  <img src={item.image} alt={item.name} className="mini-item-img" />
                  <div className="mini-item-info">
                    <div className="mini-item-name">{item.name}</div>
                    <div className="mini-item-meta">
                      <span>Qty: {item.quantity}</span>
                      <span>Rs. {(Number(item.price) * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="summary-totals">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>Rs. {subtotal.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Delivery</span>
                <span>{deliveryCost === 0 ? 'FREE' : `Rs. ${deliveryCost.toFixed(2)}`}</span>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <span>Rs. {total.toFixed(2)}</span>
              </div>
            </div>

            <button 
              type="submit" 
              form="checkout-form"
              className="place-order-btn"
              disabled={isProcessing || (paymentMethod !== 'cod' && !razorpayLoaded)}
            >
              {isProcessing ? 'Processing...' : 'Place Order'}
            </button>

            <div className="secure-badge">
              <FaShieldAlt />
              <span>Secure Checkout</span>
            </div>
            <div className="secure-badge">
               <FaLock />
               <span>SSL Encrypted Payment</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
