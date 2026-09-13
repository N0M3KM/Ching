import {cpSync,mkdirSync} from 'node:fs';
mkdirSync('dist/apps/api/src/adapters', {recursive:true});
cpSync('apps/api/src/adapters/local-tts-worker.mjs', 'dist/apps/api/src/adapters/local-tts-worker.mjs');
cpSync('apps/api/src/content/data', 'dist/apps/api/src/content/data', {recursive:true});
