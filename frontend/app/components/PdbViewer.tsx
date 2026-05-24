import React, { useEffect, useRef, useState } from "react";
import "../styles/PdbViewer.css";

declare global {
  interface Window {
    $3Dmol: any;
  }
}

interface PdbViewerProps {
  pdbData: string;
  width: number | string; 
  height: number | string;
  jobname: string;
}

export default function PdbViewer({ pdbData, width, height, jobname }: PdbViewerProps) {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const load3Dmol = () => {
      if (!window.$3Dmol) {
        const script = document.createElement("script");
        script.src = "/3Dmol-min.js";
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
      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        if (!viewerRef.current) return;
        const ratio = e.deltaY > 0 ? 0.8 : 1.2;
        
        viewerRef.current.zoom(ratio);
        viewerRef.current.render();
      };
      containerRef.current.addEventListener('wheel', handleWheel, { 
        passive: false, 
        capture: true 
      });
      
      if (pdbData) {
        try {
          viewerRef.current.clear();
          viewerRef.current.addModel(pdbData, "pdb");
          viewerRef.current.setStyle({}, { 
            cartoon: { 
              colorfunc: (atom: any) => {
                if (atom.b >= 80) return '#0053d6'; // High
                if (atom.b >= 50) return '#65cbf3'; // Confident
                return '#ff7d45';                   // Low
              }
            } 
          });
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
        const isNowFullscreen = !!document.fullscreenElement;
        setIsFullscreen(isNowFullscreen);

        if (!isNowFullscreen) {
          setTimeout(() => {
            if (outerRef.current) {
              outerRef.current.scrollIntoView({
                behavior: 'auto',
                block: 'nearest',
              });
            }
          }, 50); 
        }

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

  const downloadPdb = () => {
    if (!pdbData) return;

    const blob = new Blob([pdbData], { type: "chemical/x-pdb" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${jobname}_3D.pdb`;
    a.click();

    URL.revokeObjectURL(url);
  };


  return (
    <div
      ref={outerRef}
      className={`pdb-viewer-wrapper ${isFullscreen ? "fullscreen" : ""}`}
      style={{ 
        width, 
        height, 
        display: "flex", 
        flexDirection: "column" 
      }}
    >
      <div className="header-bar">
        <span className="file-name-results">Predicted 3D structure</span>
        <div className="controls-header">
          <button className="download-single-file" onClick={downloadPdb}>
            <img src="/icons/download.svg" alt="Download icon" />
          </button>
          <button className='controls-header-button' onClick={zoomIn}>＋</button>
          <button className='controls-header-button' onClick={zoomOut}>－</button>
          <button className='controls-header-button' onClick={toggleFullscreen}>{isFullscreen ? "🡽" : "⛶"}</button>
        </div>
      </div>
      
      <div
        className="viewer-container"
        ref={containerRef}
        style={{
            width: isFullscreen ? "100%" : (typeof width === "number" ? width - 60 : `calc(${width} - 60px)`),
            height: isFullscreen ? "100%" : (typeof height === "number" ? height - 80 : `calc(${height} - 80px)`),
            flexGrow: 1
        }}
      />
      
      {/* pLDDT Legend */}
      <div 
        className="plddt-legend" 
        style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          padding: '8px 10px', 
          background: isFullscreen ? '#fff' : 'transparent',
          borderBottomLeftRadius: '8px',
          borderBottomRightRadius: '8px',
          gap: '6px'
        }}
      >
        {/* Title & Help Icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 'bold', color: '#444' }}>
          pLDDT Confidence Score
          <div className="plddt-tooltip-container">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <div className="plddt-tooltip-text">
              <strong>pLDDT</strong> (predicted Local Distance Difference Test) is a per-residue confidence metric from 0 to 100. Higher scores indicate greater confidence in the predicted 3D structure.
            </div>
          </div>
        </div>

        {/* Color Items */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px', fontSize: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '14px', height: '14px', backgroundColor: '#0053d6', borderRadius: '3px' }}></span>
            <span style={{ color: '#444' }}>High (pLDDT &ge; 80)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '14px', height: '14px', backgroundColor: '#65cbf3', borderRadius: '3px' }}></span>
            <span style={{ color: '#444' }}>Confident (80 &gt; pLDDT &ge; 50)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '14px', height: '14px', backgroundColor: '#ff7d45', borderRadius: '3px' }}></span>
            <span style={{ color: '#444' }}>Low (pLDDT &lt; 50)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
