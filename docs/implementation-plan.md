# Implementation plan and acceptance checklist

## Current milestone: contracts and static content

- [x] npm workspace structure and strict TypeScript configuration.
- [x] Framework-free shared contracts and tabled difficulty defaults.
- [x] ContentRepository, ProgressRepository, TtsProvider, GameEngine, and ProgressStore interfaces.
- [x] Versioned starter JSON covering three tracks and four game families.
- [x] class-validator seed DTOs, reference validation, and immutable static adapter.
- [x] Unit tests, lint/typecheck/build commands, and CI workflow.
- [x] Provenance and specification conflict documented.

## Remaining features, in dependency order

1. **Nest content API:** ContentModule, CoursesModule, DictionaryModule, PinyinModule, HealthModule; validated HTTP DTOs, consistent errors, track/lesson/sentence routes, CC-CEDICT lookup, pinyin-pro conversion, and integration tests for every route.
2. **Tone Match engine:** seeded PRNG, independent generation/scoring, exact round counts, answer validation, sandhi/context fixtures, deterministic stateless session/grade API in MinigamesModule. Test reproducibility, invalid answers, scoring, and speed-independent completion.
3. **Other game engines:** separate Pinyin Match, Listen & Pick, and Character Trace engines with dedicated rules, content, and tests. Never extend one engine with another game's rules.
4. **TTS:** environment-selected licensed provider, server-only secrets, request limits, cancellation/timeouts, rate limiting, bounded TTL cache, unavailable-provider retry contract, integration tests.
5. **React + Tailwind course flow:** localized track map and goal cards, four accessible renderers, immediate feedback, results, mistakes, retry/next, Hanzi Writer integration, pinyin settings, and transcripts.
6. **Local progress:** validated/versioned localStorage adapter, earned XP, review and streak rules, storage corruption/unavailability handling, reload retention and reset behavior.
7. **Release verification:** E2E launch/finish/results/reload for all three tracks, automated axe and keyboard checks, 44px touch targets, contrast checks, data-license attribution, complete route integration coverage, passing CI and review.

The first milestone does not satisfy the v0.0.1 definition of done. No track is marked playable until its game flow, retry, accessibility, and persisted local progress are verified end to end. No remote repository or PR has been created.
