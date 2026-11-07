"""Strict, dependency-free ASGI ingress gate for the HRGen FastAPI voice webhook.

This authorizes only a trusted upstream server/gateway using a private shared
secret. It does NOT validate Twilio/Telnyx signatures or provide browser auth.
Those providers must authenticate at the upstream ingress separately.
"""
import hmac
import json
from typing import Callable, Awaitable

VOICE_PATH = "/api/voice/webhook"
SECRET_HEADER = b"x-hrgen-webhook-secret"
SUPPORTED_TYPES = frozenset((b"application/json", b"multipart/form-data"))


class VoiceIngressGuard:
    def __init__(
        self,
        app,
        shared_secret: str = "",
        max_request_bytes: int = 10 * 1024 * 1024 + 65536,
        max_json_bytes: int = 65536,
    ):
        self.app = app
        self.shared_secret = shared_secret
        self.max_request_bytes = max_request_bytes
        self.max_json_bytes = max_json_bytes

    @staticmethod
    async def _reject(send, code: int, reason: str):
        data = json.dumps({"detail": reason}).encode("utf-8")
        await send({
            "type": "http.response.start",
            "status": code,
            "headers": [
                (b"content-type", b"application/json"),
                (b"cache-control", b"no-store"),
                (b"content-length", str(len(data)).encode("ascii")),
            ],
        })
        await send({"type": "http.response.body", "body": data})

    async def __call__(self, scope, receive, send):
        if (scope.get("type") != "http" or
                scope.get("path") != VOICE_PATH or
                scope.get("method") != "POST"):
            return await self.app(scope, receive, send)

        # Do not read/parse an untrusted request body until authenticated.
        configured = self.shared_secret.encode("utf-8")
        if len(configured) < 32:
            return await self._reject(send, 503, "Voice ingress not configured")

        headers = dict(scope.get("headers", []))
        incoming = headers.get(SECRET_HEADER, b"")
        if not hmac.compare_digest(incoming, configured):
            return await self._reject(send, 401, "Unauthorized")

        media_type = headers.get(b"content-type", b"").split(b";", 1)[0].strip().lower()
        if media_type not in SUPPORTED_TYPES:
            return await self._reject(send, 415, "Unsupported media type")

        limit = self.max_json_bytes if media_type == b"application/json" else self.max_request_bytes
        length = headers.get(b"content-length")
        if length is not None:
            try:
                claimed_size = int(length)
            except ValueError:
                return await self._reject(send, 400, "Invalid content length")
            if claimed_size < 0:
                return await self._reject(send, 400, "Invalid content length")
            if claimed_size > limit:
                return await self._reject(send, 413, "Voice payload too large")

        # Enforce actual bytes as well as Content-Length, including chunked transfers.
        # This contains memory usage while preserving form parsing on downstream FastAPI.
        body = bytearray()
        while True:
            event = await receive()
            if event.get("type") == "http.disconnect":
                return
            if event.get("type") != "http.request":
                return await self._reject(send, 400, "Invalid request stream")
            piece = event.get("body", b"")
            if len(body) + len(piece) > limit:
                return await self._reject(send, 413, "Voice payload too large")
            body.extend(piece)
            if not event.get("more_body", False):
                break

        first = True

        async def replay_body():
            nonlocal first
            if first:
                first = False
                return {"type": "http.request", "body": bytes(body), "more_body": False}
            return await receive()

        return await self.app(scope, replay_body, send)
