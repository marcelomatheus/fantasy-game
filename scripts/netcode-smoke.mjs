import assert from 'node:assert/strict';
import { getFighter } from '../dist/src/characters/roster.js';
import { PLAYER_ONE_CONTROLS,PLAYER_TWO_CONTROLS } from '../dist/src/config/controls.js';
import { BitInputSource,bitFor } from '../dist/src/network/inputBits.js';
import { MatchSimulation } from '../dist/src/simulation/MatchSimulation.js';

const settings={stageId:'cristo',roundSeconds:30,roundsToWin:1,mode:'online'};
const definitions=[getFighter('mateo',0),getFighter('darius',1)];
const make=()=>({simulation:new MatchSimulation(settings,definitions,[PLAYER_ONE_CONTROLS,PLAYER_TWO_CONTROLS]),input:new BitInputSource([PLAYER_ONE_CONTROLS,PLAYER_TWO_CONTROLS])});
const p1Bits=frame=>frame<35?bitFor('right'):frame===40?bitFor('light'):0;
const p2Bits=frame=>frame>=15&&frame<23?bitFor('jump')|bitFor('left'):frame===45?bitFor('heavy'):0;

const first=make(),second=make();
for(let frame=1;frame<=90;frame++){const a=p1Bits(frame),b=p2Bits(frame);first.input.setBits(a,b);second.input.setBits(a,b);first.simulation.step(1/60,first.input);second.simulation.step(1/60,second.input);assert.equal(first.simulation.checksum(),second.simulation.checksum(),`determinism at frame ${frame}`);}

const predicted=make(),snapshots=new Map([[0,predicted.simulation.snapshot()]]);
for(let frame=1;frame<=90;frame++){predicted.input.setBits(p1Bits(frame),0);predicted.simulation.step(1/60,predicted.input);snapshots.set(frame,predicted.simulation.snapshot());}
predicted.simulation.restore(snapshots.get(14));
predicted.input.primeBits(p1Bits(14),p2Bits(14));
for(let frame=15;frame<=90;frame++){predicted.input.setBits(p1Bits(frame),p2Bits(frame));predicted.simulation.step(1/60,predicted.input);}
assert.equal(predicted.simulation.checksum(),first.simulation.checksum(),'rollback must converge to the reference state');
console.log('Netcode smoke passed: deterministic replay and late-input rollback converge.');
