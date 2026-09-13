import 'reflect-metadata';
import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ContentModule } from './modules/content.module.js';
import { CoursesModule } from './modules/courses.module.js';
import { DictionaryModule } from './modules/dictionary.module.js';
import { PinyinModule } from './modules/pinyin.module.js';
import { SentencesModule } from './modules/sentences.module.js';
import { HealthModule } from './modules/health.module.js';
import { MinigamesModule } from './modules/minigames.module.js';
import { TtsModule } from './modules/tts.module.js';
import {StrokesModule} from './modules/strokes.module.js';
import { ErrorFilter } from './http.js';
@Module({imports:[ContentModule,StrokesModule,CoursesModule,DictionaryModule,PinyinModule,SentencesModule,HealthModule,MinigamesModule,TtsModule]})
export class AppModule {}
export async function createApp(){
 const app=await NestFactory.create(AppModule,{logger:false,abortOnError:false});
 app.useGlobalFilters(new ErrorFilter());
 await app.init();
 return app;
}
