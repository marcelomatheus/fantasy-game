import type { Fighter } from '../characters/Fighter.js';
import type { RoundManager } from '../systems/RoundManager.js';
import { GAME_WIDTH } from '../config/gameConfig.js';
import { HealthBar } from './HealthBar.js';
import { fonts } from './CanvasUi.js';

export class RoundHUD {
  private bar=new HealthBar();
  render(ctx:CanvasRenderingContext2D,p1:Fighter,p2:Fighter,rounds:RoundManager):void{
    const grad=ctx.createLinearGradient(0,0,0,128);grad.addColorStop(0,'rgba(18,15,13,.92)');grad.addColorStop(.55,'rgba(18,15,13,.52)');grad.addColorStop(1,'rgba(18,15,13,0)');ctx.fillStyle=grad;ctx.fillRect(0,0,GAME_WIDTH,132);
    this.bar.render(ctx,p1,82,38,430,false);
    this.bar.render(ctx,p2,GAME_WIDTH-512,38,430,true);

    ctx.textBaseline='middle';
    ctx.textAlign='left';ctx.fillStyle='#f4ead8';ctx.font=fonts.heading(22);ctx.fillText(p1.def.name,82,22);
    ctx.textAlign='right';ctx.fillText(p2.def.name,GAME_WIDTH-82,22);
    ctx.font=fonts.body(10);ctx.fillStyle='rgba(247,237,220,.7)';ctx.textAlign='left';ctx.fillText((p1.def.archetype??'balanced').toUpperCase(),84,92);ctx.textAlign='right';ctx.fillText((p2.def.archetype??'balanced').toUpperCase(),GAME_WIDTH-84,92);

    ctx.fillStyle='rgba(18,15,13,.96)';ctx.strokeStyle='rgba(255,232,192,.42)';ctx.lineWidth=2;
    ctx.beginPath();ctx.roundRect(GAME_WIDTH/2-62,18,124,78,18);ctx.fill();ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.03)';ctx.beginPath();ctx.roundRect(GAME_WIDTH/2-54,26,108,12,8);ctx.fill();
    ctx.textAlign='center';ctx.fillStyle='#f8efd9';ctx.font=fonts.title(42);ctx.fillText(String(Math.ceil(rounds.timer)).padStart(2,'0'),GAME_WIDTH/2,56);
    ctx.font=fonts.bodyStrong(11);ctx.fillStyle='rgba(247,237,220,.74)';ctx.fillText(`ROUND ${rounds.round}`,GAME_WIDTH/2,82);

    this.roundDots(ctx,100,103,p1,rounds,false);
    this.roundDots(ctx,GAME_WIDTH-100,103,p2,rounds,true);
    this.meter(ctx,82,116,430,p1.meter,false);this.meter(ctx,GAME_WIDTH-512,116,430,p2.meter,true);
  }

  private meter(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,value:number,flip:boolean):void{ctx.fillStyle='rgba(12,10,9,.82)';ctx.fillRect(x,y,w,12);const fill=w*Math.max(0,Math.min(1,value/100));const g=ctx.createLinearGradient(x,y,x+w,y);g.addColorStop(0,'#7c4bba');g.addColorStop(.55,'#d49a4f');g.addColorStop(1,'#fff1a8');ctx.fillStyle=g;ctx.fillRect(flip?x+w-fill:x,y,fill,12);ctx.strokeStyle=value>=100?'#fff0a0':'rgba(255,235,200,.35)';ctx.strokeRect(x,y,w,12);for(let i=1;i<4;i++){ctx.fillStyle='rgba(18,13,10,.55)';ctx.fillRect(x+w*i/4-1,y,2,12);}if(value>=100){ctx.textAlign=flip?'right':'left';ctx.font=fonts.bodyStrong(9);ctx.fillStyle='#fff1a0';ctx.fillText('SUPER READY',flip?x+w:x,y+24);}}

  private roundDots(ctx:CanvasRenderingContext2D,startX:number,y:number,f:Fighter,rounds:RoundManager,flip:boolean):void{
    for(let i=0;i<rounds.roundsToWin;i++){
      const x=flip?startX-i*24:startX+i*24;
      ctx.fillStyle=i<f.wins?f.def.appearance.impact:'rgba(244,234,216,.18)';ctx.beginPath();ctx.arc(x,y,7,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='rgba(255,232,192,.24)';ctx.lineWidth=1.2;ctx.stroke();
    }
  }
}
