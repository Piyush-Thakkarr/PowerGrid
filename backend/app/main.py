import logging
import time
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy import text
from starlette.middleware.sessions import SessionMiddleware

from app.config import get_settings
from app.database import engine

settings = get_settings()

# ── Structured logging ──────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("powergrid")


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.execute(text("SELECT 1"))
    logger.info("Database connected, server starting")
    yield
    await engine.dispose()
    logger.info("Server shutdown complete")


app = FastAPI(
    title="PowerGrid API",
    description="Smart Energy Dashboard — ML-powered electricity consumption analytics",
    version="2.0.0",
    lifespan=lifespan,
)

# ── Middleware ───────────────────────────────────────
app.add_middleware(SessionMiddleware, secret_key=settings.session_secret or settings.supabase_jwt_secret)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Rate limiting ───────────────────────────────────
try:
    from slowapi import Limiter, _rate_limit_exceeded_handler
    from slowapi.util import get_remote_address
    from slowapi.errors import RateLimitExceeded

    limiter = Limiter(key_func=get_remote_address)
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
except ImportError:
    logger.warning("slowapi not installed — rate limiting disabled")
    limiter = None


# ── Request logging + timing ────────────────────────
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    response: Response = await call_next(request)
    duration = round((time.time() - start) * 1000, 1)

    if not request.url.path.startswith(("/assets", "/favicon")):
        logger.info(
            "%s %s %s %sms user=%s",
            request.method,
            request.url.path,
            response.status_code,
            duration,
            request.headers.get("x-user-id", "-"),
        )

    response.headers["X-Response-Time"] = f"{duration}ms"
    return response


# ── Global exception handler ────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled error on %s %s: %s", request.method, request.url.path, exc, exc_info=True)
    return JSONResponse({"detail": "Internal server error"}, status_code=500)


# ── Admin panel (optional) ──────────────────────────
try:
    from sqlalchemy import create_engine as create_sync_engine
    from app.admin import setup_admin
    sync_engine = create_sync_engine(settings.sync_database_url)
    setup_admin(app, sync_engine)
except Exception as e:
    logger.warning("Admin panel disabled: %s", e)


# ── Mount routers ───────────────────────────────────
from app.routers.auth import router as auth_router
from app.routers.consumption import router as consumption_router
from app.routers.billing import router as billing_router
from app.routers.comparison import router as comparison_router
from app.routers.gamification import router as gamification_router
from app.routers.ml import router as ml_router
from app.routers.dashboard import router as dashboard_router
from app.routers.discom import router as discom_router
from app.routers.government import router as government_router
from app.routers.grid import router as grid_router

app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(consumption_router, prefix="/api/v1/consumption", tags=["consumption"])
app.include_router(billing_router, prefix="/api/v1/billing", tags=["billing"])
app.include_router(comparison_router, prefix="/api/v1/comparison", tags=["comparison"])
app.include_router(gamification_router, prefix="/api/v1/gamification", tags=["gamification"])
app.include_router(ml_router, prefix="/api/v1/ml", tags=["ml"])
app.include_router(dashboard_router, prefix="/api/v1/dashboard", tags=["dashboard"])
app.include_router(discom_router, prefix="/api/v1/discom", tags=["discom"])
app.include_router(government_router, prefix="/api/v1/government", tags=["government"])
app.include_router(grid_router, prefix="/api/v1/grid", tags=["grid"])

# Backwards compat — old /api/ routes still work
app.include_router(auth_router, prefix="/api/auth", tags=["auth"], include_in_schema=False)
app.include_router(consumption_router, prefix="/api/consumption", tags=["consumption"], include_in_schema=False)
app.include_router(billing_router, prefix="/api/billing", tags=["billing"], include_in_schema=False)
app.include_router(comparison_router, prefix="/api/comparison", tags=["comparison"], include_in_schema=False)
app.include_router(gamification_router, prefix="/api/gamification", tags=["gamification"], include_in_schema=False)
app.include_router(ml_router, prefix="/api/ml", tags=["ml"], include_in_schema=False)
app.include_router(dashboard_router, prefix="/api/dashboard", tags=["dashboard"], include_in_schema=False)
app.include_router(discom_router, prefix="/api/discom", tags=["discom"], include_in_schema=False)
app.include_router(government_router, prefix="/api/government", tags=["government"], include_in_schema=False)
app.include_router(grid_router, prefix="/api/grid", tags=["grid"], include_in_schema=False)


# ── Backward compat: old /api/profile → /api/auth/profile ──
from app.routers.auth import get_current_user as _get_user
from app.database import get_db as _get_db

@app.get("/api/profile")
async def _compat_get_profile(user=Depends(_get_user), db=Depends(_get_db)):
    from app.routers.auth import get_profile
    return await get_profile(user=user, db=db)

@app.put("/api/profile")
async def _compat_put_profile(body: dict, user=Depends(_get_user), db=Depends(_get_db)):
    from app.schemas import ProfileUpdateRequest
    from app.routers.auth import update_profile
    return await update_profile(body=ProfileUpdateRequest(**body), user=user, db=db)


# ── Health + cache stats ────────────────────────────
@app.get("/health")
async def health_check():
    from app.services.ml_cache import cache_stats
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected", "cache": cache_stats()}
    except Exception as e:
        return JSONResponse({"status": "error", "database": str(e)}, status_code=503)


# ── Serve React frontend ───────────────────────────
STATIC_DIR = Path(__file__).parent.parent / "static"
if STATIC_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(STATIC_DIR / "assets")), name="assets")

    @app.get("/{path:path}")
    async def serve_spa(path: str):
        if path.startswith("api/"):
            return JSONResponse({"detail": "Not found"}, status_code=404)
        file_path = STATIC_DIR / path
        if file_path.exists() and file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(STATIC_DIR / "index.html"))
