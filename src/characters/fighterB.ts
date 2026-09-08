import type { FighterDefinition } from '../types/game.js';
import { tinted, martialHero3Sprite } from './spriteProfiles.js';
import { fighterSkins, specialKits } from './combatKits.js';

export const fighterB: FighterDefinition = {
  id: 'darius',
  name: 'DARIUS',
  archetype: 'heavy',
  bio: 'Guerreiro robusto de traje vermelho e lâmina pesada, feito para avançar, resistir e golpear com impacto.',
  difficulty: 2,
  sprite: tinted(martialHero3Sprite,'hue-rotate(-38deg) saturate(.82) brightness(.92)'),
  skins: fighterSkins.darius!,
  specials: specialKits.darius!,
  tagline: 'Força e aço quebram a guarda.',
  maxHealth: 110,
  speed: 292,
  airControl: 0.56,
  jumpForce: 880,
  gravityScale: 1.04,
  body: { width: 84, height: 168 },
  appearance: {
    skin: '#7d4e35', skinShadow: '#593521',
    primary: '#7a302c', primaryShadow: '#51201e',
    secondary: '#242628', accent: '#d2b06a',
    hair: '#171210', shoe: '#171819', impact: '#c35d45',
    style: 'boxer', build: 'heavy'
  },
  attacks: {
    light: { key:'light', label:'Body Jab', damage:7, chipDamage:0, startup:82, active:72, recovery:138, hitStun:195, blockStun:112, hitStop:54, knockback:{x:128,y:0}, blockKnockback:38, hitbox:{offsetX:62,offsetY:-108,width:110,height:48}, cancelAt:138, cancelInto:['light','heavy'], shake:3 },
    heavy: { key:'heavy', label:'Overhand', damage:15, chipDamage:1, startup:190, active:100, recovery:275, hitStun:315, blockStun:175, hitStop:94, knockback:{x:275,y:300}, blockKnockback:82, hitbox:{offsetX:66,offsetY:-112,width:156,height:64}, cancelAt:9999, cancelInto:[], shake:7 },
    crouchLight: { key:'crouchLight', label:'Low Hook', damage:6, chipDamage:0, startup:95, active:78, recovery:165, hitStun:180, blockStun:105, hitStop:48, knockback:{x:102,y:0}, blockKnockback:32, hitbox:{offsetX:50,offsetY:-52,width:124,height:40}, cancelAt:150, cancelInto:['heavy'], shake:2 },
    airLight: { key:'airLight', label:'Flying Elbow', damage:8, chipDamage:0, startup:90, active:120, recovery:130, hitStun:215, blockStun:115, hitStop:58, knockback:{x:145,y:52}, blockKnockback:42, hitbox:{offsetX:54,offsetY:-98,width:126,height:66}, cancelAt:9999, cancelInto:[], shake:4 }
  }
};
