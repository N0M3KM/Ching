# Generated HSK curriculum

The application loads content.hsk.v1.json.gz through the ContentRepository port. The hand-authored content.v1.json remains a legacy test fixture only. The reference dictionary remains full CC-CEDICT behind DictionaryRepository.

Source: [Complete HSK Vocabulary](https://github.com/drkameleon/complete-hsk-vocabulary), pinned at revision 7ac65bf1a6387d35f1ade478906172a19311c7f9. This import uses the HSK 3.0 new-1 through new-7 labels, with new-7 representing levels 7–9. It does not mix old or newest labels into the same level scale. The source contains 11,470 records; all 10,969 records belonging to this edition are included. The 501 records exclusive to other editions are recorded by hashed ID and reason in the manifest.

Track mapping: HSK 1–2 → beginner (1,256 words); HSK 3–4 → intermediate (1,925); HSK 5–6 and 7–9 → advanced (7,788). There are 457 lessons, generally 24 words each. Source frequency orders words within HSK bands. A lesson selector makes all groups accessible without rendering hundreds of game grids.

## Reproduction

Run npm run vocabulary:import. The normal path uses the bundled compressed source and generates the same output without network access. To update deliberately, set HSK_SOURCE_REVISION to a full immutable upstream commit SHA and run npm run vocabulary:import -- --refresh. Review the manifest, exclusions, licenses and output changes before pushing. Never fetch or generate curriculum inside an API request.

The compressed source, generated content and stroke archive contain the dataset; tools report counts only. hsk.manifest.json records checksums, source revision, track counts, exclusions and enrichment method. Runtime verifies the content checksum before validating and freezing the seed. No database or user data is involved.

The pipeline selects an ordinary lexical form ahead of surname/reference-only forms when available, then preserves that source form (simplified, traditional, pinyin, definitions) and edition level. Other dictionary readings remain searchable in CC-CEDICT. Missing or reference-only glosses are checked against the matching CC-CEDICT headword/reading; the manifest records the number of reference fallbacks. audioText uses the headword; spokenTones and spokenPinyin preserve the source reading and apply adjacent third-tone / 一 / 不 rules. These programmatic rules do not claim to model every prosodic or lexical exception.

Practice retains the existing schema. Pinyin distractors are generated with tone changes and additional readings. Sentences are grammatical metalinguistic reading prompts containing each word, with longer prompts in the advanced track. They are explicitly generated prompts, not sourced natural-use sentences or a reviewed advanced-language curriculum. Sentence pinyin embeds the source reading to avoid replacing a polyphonic word with an unrelated reading. Explanations combine source definitions with the derived reading. A future enrichment source can replace these fields without changing games.

Trace characters are selected from available Hanzi Writer data. All 2,540 selected characters are bundled in a compressed archive and served by the validated stroke endpoint. Trace pools include enough distinct characters; advanced tone pools use multisyllable words so six distinct tone choices are possible. Neighboring words from the same track may supplement a pool.

Exceptional manual corrections live in hsk-overrides.ts, currently empty. Overrides use the source-derived stable ID and replace the entire record before final validation. Unused overrides cause failure. They are not a second hand-authored vocabulary core.

Generated lessons use hsk3-prefixed IDs and content version 0.1.0 so old demo completions do not mark new lessons complete. Existing local XP and historical progress remain; old sessions receive SESSION_EXPIRED.

## Attribution

Complete HSK Vocabulary declares MIT, copyright 2026 Yanis Zafirópulos (Dr.Kameleon); its license is retained in licenses/complete-hsk-MIT.txt. Its README identifies CC-CEDICT as the source of definitions. Those fields, including fallback definitions and their adaptations, retain [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) attribution/share-alike terms. Ching-generated prompts and metadata are identified separately. This does not relabel CC-CEDICT data as MIT.

Stroke data derives from Make Me a Hanzi / Arphic fonts through Hanzi Writer Data. The Arphic license is retained in licenses/ARPHICPL.TXT. User-facing credits include HSK, CC-CEDICT, Qwen3-TTS and stroke-data notices.

Automated checks cover schema, level mapping, word coverage, stroke availability, overrides and every game in every lesson. Mandarin pedagogical review and live Qwen auditory review remain release checks.
