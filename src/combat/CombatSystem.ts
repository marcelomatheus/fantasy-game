import type { Fighter } from '../characters/Fighter.js';
import type { InputSource } from '../systems/InputSource.js';
import type { AudioManager } from '../systems/AudioManager.js';
import type { ParticleSystem } from '../systems/ParticleSystem.js';
import type { CameraManager } from '../systems/CameraManager.js';
import type { ComboSystem } from './ComboSystem.js';
import { rectsOverlap } from '../utils/math.js';
import { PLAYER_GAP } from '../config/gameConfig.js';
import { combatBalance } from '../config/combatBalance.js';

export class CombatSystem {
  hitStopMs=0;
  resolve(p1:Fighter,p2:Fighter,input:InputSource,combo:ComboSystem,particles:ParticleSystem,camera:CameraManager,audio:AudioManager,now:number):void{
    this.resolveBodyCollision(p1,p2);
    this.tryHit(p1,p2,input,combo,particles,camera,audio,now);
    this.tryHit(p2,p1,input,combo,particles,camera,audio,now);
  }
  private tryHit(attacker:Fighter,defender:Fighter,input:InputSource,combo:ComboSystem,particles:ParticleSystem,camera:CameraManager,audio:AudioManager,now:number):void{
    const hitbox=attacker.attackHitbox;const attack=attacker.currentAttack;if(!hitbox||!attack||attacker.hasHit(defender.id)||!rectsOverlap(hitbox,defender.hurtbox))return;
    attacker.markHit(defender.id);const blocked=defender.isBlocking(input);const direction=attacker.facing;
    if(blocked){
      defender.takeBlock(attack.chipDamage,attack.blockStun,attack.blockKnockback*direction);
      particles.burst(defender.x-direction*25,defender.y-105,'#e7d8ba',direction,false);audio.play('block');
      this.hitStopMs=Math.max(this.hitStopMs,Math.round(attack.hitStop*.58));camera.punch(Math.max(1,attack.shake*.45));combo.break(attacker.id);
      attacker.addMeter(3);defender.addMeter(2);
      return;
    }
    const count=combo.nextCount(attacker.id,now);
    const damageScale=Math.max(combatBalance.minimumDamageScaling,Math.pow(combatBalance.comboDamageScaling,count-1));
    let stunScale=Math.max(combatBalance.minimumHitStunScaling,Math.pow(combatBalance.hitStunDecay,count-1));
    if(count>=combatBalance.guardRecoveryStartsAtHit&&input.isHeld(defender.controls.block))stunScale*=combatBalance.guardRecoveryHitStunMultiplier;
    let pushScale=Math.min(combatBalance.maximumPushbackScaling,Math.pow(combatBalance.pushbackScaling,count-1));
    let hitStun=Math.round(attack.hitStun*stunScale);
    if(count>=combatBalance.maxCombo){pushScale*=combatBalance.comboEndPushbackMultiplier;hitStun=Math.min(hitStun,combatBalance.comboEndHitStunMs);}
    const damage=Math.max(1,Math.round(attack.damage*damageScale));
    defender.takeHit(damage,hitStun,attack.knockback.x*pushScale*direction,-attack.knockback.y);
    const special=attack.key==='special1'||attack.key==='special2'||attack.key==='super';attacker.addMeter(special?10:8);defender.addMeter(special?5:4);
    const registered=combo.registerHit(attacker.id,now);
    particles.burst(defender.x-direction*25,defender.y-105,attacker.def.appearance.impact,direction,attack.damage>=12);
    audio.play('hurt');
    audio.play(attack.key==='super'?'superImpact':special?'specialImpact':attack.damage>=12?'heavyImpact':(attack.key==='airLight'||attack.key==='crouchLight')?'kick':'impact');this.hitStopMs=Math.max(this.hitStopMs,attack.hitStop);camera.punch(attack.shake+(registered>=3?2:0));
    if(registered>=combatBalance.maxCombo)combo.break(attacker.id);
  }
  private resolveBodyCollision(a:Fighter,b:Fighter):void{const bodyA=a.bodyRect,bodyB=b.bodyRect;const pushTopA=bodyA.y+bodyA.height*.45,pushTopB=bodyB.y+bodyB.height*.45;const verticallyOverlapping=pushTopA<bodyB.y+bodyB.height&&bodyA.y+bodyA.height>pushTopB;if(!verticallyOverlapping)return;const delta=b.x-a.x;const abs=Math.abs(delta);const required=Math.max(PLAYER_GAP,(a.def.body.width+b.def.body.width)*.62);if(abs>=required)return;const overlap=(required-abs)/2;const dir=delta>=0?1:-1;a.x-=overlap*dir;b.x+=overlap*dir;}
  consumeHitStop(ms:number):void{this.hitStopMs=Math.max(0,this.hitStopMs-ms);}
  reset():void{this.hitStopMs=0;}
}
