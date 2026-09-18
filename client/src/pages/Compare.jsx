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
        const data = await getAllProducts();
        const all = Array.isArray(data) ? data : (data?.products || []);
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
      alert("You can compare up to 4 furniture pieces at a time.");
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

  const getFurnitureImg = (product) => {
    return (
      product.images?.[0]?.url ||
      (typeof product.images?.[0] === "string" ? product.images[0] : null) ||
      product.image ||
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80"
    );
  };

  return (
    <>
      <Helmet>
        <title>Compare Furniture – Furniva | Side-by-Side Specifications</title>
        <meta
          name="description"
          content="Side-by-side comparison of furniture pieces: materials, dimensions, style, room type, seating capacity, and craftsmanship warranty."
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
                Design & Dimensions Helper
              </p>
              <h1 className="mt-2 text-4xl font-serif font-bold tracking-tight">
                Compare Furniture
              </h1>
              <p className="mt-2 text-base" style={{ color: "var(--color-muted)" }}>
                Compare wood types, dimensions, room suitability, and finishes side by side.
              </p>
            </div>

            {comparedProducts.length < 4 && (
              <div className="relative">
                <button
                  onClick={() => setSelectorOpen(!selectorOpen)}
                  className="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition shadow-sm"
                  style={{
                    background: "var(--color-accent)",
                    color: "#ffffff",
                  }}
                >
                  <FiPlus size={18} /> Add Furniture to Compare
                </button>

                {selectorOpen && (
                  <div
                    className="absolute right-0 top-14 z-50 w-80 max-h-80 overflow-y-auto rounded-xl p-3 shadow-2xl"
                    style={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    <p className="px-2 py-1 text-xs font-semibold uppercase" style={{ color: "var(--color-muted)" }}>
                      Select a furniture piece
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
                          <span className="truncate pr-2 font-medium">{prod.name}</span>
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
              Loading furniture details...
            </div>
          ) : comparedProducts.length === 0 ? (
            <div
              className="rounded-2xl p-16 text-center"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
              }}
            >
              <h2 className="text-2xl font-serif font-bold">No Furniture Selected</h2>
              <p className="mt-2 text-base" style={{ color: "var(--color-muted)" }}>
                Add items to compare dimensions, materials, and prices side by side.
              </p>
              <Link
                to="/products"
                className="mt-6 inline-block rounded-xl px-6 py-3 text-sm font-semibold transition"
                style={{
                  background: "var(--color-accent)",
                  color: "#ffffff",
                }}
              >
                Browse Furniture Collection
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
                      className="w-52 p-4 font-semibold text-sm"
                      style={{ background: "var(--color-surface-alt)", color: "var(--color-muted)" }}
                    >
                      Specifications
                    </th>
                    {comparedProducts.map((product) => {
                      const isBestPrice = product.price === minPrice && comparedProducts.length > 1;
                      return (
                        <th
                          key={product._id || product.id}
                          className="p-6 align-top min-w-[260px] relative"
                          style={{ borderLeft: "1px solid var(--color-border)" }}
                        >
                          <div className="flex justify-between items-center mb-3">
                            {isBestPrice ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-800/15 text-amber-900 dark:text-amber-300 px-2.5 py-0.5 text-xs font-bold">
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
                            src={getFurnitureImg(product)}
                            alt={product.name}
                            className="h-36 w-full object-cover mb-4 rounded-xl border"
                            style={{ borderColor: "var(--color-border)" }}
                          />
                          <h3 className="font-serif font-bold text-lg leading-snug">{product.name}</h3>
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
                  {/* Price */}
                  <tr>
                    <td className="p-4 font-semibold text-sm" style={{ background: "var(--color-surface-alt)" }}>
                      Price
                    </td>
                    {comparedProducts.map((p) => {
                      const isBest = p.price === minPrice && comparedProducts.length > 1;
                      return (
                        <td
                          key={p._id || p.id}
                          className={`p-4 font-bold ${isBest ? "bg-amber-600/10 text-amber-900 dark:text-amber-200" : ""}`}
                          style={{ borderLeft: "1px solid var(--color-border)" }}
                        >
                          ₹{p.price?.toLocaleString()}
                          {isBest && <span className="ml-2 text-xs uppercase tracking-wider font-extrabold">(Lowest)</span>}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Category */}
                  <tr>
                    <td className="p-4 font-semibold text-sm" style={{ background: "var(--color-surface-alt)" }}>
                      Category
                    </td>
                    {comparedProducts.map((p) => (
                      <td key={p._id || p.id} className="p-4" style={{ borderLeft: "1px solid var(--color-border)" }}>
                        {p.category || "Furniture"}
                      </td>
                    ))}
                  </tr>

                  {/* Material */}
                  <tr>
                    <td className="p-4 font-semibold text-sm" style={{ background: "var(--color-surface-alt)" }}>
                      Primary Material
                    </td>
                    {comparedProducts.map((p) => (
                      <td key={p._id || p.id} className="p-4 font-medium" style={{ borderLeft: "1px solid var(--color-border)" }}>
                        {p.specs?.material || p.specs?.woodType || "Solid Wood / Premium Fabric"}
                      </td>
                    ))}
                  </tr>

                  {/* Dimensions */}
                  <tr>
                    <td className="p-4 font-semibold text-sm" style={{ background: "var(--color-surface-alt)" }}>
                      Dimensions (W x D x H)
                    </td>
                    {comparedProducts.map((p) => (
                      <td key={p._id || p.id} className="p-4 font-medium" style={{ borderLeft: "1px solid var(--color-border)" }}>
                        {p.specs?.dimensions ||
                          (p.specs?.width ? `${p.specs.width} x ${p.specs.depth || "N/A"} x ${p.specs.height || "N/A"}` : "Standard Sizing")}
                      </td>
                    ))}
                  </tr>

                  {/* Color / Finish */}
                  <tr>
                    <td className="p-4 font-semibold text-sm" style={{ background: "var(--color-surface-alt)" }}>
                      Color & Finish
                    </td>
                    {comparedProducts.map((p) => (
                      <td key={p._id || p.id} className="p-4 font-medium" style={{ borderLeft: "1px solid var(--color-border)" }}>
                        {[p.specs?.color, p.specs?.finish].filter(Boolean).join(" • ") || "Natural Walnut Finish"}
                      </td>
                    ))}
                  </tr>

                  {/* Room Type */}
                  <tr>
                    <td className="p-4 font-semibold text-sm" style={{ background: "var(--color-surface-alt)" }}>
                      Recommended Room
                    </td>
                    {comparedProducts.map((p) => (
                      <td key={p._id || p.id} className="p-4 font-medium" style={{ borderLeft: "1px solid var(--color-border)" }}>
                        {p.specs?.roomType || p.category || "Living Room"}
                      </td>
                    ))}
                  </tr>

                  {/* Seating / TV Capacity */}
                  <tr>
                    <td className="p-4 font-semibold text-sm" style={{ background: "var(--color-surface-alt)" }}>
                      Seating / TV Fit
                    </td>
                    {comparedProducts.map((p) => (
                      <td key={p._id || p.id} className="p-4 font-medium" style={{ borderLeft: "1px solid var(--color-border)" }}>
                        {p.specs?.seatingCapacity ? p.specs.seatingCapacity : p.specs?.tvSizeCompatibility ? `TV: ${p.specs.tvSizeCompatibility}` : "—"}
                      </td>
                    ))}
                  </tr>

                  {/* Style */}
                  <tr>
                    <td className="p-4 font-semibold text-sm" style={{ background: "var(--color-surface-alt)" }}>
                      Design Style
                    </td>
                    {comparedProducts.map((p) => (
                      <td key={p._id || p.id} className="p-4 font-medium" style={{ borderLeft: "1px solid var(--color-border)" }}>
                        {p.specs?.style || "Modern Contemporary"}
                      </td>
                    ))}
                  </tr>

                  {/* Assembly */}
                  <tr>
                    <td className="p-4 font-semibold text-sm" style={{ background: "var(--color-surface-alt)" }}>
                      Assembly
                    </td>
                    {comparedProducts.map((p) => (
                      <td key={p._id || p.id} className="p-4 font-medium" style={{ borderLeft: "1px solid var(--color-border)" }}>
                        {p.specs?.assemblyRequired !== undefined
                          ? (p.specs.assemblyRequired ? "Assembly Required (Carpenter Provided)" : "Pre-Assembled")
                          : "Free Professional Installation Provided"}
                      </td>
                    ))}
                  </tr>

                  {/* Rating */}
                  <tr>
                    <td className="p-4 font-semibold text-sm" style={{ background: "var(--color-surface-alt)" }}>
                      Customer Rating
                    </td>
                    {comparedProducts.map((p) => {
                      const isBest = p.rating === maxRating && comparedProducts.length > 1;
                      return (
                        <td
                          key={p._id || p.id}
                          className={`p-4 font-bold ${isBest ? "bg-amber-500/10 text-amber-800 dark:text-amber-300" : ""}`}
                          style={{ borderLeft: "1px solid var(--color-border)" }}
                        >
                          ★ {p.rating} ({p.reviews || 0} reviews)
                          {isBest && <span className="ml-2 text-xs uppercase tracking-wider font-extrabold">(Highest)</span>}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Warranty */}
                  <tr>
                    <td className="p-4 font-semibold text-sm" style={{ background: "var(--color-surface-alt)" }}>
                      Warranty
                    </td>
                    {comparedProducts.map((p) => (
                      <td key={p._id || p.id} className="p-4 font-medium" style={{ borderLeft: "1px solid var(--color-border)" }}>
                        {p.specs?.warranty || "3-Year Craftsmanship Warranty"}
                      </td>
                    ))}
                  </tr>

                  {/* Availability */}
                  <tr>
                    <td className="p-4 font-semibold text-sm" style={{ background: "var(--color-surface-alt)" }}>
                      Availability
                    </td>
                    {comparedProducts.map((p) => (
                      <td key={p._id || p.id} className="p-4" style={{ borderLeft: "1px solid var(--color-border)" }}>
                        {p.stock > 0 ? (
                          <span className="text-emerald-600 font-semibold">In Stock ({p.stock} units)</span>
                        ) : (
                          <span className="text-rose-500 font-semibold">Made to Order</span>
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
