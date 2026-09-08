import { CAMERA_MAX_ZOOM, CAMERA_MIN_ZOOM, GAME_WIDTH, STAGE_LEFT, STAGE_RIGHT } from '../config/gameConfig.js';
import { clamp, lerp } from '../utils/math.js';

export class CameraManager {
  x = GAME_WIDTH/2; zoom = 1.06; shakeX=0; shakeY=0; private shake=0; shakeEnabled=true;
  update(dt:number,p1x:number,p2x:number):void{
    const center=(p1x+p2x)/2; const distance=Math.abs(p1x-p2x);
    const desiredZoom=clamp(1.08-(Math.max(0,distance-430)/1350),CAMERA_MIN_ZOOM,1.08);
    const halfView=(GAME_WIDTH/desiredZoom)/2; const desiredX=clamp(center,STAGE_LEFT+halfView,STAGE_RIGHT-halfView);
    this.x=lerp(this.x,desiredX,1-Math.pow(.0005,dt)); this.zoom=lerp(this.zoom,desiredZoom,1-Math.pow(.001,dt));
    this.shake=Math.max(0,this.shake-22*dt); this.shakeX=this.shakeEnabled?(Math.random()-.5)*this.shake:0; this.shakeY=this.shakeEnabled?(Math.random()-.5)*this.shake*.55:0;
  }
  punch(amount:number):void{if(this.shakeEnabled)this.shake=Math.max(this.shake,amount);}
  begin(ctx:CanvasRenderingContext2D):void{ctx.save();ctx.translate(GAME_WIDTH/2+this.shakeX,360+this.shakeY);ctx.scale(this.zoom,this.zoom);ctx.translate(-this.x,-360);}
  end(ctx:CanvasRenderingContext2D):void{ctx.restore();}
}
