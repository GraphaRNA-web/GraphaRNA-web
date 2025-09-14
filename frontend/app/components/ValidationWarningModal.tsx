import React, { useEffect } from "react";
import '../styles/validationWarningModal.css';

type ValidationWarningModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  text: string;
  correctedText: string;
};

export default function ValidationWarningModal({
  isOpen,
  onClose,
  onConfirm,
  text,
  correctedText,
}: ValidationWarningModalProps) {
  // zamykanie ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="vwm-overlay">
      <div className="vwm-box">
        <div className="vwm-header">
          <img src='warning_validation.svg' alt="Warning" className="vwm-icon" />
          <h2 className="vwm-title">Validation warning</h2>
        </div>
        <p className="vwm-subtitle">
          We found some mistakes in provided RNA structure. We suggest some fixes.
        </p>

        <div className="vwm-structures">
          <div className="vwm-structure-row">
            <span className="vwm-label">input structure:</span>
            <span className="vwm-value">{text}</span>
          </div>
          <div className="vwm-divider" />
          <div className="vwm-structure-row">
            <span className="vwm-label">suggested structure:</span>
            <span className="vwm-value highlight">{correctedText}</span>
          </div>
        </div>

        <div className="vwm-strip">
          Please confirm if you want to use the suggested structure.
        </div>

        <div className="vwm-actions">
          <button className="vwm-btn cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="vwm-btn confirm" onClick={onConfirm}>
            Agree
          </button>
        </div>
      </div>
    </div>
  );
}