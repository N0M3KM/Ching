# Audio and dictionary integration

The audio failure was caused by the default provider returning unavailable whenever Azure was not configured. The previous UI also relied on autoplay and replacing a data URL, so replaying identical audio did not reliably restart it.

The API now defaults to local Mandarin (cmn) synthesis using eSpeak NG through @echogarden/espeak-ng-emscripten. It runs in a worker thread, returns mono 22,050 Hz PCM WAV, and is terminated on cancellation or the existing eight-second service timeout. Existing request limits, concurrency limits, response limits and bounded cache remain. This is intelligible synthetic speech; Azure neural voices remain an optional higher-quality provider.

Set TTS_PROVIDER=local (default), azure, or disabled in the server environment. Azure additionally needs AZURE_SPEECH_KEY and AZURE_SPEECH_REGION. No credentials enter the browser. Local supports the optional cmn voice; Azure supports cmn (mapped to Xiaoxiao), zh-CN-XiaoxiaoNeural and zh-CN-YunxiNeural. Disabled deliberately returns the accessible unavailable response.

The shared player requests audio once, calls play() explicitly and resets currentTime on replay. Native controls remain available if browser autoplay policy requires another gesture. Unmount pauses playback; transcripts remain available on failure. Dictionary entries and game rounds use the same player.

## Full reference dictionary

The bundled apps/api/src/content/data/cedict.txt.gz is the complete original CC-CEDICT snapshot: 125,047 entries, downloaded 2026-09-13. Its manifest records the source, retrieval time, count, license and SHA-256. Startup verifies the checksum and count. No dictionary download is required at runtime.

DictionaryRepository is separate from ContentRepository. Exact headwords rank first, followed by exact readings and substring matches; results are bounded to 50. Searches accept simplified/traditional Chinese, numbered or tone-mark pinyin, unaccented pinyin, and English. Corpus entries use stable source-derived IDs and their simplified headword as audioText. Curated entries override matching headword/readings so existing IDs, definitions, tags, practice content and progress references remain intact. General dictionary words have no invented course level. The lesson seed and deterministic game pools remain unchanged.

To refresh deliberately, run npm run dictionary:import, review the manifest/data diff and run npm run check and npm run test:e2e. The importer validates before writing the snapshot. This command changes reference data only.

## Attribution and distribution

Dictionary by [CC-CEDICT contributors](https://www.mdbg.net/chinese/dictionary?page=cedict), licensed [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). The original archive includes its copyright/license header. Changes: JSON records, tone-mark pinyin, IDs and indexes; these adapted dictionary fields remain CC BY-SA 4.0. Attribution is also displayed in the app credits and dictionary results. Lesson-specific provenance remains in content-provenance.md.

Local speech engine: [eSpeak NG](https://github.com/espeak-ng/espeak-ng), packaged by [Echogarden](https://github.com/echogarden-project/espeak-ng-emscripten), version 0.3.5, GPL-3.0. The license is included in licenses/espeak-ng-GPL-3.0.txt; upstream source and build scripts are available from those links. Preserve these notices and the applicable source-distribution requirements when redistributing the engine.

## Verification

Regression coverage checks the full snapshot, Chinese/English/pinyin lookup, tone conversion, malformed input, preservation of every curated word, new-word HTTP-to-TTS integration, non-silent WAV samples, cancellation, cache/rate/timeout behavior, and browser decode/play/replay. Azure requires deployment credentials for a live provider smoke test.
