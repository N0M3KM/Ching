# Architecture decisions

The [specification](Ching-Specification.md) governs the implementation. Milestones 1–6 are implemented; live provider and production release verification remain separate.

## Boundaries

React → Nest controller → application service → repository/provider interface → adapter. Controllers do not read JSON. ContentModule constructs StaticContentRepository at startup; class-validator checks shape, reference checks catch broken IDs, and the object graph is frozen before readiness succeeds. All HTTP request bodies, queries and route parameters use explicit DTO pipes. Explicit pipe types and injected tokens keep validation and injection independent of transpiler metadata.

Public contracts live in `@ching/contracts`, without framework imports. Each game implements `GameEngine` in `@ching/game-core`. The common engine base owns seeded selection and grading mechanics; each concrete engine owns its own prompts and answer construction. `ProgressRepository` remains an unimplemented future server seam. The browser implements `ProgressStore` and validates storage/API payloads before use.

## Decisions

1. **Round counts:** the table's 5/8/10 counts take precedence over the conflicting general 3–6 description. Lesson rounds describe template pools; engines generate the track's session count.
2. **Difficulty:** beginner has two choices and no timer; intermediate has four choices and 25 seconds; advanced has six choices and 15 seconds. Thresholds are 0.70/0.75/0.80. Score is correct answers plus speed bonus; completion never depends on the bonus. Late timed answers are incorrect.
3. **Stateless sessions:** IDs encode `c1~contentVersion~lessonId~game~seed`. Grading reconstructs rounds and answer keys from validated input and immutable content. Unknown versions return SESSION_EXPIRED. Partial submissions support immediate feedback; completion requires all answers. There is no server session or user store.
4. **Pinyin:** lexical pinyin remains separate from spoken tone sequences. Curated spoken-tone fixtures include 很好 → 2/3 and 一杯 → 4/1. Contexts, register and near-tone distractors scale by level.
5. **Tracing:** local Hanzi Writer assets support animation and pointer quizzes. Watching the stroke sequence with the keyboard unlocks identification as an accessible alternative to drawing. Beginner shows outlines; higher tracks reduce guidance; advanced hides the character after animation for recall.
6. **Progress:** the exact key is `ching.progress.v1`. A lesson completes after all four games pass. Same-seed replays record improved completion and only the increase in best XP. XP history is bounded to 5,000 session IDs and is display-only. Streaks follow local calendar days. Blocked/corrupt storage falls back to memory with a visible message.
7. **TTS:** only the server reads Azure credentials. Limits: 200 text characters, approved voices, eight-second deadline, 12 requests/client/minute, four concurrent uncached calls, 128 cache entries, five-minute TTL, two-megabyte provider audio limit. Cache keys hash text and voice. Failure returns a retry message with a transcript alternative.
8. **Localization/accessibility:** English, Simplified and Traditional UI strings share a typed copy structure. Mandarin learning content stays Mandarin. Warm-orange tokens are preserved; darker orange supports readable small white button text. Games use native keyboard controls, visible focus, text feedback and audio transcripts.

## Data and dependencies

CC-CEDICT, Tatoeba and stroke-data attribution are documented in [content provenance](content-provenance.md). Import tools are authoring-only and must not run automatically at server startup. Curriculum fluency still requires human review.

The root dependency override pins Nest's transitive Multer to the patched 2.3 line; no file-upload route is enabled. The clean lockfile installs successfully with `npm ci` and reports zero npm audit advisories. npm may label the overridden version invalid against Nest's original exact 2.2.0 declaration in `npm ls`; retain the explicit override rather than restoring the vulnerable version.
