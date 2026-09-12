import type { ContentSeed, ExampleSentence, Lesson, Level, Vocabulary } from '@ching/contracts';

export const CONTENT_REPOSITORY = Symbol('ContentRepository');
export interface ContentRepository {
  getContent(): ContentSeed;
  findLesson(id: string): Lesson | undefined;
  findVocabulary(id: string): Vocabulary | undefined;
  lookup(query: string): readonly Vocabulary[];
  findSentences(filters: { level?: Level; tag?: string }): readonly ExampleSentence[];
}
