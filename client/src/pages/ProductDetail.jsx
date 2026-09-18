import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiHeart,
  FiRefreshCw,
  FiShield,
  FiShoppingCart,
  FiStar,
  FiTruck,
  FiCreditCard,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import ProductCard from "../components/product/ProductCard";
import { getProductById, getAllProducts } from "../services/productService";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";

const formatPrice = (value) => `₹${value?.toLocaleString("en-IN") || 0}`;

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("specs");
  const [relatedProducts, setRelatedProducts] = useState([]);
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  useEffect(() => {
    async function fetchProductData() {
      try {
        setLoading(true);
        setError(null);
        setSelectedImageIndex(0);
        const data = await getProductById(id);
        setProduct(data);

        // Save to Recently Viewed in localStorage (primary: furniva_recently_viewed, fallback: electromart_recently_viewed)
        try {
          const raw = localStorage.getItem("furniva_recently_viewed") || localStorage.getItem("electromart_recently_viewed");
          const stored = JSON.parse(raw || "[]");
          const filtered = stored.filter((item) => (item._id || item.id) !== (data._id || data.id));
          const updated = [data, ...filtered].slice(0, 8);
          localStorage.setItem("furniva_recently_viewed", JSON.stringify(updated));
        } catch (e) {
          console.error("Failed to save to recently viewed", e);
        }

        // Fetch related products from same category
        if (data?.category) {
          const categoryProducts = await getAllProducts({ category: data.category });
          const filteredRelated = categoryProducts
            .filter((p) => (p._id || p.id) !== (data._id || data.id))
            .slice(0, 4);
          setRelatedProducts(filteredRelated);
        }
      } catch (err) {
        setError("Could not load product details. Is the server running?");
      } finally {
        setLoading(false);
      }
    }
    fetchProductData();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  const discount = product && product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  const imageList = (
    product?.images?.map((img) => (typeof img === "string" ? img : img?.url)) || []
  ).filter(Boolean);

  const mainImage =
    imageList[selectedImageIndex] ||
    imageList[0] ||
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80";

  const productId = product?._id || product?.id;

  // Stock status helpers
  const isOutOfStock = product?.stock === 0;
  const isLowStock = !isOutOfStock && product?.stock <= (product?.lowStockThreshold || 5);

  // EMI Calculations
  const emi3 = product ? Math.round(product.price / 3) : 0;
  const emi6 = product ? Math.round(product.price / 6) : 0;
  const emi12 = product ? Math.round(product.price / 12) : 0;

  const jsonLd = product
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        image: mainImage,
        description: product.description,
        brand: { "@type": "Brand", name: product.brand || "Furniva" },
        offers: {
          "@type": "Offer",
          price: product.price,
          priceCurrency: "INR",
          availability: isOutOfStock
            ? "https://schema.org/OutOfStock"
            : "https://schema.org/InStock",
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: product.rating || 4.5,
          reviewCount: product.reviews || 10,
        },
      }
    : null;

  return (
    <>
      {product && (
        <Helmet>
          <title>{product.name} – Furniva</title>
          <meta name="description" content={product.description?.slice(0, 160)} />
          <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
        </Helmet>
      )}

      <Navbar />

      <main
        className="min-h-screen px-4 sm:px-8 py-12 pb-24 lg:pb-16"
        style={{ background: "var(--color-bg)", color: "var(--color-heading)" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mx-auto max-w-[1500px]"
        >
          {loading ? (
            <div className="min-h-[400px] flex items-center justify-center text-lg" style={{ color: "var(--color-muted)" }}>
              Loading product details…
            </div>
          ) : error ? (
            <div className="min-h-[400px] flex items-center justify-center text-lg" style={{ color: "var(--color-danger)" }}>
              {error}
            </div>
          ) : product ? (
            <>
              {/* Product Hero Grid */}
              <div className="grid gap-10 lg:grid-cols-2">
                {/* Images Container */}
                <div>
                  <div
                    className="rounded-3xl p-4 relative"
                    style={{
                      border: "1px solid var(--color-border)",
                      background: "var(--color-surface)",
                    }}
                  >
                    {/* Badges */}
                    <div className="absolute top-6 left-6 z-10 flex flex-wrap gap-2">
                      {(product.badge === "NEW" || product.isNewProduct) && (
                        <span
                          className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider text-white"
                          style={{ background: "var(--color-accent)" }}
                        >
                          New Arrival
                        </span>
                      )}
                      {(product.isBestseller || product.reviews > 1000) && (
                        <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-bold uppercase tracking-wider text-black">
                          Bestseller
                        </span>
                      )}
                      {discount > 0 && (
                        <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                          {discount}% Off
                        </span>
                      )}
                    </div>

                    <img
                      src={mainImage}
                      alt={product.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full rounded-2xl object-cover transition-all duration-300"
                      style={{ height: "460px" }}
                    />
                    {imageList.length > 1 && (
                      <div className="mt-4 grid grid-cols-4 gap-3">
                        {imageList.slice(0, 4).map((src, index) => (
                          <img
                            key={index}
                            src={src}
                            alt={`${product.name} thumbnail ${index + 1}`}
                            loading="lazy"
                            onClick={() => setSelectedImageIndex(index)}
                            className={`h-20 rounded-xl object-cover cursor-pointer transition-all duration-200 ${
                              selectedImageIndex === index
                                ? "ring-2 ring-[var(--color-accent)] opacity-100 scale-105"
                                : "opacity-70 hover:opacity-100"
                            }`}
                            style={{ border: "1px solid var(--color-border)" }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Info Container */}
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-semibold uppercase tracking-[0.25em]"
                      style={{ color: "var(--color-accent)" }}
                    >
                      {product.category}
                    </span>
                    {product.brand && (
                      <span className="text-xs font-medium" style={{ color: "var(--color-muted)" }}>
                        • {product.brand}
                      </span>
                    )}
                  </div>

                  <h1 className="mt-2 text-3xl sm:text-4xl font-bold leading-tight">{product.name}</h1>

                  {/* Rating & Stock status */}
                  <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <FiStar style={{ color: "var(--color-rating)" }} size={18} />
                      <span>{product.rating?.toFixed(1) || "4.5"}</span>
                      <span style={{ color: "var(--color-muted)" }}>
                        ({(product.reviews || 0).toLocaleString("en-IN")} reviews)
                      </span>
                    </div>

                    {isOutOfStock ? (
                      <span className="flex items-center gap-1 font-semibold text-rose-500">
                        <FiAlertCircle /> Out of Stock
                      </span>
                    ) : isLowStock ? (
                      <span className="flex items-center gap-1 font-semibold text-amber-500">
                        <FiAlertCircle /> Only {product.stock} left in stock!
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 font-semibold text-emerald-500">
                        <FiCheckCircle /> In Stock
                      </span>
                    )}
                  </div>

                  {/* Pricing */}
                  <div className="mt-6 flex flex-wrap items-baseline gap-3">
                    <span className="text-3xl font-extrabold">{formatPrice(product.price)}</span>
                    {product.oldPrice && (
                      <span className="text-lg line-through" style={{ color: "var(--color-muted)" }}>
                        {formatPrice(product.oldPrice)}
                      </span>
                    )}
                    {discount > 0 && (
                      <span className="text-sm font-semibold" style={{ color: "var(--color-accent)" }}>
                        Save {discount}%
                      </span>
                    )}
                  </div>

                  {/* EMI Calculator Widget */}
                  <div
                    className="mt-6 rounded-2xl p-4"
                    style={{
                      border: "1px solid var(--color-border)",
                      background: "var(--color-surface-alt)",
                    }}
                  >
                    <div className="flex items-center gap-2 font-semibold text-sm mb-2">
                      <FiCreditCard style={{ color: "var(--color-accent)" }} size={18} />
                      <span>Easy No Cost EMI Options</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="rounded-xl p-2.5" style={{ background: "var(--color-surface)" }}>
                        <p className="font-bold text-sm">{formatPrice(emi3)}/mo</p>
                        <p style={{ color: "var(--color-muted)" }}>3 Months</p>
                      </div>
                      <div className="rounded-xl p-2.5" style={{ background: "var(--color-surface)" }}>
                        <p className="font-bold text-sm">{formatPrice(emi6)}/mo</p>
                        <p style={{ color: "var(--color-muted)" }}>6 Months</p>
                      </div>
                      <div className="rounded-xl p-2.5" style={{ background: "var(--color-surface)" }}>
                        <p className="font-bold text-sm">{formatPrice(emi12)}/mo</p>
                        <p style={{ color: "var(--color-muted)" }}>12 Months</p>
                      </div>
                    </div>
                  </div>

                  {/* Quantity & Action Buttons */}
                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <div
                      className="flex items-center rounded-xl"
                      style={{
                        border: "1px solid var(--color-border)",
                        background: "var(--color-surface)",
                      }}
                    >
                      <button
                        className="px-4 py-3 text-xl transition hover:opacity-75 disabled:opacity-30"
                        disabled={isOutOfStock}
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="min-w-12 px-4 py-3 text-center font-semibold">{quantity}</span>
                      <button
                        className="px-4 py-3 text-xl transition hover:opacity-75 disabled:opacity-30"
                        disabled={isOutOfStock || quantity >= (product?.stock || 1)}
                        onClick={() => setQuantity((q) => Math.min(product?.stock || 1, q + 1))}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    <button
                      className="btn-primary"
                      disabled={isOutOfStock}
                      onClick={() => addToCart(product, quantity)}
                      aria-label={`Add ${product.name} to cart`}
                    >
                      <FiShoppingCart />
                      {isOutOfStock ? "Out of Stock" : "Add to Cart"}
                    </button>

                    <button
                      className="btn-primary"
                      style={{
                        background: "var(--color-secondary)",
                        borderColor: "var(--color-secondary)",
                        color: "#FFFFFF",
                      }}
                      disabled={isOutOfStock}
                      onClick={() => {
                        addToCart(product, quantity);
                        navigate("/checkout");
                      }}
                      aria-label={`Buy ${product.name} now`}
                    >
                      Buy Now
                    </button>

                    <button
                      className="btn-secondary"
                      onClick={() => toggleWishlist(product)}
                      aria-label={isInWishlist(productId) ? "Remove from wishlist" : "Add to wishlist"}
                    >
                      <FiHeart className={isInWishlist(productId) ? "fill-current text-rose-500" : ""} />
                      {isInWishlist(productId) ? "Wishlisted" : "Wishlist"}
                    </button>
                  </div>

                  {/* Trust Features Strip */}
                  <div
                    className="mt-8 grid grid-cols-3 gap-2 rounded-2xl p-4 text-center text-xs"
                    style={{
                      border: "1px solid var(--color-border)",
                      background: "var(--color-surface)",
                    }}
                  >
                    <div className="flex flex-col items-center gap-1.5">
                      <FiTruck size={20} style={{ color: "var(--color-accent)" }} />
                      <span className="font-semibold">Free Delivery</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5">
                      <FiShield size={20} style={{ color: "var(--color-accent)" }} />
                      <span className="font-semibold">3-Year Warranty</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5">
                      <FiRefreshCw size={20} style={{ color: "var(--color-accent)" }} />
                      <span className="font-semibold">Easy Returns</span>
                    </div>
                  </div>

                  {/* Dimensions & Room Fit Highlight */}
                  {(product.specs?.dimensions || product.specs?.seatingCapacity || product.specs?.tvSizeCompatibility || product.specs?.roomType) && (
                    <div
                      className="mt-6 rounded-2xl p-5 border"
                      style={{
                        background: "var(--color-surface-alt)",
                        borderColor: "var(--color-border)",
                      }}
                    >
                      <p className="text-xs uppercase font-bold tracking-wider mb-3" style={{ color: "var(--color-accent)" }}>
                        Dimensions & Room Fit
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                        {product.specs.dimensions && (
                          <div>
                            <span style={{ color: "var(--color-muted)" }} className="block">Overall Sizing</span>
                            <span className="font-bold text-sm" style={{ color: "var(--color-heading)" }}>{product.specs.dimensions}</span>
                          </div>
                        )}
                        {product.specs.tvSizeCompatibility ? (
                          <div>
                            <span style={{ color: "var(--color-muted)" }} className="block">TV Compatibility</span>
                            <span className="font-bold text-sm" style={{ color: "var(--color-heading)" }}>{product.specs.tvSizeCompatibility}</span>
                          </div>
                        ) : product.specs.seatingCapacity && product.specs.seatingCapacity !== "N/A" ? (
                          <div>
                            <span style={{ color: "var(--color-muted)" }} className="block">Seating Capacity</span>
                            <span className="font-bold text-sm" style={{ color: "var(--color-heading)" }}>{product.specs.seatingCapacity}</span>
                          </div>
                        ) : null}
                        {product.specs.roomType && (
                          <div>
                            <span style={{ color: "var(--color-muted)" }} className="block">Ideal Room</span>
                            <span className="font-bold text-sm" style={{ color: "var(--color-heading)" }}>{product.specs.roomType}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tabbed Section: Specs / Description / Reviews */}
              <div className="mt-16">
                <div
                  className="flex border-b"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  <button
                    onClick={() => setActiveTab("specs")}
                    className={`px-6 py-4 font-bold text-base transition border-b-2 ${
                      activeTab === "specs"
                        ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                        : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-heading)]"
                    }`}
                  >
                    Specifications
                  </button>
                  <button
                    onClick={() => setActiveTab("description")}
                    className={`px-6 py-4 font-bold text-base transition border-b-2 ${
                      activeTab === "description"
                        ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                        : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-heading)]"
                    }`}
                  >
                    Description
                  </button>
                  <button
                    onClick={() => setActiveTab("reviews")}
                    className={`px-6 py-4 font-bold text-base transition border-b-2 ${
                      activeTab === "reviews"
                        ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                        : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-heading)]"
                    }`}
                  >
                    Reviews ({(product.reviews || 0).toLocaleString()})
                  </button>
                </div>

                <div
                  className="p-8 rounded-b-2xl"
                  style={{
                    border: "1px solid var(--color-border)",
                    borderTop: "none",
                    background: "var(--color-surface)",
                  }}
                >
                  {activeTab === "specs" && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm border-collapse">
                        <tbody>
                          <tr className="border-b" style={{ borderColor: "var(--color-border)" }}>
                            <td className="py-3.5 px-4 font-semibold w-48" style={{ color: "var(--color-muted)", background: "var(--color-surface-alt)" }}>Collection / Brand</td>
                            <td className="py-3.5 px-4 font-medium">{product.brand || "Furniva Atelier"}</td>
                          </tr>
                          {product.specs?.material && (
                            <tr className="border-b" style={{ borderColor: "var(--color-border)" }}>
                              <td className="py-3.5 px-4 font-semibold" style={{ color: "var(--color-muted)", background: "var(--color-surface-alt)" }}>Material</td>
                              <td className="py-3.5 px-4 font-medium">{product.specs.material}</td>
                            </tr>
                          )}
                          {product.specs?.woodType && (
                            <tr className="border-b" style={{ borderColor: "var(--color-border)" }}>
                              <td className="py-3.5 px-4 font-semibold" style={{ color: "var(--color-muted)", background: "var(--color-surface-alt)" }}>Wood Type</td>
                              <td className="py-3.5 px-4 font-medium">{product.specs.woodType}</td>
                            </tr>
                          )}
                          {product.specs?.upholstery && (
                            <tr className="border-b" style={{ borderColor: "var(--color-border)" }}>
                              <td className="py-3.5 px-4 font-semibold" style={{ color: "var(--color-muted)", background: "var(--color-surface-alt)" }}>Upholstery Fabric</td>
                              <td className="py-3.5 px-4 font-medium">{product.specs.upholstery}</td>
                            </tr>
                          )}
                          {product.specs?.cushionMaterial && (
                            <tr className="border-b" style={{ borderColor: "var(--color-border)" }}>
                              <td className="py-3.5 px-4 font-semibold" style={{ color: "var(--color-muted)", background: "var(--color-surface-alt)" }}>Cushion Filling</td>
                              <td className="py-3.5 px-4 font-medium">{product.specs.cushionMaterial}</td>
                            </tr>
                          )}
                          {product.specs?.color && (
                            <tr className="border-b" style={{ borderColor: "var(--color-border)" }}>
                              <td className="py-3.5 px-4 font-semibold" style={{ color: "var(--color-muted)", background: "var(--color-surface-alt)" }}>Color</td>
                              <td className="py-3.5 px-4 font-medium">{product.specs.color}</td>
                            </tr>
                          )}
                          {product.specs?.dimensions && (
                            <tr className="border-b" style={{ borderColor: "var(--color-border)" }}>
                              <td className="py-3.5 px-4 font-semibold" style={{ color: "var(--color-muted)", background: "var(--color-surface-alt)" }}>Dimensions</td>
                              <td className="py-3.5 px-4 font-medium">{product.specs.dimensions}</td>
                            </tr>
                          )}
                          {product.specs?.width && product.specs?.height && (
                            <tr className="border-b" style={{ borderColor: "var(--color-border)" }}>
                              <td className="py-3.5 px-4 font-semibold" style={{ color: "var(--color-muted)", background: "var(--color-surface-alt)" }}>Width × Height × Depth</td>
                              <td className="py-3.5 px-4 font-medium">
                                {product.specs.width} × {product.specs.height} {product.specs.depth ? `× ${product.specs.depth}` : ""}
                              </td>
                            </tr>
                          )}
                          {product.specs?.weight && (
                            <tr className="border-b" style={{ borderColor: "var(--color-border)" }}>
                              <td className="py-3.5 px-4 font-semibold" style={{ color: "var(--color-muted)", background: "var(--color-surface-alt)" }}>Weight</td>
                              <td className="py-3.5 px-4 font-medium">{product.specs.weight}</td>
                            </tr>
                          )}
                          {product.specs?.tvSizeCompatibility && (
                            <tr className="border-b" style={{ borderColor: "var(--color-border)" }}>
                              <td className="py-3.5 px-4 font-semibold" style={{ color: "var(--color-muted)", background: "var(--color-surface-alt)" }}>TV Size Compatibility</td>
                              <td className="py-3.5 px-4 font-medium">{product.specs.tvSizeCompatibility}</td>
                            </tr>
                          )}
                          {!product.specs?.tvSizeCompatibility && product.specs?.seatingCapacity && product.specs.seatingCapacity !== "N/A" && (
                            <tr className="border-b" style={{ borderColor: "var(--color-border)" }}>
                              <td className="py-3.5 px-4 font-semibold" style={{ color: "var(--color-muted)", background: "var(--color-surface-alt)" }}>Seating Capacity</td>
                              <td className="py-3.5 px-4 font-medium">{product.specs.seatingCapacity}</td>
                            </tr>
                          )}
                          {product.specs?.roomType && (
                            <tr className="border-b" style={{ borderColor: "var(--color-border)" }}>
                              <td className="py-3.5 px-4 font-semibold" style={{ color: "var(--color-muted)", background: "var(--color-surface-alt)" }}>Room Type</td>
                              <td className="py-3.5 px-4 font-medium">{product.specs.roomType}</td>
                            </tr>
                          )}
                          {product.specs?.style && (
                            <tr className="border-b" style={{ borderColor: "var(--color-border)" }}>
                              <td className="py-3.5 px-4 font-semibold" style={{ color: "var(--color-muted)", background: "var(--color-surface-alt)" }}>Design Style</td>
                              <td className="py-3.5 px-4 font-medium">{product.specs.style}</td>
                            </tr>
                          )}
                          {product.specs?.finish && (
                            <tr className="border-b" style={{ borderColor: "var(--color-border)" }}>
                              <td className="py-3.5 px-4 font-semibold" style={{ color: "var(--color-muted)", background: "var(--color-surface-alt)" }}>Finish / Polish</td>
                              <td className="py-3.5 px-4 font-medium">{product.specs.finish}</td>
                            </tr>
                          )}
                          {product.specs?.assemblyRequired && (
                            <tr className="border-b" style={{ borderColor: "var(--color-border)" }}>
                              <td className="py-3.5 px-4 font-semibold" style={{ color: "var(--color-muted)", background: "var(--color-surface-alt)" }}>Assembly</td>
                              <td className="py-3.5 px-4 font-medium">
                                {product.specs.assemblyRequired}
                                {product.specs.assemblyTime ? ` (${product.specs.assemblyTime})` : ""}
                              </td>
                            </tr>
                          )}
                          {product.specs?.careInstructions && (
                            <tr className="border-b" style={{ borderColor: "var(--color-border)" }}>
                              <td className="py-3.5 px-4 font-semibold" style={{ color: "var(--color-muted)", background: "var(--color-surface-alt)" }}>Care Instructions</td>
                              <td className="py-3.5 px-4 font-medium">{product.specs.careInstructions}</td>
                            </tr>
                          )}
                          <tr style={{ borderColor: "var(--color-border)" }}>
                            <td className="py-3.5 px-4 font-semibold" style={{ color: "var(--color-muted)", background: "var(--color-surface-alt)" }}>Warranty</td>
                            <td className="py-3.5 px-4 font-medium">{product.specs?.warranty || "3-Year Structural Frame Warranty"}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {activeTab === "description" && (
                    <div className="space-y-4 leading-relaxed" style={{ color: "var(--color-body)" }}>
                      <p className="text-base font-medium">{product.description}</p>
                      <p className="text-sm" style={{ color: "var(--color-muted)" }}>
                        Crafted with hand-selected materials, artisanal joinery, and premium protective finishes. Every piece is built to endure everyday living while elevating your home with timeless warmth and comfort.
                      </p>
                    </div>
                  )}

                  {activeTab === "reviews" && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="text-4xl font-extrabold">{product.rating?.toFixed(1) || "4.5"}</div>
                        <div>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <FiStar key={i} className="fill-current text-amber-400" size={16} />
                            ))}
                          </div>
                          <p className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>
                            Based on {(product.reviews || 0).toLocaleString()} customer reviews
                          </p>
                        </div>
                      </div>

                      <div className="border-t pt-6 space-y-4" style={{ borderColor: "var(--color-border)" }}>
                        <div className="rounded-xl p-4" style={{ background: "var(--color-surface-alt)" }}>
                          <div className="flex items-center justify-between font-semibold text-sm">
                            <span>Verified Buyer</span>
                            <span className="text-xs" style={{ color: "var(--color-muted)" }}>2 days ago</span>
                          </div>
                          <div className="flex items-center gap-1 mt-1 mb-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <FiStar key={i} className="fill-current text-amber-400" size={12} />
                            ))}
                          </div>
                          <p className="text-sm" style={{ color: "var(--color-body)" }}>
                            Extremely satisfied with this purchase! Fast delivery, original packaging, and works like a charm.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Customers Also Bought (Related Products) */}
              {relatedProducts.length > 0 && (
                <div className="mt-16">
                  <div className="mb-8">
                    <p
                      className="text-sm font-semibold uppercase tracking-[0.3em]"
                      style={{ color: "var(--color-accent)" }}
                    >
                      Frequently Bought Together
                    </p>
                    <h2 className="mt-1 text-3xl font-bold">Customers Also Bought</h2>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {relatedProducts.map((rp) => (
                      <ProductCard key={rp._id || rp.id} product={rp} />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="min-h-[400px] flex items-center justify-center text-lg" style={{ color: "var(--color-danger)" }}>
              Product not found.
            </div>
          )}
        </motion.div>
      </main>

      {/* Sticky Mobile Bottom Bar */}
      {product && (
        <div
          className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between p-4 shadow-2xl backdrop-blur-md"
          style={{
            background: "var(--color-surface)",
            borderTop: "1px solid var(--color-border)",
          }}
        >
          <div>
            <p className="text-xs" style={{ color: "var(--color-muted)" }}>Total Price</p>
            <p className="text-xl font-bold">{formatPrice(product.price * quantity)}</p>
          </div>
          <button
            className="btn-primary px-6 py-3 text-sm font-bold flex items-center gap-2 rounded-xl"
            disabled={isOutOfStock}
            onClick={() => addToCart(product, quantity)}
          >
            <FiShoppingCart size={18} />
            {isOutOfStock ? "Out of Stock" : "Add to Cart"}
          </button>
        </div>
      )}

      <Footer />
    </>
  );
}

export default ProductDetail;
