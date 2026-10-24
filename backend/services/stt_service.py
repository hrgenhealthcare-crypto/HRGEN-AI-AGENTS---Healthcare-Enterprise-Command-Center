"""
Groq Whisper API Speech-to-Text (STT) Integration Wrapper.
Uses official Groq SDK syntax with whisper-large-v3 for near-zero latency streaming audio transcription.
"""

import io
import time
import logging
from typing import Tuple, Optional
from groq import AsyncGroq
from backend.config import settings

logger = logging.getLogger("voice_controller.stt")


class GroqWhisperService:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.GROQ_API_KEY
        if self.api_key:
            self.client = AsyncGroq(api_key=self.api_key)
        else:
            self.client = None
            logger.warning("GROQ_API_KEY is not configured. Direct audio file transcription will require an API key.")

    async def transcribe_audio_bytes(
        self,
        audio_bytes: bytes,
        filename: str = "audio_chunk.wav",
        language: str = "en",
        prompt: Optional[str] = "Live telephone call with enterprise AI agent"
    ) -> Tuple[str, float]:
        """
        Transcribes raw audio bytes using Groq whisper-large-v3.
        Returns:
            Tuple[transcription_text: str, duration_ms: float]
        """
        start_time = time.perf_counter()
        
        if not self.client:
            # Fallback mock transcript if no key provided in sandbox
            logger.info("Operating in mock mode for Groq Whisper (no API key provided).")
            return "Hello, I would like to check on our recent service proposal.", 12.5

        try:
            # Create a file-like object in memory with the given filename extension
            audio_buffer = io.BytesIO(audio_bytes)
            audio_buffer.name = filename

            transcription = await self.client.audio.transcriptions.create(
                file=(filename, audio_buffer),
                model=settings.GROQ_WHISPER_MODEL,
                language=language,
                prompt=prompt,
                response_format="verbose_json",
                temperature=0.0
            )

            latency_ms = (time.perf_counter() - start_time) * 1000.0
            transcribed_text = transcription.text.strip()
            logger.info(f"Groq Whisper transcribed {len(audio_bytes)} bytes in {latency_ms:.2f}ms: '{transcribed_text}'")
            return transcribed_text, latency_ms

        except Exception as e:
            latency_ms = (time.perf_counter() - start_time) * 1000.0
            logger.error(f"Groq Whisper transcription failed after {latency_ms:.2f}ms: {str(e)}")
            raise RuntimeError(f"Whisper STT failure: {str(e)}") from e


# Singleton instance
groq_stt_service = GroqWhisperService()
