'use client';
import React from 'react';
import '../styles/AltConfSlider.css';

interface AltConfSliderProps {
  count: number;
  activeIndex: number; // Prop do odbierania aktualnego indeksu
  onIndexChange: (newIndex: number) => void; // Prop do informowania rodzica o zmianie
}

const AltConfSlider: React.FC<AltConfSliderProps> = ({ count, activeIndex, onIndexChange }) => {
  if (count <= 1) return null;

  return (
    
      <div className="alt-conf-slider">
        {Array.from({ length: count }).map((_, idx) => (
          <span
            key={idx}
            className={`alt-conf-slider-field ${idx === activeIndex ? 'active' : ''}`}
            onClick={() => onIndexChange(idx)} // Poinformuj rodzica o kliknięciu kropki
          >#{idx + 1}</span>
        ))}
      </div>
  );
};

export default AltConfSlider;