import type { AppSettings, Controls } from '../types/game.js';
export const PLAYER_ONE_CONTROLS:Controls={left:'KeyA',right:'KeyD',jump:'KeyW',crouch:'KeyS',light:'KeyF',heavy:'KeyG',block:'KeyR'};
export const PLAYER_TWO_CONTROLS:Controls={left:'ArrowLeft',right:'ArrowRight',jump:'ArrowUp',crouch:'ArrowDown',light:'KeyK',heavy:'KeyL',block:'KeyO'};
export const GHOSTING_SAFE_ONE:Controls={left:'KeyA',right:'KeyD',jump:'KeyW',crouch:'KeyS',light:'KeyC',heavy:'KeyV',block:'KeyB'};
export const GHOSTING_SAFE_TWO:Controls={left:'KeyJ',right:'KeyL',jump:'KeyI',crouch:'KeyK',light:'KeyN',heavy:'KeyM',block:'Comma'};
export const getControlPair=(preset:AppSettings['controlsPreset']):[Controls,Controls]=>preset==='ghostingSafe'?[GHOSTING_SAFE_ONE,GHOSTING_SAFE_TWO]:[PLAYER_ONE_CONTROLS,PLAYER_TWO_CONTROLS];
