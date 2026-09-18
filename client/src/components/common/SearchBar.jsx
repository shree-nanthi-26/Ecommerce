import { FiSearch } from "react-icons/fi";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

function SearchBar() {
  const [value, setValue] = useState("");
  const navigate = useNavigate();
  const timerRef = useRef(null);

  // Debounce navigation (300ms)
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (value.trim()) {
      timerRef.current = setTimeout(() => {
        navigate(`/products?q=${encodeURIComponent(value.trim())}`);
      }, 300);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (timerRef.current) clearTimeout(timerRef.current);
    if (value.trim()) {
      navigate(`/products?q=${encodeURIComponent(value.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">
      <div
        className="flex items-center rounded-xl px-4 py-3"
        style={{
          background: "var(--color-surface-alt)",
          border: "1px solid var(--color-border)",
        }}
      >
        <FiSearch
          style={{ color: "var(--color-muted)" }}
          size={20}
        />

        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search furniture, sofas, beds, tables..."
          className="ml-3 w-full bg-transparent outline-none"
          style={{
            color: "var(--color-heading)",
          }}
        />
      </div>
    </form>
  );
}

export default SearchBar;