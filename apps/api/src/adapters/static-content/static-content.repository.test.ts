import { describe, expect, it } from 'vitest';
import { StaticContentRepository } from './static-content.repository.js';

const path = new URL('../../content/data/content.v1.json', import.meta.url);
const repository = StaticContentRepository.fromFile(path);

describe('static content repository', () => {
  it('finds a lesson without exposing filesystem concerns to callers', () => {
    expect(repository.findLesson('beginner-01')?.track).toBe('beginner');
    expect(repository.findLesson('missing')).toBeUndefined();
    expect(repository.findVocabulary('water')?.pinyin).toBe('shuǐ');
    expect(repository.findVocabulary('missing')).toBeUndefined();
  });
  it.each(['购买', '購買', 'gòu mǎi', 'PURCHASE', '  purchase  '])('looks up %s', query => {
    expect(repository.lookup(query).map(word => word.id)).toContain('buy');
  });
  it('normalizes decomposed Unicode', () => {
    expect(repository.lookup('shuǐ'.normalize('NFD')).map(word => word.id)).toContain('water');
  });
  it('returns no matches for empty or unknown input', () => {
    expect(repository.lookup('  ')).toEqual([]);
    expect(repository.lookup('not-a-word')).toEqual([]);
  });
  it('filters sentences by level and tag together', () => {
    expect(repository.findSentences({})).toHaveLength(3);
    expect(repository.findSentences({ level: 'intermediate', tag: 'classifiers' }).map(item => item.id)).toEqual(['buy-one-cup']);
    expect(repository.findSentences({ level: 'advanced', tag: 'survival' })).toEqual([]);
  });
  it('fails closed when a seed file is missing', () => {
    expect(() => StaticContentRepository.fromFile(new URL('./missing.json', import.meta.url))).toThrow('could not read JSON');
  });
  it('exposes frozen content', () => {
    expect(Object.isFrozen(repository.getContent())).toBe(true);
    expect(Object.isFrozen(repository.findVocabulary('water'))).toBe(true);
  });
});
