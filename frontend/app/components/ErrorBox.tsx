import React from 'react';
import '../styles/errorBox.css';

interface ErrorBoxProps {
  errors: string[] | string;
}

const ErrorBox: React.FC<ErrorBoxProps> = ({ errors }) => {
  const errorList = Array.isArray(errors) ? errors : [errors];
  const isMultiple = errorList.length > 1;

  return (
    <div className="error-box">
      {isMultiple ? (
        <div className="error-message-multiple">
          <p className="error-header">Some errors appeared:</p>
          {errorList.map((err, index) => (
            <div className="error-line" key={index}>
              <img src="icons/error.svg" alt="Error Icon" width={24} height={24} />
              <p>{err}</p>
            </div>
          ))}
          <p className="error-footer">Correct the errors</p>
        </div>
      ) : (
        <div className="error-line">
          <img src="icons/error.svg" alt="Error Icon" width={24} height={24} />
          <p>{errorList[0]}</p>
        </div>
      )}
    </div>
  );
};

export default ErrorBox;
