import type { Facing } from '../types/game.js';

interface Particle { x:number; y:number; vx:number; vy:number; life:number; maxLife:number; size:number; color:string; }
export class ParticleSystem {
  private particles: Particle[] = [];
  burst(x:number,y:number,color:string,facing:Facing,strong:boolean): void {
    const count = strong ? 16 : 9;
    for(let i=0;i<count;i++){
      const angle = (Math.random()-.5)*1.9; const speed=(strong?320:220)*(0.55+Math.random()*.7);
      this.particles.push({x,y,vx:Math.cos(angle)*speed*facing,vy:Math.sin(angle)*speed-50,life:0,maxLife:strong?0.42:0.28,size:strong?5+Math.random()*7:3+Math.random()*5,color});
    }
  }
  update(dt:number):void{ for(const p of this.particles){p.life+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=650*dt;p.vx*=0.96;} this.particles=this.particles.filter(p=>p.life<p.maxLife); }
  render(ctx:CanvasRenderingContext2D):void{ for(const p of this.particles){const a=1-p.life/p.maxLife;ctx.globalAlpha=a;ctx.fillStyle=p.color;ctx.fillRect(p.x-p.size/2,p.y-p.size/2,p.size,p.size);}ctx.globalAlpha=1; }
  clear():void{this.particles=[];}
}
