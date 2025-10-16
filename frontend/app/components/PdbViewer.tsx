import React, { useEffect, useRef, useState } from "react";
import "../styles/PdbViewer.css";

declare global {
  interface Window {
    $3Dmol: any;
  }
}

interface PdbViewerProps {
  pdbData: string;      // zmiana na string - backend zwraca dane a nie plik
  width: number | string; 
  height: number | string;
}

export default function PdbViewer({ pdbData, width, height }: PdbViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const load3Dmol = () => {
      if (!window.$3Dmol) {
        const script = document.createElement("script");
        script.src = "https://3Dmol.org/build/3Dmol-min.js";
        script.async = true;
        script.onload = initViewer;
        document.body.appendChild(script);
      } else {
        initViewer();
      }
    };

    const initViewer =  () => {
      if (!containerRef.current) return;
      viewerRef.current = window.$3Dmol.createViewer(containerRef.current, {
        backgroundColor: 0xffffff,
      });

      if (pdbData) {
        try {
          viewerRef.current.clear();
          viewerRef.current.addModel(pdbData, "pdb");
          viewerRef.current.setStyle({}, { cartoon: { color: "spectrum" } });
          viewerRef.current.zoomTo();
          viewerRef.current.render();
        } catch (e: any) {
          console.error("Unable to load PDB file: ", e.message);
        }
      }

      const ro = new ResizeObserver(() => viewerRef.current.render());
      ro.observe(containerRef.current);
    };

    load3Dmol();

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      viewerRef.current?.render();
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [pdbData]);

  const zoomIn = () => { viewerRef.current?.zoom(1.2); viewerRef.current?.render(); };
  const zoomOut = () => { viewerRef.current?.zoom(0.8); viewerRef.current?.render(); };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.parentElement?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div
      className={`pdb-viewer-wrapper ${isFullscreen ? "fullscreen" : ""}`}
      style={{ width, height }}
    >
      <div className="header-bar">
        <span className="file-name">3D structure</span>
        <div className="controls-header">
          <button onClick={zoomIn}>＋</button>
          <button onClick={zoomOut}>－</button>
          <button onClick={toggleFullscreen}>{isFullscreen ? "🡽" : "⛶"}</button>
        </div>
      </div>
      <div
        className="viewer-container"
        ref={containerRef}
        style={{
            width: isFullscreen ? "100%" : (typeof width === "number" ? width - 60 : `calc(${width} - 60px)`),
            height: isFullscreen ? "100%" : (typeof height === "number" ? height - 40 : `calc(${height} - 40px)`),
        }}
      />
    </div>
  );
}
