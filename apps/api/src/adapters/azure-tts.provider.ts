import type {TtsRequest,TtsResponse} from '@ching/contracts';
import type {TtsProvider} from '../ports/tts-provider.js';
const escapeXml=(text:string)=>text.replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]!));
export class AzureTtsProvider implements TtsProvider {
 constructor(private readonly key:string,private readonly region:string){}
 async synthesize(request:TtsRequest,signal:AbortSignal):Promise<TtsResponse>{
  if(!/^[a-z0-9]+$/.test(this.region)||!this.key)throw new Error('TTS configuration is missing.');
  const voice=(!request.voice||request.voice==='cmn')?'zh-CN-XiaoxiaoNeural':request.voice;
  const response=await fetch('https://'+this.region+'.tts.speech.microsoft.com/cognitiveservices/v1',{
   method:'POST',signal,headers:{'Ocp-Apim-Subscription-Key':this.key,'Content-Type':'application/ssml+xml','X-Microsoft-OutputFormat':'audio-16khz-128kbitrate-mono-mp3'},
   body:'<speak version="1.0" xml:lang="zh-CN"><voice name="'+escapeXml(voice)+'">'+escapeXml(request.text)+'</voice></speak>',
  });
  if(!response.ok)throw new Error('TTS provider unavailable.');
  const reader=response.body?.getReader();if(!reader)throw new Error('Empty audio.');
  const chunks:Uint8Array[]=[];let size=0;
  try{while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>2000000)throw new Error('Audio limit exceeded.');chunks.push(part.value);}}
  finally{await reader.cancel();}
  if(!size)throw new Error('Empty audio.');
  return {audioBase64:Buffer.concat(chunks).toString('base64'),mimeType:'audio/mpeg',transcript:request.text};
 }
}
export class UnavailableTtsProvider implements TtsProvider {
 async synthesize():Promise<TtsResponse>{throw new Error('Configure a TTS provider.');}
}
