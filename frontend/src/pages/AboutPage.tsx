import React, { useEffect } from 'react';
import { UploadCloud, Fingerprint, Search, ShieldAlert, Globe, Server, Code, Layers, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AboutPage: React.FC = () => {
  const navigate = useNavigate();

  // Ensure page mounts at the top for a smooth transition
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <section id="about" className="bg-background text-primary min-h-screen py-16 px-6 relative z-10 w-full flex flex-col items-center overflow-x-hidden">

      {/* Floating Premium Back Button */}
      <button
        onClick={() => navigate('/')}
        className="fixed top-8 left-8 z-50 group flex items-center gap-3 bg-white/[0.03] hover:bg-white/[0.08] backdrop-blur-md border border-white/10 px-5 py-3 rounded-full transition-all duration-300 shadow-[0_0_20px_rgba(0,0,0,0.3)] animate-fade-rise"
      >
        <ArrowLeft className="w-5 h-5 text-secondary group-hover:text-white group-hover:-translate-x-1 transition-all duration-300" />
        <span className="text-secondary group-hover:text-white font-medium tracking-wide transition-colors duration-300">
          Home
        </span>
      </button>

      <div className="w-full max-w-5xl mx-auto flex flex-col gap-24 mt-12 animate-fade-rise">

        {/* 1. Page Header */}
        <div className="text-center animate-fade-rise">
          <h2 className="text-4xl md:text-6xl font-serif text-primary mb-6 tracking-wide">
            About Athos Engine
          </h2>
          <p className="text-secondary max-w-2xl mx-auto text-lg md:text-xl font-light leading-relaxed">
            A state-of-the-art fingerprinting and similarity detection engine built to protect your digital ownership.
          </p>
        </div>

        {/* 2. Main Description Section */}
        <div className="text-center animate-fade-rise-delay max-w-3xl mx-auto space-y-6 text-gray-300 leading-relaxed font-light text-base md:text-lg">
          <p>
            In the modern internet ecosystem, creators and organizations are rapidly losing control over their digital media. Unauthorized usage, duplications, and copyright infringements are growing exponentially.
          </p>
          <p>
            MediaShield AI solves this by deploying a robust perceptual hashing algorithm paired with a highly scalable similarity matching engine. Rather than relying on simple metadata or exact file matching, our system evaluates the <span className="text-white font-medium">visual fingerprint</span> of a media asset, allowing it to detect usage even if an image has been cropped, filtered, or compressed.
          </p>
        </div>

        {/* 3. How It Works */}
        <div className="animate-fade-rise-delay">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-serif text-white mb-4">How It Works</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* Connecting Line (hidden on mobile and tablet) */}
            <div className="hidden lg:block absolute top-[45px] left-[10%] right-[10%] h-[1px] bg-white/10 z-0"></div>

            {[
              { icon: UploadCloud, title: "1. Upload Media", desc: "Submit your original digital asset to the secure vault." },
              { icon: Fingerprint, title: "2. Generate Fingerprint", desc: "AI calculates a unique perceptual hash immune to minor pixel changes." },
              { icon: Search, title: "3. Scan Content", desc: "The engine cross-references the fingerprint against millions of indexed assets." },
              { icon: ShieldAlert, title: "4. Detect Matches", desc: "Immediate flagging of visual similarities surpassing a designated threshold." }
            ].map((step, idx) => (
              <div key={idx} className="relative z-10 bg-white/[0.02] border border-white/10 rounded-2xl p-6 hover:bg-white/[0.06] hover:border-accent/30 transition-all duration-300 flex flex-col items-center text-center shadow-lg backdrop-blur-sm">
                <div className="bg-background border border-white/10 p-4 rounded-full mb-6 text-accent shadow-lg group-hover:scale-110 transition-transform">
                  <step.icon className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-medium text-white mb-2">{step.title}</h4>
                <p className="text-secondary text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Proof of Concept Section */}
        <div className="bg-accent-strong/5 inset-0 border border-accent/20 rounded-3xl p-10 md:p-14 animate-fade-rise shadow-[0_0_50px_rgba(255,255,255,0.03)] relative overflow-hidden backdrop-blur-md">
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-accent-strong/20 blur-[120px] rounded-full pointer-events-none"></div>
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-accent/10 blur-[100px] rounded-full pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <Code className="w-8 h-8 text-accent-strong" />
              <h3 className="text-3xl font-serif text-white">System Architecture & Scale</h3>
            </div>
            <p className="text-gray-300 leading-relaxed font-light mb-6 md:text-lg">
              The current overarching implementation strategically operates within a highly controlled dataset environment. This simulated dataset serves as a rigorous proxy representation of globally distributed internet media objects.
            </p>
            <p className="text-gray-300 leading-relaxed font-light md:text-lg">
              This controlled methodology successfully validates the core algorithmic detection logic, tolerance thresholds, and collision bounding functions without the interference of live network latencies. Rather than being a limitation, this architecture is precisely designed for <span className="text-white font-medium">demonstration and mass scalability</span>—offering quantitative proof that the underlying mathematics efficiently isolates unauthorized visual matches.
            </p>
          </div>
        </div>

        {/* 5. Future Scope Section */}
        <div className="animate-fade-rise">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-serif text-white mb-4">Future Scope</h3>
            <p className="text-secondary max-w-xl mx-auto font-light">The architecture is inherently modular and built to seamlessly transition into a live internet monitoring hub.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              { icon: Globe, title: "Real-Time Web Crawling", desc: "Deployment of automated intelligence bots continuously indexing top-level domains, online communities, and social media platforms for real-time asset discovery." },
              { icon: Layers, title: "Large-Scale Indexing", desc: "Engineered integration with clustered vector databases to compare billions of fragmented perceptual hashes instantaneously and cost-effectively." },
              { icon: Server, title: "Reverse Image Search Integration", desc: "Constructing direct API gateways with major global search engines to infinitely expand the match detection horizon." },
              { icon: ShieldAlert, title: "Automated Legal Reporting", desc: "Implementation of autonomous workflows that generate and dispatch dynamic DMCA takedown requests mapped definitively to matched infringements." }
            ].map((feature, idx) => (
              <div key={idx} className="flex gap-5 items-start bg-white/[0.02] p-8 rounded-3xl border border-white/5 hover:border-white/15 hover:bg-white/[0.04] transition-all duration-300 group shadow-lg">
                <div className="text-accent mt-1 bg-white/5 p-3 rounded-full group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-medium text-white mb-2">{feature.title}</h4>
                  <p className="text-secondary text-sm leading-relaxed font-light">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 6. Closing Statement */}
        <div className="text-center pt-12 border-t border-white/5 animate-fade-rise w-full max-w-3xl mx-auto">
          <h3 className="text-2xl md:text-3xl font-serif inline-block bg-gradient-to-r from-gray-200 via-white to-gray-200 bg-clip-text text-transparent italic tracking-wide pb-2">
            "MediaShield AI represents the foundation of a scalable system for protecting digital ownership in the modern internet."
          </h3>
        </div>

      </div>
    </section>
  );
};

export default AboutPage;
