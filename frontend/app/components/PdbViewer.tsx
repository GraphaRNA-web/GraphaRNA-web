import React, { useEffect, useRef, useState } from "react";
import "../styles/PdbViewer.css";

declare global {
  interface Window {
    $3Dmol: any;
  }
}

interface PdbViewerProps {
  filePath: string;      // pełna ścieżka lub URL do pliku PDB
  width: number | string; 
  height: number | string;
}

export default function PdbViewer({ filePath, width, height }: PdbViewerProps) {
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

    const initViewer = async () => {
      if (!containerRef.current) return;
      viewerRef.current = window.$3Dmol.createViewer(containerRef.current, {
        backgroundColor: 0xffffff,
      });

      // Załaduj plik z podanej ścieżki
      if (filePath) {
        try {
          const resp = await fetch(filePath);
          const text = await resp.text();
          viewerRef.current.clear();
          viewerRef.current.addModel(text, "pdb");
          viewerRef.current.setStyle({}, { cartoon: { color: "spectrum" } });
          viewerRef.current.zoomTo();
          viewerRef.current.render();
        } catch (e: any) {
          console.error("Nie udało się załadować PDB: ", e.message);
        }
      }

      // ResizeObserver, żeby viewer renderował się przy zmianie rozmiaru
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
  }, [filePath]);

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
        <span className="file-name">{filePath.split("/").pop()}</span>
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
            width: isFullscreen ? "100%" : (typeof width === "number" ? width - 40 : `calc(${width} - 40px)`),
            height: isFullscreen ? "100%" : (typeof height === "number" ? height - 40 : `calc(${height} - 40px)`),
        }}
      />
    </div>
  );
}
