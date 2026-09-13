import { Controller, Get, Inject, Injectable, Module, NotFoundException, Param } from '@nestjs/common';
import { IsString, Matches, MaxLength } from 'class-validator';
import { DIFFICULTY } from '@ching/contracts';
import type { LessonResponse, TracksResponse } from '@ching/contracts';
import { CONTENT_REPOSITORY } from '../ports/content-repository.js';
import type { ContentRepository } from '../ports/content-repository.js';
import { DtoPipe } from '../http.js';
export class LessonParams { @IsString() @Matches(/^[a-z0-9-]+$/) @MaxLength(80) lessonId!:string; }
@Injectable()
export class CoursesService {
 constructor(@Inject(CONTENT_REPOSITORY) private readonly repository:ContentRepository) {}
 tracks():TracksResponse {const c=this.repository.getContent();return {tracks:c.tracks.map(t=>({...t,difficulty:DIFFICULTY[t.id],lessons:c.lessons.filter(l=>l.track===t.id).sort((a,b)=>a.order-b.order).map(({id,title,order})=>({id,title,order}))}))};}
 lesson(id:string):LessonResponse {const lesson=this.repository.findLesson(id);if(!lesson)throw new NotFoundException('Lesson not found.');return {lesson,difficulty:DIFFICULTY[lesson.track],games:[...new Set(lesson.rounds.map(r=>r.game))]};}
}
@Controller('api/v1')
class CoursesController {
 constructor(@Inject(CoursesService) private readonly service:CoursesService) {}
 @Get('tracks') tracks(){return this.service.tracks();}
 @Get('lessons/:lessonId') lesson(@Param(new DtoPipe(LessonParams)) p:LessonParams){return this.service.lesson(p.lessonId);}
}
@Module({controllers:[CoursesController],providers:[CoursesService],exports:[CoursesService]})
export class CoursesModule {}
