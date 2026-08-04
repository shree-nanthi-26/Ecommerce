import { NavLink, Link, Outlet } from "react-router-dom";
import {
  FiGrid,
  FiBox,
  FiShoppingBag,
  FiUsers,
  FiShield,
  FiSlash,
  FiHome,
} from "react-icons/fi";
import Logo from "./Logo";

function AdminLayout() {
  const adminLinks = [
    { to: "/admin/dashboard", label: "Dashboard", icon: FiGrid },
    { to: "/admin/products", label: "Products", icon: FiBox },
    { to: "/admin/orders", label: "Orders", icon: FiShoppingBag },
    { to: "/admin/users", label: "Users", icon: FiUsers },
    { to: "/admin/attack-logs", label: "WAF logs", icon: FiShield },
    { to: "/admin/blocked-ips", label: "Blocked IPs", icon: FiSlash },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: "var(--color-bg)" }}>
      {/* Sidebar */}
      <aside
        className="w-64 border-r hidden md:flex flex-col flex-shrink-0"
        style={{
          background: "var(--color-surface)",
          borderColor: "var(--color-border)",
        }}
      >
        {/* Sidebar Header */}
        <div
          className="h-20 flex items-center px-6 border-b"
          style={{ borderColor: "var(--color-border)" }}
        >
          <Logo />
          <span
            className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-white"
            style={{ background: "var(--color-accent)" }}
          >
            Admin
          </span>
        </div>

        {/* Sidebar Links */}
        <nav className="flex-1 py-6 px-4 space-y-1">
          {adminLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                  isActive
                    ? "text-white"
                    : "text-[var(--color-muted)] hover:text-white"
                }`
              }
              style={({ isActive }) => ({
                background: isActive ? "var(--color-accent)" : "transparent",
              })}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div
          className="p-4 border-t"
          style={{ borderColor: "var(--color-border)" }}
        >
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition text-[var(--color-muted)] hover:text-white hover:bg-[var(--color-surface-hover)]"
          >
            <FiHome size={18} />
            <span>Back to Store</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Mobile Header (temporary top bar) */}
        <header
          className="h-20 flex items-center justify-between px-6 border-b md:hidden flex-shrink-0"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          <Logo />
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="text-sm font-semibold transition text-[var(--color-muted)] hover:text-white"
            >
              Back to Store
            </Link>
          </div>
        </header>

        {/* Child Router Outlets */}
        <main className="flex-1 p-6 md:p-8 max-w-[1500px] w-full mx-auto">
          {/* Mobile Bottom Navigation for quick accessibility on mobile */}
          <nav
            className="md:hidden fixed bottom-0 left-0 right-0 h-16 flex items-center justify-around border-t z-50 px-2"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border)",
            }}
          >
            {adminLinks.slice(0, 4).map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center text-[10px] font-bold ${
                    isActive ? "text-[var(--color-accent)]" : "text-[var(--color-muted)]"
                  }`
                }
              >
                <Icon size={20} className="mb-0.5" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="pb-16 md:pb-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
