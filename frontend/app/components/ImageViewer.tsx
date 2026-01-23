import React, { useRef, useState, useEffect } from "react";
import "../styles/PdbViewer.css";

interface ImageViewerProps {
  title: string;
  src: string;
  width: number | string;
  height: number | string;
  jobname: string;
}

export default function ImageViewer({
  title,
  src,
  width,
  height,
  jobname
  startScale = 1,
}: ImageViewerProps) {
  const viewerRef = useRef<HTMLDivElement | null>(null);

  const [scale, setScale] = useState(startScale);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [start, setStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!viewerRef.current) return;

    if (!document.fullscreenElement) {
      viewerRef.current.requestFullscreen();
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

  const downloadFile = () => {
    if (!src) return;

    const [meta, base64Data] = src.split(",");
    if (!base64Data) return;

    const isSvg = meta.includes("image/svg+xml");
    const mime = isSvg ? "image/svg+xml" : "image/png";
    const ext = isSvg ? "svg" : "png";

    const byteString = atob(base64Data);
    const byteArray = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
      byteArray[i] = byteString.charCodeAt(i);
    }

    const blob = new Blob([byteArray], { type: mime });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    const baseName = title.toLowerCase().includes("arc")
      ? "Arc_Diagram"
      : "2D_structure";

    a.download = jobname
      ? `${jobname}_${baseName}.${ext}`
      : `${baseName}.${ext}`;

    a.click();

    URL.revokeObjectURL(url);
  };

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
    const el = viewerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      let delta = e.deltaY;
      if (e.ctrlKey) delta = -delta;

      const zoomFactor = delta > 0 ? 0.9 : 1.1;
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
      className={`pdb-viewer-wrapper ${isFullscreen ? "fullscreen" : ""}`}
      style={{
        width: isFullscreen ? "100%" : width,
        height: isFullscreen ? "100%" : height,
      }}
    >
      <div className="header-bar">
        <span className="file-name">{title}</span>
        <div className="controls-header">
          <button className='download-single-file' onClick={downloadFile}>
            <img src='/icons/download.svg' alt="Download icon"/>
          </button>
          <button className='controls-header-button' onClick={zoomIn}>＋</button>
          <button className='controls-header-button' onClick={zoomOut}>－</button>
          <button className='controls-header-button' onClick={toggleFullscreen}>{isFullscreen ? "🡽" : "⛶"}</button>
        </div>
      </div>

      <div
        ref={viewerRef}
        className="viewer-container"
        style={{
          width: "100%",
          height: "calc(100% - 50px)",
          overflow: "hidden",
          background: "#fff",
          cursor: dragging ? "grabbing" : "grab"
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
