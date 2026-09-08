import { ROSTER } from '../characters/roster.js';
import { SpriteAssetManager } from '../characters/SpriteAssetManager.js';
import { SpriteFighterRenderer } from '../characters/SpriteFighterRenderer.js';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig.js';
import type { FighterDefinition } from '../types/game.js';
import type { FighterLoadout } from '../types/game.js';
import { withSkin } from '../characters/roster.js';
import type { AudioManager } from '../systems/AudioManager.js';
import type { InputManager } from '../systems/InputManager.js';
import { button, drawBackdrop, fonts, palette, panel, pill, wrapText } from '../ui/CanvasUi.js';
import type { Scene } from './Scene.js';

const GRID_COLUMNS = 3;
const GRID_START_X = 224;
const GRID_START_Y = 414;
const GRID_GAP_X = 278;
const GRID_GAP_Y = 108;

export class CharacterSelectScene implements Scene {
  private p1=0;
  private p2=1;
  private p1Skin=0;
  private p2Skin=0;
  private locked1=false;
  private locked2=false;
  private focus:'p1'|'p2'='p1';
  private hover=-1;
  private now=0;
  private readonly assets=new SpriteAssetManager();
  private readonly renderer=new SpriteFighterRenderer(this.assets);
  private pointer={x:0,y:0,clicked:false};

  constructor(
    private readonly input:InputManager,
    private readonly audio:AudioManager,
    private readonly onStart:(fighters:[FighterLoadout,FighterLoadout])=>void,
    private readonly onBack:()=>void,
    private readonly canvas:HTMLCanvasElement,
  ){
    this.assets.preload(ROSTER);
    this.audio.startMusic('select');
    this.canvas.addEventListener('pointermove',this.onMove);
    this.canvas.addEventListener('pointerdown',this.onPointer);
  }

  private pos(e:PointerEvent){const r=this.canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*GAME_WIDTH/r.width,y:(e.clientY-r.top)*GAME_HEIGHT/r.height};}
  private onMove=(e:PointerEvent)=>{const p=this.pos(e);this.pointer.x=p.x;this.pointer.y=p.y;this.hover=this.cardIndexAt(p.x,p.y);};
  private onPointer=(e:PointerEvent)=>{this.pointer={...this.pos(e),clicked:true};};
  private hit(x:number,y:number,w:number,h:number){return this.pointer.x>=x&&this.pointer.x<=x+w&&this.pointer.y>=y&&this.pointer.y<=y+h;}
  private cardIndexAt(x:number,y:number):number{for(let i=0;i<ROSTER.length;i++){const c=this.cardRect(i);if(x>=c.x&&x<=c.x+c.w&&y>=c.y&&y<=c.y+c.h)return i;}return -1;}
  private cardRect(i:number){const col=i%GRID_COLUMNS,row=Math.floor(i/GRID_COLUMNS);return{x:GRID_START_X+col*GRID_GAP_X,y:GRID_START_Y+row*GRID_GAP_Y,w:254,h:88};}
  private moveIndex(current:number,dx:number,dy:number):number{const rows=Math.ceil(ROSTER.length/GRID_COLUMNS);const col=(current%GRID_COLUMNS+dx+GRID_COLUMNS)%GRID_COLUMNS;const row=(Math.floor(current/GRID_COLUMNS)+dy+rows)%rows;let next=row*GRID_COLUMNS+col;if(next>=ROSTER.length) next=ROSTER.length-1;return next;}

  update(dt:number):void{
    this.now+=dt*1000;
    if(this.input.wasPressed('Escape')){this.onBack();return;}
    if(this.input.wasPressed('Tab')) this.focus=this.focus==='p1'?'p2':'p1';
    if(this.input.wasPressed('KeyQ'))this.cycleSkin(-1);if(this.input.wasPressed('KeyE'))this.cycleSkin(1);
    this.handleKeyboard();
    if(this.pointer.clicked){this.handlePointer();this.pointer.clicked=false;}
    window.__FINAL_BELL_DEBUG__={scene:'characterSelect',fighterIds:[ROSTER[this.p1]?.id??'',ROSTER[this.p2]?.id??'']};
  }

  private handleKeyboard():void{
    if(this.focus==='p1'&&!this.locked1){
      if(this.input.wasPressed('KeyA')) this.p1=this.moveIndex(this.p1,-1,0);
      if(this.input.wasPressed('KeyD')) this.p1=this.moveIndex(this.p1,1,0);
      if(this.input.wasPressed('KeyW')) this.p1=this.moveIndex(this.p1,0,-1);
      if(this.input.wasPressed('KeyS')) this.p1=this.moveIndex(this.p1,0,1);
    }
    if(this.focus==='p2'&&!this.locked2){
      if(this.input.wasPressed('ArrowLeft')) this.p2=this.moveIndex(this.p2,-1,0);
      if(this.input.wasPressed('ArrowRight')) this.p2=this.moveIndex(this.p2,1,0);
      if(this.input.wasPressed('ArrowUp')) this.p2=this.moveIndex(this.p2,0,-1);
      if(this.input.wasPressed('ArrowDown')) this.p2=this.moveIndex(this.p2,0,1);
    }
    if(this.input.wasPressed('KeyF')){this.focus='p1';this.locked1=!this.locked1;this.audio.play('confirm');}
    if(this.input.wasPressed('KeyK')){this.focus='p2';this.locked2=!this.locked2;this.audio.play('confirm');}
    if(this.locked1&&this.locked2&&this.input.wasPressed('Enter')) this.start();
  }

  private handlePointer():void{
    if(this.hit(170,282,126,28)){this.focus='p1';this.cycleSkin(1);return;}
    if(this.hit(984,282,126,28)){this.focus='p2';this.cycleSkin(1);return;}
    if(this.hit(64,112,338,250)) this.focus='p1';
    if(this.hit(878,112,338,250)) this.focus='p2';
    const idx=this.cardIndexAt(this.pointer.x,this.pointer.y);
    if(idx>=0){
      if(this.focus==='p1'&&!this.locked1) this.p1=idx; else if(this.focus==='p2'&&!this.locked2) this.p2=idx;
      return;
    }
    if(this.hit(96,314,274,34)){this.focus='p1';this.locked1=!this.locked1;this.audio.play('confirm');return;}
    if(this.hit(910,314,274,34)){this.focus='p2';this.locked2=!this.locked2;this.audio.play('confirm');return;}
    if(this.hit(470,628,340,48)&&this.locked1&&this.locked2){this.start();return;}
    if(this.hit(64,634,180,40)){this.onBack();}
  }

  private cycleSkin(direction:number):void{const fighter=ROSTER[this.focus==='p1'?this.p1:this.p2];if(!fighter)return;if(this.focus==='p1')this.p1Skin=(this.p1Skin+direction+fighter.skins.length)%fighter.skins.length;else this.p2Skin=(this.p2Skin+direction+fighter.skins.length)%fighter.skins.length;this.audio.play('select');}
  private start():void{const a=ROSTER[this.p1],b=ROSTER[this.p2];if(a&&b)this.onStart([{fighterId:a.id,skinId:a.skins[this.p1Skin]?.id??'default'},{fighterId:b.id,skinId:b.skins[this.p2Skin]?.id??'default'}]);}

  render(ctx:CanvasRenderingContext2D):void{
    drawBackdrop(ctx,GAME_WIDTH,GAME_HEIGHT,this.now);
    panel(ctx,30,28,1220,664,.9);
    ctx.textAlign='center';ctx.fillStyle=palette.cream;ctx.font=fonts.title(30);ctx.fillText('CHARACTER SELECT',640,72);
    ctx.fillStyle=palette.muted;ctx.font=fonts.body(13);ctx.fillText('P1: WASD + F • P2: Setas + K • TAB alterna foco • ENTER inicia',640,98);

    this.renderFeatured(ctx,withSkin(ROSTER[this.p1]!,ROSTER[this.p1]!.skins[this.p1Skin]?.id),64,112,338,250,'PLAYER 1',this.locked1,this.focus==='p1','#d7b46d',false,this.p1Skin);
    this.renderFeatured(ctx,withSkin(ROSTER[this.p2]!,ROSTER[this.p2]!.skins[this.p2Skin]?.id),878,112,338,250,'PLAYER 2',this.locked2,this.focus==='p2','#d17d73',true,this.p2Skin);
    this.renderVsPanel(ctx);

    for(let i=0;i<ROSTER.length;i++) this.renderCard(ctx,i,ROSTER[i]!);

    button(ctx,470,628,340,48,this.locked1&&this.locked2?'COMEÇAR LUTA':'CONFIRME OS DOIS LUTADORES',this.locked1&&this.locked2,this.hit(470,628,340,48));
    button(ctx,64,634,180,40,'VOLTAR',false,this.hit(64,634,180,40));
    this.renderStatusBar(ctx);
  }

  private renderVsPanel(ctx:CanvasRenderingContext2D):void{
    panel(ctx,446,136,388,210,.82);
    ctx.textAlign='center';
    ctx.fillStyle='rgba(255,255,255,.04)';ctx.beginPath();ctx.arc(640,226,62,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=palette.cream;ctx.font=fonts.title(48);ctx.fillText('VS',640,240);
    pill(ctx,516,300,this.locked1?'P1 READY':'P1 SELECTING',this.locked1?'success':'muted');
    pill(ctx,650,300,this.locked2?'P2 READY':'P2 SELECTING',this.locked2?'success':'muted');
  }

  private renderFeatured(ctx:CanvasRenderingContext2D,def:FighterDefinition,x:number,y:number,w:number,h:number,labelText:string,locked:boolean,focused:boolean,accent:string,flip=false,skinIndex=0):void{
    panel(ctx,x,y,w,h,.94);
    ctx.fillStyle=focused?'rgba(255,220,176,.08)':'rgba(255,255,255,.02)';ctx.beginPath();ctx.roundRect(x+14,y+14,w-28,h-28,12);ctx.fill();
    const portraitX=flip?x+182:x+16;
    this.renderer.renderPortrait(ctx,def,portraitX,y+14,140,162,this.now+(flip?120:0));
    const textX=flip?x+28:x+170;
    ctx.textAlign='left';ctx.fillStyle=accent;ctx.font=fonts.heading(10);ctx.fillText(labelText,textX,y+28);
    ctx.fillStyle=palette.cream;ctx.font=fonts.title(24);ctx.fillText(def.name,textX,y+58);
    pill(ctx,textX,y+68,(def.archetype??'balanced').toUpperCase(),'accent');
    ctx.fillStyle=palette.muted;ctx.font=fonts.body(11);wrapText(ctx,def.bio??def.tagline,textX,y+106,136,15,3);
    ctx.fillStyle=palette.cream;ctx.font=fonts.bodyStrong(10);ctx.fillText(`HP ${def.maxHealth}  •  SPD ${def.speed}`,textX,y+166);
    ctx.fillStyle=accent;ctx.font=fonts.bodyStrong(9);ctx.fillText(`SKIN ◀ ${def.skins[skinIndex]?.name??'Original'} ▶`,textX,y+190);
    button(ctx,x+32,y+h-48,w-64,34,locked?'CONFIRMADO ✓':'CONFIRMAR',locked,focused||this.hit(x+32,y+h-48,w-64,34));
  }

  private renderCard(ctx:CanvasRenderingContext2D,i:number,def:FighterDefinition):void{
    const {x,y,w,h}=this.cardRect(i); const p1=this.p1===i,p2=this.p2===i,hover=this.hover===i;
    ctx.fillStyle=p1&&p2?'#5a463a':p1?'#4f4133':p2?'#4c3537':'rgba(255,255,255,.035)';
    ctx.strokeStyle=hover||p1||p2?'rgba(255,220,176,.44)':'rgba(255,255,255,.08)';
    ctx.lineWidth=hover||p1||p2?2:1.2;ctx.beginPath();ctx.roundRect(x,y,w,h,10);ctx.fill();ctx.stroke();
    this.renderer.renderPortrait(ctx,def,x+10,y+8,68,72,this.now+i*70);
    ctx.textAlign='left';ctx.fillStyle=palette.cream;ctx.font=fonts.title(18);ctx.fillText(def.name,x+88,y+28);
    ctx.fillStyle=palette.muted;ctx.font=fonts.bodyStrong(10);ctx.fillText((def.archetype??'balanced').toUpperCase(),x+88,y+48);
    ctx.fillStyle=palette.muted;ctx.font=fonts.body(10);ctx.fillText(`HP ${def.maxHealth} • SPD ${def.speed}`,x+88,y+68);
    if(p1) {pill(ctx,x+10,y+10,this.locked1?'P1 READY':'P1','accent');}
    if(p2) {pill(ctx,x+w-98,y+10,this.locked2?'P2 READY':'P2','danger');}
  }

  private renderStatusBar(ctx:CanvasRenderingContext2D):void{
    panel(ctx,356,370,568,32,.84);
    ctx.textAlign='center';ctx.fillStyle=palette.muted;ctx.font=fonts.body(11);
    const message=this.locked1&&this.locked2?'Tudo pronto. Pressione ENTER ou clique em Começar Luta.':this.locked1||this.locked2?'Aguardando confirmação do outro jogador.':'Selecione um lutador em cada lado e confirme.';
    ctx.fillText(message,640,391);
  }

  destroy():void{this.canvas.removeEventListener('pointermove',this.onMove);this.canvas.removeEventListener('pointerdown',this.onPointer);}
}
