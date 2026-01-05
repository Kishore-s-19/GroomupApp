import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";
import { Outlet } from "react-router-dom";
import BottomNav from "../components/BottomNav/BottomNav";

const MainLayout = () => {
  return (
    <>
      <Header />
      <Outlet />   {/* Page content */}
      <Footer />
      <BottomNav />
    </>
  );
};

export default MainLayout;
