import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import PageSkeleton from "../PageSkeleton/PageSkeleton";

const RouteLoader = ({ children }) => {
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);

    const timer = setTimeout(() => {
      setLoading(false);
    }, 600); // premium sites use ~400–700ms

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return loading ? <PageSkeleton /> : children;
};

export default RouteLoader;
