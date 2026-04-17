import React from 'react';
import { Shield } from 'lucide-react';

export const Navbar: React.FC = () => {
  return (
    <nav className="navbar">
      <a href="/" className="nav-brand">
        <Shield className="logo-icon" size={24} />
        MediaShield AI
      </a>
      <div className="nav-links">
        <a href="#dashboard">Dashboard</a>
        <a href="#assets">Assets</a>
        <a href="#settings">Settings</a>
      </div>
    </nav>
  );
};
