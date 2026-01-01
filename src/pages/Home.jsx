import { useState } from "react";

import HeroSlider from "../components/HeroSlider/HeroSlider";
import ProductGrid from "../components/ProductGrid/ProductGrid";
import NewsletterPopup from "../components/NewsletterPopup/NewsletterPopup"; // Import the new component

// Styles
import "../assets/styles/homepage.css";

const Home = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [subscriberEmail, setSubscriberEmail] = useState("");

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    if (email) {
      setSubscriberEmail(email);
      setShowPopup(true);
      e.target.reset(); // Clear the form
    }
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  return (
    <>
    <div className="home-page">
      

      {/* HERO SLIDER */}
      <HeroSlider />

      {/* PRODUCTS / COLLECTIONS */}
      <ProductGrid />

      {/* SERVICES SECTION */}
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

      {/* NEWSLETTER */}
      <section className="newsletter">
        <h2>Get Coupons & Offers</h2>
        <p>
          We make great emails (and even better offers).  
          You can unsubscribe anytime.
        </p>

        <form
          className="newsletter-form"
          onSubmit={handleNewsletterSubmit}
        >
          <input
            type="email"
            name="email"
            placeholder="Enter your email address"
            required
          />
          <button type="submit">Subscribe</button>
        </form>
      </section>

     

      {/* NEWSLETTER POPUP */}
      {showPopup && (
        <NewsletterPopup
          email={subscriberEmail}
          onClose={closePopup}
        />
      )}
      </div>
    </>
  );
};

export default Home;