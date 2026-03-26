from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.config import get_settings
from app.database import engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup: verify db connection
    async with engine.begin() as conn:
        await conn.execute(text("SELECT 1"))
    yield
    # shutdown: dispose engine
    await engine.dispose()


app = FastAPI(
    title="PowerGrid API",
    description="Smart Energy Dashboard — ML-powered electricity consumption analytics",
    version="1.0.0",
    lifespan=lifespan,
)

settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Mount routers
from app.routers.auth import router as auth_router
from app.routers.profile import router as profile_router
from app.routers.consumption import router as consumption_router
from app.routers.billing import router as billing_router
from app.routers.comparison import router as comparison_router
from app.routers.gamification import router as gamification_router
from app.routers.websocket import router as ws_router

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(profile_router, prefix="/api/profile", tags=["profile"])
app.include_router(consumption_router, prefix="/api/consumption", tags=["consumption"])
app.include_router(billing_router, prefix="/api/billing", tags=["billing"])
app.include_router(comparison_router, prefix="/api/comparison", tags=["comparison"])
app.include_router(gamification_router, prefix="/api/gamification", tags=["gamification"])
app.include_router(ws_router, tags=["websocket"])


@app.get("/health")
async def health_check():
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "error", "database": str(e)}
