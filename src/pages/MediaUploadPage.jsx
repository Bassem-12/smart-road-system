import { useState, useRef, useCallback } from "react";
import { useAnalysis } from "../context/AnalysisContext";
import { analyzeMultipleMedia } from "../services/aiAnalysis.service.js";

export default function MediaUploadPage() {
  const { analysisResults, addAnalysisResult } = useAnalysis();
  const inputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [dragover, setDragover] = useState(false);
  const [cameraId, setCameraId] = useState("1");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState(null);
  const [uploading, setUploading] = useState(false);

  const addFiles = useCallback((newFiles) => {
    const allowed = Array.from(newFiles).filter(
      (f) => f.type.startsWith("image/") || f.type.startsWith("video/")
    );
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name + f.size));
      return [
        ...prev,
        ...allowed
          .filter((f) => !existing.has(f.name + f.size))
          .map((f) => Object.assign(f, { preview: URL.createObjectURL(f) })),
      ];
    });
    setStatus(null);
  }, []);

  const removeFile = (idx) => {
    setFiles((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragover(false);
    addFiles(e.dataTransfer.files);
  };

  // ── SUBMIT ──────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!files.length) {
      setStatus({
        type: "error",
        title: "No Files",
        msg: "Please select at least one image file.",
      });
      return;
    }

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(files[0].type)) {
      setStatus({
        type: "error",
        title: "Invalid File",
        msg: "Please upload JPG, PNG, or WEBP images only.",
      });
      return;
    }

    if (!cameraId.trim()) {
      setStatus({
        type: "error",
        title: "Missing Camera ID",
        msg: "Camera ID is required for image processing.",
      });
      return;
    }

    setUploading(true);
    setProgress(0);
    setStatus({ type: "info", title: "Processing...", msg: "Analyzing image with AI model." });

    try {
      const timer = setInterval(() => {
        setProgress((p) => {
          if (p >= 90) {
            clearInterval(timer);
            return p;
          }
          return p + Math.random() * 15;
        });
      }, 300);

      const data = await analyzeMultipleMedia(files, cameraId);

      clearInterval(timer);
      setProgress(100);
      addAnalysisResult(data);

      setStatus({
        type: "success",
        title: "Analysis Complete",
        msg: `Accident: ${data.accident?.predictionClass || "N/A"}, Traffic: ${data.traffic?.predictionClass || "N/A"}`,
      });
      setFiles([]);
    } catch (err) {
      console.error("Upload error:", err);
      setStatus({
        type: "error",
        title: "Analysis Failed",
        msg: err.message || "Unable to connect to backend. Check CORS and server.",
      });
    } finally {
      setUploading(false);
    }
  };

  const latest = analysisResults[analysisResults.length - 1];

  return (
    <>
      <style>{`
        /* ── PAGE ── */
        .srm-upload-page {
          min-height: calc(100vh - 60px);
          padding: 3rem 2rem 5rem;
          max-width: 860px; margin: 0 auto;
          font-family: 'Exo 2', sans-serif;
        }

        .srm-page-header { margin-bottom: 2.5rem; }
        .srm-page-header h1 {
          font-family: 'Rajdhani', sans-serif; font-size: 2rem; font-weight: 700;
          letter-spacing: .06em; text-transform: uppercase;
          color: var(--text);
        }
        .srm-page-header h1 span { color: var(--accent); }
        .srm-page-header p {
          color: var(--muted); font-size: .9rem; margin-top: .5rem; font-weight: 300;
        }
        .srm-breadcrumb {
          font-size: .75rem; color: var(--muted); margin-bottom: .75rem;
          font-family: 'Rajdhani', sans-serif; letter-spacing: .05em; text-transform: uppercase;
        }
        .srm-breadcrumb span { color: var(--accent); }

        /* ── DROP ZONE ── */
        .srm-dropzone {
          border: 2px dashed var(--border);
          border-radius: 12px;
          background: var(--surface);
          padding: 3.5rem 2rem;
          text-align: center;
          cursor: pointer;
          transition: border-color .25s, background .25s, transform .15s;
          position: relative; overflow: hidden;
        }
        .srm-dropzone::before {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(ellipse at 50% 0%, rgba(0,200,255,.05) 0%, transparent 70%);
          pointer-events: none;
        }
        .srm-dropzone:hover, .srm-dropzone.dragover {
          border-color: var(--accent);
          background: var(--surface2);
          transform: scale(1.005);
        }
        .srm-dropzone.dragover { border-style: solid; }

        .srm-dz-icon {
          width: 56px; height: 56px; margin: 0 auto 1.25rem;
          background: rgba(0,200,255,.1); border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid rgba(0,200,255,.2);
        }
        .srm-dz-icon svg { width: 26px; height: 26px; color: var(--accent); }
        .srm-dz-title {
          font-family: 'Rajdhani', sans-serif; font-size: 1.15rem; font-weight: 600;
          letter-spacing: .05em; color: var(--text); margin-bottom: .5rem;
        }
        .srm-dz-sub { font-size: .82rem; color: var(--muted); font-weight: 300; }
        .srm-dz-types {
          display: flex; gap: .5rem; justify-content: center; flex-wrap: wrap;
          margin-top: 1.25rem;
        }
        .srm-badge {
          font-family: 'Rajdhani', sans-serif; font-size: .7rem; font-weight: 600;
          letter-spacing: .08em; text-transform: uppercase;
          padding: .25rem .65rem; border-radius: 4px;
          border: 1px solid var(--border); color: var(--muted);
          background: var(--bg);
        }
        .srm-badge.accent { border-color: rgba(0,200,255,.3); color: var(--accent); background: rgba(0,200,255,.06); }

        /* ── FILE PREVIEW ── */
        .srm-preview-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 1rem; margin-top: 1.5rem;
        }
        .srm-preview-item {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 8px; overflow: hidden;
          position: relative; aspect-ratio: 1;
          animation: fadeIn .3s ease;
        }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        .srm-preview-item img, .srm-preview-item video {
          width: 100%; height: 100%; object-fit: cover;
        }
        .srm-preview-item__overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(8,13,20,.9) 0%, transparent 50%);
          display: flex; align-items: flex-end; padding: .5rem;
        }
        .srm-preview-item__name {
          font-size: .7rem; color: var(--text); white-space: nowrap;
          overflow: hidden; text-overflow: ellipsis; width: 100%;
        }
        .srm-preview-item__remove {
          position: absolute; top: .4rem; right: .4rem;
          width: 22px; height: 22px; border-radius: 50%;
          background: rgba(8,13,20,.8); border: 1px solid var(--border);
          color: var(--muted); cursor: pointer; font-size: .8rem;
          display: flex; align-items: center; justify-content: center;
          transition: color .2s, background .2s;
        }
        .srm-preview-item__remove:hover { color: #ff4d6a; background: rgba(255,77,106,.15); }
        .srm-preview-item__type {
          position: absolute; top: .4rem; left: .4rem;
          font-family: 'Rajdhani', sans-serif; font-size: .6rem; font-weight: 700;
          letter-spacing: .08em; text-transform: uppercase;
          padding: .15rem .4rem; border-radius: 3px;
          background: rgba(0,200,255,.15); color: var(--accent); border: 1px solid rgba(0,200,255,.25);
        }

        /* ── FORM FIELDS ── */
        .srm-form { margin-top: 2rem; display: flex; flex-direction: column; gap: 1.25rem; }
        .srm-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        @media (max-width: 560px) { .srm-form-row { grid-template-columns: 1fr; } }

        .srm-field label {
          display: block; font-family: 'Rajdhani', sans-serif; font-size: .75rem;
          font-weight: 600; letter-spacing: .08em; text-transform: uppercase;
          color: var(--muted); margin-bottom: .45rem;
        }
        .srm-field select, .srm-field input, .srm-field textarea {
          width: 100%; background: var(--surface); border: 1px solid var(--border);
          border-radius: 6px; padding: .65rem .85rem;
          color: var(--text); font-family: 'Exo 2', sans-serif; font-size: .875rem;
          outline: none; transition: border-color .2s, box-shadow .2s;
          appearance: none;
        }
        .srm-field select:focus, .srm-field input:focus, .srm-field textarea:focus {
          border-color: var(--accent); box-shadow: 0 0 0 3px rgba(0,200,255,.1);
        }
        .srm-field textarea { resize: vertical; min-height: 80px; }
        .srm-field select {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235a7a9a' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right .85rem center;
          padding-right: 2.5rem;
        }
        .srm-field select option { background: var(--surface2); }

        /* ── SUBMIT ── */
        .srm-actions { display: flex; gap: 1rem; align-items: center; margin-top: .5rem; flex-wrap: wrap; }
        .srm-btn {
          font-family: 'Rajdhani', sans-serif; font-size: .9rem; font-weight: 700;
          letter-spacing: .1em; text-transform: uppercase;
          padding: .75rem 2rem; border-radius: 6px; cursor: pointer;
          border: none; transition: all .2s;
        }
        .srm-btn--primary {
          background: var(--accent); color: #080d14;
          box-shadow: 0 0 20px rgba(0,200,255,.3);
        }
        .srm-btn--primary:hover:not(:disabled) {
          background: #33d4ff;
          box-shadow: 0 0 30px rgba(0,200,255,.5);
          transform: translateY(-1px);
        }
        .srm-btn--primary:disabled { opacity: .45; cursor: not-allowed; transform: none; }
        .srm-btn--ghost {
          background: transparent; color: var(--muted);
          border: 1px solid var(--border);
        }
        .srm-btn--ghost:hover { color: var(--text); border-color: var(--muted); }

        /* ── PROGRESS ── */
        .srm-progress { margin-top: 1.5rem; }
        .srm-progress__label {
          display: flex; justify-content: space-between; align-items: center;
          font-family: 'Rajdhani', sans-serif; font-size: .75rem; font-weight: 600;
          letter-spacing: .06em; text-transform: uppercase;
          color: var(--muted); margin-bottom: .5rem;
        }
        .srm-progress__label span { color: var(--accent); }
        .srm-progress__track {
          height: 4px; background: var(--surface2); border-radius: 2px; overflow: hidden;
        }
        .srm-progress__fill {
          height: 100%; border-radius: 2px;
          background: linear-gradient(90deg, var(--accent), var(--accent2));
          box-shadow: 0 0 10px var(--accent);
          transition: width .4s ease;
        }

        /* ── STATUS ── */
        .srm-status {
          display: flex; align-items: flex-start; gap: .75rem;
          padding: 1rem 1.25rem; border-radius: 8px;
          border: 1px solid; margin-top: 1.5rem;
          animation: fadeIn .3s ease;
        }
        .srm-status--success { border-color: rgba(0,255,157,.25); background: rgba(0,255,157,.06); }
        .srm-status--error   { border-color: rgba(255,77,106,.25); background: rgba(255,77,106,.06); }
        .srm-status--info    { border-color: rgba(0,200,255,.25); background: rgba(0,200,255,.06); }
        .srm-status__icon { font-size: 1.1rem; flex-shrink: 0; }
        .srm-status__text { font-size: .875rem; }
        .srm-status__title {
          font-family: 'Rajdhani', sans-serif; font-weight: 700; font-size: .85rem;
          letter-spacing: .05em; text-transform: uppercase; margin-bottom: .25rem;
        }
        .srm-status--success .srm-status__title { color: var(--accent2); }
        .srm-status--error   .srm-status__title { color: #ff4d6a; }
        .srm-status--info    .srm-status__title { color: var(--accent); }

        /* ── DIVIDER ── */
        .srm-divider {
          border: none; border-top: 1px solid var(--border);
          margin: 2rem 0;
        }

        /* ── INFO CARD ── */
        .srm-info-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-top: 2rem; }
        @media (max-width: 600px) { .srm-info-cards { grid-template-columns: 1fr; } }
        .srm-info-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 8px; padding: 1rem 1.25rem;
        }
        .srm-info-card__num {
          font-family: 'Rajdhani', sans-serif; font-size: 1.4rem; font-weight: 700;
          color: var(--accent); line-height: 1;
        }
        .srm-info-card__label {
          font-size: .75rem; color: var(--muted); margin-top: .3rem; font-weight: 300;
        }
      `}</style>

      <div className="srm-upload-page">
        {/* Header */}
        <div className="srm-page-header">
          <div className="srm-breadcrumb">Dashboard / <span>AI Analysis</span></div>
          <h1>AI <span>Analysis</span> Upload</h1>
          <p>Upload road images or videos for automated defect detection and classification.</p>
        </div>

        {/* Stats */}
        <div className="srm-info-cards">
          {[
            { num: "98.4%", label: "Detection Accuracy" },
            { num: "<2s", label: "Avg. Processing Time" },
            { num: "12", label: "Defect Categories" },
          ].map((c) => (
            <div className="srm-info-card" key={c.label}>
              <div className="srm-info-card__num">{c.num}</div>
              <div className="srm-info-card__label">{c.label}</div>
            </div>
          ))}
        </div>

        <hr className="srm-divider" />

        {/* Drop Zone */}
        <div
          className={`srm-dropzone ${dragover ? "dragover" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragover(true);
          }}
          onDragLeave={() => setDragover(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            style={{ display: "none" }}
            onChange={(e) => addFiles(e.target.files)}
          />
          <div className="srm-dz-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
          </div>
          <div className="srm-dz-title">{dragover ? "Drop to Upload" : "Drag & Drop Files Here"}</div>
          <div className="srm-dz-sub">or click to browse from your device</div>
          <div className="srm-dz-types">
            {["JPG", "PNG", "WEBP", "MP4", "MOV", "AVI"].map((t) => (
              <span
                key={t}
                className={`srm-badge ${["JPG", "PNG", "WEBP"].includes(t) ? "accent" : ""}`}
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Preview Grid */}
        {files.length > 0 && (
          <div className="srm-preview-grid">
            {files.map((f, i) => (
              <div className="srm-preview-item" key={f.name + i}>
                <div className="srm-preview-item__type">{f.type.startsWith("video/") ? "VID" : "IMG"}</div>
                {f.type.startsWith("video/") ? (
                  <video src={f.preview} muted playsInline />
                ) : (
                  <img src={f.preview} alt={f.name} />
                )}
                <div className="srm-preview-item__overlay">
                  <div className="srm-preview-item__name">{f.name}</div>
                </div>
                <button
                  className="srm-preview-item__remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(i);
                  }}
                  title="Remove"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Form */}
        <div className="srm-form">
          <div className="srm-form-row">
            <div className="srm-field">
              <label>Camera ID</label>
              <input
                type="text"
                placeholder="Enter camera ID"
                value={cameraId}
                onChange={(e) => setCameraId(e.target.value)}
              />
            </div>
            <div className="srm-field">
              <label>Location / Road ID</label>
              <input
                type="text"
                placeholder="e.g. Ring Road KM 12, Cairo"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>
          <div className="srm-field">
            <label>Additional Notes (optional)</label>
            <textarea
              placeholder="Describe the road condition, time of capture, or any relevant context…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Progress */}
          {uploading && (
            <div className="srm-progress">
              <div className="srm-progress__label">
                <span>Uploading</span>
                <span>{Math.min(100, Math.round(progress))}%</span>
              </div>
              <div className="srm-progress__track">
                <div className="srm-progress__fill" style={{ width: `${Math.min(100, progress)}%` }} />
              </div>
            </div>
          )}

          {/* Status */}
          {status && (
            <div className={`srm-status srm-status--${status.type}`}>
              <div className="srm-status__icon">{status.type === "success" ? "✓" : status.type === "error" ? "✕" : "↑"}</div>
              <div className="srm-status__text">
                <div className="srm-status__title">{status.title}</div>
                <div>{status.msg}</div>
              </div>
            </div>
          )}

          {latest && (
            <div
              className="srm-result-summary"
              style={{ marginTop: "1.25rem", padding: "1rem", border: "1px solid var(--border)", borderRadius: "10px", background: "var(--surface)" }}
            >
              <h3 style={{ margin: 0, marginBottom: "0.75rem" }}>Latest Analysis Result</h3>
              <div style={{ display: "grid", gap: "0.75rem" }}>
                <div>
                  <strong>Accident Location:</strong> {latest.accident?.location || "N/A"}
                </div>
                <div>
                  <strong>Accident Status:</strong> {latest.accident?.predictionClass || "N/A"}
                </div>
                <div>
                  <strong>Accident Confidence:</strong> {latest.accident?.confidence ?? "N/A"}
                </div>
                <div>
                  <strong>Traffic Location:</strong> {latest.traffic?.location || "N/A"}
                </div>
                <div>
                  <strong>Traffic Status:</strong> {latest.traffic?.predictionClass || "N/A"}
                </div>
                <div>
                  <strong>Traffic Confidence:</strong> {latest.traffic?.confidence ?? "N/A"}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="srm-actions">
            <button
              className="srm-btn srm-btn--primary"
              onClick={handleSubmit}
              disabled={uploading || !files.length}
            >
              {uploading ? "Analyzing…" : `Run AI Analysis ${files.length ? `(${files.length})` : ""}`}
            </button>
            <button
              className="srm-btn srm-btn--ghost"
              onClick={() => {
                setFiles([]);
                setStatus(null);
                setProgress(0);
              }}
              disabled={uploading}
            >
              Clear All
            </button>
            <span style={{ fontSize: ".78rem", color: "var(--muted)", marginLeft: "auto" }}>Max 10 files · 500 MB each</span>
          </div>
        </div>
      </div>
    </>
  );
}

