import { Helmet } from "react-helmet-async";
import Navbar from "../components/layout/Navbar";
import Hero from "../components/home/Hero";
import CategoryGrid from "../components/home/CategoryGrid";
import FeaturedProducts from "../components/home/FeaturedProducts";
import WhyBuyFromUs from "../components/home/WhyBuyFromUs";
import RecentlyViewed from "../components/home/RecentlyViewed";
import Footer from "../components/layout/Footer";

function Home() {
  return (
    <>
      <Helmet>
        <title>ElectroMart – Premium Electronics & Future Tech Store</title>
        <meta
          name="description"
          content="Shop the latest premium electronics, smartphones, laptops, audio gear, and wearables at ElectroMart. Free delivery, 1-year warranty, and easy returns."
        />
      </Helmet>

      <Navbar />
      <main className="min-h-screen" style={{ background: "var(--color-bg)" }}>
        <Hero />
        <CategoryGrid />
        <FeaturedProducts />
        <WhyBuyFromUs />
        <RecentlyViewed />
      </main>
      <Footer />
    </>
  );
}

export default Home;