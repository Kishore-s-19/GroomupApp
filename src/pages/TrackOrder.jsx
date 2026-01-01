import React, { useState, useEffect } from "react";

import "../assets/styles/trackorder.css";

const TrackOrder = () => {
  const [searchType, setSearchType] = useState("order");
  const [orderInput, setOrderInput] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const searchTypeBtns = [
    { type: "order", label: "Order ID/No", placeholder: "Enter your order ID or number" },
    { type: "tracking", label: "Tracking ID/AWB", placeholder: "Enter your tracking ID or AWB number" }
  ];

  const handleSearchTypeChange = (type) => {
    setSearchType(type);
    setOrderInput("");
    setShowResult(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!orderInput.trim()) {
      setShowResult(true);
      return;
    }
    
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setShowResult(true);
    }, 1000);
  };

  return (
    <div className="track-order-page">
     
      
      {/* Track Order Hero Section */}
      <section className="track-order-hero">
        <h1>Track Your Order</h1>
        <p>Check current status of your shipment</p>
      </section>

      {/* Track Order Content */}
      <section className="track-order-container">
        <h2 className="track-order-title">TRACK YOUR ORDER</h2>
        
        <div className="track-order-card">
          <div className="search-type-selector">
            {searchTypeBtns.map((btn) => (
              <button
                key={btn.type}
                className={`search-type-btn ${searchType === btn.type ? 'active' : ''}`}
                onClick={() => handleSearchTypeChange(btn.type)}
                type="button"
              >
                {btn.label}
              </button>
            ))}
          </div>

          <form className="track-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="order-input">
                {searchType === "order" ? "Enter Your Order ID/No" : "Enter Your Tracking ID/AWB"}
              </label>
              <input
                type="text"
                id="order-input"
                className="track-input"
                placeholder={searchTypeBtns.find(b => b.type === searchType)?.placeholder}
                value={orderInput}
                onChange={(e) => setOrderInput(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="track-btn" disabled={loading}>
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                  Tracking...
                </>
              ) : (
                "Track Your Order"
              )}
            </button>
          </form>

          {showResult && (
            <div className="track-result error">
              <div className="result-icon">
                <i className="fas fa-exclamation-circle"></i>
              </div>
              <h3 className="result-title">Order Not Found</h3>
              <p className="result-message">
                The order/shipment you're trying to track has not been shipped yet or the order number entered is incorrect.
              </p>
            </div>
          )}

          <div className="support-info">
            <h3>Need Help?</h3>
            <p>Our customer support team is here to help you with any questions about your order.</p>
            <div className="support-contact">
              <div className="contact-item">
                <i className="fas fa-envelope"></i>
                <span>support@groomup.in</span>
              </div>
              <div className="contact-item">
                <i className="fas fa-phone"></i>
                <span>+91 9696333000 (10:30 am to 06:00 pm Mon to Sat)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
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
  );
};

export default TrackOrder;