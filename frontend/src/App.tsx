import { useEffect, useRef } from 'react';
import { UploadSection } from './components/ui/UploadSection';

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let animationFrameId: number;

    const updateVideoOpacity = () => {
      if (video.duration) {
        const time = video.currentTime;
        const duration = video.duration;

        if (time < 0.5) {
          video.style.opacity = (time / 0.5).toString();
        } else if (duration - time < 0.5) {
          video.style.opacity = Math.max(0, (duration - time) / 0.5).toString();
        } else {
          video.style.opacity = '1';
        }

        // Loop a bit before the very end to avoid black flashes if possible
        // Actually, the prompt says "Reset loop smoothly". 
        // If we restart exactly at the end, it might feel smooth because of the fade out.
        if (time >= duration - 0.05) {
          video.currentTime = 0;
          video.play();
        }
      }
      animationFrameId = requestAnimationFrame(updateVideoOpacity);
    };

    const handleLoadedMetadata = () => {
      video.play().catch(() => { });
      animationFrameId = requestAnimationFrame(updateVideoOpacity);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    // If it's already loaded
    if (video.readyState >= 1) {
      handleLoadedMetadata();
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, []);

  const scrollToUpload = () => {
    const uploadSection = document.getElementById('upload-section');
    if (uploadSection) {
      uploadSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-background text-primary selection:bg-accent/30 overflow-x-hidden">
      {/* Video Background */}
      <div className="fixed inset-0 w-full h-full z-0 overflow-hidden bg-background pointer-events-none">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-100"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260206_044704_dd33cb15-c23f-4cfc-aa09-a0465d4dcb54.mp4"
          muted
          playsInline
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/70" />
      </div>

      {/* Content wrapper */}
      <div className="relative z-10 font-sans">
        {/* Navigation Bar */}
        <nav className="flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
          <div className="text-primary font-serif text-2xl md:text-3xl tracking-wide select-none">
            MediaShield AI<sup className="text-sm">®</sup>
          </div>

          <div className="hidden md:flex items-center space-x-10 text-sm font-medium text-secondary">
            <a href="#dashboard" className="hover:text-primary transition-colors duration-300">Dashboard</a>
            <a href="#scan" className="hover:text-primary transition-colors duration-300">Scan</a>
            <a href="#results" className="hover:text-primary transition-colors duration-300">Results</a>
            <a href="#about" className="hover:text-primary transition-colors duration-300">About</a>
          </div>

          <button
            onClick={scrollToUpload}
            className="rounded-full px-6 py-2.5 bg-primary text-black font-semibold text-sm hover:scale-[1.03] transition-transform duration-300"
          >
            Start Scan
          </button>
        </nav>

        {/* Hero Section */}
        <main
          className="flex flex-col items-center justify-center text-center px-6"
          style={{ paddingTop: 'calc(8rem - 75px)', paddingBottom: '10rem' }}
        >
          <h1 className="text-5xl sm:text-7xl md:text-8xl max-w-6xl font-serif font-normal leading-[0.95] tracking-[-2px] text-primary animate-fade-rise">
            Track. <span className="text-accent">Detect.</span> <span className="text-accent">Protect</span> digital assets with AI.
          </h1>

          <p className="text-base sm:text-lg max-w-2xl mt-8 leading-relaxed text-gray-300 font-light animate-fade-rise-delay">
            Identify unauthorized usage of your media across digital platforms using intelligent fingerprinting and real-time detection.
          </p>

          <div className="relative mt-12 animate-fade-rise-delay-2 group">
            {/* Subtle glow behind CTA */}
            <div className="absolute -inset-1 rounded-full bg-accent-strong opacity-20 group-hover:opacity-40 blur-lg transition duration-500"></div>
            <button
              onClick={scrollToUpload}
              className="relative bg-accent-strong text-primary overflow-hidden rounded-full font-medium shadow-2xl px-14 py-5 text-base hover:scale-[1.03] transition-all duration-300 flex items-center justify-center"
            >
              Upload & Scan Media
            </button>
          </div>
        </main>

        {/* Real Upload Section */}
        <UploadSection />
      </div>
    </div>
  );
}

export default App;
