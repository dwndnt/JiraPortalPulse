
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from services.ticket_service import (
    get_dashboard_data,
    get_additional_dashboard_data,
    refresh_all
)
from services.sync_service import start_scheduler, stop_scheduler
from config import APP_HOST, APP_PORT

BASE = Path(__file__).resolve().parent
FRONTEND = BASE / "frontend"

app = FastAPI(
    title="PortalPulse",
    version="0.1.0"
)

# Static assets
app.mount(
    "/static",
    StaticFiles(directory=FRONTEND),
    name="static"
)

@app.on_event("startup")
def startup():
    start_scheduler()

@app.on_event("shutdown")
def shutdown():
    stop_scheduler()

@app.get("/")
def home():
    return FileResponse(FRONTEND / "index.html")

@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "application": "PortalPulse"
    }

@app.get("/api/dashboard")
def dashboard():
    return get_dashboard_data()

@app.get("/api/additional-dashboard")
def additional_dashboard(site: str = "ALL"):
    try:
        return get_additional_dashboard_data(site.upper())
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

@app.post("/api/refresh")
def refresh():
    try:
        return refresh_all()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app:app",
        host=APP_HOST,
        port=APP_PORT,
        reload=True
    )
