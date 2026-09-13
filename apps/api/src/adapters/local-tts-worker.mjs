import {parentPort, workerData} from 'node:worker_threads';
import initialize from '@echogarden/espeak-ng-emscripten';
try {
 const module = await initialize();
 const engine = new module.eSpeakNGWorker();
 if (engine.set_voice('cmn', 'cmn') !== 0) throw new Error('Mandarin voice unavailable');
 engine.set_rate(145);
 const chunks = [];
 let length = 0;
 engine.synthesize(workerData.text, samples => {
  length += samples.length * 2;
  if (length > 2000000) throw new Error('Audio too large');
  const chunk = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) chunk.writeInt16LE(samples[i], i * 2);
  chunks.push(chunk);
  return false;
 });
 if (!length) throw new Error('Empty audio');
 const header = Buffer.alloc(44);
 header.write('RIFF'); header.writeUInt32LE(36 + length, 4);
 header.write('WAVEfmt ', 8); header.writeUInt32LE(16, 16);
 header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22);
 const rate = engine.get_samplerate();
 header.writeUInt32LE(rate, 24); header.writeUInt32LE(rate * 2, 28);
 header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34);
 header.write('data', 36); header.writeUInt32LE(length, 40);
 parentPort.postMessage(Buffer.concat([header, ...chunks]));
} catch {
 parentPort.postMessage({error: 'Local speech synthesis failed'});
}
