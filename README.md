# Ching

A lightweight showcase demonstrating GPT-6 Astra performance, guided by Specification Engineering.

Ching is a game-first Mandarin learning app targeting **0.0.1 pre-alpha**. Three tracks offer Tone Match, Pinyin Match, Listen & Pick and Character Trace. Progress lives only in the browser.

## Run locally

Requires Node.js 24 and npm.

```sh
npm ci
npm run dev
```

Open [Ching](http://127.0.0.1:5174). Vite runs on port 5174 and proxies the Nest API on port 3001. Both bind to the local machine. `npm run build` checks compilation and creates the production client under `apps/web/dist`; server deployment packaging is a separate release task.

For live audio, copy `.env.example` to `.env`, set `TTS_PROVIDER=azure`, `AZURE_SPEECH_REGION` and `AZURE_SPEECH_KEY`, then restart. Provider credentials stay server-side. Without them, games provide transcripts and an audio retry message; no substitute audio is fabricated.

## Verify

```sh
npm run check
npm run browser:install
npm run test:e2e
```

Tests and browser downloads use ignored `.tmp` and `.cache` directories in this workspace. `check` runs lint, strict typechecking, unit/integration tests, the client build and seed validation. E2E checks use real local API routes, all four games in all three tracks, results, reload retention, keyboard stroke animation, mobile layout, localization, axe and retry recovery.

## Structure

- `packages/contracts`: framework-free API/game/content/progress contracts.
- `packages/game-core`: independent deterministic engines and shared scoring.
- `apps/api/src/modules`: Nest controllers/services; no JSON reads in controllers.
- `apps/api/src/ports`: ContentRepository, TtsProvider and the future ProgressRepository seam.
- `apps/api/src/adapters`: immutable static content and Azure TTS.
- `apps/api/src/content/data`: versioned validated seeds.
- `apps/web/src`: React renderers, runtime payload validation and local ProgressStore adapter.

The key `ching.progress.v1` stores display-only XP, lesson/game completion, review cards and calendar streaks. Complete all four games to finish a lesson. Same-seed retries credit only improved XP and can turn a failed game into a completed one. Reset removes this app's progress key. If storage is blocked or corrupt, the UI warns and retains progress for the current visit.

Read [the specification](docs/Ching-Specification.md), [implementation status](docs/implementation-plan.md), [architecture](docs/architecture.md) and [content provenance](docs/content-provenance.md).

## Git workflow

Feature branches now share the real `main` ancestor. See [the repair record](docs/git-history-repair.md). Branch from fetched `main` or a deliberate dependency branch; use Conventional Commits, one feature PR at a time, CI/review and squash merge. Do not initialize a second independent history. No database, authentication or server-side user persistence belongs in this release.
