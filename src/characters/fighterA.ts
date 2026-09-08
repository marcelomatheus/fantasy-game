import type { FighterDefinition } from '../types/game.js';
import { martialHeroSprite } from './spriteProfiles.js';
import { fighterSkins, specialKits } from './combatKits.js';

export const fighterA: FighterDefinition = {
  id: 'mateo',
  name: 'MATEO',
  archetype: 'balanced',
  bio: 'Artista marcial de uniforme claro e faixa escura, equilibrado entre socos retos, joelhadas e chutes precisos.',
  difficulty: 2,
  sprite: martialHeroSprite,
  skins: fighterSkins.mateo!,
  specials: specialKits.mateo!,
  tagline: 'Técnica, ritmo e precisão.',
  maxHealth: 100,
  speed: 338,
  airControl: 0.66,
  jumpForce: 900,
  gravityScale: 1,
  body: { width: 70, height: 164 },
  appearance: {
    skin: '#c98961', skinShadow: '#9d6447',
    primary: '#e8e0ce', primaryShadow: '#b9ad98',
    secondary: '#26343b', accent: '#a9652e',
    hair: '#1f1a17', shoe: '#2d2925', impact: '#d59a4a',
    style: 'kickboxer', build: 'lean'
  },
  attacks: {
    light: { key:'light', label:'Straight', damage:6, chipDamage:0, startup:70, active:70, recovery:125, hitStun:185, blockStun:105, hitStop:48, knockback:{x:115,y:0}, blockKnockback:35, hitbox:{offsetX:56,offsetY:-116,width:104,height:44}, cancelAt:125, cancelInto:['light','heavy'], shake:2 },
    heavy: { key:'heavy', label:'Roundhouse', damage:13, chipDamage:1, startup:165, active:95, recovery:250, hitStun:285, blockStun:160, hitStop:82, knockback:{x:245,y:260}, blockKnockback:72, hitbox:{offsetX:64,offsetY:-106,width:148,height:58}, cancelAt:9999, cancelInto:[], shake:6 },
    crouchLight: { key:'crouchLight', label:'Low Sweep', damage:5, chipDamage:0, startup:85, active:80, recovery:155, hitStun:170, blockStun:100, hitStop:44, knockback:{x:92,y:0}, blockKnockback:28, hitbox:{offsetX:48,offsetY:-52,width:120,height:38}, cancelAt:145, cancelInto:['heavy'], shake:2 },
    airLight: { key:'airLight', label:'Jump Knee', damage:7, chipDamage:0, startup:75, active:110, recovery:120, hitStun:195, blockStun:105, hitStop:52, knockback:{x:130,y:40}, blockKnockback:38, hitbox:{offsetX:54,offsetY:-102,width:118,height:60}, cancelAt:9999, cancelInto:[], shake:3 }
  }
};
