import type { TtsRequest, TtsResponse } from '@ching/contracts';

export const TTS_PROVIDER = Symbol('TtsProvider');
/** The service will enforce limits/cache; adapters must honor cancellation. */
export interface TtsProvider {
  synthesize(request: TtsRequest, signal: AbortSignal): Promise<TtsResponse>;
}
