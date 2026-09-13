import {mkdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
const temp=resolve('.tmp');mkdirSync(temp,{recursive:true});
const npm=process.env.npm_execpath;if(!npm)throw new Error('Run this command with npm run check.');
const result=spawnSync(process.execPath,[npm,'run','check:inner'],{stdio:'inherit',env:{...process.env,TEMP:temp,TMP:temp}});
process.exit(result.status??1);
