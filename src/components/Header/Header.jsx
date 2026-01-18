import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FaSearch,
  FaUser,
  FaUserCheck,
  FaShoppingBag,
  FaTimes,
} from "react-icons/fa";
import "./Header.css";
// Import product data for search
import { productService } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { useCart } from "../../contexts/CartContext";

const Header = ({ variant = "default" }) => {
  const { isAuthenticated } = useAuth();
  const { cart } = useCart();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const searchRequestIdRef = useRef(0);
  const searchDebounceRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus input when search opens
  useEffect(() => {
    if (searchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchOpen]);

  // Perform search
  const performSearch = async (query) => {
    const requestId = ++searchRequestIdRef.current;
    const q = String(query ?? "").trim();
    if (!q) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    try {
      const results = await productService.searchProducts(q);
      if (requestId !== searchRequestIdRef.current) return;
      setSearchResults(results.slice(0, 10)); // Limit to 10 results
    } catch (err) {
      console.error("Search error:", err);
      setSearchResults([]);
    } finally {
      if (requestId === searchRequestIdRef.current) {
        setIsSearching(false);
      }
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    const q = String(query ?? "").trim();

    if (!q) {
      searchRequestIdRef.current += 1;
      setSearchResults([]);
      setIsSearching(false);
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      return;
    }

    setIsSearching(true);
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(() => {
      performSearch(query);
    }, 180);
  };

  // Handle search submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) {
      if (inputRef.current) inputRef.current.focus();
      return;
    }

    navigate(`/search?q=${encodeURIComponent(q)}`);
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  // Handle clicking on a search result
  const handleResultClick = (productId) => {
    // Use the actual database ID directly (products start from 31)
    const idNum = Number(productId);
    const dbId = Number.isFinite(idNum) ? idNum : productId;
    navigate(`/product/${dbId}`);
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  // Clear search
  const clearSearch = () => {
    searchRequestIdRef.current += 1;
    setSearchQuery("");
    setSearchResults([]);
    setIsSearching(false);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (inputRef.current) inputRef.current.focus();
  };

  // Check if we're on track order page
  const isTrackOrderPage = location.pathname === "/track-order";

  return (
    <>
      {/* TOP BANNER - Only show on homepage */}
      {location.pathname === "/" && (
        <div className="top-banner">
          <div className="top-banner-content">
            <span>
              Exclusive! 10% OFF only on App orders —{" "}
              <a href="#">Download Now</a>
            </span>
            <span>
              Exclusive! 10% OFF only on App orders —{" "}
              <a href="#">Download Now</a>
            </span>
            <span>
              Exclusive! 10% OFF only on App orders —{" "}
              <a href="#">Download Now</a>
            </span>
          </div>
        </div>
      )}

      {/* MAIN HEADER */}
      <header className={`main-header header-${variant}`}>
        <div className="header-top">
          <div className="logo" onClick={() => navigate("/")}>
            GROOMUP
          </div>

          <div className="header-actions">
            <Link
              to="/track-order"
              style={
                isTrackOrderPage
                  ? { color: "var(--primary-color)", fontWeight: "600" }
                  : {}
              }
            >
              Track Order
            </Link>
            <Link to="/store-locator">Store Location</Link>
            <Link to="/contact">Contact Us</Link>
          </div>
        </div>

        {/* NAV CONTAINER (hidden on track order page) */}
        {!isTrackOrderPage && (
          <div className="nav-container">
            <nav className="main-nav">
              {/* NAV LINKS */}
              <div className="nav-links">
                <Link to="/">Collections</Link>
                <Link to="/category/tshirts">T-Shirts</Link>
                <Link to="/category/shirts">Shirts</Link>
                <Link to="/category/bottoms">Bottoms</Link>
                <Link to="/category/serum">Serum</Link>
                <Link to="/category/accessories">Accessories</Link>
              </div>

              {/* NAV ACTIONS */}
              <div className="nav-actions">
                {/* SEARCH */}
                <div
                  className={`nav-search ${searchOpen ? "open" : ""}`}
                  ref={searchRef}
                >
                  <form
                    onSubmit={handleSearchSubmit}
                    className={`nav-search-form ${searchOpen ? "open" : ""}`}
                  >
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="Search"
                      className="nav-search-input"
                      value={searchQuery}
                      onChange={handleSearchChange}
                      onFocus={() => setSearchOpen(true)}
                    />

                    {searchQuery && (
                      <button
                        type="button"
                        className="nav-search-clear"
                        onClick={clearSearch}
                        aria-label="Clear search"
                      >
                        <FaTimes />
                      </button>
                    )}

                    <button
                      type={searchOpen ? "submit" : "button"}
                      className="nav-search-button"
                      onClick={() => {
                        if (!searchOpen) setSearchOpen(true);
                      }}
                      aria-label="Search"
                    >
                      <FaSearch />
                    </button>
                  </form>

                  {searchOpen && searchQuery.trim() && (
                    <div className="nav-search-dropdown">
                      <div className="search-results">
                        {isSearching ? (
                          <div className="search-loading">
                            <div className="spinner"></div>
                            <span>Searching...</span>
                          </div>
                        ) : searchQuery.trim() && searchResults.length > 0 ? (
                          <>
                            <div className="results-header">
                              <span className="results-count">
                                {searchResults.length} results found
                              </span>
                            </div>
                            {searchResults.map((product) => {
                              const productImage = 
                                (product.images && product.images.length > 0 && product.images[0]) ||
                                product.imageUrl ||
                                "https://via.placeholder.com/120x90?text=Product";
                              
                              return (
                                <div
                                  key={product.id}
                                  className="search-result-item"
                                  onClick={() => handleResultClick(product.id)}
                                >
                                  <div className="result-image">
                                    <img
                                      src={productImage}
                                      alt={product.name || "Product"}
                                      loading="lazy"
                                      onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.src =
                                          "https://via.placeholder.com/120x90?text=Product";
                                      }}
                                    />
                                  </div>
                                  <div className="result-details">
                                    <div className="result-name">
                                      {product.name || "Unnamed Product"}
                                    </div>
                                    {product.price && (
                                      <div className="result-price">
                                        ₹{typeof product.price === "number" 
                                          ? product.price.toLocaleString("en-IN") 
                                          : Number(product.price).toLocaleString("en-IN")}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                            <div className="view-all-results">
                              <button
                                onClick={() => {
                                  navigate(
                                    `/search?q=${encodeURIComponent(
                                      searchQuery
                                    )}`
                                  );
                                  setSearchOpen(false);
                                  setSearchQuery("");
                                  setSearchResults([]);
                                }}
                              >
                                View all results for "{searchQuery}"
                              </button>
                            </div>
                          </>
                        ) : searchQuery.trim() ? (
                          <div className="no-results">
                            <span>No products found for "{searchQuery}"</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>

                {/* USER */}
                <Link to="/profile">
                  {isAuthenticated ? (
                    <FaUserCheck className="icon logged-in" />
                  ) : (
                    <FaUser className="icon" />
                  )}
                </Link>

                {/* CART */}
                <Link to="/cart" className="cart-icon-wrapper">
                  <FaShoppingBag className="icon" />
                  {cart.length > 0 && (
                    <span className="cart-badge">{cart.length}</span>
                  )}
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  );
};

export default Header;
