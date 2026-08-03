import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FiHeart, FiRefreshCw, FiShield, FiShoppingCart, FiStar, FiTruck } from "react-icons/fi";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import ProductCard from "../components/product/ProductCard";
import { getProductById } from "../services/productService";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";

const relatedProducts = [
  { id: 2, name: "Wireless Earbuds Pro", category: "Audio", price: 2499, oldPrice: 3999, rating: 4.6, reviews: 1100, badge: "SALE" },
  { id: 3, name: "Smartwatch Series 5", category: "Wearables", price: 5999, oldPrice: 7999, rating: 4.9, reviews: 900, badge: null },
  { id: 4, name: "4K Action Camera", category: "Cameras", price: 12499, oldPrice: 15999, rating: 4.5, reviews: 540, badge: "SALE" },
  { id: 5, name: "Ultra OLED Monitor", category: "Laptops", price: 34999, oldPrice: 42999, rating: 4.7, reviews: 810, badge: null },
];

const formatPrice = (value) => `₹${value.toLocaleString("en-IN")}`;

function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true);
        const data = await getProductById(id);
        setProduct(data);
      } catch (err) {
        setError("Could not load product. Is the server running?");
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  const discount = product
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  const mainImage =
    product?.images?.[0]?.url ||
    (typeof product?.images?.[0] === "string" ? product.images[0] : null) ||
    "https://via.placeholder.com/900x600?text=ElectroMart+Product";

  const productId = product?._id || product?.id;

  // JSON-LD structured data for SEO
  const jsonLd = product
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        image: mainImage,
        description: product.description,
        brand: { "@type": "Brand", name: "ElectroMart" },
        offers: {
          "@type": "Offer",
          price: product.price,
          priceCurrency: "INR",
          availability: "https://schema.org/InStock",
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: product.rating,
          reviewCount: product.reviews,
        },
      }
    : null;

  return (
    <>
      {product && (
        <Helmet>
          <title>{product.name} – ElectroMart</title>
          <meta name="description" content={product.description?.slice(0, 160)} />
          <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
        </Helmet>
      )}

      <Navbar />

      <main
        className="min-h-screen px-8 py-16"
        style={{ background: "var(--color-bg)", color: "var(--color-heading)" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mx-auto max-w-[1500px]"
        >
          {loading ? (
            <div className="min-h-[400px] flex items-center justify-center text-lg" style={{ color: "var(--color-muted)" }}>
              Loading product…
            </div>
          ) : error ? (
            <div className="min-h-[400px] flex items-center justify-center text-lg" style={{ color: "var(--color-danger)" }}>
              {error}
            </div>
          ) : product ? (
            <>
              <div className="grid gap-10 lg:grid-cols-2">
                {/* Images */}
                <div>
                  <div
                    className="rounded-3xl p-4"
                    style={{
                      border: "1px solid var(--color-border)",
                      background: "var(--color-surface)",
                    }}
                  >
                    <img
                      src={mainImage}
                      alt={product.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full rounded-2xl object-cover"
                      style={{ height: "420px" }}
                    />
                    <div className="mt-4 grid grid-cols-4 gap-3">
                      {(
                        product.images
                          ?.slice(0, 4)
                          .map((image) => (typeof image === "string" ? image : image?.url)) || [mainImage]
                      ).map((src, index) => (
                        <img
                          key={index}
                          src={src}
                          alt={`${product.name} thumbnail ${index + 1}`}
                          loading="lazy"
                          className="h-20 rounded-xl object-cover"
                          style={{ border: "1px solid var(--color-border)" }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div>
                  <p
                    className="text-sm font-semibold uppercase tracking-[0.3em]"
                    style={{ color: "var(--color-accent)" }}
                  >
                    {product.category}
                  </p>
                  <h1 className="mt-3 text-4xl font-bold">{product.name}</h1>
                  <p className="mt-2 text-sm" style={{ color: "var(--color-muted)" }}>
                    Product ID: {id}
                  </p>

                  {/* Rating */}
                  <div className="mt-5 flex items-center gap-2 text-sm" style={{ color: "var(--color-body)" }}>
                    <FiStar style={{ color: "var(--color-rating)" }} />
                    <span>{product.rating.toFixed(1)}</span>
                    <span style={{ color: "var(--color-muted)" }}>
                      ({product.reviews.toLocaleString("en-IN")} reviews)
                    </span>
                  </div>

                  {/* Price */}
                  <div className="mt-6 flex flex-wrap items-end gap-3">
                    <span className="text-3xl font-bold">{formatPrice(product.price)}</span>
                    <span className="text-lg line-through" style={{ color: "var(--color-muted)" }}>
                      {formatPrice(product.oldPrice)}
                    </span>
                    <span
                      className="text-sm font-semibold"
                      style={{ color: "var(--color-accent)" }}
                    >
                      Save {discount}%
                    </span>
                  </div>

                  {/* Description */}
                  <p
                    className="mt-6 max-w-xl text-lg leading-8"
                    style={{ color: "var(--color-body)" }}
                  >
                    {product.description}
                  </p>

                  {/* Quantity + Buttons */}
                  <div className="mt-8 flex items-center gap-3">
                    <div
                      className="flex items-center rounded-xl"
                      style={{
                        border: "1px solid var(--color-border)",
                        background: "var(--color-surface)",
                      }}
                    >
                      <button
                        className="px-4 py-3 text-xl transition"
                        style={{ color: "var(--color-heading)" }}
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="min-w-12 px-4 py-3 text-center font-semibold">
                        {quantity}
                      </span>
                      <button
                        className="px-4 py-3 text-xl transition"
                        style={{ color: "var(--color-heading)" }}
                        onClick={() => setQuantity((q) => q + 1)}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    <button
                      className="btn-primary"
                      onClick={() => addToCart(product, quantity)}
                      aria-label={`Add ${product.name} to cart`}
                    >
                      <FiShoppingCart />
                      Add to Cart
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => toggleWishlist(product)}
                      aria-label={isInWishlist(productId) ? "Remove from wishlist" : "Add to wishlist"}
                    >
                      <FiHeart className={isInWishlist(productId) ? "fill-current" : ""} />
                      {isInWishlist(productId) ? "Wishlisted" : "Wishlist"}
                    </button>
                  </div>

                  {/* Trust badges */}
                  <div
                    className="mt-8 grid gap-3 rounded-2xl p-4 md:grid-cols-3"
                    style={{
                      border: "1px solid var(--color-border)",
                      background: "var(--color-surface)",
                    }}
                  >
                    <div className="flex items-center gap-3 text-sm" style={{ color: "var(--color-body)" }}>
                      <FiTruck style={{ color: "var(--color-accent)" }} />
                      <span>Free Delivery</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm" style={{ color: "var(--color-body)" }}>
                      <FiShield style={{ color: "var(--color-accent)" }} />
                      <span>1 Year Warranty</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm" style={{ color: "var(--color-body)" }}>
                      <FiRefreshCw style={{ color: "var(--color-accent)" }} />
                      <span>Easy Returns</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Related Products */}
              <div className="mt-16">
                <div className="mb-8 flex items-end justify-between">
                  <div>
                    <p
                      className="text-sm font-semibold uppercase tracking-[0.3em]"
                      style={{ color: "var(--color-accent)" }}
                    >
                      Explore More
                    </p>
                    <h2 className="mt-2 text-3xl font-bold">You Might Also Like</h2>
                  </div>
                </div>
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
                  {relatedProducts.map((rp) => (
                    <ProductCard key={rp.id} product={rp} />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="min-h-[400px] flex items-center justify-center text-lg" style={{ color: "var(--color-danger)" }}>
              Product not found.
            </div>
          )}
        </motion.div>
      </main>

      <Footer />
    </>
  );
}

export default ProductDetail;
