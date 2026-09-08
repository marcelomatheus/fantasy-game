import type { ComboSystem } from '../combat/ComboSystem.js';
import { GAME_WIDTH } from '../config/gameConfig.js';

export class ComboCounter {
  render(ctx:CanvasRenderingContext2D,combos:ComboSystem):void{
    const p1=combos.get(1),p2=combos.get(2);
    ctx.font='900 27px system-ui';ctx.textBaseline='middle';
    if(p1>=2){ctx.textAlign='left';ctx.fillStyle='#e2b76a';ctx.fillText(`${p1} HITS`,82,145);}
    if(p2>=2){ctx.textAlign='right';ctx.fillStyle='#c66a58';ctx.fillText(`${p2} HITS`,GAME_WIDTH-82,145);}
  }
}
