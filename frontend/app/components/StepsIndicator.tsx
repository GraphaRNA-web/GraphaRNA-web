import React from 'react';
import '../styles/stepsIndicator.css';

interface StepsIndicatorProps {
  totalSteps: number;
  currentStep: number; // 0-based
}

const StepsIndicator: React.FC<StepsIndicatorProps> = ({ totalSteps, currentStep }) => {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);

  return (
    <div className="steps-indicator">
      {/* Left fixed line */}
      <div className={`line side-line ${currentStep >= 0 ? 'active' : ''}`} />

      {/* Steps and middle lines */}
      {steps.map((step, index) => (
        <React.Fragment key={step}>
          <div className={`step-circle ${step <= currentStep + 1 ? 'active' : ''}`}>
            <span>{step}</span>
          </div>

          {index !== steps.length - 1 && (
            <div
              className={`line middle-line ${
                currentStep >= index + 1 ? 'active' : ''
              }`}
            />
          )}
        </React.Fragment>
      ))}

      {/* Right fixed line */}
      <div className={`line side-line ${currentStep === totalSteps ? 'active' : ''}`} />
    </div>
  );
};

export default StepsIndicator;
