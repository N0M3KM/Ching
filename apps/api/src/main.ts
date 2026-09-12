import { createApp } from './app.js';
const app=await createApp();
await app.listen(Number(process.env.PORT??3001),'127.0.0.1');
console.log('Ching API ready on http://127.0.0.1:'+(process.env.PORT??3001));
