import {mkdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
const temp=resolve('.tmp');mkdirSync(temp,{recursive:true});
const result=spawnSync(process.execPath,[resolve('node_modules/playwright/cli.js'),'install',...(process.platform==='linux'?['--with-deps']:[]),'chromium'],{stdio:'inherit',env:{...process.env,TEMP:temp,TMP:temp,PLAYWRIGHT_BROWSERS_PATH:resolve('.cache/browsers')}});
process.exit(result.status??1);
