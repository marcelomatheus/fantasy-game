import type { Fighter } from './Fighter.js';
import type { SpriteClipDefinition } from '../types/game.js';
import { FighterRenderer as ProceduralRenderer } from './FighterRenderer.js';
import { SpriteAssetManager } from './SpriteAssetManager.js';
import { clamp } from '../utils/math.js';

export class SpriteFighterRenderer {
  private readonly fallback = new ProceduralRenderer();

  constructor(private readonly assets: SpriteAssetManager) {}

  render(ctx: CanvasRenderingContext2D, fighter: Fighter, now: number): void {
    const sprite = fighter.def.sprite;
    if (!sprite) {
      this.fallback.render(ctx, fighter, now);
      return;
    }
    const clip = this.pickClip(fighter);
    if (!clip) {
      this.drawLoadingFighter(ctx, fighter, now, 'SYNC');
      return;
    }
    const image = this.assets.get(clip);
    if (!image) {
      this.drawLoadingFighter(ctx, fighter, now, this.assets.status(clip) === 'failed' ? 'RETRY' : 'LOAD');
      return;
    }

    const frame = this.frameFor(fighter, clip, now);
    const vertical = clip.orientation === 'vertical';
    const sx = vertical ? 0 : (clip.startFrame ?? 0) + frame;
    const sy = vertical ? (clip.startFrame ?? 0) + frame : 0;
    const srcX = vertical ? 0 : sx * clip.frameWidth;
    const srcY = vertical ? sy * clip.frameHeight : 0;

    ctx.save();
    const altitude = Math.max(0, 598 - fighter.y);
    ctx.globalAlpha = .27 * Math.max(.5, 1 - altitude / 500);
    ctx.fillStyle = '#16120d';
    ctx.beginPath();
    ctx.ellipse(fighter.x, fighter.y + 2, fighter.def.body.width * .74, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(fighter.x, fighter.y);
    ctx.scale(fighter.facing, 1);
    ctx.imageSmoothingEnabled = false;
    if (sprite.tintFilter) ctx.filter = sprite.tintFilter;
    const dw = clip.frameWidth * sprite.scale;
    const dh = clip.frameHeight * sprite.scale;
    if (fighter.flashMs > 0) ctx.globalAlpha = .72;
    ctx.drawImage(image, srcX, srcY, clip.frameWidth, clip.frameHeight, -dw / 2, -sprite.anchorY * sprite.scale, dw, dh);
    ctx.restore();
  }

  renderPortrait(ctx: CanvasRenderingContext2D, def: Fighter['def'], x: number, y: number, w: number, h: number, now: number): void {
    const clip = def.sprite?.clips.idle;
    const sprite = def.sprite;
    if (!clip || !sprite) {
      this.portraitFallback(ctx, def, x, y, w, h);
      return;
    }
    const image = this.assets.get(clip);
    if (!image) {
      this.drawLoadingPortrait(ctx, x, y, w, h, this.assets.status(clip) === 'failed' ? 'RETRY' : 'CARREGANDO', now);
      return;
    }

    const frame = Math.floor(now / 1000 * clip.fps) % clip.frames;
    const vertical = clip.orientation === 'vertical';
    const sx = vertical ? 0 : (clip.startFrame ?? 0) + frame;
    const sy = vertical ? (clip.startFrame ?? 0) + frame : 0;
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.imageSmoothingEnabled = false;
    if (sprite.tintFilter) ctx.filter = sprite.tintFilter;
    const scale = Math.min(w / (clip.frameWidth * .55), h / (clip.frameHeight * .72));
    const dw = clip.frameWidth * scale;
    const dh = clip.frameHeight * scale;
    ctx.drawImage(image, vertical ? 0 : sx * clip.frameWidth, vertical ? sy * clip.frameHeight : 0, clip.frameWidth, clip.frameHeight, x + w / 2 - dw / 2, y + h - sprite.anchorY * scale, dw, dh);
    ctx.restore();
  }

  private drawLoadingFighter(ctx: CanvasRenderingContext2D, fighter: Fighter, now: number, label: string): void {
    ctx.save();
    ctx.globalAlpha = .24;
    ctx.fillStyle = '#16120d';
    ctx.beginPath();
    ctx.ellipse(fighter.x, fighter.y + 2, fighter.def.body.width * .72, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const pulse = .72 + Math.sin(now * .008) * .14;
    ctx.save();
    ctx.translate(fighter.x, fighter.y);
    ctx.scale(fighter.facing, 1);
    ctx.fillStyle = `rgba(243,231,211,${0.15 + pulse * 0.12})`;
    ctx.strokeStyle = 'rgba(201,139,74,.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-22, -98, 44, 92, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillRect(-30, -86, 60, 7);
    ctx.fillRect(-18, -112, 36, 18);
    ctx.fillStyle = 'rgba(201,139,74,.7)';
    for (let i = 0; i < 3; i++) {
      const size = 5 + i;
      ctx.fillRect(-14 + i * 11, -44 + Math.sin(now * .01 + i) * 3, size, size);
    }
    ctx.restore();

    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = `900 9px 'Press Start 2P', monospace`;
    ctx.fillStyle = 'rgba(243,231,211,.78)';
    ctx.fillText(label, fighter.x, fighter.y - 120);
    ctx.restore();
  }

  private drawLoadingPortrait(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, text: string, now: number): void {
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    const pulse = .45 + Math.sin(now * .005) * .08;
    ctx.fillStyle = 'rgba(255,255,255,.03)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,.06)';
    for (let offset = -h; offset < w; offset += 18) {
      ctx.beginPath();
      ctx.moveTo(x + offset + (now * .04) % 18, y);
      ctx.lineTo(x + offset - h + (now * .04) % 18, y + h);
      ctx.stroke();
    }
    ctx.fillStyle = `rgba(243,231,211,${0.12 + pulse * 0.2})`;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h * .34, Math.min(w, h) * .14, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(x + w * .33, y + h * .44, w * .34, h * .34, 18);
    ctx.fill();
    ctx.fillStyle = 'rgba(201,139,74,.88)';
    for (let i = 0; i < 3; i++) ctx.fillRect(x + w * .36 + i * 16, y + h * .84, 8, 8);
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(243,231,211,.78)';
    ctx.font = `900 9px 'Press Start 2P', monospace`;
    ctx.fillText(text, x + w / 2, y + 20);
    ctx.restore();
  }

  private portraitFallback(ctx: CanvasRenderingContext2D, def: Fighter['def'], x: number, y: number, w: number, h: number): void {
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    const a = def.appearance;
    ctx.fillStyle = 'rgba(255,255,255,.035)';
    ctx.fillRect(x, y, w, h);
    const cx = x + w * .5;
    const base = y + h * .92;
    ctx.fillStyle = a.primary;
    ctx.beginPath(); ctx.roundRect(cx - w * .18, base - h * .55, w * .36, h * .44, w * .08); ctx.fill();
    ctx.fillStyle = a.skin;
    ctx.beginPath(); ctx.arc(cx, base - h * .66, w * .13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = a.hair;
    ctx.beginPath(); ctx.arc(cx, base - h * .7, w * .13, Math.PI, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = a.skinShadow; ctx.lineWidth = Math.max(3, w * .04);
    ctx.beginPath(); ctx.moveTo(cx - w * .13, base - h * .48); ctx.lineTo(cx - w * .25, base - h * .27); ctx.moveTo(cx + w * .13, base - h * .48); ctx.lineTo(cx + w * .25, base - h * .3); ctx.stroke();
    ctx.fillStyle = a.accent; ctx.fillRect(cx - w * .18, base - h * .14, w * .36, h * .05);
    ctx.restore();
  }

  private pickClip(f: Fighter): SpriteClipDefinition | undefined {
    const s = f.def.sprite?.clips;
    if (!s) return undefined;
    if (f.state === 'ko' || f.state === 'finished') return s.ko ?? s.hit ?? s.idle;
    if (f.state === 'hit') return s.hit ?? s.idle;
    if (f.state === 'block') return s.block ?? s.idle;
    if (!f.isGrounded) return f.vy < 0 ? (s.jump ?? s.idle) : (s.fall ?? s.jump ?? s.idle);
    if (f.state === 'walkForward' || f.state === 'walkBackward') return s.walk ?? s.idle;
    if (f.state === 'attack' && f.currentAttack) {
      if (f.currentAttack.key === 'heavy' || f.currentAttack.key === 'airLight' || f.currentAttack.key === 'special2' || f.currentAttack.key === 'super') return f.visualStrikeVariant === 0 ? (s.heavyA ?? s.lightA) : (s.heavyB ?? s.heavyA ?? s.lightB);
      return f.visualStrikeVariant === 0 ? (s.lightA ?? s.idle) : (s.lightB ?? s.lightA ?? s.idle);
    }
    return s.idle;
  }

  private frameFor(f: Fighter, clip: SpriteClipDefinition, now: number): number {
    if (f.state === 'ko' || f.state === 'finished') return clip.frames - 1;
    if (f.state === 'attack') return clamp(Math.floor(f.attackProgress * clip.frames), 0, clip.frames - 1);
    return Math.floor((now / 1000) * clip.fps) % clip.frames;
  }
}
