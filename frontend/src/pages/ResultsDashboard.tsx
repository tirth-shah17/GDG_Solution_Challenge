import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, ShieldAlert, ImageIcon, Globe } from 'lucide-react';
import {
  startScan,
  startScrape,
  generateInsight,
  type ScanResult,
  type WorkflowRequest,
} from '../services/api';

interface ResultsDashboardProps {
  request: WorkflowRequest | null;
  onLoadingChange?: (loading: boolean) => void;
}

const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ request, onLoadingChange }) => {
  const [results, setResults] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasScanned, setHasScanned] = useState<boolean>(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [totalChecked, setTotalChecked] = useState<number | null>(null);
  const [thresholdUsed, setThresholdUsed] = useState<number | null>(null);
  const [strategyUsed, setStrategyUsed] = useState<string | null>(null);
  const [insights, setInsights] = useState<Record<number, { loading: boolean, text?: string }>>({});

  const handleGenerateInsight = async (idx: number, similarity: number) => {
    setInsights(prev => ({ ...prev, [idx]: { loading: true } }));
    try {
      const response = await generateInsight(similarity);
      setInsights(prev => ({ ...prev, [idx]: { loading: false, text: response.ai_explanation } }));
    } catch (err) {
      setInsights(prev => ({ ...prev, [idx]: { loading: false, text: 'Failed to generate insight.' } }));
    }
  };

  useEffect(() => {
    if (!request) return;

    const fetchResults = async () => {
      setLoading(true);
      onLoadingChange?.(true);
      setError(null);
      setHasScanned(false);
      setSummary(null);
      setTotalChecked(null);
      setThresholdUsed(null);
      setStrategyUsed(null);
      setInsights({});

      try {
        if (request.mode === 'scrape') {
          const scrapeResponse = await startScrape(
            request.mediaId,
            request.url ?? '',
            request.threshold ?? 70,
          );
          setResults(scrapeResponse.results);
          setSummary(scrapeResponse.message);
          setTotalChecked(scrapeResponse.total_images_scraped);
          setThresholdUsed(scrapeResponse.similarity_threshold);
          setStrategyUsed(scrapeResponse.strategy_used);
        } else {
          const scanResults = await startScan(request.mediaId);
          setResults(scanResults);
          setSummary('Database scan completed successfully.');
        }
      } catch (err) {
        if (err instanceof Error) {
          const maybeStatus = (err as Error & { status?: number }).status;
          const message = maybeStatus === 502 || err.message.toLowerCase().includes('blocked automated access')
            ? 'This website blocked automated image extraction. Try a more public page, enable an API-backed source like Pexels API, or use browser fallback with Playwright installed.'
            : err.message;
          setError(message);
        } else {
          setError('An error occurred during processing');
        }
      } finally {
        setLoading(false);
        onLoadingChange?.(false);
        setHasScanned(true);
      }
    };

    fetchResults();
  }, [request, onLoadingChange]);

  if (!request && !hasScanned) {
    return null; // Don't show anything if no media uploaded yet
  }

  const title = request?.mode === 'scrape' ? 'Website Match Results' : 'Scan Results';
  const subtitle = request?.mode === 'scrape'
    ? 'Images found on the target website and compared against your uploaded reference asset.'
    : 'Detailed breakdown of potential infringements detected across your digital assets.';
  const emptyTitle = request?.mode === 'scrape' ? 'No Website Matches Found' : 'No Matches Found';
  const emptyDescription = request?.mode === 'scrape'
    ? 'The scraped page did not return any images above your selected similarity threshold.'
    : 'Your media appears secure. We didn\'t detect any unauthorized usage across the indexed dataset.';
  const strategyLabelMap: Record<string, string> = {
    'pexels-api': 'API Source',
    html: 'Direct HTML Scrape',
    playwright: 'Browser Rendering',
    none: 'No Scraper Method Succeeded',
  };
  const strategyLabel = strategyUsed ? (strategyLabelMap[strategyUsed] ?? strategyUsed) : null;

  return (
    <section id="results" className="min-h-screen bg-background text-primary py-20 px-6 border-t border-white/5 relative z-10 w-full flex flex-col items-center">
      <div className="w-full max-w-6xl mx-auto">
        
        <div className="text-center mb-16 animate-fade-rise">
          <h2 className="text-4xl md:text-5xl font-serif text-primary mb-4 tracking-wide">
            {title}
          </h2>
          <p className="text-secondary max-w-lg mx-auto text-sm md:text-base">
            {subtitle}
          </p>
        </div>

        {request?.mode === 'scrape' && (summary || totalChecked !== null || thresholdUsed !== null || strategyLabel) && !loading && !error && (
          <div className="mb-10 rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl backdrop-blur-sm animate-fade-rise">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-accent-strong mb-2">
                  <Globe className="w-4 h-4" />
                  <span className="text-sm uppercase tracking-[0.2em]">Web Scraper Summary</span>
                </div>
                <p className="text-primary text-lg">{summary}</p>
              </div>
              <div className="flex gap-3 flex-wrap text-sm">
                {strategyLabel && (
                  <div className="rounded-full border border-amber-400/20 bg-amber-500/10 px-4 py-2 text-amber-100">
                    {strategyLabel}
                  </div>
                )}
                {totalChecked !== null && (
                  <div className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-secondary">
                    {totalChecked} images checked
                  </div>
                )}
                {thresholdUsed !== null && (
                  <div className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-secondary">
                    Threshold {thresholdUsed}%
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-rise">
            <div className="relative w-16 h-16 mb-6">
              <div className="absolute inset-0 border-4 border-accent/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-accent rounded-full border-t-transparent animate-spin"></div>
            </div>
            <h3 className="text-2xl font-serif text-primary mb-2">
              {request?.mode === 'scrape' ? 'Scraping & Comparing...' : 'Scanning...'}
            </h3>
            <p className="text-secondary">
              {request?.mode === 'scrape'
                ? 'Pulling images from the website and checking them against your uploaded asset.'
                : 'Comparing media against the global dataset in real-time.'}
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center flex flex-col items-center max-w-2xl mx-auto shadow-2xl animate-fade-rise">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-2xl font-medium text-white mb-2">
              {request?.mode === 'scrape' ? 'Website Check Blocked' : 'Scan Failed'}
            </h3>
            <p className="text-red-400 max-w-xl">{error}</p>
            {request?.mode === 'scrape' && (
              <p className="text-secondary text-sm mt-4 max-w-xl">
                The app is still working. The target site is refusing automated access from the scraper.
              </p>
            )}
          </div>
        )}

        {/* Empty State (Safe) */}
        {!loading && !error && hasScanned && results.length === 0 && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-3xl p-12 text-center flex flex-col items-center max-w-2xl mx-auto shadow-2xl animate-fade-rise">
            <div className="bg-green-500/20 p-4 rounded-full mb-6">
              <CheckCircle className="w-16 h-16 text-green-400 animate-pulse" />
            </div>
            <h3 className="text-3xl font-serif text-white mb-4">{emptyTitle}</h3>
            <p className="text-green-200">{emptyDescription}</p>
          </div>
        )}

        {/* Results Grid */}
        {!loading && !error && hasScanned && results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {results.map((result, idx) => {
              const isWebsiteMatch = request?.mode === 'scrape' && result.status === 'match';
              const isDatabaseViolation = request?.mode !== 'scrape' && result.status === 'violation';
              const isFlaggedResult = isWebsiteMatch || isDatabaseViolation;
              const filename = result.file_path.split(/[\/\\]/).pop() || result.file_path;
              const statusLabel = request?.mode === 'scrape'
                ? (isWebsiteMatch ? 'Copyright Found' : 'No Copyright Match')
                : (isDatabaseViolation ? 'Violation' : 'Safe');
              const statusClasses = request?.mode === 'scrape'
                ? (isWebsiteMatch
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : 'bg-green-500/20 text-green-300 border border-green-500/30')
                : (isDatabaseViolation
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : 'bg-green-500/20 text-green-300 border border-green-500/30');
              const progressClasses = request?.mode === 'scrape'
                ? (isWebsiteMatch ? 'bg-red-500/80' : 'bg-green-500/80')
                : (isDatabaseViolation ? 'bg-red-500/80' : 'bg-green-500/80');

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
                        ${statusClasses}
                      `}>
                        {isFlaggedResult ? <ShieldAlert className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        {statusLabel}
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
                            className={`h-full rounded-full relative overflow-hidden transition-all duration-1000 ease-out ${progressClasses}`} 
                            style={{ width: `${result.similarity}%` }}
                          >
                            <div className="absolute inset-0 bg-white/20 w-full animate-pulse"></div>
                          </div>
                       </div>
                       
                       {/* AI Insight */}
                       <div className="mt-4">
                         {!insights[idx] && isFlaggedResult && (
                           <button
                             onClick={() => handleGenerateInsight(idx, result.similarity)}
                             className="w-full py-2 px-4 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-accent/30 text-xs font-medium text-secondary transition-all duration-300 flex items-center justify-center gap-2"
                           >
                             ✨ Generate AI Insight
                           </button>
                         )}
                         
                         {insights[idx]?.loading && (
                           <div className="w-full py-3 flex items-center justify-center border border-white/5 bg-white/[0.01] rounded-xl">
                             <div className="w-4 h-4 border-2 border-accent/20 border-t-accent rounded-full animate-spin"></div>
                           </div>
                         )}

                         {insights[idx]?.text && !insights[idx].loading && (
                           <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                             <div className="flex items-center gap-2 mb-1.5">
                               <span className="text-[10px] uppercase tracking-widest text-accent font-medium">AI Insight</span>
                             </div>
                             <p className="text-xs text-secondary/80 leading-relaxed">
                               {insights[idx].text}
                             </p>
                           </div>
                         )}
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
