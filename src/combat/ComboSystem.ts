import { COMBO_WINDOW_MS } from '../config/gameConfig.js';
import type { ComboSimulationState,PlayerId } from '../types/game.js';

interface ComboState { count: number; lastHitAt: number; }
export class ComboSystem {
  private combos: Record<PlayerId, ComboState> = {1:{count:0,lastHitAt:-Infinity},2:{count:0,lastHitAt:-Infinity}};
  nextCount(player:PlayerId,now:number):number { const c=this.combos[player]; return now-c.lastHitAt<=COMBO_WINDOW_MS?c.count+1:1; }
  registerHit(player:PlayerId,now:number):number { const c=this.combos[player];c.count=this.nextCount(player,now);c.lastHitAt=now;return c.count; }
  get(player:PlayerId):number{return this.combos[player].count;}
  update(now:number):void{for(const id of [1,2] as PlayerId[]){const c=this.combos[id];if(now-c.lastHitAt>COMBO_WINDOW_MS)c.count=0;}}
  break(player:PlayerId):void{this.combos[player]={count:0,lastHitAt:-Infinity};}
  reset():void{this.combos={1:{count:0,lastHitAt:-Infinity},2:{count:0,lastHitAt:-Infinity}};}
  simulationState():ComboSimulationState{return{1:{count:this.combos[1].count,lastHitAt:Number.isFinite(this.combos[1].lastHitAt)?this.combos[1].lastHitAt:null},2:{count:this.combos[2].count,lastHitAt:Number.isFinite(this.combos[2].lastHitAt)?this.combos[2].lastHitAt:null}};}
  restoreSimulationState(state:ComboSimulationState):void{this.combos={1:{count:state[1].count,lastHitAt:state[1].lastHitAt??-Infinity},2:{count:state[2].count,lastHitAt:state[2].lastHitAt??-Infinity}};}
}
