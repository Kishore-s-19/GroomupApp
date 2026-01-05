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

const Header = ({ variant = "default" }) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  

  // Check login status from localStorage
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("groomupUser"));
    setLoggedIn(!!user);
  }, []);

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
     if (!query.trim()) {
    setSearchResults([]);
    return;
    }

    setIsSearching(true);
    
    try {
      const results = await productService.searchProducts(query);
      setSearchResults(results.slice(0, 10)); // Limit to 10 results
    } catch (err) {
      console.error("Search error:", err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    performSearch(query);
  };

  // Handle search submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search results page or first result
      if (searchResults.length > 0) {
        navigate(`/product/${searchResults[0].id}`);
        setSearchOpen(false);
        setSearchQuery("");
      }
    }
  };

  // Handle clicking on a search result
  const handleResultClick = (productId) => {
    navigate(`/product/${productId}`);
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
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
                <div className="search-container" ref={searchRef}>
                  <FaSearch
                    className="icon"
                    onClick={() => setSearchOpen((prev) => !prev)}
                  />

                  <div
                    className={`search-bar ${
                      searchOpen ? "active" : ""
                    }`}
                  >
                    <form onSubmit={handleSearchSubmit} className="search-form">
                      <div className="search-input-wrapper">
                        <input
                          ref={inputRef}
                          type="text"
                          placeholder="Search products, brands, categories..."
                          className="search-input"
                          value={searchQuery}
                          onChange={handleSearchChange}
                        />
                        {searchQuery && (
                          <FaTimes
                            className="clear-search"
                            onClick={clearSearch}
                          />
                        )}
                      </div>
                      <button type="submit" className="search-submit">
                        <FaSearch />
                      </button>
                    </form>

                    {/* Search Results Dropdown */}
                    {searchOpen && (
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
                            {searchResults.map((product) => (
                              <div
                                key={product.id}
                                className="search-result-item"
                                onClick={() => handleResultClick(product.id)}
                              >
                                <div className="result-image">
                                  <img
                                    src={product.images[0]}
                                    alt={product.name}
                                  />
                                </div>
                                <div className="result-details">
                                  <div className="result-brand">
                                    {product.brand}
                                  </div>
                                  <div className="result-name">
                                    {product.name}
                                  </div>
                                  <div className="result-price">
                                    ₹{product.price}
                                  </div>
                                </div>
                              </div>
                            ))}
                            <div className="view-all-results">
                              <button onClick={() => {
                                navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
                                setSearchOpen(false);
                              }}>
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
                    )}
                  </div>
                </div>

                {/* USER */}
                <Link to="/profile">
                  {loggedIn ? (
                    <FaUserCheck className="icon logged-in" />
                  ) : (
                    <FaUser className="icon" />
                  )}
                </Link>

                {/* CART */}
                <Link to="/cart">
                  <FaShoppingBag className="icon" />
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