import type { LocalProgress } from '@ching/contracts';

/** Browser-only adapter will validate reads and handle unavailable storage. */
export interface ProgressStore {
  load(): LocalProgress;
  save(progress: LocalProgress): void;
  clear(): void;
}
