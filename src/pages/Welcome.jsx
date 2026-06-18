import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/Logo_Web&App_Project.svg";
import "../styles/Welcome.css";

/**
 * Welcome Page - Professional welcome screen after login/registration
 * 
 * Features:
 * - Personalized greeting with user name
 * - System overview summary
 * - Navigation cards to main pages
 * - Dark/Light mode support
 * - Glass card styling
 */
export default function Welcome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const userName = user?.email?.split('@')[0] || 'User';
  const firstName = userName.charAt(0).toUpperCase() + userName.slice(1);

  const handleNavigate = (path) => {
    navigate(path);
  };

  const handleGoToDashboard = () => {
    navigate("/main-dashboard");
  };

  const navCards = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'System overview and key metrics',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      ),
      path: '/main-dashboard',
    },
    {
      id: 'map',
      title: 'Live Map',
      description: 'Real-time road visualization',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
          <line x1="8" y1="2" x2="8" y2="18" />
          <line x1="16" y1="6" x2="16" y2="22" />
        </svg>
      ),
      path: '/live-map-view',
    },
    {
      id: 'alerts',
      title: 'Alerts',
      description: 'Incident tracking and severity',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      ),
      path: '/alerts-log',
    },
    {
      id: 'reports',
      title: 'Weekly Report',
      description: 'Performance insights and analytics',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
      path: '/weekly-report',
    },
  ];

  return (
    <div className="welcome-container">
      {/* Background Effects */}
      <div className="welcome-bg">
        <div className="welcome-grid" />
        <div className="welcome-glow" />
      </div>

      {/* Main Content */}
      <div className="welcome-content">
        {/* Hero Section */}
        <div className="welcome-hero">
          {/* Logo */}
          <div className="welcome-logo">
            <img src={logo} alt="Smart Road Monitoring System" />
          </div>

          {/* Title */}
          <h1 className="welcome-title">
            Welcome to Smart Road Monitoring System
          </h1>

          {/* Subtitle */}
          <p className="welcome-subtitle">
            A comprehensive platform for managing road incidents, monitoring traffic, 
            and analyzing performance. Stay informed with real-time alerts and detailed reports.
          </p>

          {/* System Features */}
          <div className="welcome-features">
            <div className="feature-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Real-time Alerts
            </div>
            <div className="feature-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Traffic Intelligence
            </div>
            <div className="feature-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Live Monitoring
            </div>
            <div className="feature-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Reports & Analytics
            </div>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="welcome-cards">
          {navCards.map((card) => (
            <div 
              key={card.id}
              className="welcome-card"
              onClick={() => handleNavigate(card.path)}
            >
              <div className="card-icon">{card.icon}</div>
              <div className="card-content">
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </div>
              <div className="card-arrow">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </div>
            </div>
          ))}
        </div>

        {/* Primary CTA */}
        <div className="welcome-cta">
          <button className="btn-dashboard" onClick={handleGoToDashboard}>
            <span>Go to Dashboard</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
