# Qwen3-TTS private inference service

This bridge runs the actual Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice model. It fixes language to Chinese, speaker to Serena (native Chinese female), and instruction to clear, restrained, formal Mandarin narration. The 1.7B CustomVoice model supports instruction control; the 0.6B model does not provide the same style control.

Create an isolated Python environment (upstream recommends Python 3.12), install requirements.txt, and run server.py. Install a PyTorch build suitable for the host GPU. Model weights download from Hugging Face on first load; use HF_HOME to place the cache on a disk with sufficient space, or set QWEN_MODEL_PATH to an existing local model directory. Weights are not committed to Git.

Example PowerShell from the repository root:

    py -3.10 -m venv .cache/qwen-venv
    .cache/qwen-venv/Scripts/python -m pip install -r services/qwen-tts/requirements.txt
    $env:HF_HOME = 'D:\Ching\.cache\huggingface'
    .cache/qwen-venv/Scripts/python services/qwen-tts/server.py

The process loads the model before accepting requests. GET /healthz indicates readiness. Default binding is 127.0.0.1:8000. A non-loopback binding requires QWEN_API_KEY; use a private network and TLS reverse proxy. QWEN_DEVICE defaults to cuda:0 if CUDA is available, otherwise cpu. CPU inference can exceed the application's audio deadline. Size the model host and verify warm inference latency before relying on it in production.

In the Nest server environment:

    TTS_PROVIDER=qwen3
    QWEN_API_BASE_URL=http://127.0.0.1:8000
    QWEN_API_KEY=
    QWEN_FALLBACK_PROVIDER=local

The bridge key and Nest key must match when authentication is enabled. QWEN_API_BASE_URL points to this bridge, not an assumed OpenAI-compatible or DashScope API. Other hosting services need an adapter implementing this documented POST /synthesize contract. The JSON request contains text, model, language, speaker and instruct; success returns binary audio/wav. Neither the model nor voice profile is user-controlled.

The Nest adapter gives primary synthesis 5.5 seconds, reserving time inside the existing eight-second deadline for local fallback. QWEN_FALLBACK_PROVIDER may be local, azure, or disabled. A timed-out remote inference may finish on the worker; the bridge accepts only one inference at a time and rejects overlapping work rather than queueing it. The generated WAV is capped at 2 MB.

Run bridge contract tests with:

    py -3.10 -m unittest discover -s services/qwen-tts -p test_server.py

These tests verify profile arguments and validation without loading model weights. They are not an auditory quality assessment. For a live smoke test, start the bridge, set QWEN_FALLBACK_PROVIDER=disabled in the Nest process, and play a dictionary word and a longer lesson prompt. Confirm a 200 response, audible Mandarin, and the desired formal female delivery before release.

Source and model: https://github.com/QwenLM/Qwen3-TTS and https://huggingface.co/Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice. Both declare Apache-2.0. See docs/licenses/Qwen3-TTS-Apache-2.0.txt.
