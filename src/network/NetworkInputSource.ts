import { PLAYER_ONE_CONTROLS,PLAYER_TWO_CONTROLS } from '../config/controls.js';
import type { InputManager } from '../systems/InputManager.js';
import type { InputSource } from '../systems/InputSource.js';
import type { Controls,PlayerId } from '../types/game.js';
import type { NetworkClient } from './NetworkClient.js';
import { INPUT_ACTIONS,bitFor,type InputAction } from './inputBits.js';
import type { AuthoritativeStatePayload,NetcodeConfig } from './protocol.js';

export class NetworkInputSource implements InputSource{
  private codeMap=new Map<string,{side:PlayerId;action:InputAction}>();
  private captureFrame=0;private simulatedFrame=0;private localHistory=new Map<number,number>();private remoteHistory=new Map<number,number>();private resolvedRemote=new Map<number,number>();
  private localBits=0;private remoteBits=0;private localPressed=0;private remotePressed=0;private rollbackFrom:number|null=null;private authoritative:AuthoritativeStatePayload|null=null;private started=false;private suspended=false;private resumeAt=0;private lateInputs=0;private predictionMisses=0;private unsubscribers:(()=>void)[]=[];
  constructor(private readonly input:InputManager,private readonly network:NetworkClient,private readonly matchId:string,private readonly localSide:PlayerId,private readonly netcode:NetcodeConfig,private readonly physicalControls:Controls=PLAYER_ONE_CONTROLS,simulationControls:[Controls,Controls]=[PLAYER_ONE_CONTROLS,PLAYER_TWO_CONTROLS]){
    for(const action of INPUT_ACTIONS){this.codeMap.set(simulationControls[0][action],{side:1,action});this.codeMap.set(simulationControls[1][action],{side:2,action});}
    this.unsubscribers.push(network.on('input',payload=>{if(payload.matchId!==this.matchId||payload.fromSession===network.sessionId)return;const existing=this.remoteHistory.get(payload.frame);if(existing!==undefined&&existing!==payload.bits)return;this.remoteHistory.set(payload.frame,payload.bits);const predicted=this.resolvedRemote.get(payload.frame);if(predicted!==undefined&&predicted!==payload.bits){this.lateInputs++;this.predictionMisses++;this.rollbackFrom=this.rollbackFrom===null?payload.frame:Math.min(this.rollbackFrom,payload.frame);}}));
    this.unsubscribers.push(network.on('state',payload=>{if(payload.matchId!==this.matchId)return;this.suspended=payload.paused;if(!this.authoritative||payload.revision>this.authoritative.revision||(payload.revision===this.authoritative.revision&&payload.frame>this.authoritative.frame))this.authoritative=payload;}));
    this.unsubscribers.push(network.on('matchPaused',payload=>{if(payload.matchId===this.matchId)this.suspended=true;}));
    this.unsubscribers.push(network.on('matchResumed',payload=>{if(payload.matchId===this.matchId){this.suspended=false;this.resumeAt=payload.startAt;}}));
  }
  get frame():number{return this.simulatedFrame;}
  get maxRollbackFrames():number{return this.netcode.maxRollbackFrames;}
  get metrics():{lateInputs:number;predictionMisses:number;ping:number;jitter:number;bufferedAmount:number;droppedInputs:number}{return{lateInputs:this.lateInputs,predictionMisses:this.predictionMisses,ping:this.network.ping,jitter:this.network.jitter,bufferedAmount:this.network.bufferedAmount,droppedInputs:this.network.droppedInputs};}
  advanceFrame():boolean{if(this.suspended||this.network.serverTimeNow()<this.resumeAt)return false;if(!this.started){if(this.network.serverTimeNow()<this.netcode.startAt)return false;this.started=true;}this.captureFrame++;const bits=this.captureLocal();this.localHistory.set(this.captureFrame,bits);this.network.sendInput(this.matchId,this.captureFrame,bits);const target=this.captureFrame-this.netcode.inputDelayFrames;if(target<1)return false;this.simulatedFrame=target;this.applyFrame(target);this.cleanup();return true;}
  applyFrame(frame:number):void{const local=this.localHistory.get(frame)??0;const remote=this.remoteHistory.get(frame)??this.resolvedRemote.get(frame-1)??0;const previousLocal=this.localHistory.get(frame-1)??0;const previousRemote=this.resolvedRemote.get(frame-1)??0;this.resolvedRemote.set(frame,remote);this.localBits=local;this.remoteBits=remote;this.localPressed=local&~previousLocal;this.remotePressed=remote&~previousRemote;}
  consumeRollbackFrame():number|null{const frame=this.rollbackFrom;this.rollbackFrom=null;if(frame!==null)for(const key of [...this.resolvedRemote.keys()])if(key>=frame)this.resolvedRemote.delete(key);return frame;}
  consumeAuthoritativeState(maxFrame:number):AuthoritativeStatePayload|null{if(!this.authoritative||this.authoritative.frame>maxFrame)return null;const state=this.authoritative;this.authoritative=null;return state;}
  isHeld(code:string):boolean{const mapping=this.codeMap.get(code);if(!mapping)return false;const bits=mapping.side===this.localSide?this.localBits:this.remoteBits;return(bits&bitFor(mapping.action))!==0;}
  wasPressed(code:string):boolean{const mapping=this.codeMap.get(code);if(!mapping)return false;const bits=mapping.side===this.localSide?this.localPressed:this.remotePressed;return(bits&bitFor(mapping.action))!==0;}
  destroy():void{this.unsubscribers.forEach(unsubscribe=>unsubscribe());}
  private captureLocal():number{let bits=0;for(const action of INPUT_ACTIONS)if(this.input.isHeld(this.physicalControls[action]))bits|=bitFor(action);return bits;}
  private cleanup():void{const cutoff=this.simulatedFrame-180;for(const history of [this.localHistory,this.remoteHistory,this.resolvedRemote])for(const key of history.keys())if(key<cutoff)history.delete(key);}
}
