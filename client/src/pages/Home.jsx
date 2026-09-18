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
        <title>Furniva – Modern Furniture for Beautiful Homes</title>
        <meta
          name="description"
          content="Shop premium sofas, beds, dining furniture, tables, storage and more at Furniva. Discover stylish furniture designed for comfort and everyday living."
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