import http from 'node:http';
import assert from 'node:assert/strict';
import { attachMultiplayer } from '../server/multiplayer.mjs';

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

class Client {
  constructor(name) {
    this.name = name;
    this.session = `test-${name}-${Math.random()}`;
    this.messages = [];
    this.waiters = [];
    this.resumeToken = '';
  }

  async connect(url) {
    this.messages = [];
    this.ws = new WebSocket(url);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });
    this.ws.onmessage = event => {
      const msg = JSON.parse(String(event.data));
      if (msg.type === 'welcome') this.resumeToken = msg.resumeToken;
      this.messages.push(msg);
      for (const waiter of [...this.waiters]) {
        if (waiter.predicate(msg)) {
          this.waiters.splice(this.waiters.indexOf(waiter), 1);
          waiter.resolve(msg);
        }
      }
    };
    this.send({ type: 'hello', sessionId: this.session, name: this.name, resumeToken: this.resumeToken || undefined });
    return this.next('welcome');
  }

  send(value) {
    this.ws.send(JSON.stringify(value));
  }

  next(type, timeout = 3000) {
    return this.nextWhere(msg => msg.type === type, `${type}`, timeout);
  }

  nextWhere(predicate, label = 'message', timeout = 3000) {
    const idx = this.messages.findIndex(predicate);
    if (idx >= 0) return Promise.resolve(this.messages.splice(idx, 1)[0]);
    return new Promise((resolve, reject) => {
      const waiter = { predicate, resolve };
      this.waiters.push(waiter);
      setTimeout(() => {
        const i = this.waiters.indexOf(waiter);
        if (i >= 0) this.waiters.splice(i, 1);
        reject(new Error(`${this.name} timed out waiting ${label}`));
      }, timeout);
    });
  }

  close() {
    this.ws?.close();
  }
}

const server = http.createServer((request, response) => response.end('ok'));
attachMultiplayer(server, { disconnectTimeoutMs: 220, sweepIntervalMs: 40 });
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const address = server.address();
if (!address || typeof address === 'string') throw new Error('No server address');
const url = `ws://127.0.0.1:${address.port}/ws`;
const settings = { stageId: 'cristo', roundSeconds: 30, roundsToWin: 1, mode: 'online' };

// Versus: create/join, READY, reconnect, host migration, input relay and timeout forfeit.
const a = new Client('Alpha');
const b = new Client('Beta');
await Promise.all([a.connect(url), b.connect(url)]);
const hijacker=new WebSocket(url);
await new Promise((resolve,reject)=>{hijacker.onopen=resolve;hijacker.onerror=reject;});
const hijackRejected=new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error('Session hijack was not rejected')),2000);hijacker.onmessage=event=>{const msg=JSON.parse(String(event.data));if(msg.type==='error'){clearTimeout(timeout);resolve(msg);}};});
hijacker.send(JSON.stringify({type:'hello',sessionId:a.session,name:'Intruder'}));
await hijackRejected;
hijacker.close();
a.send({ type: 'createRoom', mode: 'versus', settings });
const aRoom = await a.next('roomState');
const code = aRoom.room.code;
if (!/^[A-Z0-9]{6}$/.test(code)) throw new Error('Bad room code');
b.send({ type: 'joinRoom', code });
await a.nextWhere(m => m.type === 'roomState' && m.room.players.length === 2, 'two-player room');
await b.nextWhere(m => m.type === 'roomState' && m.room.players.length === 2, 'joined room');
a.send({ type: 'selectFighter', fighterId: 'mateo' });
b.send({ type: 'selectFighter', fighterId: 'darius' });
a.send({ type: 'selectSkin', skinId: 'aurora' });
b.send({ type: 'selectSkin', skinId: 'cobalt' });
a.send({ type: 'ready', ready: true });
b.send({ type: 'ready', ready: true });
const [ma, mb] = await Promise.all([a.next('matchStart'), b.next('matchStart')]);
assert.deepEqual(ma.match.skinIds,['aurora','cobalt']);
assert.deepEqual(mb.match.skinIds,['aurora','cobalt']);
if (ma.match.matchId !== mb.match.matchId) throw new Error('Match mismatch');

// Disconnect active host. Remaining player becomes host, but match is held for reconnect grace.
a.close();
const migrated = await b.nextWhere(
  m => m.type === 'roomState' && m.room.hostSession === b.session && m.room.players.some(p => p.sessionId === a.session && !p.connected),
  'host migration after disconnect',
  2000,
);
if (migrated.room.hostSession !== b.session) throw new Error('Host migration failed');

// Same session reconnects and is restored into the active match.
const welcomeAfterReconnect = await a.connect(url);
if (welcomeAfterReconnect.room?.code !== code) throw new Error('Reconnect did not restore room');
const restored = welcomeAfterReconnect.room.players.find(p => p.sessionId === a.session);
if (!restored?.connected || restored.status !== 'IN MATCH') throw new Error('Reconnect did not restore active-match state');

a.send({ type: 'input', matchId: ma.match.matchId, frame: 10, bits: 37 });
const remote = await b.nextWhere(m => m.type === 'remoteInput' && m.matchId === ma.match.matchId, 'remote input');
if (remote.bits !== 37 || remote.frame !== 10) throw new Error('Input relay failed');

// Disconnect again and let the configured grace period expire: Beta wins by forfeit.
a.close();
const forfeit = await b.nextWhere(m => m.type === 'matchEnded' && m.matchId === ma.match.matchId, 'disconnect timeout forfeit', 2500);
if (forfeit.winnerSession !== b.session) throw new Error('Disconnect timeout awarded wrong winner');
b.close();

// Tournament flow with four participants and three matches.
const cs = [new Client('P1'), new Client('P2'), new Client('P3'), new Client('P4')];
await Promise.all(cs.map(client => client.connect(url)));
cs[0].send({ type: 'createRoom', mode: 'tournament', settings, tournamentName: 'Smoke Cup', maxPlayers: 4 });
const room = (await cs[0].next('roomState')).room;
const tcode = room.code;
for (let i = 1; i < cs.length; i++) {
  cs[i].send({ type: 'joinRoom', code: tcode });
  await wait(35);
}
await cs[0].nextWhere(m => m.type === 'roomState' && m.room.players.length === 4, 'four tournament players');
for (let i = 0; i < cs.length; i++) {
  cs[i].send({ type: 'selectFighter', fighterId: ['mateo', 'darius', 'aya', 'bruno'][i] });
  await wait(15);
  cs[i].send({ type: 'ready', ready: true });
}
await cs[0].nextWhere(m => m.type === 'roomState' && m.room.players.length === 4 && m.room.players.every(p => p.ready), 'all tournament players ready');
cs[0].send({ type: 'startTournament' });

const handled = new Set();
let champion = null;
const deadline = Date.now() + 7000;
while (Date.now() < deadline && !champion) {
  for (const client of cs) {
    const completeIndex = client.messages.findIndex(m => m.type === 'tournamentComplete');
    if (completeIndex >= 0) {
      champion = client.messages.splice(completeIndex, 1)[0].championSession;
      break;
    }
    const idx = client.messages.findIndex(m => m.type === 'matchStart' && !handled.has(m.match.matchId));
    if (idx >= 0) {
      const match = client.messages.splice(idx, 1)[0].match;
      handled.add(match.matchId);
      const reporter = cs.find(candidate => candidate.session === match.p1Session);
      const confirmer = cs.find(candidate => candidate.session === match.p2Session);
      if (!reporter) throw new Error('Missing tournament reporter');
      if (!confirmer) throw new Error('Missing tournament confirmer');
      reporter.send({ type: 'matchResult', matchId: match.matchId, winner: 1 });
      confirmer.send({ type: 'matchResult', matchId: match.matchId, winner: 1 });
      await wait(180);
      break;
    }
  }
  await wait(20);
}
if (!champion) throw new Error(`Tournament did not finish, handled ${handled.size} matches`);
if (handled.size !== 3) throw new Error(`Expected 3 tournament matches, got ${handled.size}`);
cs.forEach(client => client.close());
await new Promise(resolve => server.close(resolve));
console.log('Network smoke passed: private room, READY, input relay, reconnect, host migration, disconnect timeout/forfeit, 4-player bracket and champion.');
