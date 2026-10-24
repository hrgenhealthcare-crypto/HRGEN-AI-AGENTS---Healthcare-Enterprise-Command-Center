"""
Production FastAPI Application Framework for Voice Webphone & Virtual VoIP DID/SIP Trunk Controller.
"""

import time
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.config import settings
from backend.routers.voice_webhook import router as voice_router
from backend.schemas.voice import HealthCheckResponse

# Setup structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s"
)
logger = logging.getLogger("voice_controller")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup sequence
    logger.info("Initializing PODS 2026 Voice Telephony Controller...")
    logger.info(f"Loaded config: Gemini Model={settings.GEMINI_MODEL}, Groq Model={settings.GROQ_WHISPER_MODEL}")
    logger.info(f"Brevity target: {settings.DEFAULT_BREVITY_MIN_WORDS}-{settings.DEFAULT_BREVITY_MAX_WORDS} words/turn")
    logger.info(f"Kokoro-82M TTS Endpoint: {settings.KOKORO_TTS_ENDPOINT}")
    logger.info(f"VoIP Escalation SIP URI: {settings.MANAGER_ESCALATION_SIP_URI}")
    yield
    # Shutdown sequence
    logger.info("Shutting down Voice Telephony Controller cleanly.")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Asynchronous core controller for Voice Webphones, VoIP DID trunks, Groq Whisper STT, Gemini Flash reasoning, and Kokoro-82M TTS.",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.perf_counter()
    response = await call_next(request)
    process_time = (time.perf_counter() - start_time) * 1000.0
    response.headers["X-Process-Time-Ms"] = f"{process_time:.2f}"
    return response


# Mount Voice Routers
app.include_router(voice_router)


@app.get("/health", response_model=HealthCheckResponse, tags=["Diagnostics"])
@app.get("/api/voice/health", response_model=HealthCheckResponse, tags=["Diagnostics"])
async def health_check():
    return HealthCheckResponse(
        status="healthy",
        app=settings.APP_NAME,
        version=settings.APP_VERSION,
        groq_whisper_configured=bool(settings.GROQ_API_KEY),
        gemini_flash_configured=bool(settings.GEMINI_API_KEY),
        kokoro_tts_configured=bool(settings.KOKORO_TTS_ENABLED)
    )


@app.get("/", tags=["Root"])
async def root():
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "webhook_endpoint": "/api/voice/webhook",
        "documentation": "/docs",
        "brevity_limit": f"{settings.DEFAULT_BREVITY_MIN_WORDS}-{settings.DEFAULT_BREVITY_MAX_WORDS} words",
        "status": "operational"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
