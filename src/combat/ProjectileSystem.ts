import { STAGE_LEFT, STAGE_RIGHT } from '../config/gameConfig.js';
import type { PlayerId, ProjectileDefinition, ProjectileSimulationState, Rect, SpecialKey, SpecialMoveDefinition } from '../types/game.js';
import type { Fighter } from '../characters/Fighter.js';
import type { InputSource } from '../systems/InputSource.js';
import type { AudioManager } from '../systems/AudioManager.js';
import type { ParticleSystem } from '../systems/ParticleSystem.js';
import type { CameraManager } from '../systems/CameraManager.js';
import type { ComboSystem } from './ComboSystem.js';
import { rectsOverlap } from '../utils/math.js';

interface Projectile {owner:PlayerId;x:number;y:number;vx:number;life:number;definition:ProjectileDefinition;attack:SpecialMoveDefinition;facing:-1|1;}
export class ProjectileSystem {
  private projectiles:Projectile[]=[];private seen:Record<PlayerId,number>={1:0,2:0};
  syncSpawn(f:Fighter,audio:AudioManager):void{const special=f.currentSpecial,p=special?.projectile,serial=f.attackSerialNumber;if(!p||f.attackElapsed<p.spawnAtMs||this.seen[f.id]===serial)return;this.seen[f.id]=serial;if(this.projectiles.some(v=>v.owner===f.id))return;this.projectiles.push({owner:f.id,x:f.x+f.facing*(f.def.body.width*.6+p.width*.5),y:f.y-92,vx:p.speed*f.facing,life:p.lifetimeMs/1000,definition:p,attack:special,facing:f.facing});audio.play('projectileLaunch');}
  update(dt:number,p1:Fighter,p2:Fighter,input:InputSource,combos:ComboSystem,particles:ParticleSystem,camera:CameraManager,audio:AudioManager,now:number):void{for(const p of this.projectiles){p.x+=p.vx*dt;p.life-=dt;const target=p.owner===1?p2:p1,owner=p.owner===1?p1:p2;const r:Rect={x:p.x-p.definition.width/2,y:p.y-p.definition.height/2,width:p.definition.width,height:p.definition.height};if(!rectsOverlap(r,target.hurtbox))continue;if(target.isBlocking(input)){target.takeBlock(p.attack.chipDamage,p.attack.blockStun,p.attack.blockKnockback*p.facing);owner.addMeter(3);target.addMeter(2);audio.play('block');}else{const count=combos.registerHit(owner.id,now);const scale=Math.max(.46,Math.pow(.9,count-1));target.takeHit(Math.max(1,Math.round(p.attack.damage*scale)),p.attack.hitStun,p.attack.knockback.x*p.facing,-p.attack.knockback.y);owner.addMeter(10);target.addMeter(5);particles.burst(target.x-p.facing*22,target.y-96,p.definition.color,p.facing,true);camera.punch(p.attack.shake);audio.play('projectileImpact');audio.play('hurt');}p.life=0;}this.projectiles=this.projectiles.filter(p=>p.life>0&&p.x>STAGE_LEFT-80&&p.x<STAGE_RIGHT+80);}
  render(ctx:CanvasRenderingContext2D):void{for(const p of this.projectiles){ctx.save();ctx.translate(p.x,p.y);ctx.globalCompositeOperation='lighter';const g=ctx.createRadialGradient(0,0,2,0,0,p.definition.width*.7);g.addColorStop(0,'#fff7dc');g.addColorStop(.35,p.definition.color);g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(0,0,p.definition.width*.72,p.definition.height*.85,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle=p.definition.color;ctx.lineWidth=4;for(let i=0;i<3;i++){ctx.globalAlpha=.32-i*.08;ctx.beginPath();ctx.moveTo(-p.facing*(18+i*13),-8+i*5);ctx.lineTo(-p.facing*(p.definition.width*.8+i*18),4-i*4);ctx.stroke();}ctx.restore();}}
  clear():void{this.projectiles=[];this.seen={1:0,2:0};}
  simulationState():{projectiles:ProjectileSimulationState[];seen:{1:number;2:number}}{return{projectiles:this.projectiles.map(p=>({owner:p.owner,x:p.x,y:p.y,vx:p.vx,life:p.life,special:p.attack.key as SpecialKey,facing:p.facing})),seen:{...this.seen}};}
  restoreSimulationState(projectiles:ProjectileSimulationState[],seen:{1:number;2:number},p1:Fighter,p2:Fighter):void{this.seen={...seen};this.projectiles=projectiles.map(p=>{const owner=p.owner===1?p1:p2;const attack=owner.def.specials[p.special];const definition=attack.projectile;if(!definition)throw new Error(`Projectile definition missing for ${owner.def.id}:${p.special}`);return{owner:p.owner,x:p.x,y:p.y,vx:p.vx,life:p.life,definition,attack,facing:p.facing};});}
}
