import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../assets/styles/search-results.css";
import { productService } from "../services/api";

const SearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get("q") || "";
    setSearchQuery(query);

    if (query.trim()) {
      performSearch(query);
    } else {
      setSearchResults([]);
    }
  }, [location.search]);

  const performSearch = async (query) => {
    setIsLoading(true);
    try {
      const results = await productService.searchProducts(query);
      setSearchResults(results);
    } catch (err) {
      console.error("Search error:", err);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductClick = (productId) => {
    // Use the actual database ID directly (products start from 31)
    const idNum = Number(productId);
    const dbId = Number.isFinite(idNum) ? idNum : productId;
    navigate(`/product/${dbId}`);
  };

  return (
    <div className="search-results-page">
      <div className="search-results-container">
        <div className="search-header">
          <h1>Search Results</h1>
          {searchQuery && (
            <p className="search-query">
              Showing results for: <span>"{searchQuery}"</span>
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Searching products...</p>
          </div>
        ) : searchResults.length > 0 ? (
          <>
            <div className="results-count">
              {searchResults.length} product{searchResults.length !== 1 ? "s" : ""} found
            </div>
            
            <div className="results-grid">
              {searchResults.map((product) => (
                <div
                  key={product.id}
                  className="result-card"
                  onClick={() => handleProductClick(product.id)}
                >
                  <div className="result-image">
                    <img src={product.images[0]} alt={product.name} />
                  </div>
                  <div className="result-info">
                    <div className="result-brand">{product.brand}</div>
                    <div className="result-name">{product.name}</div>
                    <div className="result-category">{product.category}</div>
                    <div className="result-price">₹{product.price.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : searchQuery ? (
          <div className="no-results">
            <div className="no-results-icon">
              <i className="fas fa-search"></i>
            </div>
            <h2>No products found</h2>
            <p>We couldn't find any products matching "{searchQuery}"</p>
            <div className="suggestions">
              <p>Suggestions:</p>
              <ul>
                <li>Check your spelling</li>
                <li>Try more general keywords</li>
                <li>Browse by category instead</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="empty-search">
            <p>Enter a search term to find products</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
