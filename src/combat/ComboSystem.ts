import { COMBO_WINDOW_MS } from '../config/gameConfig.js';
import type { PlayerId } from '../types/game.js';

interface ComboState { count: number; lastHitAt: number; }
export class ComboSystem {
  private combos: Record<PlayerId, ComboState> = {1:{count:0,lastHitAt:-Infinity},2:{count:0,lastHitAt:-Infinity}};
  nextCount(player:PlayerId,now:number):number { const c=this.combos[player]; return now-c.lastHitAt<=COMBO_WINDOW_MS?c.count+1:1; }
  registerHit(player:PlayerId,now:number):number { const c=this.combos[player];c.count=this.nextCount(player,now);c.lastHitAt=now;return c.count; }
  get(player:PlayerId):number{return this.combos[player].count;}
  update(now:number):void{for(const id of [1,2] as PlayerId[]){const c=this.combos[id];if(now-c.lastHitAt>COMBO_WINDOW_MS)c.count=0;}}
  break(player:PlayerId):void{this.combos[player]={count:0,lastHitAt:-Infinity};}
  reset():void{this.combos={1:{count:0,lastHitAt:-Infinity},2:{count:0,lastHitAt:-Infinity}};}
}
