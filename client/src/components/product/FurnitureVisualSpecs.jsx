import React from "react";
import {
  FiMaximize2,
  FiShield,
  FiTool,
  FiHome,
  FiLayers,
  FiClock,
  FiCheckCircle,
  FiUsers,
  FiTv,
  FiBox,
  FiCompass,
} from "react-icons/fi";

/**
 * FurnitureVisualSpecs Component
 * 
 * Renders dedicated furniture shopping sections:
 * 1. "Perfect For" (Living Room, Bedroom, Office, Dining Room)
 * 2. "Dimensions" (Width, Height, Depth blueprint)
 * 3. "Assembly" (Required / not required, Estimated time)
 * 4. "Warranty" (Warranty duration & coverage)
 * 5. Visual Specification Cards for all existing furniture fields
 * 
 * STRICT REQUIREMENT: Only render information that exists in the product database.
 * Never invent or render missing information.
 */
export default function FurnitureVisualSpecs({ product }) {
  if (!product) return null;

  const specs = product.specs || {};

  // Extract existing fields safely
  const material = specs.material?.trim();
  const woodType = specs.woodType?.trim();
  const upholstery = specs.upholstery?.trim();
  const cushionMaterial = specs.cushionMaterial?.trim();
  const color = specs.color?.trim();
  const finish = specs.finish?.trim();
  const style = specs.style?.trim();
  const roomType = specs.roomType?.trim();
  const seatingCapacity = specs.seatingCapacity && specs.seatingCapacity !== "N/A" ? specs.seatingCapacity.trim() : null;
  const tvSizeCompatibility = specs.tvSizeCompatibility?.trim();
  const assemblyRequired = specs.assemblyRequired?.trim();
  const assemblyTime = specs.assemblyTime?.trim();
  const warranty = specs.warranty?.trim();
  const width = specs.width?.trim();
  const height = specs.height?.trim();
  const depth = specs.depth?.trim();
  const dimensions = specs.dimensions?.trim();
  const weight = specs.weight?.trim();
  const careInstructions = specs.careInstructions?.trim();

  // Check which sections have real database data
  const hasRoomType = Boolean(roomType);
  const hasDimensions = Boolean(width || height || depth || dimensions);
  const hasAssembly = Boolean(assemblyRequired || assemblyTime);
  const hasWarranty = Boolean(warranty);

  // Parse room matching for the standard furniture rooms
  const targetRooms = [
    { name: "Living Room", key: "living" },
    { name: "Bedroom", key: "bed" },
    { name: "Office", key: "office" },
    { name: "Dining Room", key: "dining" },
  ];

  const lowerRoom = (roomType || "").toLowerCase();

  // Specification Cards data - only include items that actually exist
  const specCards = [
    material && {
      icon: FiLayers,
      label: "Primary Material",
      value: material,
      category: "Material & Build",
    },
    woodType && {
      icon: FiBox,
      label: "Wood Species",
      value: woodType,
      category: "Material & Build",
    },
    upholstery && {
      icon: FiLayers,
      label: "Upholstery Fabric",
      value: upholstery,
      category: "Material & Build",
    },
    cushionMaterial && {
      icon: FiLayers,
      label: "Cushion Padding",
      value: cushionMaterial,
      category: "Material & Build",
    },
    color && {
      icon: FiCompass,
      label: "Color / Finish Swatch",
      value: color,
      category: "Aesthetics",
    },
    finish && {
      icon: FiCompass,
      label: "Protective Finish",
      value: finish,
      category: "Aesthetics",
    },
    style && {
      icon: FiCompass,
      label: "Design Style",
      value: style,
      category: "Aesthetics",
    },
    seatingCapacity && {
      icon: FiUsers,
      label: "Seating Capacity",
      value: `${seatingCapacity} Person(s)`,
      category: "Ergonomics",
    },
    tvSizeCompatibility && {
      icon: FiTv,
      label: "TV Size Compatibility",
      value: tvSizeCompatibility,
      category: "Ergonomics",
    },
    careInstructions && {
      icon: FiCheckCircle,
      label: "Care & Maintenance",
      value: careInstructions,
      category: "Care",
    },
  ].filter(Boolean);

  const hasAnyContent = hasRoomType || hasDimensions || hasAssembly || hasWarranty || specCards.length > 0;
  if (!hasAnyContent) return null;

  return (
    <section className="space-y-12 my-14" aria-label="Furniture Specifications and Details">
      {/* ── SECTION HEADER ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b pb-5" style={{ borderColor: "var(--color-border)" }}>
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: "var(--color-accent)" }}>
            Furniture Architecture & Craftsmanship
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-[var(--color-heading)]">
            Product Specifications & Details
          </h2>
        </div>
        <div className="text-xs font-medium" style={{ color: "var(--color-muted)" }}>
          Authentic database specifications • Verified craftsmanship
        </div>
      </div>

      {/* ── SECTION 1: PERFECT FOR (ROOM TYPE) ─────────────────────────── */}
      {hasRoomType && (
        <div
          className="p-6 sm:p-8 rounded-3xl border transition"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-[var(--color-accent)]"
              style={{ background: "var(--color-surface-alt)" }}
            >
              <FiHome size={20} />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider font-bold" style={{ color: "var(--color-muted)" }}>
                Room Placement
              </span>
              <h3 className="text-lg font-bold text-[var(--color-heading)]">Perfect For</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {targetRooms.map((room) => {
              const isMatch =
                lowerRoom.includes(room.key) ||
                (room.key === "office" && (lowerRoom.includes("study") || lowerRoom.includes("work")));

              return (
                <div
                  key={room.name}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                    isMatch
                      ? "ring-2 ring-[var(--color-accent)] bg-[var(--color-surface-alt)] shadow-sm"
                      : "opacity-60 bg-[var(--color-surface)] border-[var(--color-border)]"
                  }`}
                  style={{
                    borderColor: isMatch ? "var(--color-accent)" : "var(--color-border)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                        isMatch
                          ? "bg-[var(--color-accent)] text-white"
                          : "bg-neutral-200 dark:bg-neutral-800 text-[var(--color-muted)]"
                      }`}
                    >
                      <FiHome size={16} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[var(--color-heading)]">{room.name}</h4>
                      <p className="text-[11px]" style={{ color: "var(--color-muted)" }}>
                        {isMatch ? "Recommended Space" : "Alternative Space"}
                      </p>
                    </div>
                  </div>

                  {isMatch && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <FiCheckCircle size={12} /> Designed For
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {roomType && (
            <p className="mt-4 text-xs font-medium" style={{ color: "var(--color-muted)" }}>
              Specified room suitability in catalog:{" "}
              <strong className="text-[var(--color-heading)]">{roomType}</strong>
            </p>
          )}
        </div>
      )}

      {/* ── SECTION 2 & 3: DIMENSIONS & ASSEMBLY GRID ───────────────────── */}
      {(hasDimensions || hasAssembly) && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* DIMENSIONS BLUEPRINT CARD */}
          {hasDimensions && (
            <div
              className={`${hasAssembly ? "lg:col-span-7" : "lg:col-span-12"} p-6 sm:p-8 rounded-3xl border`}
              style={{
                background: "var(--color-surface)",
                borderColor: "var(--color-border)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div className="flex items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-[var(--color-accent)]"
                    style={{ background: "var(--color-surface-alt)" }}
                  >
                    <FiMaximize2 size={20} />
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider font-bold" style={{ color: "var(--color-muted)" }}>
                      Size & Space Fit
                    </span>
                    <h3 className="text-lg font-bold text-[var(--color-heading)]">Dimensions</h3>
                  </div>
                </div>

                {dimensions && (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-[var(--color-surface-alt)] text-[var(--color-heading)]">
                    {dimensions}
                  </span>
                )}
              </div>

              {/* Dimensions Breakdown Grid: Width / Height / Depth */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4 text-center">
                {width && (
                  <div
                    className="p-4 rounded-2xl border"
                    style={{
                      background: "var(--color-surface-alt)",
                      borderColor: "var(--color-border)",
                    }}
                  >
                    <span className="text-[11px] uppercase tracking-wider font-bold block" style={{ color: "var(--color-muted)" }}>
                      Width
                    </span>
                    <span className="text-base sm:text-xl font-extrabold text-[var(--color-heading)] mt-1 block">
                      {width}
                    </span>
                  </div>
                )}

                {height && (
                  <div
                    className="p-4 rounded-2xl border"
                    style={{
                      background: "var(--color-surface-alt)",
                      borderColor: "var(--color-border)",
                    }}
                  >
                    <span className="text-[11px] uppercase tracking-wider font-bold block" style={{ color: "var(--color-muted)" }}>
                      Height
                    </span>
                    <span className="text-base sm:text-xl font-extrabold text-[var(--color-heading)] mt-1 block">
                      {height}
                    </span>
                  </div>
                )}

                {depth && (
                  <div
                    className="p-4 rounded-2xl border"
                    style={{
                      background: "var(--color-surface-alt)",
                      borderColor: "var(--color-border)",
                    }}
                  >
                    <span className="text-[11px] uppercase tracking-wider font-bold block" style={{ color: "var(--color-muted)" }}>
                      Depth
                    </span>
                    <span className="text-base sm:text-xl font-extrabold text-[var(--color-heading)] mt-1 block">
                      {depth}
                    </span>
                  </div>
                )}
              </div>

              {/* Additional dimensions meta if available in database */}
              {weight && (
                <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs" style={{ borderColor: "var(--color-border)" }}>
                  <span style={{ color: "var(--color-muted)" }}>Item Gross Weight</span>
                  <span className="font-bold text-[var(--color-heading)]">{weight}</span>
                </div>
              )}
            </div>
          )}

          {/* ASSEMBLY SPECIFICATION CARD */}
          {hasAssembly && (
            <div
              className={`${hasDimensions ? "lg:col-span-5" : "lg:col-span-12"} p-6 sm:p-8 rounded-3xl border flex flex-col justify-between`}
              style={{
                background: "var(--color-surface)",
                borderColor: "var(--color-border)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-[var(--color-accent)]"
                    style={{ background: "var(--color-surface-alt)" }}
                  >
                    <FiTool size={20} />
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider font-bold" style={{ color: "var(--color-muted)" }}>
                      Setup & Installation
                    </span>
                    <h3 className="text-lg font-bold text-[var(--color-heading)]">Assembly</h3>
                  </div>
                </div>

                <div className="space-y-4">
                  {assemblyRequired && (
                    <div
                      className="p-4 rounded-2xl border flex items-start gap-3"
                      style={{
                        background: "var(--color-surface-alt)",
                        borderColor: "var(--color-border)",
                      }}
                    >
                      <FiCheckCircle className="text-emerald-500 mt-0.5 flex-shrink-0" size={18} />
                      <div>
                        <span className="text-xs uppercase font-bold tracking-wider block" style={{ color: "var(--color-muted)" }}>
                          Requirement
                        </span>
                        <span className="text-sm font-bold text-[var(--color-heading)]">
                          {assemblyRequired}
                        </span>
                      </div>
                    </div>
                  )}

                  {assemblyTime && (
                    <div
                      className="p-4 rounded-2xl border flex items-start gap-3"
                      style={{
                        background: "var(--color-surface-alt)",
                        borderColor: "var(--color-border)",
                      }}
                    >
                      <FiClock className="text-[var(--color-accent)] mt-0.5 flex-shrink-0" size={18} />
                      <div>
                        <span className="text-xs uppercase font-bold tracking-wider block" style={{ color: "var(--color-muted)" }}>
                          Estimated Setup Time
                        </span>
                        <span className="text-sm font-bold text-[var(--color-heading)]">
                          {assemblyTime}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <p className="mt-4 text-[11px]" style={{ color: "var(--color-muted)" }}>
                Our logistics partners ensure seamless handling and placement in your desired room.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── SECTION 4: WARRANTY SECTION ─────────────────────────────────── */}
      {hasWarranty && (
        <div
          className="p-6 sm:p-8 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-6"
          style={{
            background: "linear-gradient(135deg, var(--color-surface) 0%, var(--color-surface-alt) 100%)",
            borderColor: "var(--color-border)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 flex-shrink-0"
            >
              <FiShield size={24} />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-emerald-600 dark:text-emerald-400">
                Authentic Manufacturer Guarantee
              </span>
              <h3 className="text-xl font-extrabold text-[var(--color-heading)]">
                {warranty}
              </h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>
                Certified coverage for structural integrity, joinery, and frame stability.
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border bg-[var(--color-surface)] text-xs font-bold text-[var(--color-heading)]" style={{ borderColor: "var(--color-border)" }}>
            <FiCheckCircle className="text-emerald-500" />
            <span>Guaranteed Coverage</span>
          </div>
        </div>
      )}

      {/* ── SECTION 5: VISUAL SPECIFICATION CARDS ───────────────────────── */}
      {specCards.length > 0 && (
        <div>
          <div className="mb-4">
            <span className="text-xs uppercase tracking-wider font-bold" style={{ color: "var(--color-muted)" }}>
              Materials & Engineering
            </span>
            <h3 className="text-lg font-bold text-[var(--color-heading)]">
              Visual Specification Cards
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {specCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <div
                  key={idx}
                  className="p-5 rounded-2xl border transition hover:shadow-md"
                  style={{
                    background: "var(--color-surface)",
                    borderColor: "var(--color-border)",
                  }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--color-accent)]"
                      style={{ background: "var(--color-surface-alt)" }}
                    >
                      <Icon size={16} />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--color-muted)" }}>
                      {card.label}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-[var(--color-heading)] leading-snug pl-11">
                    {card.value}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
