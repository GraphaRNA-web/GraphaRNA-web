import React, { useEffect } from "react";
import "../styles/validationWarningModal.css";


function parseRnaStructure(input: string) {
  const validBrackets = "()<>[]{}AaBbCcDd.";
  const validNucleotides = "AUGC";

  // usuń komentarze i puste linie
  const lines = input
    .split("\n")
    .map(l => l.trim())
    .filter(l => l !== "" && !l.startsWith("#"));

  let nucleotides: string[] = [];
  let dotBrackets: string[] = [];

  // sprawdź czy mamy nagłówki ">"
  const potentialNameLines = lines.filter((_, i) => i % 3 === 0);
  const areNameLines = potentialNameLines.map(l => l.startsWith(">"));
  const containsStrandNames =
    areNameLines.length > 0 && areNameLines.every(b => b);

  if (containsStrandNames) {
    for (let i = 0; i < lines.length; i += 3) {
      const block = lines.slice(i, i + 3);
      if (block.length < 3) continue; // pomiń niekompletne
      nucleotides.push(block[1].toUpperCase().replace(/T/g, "U"));
      dotBrackets.push(block[2]);
    }
  } else {
    for (let i = 0; i < lines.length; i += 2) {
      const block = lines.slice(i, i + 2);
      if (block.length < 2) continue;
      nucleotides.push(block[0].toUpperCase().replace(/T/g, "U"));
      dotBrackets.push(block[1]);
    }
  }

  return {
    nucleotides: nucleotides.join(" "),
    brackets: dotBrackets.join(" "),
  };
}



type HighlightOptions = {
  mismatchingBrackets: number[];
  incorrectPairs: [number, number][];
  mode: "input" | "corrected";
};

export function highlightRNA(seq: string, opts: HighlightOptions) {
  const { mismatchingBrackets = [], incorrectPairs = [], mode } = opts;
  const errorIdx = new Set<number>([
    ...mismatchingBrackets,
    ...incorrectPairs.flat(),
  ]);

  return seq.split("").map((ch, i) => {
    if (errorIdx.has(i)) {
      return (
        <span
          key={i}
          className={mode === "input" ? "rna-error" : "rna-fix"}
        >
          {ch}
        </span>
      );
    }
    return <span key={i}>{ch}</span>;
  });
}

type ValidationWarningModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  text: string;
  correctedText: string;
  mismatchingBrackets: number[];
  incorrectPairs: [number, number][];
};

export default function ValidationWarningModal({
  isOpen,
  onClose,
  onConfirm,
  text,
  correctedText,
  mismatchingBrackets,
  incorrectPairs,
}: ValidationWarningModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  const renderRnaBlock = (seq: string, mode: "input" | "corrected") => {
    const { nucleotides, brackets } = parseRnaStructure(seq);
    return (
      <div className="rna-block">
        <div className="rna-line">
          {highlightRNA(nucleotides, { mismatchingBrackets, incorrectPairs, mode })}
        </div>
        <div className="rna-line">
          {highlightRNA(brackets, { mismatchingBrackets, incorrectPairs, mode })}
        </div>
      </div>
    );
  };

  return (
    <div className="vwm-overlay">
      <div className="vwm-box">
        <div className="vwm-header">
          <img
            src="warning_validation.svg"
            alt="Warning"
            className="vwm-icon"
          />
          <h2 className="vwm-title">Validation warning</h2>
        </div>
        <p className="vwm-subtitle">
          We found some mistakes in provided RNA structure. We suggest some
          fixes.
        </p>

        <div className="vwm-structures">
          <div className="vwm-structure-row">
            <span className="vwm-label">input structure:</span>
            <div className="vwm-value">
              {renderRnaBlock(text, "input")}
            </div>
          </div>
          <div className="vwm-divider" />
          <div className="vwm-structure-row">
            <span className="vwm-label">suggested structure:</span>
            <div className="vwm-value">
              {renderRnaBlock(correctedText, "corrected")}
            </div>
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
