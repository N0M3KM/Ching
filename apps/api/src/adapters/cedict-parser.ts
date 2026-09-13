import {createHash} from 'node:crypto';
import {convert} from 'pinyin-pro';
import type {DictionaryEntry} from '@ching/contracts';

export function normalizePinyin(value: string): string {
 return value.toLowerCase().replace(/u:|ü/g, 'v').normalize('NFD').replace(/u\u0308/g, 'v').replace(/[\u0300-\u036f1-5\s'’_-]/g, '');
}
export function parseCedict(text: string): readonly DictionaryEntry[] {
 const entries: DictionaryEntry[] = [];
 for (const [index, line] of text.replace(/^\uFEFF/, '').split(/\r?\n/).entries()) {
  if (!line.trim() || line.startsWith('#')) continue;
  const match = /^(\S+) (\S+) \[([^\]]+)\] \/(.+)\/$/.exec(line);
  if (!match) throw new Error('Invalid CC-CEDICT line ' + (index + 1));
  const traditional = match[1]!, simplified = match[2]!, numbered = match[3]!, meanings = match[4]!;
  const pinyin = convert(numbered.replace(/u:/g, 'ü'), {format: 'numToSymbol'});
  entries.push(Object.freeze({
   id: 'cedict-' + createHash('sha256').update(line).digest('hex').slice(0, 24),
   simplified, traditional, pinyin, definitions: Object.freeze(meanings.split('/')),
   audioText: simplified, tags: Object.freeze([]), sourceId: 'cc-cedict',
  }));
 }
 return Object.freeze(entries);
}
