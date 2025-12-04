'use client';

import React, { useState } from 'react';

interface IntegerFieldProps {
  min?: number;
  max?: number;
  width?: string;
  height?: string;
  defaultValue?: number;
  onChange?: (value: number) => void;
  isActive: boolean;
}

const IntegerField: React.FC<IntegerFieldProps> = ({
  min = Number.MIN_SAFE_INTEGER,
  max = Number.MAX_SAFE_INTEGER,
  width = '200px',
  height = '50px',
  defaultValue = 0,
  onChange,
}) => {
  const [value, setValue] = useState(defaultValue);
  const [hovered, setHovered] = useState<null | 'minus' | 'plus'>(null);

  const handleChange = (newValue: number) => {
    if (newValue < min || newValue > max) return;
    setValue(newValue);
    onChange?.(newValue);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        border: '1px solid #C8C7C1',
        borderRadius: '20px',
        overflow: 'hidden',
        width,
        height,
        backgroundColor: '#ffffff',
      }}
    >
      <input
        type="number"
        value={value}
        readOnly
        style={{
          flex: 1,
          border: 'none',
          outline: 'none',
          textAlign: 'left',
          fontSize: '16px',
          backgroundColor: 'transparent',
          padding: '0 0 0 40px'
        }}
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          borderLeft: '1px solid #867F72',
          height: '50%',
        }}
      >
        <span
          onClick={() => handleChange(value - 1)}
          onMouseEnter={() => setHovered('minus')}
          onMouseLeave={() => setHovered(null)}
          style={{
            padding: '0 20px',
            cursor: 'pointer',
            userSelect: 'none',
            fontSize: hovered === 'minus' ? '24px' : '20px',
            transition: 'font-size 0.2s ease'
          }}
        >
          -
        </span>
        <span
          style={{
            height: '100%',
            borderLeft: '1px solid #867F72',
          }}
        />
        <span
          onClick={() => handleChange(value + 1)}
          onMouseEnter={() => setHovered('plus')}
          onMouseLeave={() => setHovered(null)}
          style={{
            padding: '0 20px 0 10px',
            cursor: 'pointer',
            userSelect: 'none',
            fontSize: hovered === 'plus' ? '24px' : '20px',
            transition: 'font-size 0.2s ease'
          }}
        >
          +
        </span>
      </div>
    </div>
  );
};

export default IntegerField;
