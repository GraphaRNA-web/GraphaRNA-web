import React from 'react';
import '../styles/button.css';

type ButtonProps = {
  color?: 'primary' | 'green1' | 'green2' | 'green3';
  variant?: 'filled' | 'outlined';
  width?: string;
  height?: string;
  label?: string;
  fontSize?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  action?: React.MouseEventHandler<HTMLButtonElement>;
  id?: string;
  icon?: React.ReactNode;
};

const Button: React.FC<ButtonProps> = ({
  color = 'primary',
  variant = 'filled',
  width = 'auto',
  height = 'auto',
  label = 'Test',
  fontSize = '16px',
  disabled = false,
  type = 'button',
  action,
  id,
  icon,
}) => {
  const variantClass = `button--${color}-${variant}`;
  const disabledClass = disabled ? 'button--disabled' : '';

  return (
    <button
      id={id}
      type={type}
      disabled={disabled}
      onClick={action}
      className={`button ${variantClass} ${disabledClass}`}
      style={{ width, height, fontSize, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} // flex dla ikony + label
    >
      {icon && <span className="button-icon">{icon}</span>}
      {label}
    </button>
  );
};

export default Button;
