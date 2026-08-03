import React from "react";

/**
 * PrimaryButton – reusable button component that uses the global .btn-primary style.
 * Accepts all standard button props (onClick, type, disabled, aria-*) and merges
 * any additional class names passed via the `className` prop.
 */
export default function PrimaryButton({ children, className = "", ...props }) {
  return (
    <button className={`btn-primary ${className}`} {...props}>
      {children}
    </button>
  );
}
