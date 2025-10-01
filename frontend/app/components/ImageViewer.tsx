import React, { useRef, useState } from "react";
import "../styles/PdbViewer.css";

interface ImageViewerProps {
  src: string;
  width: number | string;
  height: number | string;
  onExpandChange?: (expanded: boolean) => void;
}

export default function ImageViewer({ src, width, height, onExpandChange }: ImageViewerProps) {
  const [scale, setScale] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const zoomIn = () => {
    setScale((s) => {
      const newScale = Math.min(s * 1.2, 5);
      onExpandChange?.(newScale > 1);
      return newScale;
    });
  };

  const zoomOut = () => {
    setScale((s) => {
      const newScale = Math.max(s * 0.8, 0.2);
      onExpandChange?.(newScale > 1);
      return newScale;
    });
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    onExpandChange?.(!isExpanded);
  };

  return (
    <div
      ref={containerRef}
      className={`pdb-viewer-wrapper`}
      style={{
        width: isExpanded ? 1120 : width,
        height: isExpanded ? 1274 : height,
      }}
    >
      <div className="header-bar">
        <span className="file-name">2D structure</span>
        <div className="controls-header">
          <button onClick={zoomIn}>＋</button>
          <button onClick={zoomOut}>－</button>
          <button onClick={toggleExpand}>{isExpanded ? "🡽" : "⛶"}</button>
        </div>
      </div>

      <div
        className="viewer-container"
        style={{
          width: "100%",
          height: "calc(100% - 50px)",
          overflow: "hidden",
          backgroundColor: "#fff",
        }}
      >
        <img
          src={src}
          alt="Zoomable"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "center",
            transition: "transform 0.2s ease-in-out",
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
            margin: "0 auto",
          }}
        />
      </div>
    </div>
  );
}
