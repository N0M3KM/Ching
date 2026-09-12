import {mkdirSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
const mode=process.argv[2];if(mode!=='dev'&&mode!=='e2e')throw new Error('Unknown command');
const temp=resolve('.tmp');mkdirSync(temp,{recursive:true});
const child=spawn(process.platform==='win32'?'npm.cmd':'npm',['run',mode==='dev'?'dev:inner':'test:e2e:inner'],{stdio:'inherit',shell:process.platform==='win32',env:{...process.env,TEMP:temp,TMP:temp,PLAYWRIGHT_BROWSERS_PATH:resolve('.cache/browsers')}});
child.on('exit',code=>process.exit(code??1));
