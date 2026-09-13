# Content provenance

The pre-alpha seed `content.v1.json` uses schema version 1 and content version 0.0.2. It includes 18 vocabulary records, four example sentences, three lesson definitions and curated practice contexts for four games.

## CC-CEDICT

Dictionary definitions for 16 vocabulary records were imported from the [MDBG CC-CEDICT download](https://www.mdbg.net/chinese/dictionary?page=cedict), by CC-CEDICT contributors, retrieved 2026-09-13. The exact 19 selected source entries and header are retained in [cedict-subset.txt](cedict-subset.txt). Data is licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Changes: selected subset, JSON representation, curated pinyin spacing, track metadata. Adapted CC-CEDICT fields are distributed under the same license. The phrases 一杯 and 很好 remain Ching-authored records.

`scripts/import-content.mjs` reproduces the import from the current upstream download. It is an authoring tool, never a runtime step. Review diffs and bump the content version before publishing changed content; do not silently overwrite a released snapshot.

## Tatoeba

[Sentence 4869782](https://tatoeba.org/en/sentences/show/4869782), 你好！, was added by **zvzuibqx** on January 29, 2016 and is licensed under [CC BY 2.0 FR](https://creativecommons.org/licenses/by/2.0/fr/). Ching added the English translation, pinyin, level and tags. The other example sentences and practice contexts are Ching-authored; they are not represented as Tatoeba imports.

## Stroke data

Hanzi Writer code is MIT licensed. The bundled character data comes from [Hanzi Writer Data](https://github.com/chanind/hanzi-writer-data), derived from Make Me a Hanzi / Arphic Technology fonts. The [Arphic Public License](../apps/web/public/strokes/ARPHICPL.TXT) is included with the local stroke subset. `scripts/prepare-strokes.mjs` refreshes the subset from the installed, lockfile-pinned npm package. No remote stroke CDN is required at runtime.

## Content quality

Fixtures include third-tone sandhi for 很好, 一 before first tone, classifier phrases, near-tone distractors, longer sentences and register distinctions. Automated validation checks structure/references, not fluency or pedagogy. A qualified Mandarin curriculum review remains part of release sign-off.
