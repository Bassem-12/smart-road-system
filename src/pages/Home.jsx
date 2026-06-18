import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/Logo_Web&App_Project.svg";
import "../styles/Home.css";

/**
 * Home Page - Landing page for Smart Road Monitor
 * 
 * Features:
 * - Enhanced visual background effects
 * - Glass-effect hero section
 * - Animated CTA button
 * - Dark/Light mode support
 * - Floating particles animation
 */
export default function Home() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [particles, setParticles] = useState([]);
  
  // Generate floating particles on mount - enhanced for more visibility
  useEffect(() => {
    const particleCount = 25;
    const newParticles = [];
    
    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 6 + 2,
        duration: Math.random() * 12 + 18,
        delay: Math.random() * 8,
        opacity: Math.random() * 0.4 + 0.1,
      });
    }
    
    setParticles(newParticles);
  }, []);

  const handleEnterDashboard = () => {
    navigate("/main-dashboard");
  };

  // If already logged in, show button to go to dashboard
  const isAuthenticated = !!token;

  return (
    <div className="home-container">
      {/* Enhanced Floating Particles */}
      <div className="particles">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="particle"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animationDuration: `${particle.duration}s`,
              animationDelay: `${particle.delay}s`,
              opacity: particle.opacity,
            }}
          />
        ))}
      </div>

      {/* Enhanced Background Grid with Glow */}
      <div className="grid-background">
        <div className="grid-line vertical" style={{ left: '10%' }} />
        <div className="grid-line vertical" style={{ left: '30%' }} />
        <div className="grid-line vertical" style={{ left: '50%' }} />
        <div className="grid-line vertical" style={{ left: '70%' }} />
        <div className="grid-line vertical" style={{ left: '90%' }} />
        <div className="grid-line horizontal" style={{ top: '10%' }} />
        <div className="grid-line horizontal" style={{ top: '30%' }} />
        <div className="grid-line horizontal" style={{ top: '50%' }} />
        <div className="grid-line horizontal" style={{ top: '70%' }} />
        <div className="grid-line horizontal" style={{ top: '90%' }} />
      </div>

      {/* Radial Gradient Overlay for Depth */}
      <div className="radial-glow" />

      {/* Hero Content */}
      <div className="hero-content">
        <div className="hero-glass">
          {/* Logo */}
          <div className="hero-logo">
            <img 
              src={logo} 
              alt="Smart Road Monitor Logo"
              className="logo-image"
            />
          </div>

          {/* Title */}
          <h1 className="hero-title">
            Smart Road Monitoring System
          </h1>

          {/* Subtitle */}
          <p className="hero-subtitle">
            Real-time alerts, traffic intelligence, and system-wide visibility in one unified dashboard.
          </p>

          {/* Description */}
          <p className="hero-description">
            Monitor road conditions, track incidents, analyze traffic patterns, and receive instant alerts. 
            All your road management needs in a single, intuitive interface.
          </p>

          {/* CTA Button */}
          <button 
            className="cta-button"
            onClick={handleEnterDashboard}
          >
            <span className="cta-text">
              {isAuthenticated ? "Go to Dashboard" : "Enter Dashboard"}
            </span>
            <span className="cta-arrow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </span>
          </button>

          {/* Features Preview */}
          <div className="features-preview">
            <div className="feature-item">
              <span className="feature-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </span>
              <span>Real-time Monitoring</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </span>
              <span>Instant Alerts</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </span>
              <span>Location Tracking</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer with Version */}
      <div className="home-footer">
        <span>© 2024 Smart Road Monitor</span>
        <span className="version-text">Version 2026</span>
      </div>
    </div>
  );
}
