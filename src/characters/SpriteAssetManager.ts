import type { FighterDefinition, SpriteClipDefinition } from '../types/game.js';

type AssetStatus = 'idle' | 'loading' | 'loaded' | 'failed';

export class SpriteAssetManager {
  private readonly images = new Map<string, HTMLImageElement>();
  private readonly statusMap = new Map<string, AssetStatus>();

  preload(defs: FighterDefinition[]): void {
    for (const def of defs) {
      if (!def.sprite) continue;
      for (const clip of Object.values(def.sprite.clips)) if (clip) this.load(clip);
    }
  }

  private load(clip: SpriteClipDefinition): void {
    const key = clip.url;
    const current = this.statusMap.get(key);
    if (current === 'loading' || current === 'loaded' || current === 'failed' || typeof Image === 'undefined') return;
    this.statusMap.set(key, 'loading');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    let fallbackAttempted = false;
    img.onload = () => {
      this.images.set(key, img);
      this.statusMap.set(key, 'loaded');
    };
    img.onerror = () => {
      if (!fallbackAttempted && clip.fallbackUrl) {
        fallbackAttempted = true;
        img.src = clip.fallbackUrl;
        return;
      }
      this.statusMap.set(key, 'failed');
    };
    img.src = clip.url;
  }

  get(clip: SpriteClipDefinition): HTMLImageElement | undefined {
    this.load(clip);
    return this.images.get(clip.url);
  }

  status(clip: SpriteClipDefinition): AssetStatus {
    this.load(clip);
    return this.statusMap.get(clip.url) ?? 'idle';
  }

  get loadedCount(): number { return this.images.size; }
  get failedCount(): number { return [...this.statusMap.values()].filter((state) => state === 'failed').length; }
}
