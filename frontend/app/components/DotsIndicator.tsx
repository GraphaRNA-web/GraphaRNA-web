'use client';
import React, { useState } from 'react';
import '../styles/DotsIndicator.css';

interface DotsIndicatorProps {
  count: number;
}

const DotsIndicator: React.FC<DotsIndicatorProps> = ({ count }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  if (count <= 1) return null;

  const handlePrev = () => {
    setActiveIndex(prev => (prev === 0 ? count - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex(prev => (prev === count - 1 ? 0 : prev + 1));
  };

  return (
    <div className="dots-container">
      <img
        src="/icons/arrow_left.svg"
        alt="prev"
        className="arrow"
        onClick={handlePrev}
      />
      <div className="dots">
        {Array.from({ length: count }).map((_, idx) => (
          <span
            key={idx}
            className={`dot ${idx === activeIndex ? 'active' : ''}`}
            onClick={() => setActiveIndex(idx)}
          ></span>
        ))}
      </div>
      <img
        src="/icons/arrow_right.svg"
        alt="next"
        className="arrow"
        onClick={handleNext}
      />
    </div>
  );
};

export default DotsIndicator;
