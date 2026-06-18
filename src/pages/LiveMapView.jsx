import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useAnalysis } from "../context/AnalysisContext";
import "../styles/live-map.css";

import ErrorState from "../components/ui/ErrorState";

import { determineIncidentType } from "../utils/incidentType";

export default function LiveMapView() {
  const { token } = useAuth();
  const isAuthenticated = !!token;
  const { analysisResults, updateIncidentStatus } = useAnalysis();


  const [filter, setFilter] = useState("All");
  const [selectedId, setSelectedId] = useState(null);


  const positions = [
    { x: "20%", y: "25%" },
    { x: "40%", y: "35%" },
    { x: "60%", y: "45%" },
    { x: "30%", y: "60%" },
    { x: "70%", y: "20%" },
  ];

  const indexToXY = (index) => positions[index % positions.length];

  // Convert each analysis record to a marker payload while preserving full incident data.
  const mapAnalysisResultToIncident = (result, index) => {
    const { x, y } = indexToXY(index);
    const type = determineIncidentType(result);

    const location =
      result?.accident?.location || result?.traffic?.location || "N/A";

    return {
      // Stable ID for marker isolation
      id: result?.id,
      x,
      y,

      // Category derived from analysis result (no Violation logic)
      type,

      // Keep full incident data so details panel never mixes records
      status: result?.status || "Unresolved",
      timestamp: result?.timestamp || result?.uploadedAt,

      accident: result?.accident,
      traffic: result?.traffic,

      location,
    };
  };

  const incidents = analysisResults.map(mapAnalysisResultToIncident);


  useEffect(() => {
    if (!isAuthenticated) {
      setSelectedId(null);
      return;
    }

    if (!selectedId && incidents.length > 0) {
      setSelectedId(incidents[0].id);
    }
  }, [isAuthenticated, incidents, selectedId]);


  const filteredIncidents =
    filter === "All" ? incidents : incidents.filter((i) => i.type === filter);

  // Always resolve selected from the full incidents list so the details panel
  // is linked strictly to one analysis record.
  const selected = selectedId ? incidents.find((i) => i.id === selectedId) : null;



  const changeStatus = useCallback(
    (status) => {
      if (!selected) return;
      updateIncidentStatus(selected.id, status);
    },
    [selected, updateIncidentStatus]
  );




  // Loading issue fix: if analysisResults exist, render immediately.


  if (!incidents || incidents.length === 0) {
    return (
      <div className="live-map-container">
        <div className="live-map-header">
          <h1>Live Traffic Map</h1>
          <p>Real-time incident locations and traffic flow</p>
        </div>
        <ErrorState
          title="No Incidents"
          message="No incidents to display on the map at this time."
          onRetry={() => {}}
        />
      </div>
    );
  }


  return (
    <div className="live-map-container">
      <div className="live-map-header">
        <h1>Live Traffic Map</h1>
        <p>Real-time incident locations and traffic flow</p>
      </div>




      <div className="map-filters">
        {['All', 'Accident', 'Congestion'].map((item) => (
          <button
            key={item}
            className={filter === item ? "active" : ""}
            onClick={() => setFilter(item)}
          >
            {item}
          </button>
        ))}
      </div>



      <div className="map-layout">
        <div className="map-card">
          <h3>City Traffic Map</h3>
          <div className="map-area">
            <div className="map-controls">
              <button aria-label="Zoom in">+</button>
              <button aria-label="Zoom out">−</button>
              <button aria-label="Center map">⌂</button>
            </div>

            <div className="map-legend">
              <div className="legend-item">
                <span className="legend-dot accident"></span>
                <span>Accident</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot congestion"></span>
                <span>Congestion</span>
              </div>
            </div>

            {filteredIncidents.map((inc) => (
              <div
                key={inc.id}
                className={`map-dot ${inc.type.toLowerCase()} ${
                  inc.status?.toLowerCase() === "resolved" ? "resolved" : ""
                }`}
                style={{ left: inc.x, top: inc.y }}
                onClick={() => setSelectedId(inc.id)}
                title={`${inc.type} #${inc.id} - ${inc.status}`}
              />
            ))}

          </div>
        </div>



        <div className="details-card">
          <h3>Incident Details</h3>

          {!selected ? (

            <div className="details-placeholder">
              <span>📍</span>
              <p>Select an incident on the map</p>
            </div>
          ) : (
            <div className="details-content">
              <div style={{ marginBottom: "0.75rem" }}>
                <span
                  className={`category-badge ${selected.type?.toLowerCase()}`}
                  style={{ textTransform: "uppercase" }}
                >
                  {selected.type}
                </span>
              </div>

              <p>
                <b>Image ID:</b> <span>{selected.id}</span>
              </p>

              <p>
                <b>Category:</b> <span>{selected.type}</span>
              </p>

              <p>
                <b>Accident Prediction:</b>{" "}
                <span>{selected.accident?.predictionClass || "N/A"}</span>
              </p>

              <p>
                <b>Traffic Prediction:</b>{" "}
                <span>{selected.traffic?.predictionClass || "N/A"}</span>
              </p>

              <p>
                <b>Accident Confidence:</b>{" "}
                <span>
                  {typeof selected.accident?.confidence === "number"
                    ? `${(selected.accident.confidence * 100).toFixed(2)}%`
                    : "N/A"}
                </span>
              </p>

              <p>
                <b>Traffic Confidence:</b>{" "}
                <span>
                  {typeof selected.traffic?.confidence === "number"
                    ? `${(selected.traffic.confidence * 100).toFixed(2)}%`
                    : "N/A"}
                </span>
              </p>

              <p>
                <b>Location:</b> <span>{selected.location}</span>
              </p>

              <p>
                <b>Timestamp:</b> <span>{selected.timestamp || "N/A"}</span>
              </p>

              <p>
                <b>Status:</b>
                <span className={`status-badge ${selected.status?.toLowerCase()}`}>{selected.status}</span>
              </p>




              <div className="status-actions">
                <button className="resolved" onClick={() => changeStatus("Resolved")}>
                  Mark Resolved
                </button>
                <button className="unresolved" onClick={() => changeStatus("Unresolved")}>
                  Mark Unresolved
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

