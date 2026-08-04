import { Helmet } from "react-helmet-async";
import { useEffect, useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { FiX, FiPlus, FiCheck, FiAward } from "react-icons/fi";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { getProductById, getAllProducts } from "../services/productService";

function Compare() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawIds = searchParams.get("ids");
  const productIds = useMemo(() => (rawIds ? rawIds.split(",").filter(Boolean) : []), [rawIds]);

  const [comparedProducts, setComparedProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectorOpen, setSelectorOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const all = await getAllProducts();
        setAllProducts(all);

        if (productIds.length > 0) {
          const fetched = await Promise.all(
            productIds.map(async (id) => {
              try {
                return await getProductById(id);
              } catch (e) {
                return null;
              }
            })
          );
          setComparedProducts(fetched.filter(Boolean));
        } else if (all.length >= 2) {
          setComparedProducts([all[0], all[1]]);
          setSearchParams({ ids: `${all[0]._id || all[0].id},${all[1]._id || all[1].id}` });
        } else {
          setComparedProducts(all);
        }
      } catch (err) {
        console.error("Error loading comparison data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [rawIds]);

  const removeProduct = (id) => {
    const updated = comparedProducts.filter((p) => (p._id || p.id) !== id);
    setComparedProducts(updated);
    const newIds = updated.map((p) => p._id || p.id).join(",");
    setSearchParams(newIds ? { ids: newIds } : {});
  };

  const addProduct = (product) => {
    const prodId = product._id || product.id;
    if (comparedProducts.some((p) => (p._id || p.id) === prodId)) return;
    if (comparedProducts.length >= 4) {
      alert("You can compare up to 4 products at a time.");
      return;
    }
    const updated = [...comparedProducts, product];
    setComparedProducts(updated);
    setSearchParams({ ids: updated.map((p) => p._id || p.id).join(",") });
    setSelectorOpen(false);
  };

  // Helper values for spec highlighting
  const minPrice = useMemo(() => {
    if (comparedProducts.length === 0) return 0;
    return Math.min(...comparedProducts.map((p) => p.price || Infinity));
  }, [comparedProducts]);

  const maxRating = useMemo(() => {
    if (comparedProducts.length === 0) return 0;
    return Math.max(...comparedProducts.map((p) => p.rating || 0));
  }, [comparedProducts]);

  // Helper function to extract numeric values from spec strings like "16 GB" or "512 GB SSD"
  const parseNum = (str) => {
    if (!str) return 0;
    const match = str.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };

  const maxRam = useMemo(() => {
    if (comparedProducts.length === 0) return 0;
    return Math.max(...comparedProducts.map((p) => parseNum(p.specs?.ram)));
  }, [comparedProducts]);

  const maxStorage = useMemo(() => {
    if (comparedProducts.length === 0) return 0;
    return Math.max(...comparedProducts.map((p) => parseNum(p.specs?.storage)));
  }, [comparedProducts]);

  return (
    <>
      <Helmet>
        <title>Compare Products – ElectroMart</title>
        <meta
          name="description"
          content="Side-by-side spec comparison of laptops, smartphones, and audio gear with best-value highlighting."
        />
      </Helmet>

      <Navbar />

      <main
        className="min-h-screen px-4 sm:px-8 py-16"
        style={{ background: "var(--color-bg)", color: "var(--color-heading)" }}
      >
        <div className="mx-auto max-w-[1500px]">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p
                className="text-sm font-semibold uppercase tracking-[0.3em]"
                style={{ color: "var(--color-accent)" }}
              >
                Decision Helper
              </p>
              <h1 className="mt-2 text-4xl font-bold">Compare Specifications</h1>
              <p className="mt-2 text-base" style={{ color: "var(--color-muted)" }}>
                Side-by-side specs with best-value highlights
              </p>
            </div>

            {comparedProducts.length < 4 && (
              <div className="relative">
                <button
                  onClick={() => setSelectorOpen(!selectorOpen)}
                  className="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition"
                  style={{
                    background: "var(--color-accent)",
                    color: "#ffffff",
                  }}
                >
                  <FiPlus size={18} /> Add Product to Compare
                </button>

                {selectorOpen && (
                  <div
                    className="absolute right-0 top-14 z-50 w-72 max-h-80 overflow-y-auto rounded-xl p-3 shadow-2xl"
                    style={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    <p className="px-2 py-1 text-xs font-semibold uppercase" style={{ color: "var(--color-muted)" }}>
                      Select a product
                    </p>
                    {allProducts.map((prod) => {
                      const isAlreadyAdded = comparedProducts.some(
                        (p) => (p._id || p.id) === (prod._id || prod.id)
                      );
                      return (
                        <button
                          key={prod._id || prod.id}
                          disabled={isAlreadyAdded}
                          onClick={() => addProduct(prod)}
                          className="flex w-full items-center justify-between rounded-lg p-2 text-left text-sm transition hover:bg-[var(--color-surface-alt)] disabled:opacity-40"
                        >
                          <span className="truncate pr-2">{prod.name}</span>
                          {isAlreadyAdded && <FiCheck size={14} style={{ color: "var(--color-accent)" }} />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {loading ? (
            <div className="py-20 text-center text-lg" style={{ color: "var(--color-muted)" }}>
              Loading comparison data...
            </div>
          ) : comparedProducts.length === 0 ? (
            <div
              className="rounded-2xl p-16 text-center"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
              }}
            >
              <h2 className="text-2xl font-bold">No Products Selected</h2>
              <p className="mt-2 text-base" style={{ color: "var(--color-muted)" }}>
                Add products to start comparing specs and prices.
              </p>
              <Link
                to="/products"
                className="mt-6 inline-block rounded-xl px-6 py-3 text-sm font-semibold transition"
                style={{
                  background: "var(--color-accent)",
                  color: "#ffffff",
                }}
              >
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: "var(--color-border)" }}>
              <table
                className="w-full border-collapse text-left"
                style={{
                  background: "var(--color-surface)",
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <th
                      className="w-48 p-4 font-semibold text-sm"
                      style={{ background: "var(--color-surface-alt)", color: "var(--color-muted)" }}
                    >
                      Features
                    </th>
                    {comparedProducts.map((product) => {
                      const isBestPrice = product.price === minPrice && comparedProducts.length > 1;
                      return (
                        <th
                          key={product._id || product.id}
                          className="p-6 align-top min-w-[240px] relative"
                          style={{ borderLeft: "1px solid var(--color-border)" }}
                        >
                          <div className="flex justify-between items-center mb-3">
                            {isBestPrice ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 text-xs font-bold">
                                <FiAward /> Best Price
                              </span>
                            ) : <span />}
                            <button
                              onClick={() => removeProduct(product._id || product.id)}
                              className="rounded-full p-1 transition hover:bg-[var(--color-surface-alt)]"
                              style={{ color: "var(--color-muted)" }}
                              title="Remove"
                            >
                              <FiX size={18} />
                            </button>
                          </div>
                          <img
                            src={product.images?.[0]?.url || (typeof product.images?.[0] === "string" ? product.images[0] : product.image)}
                            alt={product.name}
                            className="h-32 w-full object-contain mb-4 rounded-lg"
                          />
                          <h3 className="font-bold text-lg leading-snug">{product.name}</h3>
                          <p
                            className="mt-2 text-xl font-extrabold"
                            style={{ color: isBestPrice ? "var(--color-accent)" : "var(--color-heading)" }}
                          >
                            ₹{product.price?.toLocaleString()}
                          </p>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                  {/* Price Row */}
                  <tr>
                    <td className="p-4 font-semibold text-sm" style={{ background: "var(--color-surface-alt)" }}>
                      Price
                    </td>
                    {comparedProducts.map((p) => {
                      const isBest = p.price === minPrice && comparedProducts.length > 1;
                      return (
                        <td
                          key={p._id || p.id}
                          className={`p-4 font-bold ${isBest ? "bg-emerald-500/10 text-emerald-400" : ""}`}
                          style={{ borderLeft: "1px solid var(--color-border)" }}
                        >
                          ₹{p.price?.toLocaleString()}
                          {isBest && <span className="ml-2 text-xs uppercase tracking-wider font-extrabold">(Lowest)</span>}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Brand Row */}
                  <tr>
                    <td className="p-4 font-semibold text-sm" style={{ background: "var(--color-surface-alt)" }}>
                      Brand
                    </td>
                    {comparedProducts.map((p) => (
                      <td key={p._id || p.id} className="p-4 font-medium" style={{ borderLeft: "1px solid var(--color-border)" }}>
                        {p.brand || "N/A"}
                      </td>
                    ))}
                  </tr>

                  {/* Category Row */}
                  <tr>
                    <td className="p-4 font-semibold text-sm" style={{ background: "var(--color-surface-alt)" }}>
                      Category
                    </td>
                    {comparedProducts.map((p) => (
                      <td key={p._id || p.id} className="p-4" style={{ borderLeft: "1px solid var(--color-border)" }}>
                        {p.category}
                      </td>
                    ))}
                  </tr>

                  {/* Rating Row */}
                  <tr>
                    <td className="p-4 font-semibold text-sm" style={{ background: "var(--color-surface-alt)" }}>
                      Rating
                    </td>
                    {comparedProducts.map((p) => {
                      const isBest = p.rating === maxRating && comparedProducts.length > 1;
                      return (
                        <td
                          key={p._id || p.id}
                          className={`p-4 font-bold ${isBest ? "bg-amber-500/10 text-amber-400" : ""}`}
                          style={{ borderLeft: "1px solid var(--color-border)" }}
                        >
                          ★ {p.rating} ({p.reviews || 0} reviews)
                          {isBest && <span className="ml-2 text-xs uppercase tracking-wider font-extrabold">(Highest)</span>}
                        </td>
                      );
                    })}
                  </tr>

                  {/* RAM Row */}
                  <tr>
                    <td className="p-4 font-semibold text-sm" style={{ background: "var(--color-surface-alt)" }}>
                      RAM
                    </td>
                    {comparedProducts.map((p) => {
                      const ramNum = parseNum(p.specs?.ram);
                      const isBest = ramNum > 0 && ramNum === maxRam && comparedProducts.length > 1;
                      return (
                        <td
                          key={p._id || p.id}
                          className={`p-4 font-medium ${isBest ? "bg-emerald-500/10 text-emerald-400 font-bold" : ""}`}
                          style={{ borderLeft: "1px solid var(--color-border)" }}
                        >
                          {p.specs?.ram || "N/A"}
                          {isBest && <span className="ml-2 text-xs font-bold">(Max)</span>}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Storage Row */}
                  <tr>
                    <td className="p-4 font-semibold text-sm" style={{ background: "var(--color-surface-alt)" }}>
                      Storage
                    </td>
                    {comparedProducts.map((p) => {
                      const storeNum = parseNum(p.specs?.storage);
                      const isBest = storeNum > 0 && storeNum === maxStorage && comparedProducts.length > 1;
                      return (
                        <td
                          key={p._id || p.id}
                          className={`p-4 font-medium ${isBest ? "bg-emerald-500/10 text-emerald-400 font-bold" : ""}`}
                          style={{ borderLeft: "1px solid var(--color-border)" }}
                        >
                          {p.specs?.storage || "N/A"}
                          {isBest && <span className="ml-2 text-xs font-bold">(Max)</span>}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Processor Row */}
                  <tr>
                    <td className="p-4 font-semibold text-sm" style={{ background: "var(--color-surface-alt)" }}>
                      Processor
                    </td>
                    {comparedProducts.map((p) => (
                      <td key={p._id || p.id} className="p-4 font-medium" style={{ borderLeft: "1px solid var(--color-border)" }}>
                        {p.specs?.processor || "N/A"}
                      </td>
                    ))}
                  </tr>

                  {/* Screen Size / Display */}
                  <tr>
                    <td className="p-4 font-semibold text-sm" style={{ background: "var(--color-surface-alt)" }}>
                      Display
                    </td>
                    {comparedProducts.map((p) => (
                      <td key={p._id || p.id} className="p-4 font-medium" style={{ borderLeft: "1px solid var(--color-border)" }}>
                        {p.specs?.screenSize || p.specs?.display || "N/A"}
                      </td>
                    ))}
                  </tr>

                  {/* OS Row */}
                  <tr>
                    <td className="p-4 font-semibold text-sm" style={{ background: "var(--color-surface-alt)" }}>
                      OS
                    </td>
                    {comparedProducts.map((p) => (
                      <td key={p._id || p.id} className="p-4 font-medium" style={{ borderLeft: "1px solid var(--color-border)" }}>
                        {p.specs?.os || "N/A"}
                      </td>
                    ))}
                  </tr>

                  {/* Stock Availability */}
                  <tr>
                    <td className="p-4 font-semibold text-sm" style={{ background: "var(--color-surface-alt)" }}>
                      Availability
                    </td>
                    {comparedProducts.map((p) => (
                      <td key={p._id || p.id} className="p-4" style={{ borderLeft: "1px solid var(--color-border)" }}>
                        {p.stock > 0 ? (
                          <span className="text-emerald-500 font-semibold">In Stock ({p.stock})</span>
                        ) : (
                          <span className="text-rose-500 font-semibold">Out of Stock</span>
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}

export default Compare;
