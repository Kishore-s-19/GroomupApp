import React, { useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { getOrderItemPlaceholder } from '../utils/imageUtils';
import '../assets/styles/shopping-bag.css'; // Your CSS file

const ShoppingBag = () => {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeFromCart, loading: cartLoading } = useCart();
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  }, [cart]);
  const deliveryFee = useMemo(() => (subtotal < 999 ? 148 : 0), [subtotal]);
  const total = useMemo(() => subtotal + deliveryFee, [subtotal, deliveryFee]);

  // No effects needed for totals; all derived via useMemo

  // Handlers handled inline in render; removed unused functions

  const proceedToCheckout = () => {
    if (cart.length === 0) {
      alert('Your bag is empty. Add some items before proceeding to checkout.');
      return;
    }
    
    const userData = JSON.parse(localStorage.getItem('groomupUser'));
    if (!userData) {
      alert('Please sign in to proceed to checkout.');
      navigate('/login');
      return;
    }
    
    // Navigate to checkout page
    navigate('/checkout');
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
    const priceValue = Number(item.price || 0);
    
    // Check if product is a serum
    const isSerum = item.category && (
      item.category.toLowerCase() === 'serum' || 
      item.category.toLowerCase().includes('serum')
    );

    // Get product image with fallback
    const productImage = item.image || item.imageUrl || getOrderItemPlaceholder();

    const attributesHTML = isSerum ? (
      <>
        <div className="item-attribute">Volume: <span>{item.volume || item.size || '30ml'}</span></div>
        <div className="item-attribute">Type: <span>All Skin Types</span></div>
      </>
    ) : (
      <>
        <div className="item-attribute">Art no: <span>{item.artNo || 'N/A'}</span></div>
        <div className="item-attribute">Colour: <span>{item.color || 'N/A'}</span></div>
        <div className="item-attribute">Size: <span>{item.size || 'N/A'}</span></div>
      </>
    );

    return (
      <div className="bag-item" key={item.id || item.productId} data-id={item.id || item.productId}>
        <div className="item-image">
          <img 
            src={productImage} 
            alt={item.name || 'Product'} 
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = getOrderItemPlaceholder();
            }}
          />
        </div>
        <div className="item-details">
          <div className="item-brand">{item.brand || 'GROOMUP'}</div>
          <div className="item-name">{item.name || 'Unnamed Product'}</div>
          <div className="item-price">Rs. {(priceValue * (item.quantity || 1)).toFixed(2)}</div>
          <div className="item-attributes">
            {attributesHTML}
          </div>
          <div className="quantity-controls">
            <button className="quantity-btn" onClick={() => updateQuantity(item.id || item.productId, Number(item.quantity || 1) - 1)}>-</button>
            <span className="quantity-value">{item.quantity || 1}</span>
            <button className="quantity-btn" onClick={() => updateQuantity(item.id || item.productId, Number(item.quantity || 1) + 1)}>+</button>
          </div>
          <button className="remove-item" onClick={() => removeFromCart(item.id || item.productId)}>Remove</button>
          <div className="item-total">Total: Rs. {(priceValue * (item.quantity || 1)).toFixed(2)}</div>
        </div>
      </div>
    );
  };

  const renderBagContent = () => (
    <div className="bag-container">
      <div className="bag-items">
        {cart.map(renderBagItem)}
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

  if (cartLoading) {
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
          {cart.length === 0 ? renderEmptyBag() : renderBagContent()}
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
