"""
Kokoro-82M Localized Self-Hosted TTS Routing Pipeline.
Provides an asynchronous routing function connecting to a self-hosted Kokoro-82M TTS engine
(82M parameter multi-lingual neural TTS, 24kHz sampling rate, sub-100ms first-chunk audio).
"""

import time
import base64
import logging
from typing import Tuple, Optional, Dict, Any
import httpx
from backend.config import settings

logger = logging.getLogger("voice_controller.tts")

# Voice profile mapping from Agent Pod configuration to Kokoro-82M voice weights
VOICE_MODEL_MAP = {
    "Kore": "af_heart",       # Warm, professional female
    "Fenrir": "am_adam",      # Deep, authoritative male
    "Zephyr": "af_bella",     # Energetic, modern female
    "Puck": "am_michael",     # Casual, tech-savvy male
    "af_heart": "af_heart",
    "af_bella": "af_bella",
    "am_adam": "am_adam"
}


class KokoroTTSService:
    def __init__(self, endpoint: Optional[str] = None):
        self.endpoint = endpoint or settings.KOKORO_TTS_ENDPOINT
        self.default_voice = settings.KOKORO_DEFAULT_VOICE
        self.enabled = settings.KOKORO_TTS_ENABLED

    async def synthesize_speech(
        self,
        text: str,
        voice_id: str = "Kore",
        speed: float = 1.05,
        audio_format: str = "wav"
    ) -> Tuple[Optional[str], float, Dict[str, Any]]:
        """
        Synthesizes speech using the localized Kokoro-82M TTS engine.
        Returns:
            Tuple[base64_audio: Optional[str], latency_ms: float, metadata: Dict[str, Any]]
        """
        start_time = time.perf_counter()
        kokoro_voice = VOICE_MODEL_MAP.get(voice_id, self.default_voice)

        metadata: Dict[str, Any] = {
            "engine": "Kokoro-82M-Local",
            "voice": kokoro_voice,
            "sample_rate_hz": 24000,
            "speed": speed,
            "format": audio_format,
            "char_count": len(text)
        }

        if not self.enabled:
            latency_ms = (time.perf_counter() - start_time) * 1000.0
            logger.info("Kokoro-82M TTS synthesis disabled in settings; returning synthesized text manifest.")
            return None, latency_ms, metadata

        # Attempt to reach local Kokoro-82M daemon (FastAPI/ONNX wrapper on port 8880 or custom port)
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                payload = {
                    "model": "kokoro-82m",
                    "input": text,
                    "voice": kokoro_voice,
                    "response_format": audio_format,
                    "speed": speed
                }
                
                response = await client.post(self.endpoint, json=payload)
                
                if response.status_code == 200:
                    audio_bytes = response.content
                    encoded_b64 = base64.b64encode(audio_bytes).decode("utf-8")
                    latency_ms = (time.perf_counter() - start_time) * 1000.0
                    metadata["size_bytes"] = len(audio_bytes)
                    logger.info(f"Kokoro-82M synthesized {len(text)} chars into {len(audio_bytes)} bytes in {latency_ms:.2f}ms")
                    return encoded_b64, latency_ms, metadata
                else:
                    logger.warning(f"Kokoro-82M server returned HTTP {response.status_code}: {response.text}")

        except (httpx.ConnectError, httpx.TimeoutException) as conn_err:
            # When Kokoro daemon is offline or in cold startup, route through localized fallback
            logger.info(f"Kokoro-82M local endpoint ({self.endpoint}) not actively responding ({conn_err.__class__.__name__}). Using simulated telephony carrier signaling.")

        except Exception as e:
            logger.error(f"Unexpected error calling Kokoro TTS: {str(e)}")

        latency_ms = (time.perf_counter() - start_time) * 1000.0
        # Return structured metadata with placeholder audio payload indicator for telephony engine
        metadata["simulated"] = True
        return None, latency_ms, metadata


kokoro_tts_service = KokoroTTSService()
