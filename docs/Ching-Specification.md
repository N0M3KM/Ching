# Ching — Engineering Specification

| Field | Value |
| --- | --- |
| Product | Ching: game-first Mandarin learning web app |
| Release | `0.0.1` (pre-alpha) |
| Status | implementation-ready; no database or authentication |
| Updated | 2026-09-12 |

## 1. Product boundary

Ching teaches Mandarin through short, replayable minigames. It is **not** a video-lesson platform. A course is a paced sequence of game rounds with lightweight, optional reference cards; learners advance by completing games, not by watching content.

Ship three distinct tracks: **Beginner**, **Intermediate**, and **Advanced**. The same game family may appear in multiple tracks, but its content, time pressure, distractors, and scoring must increase with the track. UI copy supports English, Simplified Chinese, and Traditional Chinese; v0.0.1 learning content is curated Simplified Chinese with Traditional character variants where available.

### In scope

- Course map, lesson launch flow, results screen, and local-only progress.
- Tone Match, Pinyin Match, Listen & Pick, and Character Trace games.
- Seeded vocabulary, lessons, examples, and dictionary lookup.
- Pinyin, character-stroke animation, and text-to-speech playback.

### Explicitly out of scope

- Video hosting, watch-progress, live tutoring, payments, accounts, authentication, server-side progress, databases, and native apps.
- Speech recognition and pronunciation scoring (future only).

## 2. Required stack and boundaries

| Area | Decision |
| --- | --- |
| Client | React + TypeScript + Tailwind CSS |
| API | NestJS + TypeScript, REST under `/api/v1` |
| Validation | `class-validator` / DTOs at every request boundary |
| Data | Versioned JSON seed files, loaded through repository interfaces |
| Client state | React state plus browser `localStorage`; never a server-side user store |
| Libraries | `pinyin-pro`, Hanzi Writer, CC-CEDICT, curated Tatoeba-derived examples |
| Audio | Server-side TTS adapter; provider chosen by environment |

NestJS modules own one responsibility: `CoursesModule`, `MinigamesModule`, `DictionaryModule`, `PinyinModule`, `TtsModule`, `ContentModule`, and `HealthModule`. Controllers use services, services use ports, and ports have static-data implementations in v0.0.1. Do not let controllers read JSON directly.

```text
React UI → REST controller → application service → port/interface → static JSON adapter
                                            └→ TTS provider adapter + bounded cache
```

This is the required migration seam: `ProgressRepository`, `ContentRepository`, and `TtsProvider` are interfaces. v0.1.0 can introduce Postgres/auth implementations without changing game components, route contracts, or application services.

## 3. Course and game design

Each lesson has this loop: **brief goal card → 3–6 game rounds → immediate feedback → results → next lesson/retry**. Reference text must take less than one screen and be skippable. A game session is generated deterministically from a seed so failed rounds can be reproduced in tests.

| Track | Content | Difficulty rules | Completion target |
| --- | --- | --- | --- |
| Beginner | HSK 1-style survival vocabulary; initials/finals; tones 1–4 | 2 choices, no timer, pinyin shown, one skill/round | 70% accuracy over 5 rounds |
| Intermediate | Common multi-character words, classifiers, short sentences | 3–4 choices, 20–30s timer, pinyin toggle, mixed prior vocabulary | 75% accuracy over 8 rounds |
| Advanced | Idioms, near-synonyms, longer natural sentences, register | 4–6 choices, 12–20s timer, pinyin hidden by default, confusable distractors | 80% accuracy over 10 rounds |

### Game contracts

| Game | Player action | Difficulty scaling |
| --- | --- | --- |
| Tone Match | Match heard/shown syllable to tone contour | single syllable → tone-sandhi / multi-syllable words → ambiguous contextual words |
| Pinyin Match | Match Hanzi/meaning to pinyin | displayed pinyin → hidden pinyin / tone marks required → near-homophone distractors |
| Listen & Pick | Hear audio and select Hanzi/meaning | word → short sentence → natural-speed sentence with semantic distractors |
| Character Trace | Follow stroke order then identify character | guided animation → reduced guidance → timed recall after phrase context |

Every round returns: prompt, permitted answer ids, accessible transcript/pinyin, feedback, and an explanation. Score equals correct answers plus optional speed bonus; speed bonus must never block completion. Results include accuracy, earned XP, mistakes, and a retry action. XP and progress are display-only and local-only.

## 4. Data and persistence

Seed files are immutable application content under `apps/api/src/content/data/`, validated at startup. User data is never written by NestJS in v0.0.1. The client owns a versioned key `ching.progress.v1`; clearing browser storage resets it.

```ts
type Level = 'beginner' | 'intermediate' | 'advanced';
interface Lesson { id: string; track: Level; title: LocalizedText; rounds: RoundTemplate[] }
interface Vocabulary { id: string; simplified: string; traditional?: string; pinyin: string; definitions: string[]; audioText: string }
interface GameSession { id: string; lessonId: string; game: GameType; seed: number; rounds: GameRound[] }
interface LocalProgress { schemaVersion: 1; completedLessonIds: string[]; xp: number; streak: number; review: Record<string, ReviewCard> }
```

Add new content through seed files and schema validation. Add a new game by implementing `GameEngine`, registering it in `MinigamesModule`, adding its `GameType`, content fixtures, unit tests, and a client renderer. Do not edit another game engine to add its rules.

## 5. API contract

All JSON error responses are `{ code, message, details? }`; use appropriate HTTP status codes. No endpoint requires auth in this release.

| Method | Path | Responsibility |
| --- | --- | --- |
| GET | `/api/v1/tracks` | Track summaries and lesson metadata |
| GET | `/api/v1/lessons/:lessonId` | One lesson and its launch configuration |
| POST | `/api/v1/minigames/sessions` | Create deterministic session from `{ lessonId, game, seed? }` |
| POST | `/api/v1/minigames/sessions/:id/grade` | Grade submitted round answers; no persistence |
| GET | `/api/v1/dictionary?query=` | Static CC-CEDICT lookup |
| GET | `/api/v1/pinyin?text=` | Pinyin conversion |
| GET | `/api/v1/sentences?level=&tag=` | Curated example sentences |
| POST | `/api/v1/tts` | Validated `{ text, voice? }`; provider result cached by text/voice hash |
| GET | `/healthz` | Liveness/readiness |

TTS must enforce text-length limits, provider timeouts, rate limits, and a bounded TTL cache. Return a clear, accessible retry message when the provider is unavailable. Never expose provider secrets to the browser.

## 6. Repository layout

```text
apps/
  web/                         # React UI, game renderers, local progress adapter
  api/src/
    modules/                   # NestJS modules/controllers/services
    ports/                     # ContentRepository, ProgressRepository, TtsProvider
    adapters/static-content/   # v0.0.1 JSON implementations
    content/data/              # validated seeds
packages/
  contracts/                   # shared request/response types; no framework imports
  game-core/                   # deterministic engines and scoring
docs/
```

`packages/contracts` is the source of truth for API and game payload types. Keep domain/game logic in `game-core`, framework wiring in `apps/api`, and browser storage behind a client `ProgressStore` interface.

## 7. Quality bar

- TypeScript strict mode; no implicit `any` or unvalidated external input.
- Unit-test each game engine for generation, invalid answers, scoring, and seed reproducibility.
- Integration-test every route with static fixtures and TTS-provider failure handling.
- E2E test the critical path for all three tracks: launch, finish, see results, reload, and retain local progress.
- Run automated axe checks; keyboard-operable games; 44px minimum touch targets; visible focus; no color-only feedback; transcripts for every audio item.
- Use the warm-orange tokens: primary `#D9531E`, accent `#E86A38`, highlight `#FFF0E6`, page `#FAFAF8`, text `#2C2623`. Meet WCAG 2.1 AA contrast.

## 8. Delivery and future-safe Git workflow

`main` is deployable. Each independently releasable feature uses a short-lived branch: `feat/<area>-<change>`, `fix/<area>-<change>`, `chore/<change>`, or `docs/<change>`. One feature per PR; avoid drive-by refactors. Use Conventional Commits and squash merge only after CI and review.

Suggested dependency order: `feat/contracts-and-static-content` → `feat/nest-content-api` → `feat/game-core-tone-match` → individual game/UI PRs → `feat/local-progress-store`. This keeps future auth and persistence isolated.

## 9. Definition of done

A feature is done only when it satisfies its stated acceptance criteria, is isolated behind the relevant module/port, has passing lint/typecheck/tests, updates shared contracts and documentation, and does not add a database, auth, or server-side user persistence. A track is done when its required game sessions are playable at the tabled difficulty, accessible, and recoverable via retry. v0.0.1 is done when all three tracks work end-to-end using seeded content and local browser progress only.

## 10. Deferred decisions

- v0.1.0: add Postgres adapter for progress/content only after the current ports are proven.
- v0.2.0: add authentication by associating authenticated identity with the existing progress port.
- v0.3.0: speech recognition/pronunciation scoring behind a separate provider port.
- Before production: select a licensed TTS provider and verify data-license attribution/redistribution terms for every bundled dataset.
