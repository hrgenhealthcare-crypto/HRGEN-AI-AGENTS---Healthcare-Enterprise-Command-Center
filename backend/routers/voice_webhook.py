"""
Voice Webhook Router.
Implements the core '/api/voice/webhook' controller supporting dual ingestion:
1. Application/JSON payloads (real-time streaming transcripts from virtual number providers).
2. Multipart/Form-Data payloads (raw audio chunk uploads from browser Webphone or SIP media proxies).

Orchestrates:
- Groq Whisper STT (if raw audio provided)
- Human Escalation Detection (standard hold trigger + SIP transfer)
- Google Gemini 1.5/2.5 Flash reasoning (dynamic DB prompt + 15-20 words brevity)
- Kokoro-82M localized TTS synthesis
"""

import time
import logging
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Request, UploadFile, File, Form, HTTPException, status
from fastapi.responses import JSONResponse

from backend.schemas.voice import (
    InboundTranscriptPayload,
    VoiceActionResponse,
    ActionType,
    CallChannel
)
from backend.services.stt_service import groq_stt_service
from backend.services.llm_service import gemini_service, count_words
from backend.services.handover_service import handover_service
from backend.services.tts_service import kokoro_tts_service

logger = logging.getLogger("voice_controller.webhook")

router = APIRouter(prefix="/api/voice", tags=["Voice Telephony Pipeline"])


@router.post(
    "/webhook",
    response_model=VoiceActionResponse,
    summary="Process Inbound Voice Transcript or Audio Stream",
    description="Primary webhook for virtual VoIP DID/SIP trunks (Twilio/Telnyx) and browser Voice Webphone."
)
async def voice_webhook(
    request: Request,
    # Optional multipart fields for raw audio ingestion
    audio_file: Optional[UploadFile] = File(default=None),
    call_id: Optional[str] = Form(default=None),
    caller_id: Optional[str] = Form(default="Anonymous"),
    agent_pod_id: Optional[str] = Form(default="pod_ritu_verma"),
    did_number: Optional[str] = Form(default=None),
    custom_system_prompt: Optional[str] = Form(default=None),
    brevity_min_words: Optional[int] = Form(default=15),
    brevity_max_words: Optional[int] = Form(default=20)
):
    """
    Dual-mode ingress router:
    - If Content-Type is 'application/json', parses InboundTranscriptPayload.
    - If Content-Type is 'multipart/form-data', reads audio_file and transcribes via Groq Whisper.
    """
    total_start = time.perf_counter()
    latency_breakdown = {}

    content_type = request.headers.get("content-type", "").lower()
    
    # 1. Normalize Inbound Payload (Audio vs. JSON)
    active_call_id = call_id or f"call_{int(time.time()*1000)}"
    active_caller = caller_id or "Anonymous"
    active_pod = agent_pod_id or "pod_ritu_verma"
    prompt_override = custom_system_prompt
    min_words = brevity_min_words or 15
    max_words = brevity_max_words or 20
    transcript_text = ""

    try:
        if "multipart/form-data" in content_type and audio_file:
            # Mode A: Raw Audio Ingestion
            logger.info(f"Received raw audio upload '{audio_file.filename}' for call {active_call_id}")
            audio_bytes = await audio_file.read()
            if not audio_bytes:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty audio file uploaded")
            
            # STT via Groq Whisper
            transcript_text, stt_latency = await groq_stt_service.transcribe_audio_bytes(
                audio_bytes=audio_bytes,
                filename=audio_file.filename or "chunk.wav"
            )
            latency_breakdown["groq_whisper_stt_ms"] = round(stt_latency, 2)

        elif "application/json" in content_type:
            # Mode B: JSON Transcript Ingestion
            body_json = await request.json()
            payload = InboundTranscriptPayload(**body_json)
            active_call_id = payload.call_id
            active_caller = payload.caller_id
            active_pod = payload.agent_pod_id
            transcript_text = payload.transcript.strip()
            prompt_override = payload.custom_system_prompt
            min_words = payload.brevity_min_words or 15
            max_words = payload.brevity_max_words or 20
            logger.info(f"Received JSON transcript for call {active_call_id}: '{transcript_text}'")

        else:
            # Fallback parsing attempt
            try:
                body_json = await request.json()
                transcript_text = body_json.get("transcript", "")
                active_call_id = body_json.get("call_id", active_call_id)
            except Exception:
                raise HTTPException(
                    status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                    detail="Endpoint accepts either 'application/json' or 'multipart/form-data' with an audio_file."
                )

        if not transcript_text:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No transcript or spoken text provided")

        # 2. Check for Human Escalation / Manager Handover Intent
        is_escalation, reason = handover_service.detect_escalation_intent(transcript_text)
        
        if is_escalation:
            # Human Transfer Path
            handover_payload = handover_service.create_manager_handover_payload(
                call_id=active_call_id,
                caller_id=active_caller,
                agent_pod_id=active_pod,
                reason=reason or "Customer requested human supervisor"
            )

            # Hold announcement speech (strictly 15-20 words)
            spoken_hold = "I am transferring you to our senior supervisor now. Please stay on the line while we connect."
            w_count = count_words(spoken_hold)
            
            # Localized Kokoro TTS synthesis for the hold prompt
            tts_b64, tts_ms, _ = await kokoro_tts_service.synthesize_speech(spoken_hold)
            latency_breakdown["kokoro_tts_ms"] = round(tts_ms, 2)
            latency_breakdown["total_roundtrip_ms"] = round((time.perf_counter() - total_start) * 1000.0, 2)

            return VoiceActionResponse(
                status="success",
                call_id=active_call_id,
                agent_pod_id=active_pod,
                action=ActionType.TRANSFER_TO_MANAGER,
                spoken_text=spoken_hold,
                word_count=w_count,
                within_brevity_limit=(min_words <= w_count <= max_words),
                tts_audio_base64=tts_b64,
                handover_payload=handover_payload,
                latency_breakdown_ms=latency_breakdown,
                timestamp=datetime.now(timezone.utc).isoformat()
            )

        # 3. Standard Conversational Turn: Google Gemini Flash Reasoning
        spoken_reply, w_count, llm_ms = await gemini_service.generate_voice_response(
            transcript=transcript_text,
            agent_pod_id=active_pod,
            custom_system_prompt=prompt_override,
            min_words=min_words,
            max_words=max_words
        )
        latency_breakdown["gemini_flash_llm_ms"] = round(llm_ms, 2)

        # 4. Kokoro-82M TTS Audio Synthesis
        tts_b64, tts_ms, _ = await kokoro_tts_service.synthesize_speech(spoken_reply)
        latency_breakdown["kokoro_tts_ms"] = round(tts_ms, 2)

        total_elapsed_ms = (time.perf_counter() - total_start) * 1000.0
        latency_breakdown["total_roundtrip_ms"] = round(total_elapsed_ms, 2)

        return VoiceActionResponse(
            status="success",
            call_id=active_call_id,
            agent_pod_id=active_pod,
            action=ActionType.SPEAK,
            spoken_text=spoken_reply,
            word_count=w_count,
            within_brevity_limit=(min_words <= w_count <= max_words),
            tts_audio_base64=tts_b64,
            handover_payload=None,
            latency_breakdown_ms=latency_breakdown,
            timestamp=datetime.now(timezone.utc).isoformat()
        )

    except HTTPException:
        raise
    except Exception as exc:
        total_elapsed_ms = (time.perf_counter() - total_start) * 1000.0
        logger.exception(f"Unhandled error in voice_webhook: {str(exc)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "status": "error",
                "call_id": active_call_id,
                "error": str(exc),
                "total_elapsed_ms": round(total_elapsed_ms, 2)
            }
        )
