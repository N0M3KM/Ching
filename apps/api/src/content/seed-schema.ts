import 'reflect-metadata';
import { plainToInstance, Type } from 'class-transformer';
import { ArrayMinSize, ArrayUnique, Equals, IsArray, IsIn, IsInt, IsObject, IsString, IsUrl, Matches, MaxLength, Min, ValidateIf, ValidateNested, validateSync } from 'class-validator';
import type { ValidationError } from 'class-validator';
import { DIFFICULTY, GAME_TYPES, LEVELS } from '@ching/contracts';
import type { ContentSeed, GameType, Level } from '@ching/contracts';

class LocalizedTextDto {
  @IsString() @Matches(/\S/) @MaxLength(600) en!: string;
  @IsString() @Matches(/\S/) @MaxLength(600) 'zh-Hans'!: string;
  @IsString() @Matches(/\S/) @MaxLength(600) 'zh-Hant'!: string;
}
class IdentifiedDto {
  @IsString() @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) @MaxLength(80) id!: string;
}
class SourceDto extends IdentifiedDto {
  @IsString() @Matches(/\S/) name!: string;
  @IsString() @Matches(/\S/) license!: string;
  @IsString() @Matches(/\S/) attribution!: string;
  @ValidateIf((_object, value: unknown) => value !== undefined) @IsUrl({ protocols: ['https'], require_protocol: true }) url?: string;
}
class TrackDto {
  @IsIn(LEVELS) id!: Level;
  @IsObject() @ValidateNested() @Type(() => LocalizedTextDto) title!: LocalizedTextDto;
  @IsObject() @ValidateNested() @Type(() => LocalizedTextDto) description!: LocalizedTextDto;
}
class PracticeDto {
 @IsArray() @ArrayMinSize(1) @IsIn([1,2,3,4,5], {each:true}) spokenTones!: number[];
 @IsString() @Matches(/\S/) spokenPinyin!: string;
 @IsString() @Matches(/^\p{Script=Han}$/u) traceCharacter!: string;
 @IsObject() @ValidateNested() @Type(() => LocalizedTextDto) sentence!: LocalizedTextDto;
 @IsString() @Matches(/\S/) sentencePinyin!: string;
 @IsArray() @ArrayMinSize(6) @ArrayUnique() @IsString({each:true}) pinyinChoices!: string[];
 @IsObject() @ValidateNested() @Type(() => LocalizedTextDto) explanation!: LocalizedTextDto;
}
class VocabularyDto extends IdentifiedDto {
 @ValidateIf((_o,v:unknown)=>v!==undefined) @IsObject() @ValidateNested() @Type(() => PracticeDto) practice?: PracticeDto;
  @IsIn(LEVELS) level!: Level;
  @IsString() @Matches(/\S/) @MaxLength(200) simplified!: string;
  @ValidateIf((_object, value: unknown) => value !== undefined) @IsString() @Matches(/\S/) @MaxLength(200) traditional?: string;
  @IsString() @Matches(/\S/) @MaxLength(600) pinyin!: string;
  @IsArray() @ArrayMinSize(1) @ArrayUnique() @IsString({ each: true }) @Matches(/\S/, { each: true }) definitions!: string[];
  @IsString() @Matches(/\S/) @MaxLength(200) audioText!: string;
  @IsArray() @ArrayUnique() @IsString({ each: true }) @Matches(/^[a-z0-9-]+$/, { each: true }) tags!: string[];
  @IsString() @Matches(/\S/) sourceId!: string;
}
class SentenceDto extends IdentifiedDto {
  @IsIn(LEVELS) level!: Level;
  @IsString() @Matches(/\S/) @MaxLength(500) simplified!: string;
  @ValidateIf((_object, value: unknown) => value !== undefined) @IsString() @Matches(/\S/) @MaxLength(500) traditional?: string;
  @IsString() @Matches(/\S/) @MaxLength(1000) pinyin!: string;
  @IsObject() @ValidateNested() @Type(() => LocalizedTextDto) translation!: LocalizedTextDto;
  @IsArray() @ArrayUnique() @IsString({ each: true }) @Matches(/^[a-z0-9-]+$/, { each: true }) tags!: string[];
  @IsString() @Matches(/\S/) sourceId!: string;
}
class RoundTemplateDto extends IdentifiedDto {
  @IsIn(GAME_TYPES) game!: GameType;
  @IsArray() @ArrayMinSize(2) @ArrayUnique() @IsString({ each: true }) vocabularyIds!: string[];
  @IsArray() @ArrayUnique() @IsString({ each: true }) sentenceIds!: string[];
}
class LessonDto extends IdentifiedDto {
  @IsIn(LEVELS) track!: Level;
  @IsInt() @Min(1) order!: number;
  @IsObject() @ValidateNested() @Type(() => LocalizedTextDto) title!: LocalizedTextDto;
  @IsObject() @ValidateNested() @Type(() => LocalizedTextDto) goal!: LocalizedTextDto;
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => RoundTemplateDto) rounds!: RoundTemplateDto[];
}
class SeedDto {
  @Equals(1) schemaVersion!: 1;
  @IsString() @Matches(/^\d+\.\d+\.\d+$/) contentVersion!: string;
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => SourceDto) sources!: SourceDto[];
  @IsArray() @ArrayMinSize(3) @ValidateNested({ each: true }) @Type(() => TrackDto) tracks!: TrackDto[];
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => VocabularyDto) vocabulary!: VocabularyDto[];
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => SentenceDto) sentences!: SentenceDto[];
  @IsArray() @ArrayMinSize(3) @ValidateNested({ each: true }) @Type(() => LessonDto) lessons!: LessonDto[];
}

export class ContentValidationError extends Error {
  readonly code = 'INVALID_CONTENT';
  constructor(readonly details: readonly string[]) {
    super(`Content validation failed:\n${details.join('\n')}`);
    this.name = 'ContentValidationError';
  }
}

function flatten(errors: ValidationError[], prefix = ''): string[] {
  return errors.flatMap(error => {
    const path = prefix ? `${prefix}.${error.property}` : error.property;
    return [
      ...Object.values(error.constraints ?? {}).map(message => `${path}: ${message}`),
      ...flatten(error.children ?? [], path),
    ];
  });
}

function freezeDeep<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    for (const child of Object.values(value)) freezeDeep(child);
    Object.freeze(value);
  }
  return value;
}

/** Fail closed before exposing content. Does not coerce strings to numbers or strip unknown fields. */
export function validateSeed(input: unknown): ContentSeed {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new ContentValidationError(['seed: expected an object']);
  }
  const dto = plainToInstance(SeedDto, input, { enableImplicitConversion: false });
  const errors = flatten(validateSync(dto, {
    whitelist: true, forbidNonWhitelisted: true, forbidUnknownValues: true,
    validationError: { target: false, value: false },
  }));
  if (errors.length) throw new ContentValidationError(errors);

  const uniqueIds = (items: readonly { id: string }[], path: string): Set<string> => {
    const ids = new Set<string>();
    for (const item of items) {
      if (ids.has(item.id)) errors.push(`${path}: duplicate id ${item.id}`);
      ids.add(item.id);
    }
    return ids;
  };
  const sourceIds = uniqueIds(dto.sources, 'sources');
  uniqueIds(dto.tracks, 'tracks');
  uniqueIds(dto.lessons, 'lessons');
  const vocabularyIds = uniqueIds(dto.vocabulary, 'vocabulary');
  const vocabularyById = new Map(dto.vocabulary.map(word => [word.id,word]));
  const sentenceIds = uniqueIds(dto.sentences, 'sentences');
  for (const item of [...dto.vocabulary, ...dto.sentences]) {
    if (!sourceIds.has(item.sourceId)) errors.push(`${item.id}: unknown source ${item.sourceId}`);
  }
  for (const level of LEVELS) {
    if (!dto.tracks.some(track => track.id === level)) errors.push(`tracks: missing ${level}`);
    const lessons = dto.lessons.filter(lesson => lesson.track === level);
    if (!lessons.length) errors.push(`lessons: missing ${level}`);
    const orders = new Set<number>();
    for (const lesson of lessons) {
      if (orders.has(lesson.order)) errors.push(`${level}: duplicate lesson order ${lesson.order}`);
      orders.add(lesson.order);
    }
  }
  for (const lesson of dto.lessons) {
    uniqueIds(lesson.rounds, `${lesson.id}.rounds`);
    for (const round of lesson.rounds) {
      if (round.vocabularyIds.length < DIFFICULTY[lesson.track].choiceCount) {
        errors.push(`${lesson.id}.${round.id}: insufficient vocabulary for track choice count`);
      }
      for (const id of round.vocabularyIds) {
        const word = vocabularyById.get(id);
        if (word && !word.practice) errors.push(id+': missing practice content');
        if (word?.practice && !word.practice.pinyinChoices.includes(word.pinyin)) errors.push(id+': pinyin answer absent from choices');
        if (!vocabularyIds.has(id)) errors.push(`${lesson.id}.${round.id}: unknown vocabulary ${id}`);
      }
      for (const id of round.sentenceIds) {
        if (!sentenceIds.has(id)) errors.push(`${lesson.id}.${round.id}: unknown sentence ${id}`);
      }
      if (lesson.track !== 'beginner' && round.sentenceIds.length === 0) {
        errors.push(`${lesson.id}.${round.id}: contextual sentences required above beginner`);
      }
    }
  }
  if (errors.length) throw new ContentValidationError(errors);
  return freezeDeep(dto);
}
