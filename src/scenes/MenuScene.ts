import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig.js';
import type { AudioManager } from '../systems/AudioManager.js';
import type { InputManager } from '../systems/InputManager.js';
import { StageRenderer } from '../stages/StageRenderer.js';
import { STAGES } from '../stages/stageDefinitions.js';
import type { MatchSettings, RoundSeconds, RoundsToWin } from '../types/game.js';
import { button, fonts, palette, pill } from '../ui/CanvasUi.js';
import type { Scene } from './Scene.js';

const TIMES:RoundSeconds[]=[30,60,99];
const WINS:RoundsToWin[]=[1,2,3];

export class MenuScene implements Scene {
  private controlsOpen=false;
  private pointer={x:0,y:0,clicked:false};
  private stageRenderer=new StageRenderer();
  private now=0;
  private settings:MatchSettings={stageId:'cristo',roundSeconds:60,roundsToWin:2};

  constructor(
    private readonly input:InputManager,
    private readonly audio:AudioManager,
    private readonly onConfigured:(settings:MatchSettings)=>void,
    private readonly canvas:HTMLCanvasElement,
    private readonly onBack:()=>void,
  ){
    canvas.addEventListener('pointerdown',this.onPointer);
    canvas.addEventListener('pointermove',this.onMove);
    this.audio.stopMusic();
  }

  private translate(e:PointerEvent):{x:number;y:number}{const r=this.canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*GAME_WIDTH/r.width,y:(e.clientY-r.top)*GAME_HEIGHT/r.height};}
  private onPointer=(e:PointerEvent):void=>{this.pointer={...this.translate(e),clicked:true};};
  private onMove=(e:PointerEvent):void=>{const p=this.translate(e);this.pointer.x=p.x;this.pointer.y=p.y;};
  private hit(x:number,y:number,w:number,h:number):boolean{return this.pointer.x>=x&&this.pointer.x<=x+w&&this.pointer.y>=y&&this.pointer.y<=y+h;}

  update(dt:number):void{
    this.now+=dt*1000;
    if(this.input.wasPressed('KeyC')) this.controlsOpen=!this.controlsOpen;
    if(this.input.wasPressed('Escape')){if(this.controlsOpen)this.controlsOpen=false;else{this.onBack();return;}}
    if(!this.controlsOpen){
      if(this.input.wasPressed('Enter')) void this.play();
      if(this.input.wasPressed('KeyQ')) this.cycleStage(-1);
      if(this.input.wasPressed('KeyE')) this.cycleStage(1);
      if(this.input.wasPressed('KeyT')) this.cycleTime();
      if(this.input.wasPressed('KeyB')) this.cycleRounds();
    }
    if(this.pointer.clicked){this.handleClick();this.pointer.clicked=false;}
    window.__FINAL_BELL_DEBUG__={scene:'setup',settings:{...this.settings}};
  }

  private handleClick():void{
    if(this.controlsOpen){if(this.hit(506,592,268,46))this.controlsOpen=false;return;}
    STAGES.forEach((stage,index)=>{const {x,y,w,h}=this.stageRect(index);if(this.hit(x,y,w,h+44))this.settings.stageId=stage.id;});
    TIMES.forEach((time,index)=>{if(this.hit(736+index*136,302,116,48))this.settings.roundSeconds=time;});
    WINS.forEach((wins,index)=>{if(this.hit(736+index*136,408,116,48))this.settings.roundsToWin=wins;});
    if(this.hit(426,566,428,64)) void this.play();
    if(this.hit(1044,574,156,44)) this.controlsOpen=true;
  }

  private stageRect(index:number):{x:number;y:number;w:number;h:number}{
    const col=index%2,row=Math.floor(index/2);
    return {x:84+col*294,y:222+row*148,w:268,h:94};
  }

  private cycleStage(direction:number):void{const index=STAGES.findIndex(s=>s.id===this.settings.stageId);const next=(index+direction+STAGES.length)%STAGES.length;this.settings.stageId=STAGES[next]?.id??'cristo';}
  private cycleTime():void{const index=TIMES.indexOf(this.settings.roundSeconds);this.settings.roundSeconds=TIMES[(index+1)%TIMES.length]??60;}
  private cycleRounds():void{const index=WINS.indexOf(this.settings.roundsToWin);this.settings.roundsToWin=WINS[(index+1)%WINS.length]??2;}
  private async play():Promise<void>{await this.audio.unlock();this.audio.startMusic('select');this.onConfigured({...this.settings});}

  render(ctx:CanvasRenderingContext2D):void{
    this.background(ctx);
    ctx.textAlign='left';
    ctx.fillStyle='#2c2721';
    ctx.font=fonts.title(46);
    ctx.fillText('LOCAL FIGHT',84,92);
    ctx.fillStyle='#7e6c57';
    ctx.font=fonts.bodyStrong(13);
    ctx.fillText('CONFIGURAÇÃO DA PARTIDA',88,116);
    ctx.fillStyle='#3e372f';
    ctx.font=fonts.body(17);
    ctx.fillText('Escolha o cenário, ajuste as regras e inicie a luta.',84,156);
    if(this.controlsOpen) this.renderControls(ctx); else this.renderSetup(ctx);
  }

  private background(ctx:CanvasRenderingContext2D):void{
    const g=ctx.createLinearGradient(0,0,0,GAME_HEIGHT);g.addColorStop(0,'#e2dacb');g.addColorStop(.7,'#c8b9a5');g.addColorStop(1,'#a99985');ctx.fillStyle=g;ctx.fillRect(0,0,GAME_WIDTH,GAME_HEIGHT);
    ctx.strokeStyle='rgba(71,61,50,.09)';ctx.lineWidth=1;for(let x=0;x<GAME_WIDTH;x+=96){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,GAME_HEIGHT);ctx.stroke();}
    ctx.fillStyle='rgba(61,51,42,.06)';for(let i=0;i<18;i++){const x=(i*173)%GAME_WIDTH,y=35+(i*79)%600;ctx.beginPath();ctx.ellipse(x,y,30+(i%4)*18,7+(i%3)*5,-.2,0,Math.PI*2);ctx.fill();}
    ctx.strokeStyle='rgba(98,58,45,.16)';ctx.lineWidth=5;for(const y of [645,670,695]){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(GAME_WIDTH,y);ctx.stroke();}
    ctx.fillStyle='#3b332b';ctx.fillRect(0,0,12,GAME_HEIGHT);ctx.fillRect(GAME_WIDTH-12,0,12,GAME_HEIGHT);
  }

  private renderSetup(ctx:CanvasRenderingContext2D):void{
    ctx.fillStyle='#5c4e40';ctx.font=fonts.bodyStrong(13);ctx.fillText('CENÁRIOS',84,198);
    STAGES.forEach((stage,index)=>{
      const {x,y,w,h}=this.stageRect(index);
      const selected=stage.id===this.settings.stageId; const hover=this.hit(x,y,w,h+44);
      ctx.fillStyle=selected?'#f5eddf':'rgba(245,237,223,.7)';
      ctx.strokeStyle=selected?'#855b3e':hover?'#a48566':'rgba(82,68,54,.25)';
      ctx.lineWidth=selected?3.5:1.8;
      ctx.beginPath();ctx.roundRect(x-4,y-4,w+8,h+44,12);ctx.fill();ctx.stroke();
      this.stageRenderer.renderPreview(ctx,stage.id,x,y,w,h,this.now);
      ctx.fillStyle='#302a24';ctx.font=fonts.bodyStrong(12);ctx.textAlign='left';ctx.fillText(stage.name,x+12,y+h+20);
      ctx.textAlign='right';ctx.fillStyle='#7d6b5c';ctx.font=fonts.body(9);ctx.fillText(stage.timeOfDay.toUpperCase(),x+w-12,y+h+20);
    });

    ctx.fillStyle='rgba(247,239,226,.72)';ctx.strokeStyle='rgba(82,68,54,.22)';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(704,204,496,304,12);ctx.fill();ctx.stroke();
    ctx.textAlign='left';ctx.fillStyle='#5c4e40';ctx.font=fonts.bodyStrong(13);ctx.fillText('REGRAS DA PARTIDA',736,238);
    ctx.fillText('TEMPO POR ROUND',736,286);
    TIMES.forEach((time,index)=>this.choice(ctx,736+index*136,302,116,48,String(time),this.settings.roundSeconds===time));
    ctx.fillStyle='rgba(108,77,55,.09)';ctx.beginPath();ctx.roundRect(724,364,452,32,6);ctx.fill();
    ctx.fillStyle='#5c4e40';ctx.fillText('FORMATO',736,386);
    WINS.forEach((wins,index)=>this.choice(ctx,736+index*136,408,116,48,`MD${wins*2-1}`,this.settings.roundsToWin===wins));
    ctx.fillStyle='#766655';ctx.font=fonts.body(10);ctx.fillText('T  TEMPO',736,486);ctx.fillText('B  FORMATO',912,486);

    button(ctx,426,566,428,64,'INICIAR LUTA  [ENTER]',true,this.hit(426,566,428,64));
    button(ctx,1044,574,156,44,'CONTROLES',false,this.hit(1044,574,156,44));
    pill(ctx,88,570,`STAGE ${STAGES.findIndex(s=>s.id===this.settings.stageId)+1}/${STAGES.length}`,'accent');
    ctx.textAlign='center';ctx.fillStyle='rgba(60,50,41,.6)';ctx.font=fonts.body(11);ctx.fillText('Q/E troca cenário  •  ESC voltar',GAME_WIDTH/2,668);
  }

  private choice(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,labelText:string,selected:boolean):void{
    const hover=this.hit(x,y,w,h);ctx.fillStyle=selected?'#6c4d37':hover?'#d6c6b2':'rgba(249,243,233,.72)';ctx.strokeStyle=selected?'#4e3728':'rgba(78,61,47,.25)';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(x,y,w,h,8);ctx.fill();ctx.stroke();ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=fonts.heading(13);ctx.fillStyle=selected?'#fff3e0':'#4b4035';ctx.fillText(labelText,x+w/2,y+h/2);ctx.textBaseline='alphabetic';
  }

  private renderControls(ctx:CanvasRenderingContext2D):void{
    ctx.fillStyle='rgba(247,239,226,.96)';ctx.strokeStyle='rgba(74,59,44,.28)';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(206,158,868,470,12);ctx.fill();ctx.stroke();
    ctx.textAlign='center';ctx.fillStyle='#312b25';ctx.font=fonts.title(32);ctx.fillText('CONTROLES',GAME_WIDTH/2,214);
    ctx.fillStyle='#6d5948';ctx.font=fonts.body(13);ctx.fillText('Comandos do modo local.',GAME_WIDTH/2,240);
    ctx.fillStyle='#9a643e';ctx.font=fonts.heading(12);ctx.fillText('JOGADOR 1',418,286);ctx.fillStyle='#7d3e35';ctx.fillText('JOGADOR 2',860,286);
    ctx.font=fonts.mono(15);ctx.fillStyle='#40372e';const rows=[['A / D  mover','← / →  mover'],['W  pular','↑  pular'],['S  agachar','↓  agachar'],['F  ataque fraco','K  ataque fraco'],['G  ataque forte','L  ataque forte'],['R  defender','O  defender']];
    rows.forEach((r,i)=>{ctx.fillText(r[0]??'',418,330+i*38);ctx.fillText(r[1]??'',860,330+i*38);});
    ctx.fillStyle='#776858';ctx.font=fonts.body(11);ctx.fillText('Especiais: ↓↘→ + fraco • →↓↘ + forte • Super: ↓↘→ ↓↘→ + forte',GAME_WIDTH/2,548);ctx.fillText('Atalhos: T altera tempo, B altera formato, Q/E trocam o cenário e ESC volta.',GAME_WIDTH/2,570);
    button(ctx,506,592,268,46,'VOLTAR',false,this.hit(506,592,268,46));
  }

  destroy():void{this.canvas.removeEventListener('pointerdown',this.onPointer);this.canvas.removeEventListener('pointermove',this.onMove);}
}
