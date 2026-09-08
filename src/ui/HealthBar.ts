import type { Fighter } from '../characters/Fighter.js';
import { fonts } from './CanvasUi.js';

export class HealthBar {
  render(ctx:CanvasRenderingContext2D,f:Fighter,x:number,y:number,width:number,flip:boolean):void{
    const ratio=Math.max(0,f.health/f.maxHealth);
    const lag=Math.max(0,f.displayedHealth/f.maxHealth);
    const innerX=x+10,innerY=y+16,innerW=width-20;
    ctx.save();
    ctx.fillStyle='rgba(22,18,15,.96)';ctx.strokeStyle='rgba(255,232,192,.32)';ctx.lineWidth=2;
    ctx.beginPath();ctx.roundRect(x,y,width,54,12);ctx.fill();ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.03)';ctx.beginPath();ctx.roundRect(x+6,y+6,width-12,12,8);ctx.fill();
    const draw=(r:number,color:string,h:number,offset:number):void=>{const w=innerW*r;const sx=flip?innerX+innerW-w:innerX;ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(sx,innerY+offset,w,h,6);ctx.fill();};
    draw(1,'rgba(255,255,255,.045)',20,0);
    draw(lag,'#7d362f',20,0);
    draw(ratio,f.def.appearance.impact,20,0);
    ctx.fillStyle='rgba(255,248,225,.26)';const shine=innerW*ratio;const sx=flip?innerX+innerW-shine:innerX;ctx.fillRect(sx,innerY,shine,4);
    const badgeX=flip?x+width+12:x-52;
    ctx.fillStyle='rgba(22,18,15,.96)';ctx.strokeStyle='rgba(255,232,192,.32)';ctx.beginPath();ctx.roundRect(badgeX,y+4,40,46,10);ctx.fill();ctx.stroke();
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=fonts.heading(20);ctx.fillStyle='#f5ead7';ctx.fillText(f.def.name[0]??'?',badgeX+20,y+27);
    ctx.restore();
  }
}
