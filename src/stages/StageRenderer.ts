import { FLOOR_Y, GAME_HEIGHT, GAME_WIDTH, STAGE_RIGHT } from '../config/gameConfig.js';
import type { StageId } from '../types/game.js';

const DRAW_LEFT = -320;
const DRAW_RIGHT = STAGE_RIGHT + 320;
const DRAW_WIDTH = DRAW_RIGHT - DRAW_LEFT;
const DRAW_BOTTOM = GAME_HEIGHT + 240;

export class StageRenderer {
  render(ctx: CanvasRenderingContext2D, stageId: StageId, now: number): void {
    switch (stageId) {
      case 'cristo': this.corcovadoHeights(ctx, now); break;
      case 'amazonia': this.amazonTwilight(ctx, now); break;
      case 'colonial': this.ouroSquare(ctx, now); break;
      case 'sertao': this.sertaoArena(ctx, now); break;
    }
  }

  renderPreview(ctx: CanvasRenderingContext2D, stageId: StageId, x: number, y: number, w: number, h: number, now: number): void {
    ctx.save();
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.clip();
    ctx.translate(x, y); ctx.scale(w / GAME_WIDTH, h / GAME_HEIGHT);
    this.render(ctx, stageId, now);
    ctx.restore();
    ctx.strokeStyle = 'rgba(48,40,31,.28)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.stroke();
  }

  private corcovadoHeights(ctx: CanvasRenderingContext2D, now: number): void {
    const sky = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    sky.addColorStop(0, '#87aac9');
    sky.addColorStop(.52, '#efc38f');
    sky.addColorStop(1, '#f4e1c1');
    this.fillStageBackground(ctx, sky);

    this.sun(ctx, 1160, 110, 68, 'rgba(255,242,209,.72)', 'rgba(255,212,141,.18)');
    this.cloudBand(ctx, now, .15, 92, '#f9f0de');
    this.cloudBand(ctx, now, .11, 144, 'rgba(255,250,243,.7)');

    this.mountainLayer(ctx, '#7e8a8d', 404, .0075, 44, .1);
    this.mountainLayer(ctx, '#647474', 438, .0092, 56, .8);
    this.citySilhouette(ctx);
    this.corcovadoStatue(ctx, 996, 242, 1.15);
    this.cableCars(ctx, now);

    ctx.fillStyle = '#7f9aa5';
    ctx.fillRect(DRAW_LEFT, FLOOR_Y - 80, DRAW_WIDTH, 84);
    ctx.fillStyle = '#bcab8a';
    ctx.fillRect(DRAW_LEFT, FLOOR_Y - 12, DRAW_WIDTH, DRAW_BOTTOM - FLOOR_Y + 12);
    for (let x = DRAW_LEFT; x < DRAW_RIGHT; x += 92) {
      ctx.strokeStyle = 'rgba(76,61,44,.18)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, FLOOR_Y - 12);
      ctx.lineTo(x - 24, DRAW_BOTTOM);
      ctx.stroke();
    }
    this.developerCredit(ctx,'cristo');
  }

  private amazonTwilight(ctx: CanvasRenderingContext2D, now: number): void {
    const sky = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    sky.addColorStop(0, '#27493d');
    sky.addColorStop(.46, '#406f56');
    sky.addColorStop(1, '#b6a06f');
    this.fillStageBackground(ctx, sky);

    this.sun(ctx, 1110, 126, 54, 'rgba(245,232,194,.52)', 'rgba(245,232,194,.12)');
    this.mountainLayer(ctx, '#1d342d', 390, .010, 32, .4);
    this.mountainLayer(ctx, '#28453a', 436, .012, 38, 1.2);
    this.mountainLayer(ctx, '#325647', 470, .014, 24, 2.6);

    for (let x = 40; x < GAME_WIDTH + 180; x += 160) this.canopyTree(ctx, x, 0.92 + (x % 5) * 0.03, now + x);
    for (let i = 0; i < 5; i++) this.mistBand(ctx, 100 + i * 240, 436 + i * 14, .06, now + i * 60);

    ctx.fillStyle = '#6a7f67';
    ctx.fillRect(DRAW_LEFT, FLOOR_Y - 78, DRAW_WIDTH, 88);
    ctx.fillStyle = '#4a675d';
    ctx.fillRect(DRAW_LEFT, FLOOR_Y - 78, DRAW_WIDTH, 20);
    this.river(ctx, now);
    this.jungleVines(ctx, now);
    ctx.fillStyle = '#766d5c';
    ctx.fillRect(DRAW_LEFT, FLOOR_Y - 8, DRAW_WIDTH, DRAW_BOTTOM - FLOOR_Y + 8);
    this.developerCredit(ctx,'amazonia');
  }

  private ouroSquare(ctx: CanvasRenderingContext2D, now: number): void {
    const sky = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    sky.addColorStop(0, '#a8c1d3');
    sky.addColorStop(.44, '#f1d39e');
    sky.addColorStop(1, '#f6e6ca');
    this.fillStageBackground(ctx, sky);

    this.cloudBand(ctx, now, .12, 104, '#faf3e7');
    this.mountainLayer(ctx, '#8ca094', 398, .0083, 36, .5);
    this.colonialTown(ctx, now);

    ctx.fillStyle = '#ccb18f';
    ctx.fillRect(DRAW_LEFT, FLOOR_Y - 56, DRAW_WIDTH, DRAW_BOTTOM - FLOOR_Y + 56);
    for (let x = DRAW_LEFT; x < DRAW_RIGHT; x += 88) {
      ctx.strokeStyle = 'rgba(94,76,57,.18)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, FLOOR_Y - 56);
      ctx.lineTo(x - 8, DRAW_BOTTOM);
      ctx.stroke();
    }
    this.developerCredit(ctx,'colonial');
  }

  private sertaoArena(ctx: CanvasRenderingContext2D, now: number): void {
    const sky = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    sky.addColorStop(0, '#f0bc7a');
    sky.addColorStop(.42, '#db915f');
    sky.addColorStop(1, '#f1dfbf');
    this.fillStageBackground(ctx, sky);

    this.sun(ctx, 1165, 102, 58, 'rgba(255,237,198,.62)', 'rgba(255,207,126,.16)');
    this.mountainLayer(ctx, '#96755a', 422, .007, 42, .2);
    this.mountainLayer(ctx, '#815f46', 458, .009, 48, 1.1);

    ctx.fillStyle = '#8a593b';
    for (let i = 0; i < 8; i++) this.rockFormation(ctx, 120 + i * 180, 480 + (i % 2) * 16, .88 + (i % 3) * .12);
    for (let i = 0; i < 6; i++) this.cactus(ctx, 210 + i * 220, 500 + (i % 2) * 12, .92 + (i % 3) * .1);

    ctx.fillStyle = '#c7a277';
    ctx.fillRect(DRAW_LEFT, FLOOR_Y - 36, DRAW_WIDTH, DRAW_BOTTOM - FLOOR_Y + 36);
    ctx.strokeStyle = 'rgba(102,71,51,.18)';
    ctx.lineWidth = 2;
    for (let x = DRAW_LEFT; x < DRAW_RIGHT; x += 110) {
      ctx.beginPath(); ctx.moveTo(x, FLOOR_Y - 36); ctx.lineTo(x - 18, DRAW_BOTTOM); ctx.stroke();
    }
    for (let i = 0; i < 18; i++) {
      const px = 90 + (i * 74) % (GAME_WIDTH - 120);
      const py = FLOOR_Y - 62 + ((i * 37) % 28);
      ctx.fillStyle = 'rgba(154,106,69,.28)';
      ctx.beginPath(); ctx.ellipse(px, py, 14 + (i % 3) * 6, 4 + (i % 2), -.3, 0, Math.PI * 2); ctx.fill();
    }
    this.developerCredit(ctx,'sertao');
  }

  private citySilhouette(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#516067';
    ctx.beginPath();
    ctx.moveTo(DRAW_LEFT, 478);
    for (let x = DRAW_LEFT; x < DRAW_RIGHT; x += 66) {
      const h = 356 + ((x / 66) % 4) * 22;
      ctx.lineTo(x, h);
      ctx.lineTo(x + 30, h);
      ctx.lineTo(x + 30, 478);
    }
    ctx.lineTo(DRAW_RIGHT, 478);
    ctx.lineTo(DRAW_RIGHT, 540);
    ctx.lineTo(DRAW_LEFT, 540);
    ctx.closePath();
    ctx.fill();
  }

  private corcovadoStatue(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = '#d8d5cc';
    ctx.fillRect(-8, 40, 16, 48);
    ctx.fillRect(-38, 54, 76, 10);
    ctx.fillRect(-58, 49, 20, 6);
    ctx.fillRect(38, 49, 20, 6);
    ctx.beginPath(); ctx.arc(0, 24, 16, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b8b4aa';
    ctx.fillRect(-24, 88, 48, 28);
    ctx.fillRect(-36, 112, 72, 20);
    ctx.restore();
  }

  private cableCars(ctx: CanvasRenderingContext2D, now: number): void {
    ctx.strokeStyle = 'rgba(54,50,47,.44)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(140, 220); ctx.lineTo(1060, 298); ctx.stroke();
    for (let i = 0; i < 2; i++) {
      const progress = ((now * 0.00003) + i * .42) % 1;
      const x = 160 + progress * 860;
      const y = 222 + progress * 72;
      ctx.strokeStyle = 'rgba(63,54,43,.44)';
      ctx.beginPath(); ctx.moveTo(x, y - 2); ctx.lineTo(x, y + 26); ctx.stroke();
      ctx.fillStyle = i === 0 ? '#a33e35' : '#d39a4a';
      ctx.beginPath(); ctx.roundRect(x - 18, y + 24, 36, 18, 6); ctx.fill();
    }
  }

  private colonialTown(ctx: CanvasRenderingContext2D, now: number): void {
    ctx.fillStyle = '#f0dfc2';
    ctx.fillRect(180, 332, 900, 170);
    const houses = [
      { x: 220, w: 140, roof: '#8d4f39', body: '#f4e7cf' },
      { x: 356, w: 110, roof: '#7b4633', body: '#e8d8b9' },
      { x: 470, w: 154, roof: '#9f5c40', body: '#f1e0c5' },
      { x: 628, w: 118, roof: '#7f4032', body: '#f6e9d0' },
      { x: 748, w: 168, roof: '#a8613d', body: '#ede0c8' },
      { x: 918, w: 120, roof: '#7b4332', body: '#f5e8d4' },
    ] as const;
    for (const house of houses) {
      ctx.fillStyle = house.body;
      ctx.fillRect(house.x, 376, house.w, 126);
      ctx.fillStyle = house.roof;
      ctx.beginPath(); ctx.moveTo(house.x - 8, 376); ctx.lineTo(house.x + house.w / 2, 332); ctx.lineTo(house.x + house.w + 8, 376); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(133,102,71,.34)';
      for (let dx = 20; dx < house.w - 20; dx += 34) ctx.fillRect(house.x + dx, 396, 20, 44);
      ctx.fillStyle = '#654a36';
      ctx.fillRect(house.x + house.w / 2 - 16, 448, 32, 54);
    }
    ctx.fillStyle = '#f4efe2';
    ctx.fillRect(1026, 302, 112, 200);
    ctx.fillStyle = '#d6cab4';
    ctx.fillRect(1068, 264, 26, 50);
    ctx.fillStyle = '#784130';
    ctx.beginPath(); ctx.moveTo(1008, 302); ctx.lineTo(1082, 252); ctx.lineTo(1154, 302); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#694634';
    for (let i = 0; i < 7; i++) {
      const px = 300 + i * 120;
      const wave = Math.sin(now * 0.003 + i) * 10;
      ctx.strokeStyle = 'rgba(98,71,50,.48)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(px, 286); ctx.lineTo(px + 76, 286 + wave * 0.18); ctx.stroke();
      ctx.fillStyle = i % 2 === 0 ? '#ddab57' : '#b94f4a';
      ctx.beginPath(); ctx.moveTo(px + 8, 286); ctx.lineTo(px + 32 + wave, 296); ctx.lineTo(px + 8, 306); ctx.closePath(); ctx.fill();
    }
  }

  private river(ctx: CanvasRenderingContext2D, now: number): void {
    const river = ctx.createLinearGradient(0, FLOOR_Y - 50, 0, FLOOR_Y + 36);
    river.addColorStop(0, '#62898d');
    river.addColorStop(1, '#39585b');
    ctx.fillStyle = river;
    ctx.fillRect(DRAW_LEFT, FLOOR_Y - 58, DRAW_WIDTH, 46);
    ctx.strokeStyle = 'rgba(216,244,244,.12)';
    ctx.lineWidth = 2;
    for (let y = FLOOR_Y - 52; y < FLOOR_Y - 16; y += 10) {
      ctx.beginPath();
      for (let x = DRAW_LEFT; x < DRAW_RIGHT; x += 34) {
        const py = y + Math.sin(now * 0.004 + x * 0.03 + y) * 2;
        if (x === DRAW_LEFT) ctx.moveTo(x, py); else ctx.lineTo(x, py);
      }
      ctx.stroke();
    }
  }

  private jungleVines(ctx: CanvasRenderingContext2D, now: number): void {
    for (let x = 150; x < GAME_WIDTH + 120; x += 170) {
      const sway = Math.sin(now * 0.002 + x * 0.01) * 16;
      ctx.strokeStyle = 'rgba(38,77,52,.58)';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.quadraticCurveTo(x + sway, 160, x - sway * .4, 320); ctx.stroke();
      for (let i = 0; i < 4; i++) {
        const py = 56 + i * 54;
        ctx.fillStyle = 'rgba(88,146,88,.74)';
        ctx.beginPath(); ctx.ellipse(x + (i % 2 === 0 ? 18 : -18), py, 16, 6, i % 2 === 0 ? .6 : -.6, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  private canopyTree(ctx: CanvasRenderingContext2D, x: number, scale: number, seed: number): void {
    ctx.save();
    ctx.translate(x, 0);
    ctx.scale(scale, scale);
    ctx.fillStyle = '#594130';
    ctx.fillRect(-10, 274, 20, 180);
    const pulse = .98 + Math.sin(seed * 0.004) * .04;
    for (const [dx, dy, r, color] of [
      [0, 256, 60, '#3e6a49'],
      [-44, 268, 42, '#365a41'],
      [46, 262, 46, '#447251'],
      [0, 220, 48, '#4b7b55'],
    ] as const) {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(dx, dy, r * pulse, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  private cactus(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = '#476b4c';
    ctx.beginPath(); ctx.roundRect(-10, -74, 20, 78, 8); ctx.fill();
    ctx.beginPath(); ctx.roundRect(-28, -58, 16, 38, 8); ctx.fill();
    ctx.beginPath(); ctx.roundRect(12, -52, 16, 34, 8); ctx.fill();
    ctx.restore();
  }

  private rockFormation(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = '#74533f';
    ctx.beginPath(); ctx.moveTo(-34, 0); ctx.lineTo(-12, -26); ctx.lineTo(18, -18); ctx.lineTo(40, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#9a6c50';
    ctx.beginPath(); ctx.moveTo(-22, -4); ctx.lineTo(-4, -18); ctx.lineTo(14, -12); ctx.lineTo(26, -2); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  private mountainLayer(ctx: CanvasRenderingContext2D, color: string, baseline: number, frequency: number, amplitude: number, phase: number): void {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(DRAW_LEFT, baseline + 120);
    for (let x = DRAW_LEFT; x < DRAW_RIGHT; x += 60) ctx.lineTo(x, baseline - Math.sin(x * frequency + phase) * amplitude);
    ctx.lineTo(DRAW_RIGHT, baseline + 120); ctx.lineTo(DRAW_LEFT, baseline + 120); ctx.closePath(); ctx.fill();
  }

  private mistBand(ctx: CanvasRenderingContext2D, x: number, y: number, alpha: number, now: number): void {
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.beginPath(); ctx.ellipse(x + Math.sin(now * .0013 + x) * 24, y, 104, 20, 0, 0, Math.PI * 2); ctx.fill();
  }

  private sun(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string, glow: string): void {
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y, r * 2.05, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }

  private cloudBand(ctx: CanvasRenderingContext2D, now: number, speed: number, y: number, color: string): void {
    ctx.fillStyle = color;
    for (let i = 0; i < 8; i++) {
      const x = ((i * 240) + now * speed) % 1860 - 160;
      ctx.beginPath();
      ctx.ellipse(x, y, 92, 28, 0, 0, Math.PI * 2);
      ctx.ellipse(x + 58, y + 8, 78, 24, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private developerCredit(ctx:CanvasRenderingContext2D,stage:StageId):void{
    // Esta faixa permanece dentro da interseção visível da câmera mesmo no zoom/pan máximos.
    const safeX=500;
    ctx.save();
    ctx.textAlign='left';
    if(stage==='cristo'){
      ctx.translate(safeX,FLOOR_Y-52);ctx.rotate(-.018);
      ctx.fillStyle='rgba(43,61,67,.82)';ctx.font='800 9px Orbitron, system-ui';ctx.fillText('UMA LUTA DE',0,0);
      ctx.font='900 13px Orbitron, system-ui';ctx.fillText('MARCELOMATHEUS',0,18);
      ctx.strokeStyle='rgba(43,61,67,.62)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,25);ctx.lineTo(154,25);ctx.stroke();
    }else if(stage==='amazonia'){
      ctx.translate(safeX,FLOOR_Y-52);
      ctx.fillStyle='#513b2b';ctx.beginPath();ctx.moveTo(0,4);ctx.quadraticCurveTo(96,-13,208,0);ctx.lineTo(200,35);ctx.quadraticCurveTo(90,43,-8,28);ctx.closePath();ctx.fill();
      ctx.fillStyle='rgba(238,207,151,.92)';ctx.font='700 9px Orbitron, system-ui';ctx.fillText('CRIADO POR',20,13);
      ctx.font='900 13px Orbitron, system-ui';ctx.fillText('MARCELOMATHEUS',20,30);
    }else if(stage==='colonial'){
      ctx.translate(safeX,451);ctx.rotate(-.01);
      ctx.fillStyle='rgba(103,58,42,.88)';ctx.font='700 9px Orbitron, system-ui';ctx.fillText('OFICINA DE',0,0);
      ctx.font='900 13px Orbitron, system-ui';ctx.fillText('MARCELOMATHEUS',0,18);
      ctx.strokeStyle='rgba(103,58,42,.65)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-4,25);ctx.lineTo(158,25);ctx.stroke();
    }else{
      ctx.translate(safeX,FLOOR_Y-78);
      ctx.fillStyle='#79543f';ctx.beginPath();ctx.moveTo(0,45);ctx.lineTo(18,5);ctx.lineTo(174,0);ctx.lineTo(210,48);ctx.closePath();ctx.fill();
      ctx.fillStyle='rgba(246,208,156,.94)';ctx.font='700 9px Orbitron, system-ui';ctx.fillText('ESCULPIDO POR',24,22);
      ctx.font='900 13px Orbitron,system-ui';ctx.fillText('MARCELOMATHEUS',24,40);
    }
    ctx.restore();
  }

  private fillStageBackground(ctx: CanvasRenderingContext2D, fill: CanvasGradient): void {
    // A câmera pode afastar e tremer, expondo coordenadas além do canvas lógico.
    ctx.fillStyle = fill;
    ctx.fillRect(DRAW_LEFT, -160, DRAW_WIDTH, DRAW_BOTTOM + 160);
  }
}
