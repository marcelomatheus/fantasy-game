import { ROSTER } from '../characters/roster.js';
import { SpriteAssetManager } from '../characters/SpriteAssetManager.js';
import { SpriteFighterRenderer } from '../characters/SpriteFighterRenderer.js';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig.js';
import type { AudioManager } from '../systems/AudioManager.js';
import type { InputManager } from '../systems/InputManager.js';
import { button, drawBackdrop, fonts, palette, panel, pill, wrapText } from '../ui/CanvasUi.js';
import type { Scene } from './Scene.js';

type MenuAction='local'|'online'|'tournament'|'characters'|'controls'|'settings';

const items:{label:string;action:MenuAction;hint:string}[]=[
  {label:'LOCAL FIGHT',action:'local',hint:'Configure cenário, tempo e formato para a partida local no mesmo teclado.'},
  {label:'ONLINE FIGHT',action:'online',hint:'Entre por código ou crie uma sala privada para uma luta 1v1.'},
  {label:'TOURNAMENT',action:'tournament',hint:'Crie campeonatos entre amigos com salas, bracket e progresso automático.'},
  {label:'CHARACTERS',action:'characters',hint:'Confira o roster jogável, arquétipos, bio curta e estatísticas base.'},
  {label:'CONTROLS',action:'controls',hint:'Revise os comandos locais, confirmação, navegação e atalhos.'},
  {label:'SETTINGS',action:'settings',hint:'Ajuste áudio, tremor de tela, resolução e preferências persistentes.'},
];

const MENU_X = 72;
const MENU_Y = 202;
const MENU_WIDTH = 388;
const MENU_HEIGHT = 50;
const MENU_GAP = 58;

export class MainMenuScene implements Scene {
  private selected = 0;
  private now = 0;
  private pointer = { x: 0, y: 0, clicked: false };
  private modal: MenuAction | null = null;
  private assets = new SpriteAssetManager();
  private renderer = new SpriteFighterRenderer(this.assets);
  private featuredIndex = 2;

  constructor(
    private readonly input: InputManager,
    private readonly audio: AudioManager,
    private readonly canvas: HTMLCanvasElement,
    private readonly actions: Record<'local'|'online'|'tournament'|'settings',()=>void>,
  ) {
    this.assets.preload(ROSTER);
    canvas.addEventListener('pointermove', this.onMove);
    canvas.addEventListener('pointerdown', this.onPointer);
    this.audio.startMusic('menu');
  }

  private pos(e: PointerEvent): { x: number; y: number } {
    const r = this.canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * GAME_WIDTH / r.width, y: (e.clientY - r.top) * GAME_HEIGHT / r.height };
  }

  private onMove=(e: PointerEvent): void=>{const p=this.pos(e);this.pointer.x=p.x;this.pointer.y=p.y;};
  private onPointer=(e: PointerEvent): void=>{this.pointer={...this.pos(e),clicked:true};};
  private hit(x:number,y:number,w:number,h:number):boolean{return this.pointer.x>=x&&this.pointer.x<=x+w&&this.pointer.y>=y&&this.pointer.y<=y+h;}

  update(dt: number): void {
    this.now += dt * 1000;
    if (this.input.wasPressed('ArrowDown') || this.input.wasPressed('KeyS')) this.selected = (this.selected + 1) % items.length;
    if (this.input.wasPressed('ArrowUp') || this.input.wasPressed('KeyW')) this.selected = (this.selected - 1 + items.length) % items.length;
    this.featuredIndex = this.selected % ROSTER.length;
    if (this.input.wasPressed('Escape')) this.modal = null;
    if (this.input.wasPressed('Enter')) void this.activate(items[this.selected]?.action ?? 'local');

    items.forEach((_, i) => {
      const y = MENU_Y + i * MENU_GAP;
      if (this.hit(MENU_X, y, MENU_WIDTH, MENU_HEIGHT)) {
        this.selected = i;
        this.featuredIndex = i % ROSTER.length;
        if (this.pointer.clicked) void this.activate(items[i]?.action ?? 'local');
      }
    });

    if (this.hit(512, 610, 256, 42)) this.modal = this.pointer.clicked ? null : this.modal;
    if (this.pointer.clicked && this.modal && this.hit(512, 610, 256, 42)) this.modal = null;
    this.pointer.clicked = false;
    window.__FINAL_BELL_DEBUG__={scene:'menu'};
  }

  private async activate(action: MenuAction): Promise<void> {
    await this.audio.unlock();
    if (action === 'local' || action === 'online' || action === 'tournament' || action === 'settings') {
      this.actions[action]();
      return;
    }
    this.modal = action;
  }

  render(ctx: CanvasRenderingContext2D): void {
    drawBackdrop(ctx, GAME_WIDTH, GAME_HEIGHT, this.now);
    this.renderLeftPanel(ctx);
    this.renderRightPanel(ctx);
    if (this.modal) this.renderModal(ctx);
  }

  private renderLeftPanel(ctx: CanvasRenderingContext2D): void {
    panel(ctx, 34, 28, 452, 664, .94);
    this.drawLogo(ctx, 70, 54);

    ctx.textAlign = 'left';
    ctx.fillStyle = palette.cream;
    ctx.font = fonts.heading(11);
    ctx.fillText('ESCOLHA UM MODO', MENU_X, 180);

    items.forEach((item, i) => {
      const y = MENU_Y + i * MENU_GAP;
      button(ctx, MENU_X, y, MENU_WIDTH, MENU_HEIGHT, item.label, this.selected === i, this.hit(MENU_X, y, MENU_WIDTH, MENU_HEIGHT));
    });

    ctx.fillStyle = palette.muted;
    ctx.font = fonts.body(10);
    ctx.fillText('↑ ↓  NAVEGAR    ENTER  SELECIONAR', MENU_X, 574);
  }

  private renderRightPanel(ctx: CanvasRenderingContext2D): void {
    const featured = ROSTER[this.featuredIndex] ?? ROSTER[0]!;
    panel(ctx, 514, 28, 732, 664, .92);

    ctx.textAlign = 'left';
    ctx.fillStyle = palette.cream;
    ctx.font = fonts.title(32);
    ctx.fillText('SELECT. FIGHT. ASCEND.', 556, 84);

    panel(ctx, 558, 116, 648, 470, .8);
    ctx.fillStyle = 'rgba(201,139,74,.06)';
    ctx.beginPath(); ctx.ellipse(884, 320, 194, 226, 0, 0, Math.PI * 2); ctx.fill();
    this.renderer.renderPortrait(ctx, featured, 660, 138, 448, 350, this.now);

    pill(ctx, 590, 142, (featured.archetype ?? 'balanced').toUpperCase(), 'accent');

    ctx.fillStyle = palette.cream;
    ctx.font = fonts.title(28);
    ctx.fillText(featured.name, 590, 524);
    ctx.fillStyle = palette.muted;
    ctx.font = fonts.bodyStrong(11);
    ctx.fillText(`HP ${featured.maxHealth}   •   SPD ${featured.speed}   •   AIR ${featured.airControl.toFixed(2)}`, 590, 552);

    ctx.fillStyle = palette.muted;
    ctx.font = fonts.body(12);
    wrapText(ctx, items[this.selected]?.hint ?? '', 580, 622, 600, 18, 2);
  }

  private renderModal(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(10,9,8,.82)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    panel(ctx, 140, 82, 1000, 566, .98);
    const isCharacters = this.modal === 'characters';
    ctx.textAlign = 'center';
    ctx.fillStyle = palette.cream;
    ctx.font = fonts.title(32);
    ctx.fillText(isCharacters ? 'ROSTER OVERVIEW' : 'CONTROLS', 640, 132);
    ctx.fillStyle = palette.muted;
    ctx.font = fonts.body(12);
    ctx.fillText(isCharacters ? 'Conheça os lutadores e escolha seu estilo de combate.' : 'Comandos para partidas locais.', 640, 154);
    if (isCharacters) this.renderCharactersModal(ctx); else this.renderControlsModal(ctx);
    button(ctx, 512, 610, 256, 42, 'FECHAR', false, this.hit(512, 610, 256, 42));
  }

  private renderCharactersModal(ctx: CanvasRenderingContext2D): void {
    const columns = 2;
    const startX = 188;
    const startY = 194;
    const gapX = 328;
    const gapY = 156;
    ROSTER.forEach((fighter, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const x = startX + col * gapX;
      const y = startY + row * gapY;
      panel(ctx, x, y, 284, 132, .9);
      this.renderer.renderPortrait(ctx, fighter, x + 12, y + 12, 94, 108, this.now + index * 120);
      ctx.textAlign = 'left';
      ctx.fillStyle = palette.cream;
      ctx.font = fonts.title(20);
      ctx.fillText(fighter.name, x + 118, y + 36);
      pill(ctx, x + 118, y + 44, (fighter.archetype ?? 'balanced').toUpperCase(), 'accent');
      ctx.fillStyle = palette.muted;
      ctx.font = fonts.body(11);
      wrapText(ctx, fighter.bio ?? fighter.tagline, x + 118, y + 82, 146, 15, 3);
    });
  }

  private renderControlsModal(ctx: CanvasRenderingContext2D): void {
    panel(ctx, 190, 192, 360, 298, .92);
    panel(ctx, 730, 192, 360, 298, .92);
    ctx.textAlign = 'center';
    ctx.fillStyle = palette.accent;
    ctx.font = fonts.heading(14);
    ctx.fillText('PLAYER 1', 370, 234);
    ctx.fillStyle = '#cf8d83';
    ctx.fillText('PLAYER 2', 910, 234);
    ctx.fillStyle = palette.cream;
    ctx.font = fonts.bodyStrong(14);
    const p1=['A / D mover','W pular','S agachar','F confirmar','G ataque forte','R defender'];
    const p2=['← / → mover','↑ pular','↓ agachar','K confirmar','L ataque forte','O defender'];
    p1.forEach((line,i)=>ctx.fillText(line,370,278+i*32));
    p2.forEach((line,i)=>ctx.fillText(line,910,278+i*32));
    panel(ctx, 220, 508, 840, 76, .86);
    ctx.fillStyle = palette.muted;
    ctx.font = fonts.body(11);
    ctx.fillText('MOBILE ONLINE: direcional touch + botões F fraco, H forte e G defesa.', 640, 536);
    ctx.fillText('ESPECIAIS: ↓↘→+F • →↓↘+H • SUPER: ↓↘→ ↓↘→+H • FINAL: ↓↘→+G', 640, 562);
  }

  private drawLogo(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const w = 392;
    const h = 102;
    ctx.save();
    ctx.translate(x, y);
    ctx.textAlign = 'left';

    ctx.beginPath(); ctx.roundRect(0, 0, w, h, 16); ctx.clip();
    const plate = ctx.createLinearGradient(0, 0, w, h);
    plate.addColorStop(0, '#171310'); plate.addColorStop(.58, '#2e241c'); plate.addColorStop(1, '#181310');
    ctx.fillStyle = plate; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(201,139,74,.08)';
    for (let sx = -60; sx < w + 80; sx += 54) {
      ctx.beginPath(); ctx.moveTo(sx, h); ctx.lineTo(sx + 66, 0); ctx.lineTo(sx + 78, 0); ctx.lineTo(sx + 12, h); ctx.closePath(); ctx.fill();
    }

    const gold = ctx.createLinearGradient(0, 8, 0, 94);
    gold.addColorStop(0, '#fff1c9'); gold.addColorStop(.48, '#e9b963'); gold.addColorStop(1, '#a95e2f');
    ctx.fillStyle = '#dfad63'; ctx.font = fonts.heading(11); ctx.fillText('CIELO', 22, 20);
    ctx.strokeStyle = 'rgba(8,7,6,.9)'; ctx.lineWidth = 6; ctx.lineJoin = 'round';
    ctx.font = fonts.title(31); ctx.fillStyle = gold;
    ctx.strokeText('FANTASY', 20, 55); ctx.fillText('FANTASY', 20, 55);
    ctx.font = fonts.title(30);
    ctx.strokeText('FIGHT', 20, 88); ctx.fillText('FIGHT', 20, 88);

    // Emblema inspirado no sino final, com luvas estilizadas nas laterais.
    ctx.fillStyle = 'rgba(133,45,39,.3)'; ctx.beginPath(); ctx.arc(330, 51, 48, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#d19a50'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(330, 51, 39, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#ead3a4'; ctx.beginPath(); ctx.arc(330, 26, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = gold; ctx.beginPath(); ctx.moveTo(330, 31); ctx.quadraticCurveTo(310, 36, 309, 65); ctx.lineTo(351, 65); ctx.quadraticCurveTo(350, 36, 330, 31); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f3d793'; ctx.beginPath(); ctx.roundRect(304, 63, 52, 7, 5); ctx.fill();
    ctx.fillStyle = '#8f302a'; ctx.beginPath(); ctx.arc(330, 72, 7, 0, Math.PI); ctx.fill();
    ctx.strokeStyle = '#b84c3f'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(283, 67); ctx.lineTo(302, 52); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(377, 67); ctx.lineTo(358, 52); ctx.stroke();

    ctx.restore();
    ctx.save(); ctx.translate(x, y);
    ctx.strokeStyle = 'rgba(239,196,125,.42)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(.75, .75, w - 1.5, h - 1.5, 16); ctx.stroke();
    ctx.strokeStyle = 'rgba(143,48,42,.8)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(18, h - 7); ctx.lineTo(142, h - 7); ctx.stroke();
    ctx.restore();
  }

  destroy(): void {
    this.canvas.removeEventListener('pointermove', this.onMove);
    this.canvas.removeEventListener('pointerdown', this.onPointer);
  }
}
