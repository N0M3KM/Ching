import type {TtsRequest,TtsResponse} from '@ching/contracts';
import type {TtsProvider} from '../ports/tts-provider.js';
export const QWEN_PROFILE = Object.freeze({
 model:'Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice',language:'Chinese',speaker:'Serena',
 instruct:'请使用标准普通话，以端庄、正式的女性旁白语气朗读。吐字清晰，语速平稳自然，语调克制，不要夸张表演。',
});
export class QwenTtsProvider implements TtsProvider {
 constructor(private readonly baseUrl:string,private readonly key:string) {
  const url=new URL(baseUrl);
  if(url.protocol!=='https:' && !(url.protocol==='http:' && ['127.0.0.1','localhost','[::1]'].includes(url.hostname))) throw new Error('Qwen endpoint requires HTTPS or loopback HTTP');
  if(url.username||url.password||url.search||url.hash)throw new Error('Invalid Qwen endpoint URL');
 }
 async synthesize(request:TtsRequest,signal:AbortSignal):Promise<TtsResponse> {
  if(request.voice && request.voice!=='cmn')throw new Error('Qwen uses a fixed Mandarin voice');
  const response=await fetch(this.baseUrl.replace(/\/$/,'')+'/synthesize',{
   method:'POST',signal,headers:{'Content-Type':'application/json',...(this.key?{Authorization:'Bearer '+this.key}:{})},
   body:JSON.stringify({text:request.text,...QWEN_PROFILE}),
  });
  if(!response.ok || !response.headers.get('content-type')?.startsWith('audio/wav'))throw new Error('Qwen synthesis unavailable');
  const reader=response.body?.getReader();if(!reader)throw new Error('Missing Qwen audio');
  const chunks:Uint8Array[]=[];let length=0;
  try {while(true){const part=await reader.read();if(part.done)break;length+=part.value.length;if(length>2000000)throw new Error('Qwen audio too large');chunks.push(part.value);}}
  finally{await reader.cancel();}
  const bytes=Buffer.concat(chunks);
  if(bytes.length<=44 || bytes.toString('ascii',0,4)!=='RIFF' || bytes.toString('ascii',8,12)!=='WAVE')throw new Error('Invalid Qwen WAV');
  return {audioBase64:bytes.toString('base64'),mimeType:'audio/wav',transcript:request.text};
 }
}
/** Reserve time inside the existing eight-second service deadline for the fallback. */
export class FallbackTtsProvider implements TtsProvider {
 constructor(private readonly primary:TtsProvider,private readonly fallback:TtsProvider,private readonly primaryTimeoutMs=5500){}
 async synthesize(request:TtsRequest,signal:AbortSignal):Promise<TtsResponse> {
  const controller=new AbortController();
  const abort=()=>controller.abort();
  signal.addEventListener('abort',abort,{once:true});if(signal.aborted)controller.abort();
  let timer:ReturnType<typeof setTimeout>|undefined;
  try {
   return await Promise.race([this.primary.synthesize(request,controller.signal),new Promise<never>((_resolve,reject)=>{
    timer=setTimeout(()=>{controller.abort();reject(new Error('Primary timeout'));},this.primaryTimeoutMs);
   })]);
  } catch {
   if(signal.aborted)throw new Error('Cancelled');
   return this.fallback.synthesize({text:request.text},signal);
  } finally {if(timer)clearTimeout(timer);controller.abort();signal.removeEventListener('abort',abort);}
 }
}
