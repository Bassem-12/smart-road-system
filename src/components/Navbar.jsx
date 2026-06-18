import React, { useEffect, useState, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

/**
 * NAVIGATION CONFIGURATION
 * Centralized navigation array for easy scaling.
 */
const NAV_ITEMS = [
  { name: "Main Dashboard", path: "/main-dashboard", roles: ["all"] },
  { name: "Live Map View", path: "/live-map-view", roles: ["all"] },
  { name: "Alerts Log", path: "/alerts-log", roles: ["all"] },
  { name: "AI Analysis", path: "/upload", roles: ["all"] },
  { name: "User Management", path: "/user-management", roles: ["Admin"] },
  { name: "Weekly Report", path: "/weekly-report", roles: ["Admin", "Officer"] }
];

export default function Navbar() {
  const location = useLocation()
  const { user, logout } = useAuth()

  // Theme state - persisted in localStorage
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('theme') || 'dark' }
    catch(e){ return 'dark' }
  })

  // Scroll state - triggers glass effect when scrolled past 50px
  const [scrolled, setScrolled] = useState(false)

  // Handle theme change - updates data-theme attribute on html element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try { localStorage.setItem('theme', theme) } catch(e){}
  }, [theme])

  // Scroll detection with proper cleanup
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Filter nav items based on user role
  const filteredNavItems = useMemo(() => {
    return NAV_ITEMS.filter(item => {
      if (item.roles.includes("all")) return true;
      return user?.role && item.roles.includes(user.role);
    });
  }, [user?.role]);

  function toggleTheme() {
    setTheme(t => t === 'dark' ? 'light' : 'dark')
  }

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-left">
        {filteredNavItems.map((item) => (
          <Link 
            key={item.path} 
            to={item.path}
            className={location.pathname === item.path ? 'active' : ''}
          >
            {item.name}
          </Link>
        ))}
      </div>

      <div className="nav-right">
        <button className="btn-signout" onClick={logout}>
          Logout
        </button>

        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '🌞' : '🌙'}
        </button>
      </div>
    </nav>
  )
}
