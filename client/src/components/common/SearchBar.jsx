import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiClock, FiTrendingUp, FiX, FiTag, FiShoppingBag, FiStar, FiArrowRight } from "react-icons/fi";
import { getSearchSuggestions } from "../../services/productService";

const RECENT_SEARCHES_KEY = "furniva_recent_searches";
const MAX_RECENT = 6;

function SearchBar() {
  const [value, setValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState({
    products: [],
    categories: [],
    brands: [],
    popular: [
      "Modern Sofa",
      "Dining Table",
      "King Bed",
      "Ergonomic Chair",
      "Coffee Table",
      "Solid Wood",
    ],
    recommendations: [],
  });
  const [recentSearches, setRecentSearches] = useState([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const navigate = useNavigate();
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("Could not load recent searches:", e);
    }
  }, []);

  // Save a search term to recent searches
  const saveRecentSearch = (term) => {
    const trimmed = term?.trim();
    if (!trimmed) return;
    try {
      setRecentSearches((prev) => {
        const filtered = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
        const updated = [trimmed, ...filtered].slice(0, MAX_RECENT);
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch (e) {
      console.warn("Could not save recent search:", e);
    }
  };

  // Remove a single recent search
  const removeRecentSearch = (e, termToRemove) => {
    e.stopPropagation();
    try {
      setRecentSearches((prev) => {
        const updated = prev.filter((item) => item !== termToRemove);
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch (e) {}
  };

  // Clear all recent searches
  const clearAllRecent = (e) => {
    e.stopPropagation();
    try {
      setRecentSearches([]);
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (e) {}
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch live suggestions on value change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        const data = await getSearchSuggestions(value.trim());
        setSuggestions(data);
      } catch (err) {
        console.warn("Suggestions error:", err);
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  // Execute full text search
  const executeSearch = (searchTerm) => {
    const term = searchTerm !== undefined ? searchTerm : value;
    const clean = term.trim();
    if (!clean) return;

    saveRecentSearch(clean);
    setIsOpen(false);
    setValue(clean);
    navigate(`/products?q=${encodeURIComponent(clean)}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    executeSearch();
  };

  const handleSelectProduct = (product) => {
    saveRecentSearch(product.name);
    setIsOpen(false);
    navigate(`/products/${product._id}`);
  };

  const handleSelectCategory = (category) => {
    saveRecentSearch(category);
    setIsOpen(false);
    navigate(`/products?category=${encodeURIComponent(category)}`);
  };

  const handleSelectBrand = (brand) => {
    saveRecentSearch(brand);
    setIsOpen(false);
    navigate(`/products?brand=${encodeURIComponent(brand)}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const isQueryEmpty = !value.trim();
  const hasProducts = suggestions.products && suggestions.products.length > 0;
  const hasCategories = suggestions.categories && suggestions.categories.length > 0;
  const hasBrands = suggestions.brands && suggestions.brands.length > 0;
  const hasResults = hasProducts || hasCategories || hasBrands;

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl">
      <form onSubmit={handleSubmit} role="search" aria-label="Sitewide product search">
        <div
          className={`flex items-center rounded-xl px-4 py-3 transition-all duration-200 ${
            isOpen ? "ring-2 ring-[var(--color-accent)] shadow-lg" : ""
          }`}
          style={{
            background: "var(--color-surface-alt)",
            border: "1px solid var(--color-border)",
          }}
        >
          <FiSearch
            style={{ color: "var(--color-muted)" }}
            size={20}
            className="flex-shrink-0"
            aria-hidden="true"
          />

          <input
            ref={inputRef}
            type="search"
            value={value}
            onFocus={() => setIsOpen(true)}
            onChange={(e) => {
              setValue(e.target.value);
              setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search furniture, sofas, beds, materials..."
            aria-label="Search furniture products, styles and materials"
            aria-expanded={isOpen}
            aria-autocomplete="list"
            aria-controls="search-suggestions"
            className="ml-3 w-full bg-transparent outline-none text-sm md:text-base"
            style={{
              color: "var(--color-heading)",
            }}
          />

          {value && (
            <button
              type="button"
              onClick={() => {
                setValue("");
                inputRef.current?.focus();
              }}
              className="p-1 rounded-full hover:opacity-75 transition-opacity"
              style={{ color: "var(--color-muted)" }}
              aria-label="Clear search input"
            >
              <FiX size={16} />
            </button>
          )}

          {loading && (
            <div className="ml-2 w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                 style={{ borderColor: "var(--color-accent) transparent transparent transparent" }}
                 aria-label="Loading search suggestions" />
          )}
        </div>
      </form>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div
          id="search-suggestions"
          role="region"
          aria-label="Search suggestions"
          className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl shadow-2xl overflow-hidden border backdrop-blur-md"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
            maxHeight: "560px",
            overflowY: "auto",
          }}
        >
          {/* EMPTY QUERY STATE: Recent Searches & Popular Searches */}
          {isQueryEmpty ? (
            <div className="p-4 space-y-5">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between pb-2 mb-2 border-b"
                       style={{ borderColor: "var(--color-border)" }}>
                    <span className="text-xs font-semibold tracking-wider uppercase flex items-center gap-1.5"
                          style={{ color: "var(--color-muted)" }}>
                      <FiClock size={13} /> Recent Searches
                    </span>
                    <button
                      type="button"
                      onClick={clearAllRecent}
                      className="text-xs hover:underline"
                      style={{ color: "var(--color-muted)" }}
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term) => (
                      <div
                        key={term}
                        onClick={() => executeSearch(term)}
                        className="group flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all hover:scale-105"
                        style={{
                          background: "var(--color-surface-alt)",
                          border: "1px solid var(--color-border)",
                          color: "var(--color-heading)",
                        }}
                      >
                        <FiClock size={12} style={{ color: "var(--color-muted)" }} />
                        <span>{term}</span>
                        <button
                          type="button"
                          onClick={(e) => removeRecentSearch(e, term)}
                          className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity"
                          title="Remove from history"
                        >
                          <FiX size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Searches */}
              <div>
                <div className="pb-2 mb-2 border-b" style={{ borderColor: "var(--color-border)" }}>
                  <span className="text-xs font-semibold tracking-wider uppercase flex items-center gap-1.5"
                        style={{ color: "var(--color-muted)" }}>
                    <FiTrendingUp size={13} style={{ color: "var(--color-accent)" }} /> Popular Searches
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(suggestions.popular || []).map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => executeSearch(term)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:scale-105"
                      style={{
                        background: "var(--color-surface-alt)",
                        border: "1px solid var(--color-border)",
                        color: "var(--color-heading)",
                      }}
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>

              {/* Top Categories */}
              {hasCategories && (
                <div>
                  <div className="pb-2 mb-2 border-b" style={{ borderColor: "var(--color-border)" }}>
                    <span className="text-xs font-semibold tracking-wider uppercase flex items-center gap-1.5"
                          style={{ color: "var(--color-muted)" }}>
                      <FiTag size={13} /> Categories
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleSelectCategory(cat)}
                        className="px-3 py-1.5 rounded-xl text-xs font-medium transition-colors hover:bg-[var(--color-accent)] hover:text-white"
                        style={{
                          background: "var(--color-surface-alt)",
                          border: "1px solid var(--color-border)",
                          color: "var(--color-body)",
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : hasResults ? (
            /* ACTIVE QUERY RESULTS */
            <div className="p-3 space-y-3">
              {/* Category & Brand Quick Chips */}
              {(hasCategories || hasBrands) && (
                <div className="flex flex-wrap items-center gap-2 pb-2 border-b"
                     style={{ borderColor: "var(--color-border)" }}>
                  {hasCategories && suggestions.categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleSelectCategory(cat)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors"
                      style={{
                        background: "rgba(var(--color-accent-rgb, 197, 160, 89), 0.12)",
                        color: "var(--color-heading)",
                        border: "1px solid var(--color-accent)",
                      }}
                    >
                      <FiTag size={11} style={{ color: "var(--color-accent)" }} />
                      <span>In <strong>{cat}</strong></span>
                    </button>
                  ))}

                  {hasBrands && suggestions.brands.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => handleSelectBrand(b)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors"
                      style={{
                        background: "var(--color-surface-alt)",
                        color: "var(--color-body)",
                        border: "1px solid var(--color-border)",
                      }}
                    >
                      <span>Brand: <strong>{b}</strong></span>
                    </button>
                  ))}
                </div>
              )}

              {/* Product Matches */}
              {hasProducts && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider px-2 py-1 flex items-center justify-between"
                       style={{ color: "var(--color-muted)" }}>
                    <span className="flex items-center gap-1.5">
                      <FiShoppingBag size={13} /> Products
                    </span>
                    <button
                      type="button"
                      onClick={() => executeSearch()}
                      className="flex items-center gap-1 text-xs hover:underline"
                      style={{ color: "var(--color-accent)" }}
                    >
                      View all results <FiArrowRight size={12} />
                    </button>
                  </div>

                  <div className="divide-y mt-1" style={{ borderColor: "var(--color-border)" }}>
                    {suggestions.products.map((product) => {
                      const image = product.image || (product.images && product.images[0]?.url);
                      return (
                        <div
                          key={product._id}
                          onClick={() => handleSelectProduct(product)}
                          className="flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all hover:bg-[var(--color-surface-alt)]"
                        >
                          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
                            {image ? (
                              <img
                                src={image}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <FiShoppingBag style={{ color: "var(--color-muted)" }} />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-semibold truncate"
                                  style={{ color: "var(--color-heading)" }}>
                                {product.name}
                              </h4>
                              {product.badge && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase"
                                      style={{
                                        background: product.badge === "SALE" ? "#fee2e2" : "#e0e7ff",
                                        color: product.badge === "SALE" ? "#dc2626" : "#4338ca",
                                      }}>
                                  {product.badge}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-xs mt-0.5"
                                 style={{ color: "var(--color-muted)" }}>
                              <span>{product.category}</span>
                              {product.brand && (
                                <>
                                  <span>•</span>
                                  <span>{product.brand}</span>
                                </>
                              )}
                              {product.rating > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-0.5 text-amber-500 font-medium">
                                    <FiStar size={11} className="fill-amber-500" />
                                    {product.rating}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <span className="text-sm font-bold" style={{ color: "var(--color-heading)" }}>
                              ₹{product.price?.toLocaleString()}
                            </span>
                            {product.oldPrice && (
                              <span className="block text-xs line-through" style={{ color: "var(--color-muted)" }}>
                                ₹{product.oldPrice?.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* View full search results button */}
              <div className="pt-2 border-t" style={{ borderColor: "var(--color-border)" }}>
                <button
                  type="button"
                  onClick={() => executeSearch()}
                  className="w-full py-2.5 rounded-xl text-center text-xs font-semibold tracking-wide flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                  style={{
                    background: "var(--color-accent)",
                    color: "#ffffff",
                  }}
                >
                  Search for "{value}" <FiArrowRight size={14} />
                </button>
              </div>
            </div>
          ) : (
            /* NO RESULTS STATE: Suggestions & Top Recommendations */
            <div className="p-6 text-center space-y-4">
              <div className="py-2">
                <p className="text-sm font-medium" style={{ color: "var(--color-heading)" }}>
                  No exact matches found for "<strong>{value}</strong>"
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>
                  Check spelling or try browsing these popular categories:
                </p>
              </div>

              {/* Popular categories / searches */}
              <div className="flex flex-wrap justify-center gap-2">
                {(suggestions.popular || []).slice(0, 5).map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => executeSearch(term)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                    style={{
                      background: "var(--color-surface-alt)",
                      border: "1px solid var(--color-border)",
                      color: "var(--color-heading)",
                    }}
                  >
                    {term}
                  </button>
                ))}
              </div>

              {/* Recommendations */}
              {suggestions.recommendations && suggestions.recommendations.length > 0 && (
                <div className="pt-4 border-t text-left" style={{ borderColor: "var(--color-border)" }}>
                  <span className="text-xs font-semibold uppercase tracking-wider block mb-3"
                        style={{ color: "var(--color-muted)" }}>
                    Recommended For You
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {suggestions.recommendations.map((rec) => {
                      const image = rec.images && rec.images[0]?.url;
                      return (
                        <div
                          key={rec._id}
                          onClick={() => handleSelectProduct(rec)}
                          className="flex items-center gap-2 p-2 rounded-xl cursor-pointer hover:bg-[var(--color-surface-alt)] transition-colors"
                          style={{ border: "1px solid var(--color-border)" }}
                        >
                          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                            {image && <img src={image} alt={rec.name} className="w-full h-full object-cover" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold truncate" style={{ color: "var(--color-heading)" }}>
                              {rec.name}
                            </p>
                            <p className="text-xs font-bold" style={{ color: "var(--color-accent)" }}>
                              ₹{rec.price?.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchBar;