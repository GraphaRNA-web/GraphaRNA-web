// app/components/FileDisplay.tsx
import React from 'react';
import Button from './Button';
import '../styles/fileDisplay.css';

interface FileDisplayProps {
  fileName: string;
  onEdit: () => void;
}

const FileDisplay: React.FC<FileDisplayProps> = ({ fileName, onEdit }) => {
  return (
    <div className="file-display-container">
      <img src="/icons/file_uploaded.svg" alt="File" className="file-display-icon" />
      
      <span className="file-display-name">{fileName}</span>
      
      <Button
        action={onEdit}
        label="Edit"
        variant="filled"
        color="primary"
        height="24px"
        width="70px"
        fontSize="12px"
      />
    </div>
  );
};

export default FileDisplay;