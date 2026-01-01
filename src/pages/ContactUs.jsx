import React, { useEffect } from "react";
import "../assets/styles/contactus.css";
import "../assets/styles/trackorder.css";

const ContactUs = () => {

  useEffect(() => {
    const scrollBtn = document.getElementById("scrollToTopBtn");

    const onScroll = () => {
      if (window.scrollY > 100) {
        scrollBtn.style.display = "flex";
      } else {
        scrollBtn.style.display = "none";
      }
    };

    window.addEventListener("scroll", onScroll);

    scrollBtn?.addEventListener("click", () =>
      window.scrollTo({ top: 0, behavior: "smooth" })
    );

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div className="contact-us-page">

      {/* ===== MINIMAL HEADER (EXACT TRACK ORDER COPY) ===== */}
      

      {/* CONTACT HERO */}
      <section className="contact-hero">
        <h1>Contact Us</h1>
        <p>We're here to help you with any questions or concerns</p>
      </section>

      {/* CONTACT CONTENT */}
      <section className="contact-container">
        <h2 className="contact-title">GET IN TOUCH WITH US</h2>

        <div className="contact-content">
          <div className="contact-methods">

            <div className="contact-card">
              <div className="contact-icon">
                <i className="fas fa-comments"></i>
              </div>
              <h3>Chat Now</h3>
              <p>Chat with us for instant support and quick answers.</p>
              <div className="contact-hours">
                <i className="fas fa-clock"></i> Mon - Sat : 10:30 am - 06:00 pm
              </div>
              <a href="#" className="contact-btn">Start Chat</a>
            </div>

            <div className="contact-card">
              <div className="contact-icon">
                <i className="fas fa-envelope"></i>
              </div>
              <h3>Drop an Email</h3>
              <p>Send us an email and we’ll get back to you.</p>
              <a href="mailto:support@groomup.in" className="contact-btn">
                support@groomup.in
              </a>
            </div>

            <div className="contact-card">
              <div className="contact-icon">
                <i className="fas fa-phone"></i>
              </div>
              <h3>Call Us</h3>
              <p>Speak directly with our support team.</p>
              <div className="contact-hours">
                <i className="fas fa-clock"></i> Mon - Sat : 10:30 am - 06:00 pm
              </div>
              <a href="tel:+919696333000" className="contact-btn">
                +91 9696333000
              </a>
            </div>
          </div>

          <div className="contact-card">
            <div className="contact-icon">
              <i className="fas fa-tag"></i>
            </div>
            <h3>Get Coupons & Offers</h3>
            <p>
              We make great emails (and even better offers).
              You can unsubscribe anytime.
            </p>

            <div className="contact-divider"></div>

            <form className="newsletter-form">
              <input type="email" placeholder="Enter your email address" required />
              <button type="submit">Subscribe</button>
            </form>
          </div>
        </div>
      </section>

      {/* SERVICES */}
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

      <button id="scrollToTopBtn">↑</button>
    </div>
  );
};

export default ContactUs;
