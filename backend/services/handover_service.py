"""
Human Escalation and Call Handover Service.
Evaluates customer intent to detect requests for human assistance, supervisor escalation,
and generates clean JSON payloads configured for standard VoIP hold triggers and SIP REFER.
"""

import re
import logging
from typing import Optional, Tuple, Dict, Any
from backend.config import settings
from backend.schemas.voice import ActionType, ManagerHandoverPayload

logger = logging.getLogger("voice_controller.handover")

# Comprehensive keyword triggers for human manager transfer
ESCALATION_KEYWORDS = [
    r"\b(talk|speak|connect)\s+(to|with)\s+(a\s+)?(human|person|agent|representative|manager|supervisor|operator)\b",
    r"\b(transfer|escalate)\s+(me|this\s+call)\b",
    r"\b(give\s+me|need)\s+(a\s+)?(manager|supervisor|real\s+person)\b",
    r"\b(i\s+want\s+a\s+human)\b",
    r"\b(customer\s+support\s+executive)\b",
    r"\b(live\s+agent)\b",
    r"\b(human\s+being)\b",
    r"\b(file\s+a\s+complaint)\b",
    r"\b(not\s+an\s+ai|not\s+a\s+robot|stop\s+bot)\b"
]


class HandoverService:
    def __init__(self):
        self.compiled_patterns = [re.compile(pattern, re.IGNORECASE) for pattern in ESCALATION_KEYWORDS]

    def detect_escalation_intent(self, transcript: str) -> Tuple[bool, Optional[str]]:
        """
        Scans caller transcript for explicit requests for human escalation.
        Returns:
            Tuple[is_escalation: bool, matched_intent: Optional[str]]
        """
        cleaned = transcript.strip().lower()
        for pattern in self.compiled_patterns:
            match = pattern.search(cleaned)
            if match:
                matched_phrase = match.group(0)
                logger.info(f"Human escalation intent triggered on phrase: '{matched_phrase}'")
                return True, f"Triggered by phrase: '{matched_phrase}'"
        return False, None

    def create_manager_handover_payload(
        self,
        call_id: str,
        caller_id: str,
        agent_pod_id: str,
        reason: str,
        caller_metadata: Optional[Dict[str, Any]] = None
    ) -> ManagerHandoverPayload:
        """
        Constructs the production-ready JSON handover configuration payload
        to trigger PBX/DID SIP trunk hold and refer mechanics.
        """
        payload = ManagerHandoverPayload(
            action=ActionType.TRANSFER_TO_MANAGER,
            play_hold_chime=True,
            hold_message="Please hold for a moment while I transfer you to our senior duty manager.",
            hold_audio_url=settings.HOLD_CHIME_AUDIO_URL,
            department="human_escalation",
            transfer_sip_uri=settings.MANAGER_ESCALATION_SIP_URI,
            reason=reason,
            caller_metadata={
                "call_id": call_id,
                "caller_id": caller_id,
                "agent_pod_origin": agent_pod_id,
                "hold_chime_enabled": True,
                "pbx_transfer_protocol": "SIP_REFER",
                **(caller_metadata or {})
            }
        )
        logger.info(f"Generated Manager Handover JSON configuration for call_id {call_id}: SIP URI {payload.transfer_sip_uri}")
        return payload


handover_service = HandoverService()
