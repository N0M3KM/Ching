import type { ContentSeed, GameSession, GameType, Lesson, RoundAnswer, SessionResult } from '@ching/contracts';

export interface GameEngine {
  readonly game: GameType;
  generate(input: { lesson: Lesson; seed: number; content: ContentSeed }): GameSession;
  grade(session: GameSession, answers: readonly RoundAnswer[], content: ContentSeed): SessionResult;
}

export { ToneMatchEngine } from './tone-match.js';
export { PinyinMatchEngine } from './pinyin-match.js';
export { ListenPickEngine } from './listen-pick.js';
export { CharacterTraceEngine } from './character-trace.js';
export { GameInputError } from './common.js';
