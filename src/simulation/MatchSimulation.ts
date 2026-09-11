import { Fighter } from '../characters/Fighter.js';
import { CombatSystem } from '../combat/CombatSystem.js';
import { ComboSystem } from '../combat/ComboSystem.js';
import { ProjectileSystem } from '../combat/ProjectileSystem.js';
import { RoundManager } from '../systems/RoundManager.js';
import type { AudioManager } from '../systems/AudioManager.js';
import type { CameraManager } from '../systems/CameraManager.js';
import type { InputSource } from '../systems/InputSource.js';
import type { ParticleSystem } from '../systems/ParticleSystem.js';
import type { FighterDefinition,MatchSettings,MatchSimulationSnapshot } from '../types/game.js';

export interface SimulationEffects {audio:AudioManager;camera:CameraManager;particles:ParticleSystem;}
export interface SimulationStepResult {hitStop:boolean;koStarted:boolean;roundReset:boolean;matchEnded:boolean;phaseBefore:string;p1WasGrounded:boolean;p2WasGrounded:boolean;}

const noop=()=>{};
const SILENT_EFFECTS={audio:{play:noop},camera:{punch:noop},particles:{burst:noop}} as unknown as SimulationEffects;
const q=(value:number):number=>Math.round(value*1000)/1000;

export class MatchSimulation{
  readonly p1:Fighter;readonly p2:Fighter;readonly combat=new CombatSystem();readonly combos=new ComboSystem();readonly projectiles=new ProjectileSystem();readonly rounds:RoundManager;
  frame=0;now=0;
  constructor(readonly settings:MatchSettings,definitions:[FighterDefinition,FighterDefinition],controls:[Fighter['controls'],Fighter['controls']]){this.p1=new Fighter(1,definitions[0],controls[0],455);this.p2=new Fighter(2,definitions[1],controls[1],825);this.rounds=new RoundManager(settings);this.rounds.resetMatch(this.p1,this.p2);}
  step(dt:number,input:InputSource,effects:SimulationEffects=SILENT_EFFECTS):SimulationStepResult{this.frame++;this.now=q(this.frame*dt*1000);const phaseBefore=this.rounds.phase,p1WasGrounded=this.p1.isGrounded,p2WasGrounded=this.p2.isGrounded;if(this.combat.hitStopMs>0){this.p1.update(0,input,this.p2.x,false);this.p2.update(0,input,this.p1.x,false);this.combat.consumeHitStop(dt*1000);this.quantize();return{hitStop:true,koStarted:false,roundReset:false,matchEnded:false,phaseBefore,p1WasGrounded,p2WasGrounded};}
    this.combos.update(this.now);this.p1.update(dt,input,this.p2.x,this.rounds.canFight);this.p2.update(dt,input,this.p1.x,this.rounds.canFight);this.projectiles.syncSpawn(this.p1,effects.audio);this.projectiles.syncSpawn(this.p2,effects.audio);if(this.rounds.canFight){this.combat.resolve(this.p1,this.p2,input,this.combos,effects.particles,effects.camera,effects.audio,this.now);this.projectiles.update(dt,this.p1,this.p2,input,this.combos,effects.particles,effects.camera,effects.audio,this.now);}if(this.rounds.phase==='finishWindow'){const winner=this.rounds.matchWinner===1?this.p1:this.p2;if(winner.consumeFinisherRequest()){this.rounds.startFinisher();(winner===this.p1?this.p2:this.p1).markFinished();effects.audio.play('finisher');}}
    const event=this.rounds.update(dt,this.p1,this.p2);if(event.roundReset)this.resetRound();this.quantize();return{hitStop:false,...event,phaseBefore,p1WasGrounded,p2WasGrounded};}
  resetRound():void{this.p1.reset(455);this.p2.reset(825);this.combat.reset();this.combos.reset();this.projectiles.clear();}
  resetMatch():void{this.frame=0;this.now=0;this.p1.reset(455,false);this.p2.reset(825,false);this.combat.reset();this.combos.reset();this.projectiles.clear();this.rounds.resetMatch(this.p1,this.p2);}
  snapshot():MatchSimulationSnapshot{const projectile=this.projectiles.simulationState();return{frame:this.frame,now:this.now,fighters:[this.p1.simulationState(),this.p2.simulationState()],projectiles:projectile.projectiles,projectileSeen:projectile.seen,combos:this.combos.simulationState(),round:this.rounds.simulationState(),hitStopMs:this.combat.hitStopMs};}
  restore(snapshot:MatchSimulationSnapshot):void{this.frame=snapshot.frame;this.now=snapshot.now;this.p1.restoreSimulationState(snapshot.fighters[0]);this.p2.restoreSimulationState(snapshot.fighters[1]);this.projectiles.restoreSimulationState(snapshot.projectiles,snapshot.projectileSeen,this.p1,this.p2);this.combos.restoreSimulationState(snapshot.combos);this.rounds.restoreSimulationState(snapshot.round);this.combat.hitStopMs=snapshot.hitStopMs;}
  checksum(snapshot:MatchSimulationSnapshot=this.snapshot()):string{const value=JSON.stringify(snapshot);let hash=0x811c9dc5;for(let i=0;i<value.length;i++){hash^=value.charCodeAt(i);hash=Math.imul(hash,0x01000193);}return(hash>>>0).toString(16).padStart(8,'0');}
  private quantize():void{this.p1.quantizeSimulation();this.p2.quantizeSimulation();this.rounds.timer=q(this.rounds.timer);this.rounds.phaseMs=q(this.rounds.phaseMs);this.combat.hitStopMs=q(this.combat.hitStopMs);}
}
