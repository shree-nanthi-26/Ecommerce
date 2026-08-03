import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiX, FiPlus, FiCheck } from "react-icons/fi";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { getProductById, getAllProducts } from "../services/productService";

function Compare() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawIds = searchParams.get("ids");
  const productIds = rawIds ? rawIds.split(",").filter(Boolean) : [];

  const [comparedProducts, setComparedProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectorOpen, setSelectorOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Load all products for selector dropdown
        const all = await getAllProducts();
        setAllProducts(all);

        // Fetch products specified in URL
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
        } else {
          // Default to first 2 products if none specified
          if (all.length >= 2) {
            setComparedProducts([all[0], all[1]]);
            setSearchParams({ ids: `${all[0]._id},${all[1]._id}` });
          } else {
            setComparedProducts(all);
          }
        }
      } catch (err) {
        console.error("Error loading products for comparison", err);
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
    if (comparedProducts.some((p) => (p._id || p.id) === (product._id || product.id))) {
      return;
    }
    if (comparedProducts.length >= 4) {
      alert("You can compare up to 4 products at a time.");
      return;
    }
    const updated = [...comparedProducts, product];
    setComparedProducts(updated);
    setSearchParams({ ids: updated.map((p) => p._id || p.id).join(",") });
    setSelectorOpen(false);
  };

  return (
    <>
      <Helmet>
        <title>Compare Products – ElectroMart</title>
        <meta
          name="description"
          content="Compare specifications, features, prices, and ratings of laptops, smartphones, and tech gear side by side."
        />
      </Helmet>

      <Navbar />

      <main
        className="min-h-screen px-8 py-16"
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
                Compare specs side-by-side to make informed decisions
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
            <div className="overflow-x-auto">
              <table
                className="w-full border-collapse text-left"
                style={{
                  border: "1px solid var(--color-border)",
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
                    {comparedProducts.map((product) => (
                      <th
                        key={product._id || product.id}
                        className="p-6 align-top min-w-[240px]"
                        style={{ borderLeft: "1px solid var(--color-border)" }}
                      >
                        <div className="flex justify-end">
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
                          src={product.images?.[0] || product.image}
                          alt={product.name}
                          className="h-32 w-full object-contain mb-4 rounded-lg"
                        />
                        <h3 className="font-bold text-lg leading-snug">{product.name}</h3>
                        <p
                          className="mt-2 text-xl font-extrabold"
                          style={{ color: "var(--color-accent)" }}
                        >
                          ₹{product.price?.toLocaleString()}
                        </p>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                  <tr>
                    <td className="p-4 font-semibold text-sm" style={{ background: "var(--color-surface-alt)" }}>
                      Brand
                    </td>
                    {comparedProducts.map((p) => (
                      <td key={p._id || p.id} className="p-4" style={{ borderLeft: "1px solid var(--color-border)" }}>
                        {p.brand || "N/A"}
                      </td>
                    ))}
                  </tr>
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
                  <tr>
                    <td className="p-4 font-semibold text-sm" style={{ background: "var(--color-surface-alt)" }}>
                      Rating
                    </td>
                    {comparedProducts.map((p) => (
                      <td key={p._id || p.id} className="p-4 font-semibold" style={{ borderLeft: "1px solid var(--color-border)" }}>
                        ★ {p.rating} ({p.reviews || 0} reviews)
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-sm" style={{ background: "var(--color-surface-alt)" }}>
                      Processor
                    </td>
                    {comparedProducts.map((p) => (
                      <td key={p._id || p.id} className="p-4" style={{ borderLeft: "1px solid var(--color-border)" }}>
                        {p.specs?.processor || "N/A"}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-sm" style={{ background: "var(--color-surface-alt)" }}>
                      RAM
                    </td>
                    {comparedProducts.map((p) => (
                      <td key={p._id || p.id} className="p-4" style={{ borderLeft: "1px solid var(--color-border)" }}>
                        {p.specs?.ram || "N/A"}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-sm" style={{ background: "var(--color-surface-alt)" }}>
                      Storage
                    </td>
                    {comparedProducts.map((p) => (
                      <td key={p._id || p.id} className="p-4" style={{ borderLeft: "1px solid var(--color-border)" }}>
                        {p.specs?.storage || "N/A"}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-sm" style={{ background: "var(--color-surface-alt)" }}>
                      Screen Size
                    </td>
                    {comparedProducts.map((p) => (
                      <td key={p._id || p.id} className="p-4" style={{ borderLeft: "1px solid var(--color-border)" }}>
                        {p.specs?.screenSize || "N/A"}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-sm" style={{ background: "var(--color-surface-alt)" }}>
                      OS
                    </td>
                    {comparedProducts.map((p) => (
                      <td key={p._id || p.id} className="p-4" style={{ borderLeft: "1px solid var(--color-border)" }}>
                        {p.specs?.os || "N/A"}
                      </td>
                    ))}
                  </tr>
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
