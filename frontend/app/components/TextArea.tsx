'use client';

import React, { useState } from 'react';
import '../styles/textArea.css';

type TextAreaProps = {
  defaultValue?: string;
  editable?: boolean;
  width?: string;
  height?: string;
  id?: string;
  onChange?: (value: string) => void;
};

const TextArea: React.FC<TextAreaProps> = ({
  defaultValue = '',
  editable = true,
  width = '100%',
  height = '150px',
  id,
  onChange,
}) => {
  const [value, setValue] = useState(defaultValue);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!editable) return;
    const newValue = e.target.value;
    setValue(newValue);
    onChange?.(newValue);
  };

  return (
    <textarea
      id={id}
      value={value}
      onChange={handleChange}
      readOnly={!editable}
      className={`textarea ${editable ? '' : 'readonly'}`}
      style={{ width, height }}
    />
  );
};

export default TextArea;
