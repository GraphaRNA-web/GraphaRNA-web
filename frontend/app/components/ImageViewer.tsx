import React, { useRef, useState, useEffect } from "react";
import "../styles/PdbViewer.css";

interface ImageViewerProps {
  title: string;
  src: string;
  width: number | string;
  height: number | string;
}

export default function ImageViewer({
  title,
  src,
  width,
  height,
}: ImageViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [start, setStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFsChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const zoomIn = () => setScale((s) => Math.min(s * 1.2, 5));
  const zoomOut = () => setScale((s) => Math.max(s * 0.8, 0.2));

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    setStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setOffset({ x: e.clientX - start.x, y: e.clientY - start.y });
  };

  const stopDragging = () => setDragging(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      let delta = e.deltaY;
      if (e.ctrlKey) delta = -delta;

      const zoomFactor = delta > 0 ? 1.1 : 0.9;
      setScale((s) => Math.min(Math.max(s * zoomFactor, 0.2), 5));
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    setDragging(true);
    setStart({
      x: e.touches[0].clientX - offset.x,
      y: e.touches[0].clientY - offset.y,
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragging || e.touches.length !== 1) return;
    setOffset({
      x: e.touches[0].clientX - start.x,
      y: e.touches[0].clientY - start.y,
    });
  };

  const handleTouchEnd = () => setDragging(false);

  return (
    <div
      ref={containerRef}
      className={`pdb-viewer-wrapper ${isFullscreen ? "fullscreen" : ""}`}
      style={{
        width: isFullscreen ? "100%" : width,
        height: isFullscreen ? "100%" : height,
      }}
    >
      <div className="header-bar">
        <span className="file-name">{title}</span>
        <div className="controls-header">
          <button onClick={zoomIn}>＋</button>
          <button onClick={zoomOut}>－</button>
          <button onClick={toggleFullscreen}>
            {isFullscreen ? "🡽" : "⛶"}
          </button>
        </div>
      </div>

      <div
        className="viewer-container"
        style={{
          width: "100%",
          height: "calc(100% - 50px)",
          overflow: "hidden",
          background: "#fff",
          cursor: dragging ? "grabbing" : "grab",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDragging}
        onMouseLeave={stopDragging}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={src}
          alt={title}
          draggable={false}
          style={{
            transform: `scale(${scale}) translate(${offset.x / scale}px, ${
              offset.y / scale
            }px)`,
            transformOrigin: "top left",
            transition: dragging ? "none" : "transform 0.2s ease",
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
            userSelect: "none",
          }}
        />
      </div>
    </div>
  );
}
