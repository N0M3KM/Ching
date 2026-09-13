/** Framework-free public contracts. JSON seeds are validated separately at runtime. */
export const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export type Level = (typeof LEVELS)[number];
export const LOCALES = ['en', 'zh-Hans', 'zh-Hant'] as const;
export type Locale = (typeof LOCALES)[number];
export type LocalizedText = Readonly<Record<Locale, string>>;
export const GAME_TYPES = ['tone-match', 'pinyin-match', 'listen-pick', 'character-trace'] as const;
export type GameType = (typeof GAME_TYPES)[number];

export interface Difficulty {
  readonly roundCount: number;
  readonly choiceCount: number;
  readonly timeLimitSeconds: number | null;
  readonly pinyin: 'shown' | 'toggle' | 'hidden';
  readonly completionAccuracy: number;
  readonly traceGuidance: 'guided' | 'reduced' | 'recall';
}
export const DIFFICULTY: Readonly<Record<Level, Difficulty>> = Object.freeze({
  beginner: Object.freeze({ roundCount: 5, choiceCount: 2, timeLimitSeconds: null, pinyin: 'shown', completionAccuracy: 0.7, traceGuidance: 'guided' }),
  intermediate: Object.freeze({ roundCount: 8, choiceCount: 4, timeLimitSeconds: 25, pinyin: 'toggle', completionAccuracy: 0.75, traceGuidance: 'reduced' }),
  advanced: Object.freeze({ roundCount: 10, choiceCount: 6, timeLimitSeconds: 15, pinyin: 'hidden', completionAccuracy: 0.8, traceGuidance: 'recall' }),
});

export interface Vocabulary {
  readonly id: string;
  readonly level: Level;
  readonly simplified: string;
  readonly traditional?: string;
  readonly pinyin: string;
  readonly definitions: readonly string[];
  readonly audioText: string;
  readonly tags: readonly string[];
  readonly sourceId: string;
}
/** Templates identify content; engines own generation and game-specific rules. */
export interface RoundTemplate {
  readonly id: string;
  readonly game: GameType;
  readonly vocabularyIds: readonly string[];
  readonly sentenceIds: readonly string[];
}
export interface Lesson {
  readonly id: string;
  readonly track: Level;
  readonly order: number;
  readonly title: LocalizedText;
  readonly goal: LocalizedText;
  readonly rounds: readonly RoundTemplate[];
}
export interface Track {
  readonly id: Level;
  readonly title: LocalizedText;
  readonly description: LocalizedText;
}
export interface TrackSummary extends Track {
  readonly difficulty: Difficulty;
  readonly lessons: readonly Pick<Lesson, 'id' | 'title' | 'order'>[];
}
export interface ExampleSentence {
  readonly id: string;
  readonly level: Level;
  readonly simplified: string;
  readonly traditional?: string;
  readonly pinyin: string;
  readonly translation: LocalizedText;
  readonly tags: readonly string[];
  readonly sourceId: string;
}
export interface ContentSource {
  readonly id: string;
  readonly name: string;
  readonly license: string;
  readonly attribution: string;
  readonly url?: string;
}
export interface ContentSeed {
  readonly schemaVersion: 1;
  readonly contentVersion: string;
  readonly sources: readonly ContentSource[];
  readonly tracks: readonly Track[];
  readonly vocabulary: readonly Vocabulary[];
  readonly sentences: readonly ExampleSentence[];
  readonly lessons: readonly Lesson[];
}
export interface AnswerOption {
  readonly id: string;
  readonly label: LocalizedText;
}
export interface GameRound {
  readonly id: string;
  readonly prompt: LocalizedText;
  readonly permittedAnswerIds: readonly string[];
  readonly options: readonly AnswerOption[];
  readonly transcript: string;
  readonly pinyin: string;
  readonly audioText?: string;
  readonly traceCharacter?: string;
  readonly feedback: { readonly correct: LocalizedText; readonly incorrect: LocalizedText };
  readonly explanation: LocalizedText;
  readonly timeLimitSeconds: number | null;
}
export interface GameSession {
  readonly id: string;
  readonly lessonId: string;
  readonly game: GameType;
  readonly seed: number;
  readonly rounds: readonly GameRound[];
}
export interface CreateSessionRequest {
  readonly lessonId: string;
  readonly game: GameType;
  readonly seed?: number;
}
export interface RoundAnswer {
  readonly roundId: string;
  /** null records a timeout or an explicitly skipped round. */
  readonly answerId: string | null;
  readonly elapsedMs: number;
}
export interface GradeSessionRequest {
  readonly answers: readonly RoundAnswer[];
}
export interface RoundResult {
  readonly roundId: string;
  readonly answerId: string | null;
  readonly correctAnswerId: string;
  readonly correct: boolean;
  readonly explanation: LocalizedText;
}
export interface SessionResult {
  readonly sessionId: string;
  readonly accuracy: number;
  readonly correctAnswers: number;
  readonly speedBonus: number;
  readonly score: number;
  readonly earnedXp: number;
  readonly completed: boolean;
  readonly rounds: readonly RoundResult[];
  readonly mistakes: readonly RoundResult[];
  readonly retry: CreateSessionRequest;
}
export interface ReviewCard {
  readonly vocabularyId: string;
  readonly mistakes: number;
  readonly lastReviewedAt: string;
}
export interface LocalProgress {
  readonly schemaVersion: 1;
  readonly completedLessonIds: readonly string[];
  readonly xp: number;
  readonly streak: number;
  readonly review: Readonly<Record<string, ReviewCard>>;
}
export const PROGRESS_STORAGE_KEY = 'ching.progress.v1';
export interface TtsRequest { readonly text: string; readonly voice?: string }
export interface TtsResponse {
  readonly audioBase64: string;
  readonly mimeType: 'audio/mpeg' | 'audio/wav' | 'audio/ogg';
  readonly transcript: string;
}
export interface ApiError { readonly code: string; readonly message: string; readonly details?: unknown }
export interface LessonResponse { readonly lesson: Lesson; readonly difficulty: Difficulty; readonly games: readonly GameType[] }
export interface TracksResponse { readonly tracks: readonly TrackSummary[] }
export interface DictionaryRequest { readonly query: string }
export interface DictionaryResponse { readonly entries: readonly Vocabulary[] }
export interface PinyinRequest { readonly text: string }
export interface PinyinResponse { readonly text: string; readonly pinyin: string }
export interface SentencesRequest { readonly level?: Level; readonly tag?: string }
export interface SentencesResponse { readonly sentences: readonly ExampleSentence[] }
export interface HealthResponse { readonly status: 'ok'; readonly contentVersion: string }
