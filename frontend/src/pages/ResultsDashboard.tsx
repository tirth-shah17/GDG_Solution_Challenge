import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, ShieldAlert, ImageIcon } from 'lucide-react';

interface MatchResult {
  file_path: string;
  similarity: number;
  status: string;
}

interface ResultsDashboardProps {
  mediaId: string | null;
}

const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ mediaId }) => {
  const [results, setResults] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasScanned, setHasScanned] = useState<boolean>(false);

  useEffect(() => {
    if (!mediaId) return;

    const fetchScanResults = async () => {
      setLoading(true);
      setError(null);
      setHasScanned(false);

      try {
        const response = await fetch('http://localhost:8000/api/scan/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ media_id: mediaId }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch scan results');
        }

        const data = await response.json();
        setResults(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred during scanning');
      } finally {
        setLoading(false);
        setHasScanned(true);
      }
    };

    fetchScanResults();
  }, [mediaId]);

  if (!mediaId && !hasScanned) {
    return null; // Don't show anything if no media uploaded yet
  }

  return (
    <section id="results" className="min-h-screen bg-background text-primary py-20 px-6 border-t border-white/5 relative z-10 w-full flex flex-col items-center">
      <div className="w-full max-w-6xl mx-auto">
        
        <div className="text-center mb-16 animate-fade-rise">
          <h2 className="text-4xl md:text-5xl font-serif text-primary mb-4 tracking-wide">
            Scan Results
          </h2>
          <p className="text-secondary max-w-lg mx-auto text-sm md:text-base">
            Detailed breakdown of potential infringements detected across your digital assets.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-rise">
            <div className="relative w-16 h-16 mb-6">
              <div className="absolute inset-0 border-4 border-accent/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-accent rounded-full border-t-transparent animate-spin"></div>
            </div>
            <h3 className="text-2xl font-serif text-primary mb-2">Scanning...</h3>
            <p className="text-secondary">Comparing media against the global dataset in real-time.</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center flex flex-col items-center max-w-2xl mx-auto shadow-2xl animate-fade-rise">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-2xl font-medium text-white mb-2">Scan Failed</h3>
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Empty State (Safe) */}
        {!loading && !error && hasScanned && results.length === 0 && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-3xl p-12 text-center flex flex-col items-center max-w-2xl mx-auto shadow-2xl animate-fade-rise">
            <div className="bg-green-500/20 p-4 rounded-full mb-6">
              <CheckCircle className="w-16 h-16 text-green-400 animate-pulse" />
            </div>
            <h3 className="text-3xl font-serif text-white mb-4">No Matches Found</h3>
            <p className="text-green-200">Your media appears secure. We didn't detect any unauthorized usage across the indexed dataset.</p>
          </div>
        )}

        {/* Results Grid */}
        {!loading && !error && hasScanned && results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {results.map((result, idx) => {
              const isViolation = result.status === 'violation';
              const filename = result.file_path.split(/[\/\\]/).pop() || result.file_path;

              return (
                <div 
                  key={idx} 
                  className="bg-white/[0.03] border border-white/10 rounded-3xl overflow-hidden hover:bg-white/[0.06] hover:border-accent/40 transition-all duration-500 group shadow-2xl backdrop-blur-sm animate-fade-rise"
                  style={{ animationDelay: `${idx * 150}ms` }}
                >
                  {/* Image Preview Fallback */}
                  <div className="relative aspect-video bg-black/60 overflow-hidden flex items-center justify-center border-b border-white/5">
                    <div className="flex flex-col items-center justify-center group-hover:scale-105 transition-transform duration-500 text-secondary">
                        <ImageIcon className="w-12 h-12 mb-3 opacity-40 group-hover:text-accent group-hover:opacity-100 transition-colors duration-300" />
                        <span className="text-xs truncate px-6 max-w-full font-mono opacity-60">{filename}</span>
                    </div>
                  </div>
                  
                  {/* Card Content */}
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                      <h4 className="text-white text-lg font-medium leading-tight truncate max-w-[65%]" title={filename}>
                        {filename}
                      </h4>
                      <div className={`
                        flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md shadow-lg
                        ${isViolation ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-green-500/20 text-green-300 border border-green-500/30'}
                      `}>
                        {isViolation ? <ShieldAlert className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        {isViolation ? 'Violation' : 'Safe'}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 object-bottom">
                       <div className="flex items-center justify-between text-sm">
                          <span className="text-secondary flex items-center gap-2">
                             Similarity Metric
                          </span>
                          <span className="text-white font-mono font-medium">{result.similarity.toFixed(1)}%</span>
                       </div>
                       {/* Progress Bar */}
                       <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden border border-white/5 shadow-inner">
                          <div 
                            className={`h-full rounded-full relative overflow-hidden transition-all duration-1000 ease-out ${isViolation ? 'bg-red-500/80' : 'bg-green-500/80'}`} 
                            style={{ width: `${result.similarity}%` }}
                          >
                            <div className="absolute inset-0 bg-white/20 w-full animate-pulse"></div>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default ResultsDashboard;
