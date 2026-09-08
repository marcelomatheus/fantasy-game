import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const required = [
  'README.md', 'ASSETS.md', 'MULTIPLAYER.md', 'THIRD_PARTY_NOTICES.md',
  'package.json', 'package-lock.json', 'index.html',
  'src/main.ts', 'src/scenes/MainMenuScene.ts', 'src/scenes/MenuScene.ts',
  'src/scenes/CharacterSelectScene.ts', 'src/scenes/FightScene.ts',
  'src/scenes/OnlineEntryScene.ts', 'src/scenes/OnlineLobbyScene.ts', 'src/scenes/SettingsScene.ts',
  'src/combat/CombatSystem.ts', 'src/combat/ComboSystem.ts', 'src/config/combatBalance.ts',
  'src/combat/ProjectileSystem.ts', 'src/systems/TouchController.ts', 'src/characters/combatKits.ts',
  'src/characters/Fighter.ts', 'src/characters/SpriteFighterRenderer.ts',
  'src/characters/SpriteAssetManager.ts', 'src/characters/roster.ts', 'src/characters/spriteProfiles.ts',
  'src/network/protocol.ts', 'src/network/NetworkClient.ts', 'src/network/NetworkInputSource.ts',
  'server/multiplayer.mjs', 'scripts/network-smoke.mjs', 'scripts/runtime-smoke.mjs', 'scripts/vendor-assets.mjs',
  'src/stages/StageRenderer.ts', 'src/stages/stageDefinitions.ts',
  'docs/screenshot-menu.png', 'docs/screenshot-fight.png'
];
for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`Missing ${file}`);
}

const run = (script, args = []) => {
  const result = spawnSync(process.execPath, [path.join(root, script), ...args], { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
};

run('vendor/typescript/lib/tsc.js', ['--noEmit']);
run('scripts/build.mjs');

const noAnyFiles = [
  'src/characters/Fighter.ts', 'src/characters/SpriteFighterRenderer.ts',
  'src/combat/CombatSystem.ts', 'src/network/NetworkInputSource.ts', 'src/network/protocol.ts'
];
for (const file of noAnyFiles) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  if (/\bany\b/.test(source)) throw new Error(`Unexpected any in ${file}`);
}
const rosterSrc = fs.readFileSync(path.join(root, 'src/characters/roster.ts'), 'utf8');
if (!rosterSrc.includes('ROSTER:FighterDefinition[]=[fighterA,fighterB,nox,aldric]')) throw new Error('Launch roster is incomplete');
for (const term of ['Armadura firme, avanço implacável.', 'A lâmina controla a distância.']) {
  if (!rosterSrc.includes(term)) throw new Error(`Character presentation missing: ${term}`);
}
const onlineEntrySrc = fs.readFileSync(path.join(root, 'src/scenes/OnlineEntryScene.ts'), 'utf8');
if (onlineEntrySrc.includes("wasPressed('KeyC')") || onlineEntrySrc.includes("wasPressed('KeyJ')")) throw new Error('Typing keys must not trigger online create/join actions');
if (!onlineEntrySrc.includes('if(this.editor)return;')) throw new Error('Online editor must isolate gameplay shortcuts while typing');
const stageSrc = fs.readFileSync(path.join(root, 'src/stages/StageRenderer.ts'), 'utf8');
if (!stageSrc.includes('developerCredit') || stageSrc.includes('developerPlaque')) throw new Error('Author credit must be integrated into each stage');
const mainMenuSrc = fs.readFileSync(path.join(root, 'src/scenes/MainMenuScene.ts'), 'utf8');
if (mainMenuSrc.includes('MARCELOMATHEUS')) throw new Error('Author credit must not remain inside the menu card');
const fightSceneSrc = fs.readFileSync(path.join(root, 'src/scenes/FightScene.ts'), 'utf8');
for (const term of ["'REVANCHE [R]'", "'SAIR [M]'", 'renderMatchOver']) {
  if (!fightSceneSrc.includes(term)) throw new Error(`Post-match action missing: ${term}`);
}
const indexSrc = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
if (!indexSrc.includes('id="mobile-fullscreen"')) throw new Error('Mobile fullscreen control is missing');
if (!indexSrc.includes('viewport-fit=cover')) throw new Error('Mobile viewport must account for display safe areas');
const mainSrc = fs.readFileSync(path.join(root, 'src/main.ts'), 'utf8');
if (!mainSrc.includes("navigationUI:'hide'") || !mainSrc.includes('--game-fit-width')) throw new Error('Contained mobile fullscreen behavior is missing');
const multiplayerDoc = fs.readFileSync(path.join(root, 'MULTIPLAYER.md'), 'utf8');
for (const term of ['rollback', 'reconnect', 'WebSocket', 'Tournament Room', 'input synchronization']) {
  if (!multiplayerDoc.toLowerCase().includes(term.toLowerCase())) throw new Error(`MULTIPLAYER.md missing ${term}`);
}
const assetsDoc = fs.readFileSync(path.join(root, 'ASSETS.md'), 'utf8');
for (const term of ['Martial Hero', 'Martial Hero 2', 'Martial Hero 3', 'Hero Knight']) {
  if (!assetsDoc.includes(term)) throw new Error(`ASSETS.md missing ${term}`);
}
if (!fs.existsSync(path.join(root, 'dist/index.html'))) throw new Error('dist/index.html missing');
run('scripts/smoke.mjs');
run('scripts/runtime-smoke.mjs');
run('scripts/network-smoke.mjs');
console.log('Final Bell v3 validation passed: strict typecheck, build, touch controls, four complete fighter kits, skins, meter/projectiles, runtime, combat and secure multiplayer.');
