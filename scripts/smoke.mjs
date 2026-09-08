import assert from 'node:assert/strict';
import { Fighter } from '../dist/src/characters/Fighter.js';
import { fighterA } from '../dist/src/characters/fighterA.js';
import { fighterB } from '../dist/src/characters/fighterB.js';
import { PLAYER_ONE_CONTROLS, PLAYER_TWO_CONTROLS } from '../dist/src/config/controls.js';
import { CombatSystem } from '../dist/src/combat/CombatSystem.js';
import { ProjectileSystem } from '../dist/src/combat/ProjectileSystem.js';
import { ComboSystem } from '../dist/src/combat/ComboSystem.js';
import { RoundManager } from '../dist/src/systems/RoundManager.js';
import { FightScene } from '../dist/src/scenes/FightScene.js';
import { TouchController } from '../dist/src/systems/TouchController.js';

class FakeInput {
  held = new Set(); pressed = new Set(); released = new Set();
  isHeld(code){ return this.held.has(code); }
  wasPressed(code){ return this.pressed.has(code); }
  wasReleased(code){ return this.released.has(code); }
  press(code){ this.pressed.add(code); this.held.add(code); }
  release(code){ this.held.delete(code); this.released.add(code); }
  endFrame(){ this.pressed.clear(); this.released.clear(); }
  clear(){ this.held.clear(); this.pressed.clear(); this.released.clear(); }
}
class StubParticles { burstCount=0; burst(){ this.burstCount++; } }
class StubCamera { punches=[]; punch(v){ this.punches.push(v); } }
class StubAudio { cues=[]; play(c){ this.cues.push(c); } }

const dt = 1/60;
const input = new FakeInput();
const p1 = new Fighter(1, fighterA, PLAYER_ONE_CONTROLS, 500);
const p2 = new Fighter(2, fighterB, PLAYER_TWO_CONTROLS, 595);
const combat = new CombatSystem();
const combos = new ComboSystem();
const particles = new StubParticles();
const camera = new StubCamera();
const audio = new StubAudio();
let now = 0;

function tick(count=1){
  for(let i=0;i<count;i++){
    now += dt*1000;
    p1.update(dt,input,p2.x,true);
    p2.update(dt,input,p1.x,true);
    combat.resolve(p1,p2,input,combos,particles,camera,audio,now);
    input.endFrame();
  }
}


// Simultaneous local movement: both keyboard groups update in the same fixed frame.
p1.reset(430); p2.reset(850); combat.reset(); input.clear();
input.held.add('KeyD'); input.held.add('ArrowLeft');
const p1Start = p1.x, p2Start = p2.x; tick(5);
assert.ok(p1.x > p1Start, 'player 1 should move right while player 2 also moves');
assert.ok(p2.x < p2Start, 'player 2 should move left in the same frames');
input.clear();

// Jumping is grounded-only and respects arena boundaries.
p1.reset(150); p2.reset(1100); input.clear();
input.press('KeyW'); tick(1); input.release('KeyW'); input.endFrame();
const firstJumpVy = p1.vy; input.press('KeyW'); tick(1); input.release('KeyW'); input.endFrame();
assert.ok(firstJumpVy < 0 && p1.y < 598, 'jump should create upward velocity');
assert.ok(p1.vy > firstJumpVy, 'second jump input in the air must not reset jump velocity');
p1.x = -1000; tick(1); assert.ok(p1.x > 100, 'fighter should be clamped inside the arena');

p1.reset(500); p2.reset(595); combat.reset(); input.clear();
// Light attack: hitbox becomes active after startup and damages exactly once.
input.press('KeyF'); tick(1); input.release('KeyF'); input.endFrame(); tick(8);
assert.equal(p2.health, fighterB.maxHealth - fighterA.attacks.light.damage, 'light attack should deal configured damage');
assert.ok(p2.hitStunMs > 0, 'light hit should apply hit stun');
assert.ok(combat.hitStopMs >= fighterA.attacks.light.hitStop, 'light hit should request hit stop');
const afterLight = p2.health; tick(8); assert.equal(p2.health, afterLight, 'one attack must not multi-hit the same target');

// Blocking: light has no chip damage and should create block stun instead of hit stun.
p1.reset(500); p2.reset(595); combat.reset(); input.clear(); now += 1000;
input.held.add('KeyO'); input.press('KeyF'); tick(1); input.release('KeyF'); input.endFrame(); tick(8);
assert.equal(p2.health, fighterB.maxHealth, 'blocked light should not deal chip damage');
assert.ok(p2.blockStunMs > 0, 'block should apply block stun');
assert.ok(audio.cues.includes('block'), 'block should emit block audio cue');

// Heavy attack: slower, higher damage, upward launch and stronger hit stop.
p1.reset(500); p2.reset(610); combat.reset(); input.clear(); now += 1000;
input.press('KeyG'); tick(1); input.release('KeyG'); input.endFrame(); tick(13);
assert.equal(p2.health, fighterB.maxHealth - fighterA.attacks.heavy.damage, 'heavy attack should deal configured damage');
assert.ok(p2.vx > 0, 'heavy should knock opponent away');
assert.ok(p2.vy < 0, 'heavy should launch opponent upward');
assert.ok(combat.hitStopMs >= fighterA.attacks.heavy.hitStop, 'heavy hit stop should be stronger');

// Attack cancel route: light can cancel into a second light around cancelAt.
p1.reset(500); p2.reset(900); combat.reset(); input.clear();
input.press('KeyF'); tick(1); input.release('KeyF'); input.endFrame(); tick(7);
const progressBefore = p1.attackProgress;
input.press('KeyF'); tick(1); input.release('KeyF'); input.endFrame();
assert.equal(p1.currentAttack?.key, 'light', 'light should remain the chained move type');
assert.ok(p1.attackProgress < progressBefore, 'cancel should restart attack timing for the chained light');

// Body pushboxes prevent overlap.
p1.reset(600); p2.reset(625); input.clear(); combat.resolve(p1,p2,input,combos,particles,camera,audio,now);
assert.ok(Math.abs(p2.x-p1.x) >= 91.9, 'pushboxes should separate fighters');

// A forward jump clears the opponent and allows side switching.
p1.reset(500); p2.reset(600); combat.reset(); input.clear();
input.press('KeyW'); input.held.add('KeyD'); tick(1); input.release('KeyW'); input.endFrame(); tick(50); input.clear();
assert.ok(p1.x > p2.x, 'a fighter should be able to jump over the opponent');

// Combo window counts sequential hits and resets after timeout.
const combo = new ComboSystem();
assert.equal(combo.registerHit(1,1000),1);assert.equal(combo.registerHit(1,1300),2);assert.equal(combo.registerHit(1,1600),3);combo.update(2401);assert.equal(combo.get(1),0);

// Round manager progresses KO -> round win -> next round.
const rp1 = new Fighter(1, fighterA, PLAYER_ONE_CONTROLS, 470);
const rp2 = new Fighter(2, fighterB, PLAYER_TWO_CONTROLS, 810);
const rounds = new RoundManager({stageId:'harbor', roundSeconds:30, roundsToWin:2}); rounds.resetMatch(rp1,rp2);
for(let i=0;i<110;i++) rounds.update(dt,rp1,rp2); // intro + fight intro
assert.equal(rounds.phase,'fighting'); rp2.health=0; rounds.update(dt,rp1,rp2); assert.equal(rounds.phase,'ko');
for(let i=0;i<90;i++) rounds.update(dt,rp1,rp2); // finish KO
assert.equal(rp1.wins,1,'round winner should receive a win');
for(let i=0;i<100;i++) rounds.update(dt,rp1,rp2);
assert.equal(rounds.round,2,'round system should advance to round 2');

// A decisive KO opens the optional finisher window before match over.
const fp1=new Fighter(1,fighterA,PLAYER_ONE_CONTROLS,470),fp2=new Fighter(2,fighterB,PLAYER_TWO_CONTROLS,810),finishRounds=new RoundManager({stageId:'cristo',roundSeconds:30,roundsToWin:1});finishRounds.resetMatch(fp1,fp2);for(let i=0;i<110;i++)finishRounds.update(dt,fp1,fp2);fp2.health=0;finishRounds.update(dt,fp1,fp2);for(let i=0;i<82;i++)finishRounds.update(dt,fp1,fp2);assert.equal(finishRounds.phase,'finishWindow','decisive KO should open a three-second finisher window');finishRounds.startFinisher();assert.equal(finishRounds.phase,'finisher');for(let i=0;i<121;i++)finishRounds.update(dt,fp1,fp2);assert.equal(finishRounds.phase,'matchOver','finisher cinematic should resolve to match over');



// Scene-level pause and restart controls.
globalThis.window = { __FINAL_BELL_DEBUG__: undefined };
const sceneInput = new FakeInput();
const sceneAudio = { cues: [], mutedState: false, volumePercent: 58, play(c){ this.cues.push(c); }, toggleMute(){ this.mutedState=!this.mutedState; }, changeVolume(){}, startFightMusic(){}, startMusic(){}, stopMusic(){} };
const fakeCanvas = { addEventListener(){}, removeEventListener(){}, getBoundingClientRect(){ return { left:0, top:0, width:1280, height:720 }; } };
let returnedToMenu=0;
const scene = new FightScene(sceneInput, sceneAudio, ()=>{returnedToMenu++;}, fakeCanvas, {stageId:'courtyard', roundSeconds:99, roundsToWin:3});
sceneInput.press('Escape'); scene.update(dt); sceneInput.endFrame();
assert.equal(globalThis.window.__FINAL_BELL_DEBUG__?.paused, true, 'ESC should pause the fight scene');
sceneInput.release('Escape'); sceneInput.endFrame(); sceneInput.press('KeyR'); scene.update(dt); sceneInput.endFrame();
assert.equal(globalThis.window.__FINAL_BELL_DEBUG__?.paused, false, 'R from pause should restart and resume');
assert.equal(globalThis.window.__FINAL_BELL_DEBUG__?.p1?.health, fighterA.maxHealth, 'restart should restore player 1 health');
assert.equal(globalThis.window.__FINAL_BELL_DEBUG__?.p2?.health, fighterB.maxHealth, 'restart should restore player 2 health');
scene.rounds.phase='matchOver';scene.rounds.matchWinner=1;sceneInput.press('KeyR');scene.update(dt);sceneInput.endFrame();
assert.equal(scene.rounds.phase,'roundIntro','R on the result screen should start a rematch');
scene.rounds.phase='matchOver';scene.rounds.matchWinner=1;sceneInput.press('KeyM');scene.update(dt);sceneInput.endFrame();
assert.equal(returnedToMenu,1,'M on the result screen should exit the match');
scene.destroy();

assert.equal(rounds.settings.roundSeconds,30,'configured round timer should be preserved');
assert.equal(rounds.roundsToWin,2,'configured rounds-to-win should be preserved');
assert.equal(globalThis.window.__FINAL_BELL_DEBUG__?.settings?.stageId,'courtyard','fight scene should preserve selected stage');
assert.equal(globalThis.window.__FINAL_BELL_DEBUG__?.settings?.roundSeconds,99,'fight scene should preserve selected timer');
assert.equal(globalThis.window.__FINAL_BELL_DEBUG__?.settings?.roundsToWin,3,'fight scene should preserve selected match format');

console.log('Gameplay smoke tests passed: simultaneous input, jump/bounds, attacks, block, hit stun/stop, knockback, cancel, pushboxes, combos, configurable rounds, selected stage, pause/restart.');

// V3 roster quality gate: four distinct data-driven fighters and unique visual packs.
const { ROSTER } = await import('../dist/src/characters/roster.js');
const { combatBalance } = await import('../dist/src/config/combatBalance.js');
assert.equal(ROSTER.length,4,'v3 must expose exactly four launch fighters after pruning bugged roster entries');
assert.equal(new Set(ROSTER.map(f=>f.id)).size,4,'fighter ids must be unique');
assert.equal(new Set(ROSTER.map(f=>f.sprite?.packName)).size,4,'launch roster should use four distinct sprite packs');
for(const f of ROSTER){
  assert.ok(f.sprite,'every launch fighter should have a professional sprite profile');
  assert.ok(f.maxHealth>=80&&f.maxHealth<=130,'health must stay inside sane launch balance bounds');
  for(const key of ['light','heavy','crouchLight','airLight']){const a=f.attacks[key];assert.ok(a.startup>0&&a.active>0&&a.recovery>0,`${f.id}/${key} needs complete commitment windows`);assert.ok(a.hitbox.width>0&&a.hitbox.height>0,`${f.id}/${key} needs an attack hitbox`);}
  assert.equal(f.skins.length,3,`${f.id} should expose three selectable skins`);
  assert.deepEqual(Object.keys(f.specials).sort(),['special1','special2','super'],`${f.id} should expose a complete special kit`);
}

// Normal reach is expanded by exactly 20% at runtime.
const reachFighter=new Fighter(1,fighterA,PLAYER_ONE_CONTROLS,500),reachDummy=new Fighter(2,fighterB,PLAYER_TWO_CONTROLS,900),reachInput=new FakeInput();reachInput.press('KeyF');reachFighter.update(dt,reachInput,reachDummy.x,true);reachInput.endFrame();for(let i=0;i<5;i++)reachFighter.update(dt,reachInput,reachDummy.x,true);assert.equal(reachFighter.attackHitbox?.width,fighterA.attacks.light.hitbox.width*1.2,'normal hitbox reach should grow by 20%');

// Classic motions trigger projectile special, anti-air and metered super.
const motionInput=new FakeInput();const motionFighter=new Fighter(1,fighterA,PLAYER_ONE_CONTROLS,400);const motionStep=()=>{motionFighter.update(dt,motionInput,800,true);motionInput.endFrame();};
motionInput.held.add('KeyS');motionStep();motionInput.held.add('KeyD');motionStep();motionInput.held.delete('KeyS');motionStep();motionInput.press('KeyF');motionStep();assert.equal(motionFighter.currentAttack?.key,'special1','quarter-circle + light should trigger projectile special');
motionFighter.reset(400,false);motionInput.clear();motionInput.held.add('KeyS');motionStep();for(let i=0;i<12;i++)motionStep();motionInput.held.add('KeyD');motionStep();for(let i=0;i<12;i++)motionStep();motionInput.held.delete('KeyS');motionStep();for(let i=0;i<12;i++)motionStep();motionInput.press('KeyF');motionStep();assert.equal(motionFighter.currentAttack?.key,'special1','motion window should accept a deliberate input lasting more than 450ms');
motionFighter.reset(400,false);motionInput.clear();motionInput.held.add('KeyD');motionStep();motionInput.held.delete('KeyD');motionInput.held.add('KeyS');motionStep();motionInput.held.add('KeyD');motionStep();motionInput.press('KeyG');motionStep();assert.equal(motionFighter.currentAttack?.key,'special2','dragon-punch motion + heavy should trigger anti-air');
motionFighter.reset(400,false);motionFighter.addMeter(100);motionInput.clear();for(let pass=0;pass<2;pass++){motionInput.held.add('KeyS');motionInput.held.delete('KeyD');motionStep();motionInput.held.add('KeyD');motionStep();motionInput.held.delete('KeyS');motionStep();}motionInput.press('KeyG');motionStep();assert.equal(motionFighter.currentAttack?.key,'super','double quarter-circle + heavy should trigger super');assert.equal(motionFighter.meter,0,'super should consume the complete meter');

// Touch controller translates multi-pointer d-pad/buttons into the same input codes.
const touchListeners={},virtualHeld=new Set(),touchCanvas={addEventListener(type,fn){touchListeners[type]=fn;},removeEventListener(){},setPointerCapture(){},getBoundingClientRect(){return{left:0,top:0,width:1280,height:720};}},touchInput={setVirtual(code,held){held?virtualHeld.add(code):virtualHeld.delete(code);},clearVirtual(){virtualHeld.clear();}};const touchController=new TouchController(touchCanvas,touchInput,PLAYER_ONE_CONTROLS);touchListeners.pointerdown({preventDefault(){},pointerId:1,clientX:215,clientY:565});touchListeners.pointerdown({preventDefault(){},pointerId:2,clientX:1035,clientY:596});assert.ok(virtualHeld.has('KeyD')&&virtualHeld.has('KeyF'),'touch d-pad and attack button should support simultaneous pointers');touchListeners.pointerup({preventDefault(){},pointerId:2,clientX:1035,clientY:596});assert.ok(!virtualHeld.has('KeyF')&&virtualHeld.has('KeyD'),'releasing one pointer must preserve the other held direction');touchController.destroy();assert.equal(virtualHeld.size,0,'destroying touch controls should clear virtual input');

// Projectile special spawns once, travels and applies damage/meter on contact.
const shotInput=new FakeInput(),shooter=new Fighter(1,fighterA,PLAYER_ONE_CONTROLS,400),shotTarget=new Fighter(2,fighterB,PLAYER_TWO_CONTROLS,650),shots=new ProjectileSystem(),shotCombos=new ComboSystem(),shotParticles=new StubParticles(),shotCamera=new StubCamera(),shotAudio=new StubAudio();let shotNow=0;const shotStep=()=>{shotNow+=dt*1000;shooter.update(dt,shotInput,shotTarget.x,true);shotTarget.update(dt,shotInput,shooter.x,true);shots.syncSpawn(shooter,shotAudio);shots.update(dt,shooter,shotTarget,shotInput,shotCombos,shotParticles,shotCamera,shotAudio,shotNow);shotInput.endFrame();};shotInput.held.add('KeyS');shotStep();shotInput.held.add('KeyD');shotStep();shotInput.held.delete('KeyS');shotStep();shotInput.press('KeyF');shotStep();shotInput.release('KeyF');for(let i=0;i<45;i++)shotStep();assert.ok(shotTarget.health<fighterB.maxHealth,'projectile should damage the target');assert.equal(shooter.meter,10,'projectile hit should award special meter');assert.ok(shotAudio.cues.includes('projectileLaunch')&&shotAudio.cues.includes('projectileImpact'),'projectile should emit layered launch and impact cues');
// Every fighter can land its core light attack against every other body profile.
for(let i=0;i<ROSTER.length;i++)for(let j=0;j<ROSTER.length;j++)if(i!==j){const fa=ROSTER[i],fb=ROSTER[j];const a=new Fighter(1,fa,PLAYER_ONE_CONTROLS,480),b=new Fighter(2,fb,PLAYER_TWO_CONTROLS,590),fi=new FakeInput(),cs=new CombatSystem(),co=new ComboSystem(),ps=new StubParticles(),ca=new StubCamera(),au=new StubAudio();let t=0;fi.press('KeyF');for(let n=0;n<24;n++){t+=dt*1000;a.update(dt,fi,b.x,true);b.update(dt,fi,a.x,true);cs.resolve(a,b,fi,co,ps,ca,au,t);fi.endFrame();}assert.ok(b.health<fb.maxHealth,`${fa.id} light must connect reliably against ${fb.id}`);}

// Natural strike sequence is deterministic: jab side A -> side B -> heavy returns to A.
const alt=new Fighter(1,fighterA,PLAYER_ONE_CONTROLS,500),dummy=new Fighter(2,fighterB,PLAYER_TWO_CONTROLS,900),altInput=new FakeInput();
const variants=[];let lastSerial=0;for(let frame=0;frame<70&&variants.length<3;frame++){if(frame===0||frame===9||frame===18)altInput.press(frame===18?'KeyG':'KeyF');alt.update(dt,altInput,dummy.x,true);if(alt.attackSerialNumber!==lastSerial){lastSerial=alt.attackSerialNumber;variants.push(alt.visualStrikeVariant);}altInput.endFrame();if(frame===0||frame===9||frame===18){altInput.release(frame===18?'KeyG':'KeyF');altInput.endFrame();}}
assert.deepEqual(variants.slice(0,3),[0,1,0],'light-light-heavy should alternate limbs naturally');

// Anti-infinite integration: damage/stun decay, growing pushback and hard combo end.
const fakeAttack={key:'light',label:'jab',damage:10,chipDamage:0,startup:0,active:100,recovery:0,hitStun:220,blockStun:80,hitStop:40,knockback:{x:100,y:0},blockKnockback:20,hitbox:{offsetX:0,offsetY:0,width:50,height:50},cancelAt:0,cancelInto:[],shake:1};
let already=false;const fakeAttacker={id:1,x:0,y:0,facing:1,def:{body:{width:50},appearance:{impact:'#fff'}},get bodyRect(){return{x:this.x-25,y:0,width:50,height:50};},get attackHitbox(){return{x:0,y:0,width:50,height:50};},get currentAttack(){return fakeAttack;},hasHit(){return already;},markHit(){already=true;},addMeter(){}};
const observed=[];const fakeDefender={id:2,x:20,y:0,controls:PLAYER_TWO_CONTROLS,def:{body:{width:50}},get bodyRect(){return{x:this.x-25,y:0,width:50,height:50};},get hurtbox(){return{x:0,y:0,width:50,height:50};},isBlocking(){return false;},takeBlock(){},takeHit(damage,stun,kx){observed.push({damage,stun,kx});},addMeter(){}};
const antiCombat=new CombatSystem(),antiCombo=new ComboSystem(),antiInput=new FakeInput(),antiParticles=new StubParticles(),antiCamera=new StubCamera(),antiAudio=new StubAudio();
for(let i=0;i<combatBalance.maxCombo;i++){already=false;fakeAttacker.x=0;fakeDefender.x=100;antiCombat.resolve(fakeAttacker,fakeDefender,antiInput,antiCombo,antiParticles,antiCamera,antiAudio,1000+i*80);}
assert.equal(observed.length,combatBalance.maxCombo,'anti-infinite fixture should register the configured maximum sequence');
assert.ok(observed.at(-1).damage<observed[0].damage,'combo scaling should reduce later damage');
assert.ok(observed.at(-1).stun<=combatBalance.comboEndHitStunMs,'last allowed hit should sharply reduce hit stun');
assert.ok(observed.at(-1).kx>observed[0].kx,'pushback should grow over a combo');
assert.equal(antiCombo.get(1),0,'max combo should force combo state to break');
console.log('V3 roster/anti-infinite tests passed: four unique visual packs, all-vs-all core reach, deterministic limb alternation and combo escape scaling.');
