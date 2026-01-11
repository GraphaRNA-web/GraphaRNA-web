'use client';

import React, { useState } from 'react';

interface CustomCheckboxProps {
  label?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  size?: number;
  /**
   * If false, the checkbox is locked in the 'checked' state and cannot be toggled.
   * Defaults to true.
   */
  isActive?: boolean; 
}

const CustomCheckbox: React.FC<CustomCheckboxProps> = ({
  label,
  checked,
  onChange,
  size = 24,
  isActive = true
}) => {
  const [internalChecked, setInternalChecked] = useState(true);
  const isControlled = typeof checked === 'boolean';
  const currentChecked = !isActive ? true : (isControlled ? checked : internalChecked);

  const handleClick = () => {
    if (!isActive) return;
    const newChecked = !currentChecked;
    if (!isControlled) {
      setInternalChecked(newChecked);
    }
    onChange?.(newChecked);
  };

  const iconSrc = currentChecked ? 'icons/checked.svg' : 'icons/unchecked.svg';
  const textColor = currentChecked ? '#668D21' : '#AEA99F';

  return (
    <div
      data-testid="custom-checkbox"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        opacity: isActive ? 1 : 0.6, 
        cursor: isActive ? 'pointer' : 'not-allowed'
      }}
    >
      {label && (
        <span
          style={{
            color: textColor,
            fontSize: '20px',
            fontWeight: 600,
            transition: 'color 0.3s ease'
          }}
        >
          {label}
        </span>
      )}
      <img
        src={iconSrc}
        alt={currentChecked ? 'Checked' : 'Unchecked'}
        width={size}
        height={size}
        style={{ cursor: 'inherit' }}
        onClick={handleClick}
      />
    </div>
  );
};

export default CustomCheckbox;