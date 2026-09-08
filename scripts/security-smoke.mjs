import assert from 'node:assert/strict';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createStaticHandler } from '../server/http-handler.mjs';
import { attachMultiplayer } from '../server/multiplayer.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const server=http.createServer(createStaticHandler(path.join(root,'dist'),{production:true,requestsPerMinute:60}));
attachMultiplayer(server,{allowedOrigins:'https://game.example',allowMissingOrigin:false,sweepIntervalMs:1000});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const address=server.address();
if(!address||typeof address==='string')throw new Error('No server address');
const port=address.port;
const request=(pathname,method='GET')=>new Promise((resolve,reject)=>{const req=http.request({host:'127.0.0.1',port,path:pathname,method},res=>{res.resume();res.on('end',()=>resolve(res));});req.on('error',reject);req.end();});

const health=await request('/healthz');
assert.equal(health.statusCode,200);
assert.ok(health.headers['content-security-policy']?.includes("default-src 'self'"));
assert.equal(health.headers['x-content-type-options'],'nosniff');
assert.equal(health.headers['x-frame-options'],'DENY');
assert.equal((await request('/', 'POST')).statusCode,405);
assert.equal((await request('/..%2fpackage.json')).statusCode,403);

const rejected=await new Promise((resolve,reject)=>{const socket=net.connect(port,'127.0.0.1',()=>socket.write('GET /ws HTTP/1.1\r\nHost: 127.0.0.1\r\nOrigin: https://evil.example\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Version: 13\r\nSec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\n\r\n'));let data='';socket.on('data',chunk=>data+=chunk);socket.on('end',()=>resolve(data));socket.on('error',reject);});
assert.match(rejected,/^HTTP\/1\.1 403/);

let limited=false;
for(let i=0;i<35;i++){const response=await request('/healthz');if(response.statusCode===429){limited=true;break;}}
assert.equal(limited,true,'HTTP rate limit should reject a burst');
await new Promise(resolve=>server.close(resolve));
console.log('Security smoke passed: headers, methods, traversal, WebSocket origin and HTTP rate limiting.');
