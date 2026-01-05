import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { FiHome, FiSearch, FiUser, FiUserCheck, FiShoppingBag, FiX } from "react-icons/fi";
import "./BottomNav.css";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../contexts/AuthContext";
import { productService } from "../../services/api";

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart } = useCart();
  const { isAuthenticated } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    if (searchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchOpen]);

  const performSearch = async (q) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const r = await productService.searchProducts(q);
      setResults(r.slice(0, 8));
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const onQueryChange = (e) => {
    const q = e.target.value;
    setQuery(q);
    performSearch(q);
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setQuery("");
    setResults([]);
  };

  const commitSearchHistory = (term) => {
    const hist = JSON.parse(localStorage.getItem("groomupSearchHistory")) || [];
    const next = [term, ...hist.filter((t) => t !== term)].slice(0, 6);
    localStorage.setItem("groomupSearchHistory", JSON.stringify(next));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    commitSearchHistory(query.trim());
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    closeSearch();
  };

  const history = JSON.parse(localStorage.getItem("groomupSearchHistory")) || [];

  return (
    <>
      <nav className="bottom-nav">
        <Link to="/" className={`bn-item ${isActive("/") ? "active" : ""}`} aria-label="Home">
          <FiHome />
        </Link>

        <button className="bn-item bn-button" onClick={() => setSearchOpen(true)} aria-label="Search">
          <FiSearch />
        </button>

        <Link to="/profile" className={`bn-item ${isActive("/profile") ? "active" : ""}`} aria-label="Profile">
          {isAuthenticated ? <FiUserCheck /> : <FiUser />}
        </Link>

        <Link to="/cart" className={`bn-item ${isActive("/cart") ? "active" : ""}`} aria-label="Bag">
          <div className="bn-cart">
            <FiShoppingBag />
            {cart.length > 0 && <span className="bn-badge">{cart.length}</span>}
          </div>
        </Link>
      </nav>

      {searchOpen && (
        <div className="mobile-search-overlay" onClick={closeSearch}>
          <div className="mobile-search-sheet" onClick={(e) => e.stopPropagation()}>
            <form className="mobile-search-bar" onSubmit={onSubmit}>
              <FiSearch className="ms-icon" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search"
                value={query}
                onChange={onQueryChange}
                className="ms-input"
              />
              <button type="button" className="ms-close" onClick={closeSearch}>
                <FiX />
              </button>
            </form>

            {isLoading ? (
              <div className="ms-loading">Searching...</div>
            ) : query.trim() ? (
              <div className="ms-results">
                {results.length === 0 ? (
                  <div className="ms-empty">No results</div>
                ) : (
                  results.map((p) => (
                    <div
                      key={p.id}
                      className="ms-result-item"
                      onClick={() => {
                        commitSearchHistory(query.trim());
                        navigate(`/product/${p.id}`);
                        closeSearch();
                      }}
                    >
                      <img src={p.images?.[0]} alt={p.name} />
                      <div className="ms-result-info">
                        <div className="ms-name">{p.name}</div>
                        <div className="ms-price">₹{Number(p.price).toLocaleString()}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="ms-suggestions">
                {history.length > 0 && (
                  <div className="ms-section">
                    <div className="ms-section-header">
                      <span>SEARCH HISTORY</span>
                      <button
                        className="ms-clear"
                        onClick={() => {
                          localStorage.removeItem("groomupSearchHistory");
                          navigate(0);
                        }}
                      >
                        CLEAR
                      </button>
                    </div>
                    <div className="ms-chips">
                      {history.map((h, i) => (
                        <button
                          key={i}
                          className="ms-chip"
                          onClick={() => {
                            setQuery(h);
                            performSearch(h);
                          }}
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="ms-section">
                  <div className="ms-section-header">
                    <span>POPULAR SEARCHES</span>
                  </div>
                  <div className="ms-chips">
                    {["T-Shirts", "Serum", "Denim", "Oversized", "Black"].map((t) => (
                      <button
                        key={t}
                        className="ms-chip"
                        onClick={() => {
                          setQuery(t);
                          performSearch(t);
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default BottomNav;
