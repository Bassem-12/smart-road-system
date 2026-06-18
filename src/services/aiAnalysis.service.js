/**
 * AI Analysis Service
 * Handles media file analysis requests to the FastAPI backend
 */

// Use environment variable for API base URL
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Analyze a single media file using AI backend
 * Backend endpoint: POST /predict/{modelName}
 * Request: multipart/form-data with "file" and "camera_id" fields
 * 
 * @param {File} file - Image file
 * @param {string} cameraId - Camera identifier
 * @param {string} modelName - AI Model name (default: 'yolov8')
 * @returns {Promise<Object>} Analysis result with accident and traffic predictions
 */
export const analyzeMedia = async (file, cameraId = '1', modelName = 'yolov8') => {
  if (!file) {
    throw new Error('No file provided. Please select an image file.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('camera_id', cameraId);

  const url = `${BASE_URL}/predict/${modelName}`;

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  let data;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = { detail: await response.text() };
  }

  if (!response.ok) {
    const msg = data.detail || data.message || `Request failed (${response.status})`;
    if (response.status === 400) {
      throw new Error(msg || 'Bad request. Check uploaded file and camera_id.');
    }
    if (response.status === 404) {
      throw new Error(`Endpoint not found. Verify backend route /predict/${modelName}.`);
    }
    if (response.status === 500) {
      throw new Error('Server error. Please try again later.');
    }
    throw new Error(msg);
  }

  return data;
};

/**
 * Analyze media files (UI supports multiple, but backend contract accepts one file per request)
 * @param {File[]} files - Uploaded files
 * @param {string} cameraId - Camera identifier
 * @returns {Promise<Object>} Analysis result
 */
export const analyzeMultipleMedia = async (files, cameraId = '1') => {
  if (!files || files.length === 0) {
    throw new Error('No files provided. Please select a file to upload.');
  }

  const file = files[0];
  return analyzeMedia(file, cameraId);
};
