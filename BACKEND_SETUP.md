# FastAPI Backend Setup Guide

## Root Cause of Network Error

The "Network Error" was caused by multiple issues:

1. **Wrong API URL**: Frontend was using `http://localhost:5000/api` but your backend is on HuggingFace Spaces
2. **Missing CORS**: FastAPI backend didn't have CORS middleware configured
3. **Wrong Endpoint**: Frontend was calling `/analyze` but backend expects `/predict/{model_name}`
4. **Mock API Enabled**: `USE_MOCK_API = true` was intercepting all requests

## Quick Fix Checklist

### 1. Update Frontend Environment
Edit `smart-road-monitor/.env`:
```
VITE_API_BASE_URL=https://alimoking2003-smart-system-for-road-monitoring.hf.space
```

### 2. Deploy FastAPI Backend to HuggingFace Spaces

Create these files in your backend repo:

**main.py** (see `backend/main.py` in this project):
```python
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CRITICAL: CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/predict/{model_name}")
async def predict(
    model_name: str,
    file: UploadFile = File(...),
    camera_id: str = Form("1")
):
    # Your AI model logic here
    return {"status": "success", "detections": []}
```

**requirements.txt**:
```
fastapi
uvicorn
python-multipart
pillow
```

### 3. Test the Connection

After deploying backend:
1. Open browser dev tools (F12)
2. Go to Network tab
3. Upload an image in the frontend
4. Check the request:
   - URL should be: `https://alimoking2003-smart-system-for-road-monitoring.hf.space/predict/yolov8`
   - Status should be: `200 OK`
   - If `CORS error`: Check backend CORS config
   - If `404`: Check endpoint path
   - If `500`: Check backend logs

### 4. Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Network Error | CORS blocked | Add CORSMiddleware to FastAPI |
| 404 Not Found | Wrong endpoint | Use `/predict/{model_name}` |
| 500 Server Error | Backend crash | Check backend logs, add try/except |
| Mixed Content | HTTP/HTTPS mismatch | Use HTTPS for both frontend and backend |
| Empty response | File not sent | Check FormData append |

## Debugging Tips

### Browser Network Tab
1. Press F12 → Network tab
2. Look for the POST request to `/predict/...`
3. Check:
   - Request URL (must be full HTTPS URL)
   - Status code
   - Request headers (Content-Type should be `multipart/form-data`)
   - Response tab for error messages

### Backend Logs
```bash
# If running locally
uvicorn main:app --reload --log-level debug

# Check HuggingFace Spaces logs
# Go to your Space → Files → Logs
```

### Test with curl
```bash
curl -X POST \
  "https://alimoking2003-smart-system-for-road-monitoring.hf.space/predict/yolov8" \
  -F "file=@test_image.jpg" \
  -F "camera_id=1"
```

