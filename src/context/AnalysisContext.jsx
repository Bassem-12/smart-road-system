import { createContext, useContext, useState } from "react";

const AnalysisContext = createContext(null);

export function AnalysisProvider({ children }) {
  const [analysisResults, setAnalysisResults] = useState([]);

  const addAnalysisResult = (result) => {
    setAnalysisResults((prev) => [
      ...prev,
      {
        ...result,
        id: crypto.randomUUID(),
        uploadedAt: new Date().toISOString(),
        status: "Unresolved",
      },
    ]);
  };

  const updateIncidentStatus = (id, status) => {
    setAnalysisResults((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );
  };

  const clearAnalysisResults = () => {
    setAnalysisResults([]);
  };

  return (
    <AnalysisContext.Provider
      value={{
        analysisResults,
        addAnalysisResult,
        updateIncidentStatus,
        clearAnalysisResults,
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}


export function useAnalysis() {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error("useAnalysis must be used within an AnalysisProvider");
  }
  return context;
}

