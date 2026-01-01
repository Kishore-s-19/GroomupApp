import "./Footer.css";
import {
  FaGooglePlay,
  FaApple,
} from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">

        {/* COMPANY */}
        <div className="footer-section">
          <h3>COMPANY</h3>
          <ul className="footer-links">
            <li><a href="#">About Us</a></li>
            <li><a href="#">Blog</a></li>
            <li><a href="#">Sitemap</a></li>
            <li><a href="#">Stores</a></li>
            <li><a href="#">Contact</a></li>
          </ul>
        </div>

        {/* HELP */}
        <div className="footer-section">
          <h3>NEED HELP FROM GROOMUP</h3>
          <ul className="footer-links">
            <li><a href="#">Returns & Exchange</a></li>
            <li><a href="#">Shipping Policy</a></li>
            <li><a href="#">Cancellation Policy</a></li>
            <li><a href="#">Exchange & Refund Policy</a></li>
          </ul>
        </div>

        {/* SUPPORT */}
        <div className="footer-section">
          <h3>SUPPORT</h3>
          <div className="contact-info">
            <p>support@groomup.in</p>
            <p>+91 9696333000</p>
            <p>Mon - Sat : 10:30 AM - 06:00 PM</p>
          </div>
        </div>

        {/* OFFICE */}
        <div className="footer-section">
          <h3>REGISTERED OFFICE ADDRESS</h3>
          <div className="contact-info">
            <p>Groomup Apparels Pvt Ltd</p>
            <p>
              Lotus Corporate Park Wing 002 - 1502,<br />
              Ram Mandir Lane, off Western Express Highway,<br />
              Goregaon, Mumbai - 400063
            </p>
          </div>
        </div>

        {/* APP + PAYMENTS */}
        <div className="footer-section">
          <h3>Experience The Groomup App</h3>

          <div className="app-download">
            <a href="#" className="app-btn">
              <FaGooglePlay />
              <div>
                <small>GET IT ON</small>
                <div>Google Play</div>
              </div>
            </a>

            <a href="#" className="app-btn">
              <FaApple />
              <div>
                <small>Download on the</small>
                <div>App Store</div>
              </div>
            </a>
          </div>

          <h3 className="payment-title">100% Secure Payment</h3>

          <div className="payment-methods">
            <div className="payment-icon">VISA</div>
            <div className="payment-icon">PAY</div>
            <div className="payment-icon">UPI</div>
          </div>
        </div>

      </div>

      <div className="footer-bottom">
        © {new Date().getFullYear()} Groomup. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
