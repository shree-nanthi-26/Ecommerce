/**
 * SkeletonCard – Placeholder loader that mirrors ProductCard's dimensions.
 * Uses .skeleton CSS animation from design-system.css.
 */
function SkeletonCard() {
  return (
    <div className="product-card" aria-hidden="true">
      <div className="product-card__image-wrap">
        <div className="skeleton" style={{ width: "100%", height: "100%" }} />
      </div>
      <div className="product-card__body">
        <div className="skeleton" style={{ width: "40%", height: "0.7rem", marginBottom: "0.65rem" }} />
        <div className="skeleton" style={{ width: "80%", height: "1rem", marginBottom: "0.75rem" }} />
        <div className="skeleton" style={{ width: "55%", height: "0.75rem", marginBottom: "0.75rem" }} />
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <div className="skeleton" style={{ width: "30%", height: "1rem" }} />
          <div className="skeleton" style={{ width: "25%", height: "0.85rem" }} />
        </div>
      </div>
      <div className="product-card__actions">
        <div className="skeleton" style={{ width: "100%", height: "2.75rem", borderRadius: "var(--radius-md)" }} />
      </div>
    </div>
  );
}

export default SkeletonCard;
