import { BadRequestException, Body, Controller, Inject, Injectable, Module, NotFoundException, Param, Post } from '@nestjs/common';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsInt, IsString, Matches, Max, MaxLength, Min, ValidateIf, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { randomInt } from 'node:crypto';
import { GAME_TYPES } from '@ching/contracts';
import type { GameType, RoundAnswer } from '@ching/contracts';
import { ToneMatchEngine, PinyinMatchEngine, ListenPickEngine, CharacterTraceEngine, GameInputError } from '@ching/game-core';
import { CONTENT_REPOSITORY } from '../ports/content-repository.js';
import type { ContentRepository } from '../ports/content-repository.js';
import { DtoPipe } from '../http.js';
class CreateDto {
 @IsString() @Matches(/^[a-z0-9-]+$/) @MaxLength(80) lessonId!:string;
 @IsIn(GAME_TYPES) game!:GameType;
 @ValidateIf((_o,v:unknown)=>v!==undefined) @IsInt() @Min(0) @Max(4294967295) seed?:number;
}
class SessionParams { @IsString() @Matches(/^c1~\d+\.\d+\.\d+~[a-z0-9-]+~[a-z-]+~\d{1,10}$/) @MaxLength(180) id!:string; }
class AnswerDto implements RoundAnswer {
 @IsString() @Matches(/^r\d{1,2}$/) roundId!:string;
 @ValidateIf((_o,v:unknown)=>v!==null) @IsString() @Matches(/^a\d$/) answerId!:string|null;
 @IsInt() @Min(0) @Max(3600000) elapsedMs!:number;
}
class GradeDto { @IsArray() @ArrayMinSize(1) @ArrayMaxSize(10) @ValidateNested({each:true}) @Type(()=>AnswerDto) answers!:AnswerDto[]; }
@Injectable()
export class MinigamesService {
 private readonly engines=[new ToneMatchEngine(),new PinyinMatchEngine(),new ListenPickEngine(),new CharacterTraceEngine()];
 constructor(@Inject(CONTENT_REPOSITORY) private readonly repository:ContentRepository){}
 create(dto:CreateDto){
  const lesson=this.repository.findLesson(dto.lessonId);
  if(!lesson)throw new NotFoundException('Lesson not found.');
  const engine=this.engines.find(e=>e.game===dto.game);
  if(!engine)throw new BadRequestException('Unknown game.');
  return engine.generate({lesson,seed:dto.seed??randomInt(0,4294967296),content:this.repository.getContent()});
 }
 grade(id:string,answers:readonly RoundAnswer[]){
  const [,version,lessonId,game,seed]=id.split('~');
  if(version!==this.repository.getContent().contentVersion)throw new BadRequestException({code:'SESSION_EXPIRED',message:'Content has changed. Start a new session.'});
  if(!lessonId||!GAME_TYPES.includes(game as GameType))throw new BadRequestException('Invalid session.');
  const session=this.create({lessonId,game:game as GameType,seed:Number(seed)});
  try{return this.engines.find(e=>e.game===session.game)!.grade(session,answers,this.repository.getContent());}
  catch(error){if(error instanceof GameInputError)throw new BadRequestException({code:'INVALID_ANSWER',message:error.message});throw error;}
 }
}
@Controller('api/v1/minigames/sessions')
class MinigamesController {
 constructor(@Inject(MinigamesService) private readonly service:MinigamesService){}
 @Post() create(@Body(new DtoPipe(CreateDto)) dto:CreateDto){return this.service.create(dto);}
 @Post(':id/grade') grade(@Param(new DtoPipe(SessionParams)) params:SessionParams,@Body(new DtoPipe(GradeDto)) dto:GradeDto){return this.service.grade(params.id,dto.answers);}
}
@Module({controllers:[MinigamesController],providers:[MinigamesService]})
export class MinigamesModule {}
