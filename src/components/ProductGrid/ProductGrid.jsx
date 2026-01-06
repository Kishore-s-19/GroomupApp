import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { productService } from "../../services/api";
import "../../assets/styles/homepage.css";
import "../../assets/styles/product-grid.css";

const CATEGORY_LABELS = {
  all: "All Products",
  tshirts: "T-Shirts",
  shirts: "Shirts",
  bottoms: "Bottoms",
  serum: "Serum",
  accessories: "Accessories",
};

const ProductGrid = ({
  selectedCategory,
  onCategoryChange,
  categoryChangeSource,
}) => {
  const [category, setCategory] = useState(selectedCategory ?? "all");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const showLoadingTransition =
    loading && (products.length === 0 || categoryChangeSource !== "hero");

  useEffect(() => {
    if (!selectedCategory) return;
    if (selectedCategory === category) return;
    setCategory(selectedCategory);
  }, [selectedCategory, category]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = category === 'all' ? {} : { category };
        const data = await productService.getAllProducts(params);
        setProducts(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Failed to load products. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category]);

  const handleCategoryChange = (nextCategory) => {
    setCategory(nextCategory);
    if (typeof onCategoryChange === "function") {
      onCategoryChange(nextCategory);
    }
  };

  const goToProductDetail = (product) => {
    navigate(`/product/${product.id}`);
  };

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <section className="product-grid-wrapper" id="product-grid">
      <div className="section-header">
        <div className="breadcrumb">
          <span>Home</span> &gt; <span>Collection</span> &gt;{" "}
          <span className="active">
            {CATEGORY_LABELS[category]}
          </span>
        </div>

        <div className="section-title-right">
          <span className="section-title-text">
            {CATEGORY_LABELS[category]}
          </span>
          <span className="product-count">
            {loading ? "..." : products.length} products
          </span>
        </div>
      </div>

      <div className="product-filters">
        {Object.keys(CATEGORY_LABELS).map((key) => (
          <button
            key={key}
            className={`product-filter-btn ${
              category === key ? "active" : ""
            }`}
            onClick={() => handleCategoryChange(key)}
            disabled={loading}
          >
            {key === "all"
              ? "All"
              : CATEGORY_LABELS[key]}
          </button>
        ))}
      </div>

      {showLoadingTransition ? (
        <div className="product-grid-loading">
          <div className="loading-logo">GROOMUP</div>
        </div>
      ) : (
        <div className="product-grid">
          {products.length > 0 ? (
            products.map((product) => (
              <div
                className="product-card"
                key={product.id}
                onClick={() => goToProductDetail(product)}
              >
                <div className="product-image">
                  <img
                    src={product.images && product.images[0]}
                    alt={product.name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/300x400?text=Product+Image";
                    }}
                  />
                </div>

                <div className="product-info">
                  <h3 className="product-title">
                    {product.name}
                  </h3>
                  <div className="product-price">
                    <span className="current-price">
                      Rs. {product.price.toLocaleString()}.00
                    </span>
                    {product.originalPrice && (
                      <span className="original-price">
                        Rs. {product.originalPrice.toLocaleString()}.00
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-products">No products found in this category.</div>
          )}
        </div>
      )}
    </section>
  );
};

export default ProductGrid;
