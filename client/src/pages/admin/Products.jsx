import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiPlus, FiEdit2, FiTrash2, FiAlertCircle } from "react-icons/fi";
import { getAllProducts, deleteProduct } from "../../services/productService";

const formatPrice = (val) => `₹${val?.toLocaleString("en-IN") || 0}`;

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const data = await getAllProducts();
        const list = Array.isArray(data) ? data : (data?.products || []);
        setProducts(list);
      } catch (err) {
        setError("Failed to load products list.");
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product? This action is irreversible.")) return;

    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => (p._id || p.id) !== id));
    } catch (err) {
      alert("Failed to delete product. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-lg" style={{ color: "var(--color-muted)" }}>
        Loading products list…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">Products Management</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--color-muted)" }}>
            Create, update, and manage your inventory and product specifications
          </p>
        </div>
        <Link to="/admin/products/new" className="btn-primary flex items-center gap-2 self-start sm:self-auto">
          <FiPlus size={18} /> Add New Product
        </Link>
      </div>

      {error ? (
        <div className="text-rose-500 text-center py-10">{error}</div>
      ) : products.length === 0 ? (
        <div
          className="rounded-3xl p-16 text-center border"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          <h2 className="text-xl font-bold">No Products Found</h2>
          <p className="mt-2 text-sm mb-6" style={{ color: "var(--color-muted)" }}>
            Get started by adding your first furniture piece.
          </p>
          <Link to="/admin/products/new" className="btn-primary inline-flex">
            Add New Furniture Piece
          </Link>
        </div>
      ) : (
        <div
          className="rounded-3xl border overflow-hidden"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr
                  className="border-b text-xs font-bold uppercase tracking-wider"
                  style={{
                    borderColor: "var(--color-border)",
                    color: "var(--color-muted)",
                    background: "var(--color-surface-alt)",
                  }}
                >
                  <th className="py-4 px-6 font-semibold">Product</th>
                  <th className="py-4 px-6 font-semibold">Category</th>
                  <th className="py-4 px-6 font-semibold">Brand</th>
                  <th className="py-4 px-6 font-semibold">Price</th>
                  <th className="py-4 px-6 font-semibold">Stock</th>
                  <th className="py-4 px-6 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                {products.map((p) => {
                  const prodId = p._id || p.id;
                  const isLowStock = p.stock > 0 && p.stock <= 5;
                  const isOutOfStock = p.stock === 0;

                  const imageUrl =
                    p.images?.[0]?.url ||
                    (typeof p.images?.[0] === "string" ? p.images[0] : null) ||
                    "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=100&q=80";

                  return (
                    <tr key={prodId} className="hover:bg-[var(--color-surface-alt)] transition">
                      {/* Name & Image */}
                      <td className="py-4 px-6 flex items-center gap-4">
                        <img
                          src={imageUrl}
                          alt={p.name}
                          className="h-12 w-12 rounded-xl object-cover"
                          style={{ border: "1px solid var(--color-border)" }}
                        />
                        <div className="min-w-0">
                          <p className="font-bold truncate text-sm">{p.name}</p>
                          {p.badge && (
                            <span
                              className="inline-block mt-1 rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wide uppercase text-white"
                              style={{
                                background:
                                  p.badge === "NEW" ? "var(--color-badge-new)" : "var(--color-badge-sale)",
                              }}
                            >
                              {p.badge}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-6 font-medium">{p.category}</td>

                      {/* Brand */}
                      <td className="py-4 px-6 text-[var(--color-body)]">{p.brand || "—"}</td>

                      {/* Price */}
                      <td className="py-4 px-6 font-bold">{formatPrice(p.price)}</td>

                      {/* Stock status */}
                      <td className="py-4 px-6">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-500">
                            <FiAlertCircle /> Out of stock
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-500">
                            <FiAlertCircle /> Low stock ({p.stock})
                          </span>
                        ) : (
                          <span className="text-emerald-500 font-semibold text-xs">{p.stock} units</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            to={`/admin/products/${prodId}/edit`}
                            className="p-2 rounded-lg transition hover:bg-[var(--color-surface-hover)]"
                            style={{ color: "var(--color-accent)" }}
                            title="Edit Product"
                          >
                            <FiEdit2 size={16} />
                          </Link>
                          <button
                            onClick={() => handleDelete(prodId)}
                            className="p-2 rounded-lg transition hover:bg-[var(--color-surface-hover)] text-rose-500"
                            title="Delete Product"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Products;
