import type { ContentSeed, GameSession, GameType, Lesson, RoundAnswer, SessionResult } from '@ching/contracts';

export interface GameEngine {
  readonly game: GameType;
  generate(input: { lesson: Lesson; seed: number; content: ContentSeed }): GameSession;
  grade(session: GameSession, answers: readonly RoundAnswer[], content: ContentSeed): SessionResult;
}
