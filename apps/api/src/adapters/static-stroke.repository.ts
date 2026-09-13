import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import type {StrokeRepository} from '../ports/stroke-repository.js';
import manifest from '../content/data/hsk.manifest.json';
let strokes:Record<string,unknown>|undefined;
export class StaticStrokeRepository implements StrokeRepository {
 find(character:string):unknown {
  if(!strokes){
   const archive=readFileSync(new URL('../content/data/strokes.hsk.json.gz',import.meta.url));
   if(createHash('sha256').update(archive).digest('hex')!==manifest.strokeSha256)throw new Error('Stroke checksum mismatch');
   strokes=JSON.parse(gunzipSync(archive,{maxOutputLength:100000000}).toString('utf8')) as Record<string,unknown>;
  }
  return Object.hasOwn(strokes,character)?strokes[character]:undefined;
 }
}
