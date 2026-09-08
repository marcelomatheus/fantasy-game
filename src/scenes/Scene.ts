import type { InputManager } from '../systems/InputManager.js';
export interface Scene { update(dt:number):void; render(ctx:CanvasRenderingContext2D):void; destroy?():void; }
export interface SceneServices { input:InputManager; setScene:(scene:Scene)=>void; }
