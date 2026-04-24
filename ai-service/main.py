import os
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import numpy as np
import cv2
from typing import List

# ─── Load configuration from environment ────────────────────────────────────
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))

# Comma-separated list of origins allowed to call this service.
# In production set ALLOWED_ORIGINS=https://your-backend.onrender.com,https://your-frontend.vercel.app
_raw_origins = os.getenv("ALLOWED_ORIGINS", "*")
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",")]

# ─── App setup ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="AssetGuardian Vision AI Service",
    description="AI-powered media fingerprinting and piracy detection",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routes ──────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "message": "Vision AI is running",
        "model": "ResNet-50-Sentinel",
        "status": "healthy"
    }

@app.get("/health")
async def health():
    """Health-check endpoint for deployment platforms."""
    return {"status": "ok"}

@app.post("/analyze")
async def analyze_media(file: UploadFile = File(...)):
    """
    Accepts an image upload and returns a simulated AI fingerprint match.
    In production this would run a CNN hash comparison against a rights DB.
    """
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        return {"error": "Invalid image format"}

    # Simulate match confidence
    confidence = float(np.random.uniform(0.85, 0.99))
    is_authorized = confidence > 0.95

    return {
        "filename": file.filename,
        "match_confidence": round(confidence, 4),
        "authorized": is_authorized,
        "anomaly_detected": not is_authorized,
        "recommended_action": "None" if is_authorized else "Flag for Takedown"
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host=HOST, port=PORT, reload=False)
