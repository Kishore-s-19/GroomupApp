import { useEffect } from "react";
import "../assets/styles/store-locator.css";
import { Link } from "react-router-dom";


const StoreLocator = () => {
  useEffect(() => {
    // Store selection
    const storeItems = document.querySelectorAll(".store-item");

    storeItems.forEach(item => {
      item.addEventListener("click", function () {
        storeItems.forEach(i => i.classList.remove("active"));
        this.classList.add("active");

        const storeName = this.querySelector("h3").textContent;
        const storeAddress = this.querySelector(".store-address").textContent;

        const mapPlaceholder = document.querySelector(".map-placeholder");
        mapPlaceholder.innerHTML = `
          <i class="fas fa-map-marker-alt"></i>
          <h3>${storeName}</h3>
          <p>${storeAddress}</p>
          <p style="margin-top:15px;font-size:0.9rem;">
            Select a different store to view its location
          </p>
        `;
      });
    });

    // Search animation
    const searchIcon = document.getElementById("search-icon");
    const searchBar = document.getElementById("search-bar");
    const searchInput = document.getElementById("search-input");
    let isSearchActive = false;

    searchIcon?.addEventListener("click", e => {
      e.stopPropagation();
      if (!isSearchActive) {
        searchBar.classList.add("active");
        isSearchActive = true;
        setTimeout(() => searchInput.focus(), 400);
      } else {
        searchBar.classList.add("closing");
        setTimeout(() => {
          searchBar.classList.remove("active", "closing");
          isSearchActive = false;
        }, 300);
      }
    });

    document.addEventListener("click", e => {
      if (isSearchActive && !searchBar.contains(e.target) && e.target !== searchIcon) {
        searchBar.classList.add("closing");
        setTimeout(() => {
          searchBar.classList.remove("active", "closing");
          isSearchActive = false;
        }, 300);
      }
    });

    // Scroll to top
    const scrollBtn = document.getElementById("scrollToTopBtn");
    window.addEventListener("scroll", () => {
      if (window.scrollY > 100) scrollBtn.style.display = "flex";
      else scrollBtn.style.display = "none";
    });

    scrollBtn?.addEventListener("click", () =>
      window.scrollTo({ top: 0, behavior: "smooth" })
    );
  }, []);

  return (
     
    <>
    <div className="store-locator-page">
      

      {/* HERO */}
      <section className="store-locator-hero">
        <h1>Find a GroomUp Store Near You</h1>
        <p>Visit our stores to experience premium fashion and personalized service</p>
      </section>

      {/* CONTENT */}
      <section className="store-locator-container">
        <h2 className="store-locator-title">OUR STORES</h2>

        <div className="store-locator-content">
          <div className="stores-list">
            {[
              ["Pune", "Unit No S26A, Phoenix Market City, Pune"],
              ["Surat", "Avadh Kontina, Vip road, Surat"],
              ["Thane", "Ram Maruti Road, Thane"],
              ["Mumbai Central", "Lamington Road, Mumbai"],
              ["Delhi", "Select Citywalk, Saket"]
            ].map((store, i) => (
              <div key={i} className={`store-item ${i === 0 ? "active" : ""}`}>
                <h3>{store[0]}</h3>
                <p className="store-address">{store[1]}</p>
                <p className="store-phone">
                  <i className="fas fa-phone"></i> +91 XXXXX XXXXX
                </p>
                <p className="store-hours">
                  <i className="fas fa-clock"></i> 11:00 AM – 10:00 PM
                </p>
              </div>
            ))}
          </div>

          <div className="map-container">
            <div className="map-placeholder">
              <i className="fas fa-map-marked-alt"></i>
              <h3>Interactive Store Map</h3>
              <p>Select a store to view location</p>
            </div>
          </div>
        </div>
      </section>

      {/* SCROLL TO TOP */}
      <button id="scrollToTopBtn">↑</button>
      </div>
    </>
    
    
  );
};

export default StoreLocator;
