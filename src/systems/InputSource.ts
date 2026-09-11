export interface InputSource {
  isHeld(code: string): boolean;
  wasPressed(code: string): boolean;
  wasReleased?(code: string): boolean;
  advanceFrame?(): boolean | void;
  destroy?(): void;
}
