import { Global, Module } from '@nestjs/common';
import { StaticContentRepository } from '../adapters/static-content/static-content.repository.js';
import { CONTENT_REPOSITORY } from '../ports/content-repository.js';
@Global()
@Module({providers:[{provide:CONTENT_REPOSITORY,useFactory:()=>StaticContentRepository.fromFile(new URL('../content/data/content.v1.json',import.meta.url))}],exports:[CONTENT_REPOSITORY]})
export class ContentModule {}
