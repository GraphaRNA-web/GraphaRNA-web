'use client';

import React, { useState, useRef, useEffect } from 'react';
import '../styles/modal.css';
import Button from './Button';

const Modal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedExtensions = ['txt', 'fasta'];

  useEffect(() => {
    const preventDefaults = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    window.addEventListener('dragover', preventDefaults);
    window.addEventListener('drop', preventDefaults);

    return () => {
      window.removeEventListener('dragover', preventDefaults);
      window.removeEventListener('drop', preventDefaults);
    };
  }, []);

  const isValidFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    return allowedExtensions.includes(ext);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (isValidFile(file)) {
        setSelectedFile(file);
        setErrorMessage(null);
      } else {
        setSelectedFile(null);
        setErrorMessage('File has other type than .fasta');
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (isValidFile(file)) {
        setSelectedFile(file);
        setErrorMessage(null);
      } else {
        setSelectedFile(null);
        setErrorMessage('File has other type than .fasta');
      }
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      console.log('Uploading file:', selectedFile.name);
      setIsOpen(false);
      setSelectedFile(null);
      setErrorMessage(null);
    }
  };

  return (
    <>
      <Button
        color="primary"
        variant="filled"
        fontSize="20px"
        width="305px"
        height="50px"
        action={() => setIsOpen(true)}
        icon={<img src="icons/white_upload.svg" alt="Upload Icon" style={{ height: 24, width: 24 }} />}
        label="Upload File"
      />


      {isOpen && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-close-icon" onClick={() => setIsOpen(false)}>
              <img src="icons/close_icon.svg" alt="Close Icon" width={30} height={30} />
            </div>

            <div className="modal-top-text">
              <h2 className="modal-title">Upload file</h2>
              <p className="modal-subtitle">
                Choose a file from your computer. The file should be in .txt format.
              </p>
            </div>

            <div
              className={`file-dropzone ${isDragging ? 'drag-active' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragging(false);
              }}
              onDrop={handleDrop}
            >
              {selectedFile ? (
                <div className="uploaded-file">
                  <img src="photos/file_icon.png" alt="File Icon" width={64} height={64} />
                  <p className="file-name">{selectedFile.name}</p>
                </div>
              ) : (
                <>
                  <div className="upload-icon">
                    <img src="icons/upload_icon.svg" alt="Upload Icon" width={74} height={74} />
                  </div>
                  <div className="dropzone-text">
                    <p className="dropzone-instruction">Upload file</p>
                    <p className="dropzone-instruction-2">drag & drop</p>
                  </div>
                </>
              )}
              <input
                type="file"
                accept=".txt,.fasta"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>

            {errorMessage && (
              <div className="error-message">
                <img src="icons/error.svg" alt="Error Icon" width={24} height={24} />
                <p>
                  {errorMessage}
                </p>
              </div>
            )}

            <div className="modal-buttons">
              <Button
                id="modal-cancel-button"
                color="primary"
                variant="outlined"
                label="Cancel"
                fontSize="16px"
                width="130px"
                height="41px"
                action={() => {
                  setIsOpen(false);
                  setErrorMessage(null);
                  setSelectedFile(null);
                }}
                disabled={false}
              />
              <Button
                id="modal-upload-button"
                color="primary"
                variant="filled"
                label="Upload"
                fontSize="16px"
                width="160px"
                height="41px"
                action={handleUpload}
                disabled={!selectedFile}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Modal;
