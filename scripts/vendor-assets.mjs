import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'public/assets/fighters');
const packs=[
  ['martial-hero','https://raw.githubusercontent.com/RudraO2/tokenbrawl/bce006c710ee60e23606da6b4bb2913d8c0d3609/apps/web/public/sprites/martial-hero',['idle.png','run.png','jump.png','fall.png','attack1.png','attack2.png','take-hit.png','death.png']],
  ['martial-hero-2','https://raw.githubusercontent.com/RudraO2/tokenbrawl/bce006c710ee60e23606da6b4bb2913d8c0d3609/apps/web/public/sprites/martial-hero-2',['idle.png','run.png','jump.png','fall.png','attack1.png','attack2.png','take-hit.png','death.png']],
  ['martial-hero-3','https://raw.githubusercontent.com/tomas-trls/javascript-game-challenge/ffd9439e5c246d58389c2b1adad4b231470174e7/assets/Martial%20Hero%203/Sprite',['Idle.png','Run.png','Going%20Up.png','Going%20Down.png','Attack1.png','Attack2.png','Attack3.png','Take%20Hit.png','Death.png']],
  ['hero-knight','https://raw.githubusercontent.com/vlee489/AC31009-Client/71252f38c7bf4426ff84676cad517f66c3e6cb65/assets/Sprites/HeroKnight',['Idle.png','Run.png','Jump.png','Fall.png','Attack1.png','Attack2.png','Take%20Hit.png','Death.png']],
  ['wizard-pack','https://raw.githubusercontent.com/vlee489/AC31009-Client/71252f38c7bf4426ff84676cad517f66c3e6cb65/assets/Sprites/WizardPack',['Idle.png','Run.png','Jump.png','Fall.png','Attack1.png','Attack2.png','Hit.png','Death.png']],
  ['spirit-boxer','https://raw.githubusercontent.com/vlee489/AC31009-Client/71252f38c7bf4426ff84676cad517f66c3e6cb65/assets/Sprites/SpiritBoxer',['Idle.png','Run.png','attack%201.png','attack%202.png','attack%203.png','Damaged%20%26%20Death.png']],
];
let count=0;
for(const [folder,base,files] of packs){
  const dir=path.join(out,folder);await fs.mkdir(dir,{recursive:true});
  for(const encoded of files){
    const url=`${base}/${encoded}`;const res=await fetch(url,{redirect:'follow'});
    if(!res.ok)throw new Error(`Failed ${res.status} ${url}`);
    const buf=Buffer.from(await res.arrayBuffer());
    if(buf.length<100||buf[0]!==0x89||buf[1]!==0x50||buf[2]!==0x4e||buf[3]!==0x47)throw new Error(`Invalid PNG ${url}`);
    await fs.writeFile(path.join(dir,decodeURIComponent(encoded)),buf);count++;
    console.log(`vendored ${folder}/${decodeURIComponent(encoded)} (${buf.length} bytes)`);
  }
}
console.log(`Vendored ${count} fighter sprite sheets into public/assets/fighters.`);
