import { ROSTER } from '../characters/roster.js';
import { SpriteAssetManager } from '../characters/SpriteAssetManager.js';
import { SpriteFighterRenderer } from '../characters/SpriteFighterRenderer.js';
import type { MatchSettings, RoundSeconds, RoundsToWin } from '../types/game.js';
import type { AudioManager } from '../systems/AudioManager.js';
import type { InputManager } from '../systems/InputManager.js';
import type { NetworkClient } from '../network/NetworkClient.js';
import type { RoomMode } from '../network/protocol.js';
import { button, drawBackdrop, fieldBox, fonts, palette, panel, pill, wrapText } from '../ui/CanvasUi.js';
import type { Scene } from './Scene.js';

const TIMES:RoundSeconds[]=[30,60,99];
const WINS:RoundsToWin[]=[1,2,3];

export class OnlineEntryScene implements Scene {
  private now=0;
  private selected=0;
  private name:string;
  private code='';
  private tournamentName='Cielo Fantasy Fight Cup';
  private maxPlayers:4|8=4;
  private status='';
  private error='';
  private settings:MatchSettings={stageId:'cristo',roundSeconds:60,roundsToWin:2,mode:'online'};
  private offs:(()=>void)[]=[];
  private assets=new SpriteAssetManager();
  private renderer=new SpriteFighterRenderer(this.assets);
  private pointer={x:0,y:0,clicked:false};
  private editor:HTMLInputElement|null=null;

  constructor(
    private readonly mode:RoomMode,
    private readonly input:InputManager,
    private readonly audio:AudioManager,
    private readonly network:NetworkClient,
    private readonly onLobby:()=>void,
    private readonly onBack:()=>void,
    private readonly canvas:HTMLCanvasElement,
  ){
    this.name=network.playerName;
    this.assets.preload(ROSTER);
    this.audio.startMusic(mode==='tournament'?'tournament':'menu');
    this.offs.push(network.on('status',s=>this.status=s),network.on('error',e=>this.error=e),network.on('room',()=>this.onLobby()));
    window.addEventListener('keydown',this.onTextKey);
    this.canvas.addEventListener('pointermove',this.onMove);
    this.canvas.addEventListener('pointerdown',this.onPointer);
    this.network.connect(this.name);
  }

  private get indices(){
    return this.mode==='tournament'
      ? {name:0,code:1,join:2,tournamentName:3,maxPlayers:4,rounds:5,time:6,create:7,back:8,max:9} as const
      : {name:0,code:1,join:2,time:3,rounds:4,create:5,back:6,max:7} as const;
  }

  private pos(e:PointerEvent){const r=this.canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*1280/r.width,y:(e.clientY-r.top)*720/r.height};}
  private onMove=(e:PointerEvent)=>{const p=this.pos(e);this.pointer.x=p.x;this.pointer.y=p.y;};
  private onPointer=(e:PointerEvent)=>{this.pointer={...this.pos(e),clicked:true};};
  private hit(x:number,y:number,w:number,h:number):boolean{return this.pointer.x>=x&&this.pointer.x<=x+w&&this.pointer.y>=y&&this.pointer.y<=y+h;}

  private onTextKey=(e:KeyboardEvent):void=>{
    if(this.editor)return;
    if(e.ctrlKey||e.metaKey||e.altKey)return;
    const idx=this.indices;
    if(this.selected===idx.name){
      if(e.key==='Backspace'){this.name=this.name.slice(0,-1);e.preventDefault();}
      else if(e.key.length===1&&/[\p{L}\p{N} _-]/u.test(e.key)&&this.name.length<18){this.name+=e.key;e.preventDefault();}
      return;
    }
    if(this.selected===idx.code){
      if(e.key==='Backspace'){this.code=this.code.slice(0,-1);e.preventDefault();}
      else if(e.key.length===1&&/[A-Za-z0-9]/.test(e.key)&&this.code.length<6){this.code+=e.key.toUpperCase();e.preventDefault();}
      return;
    }
    if(this.mode==='tournament'&&this.selected===idx.tournamentName){
      if(e.key==='Backspace'){this.tournamentName=this.tournamentName.slice(0,-1);e.preventDefault();}
      else if(e.key.length===1&&/[\p{L}\p{N} _-]/u.test(e.key)&&this.tournamentName.length<28){this.tournamentName+=e.key;e.preventDefault();}
    }
  };

  update(dt:number):void{
    this.now+=dt*1000;
    if(this.editor){window.__FINAL_BELL_DEBUG__={scene:this.mode==='tournament'?'tournament':'onlineLobby',onlineStatus:'Digitando'};return;}
    const idx=this.indices;
    if(this.input.wasPressed('Escape')){this.onBack();return;}
    if(this.input.wasPressed('ArrowDown')) this.selected=(this.selected+1)%idx.max;
    if(this.input.wasPressed('ArrowUp')) this.selected=(this.selected-1+idx.max)%idx.max;
    if(this.input.wasPressed('Tab')) this.selected=(this.selected+1)%idx.max;
    if(this.input.wasPressed('KeyT')) this.cycleTime();
    if(this.input.wasPressed('KeyB')) this.cycleRounds();
    if(this.mode==='tournament'&&this.input.wasPressed('KeyM')) this.maxPlayers=this.maxPlayers===4?8:4;
    if(this.input.wasPressed('Enter')) void this.activate();
    if(this.pointer.clicked){void this.handlePointer();this.pointer.clicked=false;}
    window.__FINAL_BELL_DEBUG__={scene:this.mode==='tournament'?'tournament':'onlineLobby',onlineStatus:this.status};
  }

  private cycleTime():void{const i=TIMES.indexOf(this.settings.roundSeconds);this.settings.roundSeconds=TIMES[(i+1)%TIMES.length]??60;}
  private cycleRounds():void{const i=WINS.indexOf(this.settings.roundsToWin);this.settings.roundsToWin=WINS[(i+1)%WINS.length]??2;}

  private async handlePointer():Promise<void>{
    if(this.mode==='tournament'){
      const targets:[number,number,number,number,number][]= [
        [84,244,470,58,0],[84,320,470,58,1],[84,426,470,54,2],[508,660,264,38,8],
        [618,244,570,58,3],[618,330,176,44,4],[816,330,176,44,5],[1012,330,176,44,6],[618,452,570,54,7],
      ];
      for(const [x,y,w,h,id] of targets){if(this.hit(x,y,w,h)){this.selected=id;await this.activate();return;}}
      return;
    }
    const targets:[number,number,number,number,number][]=[
      [84,244,470,58,0],[84,320,470,58,1],[84,426,470,54,2],[508,660,264,38,6],
      [618,306,176,44,3],[816,306,176,44,4],[618,404,570,54,5],
    ];
    for(const [x,y,w,h,id] of targets){if(this.hit(x,y,w,h)){this.selected=id;await this.activate();return;}}
  }

  private async activate():Promise<void>{
    const idx=this.indices;
    await this.audio.unlock();
    this.error='';
    this.network.connect(this.name);
    if(this.selected===idx.name){this.openEditor('name');return;}if(this.selected===idx.code){this.openEditor('code');return;}if(this.mode==='tournament'&&this.selected===idx.tournamentName){this.openEditor('tournament');return;}
    if(this.selected===idx.join){await this.join();return;}
    if(this.selected===idx.create){await this.create();return;}
    if(this.selected===idx.time){this.cycleTime();return;}
    if(this.selected===idx.rounds){this.cycleRounds();return;}
    if(this.mode==='tournament'&&this.selected===idx.maxPlayers){this.maxPlayers=this.maxPlayers===4?8:4;return;}
    if(this.selected===idx.back)this.onBack();
  }

  private openEditor(field:'name'|'code'|'tournament'):void{if(this.editor)return;const editor=document.createElement('input');this.editor=editor;editor.value=field==='name'?this.name:field==='code'?this.code:this.tournamentName;editor.maxLength=field==='name'?18:field==='code'?6:28;editor.autocapitalize=field==='code'?'characters':'sentences';editor.autocomplete='off';editor.spellcheck=false;editor.inputMode='text';editor.setAttribute('aria-label',field==='name'?'Seu nome':field==='code'?'Código da sala':'Nome do campeonato');Object.assign(editor.style,{position:'fixed',left:'50%',top:'18%',transform:'translateX(-50%)',zIndex:'20',fontSize:'18px',padding:'14px',width:'min(78vw, 440px)',background:'#27231f',color:'#f3e7d3',border:'2px solid #c98b4a',borderRadius:'8px'});const sync=()=>{const clean=field==='code'?editor.value.replace(/[^A-Za-z0-9]/g,'').toUpperCase():editor.value.replace(/[^\p{L}\p{N} _-]/gu,'');editor.value=clean;if(field==='name')this.name=clean;else if(field==='code')this.code=clean;else this.tournamentName=clean;};editor.addEventListener('input',sync);editor.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter'){e.preventDefault();sync();editor.blur();}else if(e.key==='Escape'){e.preventDefault();editor.blur();}});editor.addEventListener('keyup',e=>e.stopPropagation());editor.addEventListener('blur',()=>{sync();editor.remove();if(this.editor===editor)this.editor=null;},{once:true});document.body.appendChild(editor);editor.focus();editor.select();}

  private async join():Promise<void>{await this.audio.unlock();this.error='';this.network.connect(this.name);if(this.code.length<4){this.error=this.mode==='tournament'?'Digite um código válido para entrar no campeonato.':'Digite um código válido para entrar na sala.';return;}this.network.joinRoom(this.code);}
  private async create():Promise<void>{await this.audio.unlock();this.error='';this.network.connect(this.name);this.network.createRoom(this.mode,this.settings,this.mode==='tournament'?this.tournamentName:undefined,this.mode==='tournament'?this.maxPlayers:undefined);}

  render(ctx:CanvasRenderingContext2D):void{
    drawBackdrop(ctx,1280,720,this.now);
    ctx.textAlign='center';ctx.fillStyle=palette.cream;ctx.font=fonts.title(28);ctx.fillText(this.mode==='tournament'?'TOURNAMENT ONLINE':'ONLINE FIGHT',640,72);
    ctx.fillStyle=palette.muted;ctx.font=fonts.body(13);ctx.fillText(this.mode==='tournament'?'Entre por código ou crie um campeonato privado.':'Entre por código ou crie uma sala privada 1v1.',640,98);
    this.renderPanels(ctx);
    button(ctx,508,660,264,38,'VOLTAR',this.selected===this.indices.back,this.hit(508,660,264,38));
    ctx.fillStyle=this.error?'#f0aba1':palette.muted;ctx.font=fonts.body(12);ctx.fillText(this.error||this.status||'Mouse e teclado disponíveis • T tempo • B formato • M jogadores • ESC voltar',640,694);
  }

  private renderPanels(ctx:CanvasRenderingContext2D):void{
    const idx=this.indices;
    panel(ctx,52,150,520,478,.94);
    panel(ctx,604,150,624,478,.94);

    ctx.textAlign='left';ctx.fillStyle=palette.cream;ctx.font=fonts.title(20);ctx.fillText(this.mode==='tournament'?'ENTRAR COM CÓDIGO':'ENTRAR NA SALA',84,204);
    ctx.fillStyle=palette.muted;ctx.font=fonts.body(12);ctx.fillText('Use um nome curto, insira o código e siga para o lobby.',84,226);
    fieldBox(ctx,84,244,470,58,'SEU NOME',this.name||'Jogador',this.selected===idx.name);
    fieldBox(ctx,84,320,470,58,this.mode==='tournament'?'CÓDIGO DO CAMPEONATO':'CÓDIGO DA SALA',this.code||'AX7P2K',this.selected===idx.code,true);
    button(ctx,84,426,470,54,this.mode==='tournament'?'ENTRAR NO CAMPEONATO':'ENTRAR NA SALA',this.selected===idx.join,this.hit(84,426,470,54));
    panel(ctx,84,500,470,96,.84);
    ctx.fillStyle=palette.cream;ctx.font=fonts.bodyStrong(12);ctx.fillText('FLUXO RÁPIDO',104,524);
    ctx.fillStyle=palette.muted;ctx.font=fonts.body(12);
    const joinText=this.mode==='tournament'
      ? '1. O host cria o campeonato.  2. Compartilha o código.  3. Você entra e escolhe seu personagem no lobby.'
      : '1. Um jogador cria a sala.  2. Compartilha o código.  3. O outro entra e os dois confirmam no lobby.';
    wrapText(ctx,joinText,104,548,420,17,4);

    ctx.textAlign='left';ctx.fillStyle=palette.cream;ctx.font=fonts.title(20);ctx.fillText(this.mode==='tournament'?'CRIAR CAMPEONATO':'CRIAR SALA PRIVADA',618,204);
    ctx.fillStyle=palette.muted;ctx.font=fonts.body(12);ctx.fillText(this.mode==='tournament'?'Defina os parâmetros e gere um código para seus amigos.':'Defina tempo e formato antes de gerar o código do duelo.',618,226);

    if(this.mode==='tournament'){
      fieldBox(ctx,618,244,570,58,'NOME DO CAMPEONATO',this.tournamentName,this.selected===idx.tournamentName);
      this.option(ctx,618,330,176,44,`JOGADORES ${this.maxPlayers}`,this.selected===idx.maxPlayers,this.hit(618,330,176,44));
      this.option(ctx,816,330,176,44,`FORMATO MD${this.settings.roundsToWin*2-1}`,this.selected===idx.rounds,this.hit(816,330,176,44));
      this.option(ctx,1012,330,176,44,`TEMPO ${this.settings.roundSeconds}s`,this.selected===idx.time,this.hit(1012,330,176,44));
      panel(ctx,618,392,570,44,.8);
      pill(ctx,638,402,'SINGLE ELIMINATION','accent');
      ctx.fillStyle=palette.muted;ctx.font=fonts.body(11);ctx.fillText('Formato direto ao ponto para campeonatos entre amigos.',794,424);
      button(ctx,618,452,570,54,'CRIAR CAMPEONATO',this.selected===idx.create,this.hit(618,452,570,54));
      panel(ctx,618,528,570,68,.8);
      this.renderer.renderPortrait(ctx,ROSTER[2]!,650,532,96,60,this.now);
      this.renderer.renderPortrait(ctx,ROSTER[3]!,1070,532,96,60,this.now+160);
      ctx.textAlign='center';ctx.fillStyle=palette.muted;ctx.font=fonts.body(11);ctx.fillText('Host inicia o campeonato quando todos estiverem READY.',904,570);
    } else {
      this.option(ctx,618,306,176,44,`TEMPO ${this.settings.roundSeconds}s`,this.selected===idx.time,this.hit(618,306,176,44));
      this.option(ctx,816,306,176,44,`FORMATO MD${this.settings.roundsToWin*2-1}`,this.selected===idx.rounds,this.hit(816,306,176,44));
      pill(ctx,1012,316,'ROOM 1V1','accent');
      button(ctx,618,404,570,54,'CRIAR SALA PRIVADA',this.selected===idx.create,this.hit(618,404,570,54));
      panel(ctx,618,482,570,114,.8);
      ctx.textAlign='left';ctx.fillStyle=palette.cream;ctx.font=fonts.bodyStrong(12);ctx.fillText('AO CRIAR',640,506);
      ctx.fillStyle=palette.muted;ctx.font=fonts.body(12);
      wrapText(ctx,'O sistema gera um código único. Compartilhe o código com o outro jogador. A luta começa quando ambos ficam READY no lobby.',640,530,348,17,4);
      this.renderer.renderPortrait(ctx,ROSTER[0]!,1016,496,72,90,this.now);
      this.renderer.renderPortrait(ctx,ROSTER[1]!,1100,492,72,94,this.now+160);
    }
  }

  private option(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,text:string,selected:boolean,hover:boolean):void{button(ctx,x,y,w,h,text,selected,hover);}

  destroy():void{
    this.editor?.remove();this.editor=null;
    window.removeEventListener('keydown',this.onTextKey);
    this.canvas.removeEventListener('pointermove',this.onMove);
    this.canvas.removeEventListener('pointerdown',this.onPointer);
    this.offs.forEach(fn=>fn());
  }
}
