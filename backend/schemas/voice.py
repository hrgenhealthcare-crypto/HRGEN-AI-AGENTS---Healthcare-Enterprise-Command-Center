"""
Pydantic Schemas for Voice Webphone and Virtual VoIP DID/SIP Trunk routing pipelines.
"""

from enum import Enum
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field


class CallChannel(str, Enum):
    WEBPHONE = "Web"
    VOIP_SIP_TRUNK = "Voice"
    WHATSAPP_VOICE = "WhatsApp"
    PSTN_DID = "DID_Trunk"


class ActionType(str, Enum):
    SPEAK = "speak"
    TRANSFER_TO_MANAGER = "transfer_to_manager"
    HOLD = "hold"
    HANGUP = "hangup"


class VoiceModel(str, Enum):
    KORE = "Kore"
    FENRIR = "Fenrir"
    ZEPHYR = "Zephyr"
    PUCK = "Puck"
    AF_HEART = "af_heart"
    AF_BELLA = "af_bella"
    AM_ADAM = "am_adam"


class InboundTranscriptPayload(BaseModel):
    """
    Standard JSON payload from Virtual DID provider (Twilio, Telnyx, Plivo, Webphone client)
    """
    call_id: str = Field(..., description="Unique UUID or Telephony SID identifying the call session")
    caller_id: str = Field(default="Anonymous", description="Caller phone number (E.164) or WebRTC client ID")
    did_number: Optional[str] = Field(default=None, description="Inbound virtual DID number dialed by caller")
    tenant_id: str = Field(default="tenant_default_enterprise", description="Multi-tenant identifier")
    agent_pod_id: str = Field(default="pod_ritu_verma", description="Target Pod ID e.g. Dr. Ritu Verma, Rahul Sharma, etc.")
    transcript: str = Field(..., description="Raw text transcript of the caller's spoken turn")
    confidence: Optional[float] = Field(default=1.0, ge=0.0, le=1.0, description="ASR transcription confidence score")
    is_final: bool = Field(default=True, description="Whether this represents a completed utterance turn")
    channel_type: CallChannel = Field(default=CallChannel.VOIP_SIP_TRUNK, description="Call ingress channel")
    conversation_history: List[Dict[str, str]] = Field(default_factory=list, description="Prior conversation turns for context")
    custom_system_prompt: Optional[str] = Field(default=None, description="Dynamic database prompt override")
    brevity_min_words: Optional[int] = Field(default=15, description="Minimum brevity words limit")
    brevity_max_words: Optional[int] = Field(default=20, description="Strict maximum brevity words limit")


class ManagerHandoverPayload(BaseModel):
    """
    Configuration payload returned to telephony engine when escalating to a human manager.
    """
    action: ActionType = ActionType.TRANSFER_TO_MANAGER
    play_hold_chime: bool = True
    hold_message: str = "Please hold while I connect you with our senior supervisor."
    hold_audio_url: str
    department: str = "human_escalation"
    transfer_sip_uri: str = "sip:escalations@pbx.internal"
    reason: str = "User requested live human assistance"
    caller_metadata: Dict[str, Any] = Field(default_factory=dict)


class VoiceActionResponse(BaseModel):
    """
    Standardized response returned to the Voice Webphone or VoIP DID/SIP Trunk controller.
    """
    status: str = "success"
    call_id: str
    agent_pod_id: str
    action: ActionType
    spoken_text: str = Field(..., description="Conversational reply constrained to 15-20 words")
    word_count: int = Field(..., description="Calculated word count of spoken_text")
    within_brevity_limit: bool = True
    tts_audio_base64: Optional[str] = Field(default=None, description="Base64 encoded WAV/MP3 from Kokoro-82M")
    tts_format: str = "audio/wav"
    tts_sample_rate_hz: int = 24000
    handover_payload: Optional[ManagerHandoverPayload] = None
    latency_breakdown_ms: Dict[str, float] = Field(default_factory=dict)
    timestamp: str


class HealthCheckResponse(BaseModel):
    status: str = "healthy"
    app: str
    version: str
    groq_whisper_configured: bool
    gemini_flash_configured: bool
    kokoro_tts_configured: bool
