export type PlayerId = 1 | 2;
export type Facing = -1 | 1;
export type AttackKey = 'light' | 'heavy' | 'crouchLight' | 'airLight';
export type SpecialKey = 'special1' | 'special2' | 'super';
export type MoveKey = AttackKey | SpecialKey;
export type FighterState = 'idle' | 'walkForward' | 'walkBackward' | 'crouch' | 'jump' | 'attack' | 'block' | 'hit' | 'ko' | 'finished';
export type StageId = 'cristo' | 'amazonia' | 'colonial' | 'sertao';
export type RoundSeconds = 30 | 60 | 99;
export type RoundsToWin = 1 | 2 | 3;
export type MatchMode = 'local' | 'online' | 'spectator';
export type FighterArchetype = 'balanced' | 'rushdown' | 'heavy' | 'range' | 'technical' | 'brawler';
export type MusicCue = 'menu' | 'select' | 'fight' | 'victory' | 'tournament';

export interface Vec2 { x: number; y: number; }
export interface Rect { x: number; y: number; width: number; height: number; }

export interface MatchSettings {
  stageId: StageId;
  roundSeconds: RoundSeconds;
  roundsToWin: RoundsToWin;
  mode?: MatchMode;
}

export interface AttackDefinition {
  key: MoveKey;
  label: string;
  damage: number;
  chipDamage: number;
  startup: number;
  active: number;
  recovery: number;
  hitStun: number;
  blockStun: number;
  hitStop: number;
  knockback: Vec2;
  blockKnockback: number;
  hitbox: { offsetX: number; offsetY: number; width: number; height: number };
  cancelAt: number;
  cancelInto: MoveKey[];
  shake: number;
}

export interface ProjectileDefinition {
  speed: number;
  lifetimeMs: number;
  width: number;
  height: number;
  color: string;
  spawnAtMs: number;
}

export interface SpecialMoveDefinition extends AttackDefinition {
  command: 'qcf-light' | 'dp-heavy' | 'double-qcf-heavy';
  meterCost: number;
  projectile?: ProjectileDefinition;
}

export interface SkinDefinition {
  id: string;
  name: string;
  filter?: string;
  appearance?: Partial<FighterAppearance>;
}

export interface FighterLoadout { fighterId: string; skinId: string; }

export interface FighterAppearance {
  skin: string;
  skinShadow: string;
  primary: string;
  primaryShadow: string;
  secondary: string;
  accent: string;
  hair: string;
  shoe: string;
  impact: string;
  style: 'kickboxer' | 'boxer';
  build: 'lean' | 'heavy';
}

export interface SpriteClipDefinition {
  url: string;
  /** Optional immutable remote source used only when the vendored local file is unavailable. */
  fallbackUrl?: string;
  frameWidth: number;
  frameHeight: number;
  frames: number;
  fps: number;
  orientation?: 'horizontal' | 'vertical';
  startFrame?: number;
}

export interface FighterSpriteDefinition {
  packName: string;
  author: string;
  sourceUrl: string;
  license: string;
  anchorY: number;
  scale: number;
  tintFilter?: string;
  clips: Partial<Record<'idle'|'walk'|'jump'|'fall'|'block'|'lightA'|'lightB'|'heavyA'|'heavyB'|'hit'|'ko'|'victory', SpriteClipDefinition>>;
}

export interface FighterDefinition {
  id: string;
  name: string;
  tagline: string;
  archetype?: FighterArchetype;
  bio?: string;
  difficulty?: number;
  maxHealth: number;
  speed: number;
  acceleration?: number;
  airControl: number;
  jumpForce: number;
  gravityScale: number;
  weight?: number;
  body: { width: number; height: number };
  appearance: FighterAppearance;
  sprite?: FighterSpriteDefinition;
  skins: SkinDefinition[];
  selectedSkinId?: string;
  attacks: Record<AttackKey, AttackDefinition>;
  specials: Record<SpecialKey, SpecialMoveDefinition>;
}

export interface Controls {
  left: string;
  right: string;
  jump: string;
  crouch: string;
  light: string;
  heavy: string;
  block: string;
}

export interface FighterSnapshot {
  id: string;
  name: string;
  x: number;
  y: number;
  health: number;
  meter: number;
  state: FighterState;
  facing: Facing;
  wins: number;
}

export interface AppSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  screenShake: boolean;
  fullscreen: boolean;
  resolutionScale: 0.75 | 1 | 1.25;
  controlsPreset: 'classic' | 'ghostingSafe';
  touchControls: 'auto' | 'on' | 'off';
}

export interface DebugSnapshot {
  scene: 'menu' | 'setup' | 'characterSelect' | 'fight' | 'onlineLobby' | 'tournament' | 'settings';
  phase?: string;
  timer?: number;
  paused?: boolean;
  p1?: FighterSnapshot;
  p2?: FighterSnapshot;
  hitStop?: number;
  matchWinner?: PlayerId | null;
  settings?: MatchSettings;
  fighterIds?: [string,string];
  skinIds?: [string,string];
  roomCode?: string;
  onlineStatus?: string;
}
