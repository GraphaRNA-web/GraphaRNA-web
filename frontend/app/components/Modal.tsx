'use client';

import React, { useState, useRef, useEffect } from 'react';
import '../styles/modal.css';
import Button from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileUploaded: (file: File) => void;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, onFileUploaded }) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedExtensions = ['txt', 'fasta'];

  useEffect(() => {
    if (isOpen) {
      setUploadedFiles([]);
      setErrorMessage(null);
    }
  }, [isOpen]);

  const isValidFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    return allowedExtensions.includes(ext);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const file = files[0];
    if (isValidFile(file)) {
      setUploadedFiles([file]);
      setErrorMessage(null);
    } else {
      setUploadedFiles([]);
      setErrorMessage('File has other format than .fasta or .txt');
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files || []);
    if (files.length === 0) return;

    const file = files[0];
    if (isValidFile(file)) {
      setUploadedFiles([file]);
      setErrorMessage(null);
    } else {
      setUploadedFiles([]);
      setErrorMessage('File has other format than .fasta or .txt');
    }
  };

  const handleRemoveFile = (fileName: string) => {
    setUploadedFiles([]);
  };

  const exampleFiles = {
    example1: `>Example 1
CCGAGUAGGUA
((.....))..`,

    example2: `>Example 2
GACUUAUAGAU UGAGUCC
(((((..(... )))))).`,

    example3: `>Example 3
UUAUGUGCC UGUUA AAUACAAUAG
.....(... (.(.. ).....)..)`
  };

  const handleDownloadExample = (exampleKey: keyof typeof exampleFiles) => {
    const content = exampleFiles[exampleKey];
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${exampleKey}.fasta`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExampleClick = (exampleKey: keyof typeof exampleFiles) => {
    const content = exampleFiles[exampleKey];
    const file = new File([content], `${exampleKey}.fasta`, { type: 'text/plain' });
    setUploadedFiles([file]);
    setErrorMessage(null);
  };

  const handleUpload = () => {
    if (uploadedFiles.length > 0) {
      onFileUploaded(uploadedFiles[0]);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-close-icon" onClick={onClose}>
          <img src="icons/close_icon.svg" alt="Close Icon" width={30} height={30} />
        </div>

        <div className="modal-top-text">
          <h2 className="modal-title">Upload file</h2>
          <p className="modal-subtitle">
            Choose a file from your computer. The file should be in .txt or .fasta format.
          </p>
        </div>

        <div className="file-dropzone">
          {uploadedFiles.length === 0 ? (
            <div className="upload-and-examples">
              <div
                className={`upload-left-section ${isDragging ? 'drag-active' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                onDrop={handleDrop}
              >
                <div className="upload-icon">
                  <img src="icons/upload_icon.svg" alt="Upload Icon" width={74} height={74} />
                </div>
                <div className="dropzone-text">
                  <p className="dropzone-instruction">Upload file</p>
                  <p className="dropzone-instruction-2">drag & drop</p>
                </div>
              </div>

              <div className="modal-line-and-or">
                <div className="modal-line-part" />
                <p className="modal-line-sep">or</p>
                <div className="modal-line-part" />
              </div>
              <div className="upload-right-section">
              <p className="example-files-description">
                Choose one of the examples to try out some exemplary files.
              </p>

              <div className="example-file-div">
                <Button
                  color="green1"
                  width="135px"
                  height="30px"
                  label="File 1"
                  fontSize="12px"
                  icon={<img src="icons/file_icon.svg" alt="File" style={{ height: 12, width: 12 }} />}
                  action={() => handleExampleClick('example1')}
                />
                <img
                  className="modal-download-icon"
                  src="/icons/download_gray.svg"
                  alt="Download icon"
                  onClick={() => handleDownloadExample('example1')}
                  style={{ cursor: 'pointer' }}
                />
              </div>

              <div className="example-file-div">
                <Button
                  color="green2"
                  width="135px"
                  height="30px"
                  label="File 2"
                  fontSize="12px"
                  icon={<img src="icons/file_icon.svg" alt="File" style={{ height: 12, width: 12 }} />}
                  action={() => handleExampleClick('example2')}
                />
                <img
                  className="modal-download-icon"
                  src="/icons/download_gray.svg"
                  alt="Download icon"
                  onClick={() => handleDownloadExample('example2')}
                  style={{ cursor: 'pointer' }}
                />
              </div>

              <div className="example-file-div">
                <Button
                  color="green3"
                  width="135px"
                  height="30px"
                  label="File 3"
                  fontSize="12px"
                  icon={<img src="icons/file_icon.svg" alt="File" style={{ height: 12, width: 12 }} />}
                  action={() => handleExampleClick('example3')}
                />
                <img
                  className="modal-download-icon"
                  src="/icons/download_gray.svg"
                  alt="Download icon"
                  onClick={() => handleDownloadExample('example3')}
                  style={{ cursor: 'pointer' }}
                />
              </div>
            </div>
            </div>
          ) : (
            <div className="uploaded-files-section">
              {uploadedFiles.map((file) => (
                <div key={file.name} className="uploaded-file-item-with-remove">
                  <img
                    src="icons/file_uploaded.svg"
                    alt="Uploaded File"
                    className="uploaded-file-icon"
                  />
                  <span className="uploaded-file-name">{file.name}</span>
                  <img
                    src="icons/remove_uploaded.svg"
                    alt="Remove file"
                    className="remove-uploaded-icon"
                    onClick={() => handleRemoveFile(file.name)}
                  />
                </div>
              ))}
            </div>
          )}

          <input
            type="file"
            accept=".txt,.fasta"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
            multiple={false}
          />
        </div>

        {errorMessage && (
          <div className="error-message">
            <img src="icons/error.svg" alt="Error Icon" width={24} height={24} />
            <p>{errorMessage}</p>
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
            action={onClose}
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
            disabled={uploadedFiles.length === 0}
          />
        </div>
      </div>
    </div>
  );
};

export default Modal;