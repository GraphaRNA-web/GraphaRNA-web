import React, { useRef, useState, useEffect } from "react";

import "../styles/PdbViewer.css";

interface ImageViewerProps {
  title: string;
  src: string;
  width: number | string;
  height: number | string;
  onExpandChange?: (expanded: boolean) => void;
}

export default function ImageViewer({title, src, width, height, onExpandChange }: ImageViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [start, setStart] = useState({ x: 0, y: 0 });
  const [isExpanded, setIsExpanded] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);

  const fullWidth = 1120;
  const fullHeight = 1274;

  // Powiększanie i pomniejszanie przyciskami
  const zoomIn = () => setScale((s) => Math.min(s * 1.2, 5));
  const zoomOut = () => setScale((s) => Math.max(s * 0.8, 0.2));

  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const canExpand = windowWidth >= fullWidth;

  const toggleExpand = () => {
    setIsExpanded((prev) => {
      if (prev) setOffset({ x: 0, y: 0 }); // reset pozycji jeśli zmniejszamy
      return !prev;
    });
  };
  // Powiadamianie rodzica tylko po zmianie stanu
  useEffect(() => {
    onExpandChange?.(isExpanded);
  }, [isExpanded, onExpandChange]);

  // Przesuwanie myszką
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    setStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setOffset({ x: e.clientX - start.x, y: e.clientY - start.y });
  };
  const handleMouseUp = () => setDragging(false);

  // Scroll / touchpad do zoomu
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setScale((s) => Math.min(Math.max(s * zoomFactor, 0.2), 5));
  };

  // Touch gestures (przesuwanie)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setDragging(true);
      setStart({ x: e.touches[0].clientX - offset.x, y: e.touches[0].clientY - offset.y });
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragging || e.touches.length !== 1) return;
    setOffset({ x: e.touches[0].clientX - start.x, y: e.touches[0].clientY - start.y });
  };
  const handleTouchEnd = () => setDragging(false);

  return (
    <div
      ref={containerRef}
      className="pdb-viewer-wrapper"
      style={{
        width: isExpanded ? fullWidth : width,
        height: isExpanded ? fullHeight : height,
      }}
    >
      <div className="header-bar">
        <span className="file-name">{title}</span>
          <div className="controls-header">
            <button onClick={zoomIn}>＋</button>
            <button onClick={zoomOut}>－</button>
            {canExpand && (
              <button onClick={toggleExpand}>{isExpanded ? "🡽" : "⛶"}</button>
            )}
          </div>

      </div>

      <div
        className="viewer-container"
        style={{
          width: "100%",
          height: "calc(100% - 50px)",
          overflow: "hidden",
          backgroundColor: "#fff",
          cursor: dragging ? "grabbing" : "grab",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={src}
          alt="Zoomable"
          style={{
            transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`,
            transformOrigin: "top left",
            transition: dragging ? "none" : "transform 0.2s ease-in-out",
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
          }}
        />
      </div>
    </div>
  );
}
