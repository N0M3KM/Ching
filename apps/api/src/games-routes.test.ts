import {afterAll,beforeAll,expect,it} from 'vitest';
import request from 'supertest';
import type {INestApplication} from '@nestjs/common';
import {createApp} from './app.js';
let app:INestApplication;
beforeAll(async()=>{app=await createApp();});afterAll(async()=>{await app.close();});
it('creates reproducible sessions and grades without stored sessions',async()=>{
 const body={lessonId:'advanced-01',game:'tone-match',seed:12};
 const a=await request(app.getHttpServer()).post('/api/v1/minigames/sessions').send(body);
 const b=await request(app.getHttpServer()).post('/api/v1/minigames/sessions').send(body);
 expect(a.status).toBe(201);expect(a.body).toEqual(b.body);expect(a.body.rounds).toHaveLength(10);
 const result=await request(app.getHttpServer()).post('/api/v1/minigames/sessions/'+a.body.id+'/grade').send({answers:[{roundId:'r0',answerId:null,elapsedMs:0}]});
 expect(result.status).toBe(201);expect(result.body.completed).toBe(false);expect(result.body.rounds).toHaveLength(1);
});
it.each([{lessonId:'beginner-01',game:'unknown'},{lessonId:'beginner-01',game:'tone-match',seed:-1},{lessonId:'beginner-01',game:'tone-match',seed:'1'},{lessonId:'beginner-01',game:'tone-match',extra:1}])('rejects invalid create payload',async body=>{
 expect((await request(app.getHttpServer()).post('/api/v1/minigames/sessions').send(body)).status).toBe(400);
});
it('rejects invalid grade IDs and nested payloads',async()=>{
 const s=await request(app.getHttpServer()).post('/api/v1/minigames/sessions').send({lessonId:'beginner-01',game:'tone-match'});
 for(const answers of [[{roundId:'r0',answerId:'a9',elapsedMs:0}],[{roundId:'r0',elapsedMs:0}],[],[{roundId:'r0',answerId:null,elapsedMs:-1}]]){
  expect((await request(app.getHttpServer()).post('/api/v1/minigames/sessions/'+s.body.id+'/grade').send({answers})).status).toBe(400);
 }
 expect((await request(app.getHttpServer()).post('/api/v1/minigames/sessions/invalid/grade').send({answers:[]})).status).toBe(400);
});
