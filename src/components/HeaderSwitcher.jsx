import { useLocation, matchPath } from "react-router-dom";

import Header from "./Header/Header";
import ProductDetailHeader from "./ProductDetailHeader/ProductDetailHeader";

const HeaderSwitcher = () => {
  const location = useLocation();

  // Product detail page
  const isProductPage = matchPath("/product/:productId", location.pathname);
  const isProduct1Page = matchPath("/product1/:productId", location.pathname);
  const isProductDetailPage = location.pathname.startsWith("/product/");

  // Product detail
  if (isProductPage||isProduct1Page||isProductDetailPage) {
    return <ProductDetailHeader variant="product" />;
  }

  return <Header />;
};

export default HeaderSwitcher;
