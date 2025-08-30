'use client';

import React from 'react';
import '../styles/textArea.css';

interface TextAreaProps {
  rows?: number;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  validate?: (value: string) => boolean; // 👈 zamiast regexa, funkcja
}

const TextArea: React.FC<TextAreaProps> = ({
  rows = 4,
  value,
  onChange,
  placeholder,
  validate
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;

    if (!validate || validate(newValue)) {
      onChange(newValue);
    }
  };

  return (
    <div className="textarea-wrapper">
      <textarea
        rows={rows}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
      />
    </div>
  );
};

export default TextArea;
