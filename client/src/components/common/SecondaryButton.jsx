import React from "react";

/**
 * SecondaryButton – reusable button component that uses the global .btn-secondary style.
 * Accepts all standard button props and merges any custom class names.
 */
export default function SecondaryButton({ children, className = "", ...props }) {
  return (
    <button className={`btn-secondary ${className}`} {...props}>
      {children}
    </button>
  );
}
