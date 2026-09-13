import {convert} from 'pinyin-pro';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import type {DictionaryEntry, Vocabulary} from '@ching/contracts';
import type {DictionaryRepository} from '../ports/dictionary-repository.js';
import {parseCedict, normalizePinyin} from './cedict-parser.js';
import manifest from '../content/data/cedict.manifest.json';

const normalize = (text: string) => text.normalize('NFC').toLowerCase().trim();
const readingKey = (text: string) => convert(text.toLowerCase().replace(/u:/g, 'ü'), {format: 'symbolToNum'}).replace(/\s/g, '');
const identity = (entry: DictionaryEntry) => entry.simplified + '|' + readingKey(entry.pinyin);
let snapshot: readonly DictionaryEntry[] | undefined;
function loadSnapshot() {
 if (!snapshot) {
  const archive = readFileSync(new URL('../content/data/cedict.txt.gz', import.meta.url));
  if (createHash('sha256').update(archive).digest('hex') !== manifest.sha256) throw new Error('CC-CEDICT checksum mismatch');
  const parsed = parseCedict(gunzipSync(archive, {maxOutputLength: 50000000}).toString('utf8'));
  if (parsed.length !== manifest.entries) throw new Error('CC-CEDICT entry count mismatch');
  snapshot = parsed;
 }
 return snapshot;
}

/** General reference data stays outside lesson pools. Curated entries retain their IDs and fields. */
export class CedictRepository implements DictionaryRepository {
 private readonly rows: readonly {entry: DictionaryEntry; fields: readonly string[]; pinyin: string}[];
 private readonly exact = new Map<string, DictionaryEntry[]>();
 constructor(curated: readonly Vocabulary[], corpus: readonly DictionaryEntry[] = loadSnapshot()) {
  const overrides = new Set(curated.map(identity));
  const entries = [...curated, ...corpus.filter(entry => !overrides.has(identity(entry)))];
  this.rows = entries.map(entry => {
   for (const word of new Set([entry.simplified, entry.traditional ?? ''])) {
    if (!word) continue;
    const key = normalize(word), matches = this.exact.get(key) ?? [];
    matches.push(entry); this.exact.set(key, matches);
   }
   return {entry, fields: [entry.simplified, entry.traditional ?? '', entry.pinyin, ...entry.definitions].map(normalize), pinyin: normalizePinyin(entry.pinyin)};
  });
 }
 lookup(query: string): readonly DictionaryEntry[] {
  const term = normalize(query);
  if (!term) return [];
  const phonetic = normalizePinyin(term);
  const result = [...(this.exact.get(term) ?? [])];
  const seen = new Set(result.map(entry => entry.id));
  const add = (entry: DictionaryEntry) => {if (!seen.has(entry.id)) {seen.add(entry.id); result.push(entry);}};
  // Exact readings precede substring/English matches.
  for (const row of this.rows) {
   if (result.length >= 50) break;
   if (row.pinyin === phonetic || row.entry.definitions.some(definition => normalize(definition) === term)) add(row.entry);
  }
  for (const row of this.rows) {
   if (result.length >= 50) break;
   if (row.fields.some(field => field.includes(term)) || (phonetic && row.pinyin.includes(phonetic))) add(row.entry);
  }
  return result.slice(0, 50);
 }
}
