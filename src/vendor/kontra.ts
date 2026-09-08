/**
 * Tiny typed adaptation of Kontra.js core + GameLoop concepts.
 * Upstream: https://github.com/straker/kontra — MIT, Copyright (c) 2015 Steven Lambert.
 * Kept intentionally small for this self-contained MVP.
 */
export interface KontraContext { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D; }
export interface Loop { start(): void; stop(): void; readonly isStopped: boolean; }
export interface LoopOptions { fps?: number; update: (dt: number) => void; render: () => void; context: CanvasRenderingContext2D; }

export function init(canvasOrId: HTMLCanvasElement | string): KontraContext {
  const canvas = typeof canvasOrId === 'string' ? document.getElementById(canvasOrId) : canvasOrId;
  if (!(canvas instanceof HTMLCanvasElement)) throw new Error('A valid canvas is required.');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D context is unavailable.');
  context.imageSmoothingEnabled = true;
  return { canvas, context };
}

export function GameLoop(options: LoopOptions): Loop {
  const fps = options.fps ?? 60;
  const stepMs = 1000 / fps;
  const step = 1 / fps;
  let stopped = true;
  let accumulator = 0;
  let last = performance.now();
  let raf = 0;

  const frame = (now: number): void => {
    if (stopped) return;
    raf = requestAnimationFrame(frame);
    const delta = Math.min(250, now - last);
    last = now;
    accumulator += delta;
    while (accumulator >= stepMs) {
      options.update(step);
      accumulator -= stepMs;
    }
    options.context.clearRect(0, 0, options.context.canvas.width, options.context.canvas.height);
    options.render();
  };

  return {
    get isStopped(): boolean { return stopped; },
    start(): void { if (!stopped) return; stopped = false; last = performance.now(); raf = requestAnimationFrame(frame); },
    stop(): void { stopped = true; cancelAnimationFrame(raf); }
  };
}
