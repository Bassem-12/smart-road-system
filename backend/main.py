"""
FastAPI Backend for Smart Road Monitor AI Analysis
Deploy this to HuggingFace Spaces or any cloud provider
"""

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import logging
import io
from PIL import Image
import uvicorn

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Smart Road Monitor AI API",
    description="API for road defect detection and analysis",
    version="1.0.0"
)

# ============================
# CORS CONFIGURATION - CRITICAL
# ============================
# This allows your React frontend to make requests to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*",  # Allow all origins (development only)
        # "https://your-frontend-url.vercel.app",  # Production frontend URL
        # "http://localhost:5173",  # Local Vite dev server
        # "http://localhost:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)


# ============================
# REQUEST/RESPONSE MODELS
# ============================
class AnalysisResult(BaseModel):
    status: str
    message: str
    model_name: str
    detections: List[dict]
    confidence: float
    processing_time: float


# ============================
# HEALTH CHECK ENDPOINT
# ============================
@app.get("/")
async def root():
    return {
        "status": "online",
        "message": "Smart Road Monitor AI API is running",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


# ============================
# PREDICTION ENDPOINT
# ============================
@app.post("/predict/{model_name}")
async def predict(
    model_name: str,
    file: UploadFile = File(..., description="Image file to analyze"),
    camera_id: str = Form("1", description="Camera ID"),
    analysis_type: Optional[str] = Form(None, description="Type of analysis"),
    location: Optional[str] = Form(None, description="Location/Road ID"),
    notes: Optional[str] = Form(None, description="Additional notes")
):
    """
    Analyze an image for road defects using the specified model.
    
    - **model_name**: Name of the AI model to use (e.g., "yolov8")
    - **file**: Image file to analyze (JPG, PNG, WEBP)
    - **camera_id**: Camera identifier
    - **analysis_type**: Type of analysis (pothole, crack, etc.)
    - **location**: Location or Road ID
    - **notes**: Additional notes
    """
    try:
        logger.info(f"Received prediction request: model={model_name}, camera={camera_id}")
        logger.info(f"File: {file.filename}, Content-Type: {file.content_type}")
        
        # Validate file type
        allowed_types = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type: {file.content_type}. Allowed: {allowed_types}"
            )
        
        # Read and validate image
        contents = await file.read()
        if len(contents) == 0:
            raise HTTPException(status_code=400, detail="Empty file uploaded")
        
        # Validate it's a valid image
        try:
            image = Image.open(io.BytesIO(contents))
            image.verify()  # Verify it's a valid image
            logger.info(f"Valid image: {image.format}, size: {image.size}")
        except Exception as e:
            logger.error(f"Invalid image: {e}")
            raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")
        
        # TODO: Add your actual AI model inference here
        # For now, return mock results
        result = {
            "status": "success",
            "message": f"Analysis complete using {model_name}",
            "model_name": model_name,
            "camera_id": camera_id,
            "analysis_type": analysis_type,
            "location": location or "Cairo Ring Road",
            "filename": file.filename,
            "accident": {
                "predictionClass": "Accident" if model_name == "yolov8" else "No Accident",
                "confidence": 0.92,
                "location": location or "Cairo Ring Road"
            },
            "traffic": {
                "predictionClass": "Congestion" if model_name == "yolov8" else "No Congestion",
                "confidence": 0.88,
                "location": location or "Cairo Ring Road"
            },
            "detections": [
                {
                    "class": "pothole",
                    "confidence": 0.94,
                    "bbox": [100, 200, 150, 250]
                },
                {
                    "class": "crack",
                    "confidence": 0.87,
                    "bbox": [300, 400, 350, 450]
                }
            ],
            "confidence": 0.91,
            "processing_time": 1.23,
            "image_size": {"width": 640, "height": 480}
        }
        
        logger.info(f"Analysis complete: {len(result['detections'])} detections")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


# ============================
# BATCH PREDICTION ENDPOINT
# ============================
@app.post("/predict/batch/{model_name}")
async def predict_batch(
    model_name: str,
    files: List[UploadFile] = File(..., description="Image files to analyze"),
    camera_id: str = Form("1"),
    analysis_type: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    notes: Optional[str] = Form(None)
):
    """
    Analyze multiple images for road defects.
    """
    results = []
    
    for file in files:
        try:
            contents = await file.read()
            
            # Validate image
            try:
                image = Image.open(io.BytesIO(contents))
                image.verify()
            except Exception:
                results.append({
                    "filename": file.filename,
                    "status": "error",
                    "message": "Invalid image file"
                })
                continue
            
            # TODO: Add actual model inference
            results.append({
                "filename": file.filename,
                "status": "success",
                "detections": [
                    {"class": "pothole", "confidence": 0.94}
                ]
            })
            
        except Exception as e:
            results.append({
                "filename": file.filename,
                "status": "error",
                "message": str(e)
            })
    
    return {
        "status": "success",
        "model_name": model_name,
        "camera_id": camera_id,
        "results": results
    }


# ============================
# ERROR HANDLERS
# ============================
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Global error: {str(exc)}", exc_info=True)
    return {
        "status": "error",
        "message": "An unexpected error occurred",
        "detail": str(exc)
    }


# ============================
# RUN SERVER
# ============================
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

