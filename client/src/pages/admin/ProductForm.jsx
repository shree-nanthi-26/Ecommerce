import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { FiArrowLeft, FiSave, FiUpload, FiRefreshCw } from "react-icons/fi";
import { getProductById, createProduct, updateProduct } from "../../services/productService";
import { uploadSingleImage } from "../../services/uploadService";

function ProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    category: "Mobiles",
    brand: "",
    price: "",
    oldPrice: "",
    stock: "",
    description: "",
    badge: null,
    isNewProduct: false,
    isBestseller: false,
    images: [],
    specs: {
      ram: "",
      storage: "",
      screenSize: "",
      processor: "",
      os: "",
      display: "",
      battery: "",
      ports: "",
      warranty: "",
    },
  });

  useEffect(() => {
    async function loadProduct() {
      if (!isEdit) return;
      try {
        setFetching(true);
        const data = await getProductById(id);
        setFormData({
          name: data.name || "",
          category: data.category || "Mobiles",
          brand: data.brand || "",
          price: data.price || "",
          oldPrice: data.oldPrice || "",
          stock: data.stock || "",
          description: data.description || "",
          badge: data.badge || null,
          isNewProduct: data.isNewProduct || false,
          isBestseller: data.isBestseller || false,
          images: data.images || [],
          specs: {
            ram: data.specs?.ram || "",
            storage: data.specs?.storage || "",
            screenSize: data.specs?.screenSize || "",
            processor: data.specs?.processor || "",
            os: data.specs?.os || "",
            display: data.specs?.display || "",
            battery: data.specs?.battery || "",
            ports: data.specs?.ports || "",
            warranty: data.specs?.warranty || "",
          },
        });
      } catch (err) {
        setError("Failed to load product details for editing.");
      } finally {
        setFetching(false);
      }
    }
    loadProduct();
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSpecChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      specs: {
        ...prev.specs,
        [name]: value,
      },
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const res = await uploadSingleImage(file);
      // res contains { url, publicId }
      setFormData((prev) => ({
        ...prev,
        images: [{ url: res.url, publicId: res.publicId }],
      }));
    } catch (err) {
      alert("Failed to upload image. Make sure server & Cloudinary configurations are correct.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.price || !formData.category) {
      alert("Please fill in Name, Category, and Price.");
      return;
    }

    try {
      setLoading(true);
      const submissionData = {
        ...formData,
        price: Number(formData.price),
        oldPrice: formData.oldPrice ? Number(formData.oldPrice) : undefined,
        stock: Number(formData.stock || 0),
      };

      if (isEdit) {
        await updateProduct(id, submissionData);
      } else {
        await createProduct(submissionData);
      }
      navigate("/admin/products");
    } catch (err) {
      alert("Failed to save product. Check database connection.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-lg animate-pulse" style={{ color: "var(--color-muted)" }}>
        Fetching product information…
      </div>
    );
  }

  const mainImageUrl = formData.images?.[0]?.url || "";

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Top navigation header */}
      <div className="flex items-center gap-4">
        <Link
          to="/admin/products"
          className="p-2.5 rounded-xl border flex items-center justify-center transition hover:bg-[var(--color-surface-hover)]"
          style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}
        >
          <FiArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold">{isEdit ? "Edit Product" : "Add New Product"}</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--color-muted)" }}>
            Fill in the information below to {isEdit ? "edit an existing" : "register a new"} tech product
          </p>
        </div>
      </div>

      {error && <div className="text-rose-500 text-center py-6">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic specifications grid */}
        <div
          className="rounded-3xl p-6 sm:p-8 border space-y-6"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          <h3 className="font-bold text-lg border-b pb-3" style={{ borderColor: "var(--color-border)" }}>
            General Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="name-input" className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                Product Name *
              </label>
              <input
                id="name-input"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="footer__newsletter-input"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="category-select" className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                Category *
              </label>
              <select
                id="category-select"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="footer__newsletter-input"
                style={{ background: "var(--color-surface-alt)" }}
              >
                {["Mobiles", "Laptops", "Audio", "Wearables", "Cameras", "Speakers"].map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="brand-input" className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                Brand Name
              </label>
              <input
                id="brand-input"
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                className="footer__newsletter-input"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="stock-input" className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                Quantity in Stock
              </label>
              <input
                id="stock-input"
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                className="footer__newsletter-input"
                min="0"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="price-input" className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                Selling Price (₹) *
              </label>
              <input
                id="price-input"
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="footer__newsletter-input"
                required
                min="1"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="old-price-input" className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                Original/Old Price (₹)
              </label>
              <input
                id="old-price-input"
                type="number"
                name="oldPrice"
                value={formData.oldPrice}
                onChange={handleChange}
                className="footer__newsletter-input"
                min="1"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="badge-select" className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                Product Badge / Tag
              </label>
              <select
                id="badge-select"
                name="badge"
                value={formData.badge || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    badge: e.target.value === "" ? null : e.target.value,
                  }))
                }
                className="footer__newsletter-input"
                style={{ background: "var(--color-surface-alt)" }}
              >
                <option value="">None</option>
                <option value="NEW">New</option>
                <option value="SALE">Sale</option>
              </select>
            </div>

            <div className="flex items-center gap-6 mt-6">
              <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  name="isNewProduct"
                  checked={formData.isNewProduct}
                  onChange={handleChange}
                  className="rounded accent-[var(--color-accent)]"
                />
                <span>Set as New Arrival</span>
              </label>

              <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  name="isBestseller"
                  checked={formData.isBestseller}
                  onChange={handleChange}
                  className="rounded accent-[var(--color-accent)]"
                />
                <span>Set as Bestseller</span>
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="description-input" className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
              Product Description
            </label>
            <textarea
              id="description-input"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="footer__newsletter-input"
            />
          </div>
        </div>

        {/* Image upload area */}
        <div
          className="rounded-3xl p-6 sm:p-8 border space-y-6"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          <h3 className="font-bold text-lg border-b pb-3" style={{ borderColor: "var(--color-border)" }}>
            Product Image
          </h3>

          <div className="flex flex-col md:flex-row items-center gap-6">
            <div
              className="h-40 w-40 rounded-2xl flex items-center justify-center border-2 border-dashed overflow-hidden flex-shrink-0"
              style={{
                borderColor: "var(--color-border)",
                background: "var(--color-surface-alt)",
              }}
            >
              {mainImageUrl ? (
                <img src={mainImageUrl} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs font-semibold" style={{ color: "var(--color-muted)" }}>
                  No Image
                </span>
              )}
            </div>

            <div className="flex-1 flex flex-col gap-3">
              <p className="text-xs leading-relaxed" style={{ color: "var(--color-muted)" }}>
                Upload a JPEG/PNG image for the product. Images are routed to Cloudinary CDN servers. Size limit is 5MB.
              </p>
              <label className="btn-secondary self-start cursor-pointer flex items-center gap-2 px-5 py-2.5">
                {uploading ? (
                  <FiRefreshCw className="animate-spin" />
                ) : (
                  <FiUpload />
                )}
                <span>{uploading ? "Uploading Image…" : "Select Image"}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Technical specifications panel */}
        <div
          className="rounded-3xl p-6 sm:p-8 border space-y-6"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          <h3 className="font-bold text-lg border-b pb-3" style={{ borderColor: "var(--color-border)" }}>
            Technical Specifications (Optional)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { name: "processor", label: "Processor" },
              { name: "ram", label: "RAM" },
              { name: "storage", label: "Storage" },
              { name: "display", label: "Display type" },
              { name: "screenSize", label: "Screen size" },
              { name: "battery", label: "Battery info" },
              { name: "ports", label: "Ports description" },
              { name: "os", label: "Operating System" },
              { name: "warranty", label: "Warranty duration" },
            ].map((spec) => (
              <div key={spec.name} className="flex flex-col gap-2">
                <label htmlFor={`${spec.name}-spec-input`} className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                  {spec.label}
                </label>
                <input
                  id={`${spec.name}-spec-input`}
                  type="text"
                  name={spec.name}
                  value={formData.specs[spec.name] || ""}
                  onChange={handleSpecChange}
                  className="footer__newsletter-input"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Submission actions */}
        <div className="flex items-center gap-4 justify-end">
          <Link to="/admin/products" className="btn-secondary px-8 py-3.5">
            Cancel
          </Link>
          <button
            type="submit"
            className="btn-primary px-8 py-3.5 flex items-center gap-2"
            disabled={loading || uploading}
          >
            {loading ? (
              <FiRefreshCw className="animate-spin" />
            ) : (
              <FiSave />
            )}
            <span>{loading ? "Saving changes…" : "Save Product"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProductForm;
