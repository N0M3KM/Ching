import {useEffect, useRef, useState} from 'react';
import type {Locale} from '@ching/contracts';
import {api, ttsSchema} from './schemas.js';
import {copy} from './i18n.js';
export function AudioPlayer({text, locale}: {text: string; locale: Locale}) {
 const c = copy(locale), audio = useRef<HTMLAudioElement>(null), alive = useRef(true);
 const source = useRef<{text: string; url: string} | null>(null);
 const [busy, setBusy] = useState(false), [error, setError] = useState(false), [ready, setReady] = useState(false);
 useEffect(() => {
  alive.current = true;
  const element = audio.current;
  return () => {alive.current = false; element?.pause();};
 }, []);
 async function play() {
  if (busy) return;
  setBusy(true); setError(false);
  try {
   let url = source.current?.text === text ? source.current.url : undefined;
   if (!url) {
    const response = await api('tts', ttsSchema, {text});
    url = 'data:' + response.mimeType + ';base64,' + response.audioBase64;
   }
   if (!alive.current || !audio.current) return;
   source.current = {text, url};
   const element = audio.current;
   if (element.src !== url) element.src = url;
   element.currentTime = 0; setReady(true);
   try { await element.play(); }
   catch (failure) {
    // A second gesture may be required after a network request; retain native controls.
    if (!(failure instanceof DOMException && failure.name === 'NotAllowedError')) throw failure;
   }
  } catch {if (alive.current) setError(true);}
  finally {if (alive.current) setBusy(false);}
 }
 return <>
  <div className="audio-row">
   <button type="button" onClick={() => void play()} disabled={busy}>{busy ? c.loading : '▶ ' + c.play}</button>
   <audio ref={audio} controls hidden={!ready} aria-label={c.play} onError={() => setError(true)}/>
  </div>
  {error ? <p role="alert" className="notice">{c.audioError}</p> : null}
 </>;
}
