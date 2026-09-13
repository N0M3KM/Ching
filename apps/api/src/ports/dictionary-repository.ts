import type {DictionaryEntry} from '@ching/contracts';
export const DICTIONARY_REPOSITORY = Symbol('DICTIONARY_REPOSITORY');
export interface DictionaryRepository {
 lookup(query: string): readonly DictionaryEntry[];
}
