import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

export const HeroSection: React.FC = () => {
  const handleScrollToUpload = () => {
    document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="hero-section">
      <div className="hero-badge">
        <Sparkles size={14} /> AI-Powered Asset Tracking
      </div>
      <h1 className="hero-title">
        Protect Your Digital Media <span>with AI</span>
      </h1>
      <p className="hero-subtitle">
        Automatically generate perceptual fingerprints for your assets and scan the web to detect unauthorized usage and copyright violations in near real-time.
      </p>
      <button className="btn-primary" onClick={handleScrollToUpload}>
        Start Scanning <ArrowRight size={18} />
      </button>
    </section>
  );
};
