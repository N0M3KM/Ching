# Implementation status

Milestones 1–6 are implemented. The original specification is preserved in [Ching-Specification.md](Ching-Specification.md).

1. **Nest content API:** ContentModule, CoursesModule, DictionaryModule, PinyinModule, HealthModule and sentence routes. Explicit DTO validation for body/query/params, consistent JSON errors, startup-validated immutable content, CC-CEDICT subset and pinyin-pro conversion.
2. **Tone Match:** seeded generation, spoken-tone and third-tone sandhi fixtures, exact 5/8/10 rounds, stateless session IDs and grading, invalid-answer rejection, speed-independent completion thresholds.
3. **Other engines:** independent Pinyin Match, Listen & Pick and Character Trace implementations, with tone-mark distractors, sentence/register contexts and guided/reduced/recall stroke practice.
4. **TTS:** Azure provider selected through server environment, two allowed Mandarin voices, 200-character limit, eight-second timeout, cancellation, 12 requests/client/minute, four concurrent misses, 128-entry five-minute cache, bounded response size and accessible unavailable/retry state. Live provider playback needs the user's credentials.
5. **React course flow:** responsive Tailwind UI, English/Simplified/Traditional interface copy, course map, goal card, four renderers, feedback, results, retry/next game, dictionary, Hanzi Writer with bundled local stroke assets, transcripts and keyboard practice.
6. **Local progress:** validated `ching.progress.v1` storage, XP, local-calendar streaks, review cards, completion after all four games, storage-failure fallback, same-seed retry improvements without duplicate XP, reload retention and reset.

## Verification

- `npm run check`: lint, strict TypeScript, unit/integration tests, production client build and content validation.
- `npm run test:e2e`: every game in every track through launch, answers, results and reload, plus mobile, locales, dictionary, TTS fallback and retry recovery. Axe runs on course and game views.
- Git branch ancestry was repaired without rewriting existing commits; see [Git history repair](git-history-repair.md).

## Milestone 7 / release work

A live Azure synthesis smoke test, broader linguistic/curriculum review, deployment configuration and final production sign-off remain. The included content is a small pre-alpha curriculum, not exhaustive HSK coverage. Automated axe checks complement, rather than replace, manual assistive-technology review. No database, account system or server-side user progress has been introduced.
