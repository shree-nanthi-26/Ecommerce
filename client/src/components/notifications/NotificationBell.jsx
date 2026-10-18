import React, { useState, useRef, useEffect } from "react";
import { FiBell } from "react-icons/fi";
import { useNotification } from "../../context/NotificationContext";
import NotificationDropdown from "./NotificationDropdown";

export default function NotificationBell({ className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const { unreadCount } = useNotification();

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={toggleDropdown}
        className="relative p-2 rounded-xl text-[var(--color-chrome-text)] hover:text-white hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
        aria-label={`Notifications, ${unreadCount} unread`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <FiBell size={21} className="transition-transform group-hover:rotate-12" />

        {/* Live Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full text-[11px] font-bold text-white bg-rose-600 shadow-sm border-2 border-[var(--color-chrome)] animate-in zoom-in duration-200">
            {unreadCount > 99 ? "99+" : unreadCount}
            {/* Subtle pulsing outer ring */}
            <span className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-60 pointer-events-none" />
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      <NotificationDropdown isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
}
