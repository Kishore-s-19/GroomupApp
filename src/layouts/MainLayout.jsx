import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";
import { Outlet } from "react-router-dom";

const MainLayout = () => {
  return (
    <>
      <Header />
      <Outlet />   {/* Page content */}
      <Footer />
    </>
  );
};

export default MainLayout;
