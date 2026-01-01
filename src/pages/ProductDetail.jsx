import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../assets/styles/product-detail.css";
import productDetails from "../data/products";

const ProductDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [accordionActive, setAccordionActive] = useState([true, false, false, false]);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant"
    });
  }, []);

  useEffect(() => {
    const productIdNum = parseInt(productId);
    
    if (productDetails[productIdNum]) {
      setProduct(productDetails[productIdNum]);
      
      if (productDetails[productIdNum].sizes.includes("One Size")) {
        setSelectedSize("One Size");
      } else if (productDetails[productIdNum].sizes.includes("M")) {
        setSelectedSize("M");
      } else if (productDetails[productIdNum].sizes.includes("30")) {
        setSelectedSize("30");
      } else if (productDetails[productIdNum].sizes.includes("32")) {
        setSelectedSize("32");
      } else if (productDetails[productIdNum].sizes.includes("S")) {
        setSelectedSize("S");
      } else {
        setSelectedSize(productDetails[productIdNum].sizes[0]);
      }
    } else {
      navigate("/");
    }
  }, [productId, navigate]);

  const handleAddToCart = () => {
    if (!product) return;
    
    const cart = JSON.parse(localStorage.getItem('groomupShoppingBag')) || [];
    const selectedColorData = product.colors[selectedColor];
    
    const cartItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: selectedColorData ? selectedColorData.image : product.images[0],
      brand: product.brand,
      quantity: 1,
      color: selectedColorData ? selectedColorData.name : (product.colors && product.colors[0] ? product.colors[0].name : "Default"),
      size: selectedSize,
      artNo: `ART${product.id}`
    };
    
    const existingIndex = cart.findIndex(item => 
      item.id === cartItem.id && 
      item.color === cartItem.color &&
      item.size === cartItem.size
    );
    
    if (existingIndex >= 0) {
      cart[existingIndex].quantity += 1;
    } else {
      cart.push(cartItem);
    }
    
    localStorage.setItem('groomupShoppingBag', JSON.stringify(cart));
    
    setShowPopup(true);
    
    window.dispatchEvent(new Event('storage'));
  };

  const toggleAccordion = (index) => {
    const newAccordion = [...accordionActive];
    newAccordion[index] = !newAccordion[index];
    setAccordionActive(newAccordion);
  };

  if (!product) {
    return (
      <div className="loading-container">
        <div className="loading-logo">GROOMUP</div>
      </div>
    );
  }

  return (
    <div className="product-detail-page">
      <div className="breadcrumb">
        <a onClick={() => navigate("/")}>Home</a> &gt; 
        <a onClick={() => navigate("/collection")}>Collection</a> &gt; 
        <a onClick={() => navigate(`/category/${product.category}`)}>
          {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
        </a> &gt; 
        <span>{product.name}</span>
      </div>

      <div className="product-container">
        <div className="product-gallery">
          <div className="main-image">
            <img src={product.images[selectedImage]} alt={product.name} />
          </div>
          <div className="thumbnail-container">
            {product.images.map((image, index) => (
              <div 
                key={index}
                className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                onClick={() => setSelectedImage(index)}
              >
                <img src={image} alt={`${product.name} view ${index + 1}`} />
              </div>
            ))}
          </div>
        </div>

        <div className="product-info">
          <div className="brand-name">{product.brand}</div>
          <h1 className="product-title">{product.name}</h1>
          <div className="product-price">
            <span className="current-price">Rs. {product.price.toLocaleString()}.00</span>
            {product.originalPrice && (
              <span className="original-price">Rs. {product.originalPrice.toLocaleString()}.00</span>
            )}
          </div>
          <p className="mrp-text">MRP Inclusive of all taxes</p>

          {product.colors && product.colors.length > 0 && (
            <div className="product-color">
              <span className="color-label">COLOUR: {product.colors[selectedColor].name}</span>
              <div className="color-options">
                {product.colors.map((color, index) => (
                  <div 
                    key={index}
                    className={`color-option ${selectedColor === index ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedColor(index);
                      setSelectedImage(0);
                    }}
                  >
                    <div className={`color-sample ${color.value}`}></div>
                    <span>{color.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="size-selection">
            <div className="size-header">
              <span className="size-label">SELECT SIZE</span>
              <a className="size-guide">SIZE GUIDE</a>
            </div>
            <div className="size-options">
              {product.sizes.map((size, index) => (
                <div 
                  key={index}
                  className={`size-option ${selectedSize === size ? 'active' : ''}`}
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </div>
              ))}
            </div>
          </div>

          <button className="add-to-cart-btn" onClick={handleAddToCart}>
            ADD TO BAG
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
                    className={`fas fa-star${i < Math.floor(product.rating) ? '' : i < product.rating ? '-half-alt' : ''}`}
                  ></i>
                ))}
              </div>
              <span className="review-count">REVIEWS [{product.reviews}]</span>
            </div>
            <div className="rating-text">{"★".repeat(Math.floor(product.rating))}{product.rating % 1 >= 0.5 ? "½" : ""} {product.rating}</div>
          </div>

          <div className="size-fit">
            <div className="fit-item">
              <div className="fit-label">TRUE TO SIZE</div>
              <div className="fit-bar">
                <div className="fit-indicator" style={{ left: `${product.fit.trueToSize}%` }}></div>
              </div>
              <div className="fit-value">
                {product.fit.trueToSize < 40 ? "Small" : product.fit.trueToSize < 70 ? "Spot on" : "Large"}
              </div>
            </div>
            <div className="fit-item">
              <div className="fit-label">LENGTH</div>
              <div className="fit-bar">
                <div className="fit-indicator" style={{ left: `${product.fit.length}%` }}></div>
              </div>
              <div className="fit-value">
                {product.fit.length < 40 ? "Short" : product.fit.length < 70 ? "Spot on" : "Long"}
              </div>
            </div>
            <div className="fit-item">
              <div className="fit-label">WIDTH</div>
              <div className="fit-bar">
                <div className="fit-indicator" style={{ left: `${product.fit.width}%` }}></div>
              </div>
              <div className="fit-value">
                {product.fit.width < 40 ? "Narrow" : product.fit.width < 70 ? "Spot on" : "Wide"}
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
                <p>{product.description}</p>
                {product.fitNote && <p>{product.fitNote}</p>}
              </div>
            </div>
            <div className={`accordion-item ${accordionActive[1] ? 'active' : ''}`}>
              <div className="accordion-header" onClick={() => toggleAccordion(1)}>
                <span>MATERIALS</span>
                <i className={`fas fa-chevron-${accordionActive[1] ? 'up' : 'down'} accordion-icon`}></i>
              </div>
              <div className="accordion-content">
                <p>{product.materials}</p>
              </div>
            </div>
            <div className={`accordion-item ${accordionActive[2] ? 'active' : ''}`}>
              <div className="accordion-header" onClick={() => toggleAccordion(2)}>
                <span>CARE GUIDE</span>
                <i className={`fas fa-chevron-${accordionActive[2] ? 'up' : 'down'} accordion-icon`}></i>
              </div>
              <div className="accordion-content">
                <p>{product.careGuide}</p>
              </div>
            </div>
            <div className={`accordion-item ${accordionActive[3] ? 'active' : ''}`}>
              <div className="accordion-header" onClick={() => toggleAccordion(3)}>
                <span>DELIVERY, PAYMENT AND RETURNS</span>
                <i className={`fas fa-chevron-${accordionActive[3] ? 'up' : 'down'} accordion-icon`}></i>
              </div>
              <div className="accordion-content">
                <p>{product.deliveryInfo}</p>
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
                  <img src={product.images[0]} alt={product.name} />
                </div>
                <div className="popup-item-details">
                  <div className="popup-item-name">{product.name}</div>
                  <div className="popup-item-attributes">
                    <div>Colour: <span>{product.colors[selectedColor].name}</span></div>
                    <div>Size: <span>{selectedSize}</span></div>
                    <div>Quantity: 1</div>
                  </div>
                  <div className="popup-item-price">Rs. {product.price.toLocaleString()}.00</div>
                </div>
              </div>
              <div className="popup-summary">
                <div className="popup-summary-row">
                  <span>Subtotal:</span>
                  <span>Rs. {product.price.toLocaleString()}.00</span>
                </div>
                <div className="popup-summary-row">
                  <span>Delivery:</span>
                  <span>Rs. 148.00</span>
                </div>
                <div className="popup-summary-row popup-summary-total">
                  <span>Total:</span>
                  <span>Rs. {(product.price + 148).toLocaleString()}.00</span>
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