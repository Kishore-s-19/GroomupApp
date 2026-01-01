import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import productDetails from "../../data/products";
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

const ProductGrid = () => {
  const [category, setCategory] = useState("all");
  const navigate = useNavigate();

  // Convert productDetails object to array
  const products = useMemo(() => {
    return Object.values(productDetails || {});
  }, []);

  const filteredProducts = useMemo(() => {
    if (category === "all") return products;

    return products.filter(
      (product) =>
        product.category &&
        product.category.toLowerCase() === category
    );
  }, [category, products]);

  const goToProductDetail = (product) => {
    navigate(`/product/${product.id}`);
  };

  return (
    <section className="product-grid-wrapper">
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
            {filteredProducts.length} products
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
            onClick={() => setCategory(key)}
          >
            {key === "all"
              ? "All"
              : CATEGORY_LABELS[key]}
          </button>
        ))}
      </div>

      <div className="product-grid">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
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
                <div className="product-brand">
                  {product.brand}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-products">
            <p>No products found in this category.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductGrid;