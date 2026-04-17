import React from 'react';
import { Navbar } from './components/layout/Navbar';
import { HeroSection } from './components/ui/HeroSection';
import { UploadCard } from './components/ui/UploadCard';

function App() {
  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        <HeroSection />
        <UploadCard />
      </main>
    </div>
  );
}

export default App;
