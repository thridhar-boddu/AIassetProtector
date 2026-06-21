import os
import io
import time
import random
import logging
from typing import List, Dict, Any

from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import uvicorn
import httpx
from PIL import Image, ImageDraw, ImageFont
from dotenv import load_dotenv

# Load environment variables from .env if present
load_dotenv()

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("asset-guardian-backend")

# Server Config
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8080"))

# Database Environment Variables (log configuration for parity/compatibility check)
DATABASE_URL = os.getenv("DATABASE_URL")
DB_USERNAME = os.getenv("DB_USERNAME")
DB_PASSWORD = os.getenv("DB_PASSWORD")

if DATABASE_URL:
    logger.info(f"PostgreSQL environment variable config detected (URL: {DATABASE_URL[:30]}...)")
else:
    logger.warning("No DATABASE_URL configured. Running backend in mock-only database status.")

# CORS Allowed Origins
_allowed_origins_raw = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")
ALLOWED_ORIGINS = [o.strip() for o in _allowed_origins_raw.split(",")]

# Initialize FastAPI App
app = FastAPI(
    title="AssetGuardian Backend",
    description="Digital Asset Protection Backend (Python FastAPI)",
    version="1.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    max_age=3600,
)

# ESPN endpoints map
ESPN_ENDPOINTS = {
    "IPL":           "https://site.api.espn.com/apis/site/v2/sports/cricket/8048/scoreboard",
    "India Cricket": "https://site.api.espn.com/apis/site/v2/sports/cricket/1/scoreboard",
    "ISL":           "https://site.api.espn.com/apis/site/v2/sports/soccer/ind.1/scoreboard",
    "F1":            "https://site.api.espn.com/apis/site/v2/sports/racing/f1/scoreboard",
    "Tennis":        "https://site.api.espn.com/apis/site/v2/sports/tennis/atp/scoreboard",
    "NBA":           "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard",
    "UFC":           "https://site.api.espn.com/apis/site/v2/sports/mma/ufc/scoreboard",
    "EPL":           "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard"
}

def java_hash_code(s: str) -> int:
    h = 0
    for c in s:
        h = (31 * h + ord(c)) & 0xFFFFFFFF
    if h >= 0x80000000:
        h -= 0x100000000
    return h

async def fetch_from_url(client: httpx.AsyncClient, url: str) -> List[str]:
    names = []
    try:
        response = await client.get(url, timeout=5.0)
        if response.status_code == 200:
            data = response.json()
            events = data.get("events", [])
            for event in events:
                names.append(event.get("shortName"))
                if len(names) >= 5:
                    break
    except Exception as e:
        logger.debug(f"Failed to fetch live events from {url}: {e}")
    return names

async def fetch_live_event_names(client: httpx.AsyncClient, topic: str) -> List[str]:
    names = []
    url = ESPN_ENDPOINTS.get(topic)
    if url is None:
        # Try all endpoints for "All Assets"
        for ep in ESPN_ENDPOINTS.values():
            names.extend(await fetch_from_url(client, ep))
            if len(names) >= 6:
                break
    else:
        names.extend(await fetch_from_url(client, url))
    return names

def run_scan_task(platform: str):
    # Simulate network latency (2 seconds)
    time.sleep(2)
    logger.info(f"Platform scan completed for {platform}")

# ─── Routes ──────────────────────────────────────────────────────────────────

@app.get("/api/status")
async def get_status():
    return {
        "status": "System Online",
        "version": "1.0.0",
        "crawlers": "Active"
    }

@app.post("/api/protection/watermark")
async def watermark_asset(
    file: UploadFile = File(...),
    text: str = Form(...)
):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGBA")
        
        # Create alpha watermark overlay
        txt_overlay = Image.new("RGBA", image.size, (255, 255, 255, 0))
        
        # Load a premium font
        try:
            # Arial is commonly available, or try to load a default font
            font = ImageFont.truetype("arial.ttf", 64)
        except Exception:
            font = ImageFont.load_default()
            
        draw = ImageDraw.Draw(txt_overlay)
        
        # Calculate text dimensions to center it
        try:
            bbox = draw.textbbox((0, 0), text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
        except AttributeError:
            # Fallback for older Pillow versions
            text_width, text_height = draw.textsize(text, font=font)
            
        x = (image.width - text_width) // 2
        y = (image.height - text_height) // 2
        
        # Draw white watermark with 0.3 opacity (approx 76 in alpha)
        draw.text((x, y), text, fill=(255, 255, 255, 76), font=font)
        
        # Composite the watermark
        watermarked_image = Image.alpha_composite(image, txt_overlay)
        
        # Save back to a byte stream as PNG
        out_stream = io.BytesIO()
        watermarked_image.convert("RGB").save(out_stream, format="PNG")
        out_stream.seek(0)
        
        return StreamingResponse(out_stream, media_type="image/png")
    except Exception as e:
        logger.error(f"Error watermarking asset: {e}")
        return {"error": str(e)}, 500

@app.post("/api/protection/scan")
async def start_scan(
    request: Dict[str, str],
    background_tasks: BackgroundTasks
):
    platform = request.get("platform", "global")
    background_tasks.add_task(run_scan_task, platform)
    job_id = f"JOB-{int(time.time() * 1000)}"
    return {
        "status": "Scan Initiated",
        "platform": platform,
        "job_id": job_id
    }

@app.get("/api/protection/stats")
async def get_stats(topic: str = Query("All")):
    if topic == "All":
        multiplier = 1.0
    else:
        h = java_hash_code(topic)
        multiplier = (abs(h) % 100) / 50.0 + 0.5
        
    return {
        "total_monitored": f"{1.2 * multiplier:.1f}M",
        "high_risk_flags": int(154 * multiplier),
        "auto_takedowns": int(892 * multiplier),
        "ai_precision": f"99.{abs(java_hash_code(topic)) % 9}%"
    }

@app.get("/api/protection/detections")
async def get_detections(topic: str = Query("All")):
    risks = ["High", "Critical", "Medium", "Low"]
    platforms = ["YouTube", "Telegram", "Instagram", "Twitter / X", "Twitch", "Discord"]
    types = ["Full Stream", "Clips", "Live Feed", "Behind Scenes"]
    
    async with httpx.AsyncClient() as client:
        live_events = await fetch_live_event_names(client, topic)
        
    detections = []
    count = random.randint(3, 6) # 3 + rand.randint(4) in Java is 3 to 6
    
    for _ in range(count):
        risk = random.choice(risks)
        is_danger = risk in ["High", "Critical"]
        
        event_name = random.choice(live_events) if live_events else topic
        
        detections.append({
            "name": f"{event_name} — {random.choice(types)} #{random.randint(100, 999)}",
            "platform": random.choice(platforms),
            "risk": risk,
            "confidence": f"{85 + random.random() * 14:.1f}%",
            "danger": is_danger,
            "liveEvent": len(live_events) > 0
        })
        
    return detections

@app.get("/api/protection/takedowns")
async def get_takedowns(topic: str = Query("All")):
    platforms = ["YouTube", "Telegram", "Dailymotion", "Twitter / X", "Twitch", "Facebook"]
    file_types = ["MP4 Stream", "HLS Playlist", "Live Clip", "Full Broadcast", "Highlight Reel"]
    methods = ["DMCA Notice", "Auto-AI Flag", "Platform Report", "Rights API"]
    statuses = ["Confirmed", "Confirmed", "Pending", "Confirmed"]
    
    async with httpx.AsyncClient() as client:
        live_events = await fetch_live_event_names(client, topic)
        
    takedowns = []
    count = random.randint(4, 8) # 4 to 8 records
    
    for _ in range(count):
        event_name = random.choice(live_events) if live_events else topic
        platform = random.choice(platforms)
        file_type = random.choice(file_types)
        status = random.choice(statuses)
        views_before = random.randint(1000, 1000000)
        minutes_ago = random.randint(0, 89)
        
        takedowns.append({
            "title": f"{event_name} — Unauthorized {file_type}",
            "platform": platform,
            "fileType": file_type,
            "status": status,
            "views": f"{views_before:,}",
            "confidence": f"{88 + random.random() * 11:.1f}%",
            "method": random.choice(methods),
            "url": f"{platform.lower().replace(' / ', '')}.com/watch?v={hex(random.randint(0, 0xFFFFFFFF))[2:]}",
            "takenAt": "Just now" if minutes_ago == 0 else f"{minutes_ago}m ago",
            "eventSource": event_name if len(live_events) > 0 else "",
            # Store minutes_ago for sorting
            "_minutes_ago": minutes_ago
        })
        
    # Sort: newest first (lowest minutes ago)
    takedowns.sort(key=lambda x: x["_minutes_ago"])
    
    # Remove temporary sort key
    for td in takedowns:
        del td["_minutes_ago"]
        
    return takedowns

@app.get("/api/protection/trending")
async def get_trending():
    return [
        {"subject": "IPL Final Stream", "status": "Critical", "interest": "🔥 Trending"},
        {"subject": "F1 Monaco GP Cam", "status": "High Risk", "interest": "High"},
        {"subject": "Wimbledon Qualifiers", "status": "Monitoring", "interest": "Rising"},
        {"subject": "BWF Finals Hack", "status": "Flagged", "interest": "Medium"}
    ]

if __name__ == "__main__":
    uvicorn.run("main:app", host=HOST, port=PORT, reload=False)
