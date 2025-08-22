import React from 'react';
import '../styles/slider.css';

interface SliderProps {
  options: string[];
  selectedOption: string;
  onChange: (option: string) => void;
}

const Slider: React.FC<SliderProps> = ({
  options,
  selectedOption,
  onChange,
}) => {
  return (
    <div className="slider-wrapper">
      {options.map((option) => (
        <button
          key={option}
          className={`slider-option ${selectedOption === option ? 'selected' : ''}`}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
};

export default Slider;
