import React from "react";

function Button({ children, onClick, type = "button", variant = "primary", className = "", disabled = false, ...props }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn ${variant} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
