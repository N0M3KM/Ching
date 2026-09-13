import { Global, Module } from '@nestjs/common';
import {hskContentRepository} from '../adapters/hsk-content.repository.js';
import { CONTENT_REPOSITORY } from '../ports/content-repository.js';
@Global()
@Module({providers:[{provide:CONTENT_REPOSITORY,useFactory:hskContentRepository}],exports:[CONTENT_REPOSITORY]})
export class ContentModule {}
