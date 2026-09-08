import type { FighterDefinition } from '../types/game.js';
import { fighterSkins, specialKits } from './combatKits.js';
import { marceloSprite } from './spriteProfiles.js';

export const fighterMarcelo:FighterDefinition={
  id:'marcelo',
  name:'MARCELO',
  tagline:'Leitura, precisão e impacto dourado.',
  archetype:'technical',
  bio:'Lutador urbano de cabelo curto, óculos e barba, especializado em golpes técnicos, movimentação precisa e energia dourada.',
  difficulty:3,
  maxHealth:102,
  speed:326,
  acceleration:2250,
  airControl:.64,
  jumpForce:905,
  gravityScale:1,
  weight:.98,
  body:{width:74,height:170},
  sprite:marceloSprite,
  skins:fighterSkins.marcelo!,
  specials:specialKits.marcelo!,
  appearance:{
    skin:'#b96f43',skinShadow:'#754229',
    primary:'#171719',primaryShadow:'#09090b',
    secondary:'#29282c',accent:'#c87819',
    hair:'#1a1110',shoe:'#1d2025',impact:'#e9a52c',
    style:'kickboxer',build:'lean'
  },
  attacks:{
    light:{key:'light',label:'Jab de Leitura',damage:6,chipDamage:0,startup:64,active:68,recovery:118,hitStun:182,blockStun:102,hitStop:48,knockback:{x:116,y:0},blockKnockback:34,hitbox:{offsetX:58,offsetY:-116,width:112,height:44},cancelAt:118,cancelInto:['light','heavy'],shake:2},
    heavy:{key:'heavy',label:'Punho de Assinatura',damage:14,chipDamage:1,startup:172,active:94,recovery:252,hitStun:294,blockStun:164,hitStop:86,knockback:{x:258,y:270},blockKnockback:76,hitbox:{offsetX:66,offsetY:-110,width:158,height:60},cancelAt:9999,cancelInto:[],shake:6},
    crouchLight:{key:'crouchLight',label:'Base Quebrada',damage:5,chipDamage:0,startup:80,active:76,recovery:148,hitStun:174,blockStun:98,hitStop:44,knockback:{x:96,y:0},blockKnockback:29,hitbox:{offsetX:50,offsetY:-52,width:126,height:38},cancelAt:142,cancelInto:['heavy'],shake:2},
    airLight:{key:'airLight',label:'Joelho Vetorial',damage:8,chipDamage:0,startup:78,active:108,recovery:122,hitStun:204,blockStun:110,hitStop:55,knockback:{x:138,y:48},blockKnockback:40,hitbox:{offsetX:56,offsetY:-104,width:128,height:62},cancelAt:9999,cancelInto:[],shake:3}
  }
};
