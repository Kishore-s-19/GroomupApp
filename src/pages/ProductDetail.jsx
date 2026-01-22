import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { productService } from "../services/api";
import { useCart } from "../contexts/CartContext";
import { getProductPlaceholder } from "../utils/imageUtils";
import "../assets/styles/product-detail.css";

const ProductDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [accordionActive, setAccordionActive] = useState([true, false, false, false]);

  // Fix scroll position on mount and when productId changes
  useEffect(() => {
    // Scroll to top immediately when component mounts or productId changes
    window.scrollTo(0, 0);
    
    // Also ensure scroll after a small delay to handle any layout shifts
    const scrollTimer = setTimeout(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "instant"
      });
    }, 100);

    return () => clearTimeout(scrollTimer);
  }, [productId]);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        // Use the route ID directly as the database ID (products start from 31)
        const rawId = productId;
        const idNum = Number(rawId);
        const apiId = Number.isFinite(idNum) ? idNum : rawId;

        const data = await productService.getProductById(apiId);
        setProduct(data);
        
        // Check if product is a serum
        const isSerum = data.category && (
          data.category.toLowerCase() === 'serum' || 
          data.category.toLowerCase().includes('serum')
        );

        // Initialize size selection with safe defaults
        const safeSizes = Array.isArray(data.sizes) && data.sizes.length > 0 
          ? data.sizes 
          : (isSerum ? ["30ml", "60ml"] : ["S", "M", "L", "XL"]);
        
        if (safeSizes.length > 0) {
          if (isSerum) {
            // For serum, default to 30ml if available, otherwise first size
            if (safeSizes.includes("30ml")) {
              setSelectedSize("30ml");
            } else {
              setSelectedSize(safeSizes[0]);
            }
          } else {
            // For clothing, use existing logic
            if (safeSizes.includes("One Size")) {
              setSelectedSize("One Size");
            } else if (safeSizes.includes("M")) {
              setSelectedSize("M");
            } else if (safeSizes.includes("30")) {
              setSelectedSize("30");
            } else if (safeSizes.includes("32")) {
              setSelectedSize("32");
            } else if (safeSizes.includes("S")) {
              setSelectedSize("S");
            } else {
              setSelectedSize(safeSizes[0]);
            }
          }
        } else {
          setSelectedSize(isSerum ? "30ml" : "M");
        }
        setError(null);
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("Product not found");
        // Optional: navigate back or show error
        // navigate("/"); 
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, navigate]);

  const handleAddToCart = async () => {
    if (!product) return;
    
    const selectedColorData = product.colors && product.colors[selectedColor];
    const colorName = selectedColorData ? selectedColorData.name : (product.colors && product.colors[0] ? product.colors[0].name : "Default");
    
    const productImages = Array.isArray(product.images) && product.images.length > 0 
      ? product.images 
      : (product.imageUrl ? [product.imageUrl] : []);
    
    const productWithImages = {
      ...product,
      images: productImages,
      image: productImages[0] || product.imageUrl || '',
      imageUrl: product.imageUrl || productImages[0] || '',
      brand: product.brand || 'GROOMUP',
      category: product.category || '',
      artNo: product.artNo || product.id?.toString() || '',
    };
    
    const result = await addToCart(productWithImages, colorName, selectedSize, 1);
    
    if (result.success) {
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000);
    } else {
      alert("Failed to add to cart");
    }
  };

  const toggleAccordion = (index) => {
    const newAccordion = [...accordionActive];
    newAccordion[index] = !newAccordion[index];
    setAccordionActive(newAccordion);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-logo">GROOMUP</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="error-container" style={{ padding: "50px", textAlign: "center" }}>
        <h2>Product Not Found</h2>
        <button onClick={() => navigate("/")} className="back-btn">Back to Home</button>
      </div>
    );
  }

  // Check if product is a serum
  const isSerum = product.category && (
    product.category.toLowerCase() === 'serum' || 
    product.category.toLowerCase().includes('serum')
  );

  // Ensure all required fields have safe defaults
  const safeProduct = {
    ...product,
    images: Array.isArray(product.images) && product.images.length > 0 
      ? product.images 
      : (product.imageUrl ? [product.imageUrl] : []),
    colors: Array.isArray(product.colors) && product.colors.length > 0 
      ? product.colors 
      : [{ name: "Default", value: "default" }],
    // For serum products, use ml sizes; otherwise use clothing sizes
    sizes: isSerum 
      ? (Array.isArray(product.sizes) && product.sizes.length > 0 
          ? product.sizes 
          : ["30ml", "60ml"])
      : (Array.isArray(product.sizes) && product.sizes.length > 0 
          ? product.sizes 
          : ["S", "M", "L", "XL"]),
    brand: product.brand || "GROOMUP",
    originalPrice: product.originalPrice || null,
    fitNote: product.fitNote || "",
    materials: product.materials || "Product materials information not available.",
    careGuide: product.careGuide || "Follow standard care instructions.",
    deliveryInfo: product.deliveryInfo || "Free shipping on orders above Rs. 999. Standard delivery in 3-5 business days.",
    reviews: typeof product.reviews === "number" ? product.reviews : 0,
    rating: typeof product.rating === "number" ? product.rating : 0,
    fit: product.fit && typeof product.fit === "object"
      ? product.fit
      : { trueToSize: 50, length: 50, width: 50 },
  };

  const categoryName = safeProduct.category ? (safeProduct.category.charAt(0).toUpperCase() + safeProduct.category.slice(1)) : "Product";
  const mainImage = safeProduct.images[selectedImage] || safeProduct.images[0] || getProductPlaceholder();
  const rating = safeProduct.rating;
  const reviews = safeProduct.reviews;
  const fit = safeProduct.fit;
  const popupImage = safeProduct.images[0] || mainImage;
  const popupColorName = safeProduct.colors[selectedColor]?.name || safeProduct.colors[0]?.name || "Default";

  return (
    <div className="product-detail-page">
      <div className="breadcrumb">
        <a onClick={() => navigate("/")}>Home</a> &gt; 
        <a onClick={() => navigate("/collection")}>Collection</a> &gt; 
        <a onClick={() => navigate(`/category/${safeProduct.category}`)}>
          {categoryName}
        </a> &gt; 
        <span>{safeProduct.name}</span>
      </div>

      <div className="product-container">
        <div className="product-gallery">
          <div className="main-image">
            <img src={mainImage} alt={safeProduct.name} />
          </div>
          <div className="thumbnail-container">
            {safeProduct.images && safeProduct.images.length > 0 ? (
              safeProduct.images.map((image, index) => (
                <div 
                  key={index}
                  className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                  onClick={() => setSelectedImage(index)}
                >
                  <img src={image} alt={`${safeProduct.name} view ${index + 1}`} />
                </div>
              ))
            ) : (
              <div className="thumbnail active">
                <img src={mainImage} alt={safeProduct.name} />
              </div>
            )}
          </div>
        </div>

        <div className="product-info">
          <div className="brand-name">{safeProduct.brand}</div>
          <h1 className="product-title">{safeProduct.name}</h1>
            <div className="product-price">
              <span className="current-price">Rs. {Number(safeProduct.price).toLocaleString()}.00</span>
              {safeProduct.originalPrice && (
                <span className="original-price">Rs. {Number(safeProduct.originalPrice).toLocaleString()}.00</span>
              )}
            </div>
            <p className="mrp-text">MRP Inclusive of all taxes</p>

            {safeProduct.stockQuantity <= 0 && (
              <div className="out-of-stock-notice">
                <i className="fas fa-exclamation-circle"></i>
                Currently Out of Stock
              </div>
            )}

          {/* Only show color selection for non-serum products */}
          {!isSerum && safeProduct.colors && safeProduct.colors.length > 0 && (
            <div className="product-color">
              <span className="color-label">COLOUR: {safeProduct.colors[selectedColor]?.name || safeProduct.colors[0]?.name || "Default"}</span>
              <div className="color-options">
                {safeProduct.colors.map((color, index) => (
                  <div 
                    key={index}
                    className={`color-option ${selectedColor === index ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedColor(index);
                      setSelectedImage(0);
                    }}
                  >
                    <div className={`color-sample ${color.value || 'default'}`}></div>
                    <span>{color.name || "Default"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="size-selection">
            <div className="size-header">
              <span className="size-label">{isSerum ? "SELECT VOLUME" : "SELECT SIZE"}</span>
              {!isSerum && <a className="size-guide">SIZE GUIDE</a>}
            </div>
            <div className={`size-options ${isSerum ? 'serum-sizes' : ''}`}>
              {safeProduct.sizes && safeProduct.sizes.length > 0 ? (
                safeProduct.sizes.map((size, index) => (
                  <div 
                    key={index}
                    className={`size-option ${isSerum ? 'serum-size' : ''} ${selectedSize === size ? 'active' : ''}`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </div>
                ))
              ) : (
                <div className={`size-option ${isSerum ? 'serum-size' : ''}`}>
                  {isSerum ? "30ml" : "One Size"}
                </div>
              )}
            </div>
          </div>

            <button 
              className={`add-to-cart-btn ${safeProduct.stockQuantity <= 0 ? "disabled" : ""}`} 
              onClick={handleAddToCart}
              disabled={safeProduct.stockQuantity <= 0}
            >
              {safeProduct.stockQuantity <= 0 ? "OUT OF STOCK" : "ADD TO BAG"}
            </button>

          <div className="promo-banner">
            <div className="promo-title">10% OFF YOUR FIRST ORDER | NEW MEMBER EXCLUSIVE</div>
            <div className="promo-timer">Time left: 01d 11h 37m</div>
          </div>

          <div className="store-availability">
            <i className="fas fa-store"></i>
            <span>Find in store</span>
            <button className="availability-btn">CHECK AVAILABILITY</button>
          </div>

          <div className="reviews-section">
            <div className="reviews-header">
              <div className="rating-stars">
                {[...Array(5)].map((_, i) => (
                  <i 
                    key={i}
                    className={`fas fa-star${i < Math.floor(rating) ? '' : i < rating ? '-half-alt' : ''}`}
                  ></i>
                ))}
              </div>
              <span className="review-count">REVIEWS [{reviews}]</span>
            </div>
            <div className="rating-text">{"★".repeat(Math.floor(rating))}{rating % 1 >= 0.5 ? "½" : ""} {rating}</div>
          </div>

          <div className="size-fit">
            <div className="fit-item">
              <div className="fit-label">TRUE TO SIZE</div>
              <div className="fit-bar">
                <div className="fit-indicator" style={{ left: `${fit.trueToSize}%` }}></div>
              </div>
              <div className="fit-value">
                {fit.trueToSize < 40 ? "Small" : fit.trueToSize < 70 ? "Spot on" : "Large"}
              </div>
            </div>
            <div className="fit-item">
              <div className="fit-label">LENGTH</div>
              <div className="fit-bar">
                <div className="fit-indicator" style={{ left: `${fit.length}%` }}></div>
              </div>
              <div className="fit-value">
                {fit.length < 40 ? "Short" : fit.length < 70 ? "Spot on" : "Long"}
              </div>
            </div>
            <div className="fit-item">
              <div className="fit-label">WIDTH</div>
              <div className="fit-bar">
                <div className="fit-indicator" style={{ left: `${fit.width}%` }}></div>
              </div>
              <div className="fit-value">
                {fit.width < 40 ? "Narrow" : fit.width < 70 ? "Spot on" : "Wide"}
              </div>
            </div>
          </div>

          <div className="product-details-accordion">
            <div className={`accordion-item ${accordionActive[0] ? 'active' : ''}`}>
              <div className="accordion-header" onClick={() => toggleAccordion(0)}>
                <span>DESCRIPTION & FIT</span>
                <i className={`fas fa-chevron-${accordionActive[0] ? 'up' : 'down'} accordion-icon`}></i>
              </div>
              <div className="accordion-content">
                <p>{safeProduct.description || "No description available."}</p>
                {safeProduct.fitNote && <p>{safeProduct.fitNote}</p>}
              </div>
            </div>
            <div className={`accordion-item ${accordionActive[1] ? 'active' : ''}`}>
              <div className="accordion-header" onClick={() => toggleAccordion(1)}>
                <span>MATERIALS</span>
                <i className={`fas fa-chevron-${accordionActive[1] ? 'up' : 'down'} accordion-icon`}></i>
              </div>
              <div className="accordion-content">
                <p>{safeProduct.materials}</p>
              </div>
            </div>
            <div className={`accordion-item ${accordionActive[2] ? 'active' : ''}`}>
              <div className="accordion-header" onClick={() => toggleAccordion(2)}>
                <span>CARE GUIDE</span>
                <i className={`fas fa-chevron-${accordionActive[2] ? 'up' : 'down'} accordion-icon`}></i>
              </div>
              <div className="accordion-content">
                <p>{safeProduct.careGuide}</p>
              </div>
            </div>
            <div className={`accordion-item ${accordionActive[3] ? 'active' : ''}`}>
              <div className="accordion-header" onClick={() => toggleAccordion(3)}>
                <span>DELIVERY, PAYMENT AND RETURNS</span>
                <i className={`fas fa-chevron-${accordionActive[3] ? 'up' : 'down'} accordion-icon`}></i>
              </div>
              <div className="accordion-content">
                <p>{safeProduct.deliveryInfo}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPopup && (
        <div className="popup-overlay active" onClick={() => setShowPopup(false)}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h2 className="popup-title">Added to Bag</h2>
              <button className="close-popup" onClick={() => setShowPopup(false)}>&times;</button>
            </div>
            <div className="popup-body">
              <div className="popup-item">
                <div className="popup-item-image">
                  <img src={popupImage} alt={safeProduct.name} />
                </div>
                <div className="popup-item-details">
                  <div className="popup-item-name">{safeProduct.name}</div>
                  <div className="popup-item-attributes">
                    <div>Colour: <span>{popupColorName}</span></div>
                    <div>Size: <span>{selectedSize}</span></div>
                    <div>Quantity: 1</div>
                  </div>
                  <div className="popup-item-price">Rs. {Number(safeProduct.price).toLocaleString()}.00</div>
                </div>
              </div>
              <div className="popup-summary">
                <div className="popup-summary-row">
                  <span>Subtotal:</span>
                  <span>Rs. {Number(safeProduct.price).toLocaleString()}.00</span>
                </div>
                <div className="popup-summary-row">
                  <span>Delivery:</span>
                  <span>Rs. 148.00</span>
                </div>
                <div className="popup-summary-row popup-summary-total">
                  <span>Total:</span>
                  <span>Rs. {(Number(safeProduct.price) + 148).toLocaleString()}.00</span>
                </div>
              </div>
            </div>
            <div className="popup-actions">
              <button className="popup-btn continue-shopping" onClick={() => setShowPopup(false)}>
                CONTINUE SHOPPING
              </button>
              <button className="popup-btn view-bag" onClick={() => navigate('/cart')}>
                VIEW BAG
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
