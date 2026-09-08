import { PLAYER_ONE_CONTROLS, PLAYER_TWO_CONTROLS } from '../config/controls.js';
import type { Controls, PlayerId } from '../types/game.js';
import type { InputManager } from '../systems/InputManager.js';
import type { InputSource } from '../systems/InputSource.js';
import type { NetworkClient } from './NetworkClient.js';

const actions=['left','right','jump','crouch','light','heavy','block'] as const;
type Action=typeof actions[number];
const bitFor=(action:Action):number=>1<<actions.indexOf(action);
export class NetworkInputSource implements InputSource {
  private codeMap=new Map<string,{side:PlayerId;action:Action}>();
  private frame=0;private localHistory=new Map<number,number>();private remoteHistory=new Map<number,number>();private localBits=0;private remoteBits=0;private previousLocal=0;private previousRemote=0;private localPressed=0;private remotePressed=0;private unsubscribe:()=>void;
  constructor(private readonly input:InputManager,private readonly network:NetworkClient,private readonly matchId:string,private readonly localSide:PlayerId,private readonly inputDelayFrames=3,private readonly physicalControls:Controls=PLAYER_ONE_CONTROLS,simulationControls:[Controls,Controls]=[PLAYER_ONE_CONTROLS,PLAYER_TWO_CONTROLS]){
    for(const action of actions){this.codeMap.set(simulationControls[0][action],{side:1,action});this.codeMap.set(simulationControls[1][action],{side:2,action});}
    this.unsubscribe=network.on('input',payload=>{if(payload.matchId===this.matchId&&payload.fromSession!==network.sessionId)this.remoteHistory.set(payload.frame,payload.bits);});
  }
  advanceFrame():void{
    this.frame++;const captured=this.captureLocal();this.localHistory.set(this.frame,captured);this.network.sendInput(this.matchId,this.frame,captured);const target=this.frame-this.inputDelayFrames;
    const nextLocal=this.localHistory.get(target)??0;const remote=this.remoteHistory.get(target);const nextRemote=remote??this.remoteBits;
    this.localPressed=nextLocal&~this.previousLocal;this.remotePressed=nextRemote&~this.previousRemote;this.previousLocal=nextLocal;this.previousRemote=nextRemote;this.localBits=nextLocal;this.remoteBits=nextRemote;
    const cutoff=this.frame-180;for(const key of this.localHistory.keys())if(key<cutoff)this.localHistory.delete(key);for(const key of this.remoteHistory.keys())if(key<cutoff)this.remoteHistory.delete(key);
  }
  isHeld(code:string):boolean{const mapping=this.codeMap.get(code);if(!mapping)return false;const bits=mapping.side===this.localSide?this.localBits:this.remoteBits;return(bits&bitFor(mapping.action))!==0;}
  wasPressed(code:string):boolean{const mapping=this.codeMap.get(code);if(!mapping)return false;const bits=mapping.side===this.localSide?this.localPressed:this.remotePressed;return(bits&bitFor(mapping.action))!==0;}
  destroy():void{this.unsubscribe();}
  private captureLocal():number{let bits=0;for(const action of actions)if(this.input.isHeld(this.physicalControls[action]))bits|=bitFor(action);return bits;}
}
