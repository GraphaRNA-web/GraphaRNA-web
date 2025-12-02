import React, { useEffect } from "react";
import "../styles/serverErrorModal.css";

type ServerErrorModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ServerErrorModal({ isOpen, onClose }: ServerErrorModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="sem-overlay">
      <div className="sem-box">
        <div className="sem-header">
          <img
            src="/icons/error.svg"
            alt="Server Error"
            className="sem-icon"
          />
          <h2 className="sem-title">A server error occured.</h2>
        </div>

        <p className="sem-subtitle">
            Something went wrong on our end. Please try again later.
        </p>

        <div className="sem-actions">
          <button className="sem-btn cancel" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
