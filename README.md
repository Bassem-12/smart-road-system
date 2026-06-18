# Smart Road Monitor System 🛣️🤖

An AI-powered, real-time road anomaly and traffic incident detection system. By leveraging a **React (Vite) Frontend** and a **FastAPI (Python) Backend**, the system processes camera footage and images to detect road anomalies (e.g., potholes, cracks) and traffic conditions (e.g., accidents, congestion).

---

## 🌟 Key Features

*   **Live Map View**: Interactive map overlay with live markers representing traffic issues, accidents, or anomalies dynamically positioned using camera coordinates.
*   **AI Media Analysis**: Drag-and-drop file upload to analyze road images or video frames using state-of-the-art computer vision models (e.g., YOLOv8).
*   **Analytics Dashboard**: Comprehensive charts showing historical metrics, system performance, and active incident trends.
*   **User Management**: Fully integrated role-based dashboard for Admins and Officers to manage credentials, users, and filters.
*   **Weekly Reports**: Automatic generation of summary reports for road monitoring audits.
*   **Responsive UI**: Optimized for desktops and mobile devices, featuring modern dashboard telemetry widgets.

---

## 🏗️ Architecture & Project Structure

The project has a decoupled client-server architecture:

```
smart-road-system/
├── backend/                  # FastAPI Application
│   ├── main.py               # API Endpoints & Mock inference engine
│   ├── requirements.txt      # Python dependencies
│   └── venv/                 # Virtual environment (local development)
│
├── src/                      # React Frontend (Vite)
│   ├── components/           # Common components (Navbar, Filters, Modals)
│   ├── context/              # Context Providers (Auth, Analysis)
│   ├── pages/                # App Views (Home, Dashboard, Map, Live Logs)
│   ├── routes/               # Role-based protected routing logic
│   ├── services/             # Axios/Fetch services for backend connection
│   ├── styles/               # CSS styling for all modules
│   └── utils/                # Utility helper functions (e.g., incident type helper)
│
├── package.json              # Frontend npm configuration
├── vite.config.js            # Vite compiler & proxy settings
└── BACKEND_SETUP.md          # In-depth backend deployment checklist
```

---

## ⚙️ Configuration & Environment

Create a `.env` file in the root directory (based on `.env.example`):

```env
# URL for the FastAPI Backend API
VITE_API_BASE_URL=https://alimoking2003-smart-system-for-road-monitoring.hf.space
```

> [!NOTE]
> During local development, if you are running the FastAPI server locally, set this to `http://localhost:8000`.

---

## 🚀 Setup & Installation

### 1. Backend Setup (FastAPI)

1.  **Navigate to the backend folder**:
    ```bash
    cd backend
    ```
2.  **Create a virtual environment**:
    ```bash
    python -m venv venv
    ```
3.  **Activate the virtual environment**:
    *   **Windows (PowerShell)**: `.\venv\Scripts\Activate.ps1`
    *   **macOS/Linux**: `source venv/bin/activate`
4.  **Install the dependencies**:
    ```bash
    pip install -r requirements.txt
    ```
5.  **Run the local development server**:
    ```bash
    uvicorn main:app --reload --port 8000
    ```
    *   The API documentation will be available at: `http://127.0.0.1:8000/docs`

### 2. Frontend Setup (React + Vite)

1.  **Navigate to the root directory**:
    ```bash
    cd ..
    ```
2.  **Install NPM packages**:
    ```bash
    npm install
    ```
3.  **Launch Vite development server**:
    ```bash
    npm run dev
    ```
    *   The application will run locally at: `http://localhost:5173`

---

## 🔌 API Endpoints Reference

### Health Check
*   **GET** `/`
    *   Response: `{"status": "online", "message": "Smart Road Monitor AI API is running", "version": "1.0.0"}`
*   **GET** `/health`
    *   Response: `{"status": "healthy"}`

### AI Prediction / Analysis
*   **POST** `/predict/{model_name}`
    *   **URL Parameter**: `model_name` (e.g., `yolov8`)
    *   **Request Format**: `multipart/form-data`
    *   **Body Fields**:
        *   `file`: Image File (JPG, PNG, WEBP)
        *   `camera_id`: String (e.g., `"1"`)
        *   `location` *(Optional)*: String
        *   `analysis_type` *(Optional)*: String
    *   **Response (JSON)**:
        ```json
        {
          "status": "success",
          "message": "Analysis complete using yolov8",
          "model_name": "yolov8",
          "camera_id": "1",
          "location": "Cairo Ring Road",
          "accident": {
            "predictionClass": "Accident",
            "confidence": 0.92,
            "location": "Cairo Ring Road"
          },
          "traffic": {
            "predictionClass": "Congestion",
            "confidence": 0.88,
            "location": "Cairo Ring Road"
          },
          "detections": [
            {
              "class": "pothole",
              "confidence": 0.94,
              "bbox": [100, 200, 150, 250]
            }
          ],
          "confidence": 0.91,
          "processing_time": 1.23
        }
        ```

---

## ☁️ HuggingFace Spaces Deployment

To host the FastAPI backend on HuggingFace Spaces:

1.  Create a new Space on [Hugging Face](https://huggingface.co/new-space) (Select **Docker** or **Python** SDK, Docker is recommended for Python/FastAPI custom builds).
2.  Upload `main.py` and `requirements.txt` from the `backend/` folder.
3.  Ensure your Space's environment is set to expose port `7860` (default HuggingFace port) or configure uvicorn accordingly.
4.  Update your frontend `.env` with your Space's HTTPS endpoint.

---

## 🛠️ Troubleshooting

| Issue | Root Cause | Resolution |
| :--- | :--- | :--- |
| **Network Error** | CORS Blocked on API / Wrong Endpoint | Add `CORSMiddleware` to FastAPI and set correct `VITE_API_BASE_URL` |
| **404 Not Found** | Calling `/analyze` instead of `/predict/{model}` | Update API service call to use `/predict/yolov8` |
| **500 Server Error** | Invalid image formats or empty files uploaded | Verify file content type in browser Network Tab; ensure image parsing succeeds on backend |
| **Mixed Content** | Frontend (HTTPS) loading Backend (HTTP) | Deploy backend to HTTPS (e.g., HuggingFace Spaces, Heroku, Render) |
