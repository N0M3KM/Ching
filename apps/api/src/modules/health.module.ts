import { Controller, Get, Inject, Injectable, Module } from '@nestjs/common';
import { CONTENT_REPOSITORY } from '../ports/content-repository.js';
import type { ContentRepository } from '../ports/content-repository.js';
@Injectable()
class HealthService {
 constructor(@Inject(CONTENT_REPOSITORY) private readonly repository:ContentRepository) {}
 status(){return {status:'ok',contentVersion:this.repository.getContent().contentVersion};}
}
@Controller('healthz')
class HealthController {
 constructor(@Inject(HealthService) private readonly service:HealthService) {}
 @Get() status(){return this.service.status();}
}
@Module({controllers:[HealthController],providers:[HealthService]})
export class HealthModule {}
