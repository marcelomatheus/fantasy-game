import fs from 'node:fs';import path from 'node:path';import { spawnSync } from 'node:child_process';import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');const dist=path.join(root,'dist');fs.rmSync(dist,{recursive:true,force:true});fs.mkdirSync(dist,{recursive:true});
for(const file of ['index.html','styles.css'])fs.copyFileSync(path.join(root,file),path.join(dist,file));
const publicDir=path.join(root,'public');if(fs.existsSync(publicDir))fs.cpSync(publicDir,dist,{recursive:true});
const tsc=path.join(root,'vendor/typescript/lib/tsc.js');const result=spawnSync(process.execPath,[tsc,'-p',path.join(root,'tsconfig.json')],{cwd:root,stdio:'inherit'});if(result.status!==0)process.exit(result.status??1);

// Cada build recebe URLs novas. Isso evita que o navegador misture módulos antigos e novos.
const buildVersion=Date.now().toString(36);
const visit=(dir)=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const target=path.join(dir,entry.name);if(entry.isDirectory())visit(target);else if(entry.name.endsWith('.js')){const source=fs.readFileSync(target,'utf8');const versioned=source.replace(/((?:from\s+|import\s*\()(['"])(?:\.\.?\/)[^'"]+\.js)(\2)/g,`$1?v=${buildVersion}$3`);fs.writeFileSync(target,versioned);}}};
visit(path.join(dist,'src'));
const indexPath=path.join(dist,'index.html');const html=fs.readFileSync(indexPath,'utf8').replace('./styles.css',`./styles.css?v=${buildVersion}`).replace('./src/main.js',`./src/main.js?v=${buildVersion}`);fs.writeFileSync(indexPath,html);
console.log(`Build complete: dist/ (${buildVersion})`);
