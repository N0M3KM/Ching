import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { createApp } from './app.js';
let app:INestApplication;
beforeAll(async()=>{app=await createApp();},30000);
afterAll(async()=>{await app.close();});
describe('content routes',()=>{
 it.each(['/healthz','/api/v1/tracks','/api/v1/lessons/hsk3-beginner-001','/api/v1/dictionary?query=water','/api/v1/pinyin?text=你好','/api/v1/sentences?level=advanced&tag=register'])('GET %s',async path=>{
  const r=await request(app.getHttpServer()).get(encodeURI(path));expect(r.status).toBe(200);
 });
 it.each(['/api/v1/dictionary','/api/v1/dictionary?query=','/api/v1/pinyin?text=','/api/v1/sentences?level=expert','/api/v1/sentences?extra=1'])('rejects %s',async path=>{
  const r=await request(app.getHttpServer()).get(path);expect(r.status).toBe(400);expect(r.body.code).toBe('VALIDATION_ERROR');
 });
 it('returns standard errors for missing resources',async()=>{
  const r=await request(app.getHttpServer()).get('/api/v1/lessons/missing');expect(r.status).toBe(404);expect(r.body).toMatchObject({code:'HTTP_404'});
 });
});
