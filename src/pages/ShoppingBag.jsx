import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

import '../assets/styles/shopping-bag.css'; // Your CSS file

const ShoppingBag = () => {
  const navigate = useNavigate();
  const [shoppingBag, setShoppingBag] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Load bag data from localStorage on component mount
  useEffect(() => {
    const loadBagData = () => {
      const bagData = JSON.parse(localStorage.getItem('groomupShoppingBag')) || [];
      setShoppingBag(bagData);
      calculateTotals(bagData);
      setIsLoading(false);
    };

    loadBagData();
    
    // Listen for storage changes (in case bag is updated from other tabs/pages)
    const handleStorageChange = () => {
      loadBagData();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Calculate totals whenever bag changes
  useEffect(() => {
    calculateTotals(shoppingBag);
  }, [shoppingBag]);

  const calculateTotals = (bagItems) => {
   const subtotalCalc = bagItems.reduce(
  (sum, item) => sum + Number(item.price) * item.quantity,
  0
);
    const deliveryFeeCalc = subtotalCalc < 999 ? 148 : 0;
    const totalCalc = subtotalCalc + deliveryFeeCalc;
    
    setSubtotal(subtotalCalc);
    setDeliveryFee(deliveryFeeCalc);
    setTotal(totalCalc);
  };

  const updateQuantity = (itemId, change) => {
    const updatedBag = shoppingBag.map(item => {
      if (item.id === itemId) {
        const newQuantity = item.quantity + change;
        if (newQuantity <= 0) {
          return null; // Mark for removal
        }
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(item => item !== null); // Remove items with quantity 0 or less
    
    setShoppingBag(updatedBag);
    localStorage.setItem('groomupShoppingBag', JSON.stringify(updatedBag));
  };

  const removeItem = (itemId) => {
    const updatedBag = shoppingBag.filter(item => item.id !== itemId);
    setShoppingBag(updatedBag);
    localStorage.setItem('groomupShoppingBag', JSON.stringify(updatedBag));
  };

  const proceedToCheckout = () => {
    if (shoppingBag.length === 0) {
      alert('Your bag is empty. Add some items before proceeding to checkout.');
      return;
    }
    
    const userData = JSON.parse(localStorage.getItem('groomupUser'));
    if (!userData) {
      alert('Please sign in to proceed to checkout.');
      navigate('/login');
      return;
    }
    
    // In a real application, you would redirect to checkout page
    alert('Proceeding to checkout...');
    // navigate('/checkout');
  };

  const continueShopping = () => {
    navigate('/');
  };

  const renderEmptyBag = () => (
    <div className="empty-bag">
      <div className="empty-bag-icon">
        <i className="fas fa-shopping-bag"></i>
      </div>
      <h2 className="empty-bag-title">Your bag is empty</h2>
      <p className="empty-bag-message">Add some products to your bag to see them here.</p>
      <button className="continue-shopping-btn" onClick={continueShopping}>
        Continue Shopping
      </button>
    </div>
  );

  const renderBagItem = (item) => {
    // Extract numeric price
   const priceValue = Number(item.price);

    
    const attributesHTML = item.category === 'serum' || item.category === 'Serum' ? (
      <>
        <div className="item-attribute">Volume: <span>{item.volume || '60ml'}</span></div>
        <div className="item-attribute">Type: <span>{item.type || 'All Hair Types'}</span></div>
      </>
    ) : (
      <>
        <div className="item-attribute">Art no: <span>{item.artNo || 'N/A'}</span></div>
        <div className="item-attribute">Colour: <span>{item.color || 'N/A'}</span></div>
        <div className="item-attribute">Size: <span>{item.size || 'N/A'}</span></div>
      </>
    );

    return (
      
      <div className="bag-item" key={item.id} data-id={item.id}>
        <div className="item-image">
          <img src={item.image} alt={item.name} />
        </div>
        <div className="item-details">
          <div className="item-brand">{item.brand || 'GROOMUP'}</div>
          <div className="item-name">{item.name}</div>
          <div className="item-price">Rs. {(priceValue * item.quantity).toFixed(2)}</div>
          <div className="item-attributes">
            {attributesHTML}
          </div>
          <div className="quantity-controls">
            <button className="quantity-btn" onClick={() => updateQuantity(item.id, -1)}>-</button>
            <span className="quantity-value">{item.quantity}</span>
            <button className="quantity-btn" onClick={() => updateQuantity(item.id, 1)}>+</button>
          </div>
          <button className="remove-item" onClick={() => removeItem(item.id)}>Remove</button>
          <div className="item-total">Total: Rs. {(priceValue * item.quantity).toFixed(2)}</div>
        </div>
      </div>
    );
  };

  const renderBagContent = () => (
    <div className="bag-container">
      <div className="bag-items">
        {shoppingBag.map(renderBagItem)}
      </div>
      
      <div className="bag-summary">
        <h2 className="summary-title">ORDER SUMMARY</h2>
        
        <div className="summary-row">
          <span className="summary-label">Order value</span>
          <span className="summary-value">Rs. {subtotal.toFixed(2)}</span>
        </div>
        
        <div className="discount-section">
          <div className="discount-title">DISCOUNTS</div>
          <div className="summary-row">
            <span className="summary-label">Order value</span>
            <span className="summary-value">Rs. {subtotal.toFixed(2)}</span>
          </div>
        </div>
        
        <div className="summary-row">
          <span className="summary-label">Estimated delivery fee</span>
          <span className="summary-value">Rs. {deliveryFee.toFixed(2)}</span>
        </div>
        
        <div className="total-row">
          <span>TOTAL</span>
          <span>Rs. {total.toFixed(2)}</span>
        </div>
        
        <button className="checkout-btn" onClick={proceedToCheckout}>
          CONTINUE TO CHECKOUT
        </button>
        
        <div className="sign-in-prompt">
          <Link to="/login">SIGN IN</Link>
        </div>
        
        <div className="payment-methods">
          <div className="payment-method">VISA</div>
          <div className="payment-method">LIFT</div>
        </div>
        
        <div className="info-note">
          <p>Prices and delivery costs are not confirmed until you've reached the checkout.</p>
        </div>
        
        <div className="return-policy">
          <p>15 days free returns. <a href="#" onClick={(e) => e.preventDefault()}>Read more about return and refund policy</a>.</p>
        </div>
        
        <div className="customer-support">
          <p>Need help? Please contact <Link to="/contact">Customer Support</Link></p>
          <p>Customers would receive an SMS/WhatsApp notifications regarding deliveries on the registered phone number</p>
        </div>
        
        <div className="delivery-options">
          <p><strong>DELIVERY AND RETURN OPTIONS</strong></p>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="loading-overlay active">
        <div className="loading-logo">GROOMUP</div>
      </div>
    );
  }

  return (
    <>
      

       {/* 🔒 PAGE WRAPPER — VERY IMPORTANT */}
    <div className="shopping-bag-page">
      
      <section className="shopping-bag">
        <h1 className="page-title">SHOPPING BAG</h1>
        
        <div id="bag-content">
          {shoppingBag.length === 0 ? renderEmptyBag() : renderBagContent()}
        </div>
      </section>

      {/* Services Section - Inline since not a separate component */}
      <section className="services">
        <div className="services-container">
          <div className="service-item">
            <i className="fas fa-shipping-fast"></i>
            <h3>FREE SHIPPING</h3>
            <p>ON ALL ORDERS</p>
          </div>
          <div className="service-item">
            <i className="fas fa-clock"></i>
            <h3>ORDERS DISPATCHED</h3>
            <p>WITHIN 2-HOURS</p>
          </div>
          <div className="service-item">
            <i className="fas fa-users"></i>
            <h3>TRUSTED BY 2M+</h3>
            <p>HAPPY CUSTOMERS</p>
          </div>
        </div>
      </section>

      </div>

     
    </>
  );
};

export default ShoppingBag