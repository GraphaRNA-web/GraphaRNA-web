'use client';

import React, { useState } from 'react';

interface CustomCheckboxProps {
  label?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  size?: number;
}

const CustomCheckbox: React.FC<CustomCheckboxProps> = ({
  label,
  checked,
  onChange,
  size = 24
}) => {
  const [internalChecked, setInternalChecked] = useState(false);
  const isControlled = typeof checked === 'boolean';
  const currentChecked = isControlled ? checked : internalChecked;

  const handleClick = () => {
    const newChecked = !currentChecked;
    if (!isControlled) {
      setInternalChecked(newChecked);
    }
    onChange?.(newChecked);
  };

  const iconSrc = currentChecked ? 'icons/checked.svg' : 'icons/unchecked.svg';
  const textColor = currentChecked ? '#668D21' : '#AEA99F'; // np. zielony vs szary

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}
    >
      {label && (
        <span
          style={{
            color: textColor,
            fontSize: '20px',
            fontWeight: 600,
            transition: 'color 0.3s ease', // animacja koloru tekstu
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
        style={{ cursor: 'pointer' }}
        onClick={handleClick}
      />
    </div>
  );
};

export default CustomCheckbox;
