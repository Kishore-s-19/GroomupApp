import { useLocation } from "react-router-dom";

const RouteLoader = ({ children }) => {
  useLocation(); // keep hook to re-render on route change

  return children;
};

export default RouteLoader;
