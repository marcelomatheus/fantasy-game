import type { Controls,PlayerId } from '../types/game.js';
import type { InputSource } from '../systems/InputSource.js';

export const INPUT_ACTIONS=['left','right','jump','crouch','light','heavy','block'] as const;
export type InputAction=typeof INPUT_ACTIONS[number];
export const bitFor=(action:InputAction):number=>1<<INPUT_ACTIONS.indexOf(action);

export class BitInputSource implements InputSource{
  private current:[number,number]=[0,0];private previous:[number,number]=[0,0];private codeMap=new Map<string,{side:PlayerId;action:InputAction}>();
  constructor(controls:[Controls,Controls]){for(const action of INPUT_ACTIONS){this.codeMap.set(controls[0][action],{side:1,action});this.codeMap.set(controls[1][action],{side:2,action});}}
  primeBits(p1:number,p2:number):void{this.current=[p1,p2];this.previous=[p1,p2];}
  setBits(p1:number,p2:number):void{this.previous=[...this.current];this.current=[p1,p2];}
  isHeld(code:string):boolean{const m=this.codeMap.get(code);if(!m)return false;const index=m.side-1 as 0|1;return Boolean(this.current[index]&bitFor(m.action));}
  wasPressed(code:string):boolean{const m=this.codeMap.get(code);if(!m)return false;const index=m.side-1 as 0|1;return Boolean((this.current[index]&~this.previous[index])&bitFor(m.action));}
}
