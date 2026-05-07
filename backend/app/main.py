import logging
import time
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

from app.config import get_settings
from app.database import close as close_db

settings = get_settings()

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger("powergrid")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Server starting")
    yield
    await close_db()
    logger.info("Server shutdown")


app = FastAPI(title="PowerGrid API", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    response: Response = await call_next(request)
    duration = round((time.time() - start) * 1000, 1)
    if not request.url.path.startswith(("/assets", "/favicon")):
        logger.info("%s %s %s %sms", request.method, request.url.path, response.status_code, duration)
    response.headers["X-Response-Time"] = f"{duration}ms"
    return response


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled error on %s %s: %s", request.method, request.url.path, exc, exc_info=True)
    return JSONResponse({"detail": "Internal server error"}, status_code=500)


# ── Routers ─────────────────────────────────────────
from app.routers.auth import router as auth_router
from app.routers.consumption import router as consumption_router
from app.routers.ml import router as ml_router
from app.routers.dashboard import router as dashboard_router
from app.routers.discom import router as discom_router
from app.routers.government import router as government_router
from app.routers.grid import router as grid_router

for prefix, rtr, tag in [
    ("/api/v1/auth", auth_router, "auth"),
    ("/api/v1/consumption", consumption_router, "consumption"),
    ("/api/v1/ml", ml_router, "ml"),
    ("/api/v1/dashboard", dashboard_router, "dashboard"),
    ("/api/v1/discom", discom_router, "discom"),
    ("/api/v1/government", government_router, "government"),
    ("/api/v1/grid", grid_router, "grid"),
]:
    app.include_router(rtr, prefix=prefix, tags=[tag])
    app.include_router(rtr, prefix=prefix.replace("/v1", ""), tags=[tag], include_in_schema=False)


@app.get("/health")
async def health_check():
    from app.services.ml_cache import cache_stats
    from app.database import fetchval
    try:
        await fetchval("SELECT 1")
        return {"status": "ok", "database": "connected", "cache": cache_stats()}
    except Exception as e:
        return JSONResponse({"status": "error", "database": str(e)}, status_code=503)


STATIC_DIR = Path(__file__).parent.parent / "static"
if STATIC_DIR.exists():
    from fastapi.staticfiles import StaticFiles
    app.mount("/assets", StaticFiles(directory=str(STATIC_DIR / "assets")), name="assets")

    @app.get("/{path:path}")
    async def serve_spa(path: str):
        if path.startswith("api/"):
            return JSONResponse({"detail": "Not found"}, status_code=404)
        file_path = STATIC_DIR / path
        if file_path.exists() and file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(STATIC_DIR / "index.html"))
