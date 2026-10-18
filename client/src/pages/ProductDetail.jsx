import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
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
  FiChevronRight,
  FiChevronLeft,
  FiMapPin,
  FiMaximize2,
  FiShare2,
  FiLayers,
  FiHelpCircle,
  FiCheck,
  FiMinus,
  FiPlus,
  FiX,
  FiArrowRight,
} from "react-icons/fi";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import ProductReviews from "../components/product/ProductReviews";
import FrequentlyBoughtTogether from "../components/product/FrequentlyBoughtTogether";
import ProductRecommendations from "../components/product/ProductRecommendations";
import RecentlyViewed from "../components/home/RecentlyViewed";
import DeliveryChecker from "../components/product/DeliveryChecker";
import { getProductById } from "../services/productService";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import SEO from "../components/common/SEO";
import FurnitureVisualSpecs from "../components/product/FurnitureVisualSpecs";

const formatPrice = (value) => `₹${value?.toLocaleString("en-IN") || 0}`;

const FAQS = [
  {
    q: "Is assembly included with my furniture delivery?",
    a: "Yes! Furniva provides free white-glove delivery and on-site carpenter assembly for all solid wood and upholstered furniture within 24–48 hours of delivery.",
  },
  {
    q: "Will this piece fit through standard doorways and stairwells?",
    a: "Most of our sofas and beds feature modular or removable legs and knocked-down joinery designed to pass through doorways with at least 75 cm (30 inches) of clearance.",
  },
  {
    q: "How do I care for and maintain the upholstery and wood finish?",
    a: "We recommend regular dusting with a soft microfiber cloth and vacuuming fabric creases. Avoid direct prolonged sunlight exposure and wipe liquid spills immediately with a dry cloth.",
  },
  {
    q: "What is covered under the warranty?",
    a: "Our warranty covers structural frame defects, joint stability, and hardware runner mechanisms. Surface wear, regular cushion settling, and accidental fabric cuts are excluded.",
  },
];

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("description");
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState(0);
  const [addingToCartAnimation, setAddingToCartAnimation] = useState(false);

  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const handleRatingUpdated = (newRating, newReviewsCount) => {
    setProduct((prev) =>
      prev ? { ...prev, rating: newRating, reviews: newReviewsCount } : prev
    );
  };

  useEffect(() => {
    async function fetchProductData() {
      try {
        setLoading(true);
        setError(null);
        setSelectedImageIndex(0);
        setQuantity(1);

        const data = await getProductById(id);
        setProduct(data);

        // Save to Recently Viewed in localStorage
        try {
          const raw =
            localStorage.getItem("furniva_recently_viewed") ||
            localStorage.getItem("electromart_recently_viewed");
          localStorage.removeItem("electromart_recently_viewed");
          const stored = JSON.parse(raw || "[]");
          const filtered = stored.filter(
            (item) => (item._id || item.id) !== (data._id || data.id)
          );
          const updated = [data, ...filtered].slice(0, 8);
          localStorage.setItem(
            "furniva_recently_viewed",
            JSON.stringify(updated)
          );
        } catch (e) {
          console.error("Failed to save to recently viewed", e);
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

  useEffect(() => {
    const handleScroll = () => {
      setShowStickyBar(window.scrollY > 550);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const discount =
    product && product.oldPrice && product.oldPrice > product.price
      ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
      : 0;

  const imageList = useMemo(() => {
    return (
      product?.images?.map((img) =>
        typeof img === "string" ? img : img?.url
      ) || []
    ).filter(Boolean);
  }, [product]);

  const mainImage =
    imageList[selectedImageIndex] ||
    imageList[0] ||
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80";

  const productId = product?._id || product?.id;
  const isWishlisted = productId ? isInWishlist(productId) : false;

  const isOutOfStock = product?.stock === 0;
  const isLowStock =
    !isOutOfStock && product?.stock <= (product?.lowStockThreshold || 5);

  const emi3 = product ? Math.round(product.price / 3) : 0;
  const emi6 = product ? Math.round(product.price / 6) : 0;

  const handleAddToCart = () => {
    if (!product || isOutOfStock) return;
    setAddingToCartAnimation(true);
    addToCart(product, quantity);
    setTimeout(() => setAddingToCartAnimation(false), 900);
  };

  const handleBuyNow = () => {
    if (!product || isOutOfStock) return;
    addToCart(product, quantity);
    navigate("/checkout");
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const productMetaDescription = useMemo(() => {
    if (!product) return "";
    const parts = [];
    if (product.description) {
      parts.push(product.description.trim());
    }
    const specs = product.specs || {};
    if (specs.material) parts.push(`Material: ${specs.material}.`);
    if (specs.dimensions) parts.push(`Dimensions: ${specs.dimensions}.`);
    if (specs.roomType) parts.push(`Space: ${specs.roomType}.`);
    if (specs.warranty) parts.push(`Warranty: ${specs.warranty}.`);

    const combined = parts.join(" ");
    return combined.length > 158 ? `${combined.slice(0, 155)}...` : combined;
  }, [product]);

  const breadcrumbsList = useMemo(() => {
    if (!product) return [];
    const crumbs = [
      { name: "Home", item: "/" },
      { name: "Furniture", item: "/products" },
    ];
    if (product.category) {
      crumbs.push({
        name: product.category,
        item: `/products?category=${encodeURIComponent(product.category)}`,
      });
    }
    crumbs.push({
      name: product.name,
      item: `/products/${productId}`,
    });
    return crumbs;
  }, [product, productId]);

  return (
    <>
      {product && (
        <SEO
          title={`${product.name} | Furniva Handcrafted Furniture`}
          description={productMetaDescription}
          canonicalUrl={`/products/${productId}`}
          ogType="product"
          ogImage={mainImage}
          product={product}
          breadcrumbs={breadcrumbsList}
        />
      )}

      <Navbar />

      <main
        className="min-h-screen px-4 sm:px-8 py-8 pb-28 lg:pb-20"
        style={{
          background: "var(--color-bg)",
          color: "var(--color-heading)",
        }}
      >
        <div className="mx-auto max-w-[1500px]">
          {/* ── BREADCRUMB NAVIGATION ───────────────────────────────────── */}
          <nav
            aria-label="Breadcrumb"
            className="mb-8 flex items-center gap-2 text-xs sm:text-sm font-medium flex-wrap"
            style={{ color: "var(--color-muted)" }}
          >
            <Link to="/" className="hover:text-[var(--color-heading)] transition">
              Home
            </Link>
            <FiChevronRight size={13} />
            <Link
              to="/products"
              className="hover:text-[var(--color-heading)] transition"
            >
              Furniture
            </Link>
            {product?.category && (
              <>
                <FiChevronRight size={13} />
                <Link
                  to={`/products?category=${encodeURIComponent(
                    product.category
                  )}`}
                  className="hover:text-[var(--color-heading)] transition"
                >
                  {product.category}
                </Link>
              </>
            )}
            <FiChevronRight size={13} />
            <span
              className="text-[var(--color-heading)] font-semibold truncate max-w-[200px] sm:max-w-none"
              title={product?.name}
            >
              {loading ? "Loading..." : product?.name}
            </span>
          </nav>

          {/* ── LOADING SKELETON STATE ──────────────────────────────────── */}
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-pulse">
              <div className="lg:col-span-7 space-y-4">
                <div
                  className="w-full aspect-[4/3] rounded-3xl"
                  style={{ background: "var(--color-surface-alt)" }}
                />
                <div className="grid grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-24 rounded-2xl"
                      style={{ background: "var(--color-surface-alt)" }}
                    />
                  ))}
                </div>
              </div>
              <div className="lg:col-span-5 space-y-6">
                <div
                  className="h-6 w-32 rounded-lg"
                  style={{ background: "var(--color-surface-alt)" }}
                />
                <div
                  className="h-10 w-3/4 rounded-xl"
                  style={{ background: "var(--color-surface-alt)" }}
                />
                <div
                  className="h-6 w-40 rounded-lg"
                  style={{ background: "var(--color-surface-alt)" }}
                />
                <div
                  className="h-16 w-full rounded-2xl"
                  style={{ background: "var(--color-surface-alt)" }}
                />
                <div
                  className="h-32 w-full rounded-2xl"
                  style={{ background: "var(--color-surface-alt)" }}
                />
              </div>
            </div>
          ) : error ? (
            /* ── ERROR STATE ────────────────────────────────────────── */
            <div
              className="p-12 text-center rounded-3xl border flex flex-col items-center justify-center max-w-xl mx-auto my-12"
              style={{
                background: "var(--color-surface)",
                borderColor: "var(--color-border)",
              }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4 text-rose-500"
                style={{ background: "rgba(239, 68, 68, 0.1)" }}
              >
                <FiAlertCircle size={32} />
              </div>
              <h2 className="text-2xl font-bold mb-2">Item Unavailable</h2>
              <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>
                {error}
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => window.location.reload()}
                  className="btn-secondary px-6 py-2.5 rounded-xl text-sm font-semibold"
                >
                  Reload Page
                </button>
                <Link
                  to="/products"
                  className="btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold"
                >
                  Browse Catalog
                </Link>
              </div>
            </div>
          ) : product ? (
            /* ── MAIN PRODUCT HERO SECTION ──────────────────────────── */
            <>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-14 items-start">
                {/* ── LEFT: IMAGE GALLERY ──────────────────────────────── */}
                <div className="lg:col-span-7 space-y-4">
                  {/* Main Large Image Container */}
                  <div
                    className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-sm flex items-center justify-center group"
                    style={{
                      background: "var(--color-surface-alt)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    <img
                      src={mainImage}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Badge Overlays (NEW / SALE / Discount) */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                      {product.badge && (
                        <span
                          className={`text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-xl shadow-sm ${
                            product.badge === "SALE"
                              ? "bg-rose-500 text-white"
                              : "bg-[var(--color-accent)] text-white"
                          }`}
                        >
                          {product.badge}
                        </span>
                      )}
                      {discount > 0 && (
                        <span className="text-xs font-bold px-3 py-1 rounded-xl bg-amber-500 text-black shadow-sm">
                          {discount}% OFF
                        </span>
                      )}
                    </div>

                    {/* Top Right Quick Actions (Wishlist & Share & Zoom) */}
                    <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                      <button
                        onClick={handleShare}
                        className="p-2.5 rounded-full bg-white/90 dark:bg-black/80 backdrop-blur-md shadow-md text-[var(--color-heading)] hover:scale-110 transition"
                        title="Share product link"
                      >
                        {copiedLink ? (
                          <FiCheck className="text-emerald-500" size={16} />
                        ) : (
                          <FiShare2 size={16} />
                        )}
                      </button>

                      <button
                        onClick={() => toggleWishlist(product)}
                        className="p-2.5 rounded-full bg-white/90 dark:bg-black/80 backdrop-blur-md shadow-md hover:scale-110 transition"
                        title={
                          isWishlisted
                            ? "Remove from Wishlist"
                            : "Add to Wishlist"
                        }
                      >
                        <FiHeart
                          size={17}
                          className={
                            isWishlisted
                              ? "fill-rose-500 text-rose-500"
                              : "text-[var(--color-heading)]"
                          }
                        />
                      </button>

                      <button
                        onClick={() => setIsZoomModalOpen(true)}
                        className="p-2.5 rounded-full bg-white/90 dark:bg-black/80 backdrop-blur-md shadow-md text-[var(--color-heading)] hover:scale-110 transition"
                        title="Full-screen preview"
                      >
                        <FiMaximize2 size={16} />
                      </button>
                    </div>

                    {/* Image Slide Navigation Arrows */}
                    {imageList.length > 1 && (
                      <>
                        <button
                          onClick={() =>
                            setSelectedImageIndex((prev) =>
                              prev === 0 ? imageList.length - 1 : prev - 1
                            )
                          }
                          className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/80 dark:bg-black/70 backdrop-blur-md text-[var(--color-heading)] opacity-0 group-hover:opacity-100 transition shadow-md hover:scale-110"
                          aria-label="Previous Image"
                        >
                          <FiChevronLeft size={20} />
                        </button>
                        <button
                          onClick={() =>
                            setSelectedImageIndex((prev) =>
                              prev === imageList.length - 1 ? 0 : prev + 1
                            )
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/80 dark:bg-black/70 backdrop-blur-md text-[var(--color-heading)] opacity-0 group-hover:opacity-100 transition shadow-md hover:scale-110"
                          aria-label="Next Image"
                        >
                          <FiChevronRight size={20} />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Thumbnail Strip */}
                  {imageList.length > 1 && (
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                      {imageList.map((src, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`relative flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden transition-all duration-200 ${
                            selectedImageIndex === index
                              ? "ring-2 ring-[var(--color-accent)] opacity-100 scale-105"
                              : "opacity-60 hover:opacity-100"
                          }`}
                          style={{
                            border: "1px solid var(--color-border)",
                            background: "var(--color-surface-alt)",
                          }}
                        >
                          <img
                            src={src}
                            alt={`${product.name} angle ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── RIGHT: PRODUCT DETAILS & PURCHASE PANEL ─────────── */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Category & Brand Header */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="text-xs font-bold uppercase tracking-[0.25em]"
                        style={{ color: "var(--color-accent)" }}
                      >
                        {product.category}
                      </span>
                      <span
                        className="text-xs font-semibold"
                        style={{ color: "var(--color-muted)" }}
                      >
                        • {product.brand || "Furniva Atelier"}
                      </span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-[var(--color-heading)]">
                      {product.name}
                    </h1>

                    {/* Rating, Reviews count, and Stock status */}
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab("reviews");
                          document
                            .getElementById("product-tabs-container")
                            ?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="flex items-center gap-1.5 font-bold hover:underline cursor-pointer group"
                      >
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <FiStar
                              key={star}
                              size={15}
                              className={
                                star <= Math.round(product.rating || 4.8)
                                  ? "fill-current"
                                  : "text-neutral-300 dark:text-neutral-700"
                              }
                            />
                          ))}
                        </div>
                        <span className="text-[var(--color-heading)] font-extrabold">
                          {(product.rating || 4.8).toFixed(1)}
                        </span>
                        <span
                          className="font-medium group-hover:text-[var(--color-accent)]"
                          style={{ color: "var(--color-muted)" }}
                        >
                          ({(product.reviews || 0).toLocaleString("en-IN")} reviews)
                        </span>
                      </button>

                      <span
                        className="h-4 w-px"
                        style={{ background: "var(--color-border)" }}
                      />

                      {/* Stock availability badge */}
                      {isOutOfStock ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600">
                          <FiAlertCircle size={13} /> Sold Out
                        </span>
                      ) : isLowStock ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          <FiAlertCircle size={13} /> Only {product.stock} left in
                          stock!
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <FiCheckCircle size={13} /> In Stock & Ready to Ship
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ── PRICE & SAVINGS CARD ──────────────────────────── */}
                  <div
                    className="p-5 sm:p-6 rounded-2xl space-y-3"
                    style={{
                      background: "var(--color-surface-alt)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <span className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--color-heading)]">
                        {formatPrice(product.price)}
                      </span>

                      {product.oldPrice && product.oldPrice > product.price && (
                        <>
                          <span
                            className="text-lg line-through font-semibold"
                            style={{ color: "var(--color-muted)" }}
                          >
                            {formatPrice(product.oldPrice)}
                          </span>

                          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            Save {formatPrice(product.oldPrice - product.price)} (
                            {discount}% OFF)
                          </span>
                        </>
                      )}
                    </div>

                    <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                      Inclusive of all applicable taxes • Free door delivery &
                      white-glove installation
                    </p>

                    {/* EMI Option */}
                    <div
                      className="pt-3 border-t flex items-center justify-between text-xs font-medium"
                      style={{ borderColor: "var(--color-border)" }}
                    >
                      <span className="flex items-center gap-1.5 text-[var(--color-body)]">
                        <FiCreditCard className="text-[var(--color-accent)]" />
                        No-Cost EMI from{" "}
                        <strong className="text-[var(--color-heading)]">
                          {formatPrice(emi3)}/mo
                        </strong>
                      </span>
                      <span style={{ color: "var(--color-muted)" }}>
                        3 or 6 months ({formatPrice(emi6)}/mo)
                      </span>
                    </div>
                  </div>

                  {/* ── COLOR / FINISH HIGHLIGHT (From DB Specs) ────────── */}
                  {(product.specs?.color || product.specs?.finish) && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                        <span>Color & Finish:</span>
                        <span style={{ color: "var(--color-accent)" }}>
                          {product.specs?.color || product.specs?.finish}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div
                          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-2"
                          style={{
                            borderColor: "var(--color-accent)",
                            background: "var(--color-surface)",
                          }}
                        >
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ background: "var(--color-accent)" }}
                          />
                          <span>{product.specs?.color || "Standard"}</span>
                        </div>
                        {product.specs?.finish && (
                          <span
                            className="text-xs px-3 py-1.5 rounded-xl border"
                            style={{
                              borderColor: "var(--color-border)",
                              background: "var(--color-surface)",
                              color: "var(--color-body)",
                            }}
                          >
                            {product.specs.finish}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── QUANTITY SELECTOR & PRIMARY ACTIONS ────────────── */}
                  <div className="space-y-3.5 pt-2">
                    <div className="flex items-center gap-3">
                      {/* Quantity Stepper */}
                      <div
                        className="flex items-center rounded-2xl border p-1"
                        style={{
                          borderColor: "var(--color-border)",
                          background: "var(--color-surface-alt)",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                          disabled={quantity <= 1 || isOutOfStock}
                          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[var(--color-surface)] disabled:opacity-30 transition"
                          aria-label="Decrease quantity"
                        >
                          <FiMinus size={15} />
                        </button>
                        <span className="w-12 text-center font-bold text-sm">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setQuantity((q) =>
                              Math.min(product.stock || 10, q + 1)
                            )
                          }
                          disabled={
                            isOutOfStock || quantity >= (product.stock || 10)
                          }
                          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[var(--color-surface)] disabled:opacity-30 transition"
                          aria-label="Increase quantity"
                        >
                          <FiPlus size={15} />
                        </button>
                      </div>

                      {/* Add to Cart Button */}
                      <button
                        type="button"
                        onClick={handleAddToCart}
                        disabled={isOutOfStock}
                        className="flex-1 py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          background: "var(--color-accent)",
                          color: "#ffffff",
                        }}
                      >
                        {addingToCartAnimation ? (
                          <>
                            <FiCheck size={18} /> Added to Bag!
                          </>
                        ) : (
                          <>
                            <FiShoppingCart size={18} />
                            {isOutOfStock ? "Sold Out" : "Add to Cart"}
                          </>
                        )}
                      </button>
                    </div>

                    {/* Direct Buy Now Button */}
                    <button
                      type="button"
                      onClick={handleBuyNow}
                      disabled={isOutOfStock}
                      className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 border transition-all hover:bg-[var(--color-surface-alt)] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        borderColor: "var(--color-accent)",
                        color: "var(--color-heading)",
                        background: "var(--color-surface)",
                      }}
                    >
                      <FiArrowRight size={17} /> Instant Checkout • Buy Now
                    </button>

                    {/* Compare Tool Link */}
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <Link
                        to={`/compare?ids=${productId}`}
                        className="inline-flex items-center gap-1.5 font-semibold text-[var(--color-body)] hover:text-[var(--color-accent)] transition"
                      >
                        <FiLayers size={14} /> Compare with other models
                      </Link>
                      <span style={{ color: "var(--color-muted)" }}>
                        SKU: FUR-{productId.slice(-6).toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* ── DELIVERY PINCODE CHECKER ───────────────────────── */}
                  <DeliveryChecker product={product} />

                  {/* ── ASSURANCES BADGES GRID ─────────────────────────── */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div
                      className="p-3.5 rounded-xl border flex items-center gap-3"
                      style={{
                        borderColor: "var(--color-border)",
                        background: "var(--color-surface-alt)",
                      }}
                    >
                      <FiTruck
                        size={20}
                        className="text-[var(--color-accent)] flex-shrink-0"
                      />
                      <div>
                        <h4 className="text-xs font-bold">Free Assembly</h4>
                        <p className="text-[11px]" style={{ color: "var(--color-muted)" }}>
                          On Delivery
                        </p>
                      </div>
                    </div>

                    <div
                      className="p-3.5 rounded-xl border flex items-center gap-3"
                      style={{
                        borderColor: "var(--color-border)",
                        background: "var(--color-surface-alt)",
                      }}
                    >
                      <FiShield
                        size={20}
                        className="text-[var(--color-accent)] flex-shrink-0"
                      />
                      <div>
                        <h4 className="text-xs font-bold">
                          {product.specs?.warranty ? "Frame Warranty" : "Authentic Quality"}
                        </h4>
                        <p className="text-[11px]" style={{ color: "var(--color-muted)" }}>
                          {product.specs?.warranty || "100% Handcrafted"}
                        </p>
                      </div>
                    </div>

                    <div
                      className="p-3.5 rounded-xl border flex items-center gap-3"
                      style={{
                        borderColor: "var(--color-border)",
                        background: "var(--color-surface-alt)",
                      }}
                    >
                      <FiRefreshCw
                        size={20}
                        className="text-[var(--color-accent)] flex-shrink-0"
                      />
                      <div>
                        <h4 className="text-xs font-bold">7-Day Return</h4>
                        <p className="text-[11px]" style={{ color: "var(--color-muted)" }}>
                          100% Transit Safe
                        </p>
                      </div>
                    </div>

                    <div
                      className="p-3.5 rounded-xl border flex items-center gap-3"
                      style={{
                        borderColor: "var(--color-border)",
                        background: "var(--color-surface-alt)",
                      }}
                    >
                      <FiCreditCard
                        size={20}
                        className="text-[var(--color-accent)] flex-shrink-0"
                      />
                      <div>
                        <h4 className="text-xs font-bold">Secure Checkout</h4>
                        <p className="text-[11px]" style={{ color: "var(--color-muted)" }}>
                          Razorpay & COD
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── FREQUENTLY BOUGHT TOGETHER SECTION ───────────────── */}
              <div className="mt-16">
                <FrequentlyBoughtTogether
                  productId={productId}
                  currentProduct={product}
                />
              </div>

              {/* ── DEDICATED FURNITURE VISUAL SPECIFICATIONS ────────── */}
              <FurnitureVisualSpecs product={product} />

              {/* ── TABBED CONTENT CONTAINER ─────────────────────────── */}
              <div className="mt-16" id="product-tabs-container">
                {/* Tabs Bar */}
                <div
                  className="flex border-b overflow-x-auto scrollbar-none rounded-t-2xl"
                  style={{
                    borderColor: "var(--color-border)",
                    background: "var(--color-surface-alt)",
                  }}
                >
                  {[
                    { id: "description", label: "Description" },
                    { id: "specs", label: "Specifications" },
                    {
                      id: "reviews",
                      label: `Reviews (${(
                        product.reviews || 0
                      ).toLocaleString()})`,
                    },
                    { id: "qna", label: "Questions & Answers" },
                    { id: "warranty", label: "Warranty" },
                    { id: "returns", label: "Returns & Shipping" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-6 py-4 font-bold text-sm whitespace-nowrap transition border-b-2 ${
                        activeTab === tab.id
                          ? "border-[var(--color-accent)] text-[var(--color-accent)] bg-[var(--color-surface)]"
                          : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-heading)]"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Content Box */}
                <div
                  className="p-6 sm:p-10 rounded-b-2xl"
                  style={{
                    border: "1px solid var(--color-border)",
                    borderTop: "none",
                    background: "var(--color-surface)",
                  }}
                >
                  {/* TAB 1: DESCRIPTION */}
                  {activeTab === "description" && (
                    <div className="space-y-6 max-w-4xl">
                      <div className="space-y-4 leading-relaxed text-sm sm:text-base">
                        <p className="font-semibold text-[var(--color-heading)] text-lg">
                          {product.description}
                        </p>
                        <p style={{ color: "var(--color-body)" }}>
                          Engineered for longevity and supreme ergonomics, every
                          piece from Furniva Atelier is built by master
                          craftsmen using responsibly sourced timber,
                          reinforced corner blocking, and wear-resistant
                          fabrics.
                        </p>
                        <p style={{ color: "var(--color-muted)" }}>
                          Whether you are relaxing with family, hosting guests,
                          or designing an inspired work-from-home corner, this
                          design seamlessly blends functionality with
                          architectural minimalism.
                        </p>
                      </div>

                      {/* Highlighted Specs Checklist */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[var(--color-border)]">
                        {product.specs?.material && (
                          <div className="flex items-start gap-3">
                            <FiCheck className="text-[var(--color-accent)] mt-1 flex-shrink-0" />
                            <div>
                              <strong className="block text-xs uppercase tracking-wider text-[var(--color-muted)]">
                                Material Construction
                              </strong>
                              <span className="text-sm font-medium">
                                {product.specs.material}
                              </span>
                            </div>
                          </div>
                        )}

                        {product.specs?.woodType && (
                          <div className="flex items-start gap-3">
                            <FiCheck className="text-[var(--color-accent)] mt-1 flex-shrink-0" />
                            <div>
                              <strong className="block text-xs uppercase tracking-wider text-[var(--color-muted)]">
                                Solid Timber Frame
                              </strong>
                              <span className="text-sm font-medium">
                                {product.specs.woodType}
                              </span>
                            </div>
                          </div>
                        )}

                        {product.specs?.dimensions && (
                          <div className="flex items-start gap-3">
                            <FiCheck className="text-[var(--color-accent)] mt-1 flex-shrink-0" />
                            <div>
                              <strong className="block text-xs uppercase tracking-wider text-[var(--color-muted)]">
                                Space Sizing
                              </strong>
                              <span className="text-sm font-medium">
                                {product.specs.dimensions}
                              </span>
                            </div>
                          </div>
                        )}

                        {product.specs?.careInstructions && (
                          <div className="flex items-start gap-3">
                            <FiCheck className="text-[var(--color-accent)] mt-1 flex-shrink-0" />
                            <div>
                              <strong className="block text-xs uppercase tracking-wider text-[var(--color-muted)]">
                                Maintenance & Care
                              </strong>
                              <span className="text-sm font-medium">
                                {product.specs.careInstructions}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 2: SPECIFICATIONS */}
                  {activeTab === "specs" && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm border-collapse">
                        <tbody>
                          <tr
                            className="border-b"
                            style={{ borderColor: "var(--color-border)" }}
                          >
                            <td
                              className="py-3.5 px-4 font-semibold w-56"
                              style={{
                                color: "var(--color-muted)",
                                background: "var(--color-surface-alt)",
                              }}
                            >
                              Collection / Brand
                            </td>
                            <td className="py-3.5 px-4 font-medium">
                              {product.brand || "Furniva Atelier"}
                            </td>
                          </tr>

                          {product.category && (
                            <tr
                              className="border-b"
                              style={{ borderColor: "var(--color-border)" }}
                            >
                              <td
                                className="py-3.5 px-4 font-semibold"
                                style={{
                                  color: "var(--color-muted)",
                                  background: "var(--color-surface-alt)",
                                }}
                              >
                                Category
                              </td>
                              <td className="py-3.5 px-4 font-medium">
                                {product.category}
                              </td>
                            </tr>
                          )}

                          {product.specs?.material && (
                            <tr
                              className="border-b"
                              style={{ borderColor: "var(--color-border)" }}
                            >
                              <td
                                className="py-3.5 px-4 font-semibold"
                                style={{
                                  color: "var(--color-muted)",
                                  background: "var(--color-surface-alt)",
                                }}
                              >
                                Primary Material
                              </td>
                              <td className="py-3.5 px-4 font-medium">
                                {product.specs.material}
                              </td>
                            </tr>
                          )}

                          {product.specs?.woodType && (
                            <tr
                              className="border-b"
                              style={{ borderColor: "var(--color-border)" }}
                            >
                              <td
                                className="py-3.5 px-4 font-semibold"
                                style={{
                                  color: "var(--color-muted)",
                                  background: "var(--color-surface-alt)",
                                }}
                              >
                                Wood Species
                              </td>
                              <td className="py-3.5 px-4 font-medium">
                                {product.specs.woodType}
                              </td>
                            </tr>
                          )}

                          {product.specs?.upholstery && (
                            <tr
                              className="border-b"
                              style={{ borderColor: "var(--color-border)" }}
                            >
                              <td
                                className="py-3.5 px-4 font-semibold"
                                style={{
                                  color: "var(--color-muted)",
                                  background: "var(--color-surface-alt)",
                                }}
                              >
                                Upholstery Fabric
                              </td>
                              <td className="py-3.5 px-4 font-medium">
                                {product.specs.upholstery}
                              </td>
                            </tr>
                          )}

                          {product.specs?.cushionMaterial && (
                            <tr
                              className="border-b"
                              style={{ borderColor: "var(--color-border)" }}
                            >
                              <td
                                className="py-3.5 px-4 font-semibold"
                                style={{
                                  color: "var(--color-muted)",
                                  background: "var(--color-surface-alt)",
                                }}
                              >
                                Cushion Padding
                              </td>
                              <td className="py-3.5 px-4 font-medium">
                                {product.specs.cushionMaterial}
                              </td>
                            </tr>
                          )}

                          {product.specs?.color && (
                            <tr
                              className="border-b"
                              style={{ borderColor: "var(--color-border)" }}
                            >
                              <td
                                className="py-3.5 px-4 font-semibold"
                                style={{
                                  color: "var(--color-muted)",
                                  background: "var(--color-surface-alt)",
                                }}
                              >
                                Color Swatch
                              </td>
                              <td className="py-3.5 px-4 font-medium">
                                {product.specs.color}
                              </td>
                            </tr>
                          )}

                          {product.specs?.dimensions && (
                            <tr
                              className="border-b"
                              style={{ borderColor: "var(--color-border)" }}
                            >
                              <td
                                className="py-3.5 px-4 font-semibold"
                                style={{
                                  color: "var(--color-muted)",
                                  background: "var(--color-surface-alt)",
                                }}
                              >
                                Overall Dimensions
                              </td>
                              <td className="py-3.5 px-4 font-medium">
                                {product.specs.dimensions}
                              </td>
                            </tr>
                          )}

                          {product.specs?.width && product.specs?.height && (
                            <tr
                              className="border-b"
                              style={{ borderColor: "var(--color-border)" }}
                            >
                              <td
                                className="py-3.5 px-4 font-semibold"
                                style={{
                                  color: "var(--color-muted)",
                                  background: "var(--color-surface-alt)",
                                }}
                              >
                                Width × Height × Depth
                              </td>
                              <td className="py-3.5 px-4 font-medium">
                                {product.specs.width} × {product.specs.height}{" "}
                                {product.specs.depth
                                  ? `× ${product.specs.depth}`
                                  : ""}
                              </td>
                            </tr>
                          )}

                          {product.specs?.weight && (
                            <tr
                              className="border-b"
                              style={{ borderColor: "var(--color-border)" }}
                            >
                              <td
                                className="py-3.5 px-4 font-semibold"
                                style={{
                                  color: "var(--color-muted)",
                                  background: "var(--color-surface-alt)",
                                }}
                              >
                                Item Weight
                              </td>
                              <td className="py-3.5 px-4 font-medium">
                                {product.specs.weight}
                              </td>
                            </tr>
                          )}

                          {product.specs?.seatingCapacity &&
                            product.specs.seatingCapacity !== "N/A" && (
                              <tr
                                className="border-b"
                                style={{ borderColor: "var(--color-border)" }}
                              >
                                <td
                                  className="py-3.5 px-4 font-semibold"
                                  style={{
                                    color: "var(--color-muted)",
                                    background: "var(--color-surface-alt)",
                                  }}
                                >
                                  Seating Capacity
                                </td>
                                <td className="py-3.5 px-4 font-medium">
                                  {product.specs.seatingCapacity} Person(s)
                                </td>
                              </tr>
                            )}

                          {product.specs?.roomType && (
                            <tr
                              className="border-b"
                              style={{ borderColor: "var(--color-border)" }}
                            >
                              <td
                                className="py-3.5 px-4 font-semibold"
                                style={{
                                  color: "var(--color-muted)",
                                  background: "var(--color-surface-alt)",
                                }}
                              >
                                Recommended Room
                              </td>
                              <td className="py-3.5 px-4 font-medium">
                                {product.specs.roomType}
                              </td>
                            </tr>
                          )}

                          {product.specs?.style && (
                            <tr
                              className="border-b"
                              style={{ borderColor: "var(--color-border)" }}
                            >
                              <td
                                className="py-3.5 px-4 font-semibold"
                                style={{
                                  color: "var(--color-muted)",
                                  background: "var(--color-surface-alt)",
                                }}
                              >
                                Aesthetic Style
                              </td>
                              <td className="py-3.5 px-4 font-medium">
                                {product.specs.style}
                              </td>
                            </tr>
                          )}

                          {product.specs?.finish && (
                            <tr
                              className="border-b"
                              style={{ borderColor: "var(--color-border)" }}
                            >
                              <td
                                className="py-3.5 px-4 font-semibold"
                                style={{
                                  color: "var(--color-muted)",
                                  background: "var(--color-surface-alt)",
                                }}
                              >
                                Protective Finish
                              </td>
                              <td className="py-3.5 px-4 font-medium">
                                {product.specs.finish}
                              </td>
                            </tr>
                          )}

                          {product.specs?.assemblyRequired && (
                            <tr
                              className="border-b"
                              style={{ borderColor: "var(--color-border)" }}
                            >
                              <td
                                className="py-3.5 px-4 font-semibold"
                                style={{
                                  color: "var(--color-muted)",
                                  background: "var(--color-surface-alt)",
                                }}
                              >
                                Assembly Status
                              </td>
                              <td className="py-3.5 px-4 font-medium">
                                {product.specs.assemblyRequired}{" "}
                                {product.specs.assemblyTime
                                  ? `(${product.specs.assemblyTime})`
                                  : ""}
                              </td>
                            </tr>
                          )}

                          {product.specs?.warranty && (
                            <tr style={{ borderColor: "var(--color-border)" }}>
                              <td
                                className="py-3.5 px-4 font-semibold"
                                style={{
                                  color: "var(--color-muted)",
                                  background: "var(--color-surface-alt)",
                                }}
                              >
                                Standard Warranty
                              </td>
                              <td className="py-3.5 px-4 font-medium text-emerald-600 dark:text-emerald-400 font-semibold">
                                {product.specs.warranty}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* TAB 3: REVIEWS */}
                  {activeTab === "reviews" && (
                    <ProductReviews
                      productId={productId}
                      fallbackRating={product.rating}
                      fallbackReviewsCount={product.reviews}
                      onRatingUpdated={handleRatingUpdated}
                    />
                  )}

                  {/* TAB 4: QUESTIONS & ANSWERS */}
                  {activeTab === "qna" && (
                    <div className="space-y-6 max-w-4xl">
                      <div>
                        <h3 className="text-xl font-bold text-[var(--color-heading)]">
                          Frequently Asked Customer Questions
                        </h3>
                        <p
                          className="text-xs mt-1"
                          style={{ color: "var(--color-muted)" }}
                        >
                          Have inquiries before placing your order? Check our
                          verified answers below.
                        </p>
                      </div>

                      <div className="space-y-3">
                        {FAQS.map((faq, idx) => (
                          <div
                            key={idx}
                            className="rounded-2xl border transition"
                            style={{
                              borderColor: "var(--color-border)",
                              background: "var(--color-surface-alt)",
                            }}
                          >
                            <button
                              onClick={() =>
                                setExpandedFaqIndex(
                                  expandedFaqIndex === idx ? -1 : idx
                                )
                              }
                              className="w-full text-left p-4 sm:p-5 font-bold text-sm flex items-center justify-between gap-4"
                            >
                              <span className="flex items-center gap-2">
                                <FiHelpCircle className="text-[var(--color-accent)] flex-shrink-0" />
                                <span>{faq.q}</span>
                              </span>
                              <FiChevronRight
                                size={16}
                                className={`transform transition-transform ${
                                  expandedFaqIndex === idx ? "rotate-90" : ""
                                }`}
                              />
                            </button>

                            {expandedFaqIndex === idx && (
                              <div
                                className="px-5 pb-5 text-sm leading-relaxed border-t pt-3"
                                style={{
                                  borderColor: "var(--color-border)",
                                  color: "var(--color-body)",
                                }}
                              >
                                {faq.a}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <div
                        className="p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4"
                        style={{
                          borderColor: "var(--color-border)",
                          background: "var(--color-surface)",
                        }}
                      >
                        <div>
                          <h4 className="font-bold text-sm">
                            Need customized sizing or interior guidance?
                          </h4>
                          <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                            Our furniture designers are available Mon–Sat, 9AM to
                            8PM.
                          </p>
                        </div>
                        <Link
                          to="/support"
                          className="btn-secondary px-5 py-2 text-xs rounded-xl font-bold whitespace-nowrap"
                        >
                          Chat With Support
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* TAB 5: WARRANTY */}
                  {activeTab === "warranty" && (
                    <div className="space-y-6 max-w-4xl text-sm leading-relaxed">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-[var(--color-accent)]"
                          style={{ background: "var(--color-surface-alt)" }}
                        >
                          <FiShield size={24} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-[var(--color-heading)]">
                            {product.specs?.warranty || "Furniva Authentic Craftsmanship Guarantee"}
                          </h3>
                          <p
                            className="text-xs"
                            style={{ color: "var(--color-muted)" }}
                          >
                            Furniva Guarantee of Authentic Craftsmanship
                          </p>
                        </div>
                      </div>

                      <div
                        className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 rounded-2xl border"
                        style={{
                          borderColor: "var(--color-border)",
                          background: "var(--color-surface-alt)",
                        }}
                      >
                        <div className="space-y-2">
                          <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
                            <FiCheckCircle size={14} /> What is Covered
                          </h4>
                          <ul
                            className="list-disc list-inside space-y-1 text-xs"
                            style={{ color: "var(--color-body)" }}
                          >
                            <li>Kiln-dried solid wood structural frame cracking</li>
                            <li>Joinery, mortise-and-tenon joint loosening</li>
                            <li>Drawer runner track and soft-close hinge hardware</li>
                            <li>Pocket spring resilience and steel support webbing</li>
                          </ul>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-bold text-xs uppercase tracking-wider text-rose-500 flex items-center gap-1.5">
                            <FiAlertCircle size={14} /> What is Excluded
                          </h4>
                          <ul
                            className="list-disc list-inside space-y-1 text-xs"
                            style={{ color: "var(--color-body)" }}
                          >
                            <li>Natural timber grain knots and minor color variances</li>
                            <li>Normal fabric fading due to direct UV sunlight</li>
                            <li>Damage caused by chemical cleaners or pet claws</li>
                          </ul>
                        </div>
                      </div>

                      <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                        For warranty claim registration, simply navigate to your{" "}
                        <Link
                          to="/orders"
                          className="underline font-bold text-[var(--color-heading)]"
                        >
                          My Orders
                        </Link>{" "}
                        section or contact our support team with your Invoice ID.
                      </p>
                    </div>
                  )}

                  {/* TAB 6: RETURNS */}
                  {activeTab === "returns" && (
                    <div className="space-y-6 max-w-4xl text-sm leading-relaxed">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-[var(--color-accent)]"
                          style={{ background: "var(--color-surface-alt)" }}
                        >
                          <FiRefreshCw size={24} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-[var(--color-heading)]">
                            7-Day Doorstep Return & Exchange Policy
                          </h3>
                          <p
                            className="text-xs"
                            style={{ color: "var(--color-muted)" }}
                          >
                            100% Risk-Free Home Trial & Free Doorstep Pickup
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div
                          className="p-4 rounded-xl border flex items-start gap-3"
                          style={{
                            borderColor: "var(--color-border)",
                            background: "var(--color-surface-alt)",
                          }}
                        >
                          <span className="w-6 h-6 rounded-full bg-[var(--color-accent)] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                            1
                          </span>
                          <div>
                            <strong className="block text-xs font-bold">
                              Pre-Assembly Inspection on Delivery
                            </strong>
                            <p
                              className="text-xs mt-0.5"
                              style={{ color: "var(--color-muted)" }}
                            >
                              Our carpenter will unbox and inspect the product in
                              your presence. If there is any shipping blemish, you
                              can reject it immediately with zero cost.
                            </p>
                          </div>
                        </div>

                        <div
                          className="p-4 rounded-xl border flex items-start gap-3"
                          style={{
                            borderColor: "var(--color-border)",
                            background: "var(--color-surface-alt)",
                          }}
                        >
                          <span className="w-6 h-6 rounded-full bg-[var(--color-accent)] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                            2
                          </span>
                          <div>
                            <strong className="block text-xs font-bold">
                              7-Day Return Window
                            </strong>
                            <p
                              className="text-xs mt-0.5"
                              style={{ color: "var(--color-muted)" }}
                            >
                              If the piece does not fit your room or match your
                              decor, initiate a return request from your dashboard
                              within 7 days.
                            </p>
                          </div>
                        </div>

                        <div
                          className="p-4 rounded-xl border flex items-start gap-3"
                          style={{
                            borderColor: "var(--color-border)",
                            background: "var(--color-surface-alt)",
                          }}
                        >
                          <span className="w-6 h-6 rounded-full bg-[var(--color-accent)] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                            3
                          </span>
                          <div>
                            <strong className="block text-xs font-bold">
                              Instant 100% Refund
                            </strong>
                            <p
                              className="text-xs mt-0.5"
                              style={{ color: "var(--color-muted)" }}
                            >
                              Refund is initiated to your original payment method
                              immediately upon pickup inspection.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── SIMILAR PRODUCTS RECOMMENDATION ─────────────────── */}
              <ProductRecommendations
                type="similar"
                productId={productId}
                limit={4}
              />

              {/* ── CUSTOMERS ALSO BOUGHT RECOMMENDATION ────────────── */}
              <ProductRecommendations
                type="also_bought"
                productId={productId}
                limit={4}
              />

              {/* ── RECENTLY VIEWED CAROUSEL ───────────────────────── */}
              <RecentlyViewed />
            </>
          ) : null}
        </div>
      </main>

      {/* ── STICKY PURCHASE BAR ─────────────────────────────────────── */}
      <AnimatePresence>
        {showStickyBar && product && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-0 left-0 right-0 z-40 p-3 sm:p-4 backdrop-blur-xl shadow-2xl border-t"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border)",
            }}
          >
            <div className="mx-auto max-w-[1500px] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={mainImage}
                  alt={product.name}
                  className="w-12 h-12 rounded-xl object-cover border border-[var(--color-border)] flex-shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold truncate text-[var(--color-heading)]">
                    {product.name}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-sm sm:text-base font-extrabold text-[var(--color-heading)]">
                      {formatPrice(product.price * quantity)}
                    </span>
                    {quantity > 1 && (
                      <span className="text-[11px]" style={{ color: "var(--color-muted)" }}>
                        ({formatPrice(product.price)} each)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => toggleWishlist(product)}
                  className="p-2.5 rounded-xl border hover:bg-[var(--color-surface-alt)] transition hidden sm:flex"
                  title="Wishlist"
                >
                  <FiHeart
                    size={17}
                    className={
                      isWishlisted
                        ? "fill-rose-500 text-rose-500"
                        : "text-[var(--color-heading)]"
                    }
                  />
                </button>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className="px-4 sm:px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition hover:scale-[1.02] disabled:opacity-50"
                  style={{
                    background: "var(--color-accent)",
                    color: "#ffffff",
                  }}
                >
                  <FiShoppingCart size={16} />
                  <span>{isOutOfStock ? "Sold Out" : "Add to Cart"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                  className="px-4 sm:px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm border transition hover:bg-[var(--color-surface-alt)] hidden md:flex items-center gap-1.5 disabled:opacity-50"
                  style={{
                    borderColor: "var(--color-accent)",
                    color: "var(--color-heading)",
                  }}
                >
                  <span>Buy Now</span>
                  <FiArrowRight size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FULL-SCREEN PHOTO ZOOM MODAL ─────────────────────────────── */}
      <AnimatePresence>
        {isZoomModalOpen && (
          <div
            onClick={() => setIsZoomModalOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md cursor-zoom-out"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-5xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsZoomModalOpen(false)}
                className="absolute top-4 right-4 bg-black/70 hover:bg-black text-white p-2.5 rounded-full transition z-10"
              >
                <FiX size={22} />
              </button>
              <img
                src={mainImage}
                alt={`${product?.name} Full Size`}
                className="w-full h-full max-h-[85vh] object-contain rounded-3xl"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </>
  );
}
