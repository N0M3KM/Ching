import {afterEach,expect,it,vi} from 'vitest';
import request from 'supertest';
import {TtsService} from './modules/tts.module.js';
import {createApp} from './app.js';
const payload={audioBase64:'YXVkaW8=',mimeType:'audio/mpeg' as const,transcript:'你好'};
afterEach(()=>vi.useRealTimers());
it('caches by text and voice, expires entries, and bounds cache size',async()=>{
 vi.useFakeTimers();const synthesize=vi.fn().mockResolvedValue(payload);const service=new TtsService({synthesize});
 await service.speak({text:'你好'},'a');await service.speak({text:'你好'},'a');expect(synthesize).toHaveBeenCalledTimes(1);
 await service.speak({text:'你好',voice:'zh-CN-YunxiNeural'},'b');expect(synthesize).toHaveBeenCalledTimes(2);
 await vi.advanceTimersByTimeAsync(300001);await service.speak({text:'你好'},'a');expect(synthesize).toHaveBeenCalledTimes(3);
 for(let i=0;i<129;i++)await service.speak({text:'text'+i},'client'+i);
 await service.speak({text:'你好'},'a');expect(synthesize).toHaveBeenCalledTimes(133);
});
it('times out a provider that ignores cancellation',async()=>{
 vi.useFakeTimers();const service=new TtsService({synthesize:()=>new Promise(()=>{})});
 const pending=expect(service.speak({text:'你好'},'a')).rejects.toMatchObject({status:503});
 await vi.advanceTimersByTimeAsync(8001);await pending;
});
it('limits requests per client',async()=>{
 const service=new TtsService({synthesize:async()=>payload});
 for(let i=0;i<12;i++)await service.speak({text:'你好'},'a');
 await expect(service.speak({text:'你好'},'a')).rejects.toMatchObject({status:429});
});
it('returns validated errors and provider unavailable response over HTTP',async()=>{
 const old=process.env.TTS_PROVIDER;process.env.TTS_PROVIDER='disabled';
 const app=await createApp();
 try{
  for(const body of [{text:''},{text:'a'.repeat(201)},{text:'你好',voice:'bad'},{text:'你好',secret:'x'}]){
   const r=await request(app.getHttpServer()).post('/api/v1/tts').send(body);expect(r.status).toBe(400);
  }
  const r=await request(app.getHttpServer()).post('/api/v1/tts').send({text:'你好'});
  expect(r.status).toBe(503);expect(r.body.code).toBe('TTS_UNAVAILABLE');expect(r.body.message).toContain('retry');
 }finally{await app.close();if(old===undefined)delete process.env.TTS_PROVIDER;else process.env.TTS_PROVIDER=old;}
},20000);
