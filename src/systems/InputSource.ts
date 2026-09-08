export interface InputSource {
  isHeld(code: string): boolean;
  wasPressed(code: string): boolean;
  wasReleased?(code: string): boolean;
  advanceFrame?(): void;
  destroy?(): void;
}
