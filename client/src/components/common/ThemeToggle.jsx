import React, { useState, useRef, useEffect } from "react";
import { FiSun, FiMoon, FiMonitor, FiCheck } from "react-icons/fi";
import { useTheme } from "../../context/ThemeContext";

/**
 * Reusable ThemeToggle component supporting:
 * - Light / Dark / System modes
 * - Dropdown selector with keyboard and click-outside support
 * - Compact button mode for toolbars and navbars
 */
export default function ThemeToggle({ showLabel = false, align = "right" }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const options = [
    { value: "light", label: "Light", icon: FiSun },
    { value: "dark", label: "Dark", icon: FiMoon },
    { value: "system", label: "System", icon: FiMonitor },
  ];

  const CurrentIcon =
    theme === "system"
      ? FiMonitor
      : resolvedTheme === "dark"
      ? FiMoon
      : FiSun;

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-xl transition cursor-pointer"
        style={{
          color: "inherit",
          background: "transparent",
        }}
        aria-label={`Theme: currently ${theme} mode`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        title={`Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)} (${resolvedTheme})`}
      >
        <span
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
          style={{
            background: "rgba(255, 255, 255, 0.08)",
          }}
        >
          <CurrentIcon size={17} />
        </span>
        {showLabel && (
          <span className="text-xs font-semibold capitalize hidden sm:inline">
            {theme}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Select color theme"
          className={`absolute top-full mt-2 w-36 rounded-2xl p-1.5 shadow-xl border z-50 transition-all ${
            align === "left" ? "left-0" : "right-0"
          }`}
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          {options.map((opt) => {
            const Icon = opt.icon;
            const isSelected = theme === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="menuitemradio"
                aria-checked={isSelected}
                onClick={() => {
                  setTheme(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  isSelected
                    ? "bg-[var(--color-accent)] text-white"
                    : "text-[var(--color-heading)] hover:bg-[var(--color-surface-hover)]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={14} />
                  <span>{opt.label}</span>
                </div>
                {isSelected && <FiCheck size={13} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
