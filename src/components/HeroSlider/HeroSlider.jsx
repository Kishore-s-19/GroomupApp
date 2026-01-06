import { useEffect, useState, useRef } from "react";
import "./HeroSlider.css";

const SLIDE_INTERVAL = 5500;

const slides = [
  {
    id: 0,
    type: "video",
    src: "/hero-section-video/1613171d-8635-49ca-8c0e-0dea9eb8f5bb.mp4",
    title: "Premium Hair & Skin Care",
    description:
      "Discover our advanced serums for healthier hair and glowing skin",
    cta: "Shop Serum",
    align: "left",
    category: "serum",
  },
  {
    id: 1,
    type: "image",
    src: "https://www.maincharacterindia.com/cdn/shop/files/Artboard_1_2x_2e728aff-0c23-42c7-9ce0-2956f8154cec.jpg?v=1756897634&width=1920",
    title: "Easy T-Shirts for Every Mood",
    description: "Laid-back comfort meets effortless charm",
    cta: "Shop T-Shirts",
    align: "left",
    category: "tshirts",
  },
  {
    id: 2,
    type: "image",
    src: "https://image.hm.com/content/dam/global_campaigns/season_02/men/ms42e7/MS42E7-16x9-top-outerwear-edit.jpg?imwidth=1920",
    title: "Stylish Shirts for Every Occasion",
    description: "From casual to formal, find your perfect style",
    cta: "Shop Shirts",
    align: "left",
    fit: "editorial",
    category: "shirts",
  },
  {
    id: 3,
    type: "image",
    src: "https://image.hm.com/content/dam/global_campaigns/season_02/men/1032b/1032B-16x9.jpg?imwidth=1920",
    title: "Stylish Bottoms for Every Occasion",
    description: "From casual to formal, find your perfect fit",
    cta: "Shop Bottoms",
    align: "right",
    fit: "editorial",
    category: "bottoms",
  },
];

const HeroSlider = ({ onCategoryChange }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const intervalRef = useRef(null);
  const touchStartXRef = useRef(null);
  const touchStartYRef = useRef(null);
  const didSwipeRef = useRef(false);

  const startAutoSlide = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, SLIDE_INTERVAL);
  };

  const goToSlide = (index) => {
    clearInterval(intervalRef.current);
    setCurrentSlide(index);
    startAutoSlide();
  };

  const goToPrevSlide = () => {
    goToSlide((currentSlide - 1 + slides.length) % slides.length);
  };

  const goToNextSlide = () => {
    goToSlide((currentSlide + 1) % slides.length);
  };

  const handleSlideClick = (slide) => {
    if (didSwipeRef.current) {
      didSwipeRef.current = false;
      return;
    }
    if (slide.category && typeof onCategoryChange === "function") {
      onCategoryChange(slide.category);
    }
  };

  useEffect(() => {
    startAutoSlide();
    return () => clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(media.matches);
    update();

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", update);
      return () => media.removeEventListener("change", update);
    }

    media.addListener(update);
    return () => media.removeListener(update);
  }, []);

  const handleTouchStart = (e) => {
    if (!isMobile) return;
    if (!e.touches || e.touches.length !== 1) return;
    didSwipeRef.current = false;
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (!isMobile) return;
    if (touchStartXRef.current == null || touchStartYRef.current == null) return;

    const changed = e.changedTouches && e.changedTouches[0];
    if (!changed) return;

    const dx = changed.clientX - touchStartXRef.current;
    const dy = changed.clientY - touchStartYRef.current;

    touchStartXRef.current = null;
    touchStartYRef.current = null;

    if (Math.abs(dx) < 45) return;
    if (Math.abs(dy) > Math.abs(dx) * 0.7) return;

    didSwipeRef.current = true;

    if (dx < 0) {
      goToPrevSlide();
    } else {
      goToNextSlide();
    }
  };

  return (
    <section className="hero">
      <div
        className="hero-slider"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`hero-slide ${index === currentSlide ? "active" : ""}`}
            onClick={() => handleSlideClick(slide)}
          >
            {slide.type === "video" ? (
              <div
                className="video-container"
              >
                <video autoPlay muted loop playsInline>
                  <source src={slide.src} />
                </video>
              </div>
            ) : (
              <div
                className={`hero-bg ${
                  index === 2
                    ? "hero-bg-2"
                    : index === 3
                    ? "hero-bg-3"
                    : ""
                }`}
                style={{ backgroundImage: `url(${slide.src})` }}
              />



            )}

            <div
              className={`hero-content ${
                slide.align === "right"
                  ? "hero-content-right"
                  : "hero-content-left"
              }
              ${index === 0 ? "hero-content-first" : ""

              } hero-text-slide-${slide.id}`}
            >
              <h1>{slide.title}</h1>
              <p>{slide.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* SLIDER INDICATORS */}
      <div className="slider-indicators">
        {slides.map((_, index) => (
          <div
            key={index}
            className={`indicator ${index === currentSlide ? "active" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              goToSlide(index);
            }}
          >
            {index === currentSlide && (
              <span
                className="indicator-progress"
                style={{ animationDuration: `${SLIDE_INTERVAL}ms` }}
              />
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default HeroSlider;
