import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { productService } from "../../services/api";
import { getProductPlaceholder } from "../../utils/imageUtils";
import { saveScrollPosition, restoreScrollPosition, hasScrollPosition } from "../../utils/scrollRestore";
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
}) => {
  const [category, setCategory] = useState(selectedCategory ?? "all");
  const [allProducts, setAllProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const showLoadingTransition = loading && allProducts.length === 0;

  useEffect(() => {
    if (!selectedCategory) return;
    if (selectedCategory === category) return;
    setCategory(selectedCategory);
  }, [selectedCategory, category]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const data = await productService.getAllProducts();
        setAllProducts(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Failed to load products. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const normalize = (s) =>
      String(s ?? "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

    const detectCategory = (raw) => {
      const pc = normalize(raw);
      if (!pc) return null;
      if (pc.includes("tshirt") || pc.includes("tee")) return "tshirts";
      if (pc.includes("shirt")) return "shirts";
      if (
        pc.includes("bottom") ||
        pc.includes("pant") ||
        pc.includes("trouser") ||
        pc.includes("jean")
      ) {
        return "bottoms";
      }
      if (pc.includes("serum")) return "serum";
      if (pc.includes("accessor")) return "accessories";
      return pc;
    };

    if (category === "all") {
      setProducts(allProducts);
    } else {
      const next = allProducts.filter((p) => {
        const detected = detectCategory(p?.category);
        if (!detected) return false;
        return detected === category;
      });
      setProducts(next);
    }

    if (!loading && allProducts.length > 0 && hasScrollPosition()) {
      restoreScrollPosition();
    }
  }, [category, allProducts, loading]);

  const handleCategoryChange = (nextCategory) => {
    setCategory(nextCategory);
    if (typeof onCategoryChange === "function") {
      onCategoryChange(nextCategory);
    }
  };

  const goToProductDetail = (product, index) => {
    const rawId = product?.id;
    const idNum = Number(rawId);
    const dbId = Number.isFinite(idNum) ? idNum : null;
    
    if (dbId) {
      saveScrollPosition();
      navigate(`/product/${dbId}`);
    } else {
      console.warn("Product ID is invalid, cannot navigate to product detail");
    }
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
            disabled={loading && allProducts.length === 0}
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
            products.map((product, index) => (
              <div
                className="product-card"
                key={product.id ?? `${product.name ?? "product"}-${index}`}
                onClick={() => goToProductDetail(product, index)}
              >
                <div className="product-image">
                  <img
                    src={product.images && product.images[0]}
                    alt={product.name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = getProductPlaceholder();
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
