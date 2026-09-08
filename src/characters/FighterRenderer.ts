import type { Fighter } from './Fighter.js';
import { clamp, lerp } from '../utils/math.js';

interface Point { x: number; y: number; }
interface Pose {
  head: Point;
  neck: Point;
  hip: Point;
  rearElbow: Point; rearHand: Point;
  frontElbow: Point; frontHand: Point;
  rearKnee: Point; rearFoot: Point;
  frontKnee: Point; frontFoot: Point;
  torsoLean: number;
}

export class FighterRenderer {
  render(ctx: CanvasRenderingContext2D, fighter: Fighter, now: number): void {
    const a = fighter.def.appearance;
    const pose = this.poseFor(fighter, now);
    const ko = fighter.state === 'ko';

    ctx.save();
    ctx.translate(fighter.x, fighter.y);
    ctx.scale(fighter.facing, 1);

    if (ko) {
      ctx.rotate(-1.22);
      ctx.translate(-52, -10);
    }

    this.shadow(ctx, fighter);

    if (fighter.flashMs > 0) {
      ctx.globalAlpha = 0.28 + Math.sin(now * 0.08) * 0.08;
      ctx.fillStyle = '#fff6df';
      ctx.beginPath();
      ctx.ellipse(0, -88, fighter.def.body.width * 0.72, fighter.def.body.height * 0.62, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Rear limbs first for natural overlap.
    this.leg(ctx, pose.hip, pose.rearKnee, pose.rearFoot, a.secondary, a.primaryShadow, a.shoe, false, a.build);
    this.arm(ctx, {x:-24,y:-119}, pose.rearElbow, pose.rearHand, a.skin, a.skinShadow, a.accent, false, a.style);

    this.torso(ctx, pose, a);
    this.waistAndShorts(ctx, pose, a);

    // Front limbs sit above the torso.
    this.leg(ctx, pose.hip, pose.frontKnee, pose.frontFoot, a.secondary, a.primaryShadow, a.shoe, true, a.build);
    this.arm(ctx, {x:25,y:-119}, pose.frontElbow, pose.frontHand, a.skin, a.skinShadow, a.accent, true, a.style);

    this.neckAndHead(ctx, pose, a, fighter.state, now);

    if (fighter.attackHitbox) this.attackTrail(ctx, fighter, a.impact);
    ctx.restore();
  }

  private poseFor(fighter: Fighter, now: number): Pose {
    const idle = Math.sin(now * 0.005 + fighter.id * 1.4);
    const walking = fighter.state === 'walkForward' || fighter.state === 'walkBackward';
    const walk = walking ? Math.sin(now * 0.019) : 0;
    const progress = fighter.attackProgress;
    const attackWave = Math.sin(clamp(progress * 1.62, 0, 1) * Math.PI);
    const crouch = fighter.state === 'crouch' ? 1 : 0;
    const jump = !fighter.isGrounded ? clamp((598 - fighter.y) / 140, 0, 1) : 0;
    const hit = fighter.state === 'hit' ? 1 : 0;
    const block = fighter.state === 'block' ? 1 : 0;

    const hipY = lerp(-61 + idle * 1.5, -42, crouch);
    const headY = lerp(-158 + idle * 2.5, -132, crouch) + jump * 1.5;
    const pose: Pose = {
      head: {x: hit ? -10 : 2, y: headY},
      neck: {x: 0, y: headY + 27},
      hip: {x: 0, y: hipY},
      rearElbow: {x: -42, y: -105}, rearHand: {x: -22, y: -91},
      frontElbow: {x: 43, y: -106}, frontHand: {x: 28, y: -91},
      rearKnee: {x: -18 - walk * 10, y: -31}, rearFoot: {x: -25 - walk * 17, y: -3},
      frontKnee: {x: 20 + walk * 10, y: -31}, frontFoot: {x: 27 + walk * 17, y: -3},
      torsoLean: hit ? -0.12 : 0
    };

    if (crouch) {
      pose.rearKnee = {x:-27,y:-19}; pose.rearFoot = {x:-45,y:-2};
      pose.frontKnee = {x:31,y:-19}; pose.frontFoot = {x:50,y:-2};
      pose.rearElbow = {x:-37,y:-91}; pose.rearHand = {x:-8,y:-78};
      pose.frontElbow = {x:38,y:-89}; pose.frontHand = {x:24,y:-75};
    }

    if (jump > 0) {
      pose.rearKnee = {x:-28,y:-40}; pose.rearFoot = {x:-14,y:-18};
      pose.frontKnee = {x:28,y:-45}; pose.frontFoot = {x:38,y:-22};
      pose.rearElbow = {x:-45,y:-112}; pose.rearHand = {x:-22,y:-94};
    }

    if (block) {
      pose.frontElbow = {x:37,y:-127}; pose.frontHand = {x:17,y:-150};
      pose.rearElbow = {x:21,y:-111}; pose.rearHand = {x:5,y:-130};
      pose.torsoLean = -0.04;
    }

    if (hit) {
      pose.frontElbow = {x:18,y:-95}; pose.frontHand = {x:42,y:-81};
      pose.rearElbow = {x:-48,y:-115}; pose.rearHand = {x:-58,y:-96};
      pose.frontKnee.x -= 8;
    }

    if (fighter.state === 'attack' && fighter.currentAttack) {
      switch (fighter.currentAttack.key) {
        case 'light':
          pose.frontElbow = {x:48 + 24 * attackWave,y:-115};
          pose.frontHand = {x:45 + 83 * attackWave,y:-112 + 4 * attackWave};
          pose.rearHand = {x:-10,y:-120};
          pose.torsoLean = 0.06 * attackWave;
          break;
        case 'heavy':
          if (fighter.def.appearance.style === 'kickboxer') {
            pose.frontKnee = {x:42 + 24*attackWave,y:-44 - 32*attackWave};
            pose.frontFoot = {x:44 + 117*attackWave,y:-12 - 83*attackWave};
            pose.frontHand = {x:22,y:-121}; pose.rearHand = {x:-20,y:-116};
            pose.torsoLean = -0.06 * attackWave;
          } else {
            pose.frontElbow = {x:52 + 37*attackWave,y:-125 - 16*attackWave};
            pose.frontHand = {x:52 + 103*attackWave,y:-116 - 34*attackWave};
            pose.rearHand = {x:-2,y:-126};
            pose.torsoLean = 0.09 * attackWave;
          }
          break;
        case 'crouchLight':
          pose.frontElbow = {x:46,y:-72}; pose.frontHand = {x:94,y:-55};
          pose.hip.y = -44; pose.head.y = -133; pose.neck.y = -106;
          pose.frontKnee = {x:34,y:-18}; pose.frontFoot = {x:62,y:-2};
          break;
        case 'airLight':
          pose.frontKnee = {x:45 + 29*attackWave,y:-64};
          pose.frontFoot = {x:82 + 70*attackWave,y:-58 + 12*attackWave};
          pose.frontHand = {x:52,y:-113};
          break;
      }
    }

    return pose;
  }

  private shadow(ctx: CanvasRenderingContext2D, fighter: Fighter): void {
    const altitude = Math.max(0, 598 - fighter.y);
    const scale = clamp(1 - altitude / 480, 0.52, 1);
    ctx.save();
    ctx.globalAlpha = 0.3 * scale;
    ctx.fillStyle = '#16120d';
    ctx.scale(1, 0.28);
    ctx.beginPath();
    ctx.ellipse(0, 0, fighter.def.body.width * 0.72 * scale, 26 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private torso(ctx: CanvasRenderingContext2D, pose: Pose, a: Fighter['def']['appearance']): void {
    ctx.save();
    ctx.rotate(pose.torsoLean);
    const shoulder = a.build === 'heavy' ? 39 : 33;
    const waist = a.build === 'heavy' ? 29 : 25;
    const top = -132;
    const bottom = pose.hip.y - 4;
    ctx.fillStyle = a.primary;
    ctx.strokeStyle = '#28221d';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(-shoulder, top + 8);
    ctx.quadraticCurveTo(-shoulder-3, -106, -waist, bottom);
    ctx.quadraticCurveTo(0, bottom + 8, waist, bottom);
    ctx.quadraticCurveTo(shoulder+3, -106, shoulder, top + 8);
    ctx.quadraticCurveTo(15, top - 5, 0, top - 1);
    ctx.quadraticCurveTo(-15, top - 5, -shoulder, top + 8);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Fabric folds and chest planes.
    ctx.strokeStyle = a.primaryShadow;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.75;
    ctx.beginPath(); ctx.moveTo(-18,-118); ctx.quadraticCurveTo(-8,-99,-13,bottom-6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(17,-117); ctx.quadraticCurveTo(8,-100,13,bottom-8); ctx.stroke();
    ctx.globalAlpha = 1;

    if (a.style === 'boxer') {
      ctx.fillStyle = a.primaryShadow;
      ctx.beginPath();
      ctx.moveTo(-31,-125); ctx.lineTo(-17,-133); ctx.lineTo(-9,-85); ctx.lineTo(-23,-71); ctx.closePath(); ctx.fill();
      ctx.fillStyle = a.accent;
      ctx.fillRect(-3,-128,6,52);
    } else {
      // Athletic tank seams.
      ctx.strokeStyle = a.secondary;
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(-22,-127); ctx.quadraticCurveTo(-17,-105,-20,-90); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(22,-127); ctx.quadraticCurveTo(17,-105,20,-90); ctx.stroke();
    }
    ctx.restore();
  }

  private waistAndShorts(ctx: CanvasRenderingContext2D, pose: Pose, a: Fighter['def']['appearance']): void {
    const y = pose.hip.y - 10;
    ctx.fillStyle = a.secondary;
    ctx.strokeStyle = '#28221d';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(-31, y, 62, 26, 7);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = a.accent;
    ctx.fillRect(-31, y, 62, 5);
    ctx.fillStyle = 'rgba(255,255,255,.22)';
    ctx.fillRect(-2, y+6, 4, 15);
  }

  private leg(ctx: CanvasRenderingContext2D, hip: Point, knee: Point, foot: Point, shorts: string, shadow: string, shoe: string, front: boolean, build: 'lean'|'heavy'): void {
    const hipX = hip.x + (front ? 18 : -18);
    const thigh = build === 'heavy' ? 23 : 20;
    const calf = build === 'heavy' ? 19 : 16;
    this.capsule(ctx,{x:hipX,y:hip.y+8},knee,thigh,shorts,'#28221d');
    this.capsule(ctx,knee,{x:foot.x,y:foot.y-8},calf,shadow,'#28221d');
    // Knee cap.
    ctx.fillStyle = shadow; ctx.strokeStyle = '#28221d'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.ellipse(knee.x,knee.y,calf*.58,calf*.48,0,0,Math.PI*2); ctx.fill(); ctx.stroke();
    // Shoe with toe direction.
    ctx.fillStyle = shoe; ctx.strokeStyle='#211d19';ctx.lineWidth=2.5;
    ctx.beginPath(); ctx.roundRect(foot.x-10,foot.y-9,29,13,5);ctx.fill();ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,.25)';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(foot.x-2,foot.y-5);ctx.lineTo(foot.x+10,foot.y-5);ctx.stroke();
  }

  private arm(ctx: CanvasRenderingContext2D, shoulder: Point, elbow: Point, hand: Point, skin: string, skinShadow: string, wrap: string, front: boolean, style: 'kickboxer'|'boxer'): void {
    const upper = style === 'boxer' ? 18 : 16;
    this.capsule(ctx, shoulder, elbow, upper, front ? skin : skinShadow, '#28221d');
    this.capsule(ctx, elbow, hand, upper-2, skin, '#28221d');
    // Elbow articulation.
    ctx.fillStyle=skin;ctx.strokeStyle='#28221d';ctx.lineWidth=2;ctx.beginPath();ctx.arc(elbow.x,elbow.y,7.5,0,Math.PI*2);ctx.fill();ctx.stroke();
    // Hand wraps / gloves.
    ctx.fillStyle=wrap;ctx.strokeStyle='#28221d';ctx.lineWidth=2.5;ctx.beginPath();ctx.ellipse(hand.x,hand.y,style==='boxer'?12:10,style==='boxer'?10:8,-0.2,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(hand.x+2,hand.y-1,5,-1.3,1.2);ctx.stroke();
  }

  private neckAndHead(ctx: CanvasRenderingContext2D, pose: Pose, a: Fighter['def']['appearance'], state: Fighter['state'], now: number): void {
    // Neck.
    ctx.fillStyle=a.skinShadow;ctx.strokeStyle='#28221d';ctx.lineWidth=2.5;
    ctx.beginPath();ctx.roundRect(pose.neck.x-7,pose.neck.y-7,14,19,5);ctx.fill();ctx.stroke();

    // Ears behind face.
    ctx.fillStyle=a.skin;ctx.beginPath();ctx.ellipse(pose.head.x-18,pose.head.y+1,3.8,6.2,0,0,Math.PI*2);ctx.ellipse(pose.head.x+18,pose.head.y+1,3.8,6.2,0,0,Math.PI*2);ctx.fill();

    // Face: slightly asymmetrical human profile rather than a perfect circle.
    ctx.fillStyle=a.skin;ctx.strokeStyle='#28221d';ctx.lineWidth=3;
    ctx.beginPath();
    ctx.moveTo(pose.head.x-16,pose.head.y-13);
    ctx.quadraticCurveTo(pose.head.x-20,pose.head.y+1,pose.head.x-12,pose.head.y+16);
    ctx.quadraticCurveTo(pose.head.x,pose.head.y+23,pose.head.x+12,pose.head.y+15);
    ctx.quadraticCurveTo(pose.head.x+20,pose.head.y+5,pose.head.x+16,pose.head.y-12);
    ctx.quadraticCurveTo(pose.head.x,pose.head.y-23,pose.head.x-16,pose.head.y-13);
    ctx.closePath();ctx.fill();ctx.stroke();

    // Hair silhouette.
    ctx.fillStyle=a.hair;
    if (a.style === 'kickboxer') {
      ctx.beginPath();
      ctx.moveTo(pose.head.x-17,pose.head.y-12);ctx.quadraticCurveTo(pose.head.x-13,pose.head.y-25,pose.head.x+3,pose.head.y-24);
      ctx.quadraticCurveTo(pose.head.x+15,pose.head.y-24,pose.head.x+18,pose.head.y-11);
      ctx.lineTo(pose.head.x+11,pose.head.y-15);ctx.lineTo(pose.head.x+6,pose.head.y-10);ctx.lineTo(pose.head.x+1,pose.head.y-15);ctx.lineTo(pose.head.x-4,pose.head.y-10);ctx.lineTo(pose.head.x-10,pose.head.y-15);ctx.closePath();ctx.fill();
    } else {
      ctx.beginPath();ctx.ellipse(pose.head.x,pose.head.y-13,17,11,0,Math.PI,Math.PI*2);ctx.fill();
      // subtle hair texture
      ctx.globalAlpha=.35;ctx.strokeStyle='#6b5649';ctx.lineWidth=1;
      for(let i=-12;i<=12;i+=6){ctx.beginPath();ctx.moveTo(pose.head.x+i,pose.head.y-19);ctx.lineTo(pose.head.x+i+3,pose.head.y-13);ctx.stroke();}ctx.globalAlpha=1;
    }

    // Brow, eye, nose and mouth.
    const blink = Math.sin(now*.0027 + (a.style==='boxer'?1:0)) > .985;
    ctx.strokeStyle='#32251f';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(pose.head.x+2,pose.head.y-6);ctx.lineTo(pose.head.x+10,pose.head.y-5);ctx.stroke();
    ctx.beginPath();ctx.moveTo(pose.head.x-11,pose.head.y-5);ctx.lineTo(pose.head.x-4,pose.head.y-6);ctx.stroke();
    ctx.lineWidth=blink?1:2;ctx.beginPath();ctx.moveTo(pose.head.x+4,pose.head.y-1);ctx.lineTo(pose.head.x+9,pose.head.y-1);ctx.stroke();
    ctx.beginPath();ctx.moveTo(pose.head.x-9,pose.head.y-1);ctx.lineTo(pose.head.x-4,pose.head.y-1);ctx.stroke();
    ctx.strokeStyle=a.skinShadow;ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(pose.head.x+1,pose.head.y);ctx.lineTo(pose.head.x+3,pose.head.y+6);ctx.lineTo(pose.head.x,pose.head.y+7);ctx.stroke();
    ctx.strokeStyle='#63372f';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(pose.head.x-5,pose.head.y+11);ctx.quadraticCurveTo(pose.head.x+1,pose.head.y+14,pose.head.x+6,pose.head.y+10);ctx.stroke();

    if (state === 'hit') {
      ctx.fillStyle='rgba(139,48,42,.35)';ctx.beginPath();ctx.ellipse(pose.head.x+10,pose.head.y+7,6,4,-.2,0,Math.PI*2);ctx.fill();
    }
  }

  private capsule(ctx: CanvasRenderingContext2D, from: Point, to: Point, width: number, color: string, outline: string): void {
    ctx.lineCap='round';
    ctx.strokeStyle=outline;ctx.lineWidth=width+5;ctx.beginPath();ctx.moveTo(from.x,from.y);ctx.lineTo(to.x,to.y);ctx.stroke();
    ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(from.x,from.y);ctx.lineTo(to.x,to.y);ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,.08)';ctx.lineWidth=Math.max(1,width*.12);ctx.beginPath();ctx.moveTo(from.x+2,from.y);ctx.lineTo(to.x+2,to.y);ctx.stroke();
  }

  private attackTrail(ctx: CanvasRenderingContext2D, fighter: Fighter, color: string): void {
    const hitbox = fighter.attackHitbox;
    if (!hitbox) return;
    const localX = fighter.facing === 1 ? hitbox.x - fighter.x : -(hitbox.x + hitbox.width - fighter.x);
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = color;
    ctx.beginPath();ctx.roundRect(localX, hitbox.y-fighter.y, hitbox.width, hitbox.height, 16);ctx.fill();
    ctx.strokeStyle=color;ctx.globalAlpha=.34;ctx.lineWidth=2;ctx.stroke();
    ctx.restore();
  }
}
