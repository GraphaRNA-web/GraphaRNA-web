'use client';
import React from 'react';
import '../styles/AltConfSlider.css';

interface DotsIndicatorProps {
  count: number;
  activeIndex: number; // Prop do odbierania aktualnego indeksu
  onIndexChange: (newIndex: number) => void; // Prop do informowania rodzica o zmianie
}

const DotsIndicator: React.FC<DotsIndicatorProps> = ({ count, activeIndex, onIndexChange }) => {
  if (count <= 1) return null;

  const handlePrev = () => {
    const newIndex = activeIndex === 0 ? count - 1 : activeIndex - 1;
    onIndexChange(newIndex); // Poinformuj rodzica o nowym indeksie
  };

  const handleNext = () => {
    const newIndex = activeIndex === count - 1 ? 0 : activeIndex + 1;
    onIndexChange(newIndex); // Poinformuj rodzica o nowym indeksie
  };

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

export default DotsIndicator;