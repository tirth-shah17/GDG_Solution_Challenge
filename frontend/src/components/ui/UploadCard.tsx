import React, { useState, useRef } from 'react';
import { UploadCloud, X, Search } from 'lucide-react';

export const UploadCard: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (selectedFile: File) => {
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      setFile(selectedFile);
      setPreviewURL(URL.createObjectURL(selectedFile));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const clearFile = () => {
    setFile(null);
    if (previewURL) {
      URL.revokeObjectURL(previewURL);
    }
    setPreviewURL(null);
  };

  return (
    <div id="upload-section" className="upload-wrapper">
      <div className="upload-card">
        <div className="upload-card-header">
          <h2 className="upload-card-title">Upload Asset</h2>
          <p className="upload-card-desc">Drag and drop an image to generate its unique fingerprint</p>
        </div>

        {!previewURL ? (
          <div 
            className={`drop-zone ${isHovering ? 'active' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsHovering(true); }}
            onDragLeave={() => setIsHovering(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud className="drop-icon" size={48} />
            <p className="drop-text">Click or drag and drop to upload</p>
            <p className="drop-subtext">SVG, PNG, JPG or GIF (max. 10MB)</p>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/*"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
              }}
            />
          </div>
        ) : (
          <div className="file-preview">
            <div className="file-preview-overlay">
              <span className="file-name">{file?.name}</span>
              <button className="btn-remove" onClick={clearFile}>
                <X size={14} />
              </button>
            </div>
            <img src={previewURL} alt="Asset Preview" />
          </div>
        )}

        {previewURL && (
          <div className="action-bar">
            <button className="btn-primary" style={{ width: '100%' }}>
              <Search size={18} /> Analyze & Detect Matches
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
