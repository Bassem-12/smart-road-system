import React, { useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useAnalysis } from "../context/AnalysisContext";
import "../styles/weekly-report.css";

// Reusable UI Components
import { DashboardSkeleton } from "../components/ui/LoadingSkeleton";
import ErrorState from "../components/ui/ErrorState";

/**
 * WeeklyReport - Real-time Analytics page powered by AnalysisContext.
 */
export default function WeeklyReport() {
  const { token, user: currentUser } = useAuth();
  const { analysisResults } = useAnalysis();

  const results = analysisResults || [];

  const isAuthenticated = !!token;
  const isAuthorized = currentUser?.role === "Admin" || currentUser?.role === "Officer";

  const [dateRange, setDateRange] = useState("7days");

  // ================= ACCESS DENIED =================
  if (isAuthenticated && !isAuthorized) {
    return (
      <div className="report-container">
        <div className="report-header">
          <h2>Weekly Report</h2>
          <p>Performance metrics and analytics</p>
        </div>
        <ErrorState
          title="Access Denied"
          message="You do not have permission to access this page. Only administrators and officers can view reports."
        />
      </div>
    );
  }

  // If unauthenticated, keep authorization logic behavior via existing layout
  // (WeeklyReport previously showed loading; we show skeleton)
  if (!isAuthenticated) {
    return (
      <div className="report-container">
        <div className="report-header">
          <h2>Weekly Report</h2>
          <p>Performance metrics and analytics</p>
        </div>
        <div className="report-filters">
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} disabled>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
          </select>
        </div>
        <DashboardSkeleton />
      </div>
    );
  }

  // ================= FILTER BY DATE RANGE =================
  const filtered = useMemo(() => {
    const days = dateRange === "7days" ? 7 : dateRange === "30days" ? 30 : 90;
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(now.getDate() - days);

    // If timestamp does not exist, include (per requirements)
    return results.filter((r) => {
      const ts = r?.timestamp ?? r?.uploadedAt;
      if (!ts) return true;
      const d = new Date(ts);
      if (Number.isNaN(d.getTime())) return true;
      return d >= cutoff;
    });
  }, [results, dateRange]);

  // ================= DERIVE METRICS =================
  const totalAnalyses = filtered.length;

  const accidents = filtered.filter((item) => item?.accident?.predictionClass === "ACCIDENT");
  const congestions = filtered.filter((item) => item?.traffic?.predictionClass === "CONGESTION");

  const accidentsCount = accidents.length;
  const congestionsCount = congestions.length;

  const highConfidenceCount = filtered.filter((item) => {
    const a = item?.accident?.confidence;
    const t = item?.traffic?.confidence;
    return (typeof a === "number" && a >= 0.8) || (typeof t === "number" && t >= 0.8);
  }).length;

  // Incidents Overview chart: counts grouped by upload day (use newest weekday labels from data)
  const incidentsByDay = useMemo(() => {
    const map = new Map();
    for (const r of filtered) {
      const ts = r?.timestamp ?? r?.uploadedAt;
      if (!ts) continue;
      const d = new Date(ts);
      if (Number.isNaN(d.getTime())) continue;
      const day = d.toLocaleDateString(undefined, { weekday: "short" });
      map.set(day, (map.get(day) || 0) + 1);
    }

    // If no timestamps exist, fallback to empty series
    const entries = Array.from(map.entries());

    // Keep stable order based on weekday sequence
    const order = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    entries.sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]));

    // Ensure BarChart has at least a minimal dataset
    return entries.length
      ? entries.map(([day, value]) => ({ day, value }))
      : [];
  }, [filtered]);

  // Response Times chart replaced with Daily Analysis Volume
  const dailyAnalysisVolume = useMemo(() => {
    const map = new Map();
    for (const r of filtered) {
      const ts = r?.timestamp ?? r?.uploadedAt;
      if (!ts) continue;
      const d = new Date(ts);
      if (Number.isNaN(d.getTime())) continue;
      const day = d.toLocaleDateString(undefined, { weekday: "short" });
      map.set(day, (map.get(day) || 0) + 1);
    }

    const entries = Array.from(map.entries());
    const order = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    entries.sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]));

    return entries.length
      ? entries.map(([day, value]) => ({ day, value }))
      : [];
  }, [filtered]);

  // By Type breakdown: only Accident + Congestion
  const byType = useMemo(() => {
    const total = filtered.length;
    if (total === 0) {
      return [
        { type: "Accident", count: 0, percentage: 0 },
        { type: "Congestion", count: 0, percentage: 0 },
      ];
    }
    const pct = (n) => (total ? (n / total) * 100 : 0);
    return [
      { type: "Accident", count: accidentsCount, percentage: pct(accidentsCount) },
      { type: "Congestion", count: congestionsCount, percentage: pct(congestionsCount) },
    ];
  }, [filtered, accidentsCount, congestionsCount]);

  // By Status breakdown (workflow not available)
  const byStatus = useMemo(() => {
    return [
      { status: "Active", count: totalAnalyses, percentage: 100 },
      { status: "Resolved", count: 0, percentage: 0 },
      { status: "Investigating", count: 0, percentage: 0 },
    ];
  }, [totalAnalyses]);

  // Top Locations from accident.location + traffic.location
  const topLocations = useMemo(() => {
    const counts = new Map();
    for (const r of filtered) {
      const aLoc = r?.accident?.location;
      const tLoc = r?.traffic?.location;
      if (aLoc) counts.set(aLoc, (counts.get(aLoc) || 0) + 1);
      if (tLoc) counts.set(tLoc, (counts.get(tLoc) || 0) + 1);
    }

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([location, count]) => ({ location, count }));
  }, [filtered]);

  // Latest analysis summary
  const latest = filtered.length ? filtered[filtered.length - 1] : null;

  // Empty state
  if (totalAnalyses === 0) {
    return (
      <div className="report-container">
        <div className="report-header">
          <h2>Weekly Report</h2>
          <p>Performance metrics and analytics</p>
        </div>

        <div className="report-filters">
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="date-select">
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
          </select>
        </div>

        <div className="report-analysis-summary" style={{ marginBottom: "1rem" }}>
          No AI analyses available yet.
        </div>
      </div>
    );
  }

  const kpis = [
    {
      label: "Total Analyses",
      value: totalAnalyses,
      trend: 0,
      color: "rgba(59, 130, 246, 0.15)",
      icon: "📊",
    },
    {
      label: "Accidents",
      value: accidentsCount,
      trend: 0,
      color: "rgba(239, 68, 68, 0.15)",
      icon: "🚨",
    },
    {
      label: "Congestions",
      value: congestionsCount,
      trend: 0,
      color: "rgba(245, 158, 11, 0.15)",
      icon: "🚦",
    },
    {
      label: "High Confidence Detections",
      value: highConfidenceCount,
      trend: 0,
      color: "rgba(99, 102, 241, 0.15)",
      icon: "🎯",
    },
  ];

  return (
    <div className="report-container">
      <div className="report-header">
        <div>
          <h2>Weekly Report</h2>
          <p>Performance metrics and analytics</p>
        </div>
      </div>

      {latest && (
        <div
          className="report-analysis-summary"
          style={{
            marginBottom: "1rem",
            padding: "1rem",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            background: "var(--surface)",
          }}
        >
          <strong>Latest AI Analysis:</strong> Accident {latest?.accident?.predictionClass || "N/A"} at {latest?.accident?.location || "N/A"} ({latest?.accident?.confidence ?? "N/A"}), Traffic {latest?.traffic?.predictionClass || "N/A"} at {latest?.traffic?.location || "N/A"} ({latest?.traffic?.confidence ?? "N/A"}).
        </div>
      )}

      <div className="report-filters">
        <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="date-select">
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
          <option value="90days">Last 90 Days</option>
        </select>
      </div>

      {/* KPI CARDS */}
      <div className="kpi-grid">
        {kpis.map((kpi, index) => (
          <KpiCard key={index} data={kpi} />
        ))}
      </div>

      {/* CHARTS ROW */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-header">
            <h3>Incidents Overview</h3>
            <span className="chart-subtitle">Daily incident counts</span>
          </div>
          <div className="chart-body">
            <BarChart data={incidentsByDay.length ? incidentsByDay : [{ day: "N/A", value: totalAnalyses }]} />
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3>Response Times</h3>
            <span className="chart-subtitle">Daily Analysis Volume</span>
          </div>
          <div className="chart-body">
            <LineChart data={dailyAnalysisVolume.length ? dailyAnalysisVolume : [{ day: "N/A", value: totalAnalyses }]} />
          </div>
        </div>
      </div>

      {/* BREAKDOWN CARDS */}
      <div className="breakdown-grid">
        <div className="breakdown-card">
          <h3>By Type</h3>
          <div className="breakdown-list">
            {byType.map((item, index) => (
              <div key={index} className="breakdown-item">
                <div className="breakdown-label">
                  <span className={`type-dot ${item.type.toLowerCase()}`}></span>
                  <span>{item.type}</span>
                </div>
                <div className="breakdown-bar-container">
                  <div className="breakdown-bar" style={{ width: `${item.percentage}%` }}></div>
                </div>
                <span className="breakdown-value">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="breakdown-card">
          <h3>By Status</h3>
          <div className="breakdown-list">
            {byStatus.map((item, index) => (
              <div key={index} className="breakdown-item">
                <div className="breakdown-label">
                  <span className={`status-dot ${item.status.toLowerCase()}`}></span>
                  <span>{item.status}</span>
                </div>
                <div className="breakdown-bar-container">
                  <div className="breakdown-bar" style={{ width: `${item.percentage}%` }}></div>
                </div>
                <span className="breakdown-value">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="breakdown-card">
          <h3>Top Locations</h3>
          <div className="breakdown-list">
            {topLocations.length ? (
              topLocations.map((item, index) => (
                <div key={index} className="breakdown-item">
                  <div className="breakdown-label">
                    <span className="rank">#{index + 1}</span>
                    <span>{item.location}</span>
                  </div>
                  <span className="breakdown-value">{item.count}</span>
                </div>
              ))
            ) : (
              <div className="breakdown-item">
                <span className="breakdown-value">N/A</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


/**
 * KPI Card Component
 */
function KpiCard({ data }) {
  const trendClass = data.trend > 0 ? 'up' : data.trend < 0 ? 'down' : 'neutral';
  const trendIcon = data.trend > 0 ? '↑' : data.trend < 0 ? '↓' : '→';
  
  return (
    <div className="kpi-card">
      <div className="kpi-icon" style={{ background: data.color }}>
        {data.icon}
      </div>
      <div className="kpi-content">
        <span className="kpi-label">{data.label}</span>
        <div className="kpi-value-row">
          <span className="kpi-value">{data.value}</span>
          <span className={`kpi-trend ${trendClass}`}>
            {trendIcon} {Math.abs(data.trend)}%
          </span>
        </div>
        <span className="kpi-comparison">vs previous period</span>
      </div>
    </div>
  );
}

/**
 * Simple Bar Chart Component (CSS-based)
 */
function BarChart({ data }) {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="bar-chart">
      {data.map((item, index) => (
        <div key={index} className="bar-item">
          <div 
            className="bar" 
            style={{ height: `${(item.value / maxValue) * 100}%` }}
          >
            <span className="bar-value">{item.value}</span>
          </div>
          <span className="bar-label">{item.day}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Simple Line Chart Component (CSS-based)
 */
function LineChart({ data }) {
  const maxValue = Math.max(...data.map(d => d.value));
  
  // Create points for the line
  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - (item.value / maxValue) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="line-chart">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        <line x1="0" y1="25" x2="100" y2="25" className="grid-line" />
        <line x1="0" y1="50" x2="100" y2="50" className="grid-line" />
        <line x1="0" y1="75" x2="100" y2="75" className="grid-line" />
        
        {/* Area fill */}
        <polygon 
          points={`0,100 ${points} 100,100`} 
          className="line-area" 
        />
        
        {/* Line */}
        <polyline 
          points={points} 
          className="line-path" 
        />
        
        {/* Data points */}
        {data.map((item, index) => {
          const x = (index / (data.length - 1)) * 100;
          const y = 100 - (item.value / maxValue) * 100;
          return (
            <circle 
              key={index} 
              cx={x} 
              cy={y} 
              r="2" 
              className="line-point"
            />
          );
        })}
      </svg>
      <div className="line-labels">
        {data.map((item, index) => (
          <span key={index}>{item.day}</span>
        ))}
      </div>
    </div>
  );
}


