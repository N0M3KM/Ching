import { Body, Controller, HttpException, Inject, Injectable, Module, Post, Req, ServiceUnavailableException } from '@nestjs/common';
import { IsIn, IsString, Matches, MaxLength, ValidateIf } from 'class-validator';
import {createHash} from 'node:crypto';
import type {Request} from 'express';
import type {TtsRequest,TtsResponse} from '@ching/contracts';
import {TTS_PROVIDER} from '../ports/tts-provider.js';
import type {TtsProvider} from '../ports/tts-provider.js';
import {AzureTtsProvider,UnavailableTtsProvider} from '../adapters/azure-tts.provider.js';
import {DtoPipe} from '../http.js';
class TtsDto implements TtsRequest {
 @IsString() @Matches(/\S/) @MaxLength(200) text!:string;
 @ValidateIf((_o,v:unknown)=>v!==undefined) @IsIn(['zh-CN-XiaoxiaoNeural','zh-CN-YunxiNeural']) voice?:string;
}
@Injectable()
export class TtsService {
 private readonly cache=new Map<string,{expires:number;value:TtsResponse}>();
 private readonly rates=new Map<string,{expires:number;count:number}>();
 private active=0;
 constructor(@Inject(TTS_PROVIDER) private readonly provider:TtsProvider){}
 async speak(request:TtsRequest,client:string):Promise<TtsResponse>{
  const now=Date.now();
  for(const [key,value] of this.rates)if(value.expires<=now)this.rates.delete(key);
  const rate=this.rates.get(client);
  if((rate?.count??0)>=12||(!rate&&this.rates.size>=1000))throw new HttpException({code:'TTS_RATE_LIMIT',message:'Too many audio requests. Please retry in one minute.'},429);
  this.rates.set(client,{expires:rate?.expires??now+60000,count:(rate?.count??0)+1});
  const normalized={text:request.text.trim(),voice:request.voice??'zh-CN-XiaoxiaoNeural'};
  const key=createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
  for(const [id,value] of this.cache)if(value.expires<=now)this.cache.delete(id);
  const cached=this.cache.get(key);if(cached)return cached.value;
  if(this.active>=4)throw new HttpException({code:'TTS_BUSY',message:'Audio is busy. Please retry shortly.'},429);
  this.active++;const controller=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined;
  try{
   const value=await Promise.race([this.provider.synthesize(normalized,controller.signal),new Promise<never>((_resolve,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new Error('Timeout'));},8000);})]);
   if(!value.audioBase64||value.audioBase64.length>2800000||!['audio/mpeg','audio/wav','audio/ogg'].includes(value.mimeType))throw new Error('Invalid audio.');
   const result={...value,transcript:normalized.text};
   if(this.cache.size>=128)this.cache.delete(this.cache.keys().next().value!);
   this.cache.set(key,{expires:Date.now()+300000,value:result});
   return result;
  }catch{throw new ServiceUnavailableException({code:'TTS_UNAVAILABLE',message:'Audio is temporarily unavailable. Use the transcript or retry playback.'});}
  finally{if(timer)clearTimeout(timer);controller.abort();this.active--;}
 }
}
@Controller('api/v1/tts')
class TtsController {
 constructor(@Inject(TtsService) private readonly service:TtsService){}
 @Post() speak(@Body(new DtoPipe(TtsDto)) dto:TtsDto,@Req() request:Request){return this.service.speak(dto,request.ip??'local');}
}
@Module({controllers:[TtsController],providers:[
 {provide:TTS_PROVIDER,useFactory:()=>process.env.TTS_PROVIDER==='azure'?new AzureTtsProvider(process.env.AZURE_SPEECH_KEY??'',process.env.AZURE_SPEECH_REGION??''):new UnavailableTtsProvider()},
 TtsService,
],exports:[TtsService]})
export class TtsModule {}
