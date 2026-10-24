# PODS 2026 - Voice & VoIP DID/SIP Trunk Controller (FastAPI)

Production asynchronous FastAPI microservice framework acting as the core telephony controller for:
- Browser **Voice Webphones** (WebRTC / streaming audio chunks)
- Virtual **VoIP DID/SIP Trunks** (Twilio Voice, Telnyx TeXML, Plivo, FreeSWITCH, Asterisk)
- Low-latency **Groq Whisper API** STT wrapper (`whisper-large-v3`)
- **Google Gemini 1.5/2.5 Flash** contextual reasoning engine with dynamic pod personas
- Strict **15–20 words brevity constraint** per conversational turn
- **Kokoro-82M** localized self-hosted neural TTS routing pipeline (24kHz)
- Automated **Human Manager Handover** with standard hold chime triggers and SIP REFER payloads

---

## 🚀 Quickstart

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Environment Variables
Create or verify `.env` in the root:
```env
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here
KOKORO_TTS_ENDPOINT=http://127.0.0.1:8880/v1/audio/speech
KOKORO_TTS_ENABLED=true
MANAGER_ESCALATION_SIP_URI=sip:escalations@pbx.internal
```

### 3. Launch Development Server
```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
Interactive API docs will be available at `http://localhost:8000/docs`.

---

## 📡 Webhook Specification: `POST /api/voice/webhook`

### A. JSON Ingestion (Twilio/Telnyx/Webphone Transcripts)
```bash
curl -X POST "http://localhost:8000/api/voice/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "call_id": "call_9847289410",
    "caller_id": "+14155552671",
    "agent_pod_id": "pod_ritu_verma",
    "transcript": "Hello, I want to book an appointment with Dr. Verma for tomorrow afternoon.",
    "channel_type": "Voice",
    "brevity_min_words": 15,
    "brevity_max_words": 20
  }'
```

**Standard Response (15-20 words, Action: `speak`)**:
```json
{
  "status": "success",
  "call_id": "call_9847289410",
  "agent_pod_id": "pod_ritu_verma",
  "action": "speak",
  "spoken_text": "I can certainly reserve tomorrow afternoon for you. Which time window suits your clinical consultation best today?",
  "word_count": 17,
  "within_brevity_limit": true,
  "tts_audio_base64": null,
  "handover_payload": null,
  "latency_breakdown_ms": {
    "gemini_flash_llm_ms": 320.4,
    "kokoro_tts_ms": 48.1,
    "total_roundtrip_ms": 369.2
  },
  "timestamp": "2026-10-23T22:50:00Z"
}
```

---

### B. Human Manager Handover Trigger (Customer Requests Supervisor)
```bash
curl -X POST "http://localhost:8000/api/voice/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "call_id": "call_9847289410",
    "caller_id": "+14155552671",
    "agent_pod_id": "pod_rahul_sharma",
    "transcript": "I am not satisfied with this quotation. Please transfer me to a human manager immediately.",
    "channel_type": "Voice"
  }'
```

**Handover Response with Hold Trigger & SIP URI**:
```json
{
  "status": "success",
  "call_id": "call_9847289410",
  "agent_pod_id": "pod_rahul_sharma",
  "action": "transfer_to_manager",
  "spoken_text": "I am transferring you to our senior supervisor now. Please stay on the line while we connect.",
  "word_count": 17,
  "within_brevity_limit": true,
  "handover_payload": {
    "action": "transfer_to_manager",
    "play_hold_chime": true,
    "hold_message": "Please hold for a moment while I transfer you to our senior duty manager.",
    "hold_audio_url": "https://assets.pods2026.internal/audio/chimes/gentle_hold_bell.mp3",
    "department": "human_escalation",
    "transfer_sip_uri": "sip:escalations@pbx.internal",
    "reason": "Triggered by phrase: 'transfer me to a human manager'",
    "caller_metadata": {
      "call_id": "call_9847289410",
      "caller_id": "+14155552671",
      "agent_pod_origin": "pod_rahul_sharma",
      "pbx_transfer_protocol": "SIP_REFER"
    }
  }
}
```

---

### C. Multipart Audio Upload (Groq Whisper STT)
```bash
curl -X POST "http://localhost:8000/api/voice/webhook" \
  -F "audio_file=@caller_sample.wav;type=audio/wav" \
  -F "call_id=call_chunk_552" \
  -F "agent_pod_id=pod_lucas_growth"
```
Transcribes the audio stream chunk via Groq Whisper (`whisper-large-v3`), routes through Gemini Flash reasoning, and returns the Kokoro-82M audio synthesis stream.
