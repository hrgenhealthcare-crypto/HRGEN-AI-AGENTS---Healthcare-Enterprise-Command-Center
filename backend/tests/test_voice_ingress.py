"""Security regressions for the independent Python voice ingress.
Uses in-memory fake ASGI responders; no customer data, provider account or API keys.
"""
import asyncio
import json
import unittest
from backend.voice_ingress_guard import VoiceIngressGuard, VOICE_PATH

SECRET = "synthetic-gateway-secret-minimum-32-bytes-0123456789"

class VoiceIngressGuardTests(unittest.TestCase):
    def invoke(self, *, configured=SECRET, supplied=None, content_type=b"application/json",
               body=b'{"transcript":"synthetic"}', pieces=None, declared=None,
               path=VOICE_PATH, method="POST", max_json=64, max_total=128):
        seen = {"read": 0, "downstream": 0, "body": None, "status": None, "response": b""}
        if supplied is None: supplied = SECRET
        headers = [(b"content-type", content_type)]
        if supplied:
            headers.append((b"x-hrgen-webhook-secret", supplied.encode()))
        if declared is not None:
            headers.append((b"content-length", str(declared).encode()))
        chunks = [body] if pieces is None else list(pieces)
        messages = [
            {"type": "http.request", "body": chunk, "more_body": i != len(chunks)-1}
            for i,chunk in enumerate(chunks)
        ]
        async def receive():
            seen["read"] += 1
            if messages: return messages.pop(0)
            return {"type": "http.disconnect"}
        async def send(message):
            if message["type"] == "http.response.start":
                seen["status"] = message["status"]
            if message["type"] == "http.response.body":
                seen["response"] += message.get("body", b"")
        async def downstream(scope, receive, send):
            seen["downstream"] += 1
            item = await receive()
            seen["body"] = item.get("body", b"")
            await send({"type": "http.response.start", "status": 200, "headers": []})
            await send({"type": "http.response.body", "body": b"ok"})

        guard = VoiceIngressGuard(downstream, shared_secret=configured,
                                  max_request_bytes=max_total,
                                  max_json_bytes=max_json)
        scope = {"type":"http","method":method,"path":path,"headers":headers}
        asyncio.run(guard(scope,receive,send))
        return seen

    def test_missing_secret_fails_closed_before_read(self):
        r = self.invoke(configured="")
        self.assertEqual((r["status"],r["read"],r["downstream"]),(503,0,0))
        self.assertNotIn(SECRET.encode(), r["response"])

    def test_weak_secret_fails_closed(self):
        r = self.invoke(configured="weak", supplied="weak")
        self.assertEqual((r["status"],r["read"],r["downstream"]),(503,0,0))

    def test_missing_or_wrong_secret_denied_before_read(self):
        for supplied in ("", "incorrect"):
            r = self.invoke(supplied=supplied)
            self.assertEqual((r["status"],r["read"],r["downstream"]),(401,0,0))
            self.assertNotIn(SECRET.encode(), r["response"])

    def test_authenticated_json_reaches_downstream_identically(self):
        body = b'{"transcript":"no-real-person-data"}'
        r = self.invoke(body=body)
        self.assertEqual(r["status"],200)
        self.assertEqual(r["downstream"],1)
        self.assertEqual(r["body"],body)

    def test_declared_oversize_denied_before_stream_read(self):
        r = self.invoke(declared=65)
        self.assertEqual((r["status"],r["read"],r["downstream"]),(413,0,0))

    def test_chunked_oversize_denied_by_actual_bytes(self):
        r = self.invoke(pieces=[b"A"*45,b"B"*25],declared=None)
        self.assertEqual(r["status"],413)
        self.assertEqual(r["read"],2)
        self.assertEqual(r["downstream"],0)

    def test_multipart_oversize_denied(self):
        r = self.invoke(content_type=b"multipart/form-data; boundary=synthetic",
                        pieces=[b"A"*100,b"B"*50],max_total=128)
        self.assertEqual(r["status"],413)
        self.assertEqual(r["downstream"],0)

    def test_unsupported_media_is_rejected_before_read(self):
        r = self.invoke(content_type=b"text/plain")
        self.assertEqual((r["status"],r["read"],r["downstream"]),(415,0,0))

    def test_non_webhook_routes_not_intercepted(self):
        r = self.invoke(configured="",path="/health")
        self.assertEqual(r["status"],200)
        self.assertEqual(r["downstream"],1)

    def test_multipart_under_size_reaches_downstream(self):
        b = b"--synthetic-boundary--"
        r = self.invoke(content_type=b"multipart/form-data; boundary=x",
                        body=b,max_total=128)
        self.assertEqual(r["status"],200)
        self.assertEqual(r["body"],b)

if __name__ == "__main__":
    unittest.main()
