import {expect, it} from 'vitest';
import {LocalTtsProvider} from './local-tts.provider.js';
it('produces non-silent Mandarin PCM in a correctly sized WAV', async () => {
 const audio = await new LocalTtsProvider().synthesize({text: '你好，欢迎学习中文。'}, new AbortController().signal);
 const bytes = Buffer.from(audio.audioBase64, 'base64');
 expect(audio.mimeType).toBe('audio/wav');
 expect(bytes.subarray(8, 12).toString()).toBe('WAVE');
 expect(bytes.readUInt32LE(4)).toBe(bytes.length - 8);
 expect(bytes.readUInt32LE(40)).toBe(bytes.length - 44);
 expect(bytes.readUInt32LE(24)).toBe(22050);
 expect(bytes.subarray(44).some(value => value !== 0)).toBe(true);
});
it('cancels work and rejects unsupported voices', async () => {
 const provider = new LocalTtsProvider(), controller = new AbortController();
 const pending = provider.synthesize({text: '中文'.repeat(100)}, controller.signal);
 controller.abort();
 await expect(pending).rejects.toThrow('Cancelled');
 await expect(provider.synthesize({text: '你好'}, controller.signal)).rejects.toThrow('Cancelled');
 await expect(provider.synthesize({text: '你好', voice: 'invalid'}, new AbortController().signal)).rejects.toThrow('Unsupported');
});
