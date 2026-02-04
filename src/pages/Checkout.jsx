import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { orderService, paymentService } from '../services/api';
import { FaLock, FaShieldAlt, FaCreditCard, FaMoneyBillWave, FaGooglePay } from 'react-icons/fa';
import '../assets/styles/checkout.css';

const sanitizeInput = (value) => {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/[<>'"&]/g, '');
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
};

const validatePincode = (pincode) => {
  const pincodeRegex = /^[1-9][0-9]{5}$/;
  return pincodeRegex.test(pincode);
};

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  
  const [formData, setFormData] = useState(() => ({
    firstName: isAuthenticated && user ? sanitizeInput(user.firstName || user.name?.split(' ')[0] || '') : '',
    lastName: isAuthenticated && user ? sanitizeInput(user.lastName || user.name?.split(' ')[1] || '') : '',
    email: isAuthenticated && user ? sanitizeInput(user.email || '') : '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  }));

  const [errors, setErrors] = useState({});
  const [deliveryMethod, setDeliveryMethod] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

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

  const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
  const deliveryCost = deliveryMethod === 'express' ? 250 : 0;
  const total = subtotal + deliveryCost;

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.firstName || formData.firstName.length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }
    if (!formData.lastName || formData.lastName.length < 1) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.email || !validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.phone || !validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }
    if (!formData.address || formData.address.length < 10) {
      newErrors.address = 'Please enter a complete address (min 10 characters)';
    }
    if (!formData.city || formData.city.length < 2) {
      newErrors.city = 'Please enter a valid city name';
    }
    if (!formData.zipCode || !validatePincode(formData.zipCode)) {
      newErrors.zipCode = 'Please enter a valid 6-digit pincode';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const sanitizedValue = sanitizeInput(value);
    
    setFormData(prev => ({
      ...prev,
      [name]: sanitizedValue
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleRazorpayPayment = async (orderId, paymentResponse) => {
    if (!window.Razorpay || !razorpayLoaded) {
      throw new Error('Razorpay SDK not loaded');
    }

    const amountInPaise = Math.round(Number(paymentResponse.amount || 0) * 100);

    const options = {
      key: paymentResponse.gatewayKeyId,
      amount: amountInPaise,
      currency: paymentResponse.currency,
      name: 'GROOMUP',
      description: `Order #${orderId}`,
      order_id: paymentResponse.gatewayOrderId,
      handler: async function(response) {
        console.log('Razorpay payment handler called:', response);
        
        if (!response || !response.razorpay_payment_id || !response.razorpay_order_id) {
          console.error('Invalid Razorpay response:', response);
          navigate(`/order-failure?orderId=${orderId}&reason=invalid_payment_response`);
          return;
        }

          if (!response.razorpay_signature) {
            console.error('Missing Razorpay signature:', response);
            navigate(`/order-failure?orderId=${orderId}&reason=missing_payment_signature`);
            return;
          }

          const verificationPayload = {
            orderId,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id,
            razorpaySignature: response.razorpay_signature
          };

          let verifyMessage = null;

          try {
            if (paymentMethod === 'upi') {
              verifyMessage = document.createElement('div');
              verifyMessage.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:20px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.3);z-index:10000;text-align:center;';
              verifyMessage.innerHTML = '<h3>Verifying Payment...</h3><p>Please wait while we confirm your payment.</p>';
              document.body.appendChild(verifyMessage);
            }

            await paymentService.verifyRazorpayPayment(verificationPayload);

            if (verifyMessage) {
              document.body.removeChild(verifyMessage);
            }

            clearCart();
            navigate(`/order-success?orderId=${orderId}&paymentId=${response.razorpay_payment_id}`);
          } catch (error) {
            console.error('Payment verification error:', error);
            if (verifyMessage && document.body.contains(verifyMessage)) {
              document.body.removeChild(verifyMessage);
            }

            alert('Payment verification failed. Please check your order status or contact support. If payment was successful, your order will be processed.');
            navigate(`/order-failure?orderId=${orderId}&reason=payment_verification_failed`);
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
          navigate(`/order-failure?orderId=${orderId}&reason=payment_cancelled`);
        }
      }
    };

    if (paymentMethod === 'upi') {
      options.method = {
        upi: true
      };
    }

    const razorpay = new window.Razorpay(options);
    razorpay.on('payment.failed', function(response) {
      navigate(`/order-failure?orderId=${orderId}&reason=${encodeURIComponent(response.error.description || 'payment_failed')}`);
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

    if (!validateForm()) {
      const firstError = document.querySelector('.error-message');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsProcessing(true);

    try {
      const shippingAddress = `${sanitizeInput(formData.firstName)} ${sanitizeInput(formData.lastName)}\n${sanitizeInput(formData.address)}\n${sanitizeInput(formData.city)}, ${sanitizeInput(formData.state)} ${sanitizeInput(formData.zipCode)}\nPhone: ${sanitizeInput(formData.phone)}`;

      const orderResponse = await orderService.createOrder(shippingAddress);
      const orderId = orderResponse.id;

      if (paymentMethod === 'cod') {
        clearCart();
        navigate(`/order-success?orderId=${orderId}&paymentMethod=COD`);
      } else if (paymentMethod === 'card' || paymentMethod === 'upi') {
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
      const errorMessage = error.response?.data?.message || error.message || 'Failed to process order. Please try again.';
      alert(errorMessage);
      if (error.response?.status !== 409) {
        navigate(`/order-failure?reason=${encodeURIComponent(errorMessage)}`);
      }
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
        <div className="checkout-forms">
          <form id="checkout-form" onSubmit={handleSubmit} noValidate>
            
            <div className="checkout-section">
              <h2 className="section-title">1. Contact Information</h2>
              <div className="form-group full-width">
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  name="email"
                  className={`form-input ${errors.email ? 'input-error' : ''}`}
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  autoComplete="email"
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>
            </div>

            <div className="checkout-section">
              <h2 className="section-title">2. Shipping Address</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input 
                    type="text" 
                    name="firstName"
                    className={`form-input ${errors.firstName ? 'input-error' : ''}`}
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    autoComplete="given-name"
                    maxLength={50}
                  />
                  {errors.firstName && <span className="error-message">{errors.firstName}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input 
                    type="text" 
                    name="lastName"
                    className={`form-input ${errors.lastName ? 'input-error' : ''}`}
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    autoComplete="family-name"
                    maxLength={50}
                  />
                  {errors.lastName && <span className="error-message">{errors.lastName}</span>}
                </div>
                <div className="form-group full-width">
                  <label className="form-label">Address</label>
                  <input 
                    type="text" 
                    name="address"
                    className={`form-input ${errors.address ? 'input-error' : ''}`}
                    placeholder="Street address, apartment, etc."
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    autoComplete="street-address"
                    maxLength={200}
                  />
                  {errors.address && <span className="error-message">{errors.address}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input 
                    type="text" 
                    name="city"
                    className={`form-input ${errors.city ? 'input-error' : ''}`}
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    autoComplete="address-level2"
                    maxLength={50}
                  />
                  {errors.city && <span className="error-message">{errors.city}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Postal Code</label>
                  <input 
                    type="text" 
                    name="zipCode"
                    className={`form-input ${errors.zipCode ? 'input-error' : ''}`}
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    required
                    autoComplete="postal-code"
                    maxLength={6}
                    pattern="[0-9]{6}"
                  />
                  {errors.zipCode && <span className="error-message">{errors.zipCode}</span>}
                </div>
                <div className="form-group full-width">
                  <label className="form-label">Phone Number</label>
                  <input 
                    type="tel" 
                    name="phone"
                    className={`form-input ${errors.phone ? 'input-error' : ''}`}
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    autoComplete="tel"
                    maxLength={10}
                    pattern="[6-9][0-9]{9}"
                    placeholder="10-digit mobile number"
                  />
                  {errors.phone && <span className="error-message">{errors.phone}</span>}
                </div>
              </div>
            </div>

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

        <div className="order-summary-container">
          <div className="order-summary-card">
            <h3 className="summary-header">Order Summary</h3>
            
            <div className="cart-items-preview">
                {cart.map(item => {
                  const itemImage = item.image || item.imageUrl || '/placeholder-product.png';
                  const itemName = item.name || 'Product';
                  return (
                    <div className="mini-item" key={item.id || item.productId}>
                      <img 
                        src={itemImage} 
                        alt={itemName} 
                        className="mini-item-img"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/placeholder-product.png';
                        }}
                      />
                      <div className="mini-item-info">
                        <div className="mini-item-name">{itemName}</div>
                        <div className="mini-item-meta">
                          <span>Qty: {item.quantity}</span>
                          <span>Rs. {(Number(item.price) * item.quantity).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
