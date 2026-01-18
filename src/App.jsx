import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RouteLoader from "./components/RouteLoader/RouteLoader";

// Contexts
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ShoppingBag from "./pages/ShoppingBag";
import TrackOrder from "./pages/TrackOrder";
import StoreLocator from "./pages/StoreLocator";
import ContactUs from "./pages/ContactUs";
import Profile from "./pages/Profile";
import ProductDetail from "./pages/ProductDetail";
import SearchResults from "./pages/SearchResults";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import OrderFailure from "./pages/OrderFailure";
import Orders from "./pages/Orders";

// Layouts
import MainLayout from "./layouts/MainLayout";
import AuthLayout from "./layouts/AuthLayout";

// Global styles
import "./assets/styles/variables.css";
import "./assets/styles/global.css";
import "./assets/styles/store-locator.css";

const App = () => {
  // Removed console.log for production

  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <RouteLoader>
            <Routes>

              {/* 🔐 AUTH ROUTES (NO HEADER / FOOTER) */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              </Route>

              {/* 🌍 MAIN ROUTES (WITH HEADER / FOOTER) */}
              <Route element={<MainLayout />}>
                <Route path="/" element={<Home />} />
                  <Route path="/category/:category" element={<Home />} />
                <Route path="/cart" element={<ShoppingBag />} />
                <Route path="/track-order" element={<TrackOrder />} />
                <Route path="/store-locator" element={<StoreLocator />} />
                <Route path="/contact" element={<ContactUs />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/product/:productId" element={<ProductDetail />} />
                <Route path="/search" element={<SearchResults />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/order-success" element={<OrderSuccess />} />
                <Route path="/order-failure" element={<OrderFailure />} />
              </Route>

            </Routes>
          </RouteLoader>  
        </Router>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
