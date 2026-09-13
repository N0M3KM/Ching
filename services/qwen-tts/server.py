"""Ching's private Qwen3-TTS bridge. Load once before accepting requests."""
import hmac
import io
import json
import os
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

MODEL_ID = "Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice"
SPEAKER = "Serena"
INSTRUCTION = "请使用标准普通话，以端庄、正式的女性旁白语气朗读。吐字清晰，语速平稳自然，语调克制，不要夸张表演。"
MODEL = None
LOCK = threading.Lock()


def validate_request(body):
    if not isinstance(body, dict) or set(body) != {"text", "model", "language", "speaker", "instruct"}:
        raise ValueError("Invalid request fields")
    if not isinstance(body["text"], str) or not body["text"].strip() or len(body["text"]) > 200:
        raise ValueError("Invalid text length")
    if (body["model"], body["language"], body["speaker"], body["instruct"]) != (MODEL_ID, "Chinese", SPEAKER, INSTRUCTION):
        raise ValueError("Unsupported voice profile")
    return body["text"].strip()


def synthesize(model, text):
    import soundfile as sf
    wavs, sample_rate = model.generate_custom_voice(
        text=text, language="Chinese", speaker=SPEAKER, instruct=INSTRUCTION,
        max_new_tokens=1024, do_sample=False,
    )
    output = io.BytesIO()
    sf.write(output, wavs[0], sample_rate, format="WAV", subtype="PCM_16")
    data = output.getvalue()
    if len(data) <= 44 or len(data) > 2_000_000:
        raise ValueError("Invalid generated audio size")
    return data


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_args):
        pass  # Do not log transcripts, authorization headers, or request bodies.

    def reply(self, status, data, content_type="application/json"):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        try:
            self.wfile.write(data)
        except (BrokenPipeError, ConnectionResetError):
            pass

    def do_GET(self):
        self.reply(200 if self.path == "/healthz" else 404, b'{"ready":true}')

    def do_POST(self):
        key = os.environ.get("QWEN_API_KEY", "")
        if key and not hmac.compare_digest(self.headers.get("Authorization", ""), "Bearer " + key):
            self.reply(401, b'{"error":"unauthorized"}')
            return
        if self.path != "/synthesize":
            self.reply(404, b'{"error":"not_found"}')
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length < 1 or length > 4096:
                raise ValueError("Body size")
            self.connection.settimeout(10)
            text = validate_request(json.loads(self.rfile.read(length)))
        except (ValueError, TimeoutError):
            self.reply(400, b'{"error":"invalid_request"}')
            return
        if not LOCK.acquire(blocking=False):
            self.reply(429, b'{"error":"busy"}')
            return
        try:
            self.reply(200, synthesize(MODEL, text), "audio/wav")
        except Exception:
            self.reply(503, b'{"error":"synthesis_failed"}')
        finally:
            LOCK.release()


if __name__ == "__main__":
    import torch
    from qwen_tts import Qwen3TTSModel
    device = os.environ.get("QWEN_DEVICE", "cuda:0" if torch.cuda.is_available() else "cpu")
    MODEL = Qwen3TTSModel.from_pretrained(
        os.environ.get("QWEN_MODEL_PATH", MODEL_ID), device_map=device,
        dtype=torch.float32 if device == "cpu" else torch.bfloat16,
        attn_implementation="sdpa",
    )
    host = os.environ.get("QWEN_HOST", "127.0.0.1")
    if host not in ("127.0.0.1", "localhost", "::1") and not os.environ.get("QWEN_API_KEY"):
        raise RuntimeError("Set QWEN_API_KEY before binding beyond loopback")
    print("Qwen3-TTS ready: Chinese / Serena / formal narration", flush=True)
    ThreadingHTTPServer((host, int(os.environ.get("QWEN_PORT", "8000"))), Handler).serve_forever()
