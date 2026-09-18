import { Link } from "react-router-dom";

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-3 cursor-pointer group">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-105"
        style={{
          background: "linear-gradient(135deg, #8B5E3C 0%, #5C3D24 100%)",
          boxShadow: "0 4px 14px rgba(139, 94, 60, 0.35)",
        }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          {/* Stylized Modern Armchair / Home Architecture */}
          <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" />
          <path d="M3 11v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z" />
          <path d="M6 18v3" />
          <path d="M18 18v3" />
        </svg>
      </div>

      <div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-black tracking-tight" style={{ color: "var(--color-heading, #ffffff)" }}>
            Furniva
          </span>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--color-accent, #8B5E3C)" }} />
        </div>

        <p className="text-[10px] uppercase tracking-[0.2em] font-semibold" style={{ color: "var(--color-accent, #D9A87E)" }}>
          Modern Living
        </p>
      </div>
    </Link>
  );
}

export default Logo;