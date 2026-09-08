import type { FighterSpriteDefinition, SpriteClipDefinition } from '../types/game.js';

// Local-first assets. Immutable mirrors are retained only as a graceful fallback.
const GH_MH='https://raw.githubusercontent.com/RudraO2/tokenbrawl/bce006c710ee60e23606da6b4bb2913d8c0d3609/apps/web/public/sprites/martial-hero';
const GH_MH2='https://raw.githubusercontent.com/RudraO2/tokenbrawl/bce006c710ee60e23606da6b4bb2913d8c0d3609/apps/web/public/sprites/martial-hero-2';
const GH_VLEE='https://raw.githubusercontent.com/vlee489/AC31009-Client/71252f38c7bf4426ff84676cad517f66c3e6cb65/assets/Sprites';
const GH_MH3='https://raw.githubusercontent.com/tomas-trls/javascript-game-challenge/ffd9439e5c246d58389c2b1adad4b231470174e7/assets/Martial%20Hero%203/Sprite';
const LOCAL='/assets/fighters';

type AssetUrl={url:string;fallbackUrl:string};
const u=(folder:string,remote:string,file:string):AssetUrl=>({url:`${LOCAL}/${folder}/${file}`,fallbackUrl:`${remote}/${file}`});
const h=(asset:AssetUrl,frames:number,fps=10,w=200,height=200):SpriteClipDefinition=>({...asset,frameWidth:w,frameHeight:height,frames,fps});
const v=(asset:AssetUrl,frames:number,fps=10,w=137,height=44):SpriteClipDefinition=>({...asset,frameWidth:w,frameHeight:height,frames,fps,orientation:'vertical'});
const local=(folder:string,file:string,frames:number,fps:number,w=1024,height=768):SpriteClipDefinition=>({url:`${LOCAL}/${folder}/${file}`,frameWidth:w,frameHeight:height,frames,fps});

export const martialHeroSprite:FighterSpriteDefinition={packName:'Martial Hero',author:'LuizMelo',sourceUrl:'https://luizmelo.itch.io/martial-hero',license:'CC0 1.0',anchorY:120,scale:3.65,clips:{
  idle:h(u('martial-hero',GH_MH,'idle.png'),8,9),walk:h(u('martial-hero',GH_MH,'run.png'),8,13),jump:h(u('martial-hero',GH_MH,'jump.png'),2,8),fall:h(u('martial-hero',GH_MH,'fall.png'),2,8),block:h(u('martial-hero',GH_MH,'fall.png'),2,5),
  lightA:h(u('martial-hero',GH_MH,'attack1.png'),6,16),lightB:h(u('martial-hero',GH_MH,'attack2.png'),6,16),heavyA:h(u('martial-hero',GH_MH,'attack2.png'),6,13),heavyB:h(u('martial-hero',GH_MH,'attack1.png'),6,13),hit:h(u('martial-hero',GH_MH,'take-hit.png'),4,13),ko:h(u('martial-hero',GH_MH,'death.png'),6,8)
}};

export const martialHero2Sprite:FighterSpriteDefinition={packName:'Martial Hero 2',author:'LuizMelo',sourceUrl:'https://luizmelo.itch.io/martial-hero-2',license:'CC0 1.0',anchorY:124,scale:3.7,clips:{
  idle:h(u('martial-hero-2',GH_MH2,'idle.png'),4,8),walk:h(u('martial-hero-2',GH_MH2,'run.png'),8,13),jump:h(u('martial-hero-2',GH_MH2,'jump.png'),2,8),fall:h(u('martial-hero-2',GH_MH2,'fall.png'),2,8),block:h(u('martial-hero-2',GH_MH2,'fall.png'),2,5),
  lightA:h(u('martial-hero-2',GH_MH2,'attack1.png'),4,15),lightB:h(u('martial-hero-2',GH_MH2,'attack2.png'),4,15),heavyA:h(u('martial-hero-2',GH_MH2,'attack2.png'),4,12),heavyB:h(u('martial-hero-2',GH_MH2,'attack1.png'),4,12),hit:h(u('martial-hero-2',GH_MH2,'take-hit.png'),3,12),ko:h(u('martial-hero-2',GH_MH2,'death.png'),7,8)
}};

export const martialHero3Sprite:FighterSpriteDefinition={packName:'Martial Hero 3',author:'LuizMelo',sourceUrl:'https://luizmelo.itch.io/martial-hero-3',license:'CC0 1.0',anchorY:78,scale:4.05,clips:{
  idle:h(u('martial-hero-3',GH_MH3,'Idle.png'),10,9,126,126),walk:h(u('martial-hero-3',GH_MH3,'Run.png'),8,13,126,126),jump:h(u('martial-hero-3',GH_MH3,'Going%20Up.png'),3,9,126,126),fall:h(u('martial-hero-3',GH_MH3,'Going%20Down.png'),3,9,126,126),block:h(u('martial-hero-3',GH_MH3,'Idle.png'),10,5,126,126),
  lightA:h(u('martial-hero-3',GH_MH3,'Attack1.png'),7,16,126,126),lightB:h(u('martial-hero-3',GH_MH3,'Attack2.png'),5,15,126,126),heavyA:h(u('martial-hero-3',GH_MH3,'Attack3.png'),6,12,126,126),heavyB:h(u('martial-hero-3',GH_MH3,'Attack2.png'),5,12,126,126),hit:h(u('martial-hero-3',GH_MH3,'Take%20Hit.png'),3,12,126,126),ko:h(u('martial-hero-3',GH_MH3,'Death.png'),7,8,126,126)
}};

export const heroKnightSprite:FighterSpriteDefinition={packName:'Hero Knight',author:'LuizMelo',sourceUrl:'https://luizmelo.itch.io/hero-knight',license:'CC0 1.0',anchorY:108,scale:3.12,clips:{
  idle:h(u('hero-knight',`${GH_VLEE}/HeroKnight`,'Idle.png'),11,9,180,180),walk:h(u('hero-knight',`${GH_VLEE}/HeroKnight`,'Run.png'),8,13,180,180),jump:h(u('hero-knight',`${GH_VLEE}/HeroKnight`,'Jump.png'),3,8,180,180),fall:h(u('hero-knight',`${GH_VLEE}/HeroKnight`,'Fall.png'),3,8,180,180),block:h(u('hero-knight',`${GH_VLEE}/HeroKnight`,'Fall.png'),3,5,180,180),
  lightA:h(u('hero-knight',`${GH_VLEE}/HeroKnight`,'Attack1.png'),7,16,180,180),lightB:h(u('hero-knight',`${GH_VLEE}/HeroKnight`,'Attack2.png'),7,16,180,180),heavyA:h(u('hero-knight',`${GH_VLEE}/HeroKnight`,'Attack2.png'),7,12,180,180),heavyB:h(u('hero-knight',`${GH_VLEE}/HeroKnight`,'Attack1.png'),7,12,180,180),hit:h(u('hero-knight',`${GH_VLEE}/HeroKnight`,'Take%20Hit.png'),4,12,180,180),ko:h(u('hero-knight',`${GH_VLEE}/HeroKnight`,'Death.png'),11,8,180,180)
}};

export const wizardSprite:FighterSpriteDefinition={packName:'Wizard Pack',author:'LuizMelo',sourceUrl:'https://luizmelo.itch.io/wizard-pack',license:'CC0 1.0',anchorY:139,scale:3.35,clips:{
  idle:h(u('wizard-pack',`${GH_VLEE}/WizardPack`,'Idle.png'),4,8,190,190),walk:h(u('wizard-pack',`${GH_VLEE}/WizardPack`,'Run.png'),8,12,190,190),jump:h(u('wizard-pack',`${GH_VLEE}/WizardPack`,'Jump.png'),2,8,190,190),fall:h(u('wizard-pack',`${GH_VLEE}/WizardPack`,'Fall.png'),2,8,190,190),block:h(u('wizard-pack',`${GH_VLEE}/WizardPack`,'Fall.png'),2,5,190,190),
  lightA:h(u('wizard-pack',`${GH_VLEE}/WizardPack`,'Attack1.png'),8,16,190,190),lightB:h(u('wizard-pack',`${GH_VLEE}/WizardPack`,'Attack2.png'),8,16,190,190),heavyA:h(u('wizard-pack',`${GH_VLEE}/WizardPack`,'Attack2.png'),8,12,190,190),heavyB:h(u('wizard-pack',`${GH_VLEE}/WizardPack`,'Attack1.png'),8,12,190,190),hit:h(u('wizard-pack',`${GH_VLEE}/WizardPack`,'Hit.png'),4,12,190,190),ko:h(u('wizard-pack',`${GH_VLEE}/WizardPack`,'Death.png'),7,8,190,190)
}};

export const spiritBoxerSprite:FighterSpriteDefinition={packName:'Spirit Boxer',author:'Penusbmic',sourceUrl:'https://penusbmic.itch.io/characterpack1',license:'Free game-use pack; attribution/provenance documented in ASSETS.md',anchorY:43,scale:6.0,clips:{
  idle:v(u('spirit-boxer',`${GH_VLEE}/SpiritBoxer`,'Idle.png'),4,8),walk:v(u('spirit-boxer',`${GH_VLEE}/SpiritBoxer`,'Run.png'),6,12),jump:v(u('spirit-boxer',`${GH_VLEE}/SpiritBoxer`,'Idle.png'),4,6),fall:v(u('spirit-boxer',`${GH_VLEE}/SpiritBoxer`,'Idle.png'),4,6),block:v(u('spirit-boxer',`${GH_VLEE}/SpiritBoxer`,'Idle.png'),4,5),
  lightA:v(u('spirit-boxer',`${GH_VLEE}/SpiritBoxer`,'attack%201.png'),6,16),lightB:v(u('spirit-boxer',`${GH_VLEE}/SpiritBoxer`,'attack%203.png'),10,17),heavyA:v(u('spirit-boxer',`${GH_VLEE}/SpiritBoxer`,'attack%202.png'),13,16),heavyB:v(u('spirit-boxer',`${GH_VLEE}/SpiritBoxer`,'attack%203.png'),10,14),hit:v(u('spirit-boxer',`${GH_VLEE}/SpiritBoxer`,'Damaged%20%26%20Death.png'),4,12),ko:{...v(u('spirit-boxer',`${GH_VLEE}/SpiritBoxer`,'Damaged%20%26%20Death.png'),10,8),startFrame:0}
}};

export const marceloSprite:FighterSpriteDefinition={packName:'Marcelo Fighter',author:'MarceloMatheus',sourceUrl:'marcelo-fighter-assets-ready/',license:'Asset fornecido para uso neste projeto',anchorY:744,scale:.25,clips:{
  portrait:local('marcelo','portrait.png',1,1,1024,1024),
  idle:local('marcelo','idle.png',4,8),walk:local('marcelo','walk.png',6,12),jump:local('marcelo','jump.png',3,10),fall:local('marcelo','fall.png',3,10),block:local('marcelo','block.png',2,8),
  lightA:local('marcelo','light-a.png',3,15),lightB:local('marcelo','light-b.png',3,15),heavyA:local('marcelo','heavy-a.png',4,12),heavyB:local('marcelo','heavy-a.png',4,12),hit:local('marcelo','hit.png',2,10),ko:local('marcelo','ko.png',3,8),victory:local('marcelo','victory.png',4,8)
}};

export const tinted=(base:FighterSpriteDefinition,filter:string):FighterSpriteDefinition=>({...base,tintFilter:filter});
export const tuned=(base:FighterSpriteDefinition,patch:Partial<Pick<FighterSpriteDefinition,'scale'|'anchorY'|'packName'|'sourceUrl'|'license'|'tintFilter'>>):FighterSpriteDefinition=>({...base,...patch});
