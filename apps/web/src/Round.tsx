import {useCallback,useEffect,useRef,useState} from 'react';
import type {GameRound,GameType,Level,Locale,RoundAnswer,RoundResult} from '@ching/contracts';
import {copy} from './i18n.js';
import {api,ttsSchema} from './schemas.js';
import {Trace} from './Trace.js';
export function Round({round,game,level,locale,feedback,onAnswer,onNext,last}:{round:GameRound;game:GameType;level:Level;locale:Locale;feedback:RoundResult|null;onAnswer:(answer:RoundAnswer)=>Promise<void>;onNext:()=>void;last:boolean}){
 const c=copy(locale),[started]=useState(()=>Date.now()),[remaining,setRemaining]=useState(round.timeLimitSeconds),[selected,setSelected]=useState<string|null>(null);
 const [busy,setBusy]=useState(false),[error,setError]=useState(false),[showPinyin,setShowPinyin]=useState(level==='beginner'),[traceReady,setTraceReady]=useState(game!=='character-trace');
 const [audioBusy,setAudioBusy]=useState(false),[audioError,setAudioError]=useState(false),[audioUrl,setAudioUrl]=useState<string>();
 const audio=useRef<HTMLAudioElement>(null),pending=useRef<RoundAnswer|null>(null),locked=useRef(false),alive=useRef(true);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;audio.current?.pause();};},[]);
 const submit=useCallback(async(answerId:string|null)=>{
  if(locked.current)return;locked.current=true;
  const answer=pending.current??{roundId:round.id,answerId,elapsedMs:Math.min(3600000,Date.now()-started)};
  pending.current=answer;setSelected(answer.answerId);setBusy(true);setError(false);
  try{await onAnswer(answer);}catch{if(alive.current){setError(true);locked.current=false;}}
  finally{if(alive.current)setBusy(false);}
 },[round.id,started,onAnswer]);
 useEffect(()=>{
  if(round.timeLimitSeconds===null||feedback||pending.current)return;
  const timer=setInterval(()=>{const left=Math.max(0,round.timeLimitSeconds!*1000-(Date.now()-started));setRemaining(Math.ceil(left/1000));if(left===0)void submit(null);},200);
  return()=>clearInterval(timer);
 },[round.timeLimitSeconds,started,feedback,submit]);
 const play=async()=>{
  setAudioBusy(true);setAudioError(false);
  try{const response=await api('tts',ttsSchema,{text:round.audioText??round.transcript});
   if(alive.current)setAudioUrl('data:'+response.mimeType+';base64,'+response.audioBase64);
  }catch{if(alive.current)setAudioError(true);}finally{if(alive.current)setAudioBusy(false);}
 };
 const disabled=busy||Boolean(feedback)||pending.current!==null;
 return <div className="round-body">
  <div className="round-top"><span className="eyebrow">{c.study}</span><span className="timer" role="timer">{remaining===null?c.untimed:remaining+' '+c.seconds}</span></div>
  <h1 className="round-heading">{round.prompt[locale]}</h1>
  <div className="audio-row"><button onClick={()=>void play()} disabled={audioBusy}>{audioBusy?c.loading:'▷ '+c.play}</button>
   {audioUrl?<audio ref={audio} controls autoPlay src={audioUrl} aria-label={c.play}/>:null}</div>
  {audioError?<p role="alert" className="notice">{c.audioError}</p>:null}
  {game==='listen-pick'?<details><summary>{c.transcript}</summary><p lang="zh-Hans" className="hanzi-small">{round.transcript}</p><p>{round.pinyin}</p></details>:<>
   {game!=='character-trace'?<p lang="zh-Hans" className="hanzi">{round.transcript}</p>:null}
   {level!=='beginner'?<label className="toggle"><input type="checkbox" checked={showPinyin} onChange={e=>setShowPinyin(e.target.checked)}/>{c.pinyin}</label>:null}
   {showPinyin?<p className="pinyin">{round.pinyin}</p>:null}
  </>}
  {game==='character-trace'&&round.traceCharacter?<Trace character={round.traceCharacter} level={level} locale={locale} onReady={()=>setTraceReady(true)}/>:null}
  <fieldset className="answer-field"><legend>{c.answer}</legend><div className={'answers '+(game==='tone-match'?'tone-answers':'')}>
   {round.options.map(option=><button className={'answer '+(selected===option.id?'selected ':'')+(feedback?.correctAnswerId===option.id?'correct-answer':'')} key={option.id} disabled={disabled||!traceReady} onClick={()=>void submit(option.id)}>
    {option.label[locale]}{feedback?.correctAnswerId===option.id?<span className="sr-only"> — {c.showAnswer}</span>:null}
   </button>)}
  </div></fieldset>
  {error?<p role="alert" className="notice">{c.error} <button onClick={()=>void submit(pending.current?.answerId??null)}>{c.retry}</button></p>:null}
  {feedback?<section className={'feedback '+(feedback.correct?'success':'')} aria-live="polite">
   <strong>{feedback.correct?'✓ '+c.correct:'↺ '+c.incorrect}</strong>
   <p>{c.showAnswer}: {round.options.find(o=>o.id===feedback.correctAnswerId)?.label[locale]}</p>
   <p>{feedback.explanation[locale]}</p>
   <button className="primary" onClick={onNext}>{last?c.results:c.next} →</button>
  </section>:<button className="quiet" disabled={disabled} onClick={()=>void submit(null)}>{c.skip}</button>}
 </div>;
}
