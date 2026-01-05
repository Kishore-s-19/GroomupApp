import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
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

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
  const deliveryCost = subtotal >= 999 ? 0 : (deliveryMethod === 'express' ? 250 : 148);
  const total = subtotal + deliveryCost;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate API call
    setTimeout(() => {
      setIsProcessing(false);
      alert(`Order placed successfully! Order ID: #${Math.floor(Math.random() * 100000)}`);
      clearCart();
      navigate('/'); // Or navigate to an order confirmation page
    }, 2000);
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
                    <span className="option-price">{subtotal >= 999 ? 'FREE' : 'Rs. 148.00'}</span>
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

              {paymentMethod === 'card' && (
                <div className="card-details" style={{marginTop: '20px', padding: '20px', background: '#f8f9fa', borderRadius: '5px'}}>
                   <div className="form-group full-width">
                      <label className="form-label">Card Number</label>
                      <input type="text" className="form-input" placeholder="0000 0000 0000 0000" />
                   </div>
                   <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">Expiry Date</label>
                        <input type="text" className="form-input" placeholder="MM/YY" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">CVV</label>
                        <input type="text" className="form-input" placeholder="123" />
                      </div>
                   </div>
                   <div className="form-group full-width">
                      <label className="form-label">Cardholder Name</label>
                      <input type="text" className="form-input" placeholder="Name on card" />
                   </div>
                </div>
              )}

              {paymentMethod === 'upi' && (
                <div className="upi-details" style={{marginTop: '20px', padding: '20px', background: '#f8f9fa', borderRadius: '5px'}}>
                   <div className="form-group full-width">
                      <label className="form-label">UPI ID / VPA</label>
                      <input type="text" className="form-input" placeholder="username@oksbi" />
                      <p style={{fontSize: '12px', color: '#666', marginTop: '5px'}}>
                        Enter your UPI ID (e.g. mobile_number@upi). We will send a collect request to your UPI app.
                      </p>
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
              disabled={isProcessing}
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
