import React from "react";
import "./LoadingSpinner.css";

function LoadingSpinner({ message = "AI is thinking..." }) {
  return (
    <div className="spinner-overlay">
      <div className="spinner-card">
        <div className="pulsing-logo">
          <div className="pulse-ring"></div>
          <div className="pulse-ring delay"></div>
          <div className="pulse-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </div>
        </div>
        <p className="spinner-text">{message}</p>
        <span className="spinner-subtext">Generating interview questions tailored to your profile...</span>
      </div>
    </div>
  );
}

export default LoadingSpinner;
