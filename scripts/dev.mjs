import http from 'node:http';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { attachMultiplayer } from '../server/multiplayer.mjs';
import { createStaticHandler } from '../server/http-handler.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const result=spawnSync(process.execPath,[path.join(root,'scripts/build.mjs')],{cwd:root,stdio:'inherit'});
if(result.status!==0)throw new Error('Build failed');
const port=Number(process.env.PORT||4173);
const server=http.createServer(createStaticHandler(path.join(root,'dist'),{production:false,requestsPerMinute:1200}));
attachMultiplayer(server,{allowMissingOrigin:true});
server.listen(port,'127.0.0.1',()=>console.log(`Cielo Fantasy Fight dev + multiplayer server: http://127.0.0.1:${port}`));
