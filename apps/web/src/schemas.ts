import { z } from 'zod';
import { GAME_TYPES, LEVELS } from '@ching/contracts';

const idSchema = z.string().min(1).max(180);
const seedSchema = z.number().int().min(0).max(4_294_967_295);

export const localized = z.object({
  en: z.string(),
  'zh-Hans': z.string(),
  'zh-Hant': z.string(),
});
const difficultySchema = z.object({
  roundCount: z.number().int().min(1).max(10),
  choiceCount: z.number().int().min(2).max(6),
  timeLimitSeconds: z.number().positive().nullable(),
  pinyin: z.enum(['shown', 'toggle', 'hidden']),
  completionAccuracy: z.number().min(0).max(1),
  traceGuidance: z.enum(['guided', 'reduced', 'recall']),
});

const templateSchema = z.object({
  id: idSchema,
  game: z.enum(GAME_TYPES),
  vocabularyIds: z.array(idSchema),
  sentenceIds: z.array(idSchema),
});

export const resultSchema = z.object({
  roundId: idSchema,
  vocabularyId: idSchema,
  answerId: idSchema.nullable(),
  correctAnswerId: idSchema,
  correct: z.boolean(),
  explanation: localized,
});

export const lessonSchema = z.object({
  lesson: z.object({
    id: idSchema,
    track: z.enum(LEVELS),
    order: z.number().int(),
    title: localized,
    goal: localized,
    rounds: z.array(templateSchema),
  }),
  difficulty: difficultySchema,
  games: z.array(z.enum(GAME_TYPES)),
});

export const tracksSchema = z.object({
  tracks: z.array(
    z.object({
      id: z.enum(LEVELS),
      title: localized,
      description: localized,
      difficulty: difficultySchema,
      lessons: z.array(
        z.object({
          id: idSchema,
          title: localized,
          order: z.number().int(),
        })
      ),
    })
  ),
});

export const sessionSchema = z.object({
  id: idSchema,
  lessonId: idSchema,
  game: z.enum(GAME_TYPES),
  seed: seedSchema,
  rounds: z
    .array(
      z.object({
        id: idSchema,
        vocabularyId: idSchema,
        prompt: localized,
        options: z.array(
          z.object({
            id: idSchema,
            label: localized,
          })
        ),
        permittedAnswerIds: z.array(idSchema),
        transcript: z.string(),
        pinyin: z.string(),
        audioText: z.string().optional(),
        traceCharacter: z.string().optional(),
        feedback: z.object({
          correct: localized,
          incorrect: localized,
        }),
        explanation: localized,
        timeLimitSeconds: z.number().nullable(),
      })
    )
    .min(1)
    .max(10),
});

export const sessionResultSchema = z.object({
  sessionId: idSchema,
  accuracy: z.number().min(0).max(1),
  correctAnswers: z.number().int().nonnegative(),
  speedBonus: z.number().nonnegative(),
  score: z.number().nonnegative(),
  earnedXp: z.number().int().nonnegative(),
  completed: z.boolean(),
  rounds: z.array(resultSchema),
  mistakes: z.array(resultSchema),
  retry: z.object({
    lessonId: idSchema,
    game: z.enum(GAME_TYPES),
    seed: seedSchema.optional(),
  }),
});

export const ttsSchema = z.object({
  audioBase64: z.string().max(2_800_000),
  mimeType: z.enum(['audio/mpeg', 'audio/wav', 'audio/ogg']),
  transcript: z.string(),
});

export const dictionarySchema = z.object({
  entries: z.array(
    z.object({
      id: idSchema,
      level: z.enum(LEVELS).optional(),
      simplified: z.string(),
      traditional: z.string().optional(),
      pinyin: z.string(),
      definitions: z.array(z.string()),
      audioText: z.string(),
      tags: z.array(z.string()),
      sourceId: idSchema,
    })
  ),
});

export const sentencesSchema = z.object({
  sentences: z.array(
    z.object({
      id: idSchema,
      level: z.enum(LEVELS),
      simplified: z.string(),
      traditional: z.string().optional(),
      pinyin: z.string(),
      translation: localized,
      tags: z.array(z.string()),
      sourceId: idSchema,
    })
  ),
});

// API Helper Utility
export async function api<T>(
  path: string,
  schema: z.ZodType<T>,
  body?: unknown
): Promise<T> {
  const isPost = body !== undefined;

  const init: RequestInit = {
    method: isPost ? 'POST' : 'GET',
    signal: AbortSignal.timeout(15_000),
    ...(isPost && {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  };

  const response = await fetch(`/api/v1/${path}`, init);

  if (!response.ok) {
    throw new Error(`REQUEST_FAILED: ${response.status}`);
  }

  const payload: unknown = await response.json();
  return schema.parse(payload);
}