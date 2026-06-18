import React from "react";
import { useAuth } from "../context/AuthContext";
import { useAnalysis } from "../context/AnalysisContext";

// Reusable UI Components
import StatCard from "../components/ui/StatCard";

import "../styles/dashboard.css";

/**
 * MainDashboard - Real-time AI Monitoring Dashboard powered by AnalysisContext
 */
export default function MainDashboard() {
  const { user } = useAuth();
  const { analysisResults } = useAnalysis();

  const results = analysisResults || [];

  // Statistics
  const activeAccidents = results.filter(
    (item) => item?.accident?.predictionClass?.toUpperCase() === "ACCIDENT"
  ).length;

  const congestionAreas = results.filter((item) => {
    const cls = item?.traffic?.predictionClass;
    const text = typeof cls === "string" ? cls : "";

    return (
      text.includes("CONGESTION") ||
      cls !== "NO CONGESTION" // rule: traffic.predictionClass !== "NO CONGESTION"
    );
  }).length;

  const totalAnalyses = results.length;
  const resolvedCases = 0; // per requirements (temporary value)

  const latestIndex = totalAnalyses - 1;
  const latest = latestIndex >= 0 ? results[latestIndex] : null;

  // Today Summary
  const highestConfidenceDetection = getHighestConfidence(results);
  const averageConfidence = getAverageConfidence(results);

  // Empty state
  if (results.length === 0) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-header">
          <h1>Dashboard Overview</h1>
          <p>Welcome back, {user?.email || "User"} | Real-time monitoring and incident management</p>
        </div>

        <div
          style={{
            padding: "1.25rem",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            background: "var(--surface)",
          }}
        >
          <p style={{ margin: 0, fontSize: "1rem" }}>
            No AI analyses uploaded yet.
          </p>
        </div>
      </div>
    );
  }

  // Recent Analyses (latest 5)
  const recentAnalyses = results.slice(-5).reverse();

  return (
    <div className="dashboard-page">
      {/* HEADER */}
      <div className="dashboard-header">
        <h1>Dashboard Overview</h1>
        <p>Welcome back, {user?.email || "User"} | Real-time monitoring and incident management</p>
      </div>

      {/* LATEST ANALYSIS PANEL */}
      {latest && (
        <div
          className="dashboard-analysis-summary"
          style={{
            marginBottom: "1.5rem",
            padding: "1rem",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            background: "var(--surface)",
          }}
        >
          <h3>Latest Analysis</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <strong>Accident Location</strong>: {latest?.accident?.location || "N/A"}
            </div>
            <div>
              <strong>Accident Status</strong>: {latest?.accident?.predictionClass || "N/A"}
            </div>
            <div>
              <strong>Accident Confidence</strong>: {latest?.accident?.confidence ?? "N/A"}
            </div>

            <div>
              <strong>Traffic Location</strong>: {latest?.traffic?.location || "N/A"}
            </div>
            <div>
              <strong>Traffic Status</strong>: {latest?.traffic?.predictionClass || "N/A"}
            </div>
            <div>
              <strong>Traffic Confidence</strong>: {latest?.traffic?.confidence ?? "N/A"}
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <strong>Timestamp</strong>: {formatTimestamp(latest?.timestamp ?? latest?.uploadedAt)}
            </div>
          </div>
        </div>
      )}

      {/* STATISTICS CARDS */}
      <div className="stats-grid">
        <StatCard title="Active Accidents" value={activeAccidents} type="#030202" />
        <StatCard title="Congestion Areas" value={congestionAreas} type="030202" />
        <StatCard title="Total Analyses" value={totalAnalyses} type="030202" />
        <StatCard
          title="Resolved Cases"
          value={resolvedCases}
          type="030202"
        />
      </div>

      {/* RECENT ANALYSES SECTION */}
      <section className="dashboard-section">
        <h2>Recent AI Analyses</h2>
        <div className="incidents-list">
          {recentAnalyses.map((analysis, idx) => {
            const absoluteIndex = totalAnalyses - 1 - idx;
            const id = `IMG-${String(absoluteIndex + 1).padStart(3, "0")}`;

            const accidentCls = analysis?.accident?.predictionClass || "N/A";
            const accidentConf = analysis?.accident?.confidence ?? "N/A";
            const accidentLoc = analysis?.accident?.location || "N/A";

            const trafficCls = analysis?.traffic?.predictionClass || "N/A";
            const trafficConf = analysis?.traffic?.confidence ?? "N/A";
            const trafficLoc = analysis?.traffic?.location || "N/A";

            const timestamp = formatTimestamp(analysis?.timestamp ?? analysis?.uploadedAt);

            return (
              <div key={id} className="incident-item">
                <div className={`severity ${severityFromConfidence(accidentConf)}`} />
                <div className="incident-content">
                  <span className="incident-id">{id}</span>
                  <span className={`badge ${severityFromConfidence(accidentConf).toLowerCase()}`}>
                    {accidentCls}
                  </span>
                  <span className="time">{timestamp}</span>

                  <h4>Accident: {accidentCls}</h4>
                  <p className="location">Location: {accidentLoc}</p>

                  <div style={{ display: "grid", gap: "0.25rem", marginTop: "0.5rem" }}>
                    <div style={{ fontSize: "var(--font-size-xs)", color: "var(--text-tertiary)" }}>
                      Traffic: {trafficCls} (Conf: {trafficConf})
                    </div>
                    <div style={{ fontSize: "var(--font-size-xs)", color: "var(--text-tertiary)" }}>
                      Traffic Location: {trafficLoc}
                    </div>
                  </div>
                </div>
                <span className="type-pill">AI Analysis</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* SYSTEM STATUS + TODAY SUMMARY */}
      <div className="bottom-grid">
        <div className="card">
          <h3>System Status</h3>
          <StatusItem label="AI Detection System" value="Online" />
          <StatusItem label="Analysis Records" value={results.length} />
          <StatusItem label="Latest Upload" value={formatTimestamp(latest?.timestamp ?? latest?.uploadedAt)} />
        </div>

        <div className="card">
          <h3>Today's Summary</h3>
          <StatusItem label="Total Images Analyzed" value={results.length} />
          <StatusItem label="Total Accidents" value={activeAccidents} />
          <StatusItem label="Total Congestion Cases" value={congestionAreas} />
          <StatusItem label="Highest Confidence Detection" value={highestConfidenceDetection ?? "N/A"} />
          <StatusItem label="Average Confidence" value={averageConfidence ?? "N/A"} />
        </div>
      </div>
    </div>
  );
}

function severityFromConfidence(conf) {
  const c = typeof conf === "number" ? conf : Number(conf);
  if (!Number.isFinite(c)) return "Low";
  if (c >= 0.85) return "High";
  if (c >= 0.6) return "Medium";
  return "Low";
}

function getHighestConfidence(results) {
  const confidences = [];
  for (const r of results || []) {
    const a = r?.accident?.confidence;
    const t = r?.traffic?.confidence;
    if (typeof a === "number" && Number.isFinite(a)) confidences.push(a);
    if (typeof t === "number" && Number.isFinite(t)) confidences.push(t);
  }
  return confidences.length ? Math.max(...confidences) : null;
}

function getAverageConfidence(results) {
  const confidences = [];
  for (const r of results || []) {
    const a = r?.accident?.confidence;
    const t = r?.traffic?.confidence;
    if (typeof a === "number" && Number.isFinite(a)) confidences.push(a);
    if (typeof t === "number" && Number.isFinite(t)) confidences.push(t);
  }
  if (!confidences.length) return null;
  const avg = confidences.reduce((s, v) => s + v, 0) / confidences.length;
  return Number(avg.toFixed(2));
}

function formatTimestamp(ts) {
  if (!ts) return "N/A";
  try {
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return String(ts);
    return d.toLocaleString();
  } catch {
    return String(ts);
  }
}

function StatusItem({ label, value }) {
  if (value === undefined || value === null) return null;

  const v = typeof value === "string" ? value : String(value);
  const isOnline = v.toLowerCase().includes("online") || v.toLowerCase().includes("running");

  return (
    <p>
      {label}{" "}
      <span className={isOnline ? "green" : ""}>{value}</span>
    </p>
  );
}

