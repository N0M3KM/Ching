import {mkdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
const temp=resolve('.tmp');mkdirSync(temp,{recursive:true});
const result=spawnSync(process.platform==='win32'?'npm.cmd':'npm',['run','check:inner'],{stdio:'inherit',shell:process.platform==='win32',env:{...process.env,TEMP:temp,TMP:temp}});
process.exit(result.status??1);
