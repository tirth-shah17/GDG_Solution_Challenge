import { useState, useRef } from 'react';
import { UploadCloud, ImageIcon, CheckCircle, Loader2, X, Globe, Link2 } from 'lucide-react';
import { uploadMedia, type WorkflowRequest } from '../../services/api';

type UploadStatus = 'idle' | 'uploading' | 'uploaded';

interface UploadSectionProps {
  onProcessStart?: (request: WorkflowRequest) => void;
  isProcessing?: boolean;
}

export function UploadSection({ onProcessStart, isProcessing = false }: UploadSectionProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [assetId, setAssetId] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [threshold, setThreshold] = useState(70);
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
    setUploadStatus('idle');
    setErrorMsg(null);
    setAssetId(null);
    setUploadMessage(null);
    setWebsiteUrl('');
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
  };

  const clearFile = () => {
    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setUploadStatus('idle');
    setErrorMsg(null);
    setAssetId(null);
    setUploadMessage(null);
    setWebsiteUrl('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploadStatus('uploading');
    setErrorMsg(null);

    try {
      const data = await uploadMedia(file);
      setAssetId(data.asset_id);
      setUploadMessage(data.message);
      setUploadStatus('uploaded');
    } catch (error) {
      console.error(error);
      setUploadStatus('idle');
      setUploadMessage(null);
      setErrorMsg(error instanceof Error ? error.message : 'An error occurred during upload');
    }
  };

  const handleStartProcess = () => {
    if (!assetId) {
      setErrorMsg('Upload the image first to generate an asset ID.');
      return;
    }

    if (!websiteUrl.trim()) {
      setErrorMsg('Enter the website URL you want to check.');
      return;
    }

    setErrorMsg(null);
    onProcessStart?.({
      mediaId: assetId,
      mode: 'scrape',
      url: websiteUrl.trim(),
      threshold,
    });
  };

  return (
    <section id="upload-section" className="min-h-screen bg-background border-t border-white/5 flex flex-col items-center justify-center py-20 px-6 relative z-10 font-sans">
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-serif text-primary mb-4 tracking-wide">
          Upload, Link & Verify
        </h2>
        <p className="text-secondary max-w-lg mx-auto text-sm md:text-base">
          Keep everything in one place: upload your reference image, add the target website, and run the comparison from this page.
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
              
              {uploadStatus === 'idle' && (
                <button 
                  onClick={clearFile}
                  className="absolute top-2 right-2 bg-black/60 text-primary p-2 rounded-full hover:bg-red-500/80 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="w-full flex flex-col gap-6 border-t border-white/10 pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm text-secondary">
                <div className="max-w-[200px] truncate" title={file.name}>
                  {file.name}
                </div>
                <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-white/20" />
                <div>{(file.size / (1024 * 1024)).toFixed(2)} MB</div>
              </div>

              <div className="flex flex-col items-start gap-3 w-full">
                <button
                  onClick={handleUpload}
                  disabled={uploadStatus !== 'idle'}
                  className={`
                    w-full sm:w-auto px-8 py-3 rounded-full font-medium transition-all duration-300 flex items-center justify-center gap-2
                    ${uploadStatus === 'idle' 
                      ? 'bg-primary text-black hover:scale-[1.03] shadow-[0_0_20px_rgba(255,255,255,0.1)]' 
                      : uploadStatus === 'uploading'
                        ? 'bg-white/10 text-white cursor-not-allowed'
                        : 'bg-green-500/20 text-green-400 cursor-default shadow-[0_0_20px_rgba(74,222,128,0.1)]'
                    }
                  `}
                >
                  {uploadStatus === 'idle' && 'Upload Image'}
                  {uploadStatus === 'uploading' && (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  )}
                  {uploadStatus === 'uploaded' && (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Image Ready
                    </>
                  )}
                </button>

                {assetId && (
                  <div className="w-full rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                    <div className="flex items-center gap-2 text-emerald-300 mb-1">
                      <CheckCircle className="w-4 h-4" />
                      {uploadMessage ?? 'Asset uploaded successfully'}
                    </div>
                    <div className="font-mono text-xs break-all text-emerald-100/90">{assetId}</div>
                  </div>
                )}

                {uploadStatus === 'uploaded' && assetId && (
                  <div className="w-full rounded-2xl border border-white/10 bg-black/20 p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="rounded-full bg-accent/10 p-3">
                        <Globe className="w-5 h-5 text-accent-strong" />
                      </div>
                      <div>
                        <h3 className="text-primary text-lg font-medium">Website to inspect</h3>
                        <p className="text-secondary text-sm">
                          Paste the page you want to scrape and compare against your uploaded image.
                        </p>
                      </div>
                    </div>

                    <label className="block text-sm text-secondary mb-2" htmlFor="website-url">
                      Website URL
                    </label>
                    <div className="relative mb-4">
                      <Link2 className="w-4 h-4 text-secondary absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        id="website-url"
                        type="url"
                        value={websiteUrl}
                        onChange={(e) => {
                          setWebsiteUrl(e.target.value);
                        }}
                        placeholder="https://www.pexels.com/search/dog/"
                        className="w-full rounded-2xl border border-white/10 bg-white/[0.03] py-3 pl-11 pr-4 text-primary outline-none transition-colors duration-300 placeholder:text-secondary/60 focus:border-accent/60"
                      />
                    </div>

                    <div className="mb-5">
                      <div className="flex items-center justify-between mb-2 text-sm text-secondary">
                        <label htmlFor="threshold">Similarity Threshold</label>
                        <span className="text-primary font-mono">{threshold}%</span>
                      </div>
                      <input
                        id="threshold"
                        type="range"
                        min="0"
                        max="100"
                        value={threshold}
                        onChange={(e) => setThreshold(Number(e.target.value))}
                        className="w-full accent-[var(--color-accent-strong)]"
                      />
                    </div>

                    <button
                      onClick={handleStartProcess}
                      disabled={isProcessing}
                      className={`
                        w-full px-8 py-3 rounded-full font-medium transition-all duration-300 flex items-center justify-center gap-2
                        ${isProcessing
                          ? 'bg-white/10 text-white cursor-not-allowed'
                          : 'bg-accent-strong text-primary hover:scale-[1.02] shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                        }
                      `}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Comparing with website...
                        </>
                      ) : (
                        <>
                          <Globe className="w-4 h-4" />
                          Start Web Check
                        </>
                      )}
                    </button>
                  </div>
                )}

                {errorMsg && (
                  <p className="text-xs text-red-400 animate-pulse">
                    {errorMsg}
                  </p>
                )}
                {(uploadStatus !== 'idle' || isProcessing) && !errorMsg && (
                  <p className="text-xs text-secondary animate-pulse">
                    {isProcessing
                      ? 'Scraping website and comparing image signatures...'
                      : uploadStatus === 'uploading'
                        ? 'Generating a reference asset ID...'
                        : 'Image uploaded. Add a website URL to continue.'}
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
