import React, { useState, useEffect } from "react";
import { FiDownload, FiX, FiCheck } from "react-icons/fi";

/**
 * PwaInstallPrompt component
 * Detects installability, captures beforeinstallprompt, and provides a polished install button.
 */
export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem("furniva_pwa_dismissed") === "true";
  });

  useEffect(() => {
    // Check if already in standalone mode
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    ) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("furniva_pwa_dismissed", "true");
  };

  if (!isInstallable || isInstalled || dismissed) {
    return null;
  }

  return (
    <div
      role="banner"
      aria-label="Install Furniva App"
      className="fixed bottom-6 right-6 z-40 max-w-sm p-4 rounded-3xl border shadow-2xl transition-all duration-300 animate-fade-in flex items-center gap-3.5 backdrop-blur-md"
      style={{
        background: "var(--color-surface)",
        borderColor: "var(--color-border)",
        boxShadow: "var(--shadow-xl)",
      }}
    >
      <div
        className="w-11 h-11 rounded-2xl flex items-center justify-center text-white flex-shrink-0 shadow-md"
        style={{
          background: "linear-gradient(135deg, #8B5E3C 0%, #4A301D 100%)",
        }}
      >
        <FiDownload size={20} />
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-bold text-[var(--color-heading)] truncate">
          Install Furniva App
        </h4>
        <p className="text-[11px] leading-tight mt-0.5" style={{ color: "var(--color-muted)" }}>
          Fast offline catalog & instant order tracking
        </p>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          type="button"
          onClick={handleInstallClick}
          className="btn-primary text-xs !py-1.5 !px-3 !rounded-xl font-bold"
        >
          Install
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1.5 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-heading)] transition"
          aria-label="Dismiss app install banner"
        >
          <FiX size={15} />
        </button>
      </div>
    </div>
  );
}
