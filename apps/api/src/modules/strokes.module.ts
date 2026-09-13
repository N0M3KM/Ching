import {Controller,Get,Module,Param,NotFoundException,Inject,Injectable} from '@nestjs/common';
import {IsString,Matches} from 'class-validator';
import {DtoPipe} from '../http.js';
import {STROKE_REPOSITORY} from '../ports/stroke-repository.js';
import type {StrokeRepository} from '../ports/stroke-repository.js';
import {StaticStrokeRepository} from '../adapters/static-stroke.repository.js';
class StrokeParams {@IsString() @Matches(/^\p{Script=Han}$/u) character!:string;}
@Injectable()
class StrokesService {
 constructor(@Inject(STROKE_REPOSITORY) private readonly repository:StrokeRepository){}
 find(character:string){const result=this.repository.find(character);if(!result)throw new NotFoundException('Stroke data unavailable');return result;}
}
@Controller('api/v1/strokes')
class StrokesController {
 constructor(@Inject(StrokesService) private readonly service:StrokesService){}
 @Get(':character') get(@Param(new DtoPipe(StrokeParams)) params:StrokeParams){return this.service.find(params.character);}
}
@Module({controllers:[StrokesController],providers:[StrokesService,{provide:STROKE_REPOSITORY,useClass:StaticStrokeRepository}]})
export class StrokesModule {}
