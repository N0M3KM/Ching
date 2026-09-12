import { Controller, Get, Inject, Injectable, Module, Query } from '@nestjs/common';
import { IsString, Matches, MaxLength } from 'class-validator';
import { pinyin } from 'pinyin-pro';
import { DtoPipe } from '../http.js';
class PinyinQuery { @IsString() @Matches(/\S/) @MaxLength(200) text!:string; }
@Injectable()
class PinyinService {convert(text:string){return {text,pinyin:pinyin(text)};}}
@Controller('api/v1/pinyin')
class PinyinController {
 constructor(@Inject(PinyinService) private readonly service:PinyinService) {}
 @Get() convert(@Query(new DtoPipe(PinyinQuery)) q:PinyinQuery){return this.service.convert(q.text);}
}
@Module({controllers:[PinyinController],providers:[PinyinService]})
export class PinyinModule {}
