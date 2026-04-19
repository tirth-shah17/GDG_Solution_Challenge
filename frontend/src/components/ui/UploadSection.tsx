import { useState, useRef } from 'react';
import { UploadCloud, ImageIcon, CheckCircle, Loader2, X } from 'lucide-react';

type ScanStatus = 'idle' | 'scanning' | 'done';

interface UploadSectionProps {
  onScanComplete?: (mediaId: string) => void;
}

export function UploadSection({ onScanComplete }: UploadSectionProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type.startsWith('image/') || droppedFile.type.startsWith('video/')) {
        handleFileSelection(droppedFile);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (selectedFile: File) => {
    setFile(selectedFile);
    setStatus('idle');
    setErrorMsg(null);
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
  };

  const clearFile = () => {
    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setStatus('idle');
    setErrorMsg(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const startScan = async () => {
    if (!file) return;
    setStatus('scanning');
    setErrorMsg(null);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/api/upload/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Upload failed');
      }

      const data = await response.json();
      setStatus('done');
      
      if (onScanComplete && data.asset_id) {
        onScanComplete(data.asset_id);
      }
      
    } catch (error) {
      console.error(error);
      setStatus('idle');
      setErrorMsg(error instanceof Error ? error.message : 'An error occurred during upload');
    }
  };

  return (
    <section id="upload-section" className="min-h-screen bg-background border-t border-white/5 flex flex-col items-center justify-center py-20 px-6 relative z-10 font-sans">
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-serif text-primary mb-4 tracking-wide">
          Upload & Verify
        </h2>
        <p className="text-secondary max-w-lg mx-auto text-sm md:text-base">
          Drop your media asset below to safely scan against our global protection database.
        </p>
      </div>

      <div className="w-full max-w-3xl bg-white/[0.02] border border-white/10 rounded-3xl p-8 backdrop-blur-sm shadow-2xl relative">
        {!file ? (
          <form 
            onDragEnter={handleDrag} 
            onDragLeave={handleDrag} 
            onDragOver={handleDrag} 
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`
              relative flex flex-col items-center justify-center py-20 px-4 rounded-2xl border-2 border-dashed
              transition-all duration-300 cursor-pointer group
              ${dragActive ? 'border-accent bg-accent/5' : 'border-white/20 hover:border-accent/50 hover:bg-white/[0.04]'}
            `}
          >
            <input 
              ref={inputRef}
              type="file" 
              accept="image/*,video/*"
              className="hidden" 
              onChange={handleChange}
            />
            <div className="bg-white/5 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
              <UploadCloud className="w-8 h-8 text-accent-strong" />
            </div>
            <p className="text-primary font-medium text-lg mb-2">
              Drag & drop media here
            </p>
            <p className="text-secondary text-sm">
              or click to browse files
            </p>
          </form>
        ) : (
          <div className="flex flex-col items-center animate-fade-rise">
            <div className="relative group w-full flex justify-center mb-8">
              {file.type.startsWith('image/') ? (
                <img 
                  src={previewUrl!} 
                  alt="Preview" 
                  className="max-h-80 rounded-xl object-contain shadow-lg border border-white/10"
                />
              ) : (
                <div className="h-64 w-full max-w-md bg-black/40 rounded-xl flex items-center justify-center border border-white/10">
                  <div className="flex flex-col items-center text-secondary">
                    <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                    <span>Video file selected</span>
                  </div>
                </div>
              )}
              
              {status === 'idle' && (
                <button 
                  onClick={clearFile}
                  className="absolute top-2 right-2 bg-black/60 text-primary p-2 rounded-full hover:bg-red-500/80 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-white/10 pt-6">
              <div className="flex items-center gap-4 text-sm text-secondary">
                <div className="max-w-[200px] truncate" title={file.name}>
                  {file.name}
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                <div>{(file.size / (1024 * 1024)).toFixed(2)} MB</div>
              </div>

              <div className="flex flex-col items-end gap-3 w-full sm:w-auto">
                <button
                  onClick={startScan}
                  disabled={status !== 'idle'}
                  className={`
                    w-full sm:w-auto px-8 py-3 rounded-full font-medium transition-all duration-300 flex items-center justify-center gap-2
                    ${status === 'idle' 
                      ? 'bg-primary text-black hover:scale-[1.03] shadow-[0_0_20px_rgba(255,255,255,0.1)]' 
                      : status === 'scanning'
                        ? 'bg-white/10 text-white cursor-not-allowed'
                        : 'bg-green-500/20 text-green-400 cursor-default shadow-[0_0_20px_rgba(74,222,128,0.1)]'
                    }
                  `}
                >
                  {status === 'idle' && 'Scan Media'}
                  {status === 'scanning' && (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Scanning...
                    </>
                  )}
                  {status === 'done' && (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Scan Complete
                    </>
                  )}
                </button>

                {errorMsg && (
                  <p className="text-xs text-red-400 absolute -bottom-6 right-0 sm:right-6 animate-pulse">
                    {errorMsg}
                  </p>
                )}
                {status !== 'idle' && !errorMsg && (
                  <p className="text-xs text-secondary animate-pulse absolute -bottom-6 right-0 sm:right-6">
                    {status === 'scanning' ? 'Analyzing signatures...' : 'Redirecting to results...'}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
