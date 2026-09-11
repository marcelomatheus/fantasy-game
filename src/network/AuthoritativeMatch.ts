import { getFighter,withSkin } from '../characters/roster.js';
import { PLAYER_ONE_CONTROLS,PLAYER_TWO_CONTROLS } from '../config/controls.js';
import { MatchSimulation } from '../simulation/MatchSimulation.js';
import type { MatchSettings,MatchSimulationSnapshot,PlayerId } from '../types/game.js';
import { BitInputSource } from './inputBits.js';
import type { AuthoritativeStatePayload,NetcodeConfig } from './protocol.js';

const STEP=1/60;
export interface AuthorityMatchOptions {matchId:string;fighterIds:[string,string];skinIds:[string,string];settings:MatchSettings;netcode:NetcodeConfig;publish:(state:AuthoritativeStatePayload)=>void;finish:(winner:PlayerId)=>void;}

export class AuthoritativeMatch{
  private readonly simulation:MatchSimulation;private readonly source=new BitInputSource([PLAYER_ONE_CONTROLS,PLAYER_TWO_CONTROLS]);private readonly inputs:[Map<number,number>,Map<number,number>]=[new Map(),new Map()];private readonly resolved:[Map<number,number>,Map<number,number>]=[new Map(),new Map()];private readonly snapshots=new Map<number,MatchSimulationSnapshot>();private revision=0;private confirmedFrame=0;private lastPublishedFrame=-1;private rollbackCount=0;private maxRollbackDepth=0;private lateInputs=0;private finished=false;private pausedAt:number|null=null;
  constructor(private readonly options:AuthorityMatchOptions){const defs=options.fighterIds.map((id,index)=>withSkin(getFighter(id,index),options.skinIds[index]??'default')) as [ReturnType<typeof getFighter>,ReturnType<typeof getFighter>];this.simulation=new MatchSimulation(options.settings,defs,[PLAYER_ONE_CONTROLS,PLAYER_TWO_CONTROLS]);this.snapshots.set(0,this.simulation.snapshot());}
  get frame():number{return this.simulation.frame;}
  get state():AuthoritativeStatePayload{return{matchId:this.options.matchId,frame:this.simulation.frame,confirmedFrame:this.confirmedFrame,revision:this.revision,acks:[this.latestInput(0),this.latestInput(1)],checksum:this.simulation.checksum(),paused:this.pausedAt!==null,metrics:{rollbacks:this.rollbackCount,maxRollbackDepth:this.maxRollbackDepth,lateInputs:this.lateInputs},state:this.simulation.snapshot()};}
  acceptInput(side:PlayerId,frame:number,bits:number):'accepted'|'duplicate'|'conflict'{if(frame>this.simulation.frame+240)return'conflict';const index=side-1 as 0|1,map=this.inputs[index],existing=map.get(frame);if(existing!==undefined)return existing===bits?'duplicate':'conflict';map.set(frame,bits);this.advanceConfirmation();const predicted=this.resolved[index].get(frame);if(predicted!==undefined&&predicted!==bits){this.lateInputs++;if(this.simulation.frame-frame<this.options.netcode.maxRollbackFrames)this.rollback(frame);}return'accepted';}
  tick(now:number):void{if(this.finished||this.pausedAt!==null||now<this.options.netcode.startAt)return;const target=Math.max(0,Math.floor((now-this.options.netcode.startAt)/(1000/60))+1-this.options.netcode.inputDelayFrames);let steps=0;while(this.simulation.frame<target&&steps++<8)this.stepFrame(this.simulation.frame+1);if(this.simulation.frame>0&&this.simulation.frame!==this.lastPublishedFrame&&this.simulation.frame%this.options.netcode.snapshotIntervalFrames===0)this.publish();if(this.simulation.rounds.phase==='matchOver'&&this.simulation.rounds.matchWinner&&this.confirmedFrame>=this.simulation.frame){this.finished=true;this.publish();console.log(JSON.stringify({event:'netcode_match_complete',matchId:this.options.matchId,frame:this.simulation.frame,confirmedFrame:this.confirmedFrame,...this.state.metrics}));this.options.finish(this.simulation.rounds.matchWinner);}}
  pause(now:number):void{if(this.pausedAt!==null)return;this.pausedAt=now;this.revision++;this.publish();}
  resume(now:number):void{if(this.pausedAt===null)return;this.options.netcode.startAt+=now-this.pausedAt;this.pausedAt=null;this.revision++;this.publish();}
  publish():void{this.lastPublishedFrame=this.simulation.frame;this.options.publish(this.state);}
  private stepFrame(frame:number):void{const p1=this.resolve(0,frame),p2=this.resolve(1,frame);this.source.setBits(p1,p2);this.simulation.step(STEP,this.source);this.snapshots.set(frame,this.simulation.snapshot());this.trim();}
  private resolve(side:0|1,frame:number):number{const value=this.inputs[side].get(frame)??this.resolved[side].get(frame-1)??0;this.resolved[side].set(frame,value);return value;}
  private rollback(from:number):void{const base=this.snapshots.get(from-1);if(!base)return;const end=this.simulation.frame;this.rollbackCount++;this.maxRollbackDepth=Math.max(this.maxRollbackDepth,end-from+1);this.simulation.restore(base);for(const side of [0,1] as const)for(const key of [...this.resolved[side].keys()])if(key>=from)this.resolved[side].delete(key);this.source.primeBits(this.resolved[0].get(from-1)??0,this.resolved[1].get(from-1)??0);for(let frame=from;frame<=end;frame++)this.stepFrame(frame);this.revision++;this.publish();}
  private advanceConfirmation():void{while(this.inputs[0].has(this.confirmedFrame+1)&&this.inputs[1].has(this.confirmedFrame+1))this.confirmedFrame++;}
  private latestInput(side:0|1):number{let latest=0;for(const frame of this.inputs[side].keys())if(frame>latest)latest=frame;return latest;}
  private trim():void{const cutoff=this.simulation.frame-180;for(const collection of [...this.inputs,...this.resolved,this.snapshots])for(const key of collection.keys())if(key<cutoff)collection.delete(key);}
}
