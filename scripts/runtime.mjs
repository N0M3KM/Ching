import {mkdirSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
const mode=process.argv[2];if(mode!=='dev'&&mode!=='e2e')throw new Error('Unknown command');
const temp=resolve('.tmp');mkdirSync(temp,{recursive:true});
const entry=mode==='dev'?'node_modules/concurrently/dist/bin/index.js':'node_modules/playwright/cli.js';
const args=mode==='dev'?['-k','npm:dev:api','npm:dev:web']:['test'];
const child=spawn(process.execPath,[resolve(entry),...args],{stdio:'inherit',env:{...process.env,TEMP:temp,TMP:temp,PLAYWRIGHT_BROWSERS_PATH:resolve('.cache/browsers')}});
child.on('exit',code=>process.exit(code??1));
