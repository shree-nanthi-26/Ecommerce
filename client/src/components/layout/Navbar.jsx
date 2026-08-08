import { FiHeart, FiShoppingCart, FiMenu, FiUser, FiSun, FiMoon, FiX, FiShield } from "react-icons/fi";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import Logo from "./Logo";
import SearchBar from "../common/SearchBar";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import EmailVerificationBanner from "../common/EmailVerificationBanner";

function Navbar() {
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("electromart-theme");
    if (saved === "dark" || !saved) {
      document.documentElement.setAttribute("data-theme", "dark");
      return true;
    }
    return false;
  });

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("electromart-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("electromart-theme", "light");
    }
  };

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/products", label: "Products" },
    { to: "/categories", label: "Categories" },
    { to: "/deals", label: "Deals" },
    { to: "/compare", label: "Compare" },
    { to: "/support", label: "Support" },
  ];

  return (
    <header className="sticky top-0 z-50 navbar">
      <EmailVerificationBanner />
      <div className="max-w-[1500px] mx-auto px-8">

        {/* Top Bar */}
        <div className="h-20 flex items-center justify-between gap-6">

          {/* Logo */}
          <Logo />

          {/* Search (desktop) */}
          <div className="hidden lg:flex flex-1 justify-center">
            <SearchBar />
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-5">

            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="relative"
              aria-label={`Wishlist – ${wishlistCount} item${wishlistCount !== 1 ? "s" : ""}`}
            >
              <FiHeart size={22} />
              {wishlistCount > 0 && (
                <span className="nav-badge">{wishlistCount}</span>
              )}
            </Link>

            {/* Cart */}
            <Link
              to="/cart"
              className="relative"
              aria-label={`Cart – ${cartCount} item${cartCount !== 1 ? "s" : ""}`}
            >
              <FiShoppingCart size={22} />
              {cartCount > 0 && (
                <span className="nav-badge">{cartCount}</span>
              )}
            </Link>

            {/* Auth section (desktop) */}
            {user ? (
              <div className="hidden md:flex items-center gap-4">
                {user.role === "admin" && (
                  <Link to="/admin/dashboard" className="text-[var(--color-accent)] font-bold">
                    Admin Panel
                  </Link>
                )}
                <Link to="/orders">My Orders</Link>
                <button
                  type="button"
                  onClick={() => { logout(); navigate("/"); }}
                  aria-label="Log out"
                >
                  Logout
                </button>
                <Link
                  to="/profile"
                  className="flex items-center gap-1.5"
                  aria-label="My profile"
                  style={{ color: "var(--color-chrome-text)" }}
                >
                  <FiUser size={16} />
                  {user.name}
                </Link>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden md:flex items-center gap-2"
                aria-label="Sign in or create account"
              >
                <FiUser size={20} />
                <span>Account</span>
              </Link>
            )}

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              title={isDark ? "Light mode" : "Dark mode"}
            >
              {isDark ? <FiSun size={20} /> : <FiMoon size={20} />}
            </button>

            {/* Mobile menu toggle */}
            <button
              className="lg:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <FiX size={26} /> : <FiMenu size={26} />}
            </button>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-10 h-14" aria-label="Main navigation">
          {navLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `transition ${isActive ? "nav-link-active" : ""}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <nav
            className="lg:hidden flex flex-col gap-4 pb-6 pt-2 border-t"
            style={{ borderColor: "var(--color-chrome-border)" }}
            aria-label="Mobile navigation"
          >
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `block py-2 transition ${isActive ? "nav-link-active" : ""}`
                }
              >
                {label}
              </NavLink>
            ))}
            {user ? (
              <>
                {user.role === "admin" && (
                  <Link
                    to="/admin/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="py-2 flex items-center gap-2 font-bold text-[var(--color-accent)]"
                  >
                    <FiShield size={16} /> Admin Panel
                  </Link>
                )}
                <Link to="/profile" onClick={() => setMobileOpen(false)} className="py-2 flex items-center gap-2">
                  <FiUser size={16} /> My Profile
                </Link>
              </>
            ) : (
              <Link to="/login" onClick={() => setMobileOpen(false)} className="py-2">
                Account
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}

export default Navbar;