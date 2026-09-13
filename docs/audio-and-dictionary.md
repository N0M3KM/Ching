# Audio and dictionary integration

The audio failure was caused by the default provider returning unavailable whenever Azure was not configured. The previous UI also relied on autoplay and replacing a data URL, so replaying identical audio did not reliably restart it.

The API now defaults to `QwenLM/Qwen3-TTS` for Mandarin synthesis, configured to a single native Chinese, female, formal narrative voice profile. Requests go through the same bounded `TtsProvider` adapter as before: existing request limits, concurrency limits, response limits, the eight-second service timeout, and the bounded TTL cache all remain unchanged. Local eSpeak NG synthesis (via `@echogarden/espeak-ng-emscripten`, run in a worker thread, mono 22,050 Hz PCM WAV) remains available as an offline fallback provider when Qwen3-TTS is unreachable or disabled; Azure neural voices remain an optional alternative provider.

Set TTS_PROVIDER=qwen3 (default), local, azure, or disabled in the server environment. Qwen3 uses the [self-hosted bridge](../services/qwen-tts/README.md) at QWEN_API_BASE_URL (default http://127.0.0.1:8000); set matching QWEN_API_KEY values if bridge authentication is enabled; its default voice is fixed to the native Chinese female formal narrative profile rather than selected per request. Azure additionally needs AZURE_SPEECH_KEY and AZURE_SPEECH_REGION. No credentials enter the browser. Local supports the optional cmn voice; Azure supports cmn (mapped to Xiaoxiao), zh-CN-XiaoxiaoNeural and zh-CN-YunxiNeural. Disabled deliberately returns the accessible unavailable response.

The shared player requests audio once, calls play() explicitly and resets currentTime on replay. Native controls remain available if browser autoplay policy requires another gesture. Unmount pauses playback; transcripts remain available on failure. Dictionary entries and game rounds use the same player.

## Full reference dictionary

The bundled apps/api/src/content/data/cedict.txt.gz is the complete original CC-CEDICT snapshot: 125,047 entries, downloaded 2026-09-13. Its manifest records the source, retrieval time, count, license and SHA-256. Startup verifies the checksum and count. No dictionary download is required at runtime.

DictionaryRepository is separate from ContentRepository. Exact headwords rank first, followed by exact readings and substring matches; results are bounded to 50. Searches accept simplified/traditional Chinese, numbered or tone-mark pinyin, unaccented pinyin, and English. Corpus entries use stable source-derived IDs and their simplified headword as audioText. Generated HSK entries and explicit manual overrides take precedence for matching headword/readings. Legacy demo IDs are not the generated curriculum; historical progress remains local, and new lesson IDs prevent false completion. General dictionary words have no invented course level. Game pools now come from the generated HSK seed described below.

To refresh deliberately, run npm run dictionary:import, review the manifest/data diff and run npm run check and npm run test:e2e. The importer validates before writing the snapshot. This command changes reference data only.

## Vocabulary pipeline (game core)

`content.v1.json` is no longer the source for game-core vocabulary. Lesson word lists are now produced by an HSK-based import pipeline and written into the validated seed files under `apps/api/src/content/data/`, matching Track difficulty in `Ching-Specification.md` §3 (Beginner = HSK 1–2, Intermediate = HSK 3–4, Advanced = HSK 5–6+). The pipeline pulls simplified/traditional forms, pinyin, gloss, and level directly from the HSK source dataset, derives `audioText` and tone/trace fields programmatically from the pinyin, and generates or sources the remaining practice enrichment (example sentence, sentence pinyin, pinyin-choice distractors, explanation) per word. Where the HSK gloss is missing or ambiguous, definitions are cross-checked against the CC-CEDICT reference dictionary described above via `DictionaryRepository`. Hand-authored entries are retained only as manual overrides for words the pipeline cannot resolve, using the same override precedence as curated dictionary entries.

To refresh vocabulary deliberately, run `npm run vocabulary:import`, review the generated seed diff, and run `npm run check` and `npm run test:e2e`. This command changes reference/content data only and is never invoked at runtime.

## Attribution and distribution

Dictionary by [CC-CEDICT contributors](https://www.mdbg.net/chinese/dictionary?page=cedict), licensed [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). The original archive includes its copyright/license header. Changes: JSON records, tone-mark pinyin, IDs and indexes; these adapted dictionary fields remain CC BY-SA 4.0. Attribution is also displayed in the app credits and dictionary results. Lesson-specific provenance remains in content-provenance.md.

Primary speech engine: [Qwen3-TTS](https://github.com/QwenLM/Qwen3-TTS), using Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice. The upstream code and model card declare Apache-2.0; its license is retained in licenses/Qwen3-TTS-Apache-2.0.txt. The fixed profile uses Chinese, Serena, and a formal narration instruction. See the bridge README for setup and live verification.

Local fallback speech engine: [eSpeak NG](https://github.com/espeak-ng/espeak-ng), packaged by [Echogarden](https://github.com/echogarden-project/espeak-ng-emscripten), version 0.3.5, GPL-3.0. The license is included in licenses/espeak-ng-GPL-3.0.txt; upstream source and build scripts are available from those links. Preserve these notices and the applicable source-distribution requirements when redistributing the engine.

Vocabulary dataset: Complete HSK Vocabulary (MIT), with CC-CEDICT-derived definitions retaining CC BY-SA 4.0. Source revision, full counts, transformation details and licenses are recorded in [hsk-pipeline.md](hsk-pipeline.md).

## Verification

Regression coverage checks the full snapshot, Chinese/English/pinyin lookup, tone conversion, malformed input, preservation of every curated word, new-word HTTP-to-TTS integration, non-silent WAV samples, cancellation, cache/rate/timeout behavior, and browser decode/play/replay. Coverage verifies the Qwen profile request parameters, WAV transport and fallback behavior, plus HSK mapping, overrides and all generated lesson/game combinations. These tests do not establish auditory model quality. Live Qwen inference requires the model service and weights; Azure requires credentials. The Qwen bridge README gives the live smoke-test procedure.

The Qwen adapter reserves 5.5 seconds for primary inference and the remainder of the eight-second service deadline for fallback. Set QWEN_FALLBACK_PROVIDER to local (default), azure, or disabled. Model weights are not committed, and fallback audio must not be described as verified Qwen output.
