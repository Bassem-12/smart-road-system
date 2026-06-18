// Centralized incident/category classification helper
// Maps backend prediction strings to UI marker categories.

/**
 * Determine incident type/category from backend analysis result.
 *
 * Supported categories: 'Accident' | 'Congestion'
 *
 * @param {object} result backend response (contains { accident, traffic })
 * @returns {'Accident'|'Congestion'}
 */
export function determineIncidentType(result) {
  const accidentPredictionClass = result?.accident?.predictionClass;
  const trafficPredictionClass = result?.traffic?.predictionClass;

  // Rule: IF accident?.predictionClass === "Accident" -> Accident
  if (accidentPredictionClass === "Accident") return "Accident";

  // Rule: ELSE IF traffic?.predictionClass contains "CONGESTION"
  // OR traffic?.predictionClass !== "NO CONGESTION" -> Congestion
  const trafficText = typeof trafficPredictionClass === "string" ? trafficPredictionClass : "";
  if (
    trafficText.includes("CONGESTION") ||
    trafficPredictionClass !== "NO CONGESTION"
  ) {
    return "Congestion";
  }

  // Rule: ELSE -> Accident
  return "Accident";
}


