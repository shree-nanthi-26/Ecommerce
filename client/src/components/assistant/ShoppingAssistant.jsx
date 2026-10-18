import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  FiSend,
  FiX,
  FiShoppingBag,
  FiExternalLink,
  FiCheck,
  FiTrash2,
  FiStar,
  FiMinimize2,
  FiMaximize2,
  FiTag,
} from "react-icons/fi";
import { chatWithAssistant, getAssistantSuggestions } from "../../services/assistantService";
import { useCart } from "../../context/CartContext";

const INITIAL_GREETING = {
  sender: "assistant",
  text: "Hello! I'm your Furniva AI Shopping Assistant. Tell me your budget, room size, style, or specific dimensions, and I will find real, in-stock furniture directly from our database.",
  products: [],
  filters: {},
  suggestedQuestions: [
    "I need a modern sofa for a small living room under ₹30,000",
    "Show solid wood dining tables with seating for 6",
    "Looking for a queen bed with storage under ₹40,000",
    "Compact ergonomic office chairs under ₹15,000",
  ],
  timestamp: new Date(),
};

export default function ShoppingAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState([INITIAL_GREETING]);
  const [loading, setLoading] = useState(false);
  const [addedItemIds, setAddedItemIds] = useState(new Set());
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const { addToCart } = useCart();

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [messages, isOpen]);

  // Load default suggestions
  useEffect(() => {
    getAssistantSuggestions()
      .then((res) => {
        if (res.suggestions?.length) {
          setMessages((prev) => [
            {
              ...prev[0],
              suggestedQuestions: res.suggestions,
            },
            ...prev.slice(1),
          ]);
        }
      })
      .catch(() => {});
  }, []);

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const userMsg = {
      sender: "user",
      text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setLoading(true);

    try {
      // Build conversation history for context
      const history = messages
        .filter((m) => m.text)
        .map((m) => ({
          role: m.sender === "user" ? "user" : "assistant",
          content: m.text,
        }));

      const res = await chatWithAssistant(text, history);

      const assistantMsg = {
        sender: "assistant",
        text: res.message,
        products: res.products || [],
        filters: res.parsedFilters || {},
        suggestedQuestions: res.suggestedQuestions || [],
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "assistant",
          text:
            err.response?.data?.message ||
            "I encountered a temporary connection issue. Please check your query and try again.",
          products: [],
          filters: {},
          suggestedQuestions: ["Show bestselling sofas", "Show products under ₹25,000"],
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    setAddedItemIds((prev) => new Set([...prev, product._id]));
    setTimeout(() => {
      setAddedItemIds((prev) => {
        const next = new Set(prev);
        next.delete(product._id);
        return next;
      });
    }, 2500);
  };

  const handleClearChat = () => {
    setMessages([INITIAL_GREETING]);
  };

  return (
    <>
      {/* ── Floating Launcher Button ── */}
      {!isOpen && (
        <button
          type="button"
          id="open-shopping-assistant-btn"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full shadow-2xl text-white font-bold text-xs sm:text-sm transition-all duration-300 transform hover:scale-105 active:scale-95 group"
          style={{
            background: "linear-gradient(135deg, var(--color-accent) 0%, #B84D00 100%)",
            boxShadow: "0 8px 25px rgba(220, 95, 0, 0.4)",
          }}
          title="Furniva AI Shopping Assistant"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
          </span>
          <span className="tracking-wide">AI Designer & Assistant</span>
        </button>
      )}

      {/* ── Slide-Out Assistant Window ── */}
      {isOpen && (
        <div
          className={`fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 flex flex-col rounded-t-3xl sm:rounded-3xl border shadow-2xl overflow-hidden transition-all duration-300 ${
            isExpanded
              ? "w-full h-full sm:w-[650px] sm:h-[750px]"
              : "w-full h-[90vh] sm:w-[480px] sm:h-[620px]"
          }`}
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
            boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.3)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-surface)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center font-extrabold text-white text-base shadow"
                style={{
                  background: "linear-gradient(135deg, var(--color-accent) 0%, #E65100 100%)",
                }}
              >
                ✦
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[var(--color-heading)]">
                    Furniva AI Shopping Assistant
                  </h3>
                  <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Catalog
                  </span>
                </div>
                <p className="text-[11px] text-[var(--color-muted)]">
                  Grounded in real MongoDB inventory
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-[var(--color-muted)]">
              <button
                type="button"
                onClick={handleClearChat}
                className="p-2 rounded-xl hover:text-[var(--color-heading)] hover:bg-[var(--color-surface-alt)] transition"
                title="Clear Chat History"
              >
                <FiTrash2 size={15} />
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="hidden sm:block p-2 rounded-xl hover:text-[var(--color-heading)] hover:bg-[var(--color-surface-alt)] transition"
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? <FiMinimize2 size={15} /> : <FiMaximize2 size={15} />}
              </button>
              <button
                type="button"
                id="close-shopping-assistant-btn"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl hover:text-[var(--color-heading)] hover:bg-[var(--color-surface-alt)] transition"
                title="Close"
              >
                <FiX size={18} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 text-sm">
            {messages.map((msg, index) => {
              const isUser = msg.sender === "user";

              return (
                <div
                  key={index}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                >
                  {/* Bubble */}
                  <div
                    className={`max-w-[90%] rounded-2xl px-4 py-3 leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? "text-white font-medium rounded-tr-none shadow-md"
                        : "text-[var(--color-body)] border rounded-tl-none"
                    }`}
                    style={{
                      background: isUser ? "var(--color-accent)" : "var(--color-surface-alt)",
                      borderColor: isUser ? "transparent" : "var(--color-border)",
                    }}
                  >
                    {msg.text}
                  </div>

                  {/* Filter tags badge (if present) */}
                  {!isUser && msg.filters && Object.keys(msg.filters).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5 max-w-[95%]">
                      {msg.filters.category && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-heading)]">
                          <FiTag size={10} className="text-[var(--color-accent)]" />
                          Category: {msg.filters.category}
                        </span>
                      )}
                      {msg.filters.maxPrice && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-heading)]">
                          Budget: ≤ ₹{msg.filters.maxPrice.toLocaleString("en-IN")}
                        </span>
                      )}
                      {msg.filters.roomType && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-heading)]">
                          Room: {msg.filters.roomType}
                        </span>
                      )}
                      {msg.filters.style && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-heading)]">
                          Style: {msg.filters.style}
                        </span>
                      )}
                      {msg.filters.inStock && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          In Stock Only
                        </span>
                      )}
                    </div>
                  )}

                  {/* REAL Product Cards */}
                  {!isUser && msg.products && msg.products.length > 0 && (
                    <div className="grid grid-cols-1 gap-3 mt-3 w-full">
                      {msg.products.map((product) => {
                        const isAdded = addedItemIds.has(product._id);
                        const imageUrl =
                          product.images?.[0]?.url ||
                          (typeof product.images?.[0] === "string" ? product.images[0] : null) ||
                          "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80";

                        return (
                          <div
                            key={product._id}
                            className="rounded-2xl border p-3 flex gap-3 transition-all duration-200 hover:shadow-md"
                            style={{
                              background: "var(--color-surface)",
                              borderColor: "var(--color-border)",
                            }}
                          >
                            {/* Thumbnail */}
                            <Link
                              to={`/products/${product._id}`}
                              className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 relative bg-neutral-100 dark:bg-neutral-800"
                            >
                              <img
                                src={imageUrl}
                                alt={product.name}
                                className="w-full h-full object-cover transition transform hover:scale-105"
                                loading="lazy"
                              />
                              {product.stock > 0 && (
                                <span className="absolute bottom-1 left-1 text-[9px] font-bold px-1.5 py-0.2 rounded bg-black/70 text-white backdrop-blur-xs">
                                  {product.stock} in stock
                                </span>
                              )}
                            </Link>

                            {/* Details */}
                            <div className="flex-1 flex flex-col justify-between min-w-0">
                              <div>
                                <div className="flex items-start justify-between gap-1">
                                  <Link
                                    to={`/products/${product._id}`}
                                    className="font-bold text-xs sm:text-sm text-[var(--color-heading)] hover:text-[var(--color-accent)] transition line-clamp-1"
                                    title={product.name}
                                  >
                                    {product.name}
                                  </Link>
                                </div>

                                <div className="flex items-center gap-2 mt-1">
                                  <span className="font-extrabold text-sm sm:text-base text-[var(--color-heading)]">
                                    ₹{product.price?.toLocaleString("en-IN")}
                                  </span>
                                  {product.oldPrice && product.oldPrice > product.price && (
                                    <span className="text-[11px] text-[var(--color-muted)] line-through">
                                      ₹{product.oldPrice?.toLocaleString("en-IN")}
                                    </span>
                                  )}
                                  {product.rating > 0 && (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-500">
                                      <FiStar size={10} className="fill-amber-500" />
                                      {product.rating}
                                    </span>
                                  )}
                                </div>

                                {/* Key Specs Pill Highlights */}
                                <div className="flex flex-wrap gap-1 mt-1.5 text-[10px] text-[var(--color-muted)]">
                                  {product.specs?.dimensions && (
                                    <span className="bg-[var(--color-surface-alt)] px-1.5 py-0.5 rounded truncate max-w-[150px]">
                                      {product.specs.dimensions}
                                    </span>
                                  )}
                                  {product.specs?.material && (
                                    <span className="bg-[var(--color-surface-alt)] px-1.5 py-0.5 rounded truncate max-w-[150px]">
                                      {product.specs.material}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Action buttons */}
                              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[var(--color-border)]">
                                <Link
                                  to={`/products/${product._id}`}
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--color-muted)] hover:text-[var(--color-heading)] transition"
                                >
                                  <span>View Specs</span>
                                  <FiExternalLink size={11} />
                                </Link>

                                <button
                                  type="button"
                                  onClick={() => handleAddToCart(product)}
                                  disabled={product.stock <= 0}
                                  className={`ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition text-white ${
                                    isAdded ? "bg-emerald-600" : "hover:opacity-95"
                                  }`}
                                  style={{
                                    background: isAdded ? "#10B981" : "var(--color-accent)",
                                  }}
                                >
                                  {isAdded ? (
                                    <>
                                      <FiCheck size={12} />
                                      <span>Added</span>
                                    </>
                                  ) : (
                                    <>
                                      <FiShoppingBag size={12} />
                                      <span>Add to Cart</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Follow-up question chips */}
                  {!isUser && msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3 max-w-full">
                      {msg.suggestedQuestions.map((q, qIdx) => (
                        <button
                          key={qIdx}
                          type="button"
                          onClick={() => handleSendMessage(q)}
                          className="text-left text-xs px-3 py-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-body)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition truncate max-w-full"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Loading typing indicator */}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-[var(--color-muted)] p-3 rounded-2xl bg-[var(--color-surface-alt)] max-w-xs border border-[var(--color-border)]">
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-bounce [animation-delay:0.4s]" />
                </span>
                <span>Searching catalog & analyzing dimensions...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div
            className="p-3 sm:p-4 border-t flex-shrink-0"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-surface)",
            }}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                id="shopping-assistant-input"
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about sofas, dimensions, prices, or room styling..."
                disabled={loading}
                className="flex-1 rounded-xl border px-4 py-2.5 text-xs sm:text-sm outline-none transition"
                style={{
                  background: "var(--color-surface-alt)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-heading)",
                }}
              />

              <button
                type="submit"
                id="shopping-assistant-send-btn"
                disabled={loading || !inputMessage.trim()}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition disabled:opacity-40 flex-shrink-0"
                style={{ background: "var(--color-accent)" }}
                title="Send Message"
              >
                <FiSend size={15} />
              </button>
            </form>

            <p className="text-[10px] text-center text-[var(--color-muted)] mt-2">
              ✦ Products and prices are fetched live from Furniva's MongoDB inventory.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
