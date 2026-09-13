import { Controller, Get, Inject, Injectable, Module, Query } from '@nestjs/common';
import { IsString, Matches, MaxLength } from 'class-validator';
import { CONTENT_REPOSITORY } from '../ports/content-repository.js';
import type { ContentRepository } from '../ports/content-repository.js';
import {DICTIONARY_REPOSITORY} from '../ports/dictionary-repository.js';
import type {DictionaryRepository} from '../ports/dictionary-repository.js';
import {CedictRepository} from '../adapters/cedict.repository.js';
import { DtoPipe } from '../http.js';
class DictionaryQuery { @IsString() @Matches(/\S/) @MaxLength(80) query!:string; }
@Injectable()
class DictionaryService {
 constructor(@Inject(DICTIONARY_REPOSITORY) private readonly repository:DictionaryRepository) {}
 lookup(query:string){return {entries:this.repository.lookup(query)};}
}
@Controller('api/v1/dictionary')
class DictionaryController {
 constructor(@Inject(DictionaryService) private readonly service:DictionaryService) {}
 @Get() lookup(@Query(new DtoPipe(DictionaryQuery)) q:DictionaryQuery){return this.service.lookup(q.query);}
}
@Module({controllers:[DictionaryController],providers:[DictionaryService,{provide:DICTIONARY_REPOSITORY,inject:[CONTENT_REPOSITORY],useFactory:(content:ContentRepository)=>new CedictRepository(content.getContent().vocabulary)}]})
export class DictionaryModule {}
