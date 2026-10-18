import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiStar,
  FiCheckCircle,
  FiThumbsUp,
  FiEdit2,
  FiTrash2,
  FiCamera,
  FiX,
  FiFilter,
  FiAlertCircle,
  FiChevronLeft,
  FiChevronRight,
  FiPlus,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import {
  getProductReviews,
  getReviewEligibility,
  createReview,
  updateReview,
  deleteReview,
  toggleReviewHelpful,
} from "../../services/reviewService";
import { uploadMultipleImages } from "../../services/uploadService";

const RATING_LABELS = {
  5: "5 Stars - Exceptional Quality",
  4: "4 Stars - Very Good",
  3: "3 Stars - Average",
  2: "2 Stars - Below Expectations",
  1: "1 Star - Poor Experience",
};

export default function ProductReviews({
  productId,
  fallbackRating = 4.5,
  fallbackReviewsCount = 0,
  onRatingUpdated,
}) {
  const { user } = useAuth();

  // Review List State
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    breakdownPercentage: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMatching, setTotalMatching] = useState(0);

  // Filters & Sorting
  const [selectedStarFilter, setSelectedStarFilter] = useState(null);
  const [sortBy, setSortBy] = useState("newest");
  const [onlyWithImages, setOnlyWithImages] = useState(false);

  // Eligibility & Modal State
  const [eligibility, setEligibility] = useState({
    canReview: false,
    hasReviewed: false,
    existingReview: null,
    isVerifiedPurchase: false,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);

  // Form State
  const [formRating, setFormRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [formTitle, setFormTitle] = useState("");
  const [formComment, setFormComment] = useState("");
  const [formImages, setFormImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Lightbox modal for review images
  const [lightboxImage, setLightboxImage] = useState(null);

  // Fetch reviews callback
  const fetchReviews = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        setError(null);
        const params = {
          page,
          limit: 6,
          sort: sortBy,
        };
        if (selectedStarFilter) params.rating = selectedStarFilter;
        if (onlyWithImages) params.withImages = "true";

        const data = await getProductReviews(productId, params);
        setReviews(data.reviews || []);
        setStats(
          data.stats || {
            totalReviews: 0,
            averageRating: 0,
            distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
            breakdownPercentage: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
          }
        );
        setCurrentPage(data.page || 1);
        setTotalPages(data.totalPages || 1);
        setTotalMatching(data.total || 0);

        if (data.stats && data.stats.totalReviews > 0 && onRatingUpdated) {
          onRatingUpdated(data.stats.averageRating, data.stats.totalReviews);
        }
      } catch (err) {
        setError("Unable to load reviews for this product at this time.");
      } finally {
        setLoading(false);
      }
    },
    [productId, selectedStarFilter, sortBy, onlyWithImages, onRatingUpdated]
  );

  // Fetch eligibility when user or product changes
  const checkEligibility = useCallback(async () => {
    if (!user) {
      setEligibility({
        canReview: false,
        hasReviewed: false,
        existingReview: null,
        isVerifiedPurchase: false,
      });
      return;
    }
    try {
      const data = await getReviewEligibility(productId);
      setEligibility(data);
    } catch {
      // Ignore eligibility check failures gracefully
    }
  }, [productId, user]);

  useEffect(() => {
    fetchReviews(1);
    checkEligibility();
  }, [fetchReviews, checkEligibility]);

  // Open modal for writing or editing review
  const handleOpenWriteModal = () => {
    setFormError("");
    setFormSuccess("");
    if (eligibility.hasReviewed && eligibility.existingReview) {
      const rev = eligibility.existingReview;
      setIsEditing(true);
      setEditingReviewId(rev._id);
      setFormRating(rev.rating || 5);
      setFormTitle(rev.title || "");
      setFormComment(rev.comment || "");
      setFormImages(rev.images || []);
    } else {
      setIsEditing(false);
      setEditingReviewId(null);
      setFormRating(5);
      setFormTitle("");
      setFormComment("");
      setFormImages([]);
    }
    setIsModalOpen(true);
  };

  const handleOpenEditSpecific = (rev) => {
    setFormError("");
    setFormSuccess("");
    setIsEditing(true);
    setEditingReviewId(rev._id);
    setFormRating(rev.rating || 5);
    setFormTitle(rev.title || "");
    setFormComment(rev.comment || "");
    setFormImages(rev.images || []);
    setIsModalOpen(true);
  };

  // Handle image upload from computer
  const handleImageFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (formImages.length + files.length > 5) {
      setFormError("You can upload a maximum of 5 images per review.");
      return;
    }

    try {
      setUploadingImages(true);
      setFormError("");
      const uploaded = await uploadMultipleImages(files);
      setFormImages((prev) => [...prev, ...uploaded]);
    } catch (err) {
      setFormError("Failed to upload review images. Please try again.");
    } finally {
      setUploadingImages(false);
      e.target.value = "";
    }
  };

  const handleRemoveFormImage = (index) => {
    setFormImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Submit review form
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError("Please enter a review headline / title.");
      return;
    }
    if (!formComment.trim() || formComment.trim().length < 10) {
      setFormError("Please provide at least 10 characters of detailed review feedback.");
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError("");

      const payload = {
        rating: formRating,
        title: formTitle.trim(),
        comment: formComment.trim(),
        images: formImages,
      };

      if (isEditing && editingReviewId) {
        await updateReview(editingReviewId, payload);
        setFormSuccess("Your review has been updated successfully!");
      } else {
        await createReview(productId, payload);
        setFormSuccess("Thank you! Your verified review has been published.");
      }

      await fetchReviews(1);
      await checkEligibility();

      setTimeout(() => {
        setIsModalOpen(false);
        setFormSuccess("");
      }, 1200);
    } catch (err) {
      setFormError(
        err.response?.data?.message || err.message || "Failed to submit review."
      );
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete review handler
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      await deleteReview(reviewId);
      await fetchReviews(currentPage);
      await checkEligibility();
    } catch (err) {
      alert("Failed to delete review. Please try again.");
    }
  };

  // Toggle helpful vote
  const handleToggleHelpful = async (reviewId) => {
    if (!user) {
      alert("Please log in to mark reviews as helpful.");
      return;
    }
    try {
      const res = await toggleReviewHelpful(reviewId);
      setReviews((prev) =>
        prev.map((r) =>
          r._id === reviewId
            ? {
                ...r,
                isHelpful: res.isHelpful,
                helpfulCount: res.helpfulCount,
              }
            : r
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || "Could not update helpful vote.");
    }
  };

  // Aggregate display calculation
  const displayedAvgRating =
    stats.totalReviews > 0
      ? stats.averageRating
      : typeof fallbackRating === "number"
      ? fallbackRating
      : 4.8;

  const displayedTotalCount =
    stats.totalReviews > 0 ? stats.totalReviews : fallbackReviewsCount;

  return (
    <div className="space-y-10" id="product-reviews-section">
      {/* ── TOP SECTION: RATING SNAPSHOT & WRITE BUTTON ────────────────── */}
      <div
        className="p-6 sm:p-8 rounded-2xl"
        style={{
          background: "var(--color-surface-alt)",
          border: "1px solid var(--color-border)",
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Column 1: Big Rating Score */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center text-center lg:border-r border-[var(--color-border)] lg:pr-8">
            <div className="text-5xl sm:text-6xl font-black tracking-tight text-[var(--color-heading)]">
              {displayedAvgRating.toFixed(1)}
            </div>
            <div className="flex items-center gap-1.5 my-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <FiStar
                  key={star}
                  size={20}
                  className={`${
                    star <= Math.round(displayedAvgRating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-neutral-300 dark:text-neutral-600"
                  }`}
                />
              ))}
            </div>
            <p className="text-sm font-medium" style={{ color: "var(--color-muted)" }}>
              Based on {displayedTotalCount.toLocaleString()}{" "}
              {displayedTotalCount === 1 ? "review" : "customer reviews"}
            </p>
            {stats.totalReviews > 0 && (
              <div className="mt-2 inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500">
                <FiCheckCircle size={13} /> 100% Real Buyer Opinions
              </div>
            )}
          </div>

          {/* Column 2: 5-Star Breakdown Progress Bars */}
          <div className="lg:col-span-5 space-y-2.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = stats.distribution[star] || 0;
              const pct = stats.breakdownPercentage[star] || 0;
              const isSelected = selectedStarFilter === star;

              return (
                <button
                  key={star}
                  onClick={() =>
                    setSelectedStarFilter(isSelected ? null : star)
                  }
                  className={`w-full group flex items-center gap-3 text-xs sm:text-sm font-medium p-1.5 rounded-lg transition text-left ${
                    isSelected
                      ? "bg-[var(--color-accent)]/10 ring-1 ring-[var(--color-accent)]"
                      : "hover:bg-[var(--color-surface)]"
                  }`}
                >
                  <span className="w-12 font-semibold text-[var(--color-heading)] flex items-center gap-1">
                    {star} <FiStar size={13} className="fill-amber-400 text-amber-400 inline" />
                  </span>

                  <div className="flex-1 h-3 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="h-full bg-amber-400 rounded-full group-hover:bg-amber-500 transition-colors"
                    />
                  </div>

                  <span className="w-12 text-right text-xs" style={{ color: "var(--color-muted)" }}>
                    {pct}% ({count})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Column 3: Call to Action / Write Review */}
          <div className="lg:col-span-3 flex flex-col items-center justify-center text-center lg:pl-4">
            <h4 className="text-base font-bold text-[var(--color-heading)] mb-1">
              Have you experienced this piece?
            </h4>
            <p className="text-xs mb-4" style={{ color: "var(--color-muted)" }}>
              Share your thoughts and photos with other home makers.
            </p>

            {user ? (
              <button
                onClick={handleOpenWriteModal}
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: "var(--color-accent)",
                  color: "#ffffff",
                }}
              >
                {eligibility.hasReviewed ? (
                  <>
                    <FiEdit2 size={16} /> Edit My Review
                  </>
                ) : (
                  <>
                    <FiPlus size={16} /> Write a Review
                  </>
                )}
              </button>
            ) : (
              <a
                href="/login"
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition hover:scale-[1.02]"
                style={{
                  background: "var(--color-accent)",
                  color: "#ffffff",
                }}
              >
                Sign In to Review
              </a>
            )}

            {user && eligibility.isVerifiedPurchase && (
              <p className="text-[11px] mt-2 flex items-center gap-1 text-emerald-500 font-semibold">
                <FiCheckCircle size={12} /> Verified Owner on Furniva
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── FILTER & SORT CONTROLS ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4 border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[var(--color-heading)]">
            Showing {totalMatching} {totalMatching === 1 ? "Review" : "Reviews"}
          </span>
          {selectedStarFilter && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-400/10 text-amber-500">
              {selectedStarFilter} Stars Only
              <button
                onClick={() => setSelectedStarFilter(null)}
                className="hover:opacity-75"
                title="Clear star filter"
              >
                <FiX size={12} />
              </button>
            </span>
          )}
          {onlyWithImages && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
              With Photos Only
              <button
                onClick={() => setOnlyWithImages(false)}
                className="hover:opacity-75"
                title="Clear photo filter"
              >
                <FiX size={12} />
              </button>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs sm:text-sm font-medium cursor-pointer text-[var(--color-body)]">
            <input
              type="checkbox"
              checked={onlyWithImages}
              onChange={(e) => setOnlyWithImages(e.target.checked)}
              className="rounded"
              style={{ accentColor: "var(--color-accent)" }}
            />
            <span>With Photos</span>
          </label>

          <div className="flex items-center gap-1.5">
            <FiFilter size={14} className="text-[var(--color-muted)]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs sm:text-sm rounded-lg px-3 py-1.5 outline-none font-medium"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                color: "var(--color-heading)",
              }}
            >
              <option value="newest">Most Recent</option>
              <option value="helpful">Most Helpful</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── REVIEWS LIST ───────────────────────────────────────────────── */}
      <div className="space-y-6">
        {loading ? (
          <div className="space-y-4 py-8">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="p-6 rounded-2xl animate-pulse space-y-3"
                style={{ background: "var(--color-surface-alt)" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                  <div className="space-y-1.5 flex-1">
                    <div className="w-32 h-4 bg-neutral-300 dark:bg-neutral-700 rounded" />
                    <div className="w-20 h-3 bg-neutral-200 dark:bg-neutral-800 rounded" />
                  </div>
                </div>
                <div className="w-48 h-4 bg-neutral-300 dark:bg-neutral-700 rounded mt-2" />
                <div className="w-full h-12 bg-neutral-200 dark:bg-neutral-800 rounded" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div
            className="p-6 rounded-2xl text-center flex flex-col items-center gap-2"
            style={{
              background: "rgba(239, 68, 68, 0.05)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              color: "var(--color-danger)",
            }}
          >
            <FiAlertCircle size={24} />
            <p className="font-semibold text-sm">{error}</p>
            <button
              onClick={() => fetchReviews(currentPage)}
              className="text-xs underline font-bold mt-1"
            >
              Retry loading reviews
            </button>
          </div>
        ) : reviews.length === 0 ? (
          <div
            className="py-16 text-center rounded-2xl flex flex-col items-center justify-center p-6"
            style={{
              background: "var(--color-surface-alt)",
              border: "1px dashed var(--color-border)",
            }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
              style={{ background: "var(--color-surface)", color: "var(--color-accent)" }}
            >
              <FiStar size={26} />
            </div>
            <h3 className="text-lg font-bold text-[var(--color-heading)] mb-1">
              No reviews match your selection
            </h3>
            <p className="text-xs max-w-md text-center mb-6" style={{ color: "var(--color-muted)" }}>
              {selectedStarFilter || onlyWithImages
                ? "Try clearing your filters to view all customer reviews."
                : "Be the first verified customer to share your thoughts on this handcrafted design."}
            </p>
            {(selectedStarFilter || onlyWithImages) && (
              <button
                onClick={() => {
                  setSelectedStarFilter(null);
                  setOnlyWithImages(false);
                }}
                className="btn-secondary text-xs px-4 py-2 rounded-lg font-semibold"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((rev) => {
              const isAuthor =
                user &&
                (rev.user?._id === user._id || rev.user === user._id || user.role === "admin");

              const userName = rev.user?.name || "Verified Customer";
              const userInitial = userName.charAt(0).toUpperCase();
              const reviewDate = rev.createdAt
                ? new Date(rev.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "Recent";

              return (
                <motion.div
                  key={rev._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="p-6 rounded-2xl transition"
                  style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  {/* Top Bar: User details, rating, badge, and date */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Avatar Circle */}
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm"
                        style={{
                          background: "var(--color-accent)",
                          color: "#ffffff",
                        }}
                      >
                        {userInitial}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-[var(--color-heading)]">
                            {userName}
                          </span>
                          {rev.verifiedPurchase && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              <FiCheckCircle size={11} /> Verified Purchase
                            </span>
                          )}
                        </div>
                        <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                          Reviewed on {reviewDate}
                        </p>
                      </div>
                    </div>

                    {/* Star Rating Display */}
                    <div className="flex items-center gap-1 bg-[var(--color-surface-alt)] px-3 py-1.5 rounded-xl self-start sm:self-auto">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <FiStar
                          key={s}
                          size={14}
                          className={`${
                            s <= rev.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-neutral-300 dark:text-neutral-600"
                          }`}
                        />
                      ))}
                      <span className="text-xs font-bold ml-1 text-[var(--color-heading)]">
                        {rev.rating}.0
                      </span>
                    </div>
                  </div>

                  {/* Review Content */}
                  <div className="mt-4 space-y-2">
                    <h4 className="font-bold text-base text-[var(--color-heading)]">
                      {rev.title}
                    </h4>
                    <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--color-body)" }}>
                      {rev.comment}
                    </p>
                  </div>

                  {/* Image Gallery */}
                  {rev.images && rev.images.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2.5">
                      {rev.images.map((img, idx) => {
                        const imgUrl = typeof img === "string" ? img : img.url;
                        return (
                          <button
                            key={idx}
                            onClick={() => setLightboxImage(imgUrl)}
                            className="relative group w-20 h-20 rounded-xl overflow-hidden border border-[var(--color-border)] focus:outline-none"
                          >
                            <img
                              src={imgUrl}
                              alt={`Customer Review ${idx + 1}`}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold">
                              Zoom
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Review Footer Actions (Helpful vote & Edit/Delete for author) */}
                  <div className="mt-5 pt-4 border-t flex items-center justify-between gap-4 border-[var(--color-border)] text-xs">
                    <button
                      onClick={() => handleToggleHelpful(rev._id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
                        rev.isHelpful
                          ? "bg-[var(--color-accent)] text-white"
                          : "bg-[var(--color-surface-alt)] hover:bg-[var(--color-border)] text-[var(--color-body)]"
                      }`}
                    >
                      <FiThumbsUp size={13} className={rev.isHelpful ? "fill-current" : ""} />
                      <span>
                        Helpful ({rev.helpfulCount || 0})
                      </span>
                    </button>

                    {isAuthor && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEditSpecific(rev)}
                          className="p-1.5 rounded hover:bg-[var(--color-surface-alt)] text-[var(--color-muted)] hover:text-[var(--color-heading)]"
                          title="Edit your review"
                        >
                          <FiEdit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteReview(rev._id)}
                          className="p-1.5 rounded hover:bg-rose-500/10 text-rose-500"
                          title="Delete review"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* ── PAGINATION CONTROLS ────────────────────────────────────── */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-6">
            <button
              onClick={() => fetchReviews(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-xl border border-[var(--color-border)] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--color-surface-alt)] transition"
              aria-label="Previous Reviews Page"
            >
              <FiChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                onClick={() => fetchReviews(pg)}
                className={`w-9 h-9 rounded-xl font-bold text-xs transition ${
                  pg === currentPage
                    ? "bg-[var(--color-accent)] text-white shadow-sm"
                    : "border border-[var(--color-border)] hover:bg-[var(--color-surface-alt)] text-[var(--color-body)]"
                }`}
              >
                {pg}
              </button>
            ))}

            <button
              onClick={() => fetchReviews(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl border border-[var(--color-border)] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--color-surface-alt)] transition"
              aria-label="Next Reviews Page"
            >
              <FiChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* ── WRITE / EDIT REVIEW MODAL ──────────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 shadow-2xl"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                color: "var(--color-heading)",
              }}
            >
              {/* Close Button */}
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-full hover:bg-[var(--color-surface-alt)] text-[var(--color-muted)] hover:text-[var(--color-heading)] transition"
              >
                <FiX size={20} />
              </button>

              <div className="mb-6">
                <span
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: "var(--color-accent)" }}
                >
                  {isEditing ? "Update Feedback" : "Share Experience"}
                </span>
                <h3 className="text-2xl font-bold mt-1">
                  {isEditing ? "Edit Your Review" : "Write a Customer Review"}
                </h3>
                <p className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>
                  Your feedback helps craft better living spaces for everyone.
                </p>
              </div>

              {formError && (
                <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold flex items-center gap-2">
                  <FiAlertCircle size={16} />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold flex items-center gap-2">
                  <FiCheckCircle size={16} />
                  <span>{formSuccess}</span>
                </div>
              )}

              <form onSubmit={handleSubmitReview} className="space-y-5">
                {/* 1. Rating Selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2">
                    Overall Rating <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const activeScore = hoverRating || formRating;
                      return (
                        <button
                          type="button"
                          key={star}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setFormRating(star)}
                          className="p-1 transition transform hover:scale-125 focus:outline-none"
                        >
                          <FiStar
                            size={28}
                            className={`${
                              star <= activeScore
                                ? "fill-amber-400 text-amber-400"
                                : "text-neutral-300 dark:text-neutral-700"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs font-semibold mt-1.5 text-amber-500">
                    {RATING_LABELS[hoverRating || formRating]}
                  </p>
                </div>

                {/* 2. Headline / Title */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2">
                    Review Headline <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={120}
                    placeholder="e.g., Exceptional comfort and artisan solid wood finish!"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none font-medium transition"
                    style={{
                      background: "var(--color-surface-alt)",
                      border: "1px solid var(--color-border)",
                      color: "var(--color-heading)",
                    }}
                  />
                </div>

                {/* 3. Detailed Feedback */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2">
                    Detailed Review <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    maxLength={2000}
                    placeholder="Describe what you loved, the wood quality, fabric touch, assembly experience, and how it fits into your home..."
                    value={formComment}
                    onChange={(e) => setFormComment(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none font-medium transition"
                    style={{
                      background: "var(--color-surface-alt)",
                      border: "1px solid var(--color-border)",
                      color: "var(--color-heading)",
                    }}
                  />
                  <div className="text-right text-[11px] mt-1" style={{ color: "var(--color-muted)" }}>
                    {formComment.length}/2000 characters
                  </div>
                </div>

                {/* 4. Photo Uploads */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2">
                    Upload Photos <span className="text-[11px] font-normal lowercase">(optional, max 5)</span>
                  </label>

                  <div className="flex flex-wrap gap-3 items-center">
                    {formImages.map((img, idx) => {
                      const imgUrl = typeof img === "string" ? img : img.url;
                      return (
                        <div
                          key={idx}
                          className="relative w-16 h-16 rounded-xl overflow-hidden border border-[var(--color-border)]"
                        >
                          <img
                            src={imgUrl}
                            alt={`Preview ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveFormImage(idx)}
                            className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 hover:bg-rose-600 transition"
                          >
                            <FiX size={10} />
                          </button>
                        </div>
                      );
                    })}

                    {formImages.length < 5 && (
                      <label
                        className={`w-16 h-16 rounded-xl border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center cursor-pointer hover:border-[var(--color-accent)] transition text-[var(--color-muted)] hover:text-[var(--color-heading)] ${
                          uploadingImages ? "opacity-50 pointer-events-none" : ""
                        }`}
                      >
                        <FiCamera size={18} />
                        <span className="text-[9px] mt-0.5 font-bold">
                          {uploadingImages ? "Uploading" : "Add"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageFileChange}
                          className="hidden"
                          disabled={uploadingImages}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Modal Buttons */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[var(--color-surface-alt)] transition"
                    style={{ color: "var(--color-body)" }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={formSubmitting || uploadingImages}
                    className="px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition disabled:opacity-50"
                    style={{
                      background: "var(--color-accent)",
                      color: "#ffffff",
                    }}
                  >
                    {formSubmitting
                      ? "Submitting..."
                      : isEditing
                      ? "Update Review"
                      : "Publish Review"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── PHOTO LIGHTBOX MODAL ───────────────────────────────────────── */}
      <AnimatePresence>
        {lightboxImage && (
          <div
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md cursor-zoom-out"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-3xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setLightboxImage(null)}
                className="absolute top-4 right-4 bg-black/60 hover:bg-black text-white p-2 rounded-full transition"
              >
                <FiX size={20} />
              </button>
              <img
                src={lightboxImage}
                alt="Enlarged Customer Review Photo"
                className="w-full h-full max-h-[80vh] object-contain rounded-2xl"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
