import {afterEach,expect,it,vi} from 'vitest';
import {QwenTtsProvider,FallbackTtsProvider,QWEN_PROFILE} from './qwen-tts.provider.js';
const wav=Buffer.alloc(48);wav.write('RIFF');wav.write('WAVE',8);
afterEach(()=>{vi.unstubAllGlobals();vi.useRealTimers();});
it('sends the fixed native Chinese female formal profile to the private bridge',async()=>{
 const fetcher=vi.fn().mockResolvedValue(new Response(wav,{headers:{'Content-Type':'audio/wav'}}));vi.stubGlobal('fetch',fetcher);
 const response=await new QwenTtsProvider('https://speech.example.test','test-key').synthesize({text:'你好'},new AbortController().signal);
 const [url,init]=fetcher.mock.calls[0]!;
 expect(url).toBe('https://speech.example.test/synthesize');
 expect(JSON.parse(init.body)).toEqual({text:'你好',...QWEN_PROFILE});
 expect(init.headers.Authorization).toBe('Bearer test-key');
 expect(QWEN_PROFILE.speaker).toBe('Serena');expect(QWEN_PROFILE.language).toBe('Chinese');
 expect(response.mimeType).toBe('audio/wav');
});
it('rejects unsafe endpoints, invalid voice, failed responses and non-WAV data',async()=>{
 expect(()=>new QwenTtsProvider('http://external.example','')).toThrow();
 const provider=new QwenTtsProvider('http://127.0.0.1:8000','');
 await expect(provider.synthesize({text:'你好',voice:'other'},new AbortController().signal)).rejects.toThrow();
 for(const response of [new Response('failure',{status:503}),new Response('not audio',{headers:{'Content-Type':'audio/wav'}})]){
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue(response));
  await expect(provider.synthesize({text:'你好'},new AbortController().signal)).rejects.toThrow();
 }
});
it('reserves time for fallback even when the primary ignores abort',async()=>{
 vi.useFakeTimers();
 const fallback={synthesize:vi.fn().mockResolvedValue({audioBase64:'audio',mimeType:'audio/wav',transcript:'你好'})};
 const provider=new FallbackTtsProvider({synthesize:()=>new Promise(()=>{})},fallback);
 const pending=provider.synthesize({text:'你好'},new AbortController().signal);
 await vi.advanceTimersByTimeAsync(5501);await pending;expect(fallback.synthesize).toHaveBeenCalledOnce();
});
it('does not fallback after the caller cancels',async()=>{
 const controller=new AbortController();controller.abort();
 const fallback={synthesize:vi.fn()};
 await expect(new FallbackTtsProvider({synthesize:async()=>{throw new Error('offline');}},fallback).synthesize({text:'你好'},controller.signal)).rejects.toThrow('Cancelled');
 expect(fallback.synthesize).not.toHaveBeenCalled();
});
