import SEO from "../components/common/SEO";
import Navbar from "../components/layout/Navbar";
import Hero from "../components/home/Hero";
import CategoryGrid from "../components/home/CategoryGrid";
import FeaturedProducts from "../components/home/FeaturedProducts";
import WhyBuyFromUs from "../components/home/WhyBuyFromUs";
import ProductRecommendations from "../components/product/ProductRecommendations";
import RecentlyViewed from "../components/home/RecentlyViewed";
import Footer from "../components/layout/Footer";

function Home() {
  return (
    <>
      <SEO
        title="Furniva – Modern Furniture for Beautiful Homes"
        description="Discover premium handcrafted sofas, beds, dining tables, lounge chairs, and modular home storage. Designed for everyday comfort and lasting elegance."
        canonicalUrl="/"
        includeOrganization={true}
        breadcrumbs={[{ name: "Home", item: "/" }]}
      />

      <Navbar />
      <main className="min-h-screen" style={{ background: "var(--color-bg)" }}>
        <Hero />
        <CategoryGrid />
        <FeaturedProducts />
        <section className="px-6 sm:px-8 max-w-[1500px] mx-auto">
          <ProductRecommendations
            type="for_you"
            limit={4}
            badge="Personalized For You"
            title="Recommended for Your Home"
            subtitle="Curated designs based on your interior taste and browsing history."
          />
        </section>
        <WhyBuyFromUs />
        <RecentlyViewed />
      </main>
      <Footer />
    </>
  );
}


export default Home;