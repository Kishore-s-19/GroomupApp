import React, { useEffect } from "react";
import "./NewsletterPopup.css";

const NewsletterPopup = ({ email, onClose }) => {
  // Close on escape key press
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscapeKey);
    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [onClose]);

  // Close on outside click
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="popup-container" onClick={handleOverlayClick}>
      <div className="popup-content">
        <button className="popup-close" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
        
        <div className="popup-icon">
          <i className="fas fa-envelope-open-text"></i>
        </div>
        
        <h2 className="popup-title">Thanks for subscribing!</h2>
        
        <p className="popup-message">
          You've been successfully added to our newsletter list. 
          We'll send you exclusive coupons and offers at:
        </p>
        
        <p className="popup-email">{email}</p>
        
        <p className="popup-message">
          Look out for our emails with special discounts and early access to new collections.
        </p>
        
        <div className="popup-divider"></div>
        
        <div className="popup-footer">
          <div className="popup-company">
            <h4>FROM GROOMUP</h4>
            <p>Groomup Apparels Pvt Ltd</p>
            <p>Lotus Corporate Park, Mumbai</p>
          </div>
          
          <button className="popup-continue" onClick={onClose}>
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewsletterPopup;