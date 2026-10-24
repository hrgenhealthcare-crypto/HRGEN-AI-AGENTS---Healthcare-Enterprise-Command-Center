"""
Configuration module for the Voice Webphone and VoIP DID/SIP Trunk Controller.
Uses Pydantic BaseSettings to read environment variables with secure defaults.
"""

from typing import List, Optional
import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Application Config
    APP_NAME: str = "PODS 2026 Voice & VoIP Controller"
    APP_VERSION: str = "2.6.0"
    ENVIRONMENT: str = "production"
    DEBUG: bool = False
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://ais-dev-vn7bfdpbqzkbflsu76ppob-488198938105.asia-southeast1.run.app",
        "https://ais-pre-vn7bfdpbqzkbflsu76ppob-488198938105.asia-southeast1.run.app",
        "*"
    ]
    
    # Google Gemini AI Config
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = "gemini-3.8-flash"  # Supports gemini-3.8-flash or gemini-2.5-flash
    
    # Groq Whisper STT Config
    GROQ_API_KEY: Optional[str] = os.getenv("GROQ_API_KEY", "")
    GROQ_WHISPER_MODEL: str = "whisper-large-v3"
    
    # Self-Hosted Kokoro-82M TTS Engine Config
    KOKORO_TTS_ENABLED: bool = True
    KOKORO_TTS_ENDPOINT: str = os.getenv("KOKORO_TTS_ENDPOINT", "http://127.0.0.1:8880/v1/audio/speech")
    KOKORO_DEFAULT_VOICE: str = "af_heart"  # Kokoro 82M high-fidelity voice checkpoint
    
    # Strict Brevity Constraint per Conversational Turn
    DEFAULT_BREVITY_MIN_WORDS: int = 15
    DEFAULT_BREVITY_MAX_WORDS: int = 20
    
    # VoIP PBX / DID SIP Trunk Handover Config
    MANAGER_ESCALATION_SIP_URI: str = "sip:escalations@pbx.internal"
    HOLD_CHIME_AUDIO_URL: str = "https://assets.pods2026.internal/audio/chimes/gentle_hold_bell.mp3"
    DEFAULT_TENANT_ID: str = "tenant_default_enterprise"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
