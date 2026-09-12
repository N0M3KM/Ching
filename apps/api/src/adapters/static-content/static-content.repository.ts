import { readFileSync } from 'node:fs';
import type { ContentSeed, Level } from '@ching/contracts';
import type { ContentRepository } from '../../ports/content-repository.js';
import { ContentValidationError, validateSeed } from '../../content/seed-schema.js';

function normalize(value: string): string {
  return value.normalize('NFC').trim().toLocaleLowerCase('en');
}

/** Construct at startup; JSON I/O is confined to this adapter. No mutation API. */
export class StaticContentRepository implements ContentRepository {
  private readonly content: ContentSeed;

  constructor(input: unknown) {
    this.content = validateSeed(input);
  }

  static fromFile(path: string | URL): StaticContentRepository {
    let raw: unknown;
    try {
      raw = JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));
    } catch (error) {
      throw new ContentValidationError([`seed: could not read JSON (${error instanceof Error ? error.message : 'unknown error'})`]);
    }
    return new StaticContentRepository(raw);
  }

  getContent(): ContentSeed { return this.content; }
  findLesson(id: string) { return this.content.lessons.find(lesson => lesson.id === id); }
  findVocabulary(id: string) { return this.content.vocabulary.find(word => word.id === id); }

  lookup(query: string) {
    const term = normalize(query);
    if (!term) return [];
    return this.content.vocabulary.filter(word =>
      [word.simplified, word.traditional ?? '', word.pinyin, ...word.definitions]
        .some(value => normalize(value).includes(term)),
    ).slice(0, 50);
  }

  findSentences(filters: { level?: Level; tag?: string }) {
    return this.content.sentences.filter(sentence =>
      (!filters.level || sentence.level === filters.level)
      && (!filters.tag || sentence.tags.includes(filters.tag)),
    );
  }
}
