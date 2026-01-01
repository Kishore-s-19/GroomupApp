import { useEffect, useState, useRef } from "react";
import "./BackToTop.css";

const BackToTop = () => {
  const [show, setShow] = useState(false);
  const firstViewportHeight = useRef(0);

  useEffect(() => {
    const calculateFirstViewportHeight = () => {
      firstViewportHeight.current = window.innerHeight;
    };

    calculateFirstViewportHeight();
    window.addEventListener("resize", calculateFirstViewportHeight);

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      /*
        ✅ THIS IS THE KEY FIX
        Show button when user has scrolled
        at least 60% of total page height
      */
      if (scrollTop + windowHeight >= documentHeight * 0.6) {
        setShow(true);
      } else {
        setShow(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("resize", calculateFirstViewportHeight);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    show && (
      <button
        className="back-to-top"
        onClick={scrollToTop}
        aria-label="Scroll to top"
        title="Back to top"
      >
        ↑
      </button>
    )
  );
};

export default BackToTop;
