import { Controller, Get, Inject, Injectable, Module, Query } from '@nestjs/common';
import { IsIn, IsString, Matches, MaxLength, ValidateIf } from 'class-validator';
import { LEVELS } from '@ching/contracts';
import type { Level } from '@ching/contracts';
import { CONTENT_REPOSITORY } from '../ports/content-repository.js';
import type { ContentRepository } from '../ports/content-repository.js';
import { DtoPipe } from '../http.js';
class SentenceQuery {
 @ValidateIf((_o,v:unknown)=>v!==undefined) @IsIn(LEVELS) level?:Level;
 @ValidateIf((_o,v:unknown)=>v!==undefined) @IsString() @Matches(/^[a-z0-9-]+$/) @MaxLength(60) tag?:string;
}
@Injectable()
class SentencesService {
 constructor(@Inject(CONTENT_REPOSITORY) private readonly repository:ContentRepository) {}
 find(q:SentenceQuery){return {sentences:this.repository.findSentences(q)};}
}
@Controller('api/v1/sentences')
class SentencesController {
 constructor(@Inject(SentencesService) private readonly service:SentencesService) {}
 @Get() find(@Query(new DtoPipe(SentenceQuery)) q:SentenceQuery){return this.service.find(q);}
}
@Module({controllers:[SentencesController],providers:[SentencesService]})
export class SentencesModule {}
