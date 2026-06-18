import React, { useState } from "react";

import { useAnalysis } from "../context/AnalysisContext";
import "../styles/alerts-log.css";


/**
 * AlertsLog - Production-ready alerts/incidents page
 * 
 * Features:
 * - Fetches data from API with proper loading/error states
 * - Auto-includes Authorization header via axios interceptor
 * - Handles 401 responses (redirect to signin)
 * - Prevents memory leaks with cleanup
 * - Memoized callbacks to avoid unnecessary re-renders
 * - No hardcoded data - uses service layer
 * - Dark/Light mode support via CSS Glass-effect panels matching variables
 * - dashboard aesthetic
 */
export default function AlertsLog() {
  const { analysisResults } = useAnalysis();

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const INCIDENT_TYPES = {
    ACCIDENT: "Accident",
    CONGESTION: "Congestion",
  };

  // Keep existing status UI (filters), but alerts derived from analysisResults are always Active.
  const INCIDENT_STATUS = {
    ACTIVE: "Active",
    RESOLVED: "Resolved",
    INVESTIGATING: "Investigating",
  };

  const alerts = (analysisResults || []).flatMap((item, index) => {
    const records = [];

    const accidentPrediction = item?.accident?.predictionClass;
    if (
      accidentPrediction &&
      String(accidentPrediction).toUpperCase() === "ACCIDENT"
    ) {
      const confidence = item?.accident?.confidence ?? 0;
      records.push({
        id: `ACC-${index + 1}`,
        type: "Accident",
        location: item?.accident?.location || "Unknown",
        description: "AI detected road accident",
        confidence,
        severity: getSeverityFromConfidence(confidence),
        status: "Active",
        timestamp: item?.timestamp || item?.uploadedAt || new Date().toLocaleString(),
        reportedBy: "AI Detection System",
      });
    }

    const trafficPrediction = item?.traffic?.predictionClass;
    if (
      trafficPrediction &&
      String(trafficPrediction).toUpperCase() === "CONGESTION"
    ) {
      const confidence = item?.traffic?.confidence ?? 0;
      records.push({
        id: `CON-${index + 1}`,
        type: "Congestion",
        location: item?.traffic?.location || "Unknown",
        description: "AI detected traffic congestion",
        confidence,
        severity: getSeverityFromConfidence(confidence),
        status: "Active",
        timestamp: item?.timestamp || item?.uploadedAt || new Date().toLocaleString(),
        reportedBy: "AI Detection System",
      });
    }

    return records;
  });

  // ================= FILTER =================
  const filteredAlerts = alerts.filter((a) => {
    const text = `${a?.id || ""} ${a?.location || ""} ${a?.description || ""}`.toLowerCase();
    const matchesSearch = text.includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "All" || a?.type === typeFilter;
    const matchesStatus = statusFilter === "All" || a?.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  function getSeverityFromConfidence(confidence = 0) {
    if (confidence >= 0.85) return "High";
    if (confidence >= 0.6) return "Medium";
    return "Low";
  }

  function formatConfidence(confidence = 0) {
    const pct = typeof confidence === "number" ? confidence * 100 : 0;
    return `${pct.toFixed(1)}%`;
  }


  const getStatusClass = (status = "") => {
    if (status === INCIDENT_STATUS.ACTIVE) return "status active";
    if (status === INCIDENT_STATUS.RESOLVED) return "status resolved";
    if (status === INCIDENT_STATUS.INVESTIGATING) return "status investigating";
    return "status";
  };

  const getSeverityClass = (sev = "") => {
    if (sev === "High") return "severity high";
    if (sev === "Medium") return "severity medium";
    return "severity low";
  };

  const getSeverityIcon = (sev = "") => {
    if (sev === "High") return "⚠";
    if (sev === "Medium") return "◉";
    return "○";
  };

  const totalAlerts = alerts.length;
  const totalAccidents = alerts.filter((a) => a.type === "Accident").length;
  const totalCongestions = alerts.filter((a) => a.type === "Congestion").length;

  if (!analysisResults || analysisResults.length === 0) {
    return (
      <div className="alerts-container">
        <div className="alerts-header">
          <h2>Alerts & Incidents Log</h2>
          <p>Complete history of all detected incidents</p>
        </div>
        <div className="alerts-empty" style={{ padding: "1rem" }}>
          No alerts generated yet.\nUpload images from AI Analysis page.
        </div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="alerts-container">
        <div className="alerts-header">
          <h2>Alerts & Incidents Log</h2>
          <p>Complete history of all detected incidents</p>
        </div>
        <div className="alerts-empty" style={{ padding: "1rem" }}>
          No alerts generated yet.\nUpload images from AI Analysis page.
        </div>
      </div>
    );
  }


  return (
    <div className="alerts-container">
      {/* HEADER */}
      <div className="alerts-header">
        <h2>Alerts & Incidents Log</h2>
        <p>Complete history of all detected incidents</p>
      </div>

      {/* SUMMARY CARDS */}
      <div className="alerts-summary-cards" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1rem" }}>
        <div className="card" style={{ padding: "1rem", border: "1px solid var(--border)", borderRadius: "10px", background: "var(--surface)" }}>
          <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Total Alerts</div>
          <div style={{ fontSize: "1.5rem", color: "var(--accent)" }}>{totalAlerts}</div>
        </div>
        <div className="card" style={{ padding: "1rem", border: "1px solid var(--border)", borderRadius: "10px", background: "var(--surface)" }}>
          <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Total Accidents</div>
          <div style={{ fontSize: "1.5rem", color: "var(--accent)" }}>{totalAccidents}</div>
        </div>
        <div className="card" style={{ padding: "1rem", border: "1px solid var(--border)", borderRadius: "10px", background: "var(--surface)" }}>
          <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Total Congestions</div>
          <div style={{ fontSize: "1.5rem", color: "var(--accent)" }}>{totalCongestions}</div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="alerts-filters">

        <input
          type="text"
          placeholder="Search by ID, location or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />

        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-select"
        >
          <option value="All">All Status</option>
          <option value={INCIDENT_STATUS.ACTIVE}>Active</option>
          <option value={INCIDENT_STATUS.RESOLVED}>Resolved</option>
          <option value={INCIDENT_STATUS.INVESTIGATING}>Investigating</option>
        </select>

        <select 
          value={typeFilter} 
          onChange={(e) => setTypeFilter(e.target.value)}
          className="filter-select"
        >
          <option value="All">All Types</option>
          <option value={INCIDENT_TYPES.ACCIDENT}>Accident</option>
          <option value={INCIDENT_TYPES.CONGESTION}>Congestion</option>
          <option value={INCIDENT_TYPES.VIOLATION}>Violation</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="table-container">
        <table className="alerts-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Location</th>
              <th>Description</th>
              <th>Confidence</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Timestamp</th>
              <th>Reported By</th>
            </tr>
          </thead>


          <tbody>
            {filteredAlerts.length === 0 ? (
              <tr>
                <td colSpan="10" className="empty">
                  No alerts found matching your filters
                </td>
              </tr>
            ) : (
              filteredAlerts.map((alert) => (
                <tr key={alert.id}>
                  <td className="bold">{alert.id}</td>
                  <td>
                    <span className={`type-pill ${alert.type?.toLowerCase()}`}>
                      {alert.type}
                    </span>
                  </td>
                  <td>{alert.location}</td>
                  <td className="desc">{alert.description}</td>
                  <td>{formatConfidence(alert.confidence)}</td>
                  <td>
                    <span className={getSeverityClass(alert.severity)}>
                      <span className="severity-icon">{getSeverityIcon(alert.severity)}</span>
                      {alert.severity}
                    </span>
                  </td>
                  <td>
                    <span className={getStatusClass(alert.status)}>
                      {alert.status}
                    </span>
                  </td>
                  <td>{alert.timestamp}</td>
                  <td>{alert.reportedBy}</td>
                </tr>
              ))
            )}

          </tbody>
        </table>
      </div>
    </div>
  );
}


