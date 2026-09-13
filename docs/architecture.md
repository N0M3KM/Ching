# Architecture decisions

The source specification was supplied at `D:/13Games/Ching-Specification.md` (updated 2026-09-12). Its product and engineering requirements govern the project. This first feature implements the shared contracts and static repository, not the full release.

## Boundaries

The future request path is React → NestJS controller → application service → repository/provider port → adapter. Controllers must not read JSON. Construct `StaticContentRepository.fromFile(...)` while initializing `ContentModule`, so invalid content prevents readiness. Its constructor validates unknown input with class-validator DTOs, then checks references and freezes the complete object graph. Unknown properties and null optional strings are rejected.

All public payloads live in `@ching/contracts`, with no framework imports. `GameEngine` lives in `@ching/game-core`; each game gets a separate implementation and registration in `MinigamesModule`. `ProgressRepository` has no server implementation in this release. The web application will implement `ProgressStore` with the exact key `ching.progress.v1` and validate storage reads.

## Recorded interpretations

1. **Round counts:** the general 3–6 round description conflicts with the explicit 5/8/10 completion table. The table takes precedence. `Lesson.rounds` contains content templates, not an already generated session. An engine generates the required count from the matching template pools and seed.
2. **Difficulty defaults:** intermediate uses 4 choices and 25 seconds; advanced uses 6 choices and 15 seconds. These are within the stated ranges. Completion thresholds are fractions (0.70/0.75/0.80), independent of speed bonus. At five rounds, beginner needs four correct answers.
3. **Stateless grading:** the planned session ID should encode the content/engine version, lesson, game, and seed within a bounded validated format. Grading regenerates the session; it must never trust a client-supplied answer key or require a user/session database. Version changes must produce an explicit expired-session error when regeneration is unsupported. The ID format and HTTP DTOs remain work for the minigame API feature.
4. **Content provenance:** original fixtures are labeled explicitly. Required CC-CEDICT and Tatoeba imports remain pending, with attribution retained per record. Do not claim these development fixtures came from either dataset.
5. **Pronunciation:** lexical pinyin and spoken sandhi require deliberate game rules. For example, 很好 needs spoken third-tone sandhi in Tone Match. Stored pinyin alone is not an answer key. Advanced contextual tone and trace rules require dedicated fixtures before those games can ship.
6. **Localization:** localized UI strings require English, Simplified Chinese, and Traditional Chinese. Mandarin transcripts and lexical pinyin remain Mandarin content. The current validator verifies presence, not linguistic accuracy.

## Next boundaries

The API feature must introduce NestJS modules, request DTOs on all parameters/query/body boundaries, `/api/v1` routing, and `{ code, message, details? }` errors. Health remains `/healthz`. The TTS feature must select a server-only provider via environment and implement timeout/cancellation, text limits, rate limiting, and a bounded TTL cache keyed by text and voice. An unavailable provider must produce an accessible retry message, not simulated audio.

The UI must use React, TypeScript, Tailwind, warm-orange spec tokens, visible focus, 44px targets, text feedback, transcripts, and tested AA contrast. The primary orange token should not be assumed to support small white text without contrast verification.
