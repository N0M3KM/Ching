import {useEffect,useRef,useState} from 'react';
import HanziWriter from 'hanzi-writer';
import {z} from 'zod';
import type {Level,Locale} from '@ching/contracts';
import {copy} from './i18n.js';
const dataSchema=z.object({strokes:z.array(z.string()),medians:z.array(z.array(z.tuple([z.number(),z.number()]))),radStrokes:z.array(z.number()).default([])});
export function Trace({character,level,locale,onReady}:{character:string;level:Level;locale:Locale;onReady:()=>void}){
 const c=copy(locale),element=useRef<HTMLDivElement>(null),writer=useRef<HanziWriter|null>(null),ready=useRef(onReady);
 ready.current=onReady;
 const [error,setError]=useState(false),[loaded,setLoaded]=useState(false),[attempt,setAttempt]=useState(0),[done,setDone]=useState(false);
 useEffect(()=>{
  let active=true;const abort=new AbortController();
  setLoaded(false);setError(false);setDone(false);
  if(!element.current)return;
  const host=element.current;
  const instance=HanziWriter.create(host,character,{width:220,height:220,padding:16,showCharacter:false,showOutline:level==='beginner',strokeColor:'#2C2623',highlightColor:'#D9531E',outlineColor:'#b9aaa3',strokeAnimationSpeed:3,delayBetweenStrokes:70,
   charDataLoader:(_char,onComplete,onError)=>{
    fetch('/strokes/'+encodeURIComponent(character)+'.json',{signal:abort.signal}).then(r=>{if(!r.ok)throw new Error('Missing strokes');return r.json() as Promise<unknown>;}).then(raw=>{
     const data=dataSchema.parse(raw);if(active){onComplete(data);setLoaded(true);}
    }).catch(error=>{if(active){setError(true);onError(error);}});
   },
  });writer.current=instance;
  return ()=>{active=false;abort.abort();instance.cancelQuiz();host.replaceChildren();writer.current=null;};
 },[character,level,attempt]);
 const finish=()=>{if(level==='advanced')void writer.current?.hideCharacter();setDone(true);ready.current();};
 return <section className="trace-panel">
  <div className="trace-board" ref={element} role="img" aria-label={c.character}/>
  <p className="muted">{c.traceHint}</p>
  {error?<p role="alert">{c.traceError} <button onClick={()=>setAttempt(v=>v+1)}>{c.retry}</button></p>:<div className="button-row">
   <button disabled={!loaded} onClick={()=>{writer.current?.cancelQuiz();void writer.current?.animateCharacter({onComplete:finish});}}>{c.watch}</button>
   <button disabled={!loaded} onClick={()=>{writer.current?.quiz({showHintAfterMisses:level==='beginner'?1:3,onComplete:finish});}}>{c.trace}</button>
  </div>}
  {done?<p role="status">{c.traceDone}</p>:null}
 </section>;
}
