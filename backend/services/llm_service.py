"""
Google Gemini Reasoning Engine Integration Wrapper.
Uses official @google/genai SDK syntax with Gemini 1.5 Flash / 2.5 Flash.
Enforces dynamic system prompts from database pods and strict 15-20 words brevity limit.
"""

import time
import logging
import re
from typing import Tuple, List, Dict, Optional
from google import genai
from google.genai import types
from backend.config import settings

logger = logging.getLogger("voice_controller.llm")


# Default persona prompt fallback if not supplied dynamically by caller database
POD_PERSONA_PROMPTS: Dict[str, str] = {
    "pod_ritu_verma": "You are Dr. Ritu Verma, Senior Clinical AI & Healthcare Triage Lead. Calm, warm, clinical authority.",
    "pod_rahul_sharma": "You are Rahul Sharma, Enterprise Real Estate & High-Ticket Closing Specialist. High-energy, articulate, persuasive.",
    "pod_sophia_cloud": "You are Sophia Cloud, Global SaaS Operations & Cloud Architecture Copilot. Precise, technical, reassuring.",
    "pod_lucas_growth": "You are Lucas Growth, Performance Marketing & B2B Funnel Strategist. Data-driven, swift, ROI-focused.",
    "pod_swarn_agent": "You are Swarn Agent, Sovereign Gold, Jewelry & Luxury Asset Advisor. Luxurious, respectful, elite concierge tone.",
    "pod_boat_ai": "You are Boat AI, Marine Logistics & Maritime Charter Coordinator. Crisp, nautical, maritime clarity.",
    "pod_social_media": "You are Nexus Viral, Social Media & Content Momentum Engine. Trend-aware, snappy, magnetic.",
    "pod_google_web": "You are Orbit SEO, Google Ecosystem & Search Rank Authority. Analytical, strategic, optimization-oriented.",
    "pod_branding": "You are Aura Studio, Identity, Tone & Brand Equity Director. Visionary, inspiring, refined aesthetic.",
    "pod_graphic_designer": "You are Chroma Core, Creative Direction & UI/UX Synthesis Lead. Visual, agile, detail-focused."
}


def count_words(text: str) -> int:
    """Accurately count clean words in spoken response."""
    words = [w for w in re.split(r"\s+", text.strip()) if w]
    return len(words)


def enforce_word_limit(text: str, min_words: int = 15, max_words: int = 20) -> str:
    """
    Guardrail validator and trimmer to mathematically enforce a 15-20 word conversational turn.
    Removes markdown asterisks, hashes, and ensures clean phonetic speech cadence.
    """
    # Clean formatting
    cleaned = re.sub(r"[*_#`\[\]]", "", text).strip()
    words = [w for w in re.split(r"\s+", cleaned) if w]

    # If exceeding max words, truncate cleanly at a natural boundary or word 20
    if len(words) > max_words:
        truncated_words = words[:max_words]
        trimmed = " ".join(truncated_words)
        # Ensure punctuation ending
        if trimmed and trimmed[-1] not in ".!?":
            trimmed += "."
        return trimmed

    # If below min words, append a conversational confirmation to hit target cadence
    if len(words) < min_words:
        needed = min_words - len(words)
        padding_fillers = [
            "We are ready to guide you.",
            "Let us proceed with this right away.",
            "I am here to assist your team directly.",
            "Shall we confirm your details now?",
            "Everything is organized for your convenience today."
        ]
        for filler in padding_fillers:
            candidate = f"{cleaned} {filler}"
            c_words = [w for w in re.split(r"\s+", candidate) if w]
            if min_words <= len(c_words) <= max_words:
                return candidate
            elif len(c_words) > max_words:
                return " ".join(c_words[:max_words]) + "."

    return cleaned


class GeminiReasoningService:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        if self.api_key:
            self.client = genai.Client(api_key=self.api_key)
        else:
            self.client = None
            logger.warning("GEMINI_API_KEY is not configured. Operates with simulated reasoning fallback.")

    async def generate_voice_response(
        self,
        transcript: str,
        agent_pod_id: str = "pod_ritu_verma",
        custom_system_prompt: Optional[str] = None,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        min_words: int = 15,
        max_words: int = 20
    ) -> Tuple[str, int, float]:
        """
        Executes contextual model reasoning using Google Gemini 1.5 Flash.
        Strictly enforces 15-20 words brevity constraint.
        Returns:
            Tuple[spoken_text: str, word_count: int, latency_ms: float]
        """
        start_time = time.perf_counter()
        
        # Base pod persona
        pod_persona = custom_system_prompt or POD_PERSONA_PROMPTS.get(
            agent_pod_id,
            "You are an enterprise voice AI assistant representing our operations team."
        )

        # Strict conversational brevity instruction
        system_instruction = (
            f"{pod_persona}\n\n"
            "CRITICAL VOICE CALL DIRECTIVE:\n"
            "1. You are actively speaking on a real-time telephone line.\n"
            "2. You MUST speak in natural, fluid sentences totaling strictly 15 to 20 words.\n"
            "3. DO NOT use markdown, bullet points, asterisks, or numbered lists.\n"
            "4. Be confident, warm, and directly address the user's latest statement."
        )

        # Assemble conversation context
        formatted_prompt = f"Customer just said: \"{transcript}\"\nRespond now in strictly 15 to 20 words for the telephone audio channel."

        if not self.client:
            # Standalone fallback if key is not mounted
            fallback_text = "I have recorded your request in full detail and will confirm the schedule with you immediately."
            calibrated = enforce_word_limit(fallback_text, min_words, max_words)
            latency_ms = (time.perf_counter() - start_time) * 1000.0
            return calibrated, count_words(calibrated), latency_ms

        try:
            # Official Google GenAI SDK syntax
            response = self.client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=formatted_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.3,
                    max_output_tokens=70  # Low token ceiling to enforce short turns
                )
            )

            raw_text = response.text.strip() if response.text else "Thank you for reaching out. Let me update your file and connect your account."
            calibrated_text = enforce_word_limit(raw_text, min_words, max_words)
            w_count = count_words(calibrated_text)
            latency_ms = (time.perf_counter() - start_time) * 1000.0

            logger.info(f"Gemini {settings.GEMINI_MODEL} generated {w_count} words in {latency_ms:.2f}ms: '{calibrated_text}'")
            return calibrated_text, w_count, latency_ms

        except Exception as e:
            latency_ms = (time.perf_counter() - start_time) * 1000.0
            logger.error(f"Gemini generation error after {latency_ms:.2f}ms: {str(e)}")
            fallback_text = "Thank you for providing those details. I will arrange our senior advisor to contact you today."
            calibrated = enforce_word_limit(fallback_text, min_words, max_words)
            return calibrated, count_words(calibrated), latency_ms


gemini_service = GeminiReasoningService()
