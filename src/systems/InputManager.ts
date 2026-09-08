export class InputManager {
  private held = new Set<string>();
  private pressed = new Set<string>();
  private released = new Set<string>();
  private virtualHeld = new Set<string>();
  private virtualPressed = new Set<string>();
  private virtualReleased = new Set<string>();
  private readonly preventDefaultCodes = new Set(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space']);

  constructor(private readonly canvas: HTMLCanvasElement) {
    window.addEventListener('keydown', this.onKeyDown, { passive: false });
    window.addEventListener('keyup', this.onKeyUp, { passive: false });
    window.addEventListener('blur', this.onBlur);
    canvas.addEventListener('pointerdown', () => canvas.focus());
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (this.preventDefaultCodes.has(event.code)) event.preventDefault();
    if (!this.held.has(event.code)) this.pressed.add(event.code);
    this.held.add(event.code);
  };
  private onKeyUp = (event: KeyboardEvent): void => {
    if (this.preventDefaultCodes.has(event.code)) event.preventDefault();
    this.held.delete(event.code); this.released.add(event.code);
  };
  private onBlur = (): void => { this.held.clear(); this.pressed.clear(); this.released.clear(); };

  setVirtual(code:string,held:boolean):void{if(held){if(!this.virtualHeld.has(code))this.virtualPressed.add(code);this.virtualHeld.add(code);}else if(this.virtualHeld.delete(code))this.virtualReleased.add(code);}
  clearVirtual():void{for(const code of this.virtualHeld)this.virtualReleased.add(code);this.virtualHeld.clear();}
  isHeld(code: string): boolean { return this.held.has(code)||this.virtualHeld.has(code); }
  wasPressed(code: string): boolean { return this.pressed.has(code)||this.virtualPressed.has(code); }
  wasReleased(code: string): boolean { return this.released.has(code)||this.virtualReleased.has(code); }
  endFrame(): void { this.pressed.clear(); this.released.clear();this.virtualPressed.clear();this.virtualReleased.clear(); }
  destroy(): void { window.removeEventListener('keydown', this.onKeyDown); window.removeEventListener('keyup', this.onKeyUp); window.removeEventListener('blur', this.onBlur);this.clearVirtual(); }
}
