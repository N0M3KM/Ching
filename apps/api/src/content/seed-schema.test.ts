import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DIFFICULTY, GAME_TYPES, LEVELS } from '@ching/contracts';
import { ContentValidationError, validateSeed } from './seed-schema.js';

function fixture(): Record<string, unknown> {
  return JSON.parse(readFileSync(new URL('./data/content.v1.json', import.meta.url), 'utf8')) as Record<string, unknown>;
}
function records(input: Record<string, unknown>, key: string): Record<string, unknown>[] {
  return input[key] as Record<string, unknown>[];
}
function first(input: Record<string, unknown>, key: string): Record<string, unknown> {
  const result = records(input, key)[0];
  if (!result) throw new Error(`Fixture missing ${key}`);
  return result;
}

describe('versioned seed validation', () => {
  it('loads fixtures for three tracks and declares each game family', () => {
    const seed = validateSeed(fixture());
    expect(seed.tracks.map(track => track.id)).toEqual(LEVELS);
    for (const lesson of seed.lessons) expect(lesson.rounds.map(round => round.game)).toEqual(GAME_TYPES);
  });

  it.each([null, [], 'seed', 1, undefined])('rejects non-object input: %s', input => {
    expect(() => validateSeed(input)).toThrow(ContentValidationError);
  });

  const cases: [string, (seed: Record<string, unknown>) => void, string][] = [
    ['version', seed => { seed.schemaVersion = 2; }, 'schemaVersion'],
    ['version coercion', seed => { seed.schemaVersion = '1'; }, 'schemaVersion'],
    ['unknown property', seed => { seed.users = []; }, 'users'],
    ['unknown nested property', seed => { first(seed, 'vocabulary').xp = 5; }, 'xp'],
    ['empty pinyin', seed => { first(seed, 'vocabulary').pinyin = ' '; }, 'pinyin'],
    ['null optional value', seed => { first(seed, 'vocabulary').traditional = null; }, 'traditional'],
    ['missing locale', seed => { delete (first(seed, 'lessons').title as Record<string, unknown>)['zh-Hant']; }, 'zh-Hant'],
    ['duplicate vocabulary', seed => { records(seed, 'vocabulary').push(first(seed, 'vocabulary')); }, 'duplicate id'],
    ['duplicate source', seed => { records(seed, 'sources').push(first(seed, 'sources')); }, 'duplicate id'],
    ['unknown source', seed => { first(seed, 'vocabulary').sourceId = 'missing'; }, 'unknown source'],
    ['unknown level', seed => { first(seed, 'lessons').track = 'expert'; }, 'track'],
    ['missing track', seed => { records(seed, 'tracks').pop(); }, 'tracks'],
    ['duplicate track', seed => { records(seed, 'tracks').push(first(seed, 'tracks')); }, 'duplicate id'],
    ['missing track lessons', seed => { records(seed, 'lessons').pop(); }, 'lessons'],
    ['duplicate lesson order', seed => { records(seed, 'lessons').push({ ...first(seed, 'lessons'), id: 'another-lesson' }); }, 'duplicate lesson order'],
    ['unknown vocabulary', seed => { first(first(seed, 'lessons'), 'rounds').vocabularyIds = ['missing', 'tea']; }, 'unknown vocabulary'],
    ['unknown sentence', seed => { first(first(seed, 'lessons'), 'rounds').sentenceIds = ['missing']; }, 'unknown sentence'],
    ['unknown game', seed => { first(first(seed, 'lessons'), 'rounds').game = 'video'; }, 'game'],
    ['duplicate pool items', seed => { first(first(seed, 'lessons'), 'rounds').vocabularyIds = ['tea', 'tea']; }, 'vocabularyIds'],
    ['insufficient distractors', seed => {
      const advanced = records(seed, 'lessons')[2];
      if (advanced) first(advanced, 'rounds').vocabularyIds = ['consider', 'decide'];
    }, 'insufficient vocabulary'],
    ['missing advanced context', seed => {
      const advanced = records(seed, 'lessons')[2];
      if (advanced) first(advanced, 'rounds').sentenceIds = [];
    }, 'contextual sentences'],
  ];
  it.each(cases)('rejects %s', (_label, mutate, expected) => {
    const seed = fixture();
    mutate(seed);
    expect(() => validateSeed(seed)).toThrow(expected);
  });

  it('freezes nested content and separates it from the source object', () => {
    const input = fixture();
    const seed = validateSeed(input);
    first(input, 'vocabulary').simplified = 'changed';
    expect(seed.vocabulary[0]?.simplified).toBe('水');
    expect(Object.isFrozen(seed.lessons[0]?.rounds)).toBe(true);
    expect(() => Reflect.set(seed.vocabulary[0] ?? {}, 'simplified', 'changed')).not.toThrow();
    expect(seed.vocabulary[0]?.simplified).toBe('水');
  });

  it('retains the tabled round counts, timers, choices, and accuracy requirements', () => {
    expect(LEVELS.map(level => DIFFICULTY[level].roundCount)).toEqual([5, 8, 10]);
    expect(LEVELS.map(level => DIFFICULTY[level].choiceCount)).toEqual([2, 4, 6]);
    expect(LEVELS.map(level => DIFFICULTY[level].timeLimitSeconds)).toEqual([null, 25, 15]);
    expect(LEVELS.map(level => DIFFICULTY[level].completionAccuracy)).toEqual([0.7, 0.75, 0.8]);
  });
});
