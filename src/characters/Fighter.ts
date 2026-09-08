import { FLOOR_Y, INPUT_BUFFER_MS, STAGE_LEFT, STAGE_RIGHT } from '../config/gameConfig.js';
import type { AttackDefinition, AttackKey, Controls, Facing, FighterDefinition, FighterSnapshot, FighterState, MoveKey, PlayerId, Rect, SpecialKey, SpecialMoveDefinition } from '../types/game.js';
import { clamp } from '../utils/math.js';
import type { InputSource } from '../systems/InputSource.js';

interface AttackRuntime { definition:AttackDefinition;elapsed:number;hitTargets:Set<PlayerId>;serial:number; }
interface BufferedAttack { key:MoveKey;remaining:number; }
interface DirectionSample { direction:number;at:number; }
const MOTION_INPUT_WINDOW_MS=900;

export class Fighter {
  readonly id:PlayerId;readonly def:FighterDefinition;readonly controls:Controls;
  x:number;y:number=FLOOR_Y;vx=0;vy=0;health:number;displayedHealth:number;state:FighterState='idle';facing:Facing=1;wins=0;meter=0;
  hitStunMs=0;blockStunMs=0;flashMs=0;attack:AttackRuntime|null=null;private attackSerial=0;private buffered:BufferedAttack|null=null;private grounded=true;private strikeVariant:0|1=0;private previousAttack:MoveKey|null=null;private commandClock=0;private directions:DirectionSample[]=[];private lastDirection=5;private finisherRequest=false;

  constructor(id:PlayerId,def:FighterDefinition,controls:Controls,x:number){this.id=id;this.def=def;this.controls=controls;this.x=x;this.health=def.maxHealth;this.displayedHealth=this.health;}
  reset(x:number,preserveMeter=true):void{this.x=x;this.y=FLOOR_Y;this.vx=0;this.vy=0;this.health=this.def.maxHealth;this.displayedHealth=this.health;this.state='idle';this.hitStunMs=0;this.blockStunMs=0;this.flashMs=0;this.attack=null;this.buffered=null;this.grounded=true;this.strikeVariant=0;this.previousAttack=null;this.directions=[];this.lastDirection=5;this.finisherRequest=false;if(!preserveMeter)this.meter=0;}
  get maxHealth():number{return this.def.maxHealth;}
  get isGrounded():boolean{return this.grounded;}
  get bodyRect():Rect{const h=this.state==='crouch'?this.def.body.height*.68:this.def.body.height;return{x:this.x-this.def.body.width/2,y:this.y-h,width:this.def.body.width,height:h};}
  get hurtbox():Rect{const body=this.bodyRect;return{x:body.x+8,y:body.y+5,width:body.width-16,height:body.height-8};}
  get attackHitbox():Rect|null{if(!this.attack)return null;const a=this.attack.definition;if(this.currentSpecial?.projectile)return null;const t=this.attack.elapsed;if(t<a.startup||t>a.startup+a.active)return null;const normal=a.key==='light'||a.key==='heavy'||a.key==='crouchLight'||a.key==='airLight';const width=a.hitbox.width*(normal?1.2:1);const left=this.facing===1?this.x+a.hitbox.offsetX:this.x-a.hitbox.offsetX-width;return{x:left,y:this.y+a.hitbox.offsetY,width,height:a.hitbox.height};}
  hasHit(target:PlayerId):boolean{return this.attack?.hitTargets.has(target)??false;}
  markHit(target:PlayerId):void{this.attack?.hitTargets.add(target);}
  get currentAttack():AttackDefinition|null{return this.attack?.definition??null;}
  get currentSpecial():SpecialMoveDefinition|null{const key=this.attack?.definition.key;if(key!=='special1'&&key!=='special2'&&key!=='super')return null;return this.def.specials[key];}
  get attackElapsed():number{return this.attack?.elapsed??0;}
  get attackSerialNumber():number{return this.attackSerial;}
  get visualStrikeVariant():0|1{return this.strikeVariant;}
  get attackProgress():number{if(!this.attack)return 0;const total=this.attack.definition.startup+this.attack.definition.active+this.attack.definition.recovery;return clamp(this.attack.elapsed/total,0,1);}
  canBlock():boolean{return this.grounded&&!this.attack&&this.hitStunMs<=0&&this.health>0;}
  isBlocking(input:InputSource):boolean{return this.canBlock()&&input.isHeld(this.controls.block);}
  addMeter(amount:number):void{this.meter=clamp(this.meter+amount,0,100);}
  consumeFinisherRequest():boolean{const value=this.finisherRequest;this.finisherRequest=false;return value;}

  update(dt:number,input:InputSource,opponentX:number,canAct:boolean):void{
    const ms=dt*1000;this.commandClock+=ms;this.facing=opponentX>=this.x?1:-1;this.captureDirection(input);
    if(input.wasPressed(this.controls.block)&&this.matches([2,3,6])){this.finisherRequest=true;this.directions=[];}
    this.flashMs=Math.max(0,this.flashMs-ms);this.displayedHealth+=(this.health-this.displayedHealth)*Math.min(1,dt*5.5);
    if(this.health<=0){this.state=this.state==='finished'?'finished':'ko';this.vx*=.88;this.applyPhysics(dt);return;}
    if(this.hitStunMs>0){this.hitStunMs=Math.max(0,this.hitStunMs-ms);this.state='hit';this.applyPhysics(dt);return;}
    if(this.blockStunMs>0){this.blockStunMs=Math.max(0,this.blockStunMs-ms);this.state='block';this.applyPhysics(dt);return;}
    if(this.attack){this.attack.elapsed+=ms;this.handleAttackBuffer(ms,input);const a=this.attack.definition;const total=a.startup+a.active+a.recovery;if(this.tryCancelBuffered())return;if(this.attack.elapsed<total){this.state='attack';this.vx*=this.grounded ? 0.76 : 0.985;this.applyPhysics(dt);return;}this.attack=null;}
    if(!canAct){this.vx*=.8;this.state=this.grounded?'idle':'jump';this.applyPhysics(dt);return;}
    if(this.buffered){this.buffered.remaining-=ms;if(this.buffered.remaining<=0)this.buffered=null;}
    const crouching=input.isHeld(this.controls.crouch)&&this.grounded;
    if(input.wasPressed(this.controls.light)){if(this.grounded&&this.matches([2,3,6])){this.queueAttack('special1');this.directions=[];}else this.queueAttack(!this.grounded?'airLight':crouching?'crouchLight':'light');}
    if(input.wasPressed(this.controls.heavy)){if(this.grounded&&this.meter>=100&&this.matches([2,3,6,2,3,6])){this.queueAttack('super');this.directions=[];}else if(this.grounded&&this.matches([6,2,3])){this.queueAttack('special2');this.directions=[];}else this.queueAttack(!this.grounded?'airLight':'heavy');}
    if(this.buffered&&this.canStartAttack()){this.startAttack(this.buffered.key);this.buffered=null;this.applyPhysics(dt);return;}
    if(input.isHeld(this.controls.block)&&this.canBlock()){this.vx*=.65;this.state='block';this.applyPhysics(dt);return;}
    if(input.wasPressed(this.controls.jump)&&this.grounded&&!crouching){this.vy=-this.def.jumpForce;this.grounded=false;this.state='jump';}
    const axis=(input.isHeld(this.controls.right)?1:0)-(input.isHeld(this.controls.left)?1:0);
    if(this.grounded){if(crouching){this.vx=0;this.state='crouch';}else if(axis!==0){this.vx=axis*this.def.speed;const toward=(axis===1&&this.facing===1)||(axis===-1&&this.facing===-1);this.state=toward?'walkForward':'walkBackward';}else{this.vx*=.55;this.state='idle';}}else{this.vx=axis*this.def.speed*this.def.airControl;this.state='jump';}this.applyPhysics(dt);
  }

  private captureDirection(input:InputSource):void{const down=input.isHeld(this.controls.crouch),right=input.isHeld(this.controls.right),left=input.isHeld(this.controls.left);const forward=this.facing===1?right:left;const backward=this.facing===1?left:right;let direction=5;if(down&&forward)direction=3;else if(down&&backward)direction=1;else if(down)direction=2;else if(forward)direction=6;else if(backward)direction=4;if(direction!==this.lastDirection){this.lastDirection=direction;if(direction!==5)this.directions.push({direction,at:this.commandClock});}this.directions=this.directions.filter(s=>this.commandClock-s.at<=MOTION_INPUT_WINDOW_MS).slice(-8);}
  private matches(sequence:number[]):boolean{let index=sequence.length-1;for(let i=this.directions.length-1;i>=0&&index>=0;i--){if(this.directions[i]?.direction===sequence[index])index--;}return index<0;}
  private definition(key:MoveKey):AttackDefinition{return key==='special1'||key==='special2'||key==='super'?this.def.specials[key]:this.def.attacks[key];}
  private queueAttack(key:MoveKey):void{this.buffered={key,remaining:INPUT_BUFFER_MS};}
  private handleAttackBuffer(ms:number,input:InputSource):void{if(this.buffered){this.buffered.remaining-=ms;if(this.buffered.remaining<=0)this.buffered=null;}if(input.wasPressed(this.controls.light))this.queueAttack(this.grounded?(input.isHeld(this.controls.crouch)?'crouchLight':'light'):'airLight');if(input.wasPressed(this.controls.heavy))this.queueAttack(this.grounded?'heavy':'airLight');}
  private tryCancelBuffered():boolean{if(!this.attack||!this.buffered)return false;const a=this.attack.definition;if(this.attack.elapsed>=a.cancelAt&&a.cancelInto.includes(this.buffered.key)){const key=this.buffered.key;this.buffered=null;this.startAttack(key);return true;}return false;}
  private canStartAttack():boolean{return this.hitStunMs<=0&&this.blockStunMs<=0&&this.health>0;}
  private startAttack(key:MoveKey):void{const definition=this.definition(key);if(definition.key==='super'){if(this.meter<100)return;this.meter=0;this.vx=this.facing*340;}if(definition.key==='special2'){this.vy=-this.def.jumpForce*.45;this.vx=this.facing*120;this.grounded=false;}if(key==='light')this.strikeVariant=this.previousAttack==='light'?(this.strikeVariant===0?1:0):(this.strikeVariant===0?0:1);else this.strikeVariant=this.strikeVariant===0?1:0;this.previousAttack=key;this.attack={definition,elapsed:0,hitTargets:new Set<PlayerId>(),serial:++this.attackSerial};this.state='attack';}
  private applyPhysics(dt:number):void{if(!this.grounded)this.vy+=1960*this.def.gravityScale*dt;this.x+=this.vx*dt;this.y+=this.vy*dt;this.x=clamp(this.x,STAGE_LEFT+this.def.body.width/2,STAGE_RIGHT-this.def.body.width/2);if(this.y>=FLOOR_Y){this.y=FLOOR_Y;this.vy=0;this.grounded=true;}else this.grounded=false;}
  takeHit(damage:number,hitStun:number,knockbackX:number,knockbackY:number):void{this.health=clamp(this.health-damage,0,this.def.maxHealth);this.hitStunMs=hitStun;this.blockStunMs=0;this.attack=null;this.buffered=null;this.vx=knockbackX;this.vy=knockbackY;if(knockbackY<0)this.grounded=false;this.flashMs=105;this.state=this.health<=0?'ko':'hit';}
  takeBlock(chip:number,blockStun:number,knockbackX:number):void{this.health=clamp(this.health-chip,0,this.def.maxHealth);this.blockStunMs=blockStun;this.vx=knockbackX;this.flashMs=60;this.state='block';}
  markFinished():void{this.state='finished';}
  markVictory():void{this.attack=null;this.buffered=null;this.vx=0;this.vy=0;this.state='victory';}
  snapshot():FighterSnapshot{return{id:this.def.id,name:this.def.name,x:Math.round(this.x),y:Math.round(this.y),health:Number(this.health.toFixed(1)),meter:Math.round(this.meter),state:this.state,facing:this.facing,wins:this.wins};}
}
