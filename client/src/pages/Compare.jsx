import SEO from "../components/common/SEO";
import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import {
  FiX,
  FiPlus,
  FiCheck,
  FiAward,
  FiShoppingCart,
  FiZap,
  FiTrash2,
  FiSearch,
  FiStar,
  FiTag,
  FiShield,
  FiTool,
  FiLayers,
  FiSliders,
  FiShare2,
  FiMaximize2,
} from "react-icons/fi";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { getProductById, getAllProducts } from "../services/productService";
import { useCart } from "../context/CartContext";

const MAX_COMPARE_LIMIT = 4;

// The 12 user-requested specifications to compare
const SPEC_DEFINITIONS = [
  {
    id: "price",
    label: "Price",
    description: "Current retail pricing",
    icon: FiTag,
  },
  {
    id: "discount",
    label: "Discount",
    description: "Active savings & markdown",
    icon: FiTag,
  },
  {
    id: "rating",
    label: "Rating",
    description: "Customer verified score",
    icon: FiStar,
  },
  {
    id: "material",
    label: "Material",
    description: "Primary construction & frame",
    icon: FiLayers,
  },
  {
    id: "dimensions",
    label: "Dimensions",
    description: "Width × Depth × Height",
    icon: FiMaximize2,
  },
  {
    id: "color",
    label: "Color",
    description: "Upholstery & wood shade",
    icon: FiSliders,
  },
  {
    id: "seatingCapacity",
    label: "Seating Capacity",
    description: "Accommodates",
    icon: FiLayers,
  },
  {
    id: "style",
    label: "Style",
    description: "Design silhouette & motif",
    icon: FiSliders,
  },
  {
    id: "finish",
    label: "Finish",
    description: "Surface texture & coating",
    icon: FiSliders,
  },
  {
    id: "warranty",
    label: "Warranty",
    description: "Craftsmanship guarantee",
    icon: FiShield,
  },
  {
    id: "assembly",
    label: "Assembly",
    description: "Setup requirement & service",
    icon: FiTool,
  },
  {
    id: "stockStatus",
    label: "Stock Status",
    description: "Inventory availability",
    icon: FiLayers,
  },
];

function getProductImage(product) {
  return (
    product?.images?.[0]?.url ||
    (typeof product?.images?.[0] === "string" ? product.images[0] : null) ||
    (typeof product?.image === "string" ? product.image : product?.image?.url) ||
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80"
  );
}

function getSpecRawValue(specId, product) {
  if (!product) return null;

  switch (specId) {
    case "price": {
      return product.price !== undefined && product.price !== null ? product.price : null;
    }

    case "discount": {
      if (product.oldPrice && product.oldPrice > product.price) {
        const pct = Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
        const saved = product.oldPrice - product.price;
        return {
          pct,
          saved,
          oldPrice: product.oldPrice,
        };
      }
      return null;
    }

    case "rating": {
      if (product.rating !== undefined && product.rating !== null && product.rating > 0) {
        return {
          rating: product.rating,
          reviews: product.reviews || 0,
        };
      }
      return null;
    }

    case "material": {
      const mat =
        product.specs?.material ||
        product.specs?.woodType ||
        product.specs?.upholstery ||
        product.specs?.cushionMaterial;
      return mat ? String(mat).trim() : null;
    }

    case "dimensions": {
      if (product.specs?.dimensions) return String(product.specs.dimensions).trim();
      if (product.specs?.width && product.specs?.height) {
        return `${product.specs.width} × ${product.specs.depth || "—"} × ${product.specs.height}`;
      }
      return null;
    }

    case "color": {
      const col = product.specs?.color;
      return col ? String(col).trim() : null;
    }

    case "seatingCapacity": {
      const seat = product.specs?.seatingCapacity;
      if (seat !== undefined && seat !== null && String(seat).trim() !== "") {
        return String(seat).trim();
      }
      return null;
    }

    case "style": {
      const st = product.specs?.style;
      return st ? String(st).trim() : null;
    }

    case "finish": {
      const fn = product.specs?.finish;
      return fn ? String(fn).trim() : null;
    }

    case "warranty": {
      const wr = product.specs?.warranty;
      return wr ? String(wr).trim() : null;
    }

    case "assembly": {
      if (
        product.specs?.assemblyRequired !== undefined &&
        product.specs?.assemblyRequired !== null &&
        String(product.specs?.assemblyRequired).trim() !== ""
      ) {
        let text =
          typeof product.specs.assemblyRequired === "boolean"
            ? (product.specs.assemblyRequired ? "Assembly Required" : "Pre-Assembled / Ready to Use")
            : String(product.specs.assemblyRequired);
        if (product.specs?.assemblyTime) {
          text += ` (${product.specs.assemblyTime})`;
        }
        return text;
      }
      if (product.specs?.assemblyTime) {
        return `Assembly: ~${product.specs.assemblyTime}`;
      }
      return null;
    }

    case "stockStatus": {
      return product.stock !== undefined && product.stock !== null ? product.stock : null;
    }

    default:
      return null;
  }
}

function normalizeSpecValue(specId, rawVal, product) {
  if (rawVal === null || rawVal === undefined || rawVal === "") return "__empty__";
  switch (specId) {
    case "price":
      return String(rawVal);
    case "discount":
      return rawVal ? `${rawVal.pct}%` : "__empty__";
    case "rating":
      return rawVal ? `${rawVal.rating}` : "__empty__";
    case "seatingCapacity":
      return String(rawVal).toLowerCase().replace(/\s+/g, "");
    case "stockStatus": {
      if (rawVal === 0) return "out_of_stock";
      const threshold = product?.lowStockThreshold || 5;
      if (rawVal <= threshold) return "low_stock";
      return "in_stock";
    }
    default:
      return String(rawVal).trim().toLowerCase();
  }
}

function Compare() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const rawIds = searchParams.get("ids");
  const productIds = useMemo(() => (rawIds ? rawIds.split(",").filter(Boolean) : []), [rawIds]);

  const [comparedProducts, setComparedProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Interaction states
  const [highlightDifferences, setHighlightDifferences] = useState(true);
  const [onlyDifferences, setOnlyDifferences] = useState(false);
  const [addedItems, setAddedItems] = useState({});
  const [shareCopied, setShareCopied] = useState(false);

  // Load product catalog and comparison items
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const data = await getAllProducts({ limit: 100 });
        const all = Array.isArray(data) ? data : (data?.products || []);
        if (!isMounted) return;
        setAllProducts(all);

        if (productIds.length > 0) {
          const fetched = await Promise.all(
            productIds.map(async (id) => {
              try {
                return await getProductById(id);
              } catch {
                return null;
              }
            })
          );
          if (!isMounted) return;
          const valid = fetched.filter(Boolean);
          setComparedProducts(valid);
        } else if (rawIds === null && all.length >= 2) {
          // Pristine initial visit without any ?ids param: default to first 2 items
          const defaultItems = [all[0], all[1]];
          setComparedProducts(defaultItems);
          const defaultIds = defaultItems.map((p) => p._id || p.id).join(",");
          setSearchParams({ ids: defaultIds }, { replace: true });
        } else {
          setComparedProducts([]);
        }
      } catch (err) {
        console.error("Error loading comparison products:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [rawIds]);

  // Remove a product from comparison
  const removeProduct = (id) => {
    const updated = comparedProducts.filter((p) => (p._id || p.id) !== id);
    setComparedProducts(updated);
    const newIds = updated.map((p) => p._id || p.id).join(",");
    setSearchParams({ ids: newIds });
  };

  // Clear all products
  const clearAll = () => {
    setComparedProducts([]);
    setSearchParams({ ids: "" });
  };

  // Add a product to comparison
  const addProduct = (product) => {
    const prodId = product._id || product.id;
    if (comparedProducts.some((p) => (p._id || p.id) === prodId)) return;
    if (comparedProducts.length >= MAX_COMPARE_LIMIT) {
      alert(`You can compare up to ${MAX_COMPARE_LIMIT} furniture pieces at a time.`);
      return;
    }
    const updated = [...comparedProducts, product];
    setComparedProducts(updated);
    setSearchParams({ ids: updated.map((p) => p._id || p.id).join(",") });
    setModalOpen(false);
  };

  // Add to cart handler with visual feedback
  const handleAddToCart = async (product) => {
    const prodId = product._id || product.id;
    if (!product || product.stock === 0) return;
    try {
      await addToCart(product, 1);
      setAddedItems((prev) => ({ ...prev, [prodId]: true }));
      setTimeout(() => {
        setAddedItems((prev) => ({ ...prev, [prodId]: false }));
      }, 1600);
    } catch (err) {
      console.error("Failed to add to cart:", err);
    }
  };

  // Buy Now handler (add to cart and proceed to checkout)
  const handleBuyNow = async (product) => {
    if (!product || product.stock === 0) return;
    try {
      await addToCart(product, 1);
      navigate("/checkout");
    } catch (err) {
      console.error("Failed to buy now:", err);
    }
  };

  // Copy shareable link
  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2500);
  };

  // 1. FILTER SPECIFICATIONS: "Only display specifications that actually exist."
  // If NO compared product has a value for this spec, omit it entirely!
  const existingSpecs = useMemo(() => {
    if (comparedProducts.length === 0) return [];

    return SPEC_DEFINITIONS.filter((spec) => {
      return comparedProducts.some((p) => {
        const val = getSpecRawValue(spec.id, p);
        return val !== null && val !== undefined && val !== "";
      });
    });
  }, [comparedProducts]);

  // 2. HIGHLIGHT DIFFERENCES: Determine which specs differ across compared products
  const differencesMap = useMemo(() => {
    const map = {};
    if (comparedProducts.length <= 1) {
      existingSpecs.forEach((s) => {
        map[s.id] = false;
      });
      return map;
    }

    existingSpecs.forEach((spec) => {
      const normalizedVals = comparedProducts.map((p) =>
        normalizeSpecValue(spec.id, getSpecRawValue(spec.id, p), p)
      );
      // Has difference if any value differs from the first one
      const hasDiff = normalizedVals.some((val) => val !== normalizedVals[0]);
      map[spec.id] = hasDiff;
    });

    return map;
  }, [comparedProducts, existingSpecs]);

  // 3. APPLY "SHOW ONLY DIFFERENCES" TOGGLE
  const displayedSpecs = useMemo(() => {
    if (!onlyDifferences || comparedProducts.length <= 1) {
      return existingSpecs;
    }
    return existingSpecs.filter((spec) => differencesMap[spec.id]);
  }, [existingSpecs, onlyDifferences, differencesMap, comparedProducts.length]);

  // Best-in-class highlights
  const minPrice = useMemo(() => {
    if (comparedProducts.length === 0) return 0;
    return Math.min(...comparedProducts.map((p) => p.price ?? Infinity));
  }, [comparedProducts]);

  const maxRating = useMemo(() => {
    if (comparedProducts.length === 0) return 0;
    return Math.max(...comparedProducts.map((p) => p.rating ?? 0));
  }, [comparedProducts]);

  const maxDiscountPct = useMemo(() => {
    if (comparedProducts.length === 0) return 0;
    return Math.max(
      ...comparedProducts.map((p) => {
        const d = getSpecRawValue("discount", p);
        return d ? d.pct : 0;
      })
    );
  }, [comparedProducts]);

  // Filter catalog for modal picker
  const categoriesList = useMemo(() => {
    const set = new Set();
    allProducts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ["All", ...Array.from(set)];
  }, [allProducts]);

  const filteredCatalog = useMemo(() => {
    return allProducts.filter((p) => {
      const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
      const matchesSearch =
        !searchQuery.trim() ||
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [allProducts, selectedCategory, searchQuery]);

  // Render spec value cells
  const renderSpecCell = (spec, product) => {
    const rawVal = getSpecRawValue(spec.id, product);

    if (rawVal === null || rawVal === undefined || rawVal === "") {
      return (
        <span
          className="text-sm font-normal text-[var(--color-muted)]"
          title="Not specified for this product"
        >
          —
        </span>
      );
    }

    switch (spec.id) {
      case "price": {
        const isBestPrice = rawVal === minPrice && comparedProducts.length > 1;
        return (
          <div className="flex flex-col gap-1">
            <span
              className={`text-lg font-bold ${
                isBestPrice
                  ? "text-[var(--color-accent)] font-extrabold"
                  : "text-[var(--color-heading)]"
              }`}
            >
              ₹{rawVal.toLocaleString("en-IN")}
            </span>
            {isBestPrice && (
              <span className="inline-flex items-center gap-1 w-fit rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-800 dark:text-amber-300 border border-amber-500/25">
                <FiAward size={12} /> Lowest Price
              </span>
            )}
          </div>
        );
      }

      case "discount": {
        const isBestDeal = rawVal.pct === maxDiscountPct && comparedProducts.length > 1;
        return (
          <div className="flex flex-col gap-1 text-sm">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                <FiTag size={12} /> {rawVal.pct}% OFF
              </span>
              {isBestDeal && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-800 dark:text-amber-300 border border-amber-500/25">
                  <FiAward size={12} /> Best Deal
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--color-muted)]">
              Save ₹{rawVal.saved.toLocaleString("en-IN")} (Was ₹{rawVal.oldPrice.toLocaleString("en-IN")})
            </p>
          </div>
        );
      }

      case "rating": {
        const isTopRated = rawVal.rating === maxRating && comparedProducts.length > 1;
        return (
          <div className="flex flex-col gap-1 text-sm">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                <FiStar className="fill-amber-400 stroke-amber-500" size={14} />
                {rawVal.rating.toFixed(1)}
              </span>
              <span className="text-xs text-[var(--color-muted)]">
                ({rawVal.reviews.toLocaleString("en-IN")} reviews)
              </span>
            </div>
            {isTopRated && (
              <span className="inline-flex items-center gap-1 w-fit rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-800 dark:text-amber-300 border border-amber-500/25">
                <FiAward size={12} /> Top Rated
              </span>
            )}
          </div>
        );
      }

      case "material":
        return <span className="font-medium text-sm leading-relaxed">{rawVal}</span>;

      case "dimensions":
        return (
          <span className="font-medium text-sm tracking-wide text-[var(--color-heading)]">
            {rawVal}
          </span>
        );

      case "color":
        return (
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[var(--color-surface-alt)] font-medium text-sm border border-[var(--color-border)]">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-accent)] inline-block shrink-0 shadow-sm" />
            <span>{rawVal}</span>
          </div>
        );

      case "seatingCapacity":
        return (
          <span className="font-semibold text-sm">
            {String(rawVal).toLowerCase().includes("seat") ? rawVal : `${rawVal} Seater`}
          </span>
        );

      case "style":
        return (
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-[var(--color-heading)]">
            {rawVal}
          </span>
        );

      case "finish":
        return <span className="font-medium text-sm">{rawVal}</span>;

      case "warranty":
        return (
          <div className="inline-flex items-center gap-1.5 font-medium text-sm text-[var(--color-heading)]">
            <FiShield className="text-[var(--color-accent)] shrink-0" size={15} />
            <span>{rawVal}</span>
          </div>
        );

      case "assembly":
        return (
          <div className="inline-flex items-center gap-1.5 font-medium text-sm text-[var(--color-heading)]">
            <FiTool className="text-[var(--color-accent)] shrink-0" size={15} />
            <span>{rawVal}</span>
          </div>
        );

      case "stockStatus": {
        const isOut = rawVal === 0;
        const isLow = !isOut && rawVal <= (product.lowStockThreshold || 5);
        if (isOut) {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/25">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              Out of Stock
            </span>
          );
        }
        if (isLow) {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/25">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Low Stock (Only {rawVal} left!)
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/25">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            In Stock ({rawVal} units)
          </span>
        );
      }

      default:
        return <span className="font-medium text-sm">{String(rawVal)}</span>;
    }
  };

  return (
    <>
      <SEO
        title="Compare Furniture Side by Side | Furniva Atelier"
        description="Side-by-side furniture comparison. Compare price, discount, materials, dimensions, style, warranty, and stock across handcrafted models."
        canonicalUrl="/compare"
        breadcrumbs={[
          { name: "Home", item: "/" },
          { name: "Compare Furniture", item: "/compare" },
        ]}
      />

      <Navbar />

      <main
        className="min-h-screen px-4 sm:px-8 py-12"
        style={{ background: "var(--color-bg)", color: "var(--color-heading)" }}
      >
        <div className="mx-auto max-w-[1540px]">
          {/* ── BREADCRUMB ────────────────────────────────────────── */}
          <nav
            aria-label="Breadcrumb"
            className="mb-6 flex items-center gap-2 text-xs sm:text-sm font-medium"
            style={{ color: "var(--color-muted)" }}
          >
            <Link to="/" className="hover:text-[var(--color-heading)] transition">
              Home
            </Link>
            <span>/</span>
            <Link to="/products" className="hover:text-[var(--color-heading)] transition">
              Furniture
            </Link>
            <span>/</span>
            <span className="text-[var(--color-heading)] font-semibold">Compare</span>
          </nav>

          {/* ── HEADER & TOOLBAR ─────────────────────────────────── */}
          <div className="mb-8 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 pb-6 border-b border-[var(--color-border)]">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="text-xs font-bold uppercase tracking-[0.25em] px-2.5 py-1 rounded-md"
                  style={{
                    background: "var(--color-accent-light)",
                    color: "var(--color-accent)",
                  }}
                >
                  Side-by-Side Analysis
                </span>
                <span className="text-xs font-medium text-[var(--color-muted)]">
                  {comparedProducts.length} of {MAX_COMPARE_LIMIT} items selected
                </span>
              </div>
              <h1 className="mt-2 text-3xl sm:text-4xl font-serif font-bold tracking-tight text-[var(--color-heading)]">
                Product Comparison
              </h1>
              <p className="mt-1 text-sm sm:text-base text-[var(--color-muted)] max-w-2xl">
                Compare wood types, dimensions, pricing, and warranties side by side to make an
                informed heirloom furniture choice.
              </p>
            </div>

            {/* Controls Toolbar */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Highlight Differences Toggle */}
              {comparedProducts.length > 1 && (
                <button
                  type="button"
                  onClick={() => setHighlightDifferences(!highlightDifferences)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition border ${
                    highlightDifferences
                      ? "bg-amber-500/15 text-amber-900 dark:text-amber-200 border-amber-500/30 shadow-sm"
                      : "bg-[var(--color-surface)] text-[var(--color-body)] border-[var(--color-border)] hover:bg-[var(--color-surface-alt)]"
                  }`}
                  title="Highlight rows with differing values between products"
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      highlightDifferences ? "bg-amber-600 animate-pulse" : "bg-neutral-400"
                    }`}
                  />
                  Highlight Differences
                </button>
              )}

              {/* Show Only Differences Toggle */}
              {comparedProducts.length > 1 && (
                <button
                  type="button"
                  onClick={() => setOnlyDifferences(!onlyDifferences)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition border ${
                    onlyDifferences
                      ? "bg-[var(--color-accent)] text-white border-[var(--color-accent)] shadow-sm"
                      : "bg-[var(--color-surface)] text-[var(--color-body)] border-[var(--color-border)] hover:bg-[var(--color-surface-alt)]"
                  }`}
                  title="Hide specifications that are identical across all products"
                >
                  <FiSliders size={14} />
                  Only Differences
                </button>
              )}

              {/* Share Button */}
              {comparedProducts.length > 0 && (
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-body)] hover:bg-[var(--color-surface-alt)]"
                  title="Copy shareable link"
                >
                  {shareCopied ? (
                    <>
                      <FiCheck size={15} className="text-emerald-600" />
                      <span className="text-emerald-600 font-bold">Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <FiShare2 size={15} />
                      Share
                    </>
                  )}
                </button>
              )}

              {/* Clear All Button */}
              {comparedProducts.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition text-[var(--color-muted)] hover:text-rose-600 hover:bg-rose-500/10"
                  title="Clear all compared products"
                >
                  <FiTrash2 size={14} />
                  Clear All
                </button>
              )}

              {/* Add Product Button */}
              {comparedProducts.length < MAX_COMPARE_LIMIT && (
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-white transition shadow-sm hover:opacity-95 active:scale-[0.99]"
                  style={{ background: "var(--color-accent)" }}
                >
                  <FiPlus size={16} /> Add Furniture
                </button>
              )}
            </div>
          </div>

          {/* ── MOBILE HORIZONTAL SCROLL NOTICE ─────────────────── */}
          {comparedProducts.length > 1 && (
            <div className="lg:hidden mb-4 flex items-center justify-between px-4 py-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-muted)] shadow-sm">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="text-[var(--color-accent)] font-bold text-base">↔</span>
                Swipe horizontally to compare all {comparedProducts.length} models
              </span>
              <span className="font-semibold text-[var(--color-heading)]">Sticky Specs</span>
            </div>
          )}

          {/* ── ONLY DIFFERENCES NOTICE ─────────────────────────── */}
          {onlyDifferences && comparedProducts.length > 1 && (
            <div className="mb-4 flex items-center justify-between px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs sm:text-sm text-amber-900 dark:text-amber-200">
              <div className="flex items-center gap-2">
                <FiSliders size={16} className="text-amber-700 dark:text-amber-300" />
                <span>
                  Filtering active: showing <strong>{displayedSpecs.length}</strong> specifications
                  with differences (
                  <strong>{existingSpecs.length - displayedSpecs.length}</strong> identical
                  specifications hidden).
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOnlyDifferences(false)}
                className="font-bold underline hover:no-underline ml-3 shrink-0"
              >
                Show All
              </button>
            </div>
          )}

          {/* ── CONTENT AREA ────────────────────────────────────── */}
          {loading ? (
            <div className="py-28 text-center">
              <div className="inline-block w-9 h-9 border-3 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-base font-medium text-[var(--color-muted)]">
                Loading side-by-side specifications...
              </p>
            </div>
          ) : comparedProducts.length === 0 ? (
            /* ── EMPTY STATE ──────────────────────────────────── */
            <div
              className="rounded-3xl p-12 sm:p-20 text-center max-w-2xl mx-auto shadow-sm"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
              }}
            >
              <div
                className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center mb-6"
                style={{ background: "var(--color-accent-light)", color: "var(--color-accent)" }}
              >
                <FiLayers size={36} />
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--color-heading)]">
                No Furniture in Comparison
              </h2>
              <p className="mt-3 text-sm sm:text-base text-[var(--color-muted)] leading-relaxed">
                Add up to 4 furniture pieces to inspect side by side. Compare genuine wood materials,
                exact dimensions, finishes, discounts, warranties, and stock status.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm text-white transition shadow-sm hover:opacity-95"
                  style={{ background: "var(--color-accent)" }}
                >
                  <FiPlus className="inline mr-1.5" size={16} /> Choose Furniture to Compare
                </button>
                <Link
                  to="/products"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-semibold text-sm border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-alt)] transition text-[var(--color-heading)]"
                >
                  Browse Full Collection
                </Link>
              </div>

              {/* Quick suggestions */}
              {allProducts.length >= 3 && (
                <div className="mt-12 pt-8 border-t border-[var(--color-border)] text-left">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-4 text-center sm:text-left">
                    Popular Pieces to Compare:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {allProducts.slice(0, 3).map((prod) => (
                      <button
                        key={prod._id || prod.id}
                        type="button"
                        onClick={() => addProduct(prod)}
                        className="flex items-center gap-3 p-2.5 rounded-xl border border-[var(--color-border)] hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-alt)] transition text-left group"
                      >
                        <img
                          src={getProductImage(prod)}
                          alt={prod.name}
                          className="w-12 h-12 rounded-lg object-cover border border-[var(--color-border)] shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold truncate group-hover:text-[var(--color-accent)] transition">
                            {prod.name}
                          </p>
                          <p className="text-xs font-bold text-[var(--color-heading)]">
                            ₹{prod.price?.toLocaleString("en-IN")}
                          </p>
                        </div>
                        <FiPlus size={16} className="text-[var(--color-accent)] shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ── COMPARISON TABLE ─────────────────────────────── */
            <div
              className="relative rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm overflow-hidden"
            >
              {/* Scrollable Container */}
              <div
                className="overflow-x-auto scrollbar-thin scroll-smooth"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                <table className="w-full border-collapse text-left min-w-[700px]">
                  <thead>
                    <tr className="border-b border-[var(--color-border)]">
                      {/* Sticky Specifications Header Column */}
                      <th
                        scope="col"
                        className="w-48 sm:w-60 md:w-64 p-6 align-bottom sticky left-0 z-20 shadow-[3px_0_10px_rgba(0,0,0,0.05)] dark:shadow-[3px_0_10px_rgba(0,0,0,0.3)]"
                        style={{
                          background: "var(--color-surface)",
                          borderRight: "1px solid var(--color-border)",
                        }}
                      >
                        <div className="space-y-1">
                          <span
                            className="text-xs font-bold uppercase tracking-wider"
                            style={{ color: "var(--color-accent)" }}
                          >
                            Furniva Specs
                          </span>
                          <h2 className="text-lg font-serif font-bold text-[var(--color-heading)]">
                            Features & Details
                          </h2>
                          <p className="text-xs text-[var(--color-muted)]">
                            {existingSpecs.length} active specifications
                          </p>
                        </div>
                      </th>

                      {/* Product Header Cards */}
                      {comparedProducts.map((product) => {
                        const prodId = product._id || product.id;
                        const isBestPrice =
                          product.price === minPrice && comparedProducts.length > 1;
                        const isTopRated =
                          product.rating === maxRating && comparedProducts.length > 1;
                        const isAdded = addedItems[prodId];
                        const isOut = product.stock === 0;

                        return (
                          <th
                            key={prodId}
                            scope="col"
                            className="p-5 sm:p-6 align-top min-w-[270px] sm:min-w-[310px] max-w-[350px] border-r border-[var(--color-border)] last:border-r-0 relative group"
                          >
                            <div className="flex flex-col h-full justify-between">
                              {/* Top Bar: Best Badges & Remove Button */}
                              <div className="flex items-center justify-between gap-2 mb-3 min-h-[26px]">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {isBestPrice && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 text-amber-900 dark:text-amber-300 px-2 py-0.5 text-[11px] font-bold border border-amber-500/25">
                                      <FiAward size={12} /> Best Price
                                    </span>
                                  )}
                                  {isTopRated && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 text-amber-900 dark:text-amber-300 px-2 py-0.5 text-[11px] font-bold border border-amber-500/25">
                                      <FiStar size={12} /> Top Rated
                                    </span>
                                  )}
                                </div>

                                {/* Remove Button */}
                                <button
                                  type="button"
                                  onClick={() => removeProduct(prodId)}
                                  className="rounded-full p-1.5 transition text-[var(--color-muted)] hover:text-rose-600 hover:bg-rose-500/10"
                                  title={`Remove ${product.name} from comparison`}
                                  aria-label={`Remove ${product.name}`}
                                >
                                  <FiX size={18} />
                                </button>
                              </div>

                              {/* Product Thumbnail & Details */}
                              <div className="mb-4">
                                <Link
                                  to={`/products/${prodId}`}
                                  className="block relative overflow-hidden rounded-xl border border-[var(--color-border)] aspect-[4/3] mb-3 group/img bg-[var(--color-surface-alt)]"
                                >
                                  <img
                                    src={getProductImage(product)}
                                    alt={product.name}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105"
                                  />
                                  {product.badge && (
                                    <span
                                      className="absolute top-2 left-2 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md shadow-sm"
                                      style={{
                                        background:
                                          product.badge === "NEW"
                                            ? "var(--color-success)"
                                            : "var(--color-danger)",
                                        color: "#ffffff",
                                      }}
                                    >
                                      {product.badge}
                                    </span>
                                  )}
                                </Link>

                                <span className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider block mb-1">
                                  {product.category || "Furniture"}
                                </span>

                                <Link
                                  to={`/products/${prodId}`}
                                  className="font-serif font-bold text-base sm:text-lg leading-snug line-clamp-2 hover:text-[var(--color-accent)] transition text-[var(--color-heading)]"
                                  title={product.name}
                                >
                                  {product.name}
                                </Link>

                                {/* Price Headline */}
                                <div className="mt-2.5 flex items-baseline gap-2 flex-wrap">
                                  <span className="text-xl sm:text-2xl font-black text-[var(--color-heading)]">
                                    ₹{product.price?.toLocaleString("en-IN")}
                                  </span>
                                  {product.oldPrice && product.oldPrice > product.price && (
                                    <span className="text-xs sm:text-sm line-through text-[var(--color-muted)]">
                                      ₹{product.oldPrice.toLocaleString("en-IN")}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Action Buttons: Add to Cart & Buy Now */}
                              <div className="space-y-2 mt-auto pt-3 border-t border-[var(--color-border)]">
                                {/* Add to Cart */}
                                <button
                                  type="button"
                                  onClick={() => handleAddToCart(product)}
                                  disabled={isOut}
                                  className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                                    isOut
                                      ? "opacity-40 cursor-not-allowed bg-[var(--color-surface-alt)] text-[var(--color-muted)]"
                                      : isAdded
                                      ? "bg-emerald-600 text-white"
                                      : "bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-alt)] text-[var(--color-heading)] shadow-sm"
                                  }`}
                                >
                                  {isOut ? (
                                    <span>Out of Stock</span>
                                  ) : isAdded ? (
                                    <>
                                      <FiCheck size={16} /> Added to Cart!
                                    </>
                                  ) : (
                                    <>
                                      <FiShoppingCart size={15} /> Add to Cart
                                    </>
                                  )}
                                </button>

                                {/* Buy Now */}
                                <button
                                  type="button"
                                  onClick={() => handleBuyNow(product)}
                                  disabled={isOut}
                                  className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 text-white transition-all shadow-sm hover:opacity-95 active:scale-[0.98] ${
                                    isOut ? "opacity-40 cursor-not-allowed" : ""
                                  }`}
                                  style={{
                                    background: isOut
                                      ? "var(--color-muted)"
                                      : "var(--color-accent)",
                                  }}
                                >
                                  <FiZap size={15} /> Buy Now
                                </button>
                              </div>
                            </div>
                          </th>
                        );
                      })}

                      {/* "+ Add to Compare" Empty Column Slot if fewer than max */}
                      {comparedProducts.length < MAX_COMPARE_LIMIT && (
                        <th
                          scope="col"
                          className="p-6 align-middle min-w-[240px] border-r border-[var(--color-border)] last:border-r-0 bg-[var(--color-surface-alt)]/30"
                        >
                          <div className="flex flex-col items-center justify-center h-full min-h-[300px] border-2 border-dashed border-[var(--color-border)] rounded-2xl p-6 text-center hover:border-[var(--color-accent)] transition group">
                            <div
                              className="w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
                              style={{
                                background: "var(--color-accent-light)",
                                color: "var(--color-accent)",
                              }}
                            >
                              <FiPlus size={24} />
                            </div>
                            <h3 className="font-serif font-bold text-base text-[var(--color-heading)]">
                              Add Furniture
                            </h3>
                            <p className="text-xs text-[var(--color-muted)] mt-1 mb-4 max-w-[180px]">
                              Select another piece to compare specifications
                            </p>
                            <button
                              type="button"
                              onClick={() => setModalOpen(true)}
                              className="px-4 py-2 rounded-xl text-xs font-bold text-white transition hover:opacity-95 shadow-sm"
                              style={{ background: "var(--color-accent)" }}
                            >
                              + Pick from Catalog
                            </button>
                          </div>
                        </th>
                      )}
                    </tr>
                  </thead>

                  {/* ── SPECIFICATIONS ROWS ────────────────────────── */}
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {displayedSpecs.length === 0 ? (
                      <tr>
                        <td
                          colSpan={comparedProducts.length + 1}
                          className="p-12 text-center text-sm text-[var(--color-muted)]"
                        >
                          All displayed specifications are identical across compared models.
                          <button
                            type="button"
                            onClick={() => setOnlyDifferences(false)}
                            className="block mx-auto mt-2 font-bold underline text-[var(--color-accent)]"
                          >
                            Disable &quot;Only Differences&quot; to see all specs
                          </button>
                        </td>
                      </tr>
                    ) : (
                      displayedSpecs.map((spec) => {
                        const hasDiff = differencesMap[spec.id];
                        const isRowHighlighted =
                          highlightDifferences && hasDiff && comparedProducts.length > 1;
                        const IconComponent = spec.icon;

                        return (
                          <tr
                            key={spec.id}
                            className={`transition-colors ${
                              isRowHighlighted
                                ? "bg-amber-500/[0.04] dark:bg-amber-400/[0.04]"
                                : "hover:bg-[var(--color-surface-alt)]/25"
                            }`}
                          >
                            {/* Sticky Spec Title Cell */}
                            <td
                              className="p-4 sm:p-5 align-top sticky left-0 z-20 font-semibold text-xs sm:text-sm border-r border-[var(--color-border)] shadow-[3px_0_10px_rgba(0,0,0,0.05)] dark:shadow-[3px_0_10px_rgba(0,0,0,0.3)]"
                              style={{
                                background: isRowHighlighted
                                  ? "var(--color-surface)"
                                  : "var(--color-surface)",
                              }}
                            >
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1.5">
                                  {IconComponent && (
                                    <IconComponent
                                      size={14}
                                      className="text-[var(--color-accent)] shrink-0"
                                    />
                                  )}
                                  <span className="font-bold text-[var(--color-heading)]">
                                    {spec.label}
                                  </span>
                                </div>
                                <span className="text-[11px] font-normal text-[var(--color-muted)] hidden sm:block">
                                  {spec.description}
                                </span>

                                {/* Difference Indicator Pill */}
                                {isRowHighlighted && (
                                  <span className="mt-1 w-fit inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                                    Differs
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Product Spec Values */}
                            {comparedProducts.map((product) => {
                              const prodId = product._id || product.id;
                              return (
                                <td
                                  key={prodId}
                                  className={`p-4 sm:p-5 align-top border-r border-[var(--color-border)] last:border-r-0 ${
                                    isRowHighlighted ? "font-medium" : ""
                                  }`}
                                >
                                  {renderSpecCell(spec, product)}
                                </td>
                              );
                            })}

                            {/* Empty column placeholder if applicable */}
                            {comparedProducts.length < MAX_COMPARE_LIMIT && (
                              <td className="p-4 sm:p-5 align-top border-r border-[var(--color-border)] last:border-r-0 bg-[var(--color-surface-alt)]/20 text-center text-[var(--color-muted)] text-sm">
                                —
                              </td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>

                  {/* ── BOTTOM STICKY ACTION ROW ──────────────────── */}
                  <tfoot>
                    <tr className="border-t-2 border-[var(--color-border)] bg-[var(--color-surface-alt)]/40">
                      <td
                        className="p-5 align-middle sticky left-0 z-20 font-bold text-xs uppercase tracking-wider text-[var(--color-muted)] border-r border-[var(--color-border)]"
                        style={{ background: "var(--color-surface)" }}
                      >
                        Actions
                      </td>
                      {comparedProducts.map((product) => {
                        const prodId = product._id || product.id;
                        const isAdded = addedItems[prodId];
                        const isOut = product.stock === 0;

                        return (
                          <td
                            key={prodId}
                            className="p-5 align-middle border-r border-[var(--color-border)] last:border-r-0"
                          >
                            <div className="flex flex-col gap-2">
                              <button
                                type="button"
                                onClick={() => handleAddToCart(product)}
                                disabled={isOut}
                                className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                                  isOut
                                    ? "opacity-40 cursor-not-allowed bg-[var(--color-surface)] text-[var(--color-muted)]"
                                    : isAdded
                                    ? "bg-emerald-600 text-white"
                                    : "bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-accent)] text-[var(--color-heading)]"
                                }`}
                              >
                                {isAdded ? (
                                  <>
                                    <FiCheck size={14} /> Added!
                                  </>
                                ) : (
                                  <>
                                    <FiShoppingCart size={14} /> Add to Cart
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleBuyNow(product)}
                                disabled={isOut}
                                className="w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 text-white transition hover:opacity-95 disabled:opacity-40"
                                style={{ background: "var(--color-accent)" }}
                              >
                                <FiZap size={14} /> Buy Now
                              </button>

                              <button
                                type="button"
                                onClick={() => removeProduct(prodId)}
                                className="w-full py-1 text-center text-[11px] font-semibold text-[var(--color-muted)] hover:text-rose-600 transition"
                              >
                                Remove from comparison
                              </button>
                            </div>
                          </td>
                        );
                      })}

                      {comparedProducts.length < MAX_COMPARE_LIMIT && (
                        <td className="p-5 border-r border-[var(--color-border)] last:border-r-0 bg-[var(--color-surface-alt)]/20 text-center">
                          <button
                            type="button"
                            onClick={() => setModalOpen(true)}
                            className="text-xs font-bold text-[var(--color-accent)] underline hover:no-underline"
                          >
                            + Add Item
                          </button>
                        </td>
                      )}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── PRODUCT SELECTOR MODAL ─────────────────────────────── */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="compare-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
        >
          <div
            className="w-full max-w-3xl max-h-[85vh] rounded-3xl p-6 sm:p-8 flex flex-col shadow-2xl overflow-hidden border border-[var(--color-border)]"
            style={{ background: "var(--color-surface)", color: "var(--color-heading)" }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)]">
              <div>
                <span
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: "var(--color-accent)" }}
                >
                  Furniture Catalog
                </span>
                <h2 id="compare-modal-title" className="text-xl sm:text-2xl font-serif font-bold">
                  Add Furniture to Compare
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-full text-[var(--color-muted)] hover:text-[var(--color-heading)] hover:bg-[var(--color-surface-alt)] transition"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Search & Category Filter */}
            <div className="py-4 space-y-3">
              <div className="relative">
                <FiSearch
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
                  size={18}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by furniture name, style, or material..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[var(--color-muted)] hover:text-[var(--color-heading)]"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                {categoriesList.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-full font-semibold transition shrink-0 ${
                      selectedCategory === cat
                        ? "bg-[var(--color-accent)] text-white shadow-sm"
                        : "bg-[var(--color-surface-alt)] text-[var(--color-body)] hover:bg-[var(--color-surface)] border border-[var(--color-border)]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Products List */}
            <div className="flex-1 overflow-y-auto pr-1 divide-y divide-[var(--color-border)]">
              {filteredCatalog.length === 0 ? (
                <div className="py-12 text-center text-sm text-[var(--color-muted)]">
                  No furniture pieces match your search. Try different terms.
                </div>
              ) : (
                filteredCatalog.map((prod) => {
                  const prodId = prod._id || prod.id;
                  const isAlreadyAdded = comparedProducts.some(
                    (p) => (p._id || p.id) === prodId
                  );

                  return (
                    <div
                      key={prodId}
                      className="py-3 px-2 flex items-center justify-between gap-4 hover:bg-[var(--color-surface-alt)]/50 rounded-xl transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={getProductImage(prod)}
                          alt={prod.name}
                          className="w-14 h-14 rounded-xl object-cover border border-[var(--color-border)] shrink-0 bg-[var(--color-surface-alt)]"
                        />
                        <div className="min-w-0">
                          <p className="font-serif font-bold text-sm sm:text-base truncate text-[var(--color-heading)]">
                            {prod.name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-[var(--color-muted)] flex-wrap">
                            <span>{prod.category}</span>
                            <span>•</span>
                            <span className="font-bold text-[var(--color-heading)]">
                              ₹{prod.price?.toLocaleString("en-IN")}
                            </span>
                            {prod.specs?.material && (
                              <>
                                <span>•</span>
                                <span className="truncate max-w-[150px]">{prod.specs.material}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isAlreadyAdded}
                        onClick={() => addProduct(prod)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                          isAlreadyAdded
                            ? "bg-[var(--color-surface-alt)] text-[var(--color-muted)] cursor-not-allowed opacity-60 border border-[var(--color-border)]"
                            : "text-white shadow-sm hover:opacity-95 active:scale-95"
                        }`}
                        style={{
                          background: isAlreadyAdded
                            ? undefined
                            : "var(--color-accent)",
                        }}
                      >
                        {isAlreadyAdded ? (
                          <>
                            <FiCheck size={14} /> In Comparison
                          </>
                        ) : (
                          <>
                            <FiPlus size={14} /> Add
                          </>
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-[var(--color-border)] flex items-center justify-between text-xs text-[var(--color-muted)]">
              <span>Comparing up to {MAX_COMPARE_LIMIT} furniture pieces</span>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="font-bold text-[var(--color-heading)] hover:underline"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}

export default Compare;
