'use client';

import React, { useState, useRef, useEffect } from 'react';
import '../styles/modal.css';
import Button from './Button';

interface ModalProps {
  validateRNA: (payload: { fasta_raw: string }) => Promise<any>;
  setErrors: React.Dispatch<React.SetStateAction<string[]>>;
  setWarnings: React.Dispatch<React.SetStateAction<string[]>>;
  setApproves: React.Dispatch<React.SetStateAction<string[]>>;
  setText: React.Dispatch<React.SetStateAction<string>>;
  setCorrectedText: React.Dispatch<React.SetStateAction<string>>;
  goNext: () => void;
  setShowValidationNext: React.Dispatch<React.SetStateAction<boolean>>;
}

const Modal: React.FC<ModalProps> = ({
  validateRNA,
  setErrors,
  setWarnings,
  setApproves,
  setText,
  setCorrectedText,
  goNext,
  setShowValidationNext
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);

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
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(isValidFile);

    if (validFiles.length > 0) {
      setUploadedFiles(validFiles); // Zastąp, nie dodawaj
      setErrorMessage(null);
    } else {
      setUploadedFiles([]);
      setErrorMessage('File has other type than .fasta or .txt');
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files || []);
    const validFiles = files.filter(isValidFile);

    if (validFiles.length > 0) {
      setUploadedFiles(validFiles); // Zastąp, nie dodawaj
      setErrorMessage(null);
    } else {
      setUploadedFiles([]);
      setErrorMessage('File has other type than .fasta or .txt');
    }
  };

  const handleRemoveFile = (fileName: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.name !== fileName));
  };

  const exampleFiles = {
    example1: `>Example 1
CCGAGUAGGUA
((.....))..`,

    example2: `>Example 2
GACUUAUAGAU UGAGUCC
(((((..(... ))))))).`,

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
    setUploadedFiles([file]); // Ustaw ten plik jako jedyny
    setErrorMessage(null);
  };

  const handleUpload = async () => {
    if (uploadedFiles.length === 0) return;

    setIsUploading(true);
    setErrors([]);
    setWarnings([]);
    setApproves([]);
    setErrorMessage(null);

    const file = uploadedFiles[0];
    const fileContent = await file.text();

    try {
      console.log("[validateStructure FILE] calling validateRNA...");
      const result = await validateRNA({ fasta_raw: fileContent });

      // Walidacja nie przeszła (Error)
      if (!result["Validation Result"]) {
        let errorList: string[] = [];
        if (Array.isArray(result["Error List"]) && result["Error List"].length > 0) {
          const flatErrors = result["Error List"].flat();
          errorList = errorList.concat(flatErrors);
        }
        console.log("ErrorList: ", errorList);
        setErrors(errorList);
        handleRemoveFile(file.name);
        setIsUploading(false);
        setIsOpen(false);
        return;
      }

      setCorrectedText(result["Validated RNA"]);

      if (result["Fix Suggested"] && result["Validated RNA"]) {
        
        const warningMessages: string[] = [
          "The provided structure required corrections and cannot be accepted. Please fix the file manually:"
        ];

        const mismatching = result["Mismatching Brackets"];
        const incorrect = result["Incorrect Pairs"];

        if (mismatching && mismatching.length > 0) {
          warningMessages.push(`- Mismatching Brackets at indices: ${mismatching.join(', ')}`);
        }

        if (incorrect && incorrect.length > 0) {
          const pairsString = incorrect.map((pair: number[]) => `[${pair.join(', ')}]`).join(', ');
          warningMessages.push(`- Incorrect Pairs: ${pairsString}`);
        }
        
        setWarnings(warningMessages);
        handleRemoveFile(file.name); // "cofnij plik"
        setIsUploading(false);
        setIsOpen(false);
        return;
      }

      // Walidacja przeszła poprawnie (OK)
      if (!result["Fix Suggested"]) {
        setText(result["Validated RNA"]);
        setApproves(["Validation passed successfully. Input was parsed to the engine's format."]);
      }

      goNext();
      
      setIsUploading(false);
      setIsOpen(false);
      setUploadedFiles([]);
      setErrorMessage(null);

    } catch (err: any) {
      // Błąd serwera
      setErrors([err.message || "Server validation error"]);
      handleRemoveFile(file.name);
      setIsUploading(false);
      setIsOpen(false);
    }
  };

  return (
    <>
      <Button
        color="primary"
        variant="filled"
        fontSize="16px"
        width="200px"
        height="40px"
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
                action={() => {
                  setIsOpen(false);
                  setErrorMessage(null);
                  setUploadedFiles([]);
                }}
              />
              <Button
                id="modal-upload-button"
                color="primary"
                variant="filled"
                label={isUploading ? "Validating..." : "Upload"}
                fontSize="16px"
                width="160px"
                height="41px"
                action={handleUpload}
                disabled={uploadedFiles.length === 0 || isUploading}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Modal;