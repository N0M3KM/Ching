import { Controller, Get, Inject, Injectable, Module, Query } from '@nestjs/common';
import { IsString, Matches, MaxLength } from 'class-validator';
import { CONTENT_REPOSITORY } from '../ports/content-repository.js';
import type { ContentRepository } from '../ports/content-repository.js';
import { DtoPipe } from '../http.js';
class DictionaryQuery { @IsString() @Matches(/\S/) @MaxLength(80) query!:string; }
@Injectable()
class DictionaryService {
 constructor(@Inject(CONTENT_REPOSITORY) private readonly repository:ContentRepository) {}
 lookup(query:string){return {entries:this.repository.lookup(query)};}
}
@Controller('api/v1/dictionary')
class DictionaryController {
 constructor(@Inject(DictionaryService) private readonly service:DictionaryService) {}
 @Get() lookup(@Query(new DtoPipe(DictionaryQuery)) q:DictionaryQuery){return this.service.lookup(q.query);}
}
@Module({controllers:[DictionaryController],providers:[DictionaryService]})
export class DictionaryModule {}
