# Content provenance

`content.v1.json` contains **original development fixtures**, not imported CC-CEDICT or Tatoeba data. It has 18 vocabulary entries, three example sentences, three lesson definitions, and four game-template declarations per lesson. These examples support schema and repository tests. They are not a reviewed curriculum or complete game fixtures.

Every vocabulary item and sentence references a source record. Startup validation rejects missing sources and broken lesson references. Add content by editing a versioned seed and running `npm run content:validate` and `npm test`. Schema changes require an explicit version/migration decision. Avoid changing published content in place after deterministic sessions depend on its version.

Before the dictionary/examples feature is complete:

- Obtain the actual CC-CEDICT and Tatoeba source material and verify applicable redistribution terms.
- Preserve source URLs, original sentence/entry IDs, attribution, license text, and modification notes.
- Import a curated subset with source-specific IDs, validate it, and review pinyin, Traditional variants, translations, and register.
- Add focused tone-sandhi, homophone, semantic-distractor, and trace-character fixtures with expected answers.

No external dataset license or source attribution is asserted for generated development examples. A qualified Mandarin review is still required.
