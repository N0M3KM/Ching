import {Worker} from 'node:worker_threads';
import type {TtsRequest, TtsResponse} from '@ching/contracts';
import type {TtsProvider} from '../ports/tts-provider.js';

// Isolate CPU work and terminate it on the service's timeout.
export class LocalTtsProvider implements TtsProvider {
 synthesize(request: TtsRequest, signal: AbortSignal): Promise<TtsResponse> {
  if (signal.aborted) return Promise.reject(new Error('Cancelled'));
  if (request.voice && request.voice !== 'cmn') return Promise.reject(new Error('Unsupported local voice'));
  return new Promise((resolve, reject) => {
   const worker = new Worker(new URL('./local-tts-worker.mjs', import.meta.url), {workerData: {text: request.text}, execArgv: []});
   let settled = false;
   const finish = (error?: Error, audio?: Uint8Array) => {
    if (settled) return;
    settled = true; signal.removeEventListener('abort', abort);
    void worker.terminate();
    if (error || !audio) reject(error ?? new Error('No audio'));
    else resolve({audioBase64: Buffer.from(audio).toString('base64'), mimeType: 'audio/wav', transcript: request.text});
   };
   const abort = () => finish(new Error('Cancelled'));
   signal.addEventListener('abort', abort, {once: true});
   worker.once('message', (value: unknown) => {
    if (!(value instanceof Uint8Array) || value.length < 44 || value.length > 2000044) finish(new Error('Invalid audio'));
    else finish(undefined, value);
   });
   worker.once('error', error => finish(error));
   worker.once('exit', () => finish(new Error('Speech worker exited')));
   if (signal.aborted) abort();
  });
 }
}
