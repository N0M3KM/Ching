import type { LocalProgress } from '@ching/contracts';

/** Future persistence seam only. No server implementation in v0.0.1. */
export interface ProgressRepository {
  load(subjectId: string): Promise<LocalProgress | null>;
  save(subjectId: string, progress: LocalProgress): Promise<void>;
}
