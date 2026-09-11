import { FIXED_FPS, GAME_HEIGHT, GAME_WIDTH } from './config/gameConfig.js';
import { GameLoop, init } from './vendor/kontra.js';
import { InputManager } from './systems/InputManager.js';
import { AudioManager } from './systems/AudioManager.js';
import { SettingsManager } from './systems/SettingsManager.js';
import { MainMenuScene } from './scenes/MainMenuScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { CharacterSelectScene } from './scenes/CharacterSelectScene.js';
import { FightScene } from './scenes/FightScene.js';
import { SettingsScene } from './scenes/SettingsScene.js';
import { OnlineEntryScene } from './scenes/OnlineEntryScene.js';
import { OnlineLobbyScene } from './scenes/OnlineLobbyScene.js';
import { NetworkClient } from './network/NetworkClient.js';
import { NetworkInputSource } from './network/NetworkInputSource.js';
import { getFighter, withSkin } from './characters/roster.js';
import { getControlPair } from './config/controls.js';
import type { Scene } from './scenes/Scene.js';
import type { DebugSnapshot, FighterDefinition, FighterLoadout, MatchSettings } from './types/game.js';
import type { MatchStartPayload, RoomMode } from './network/protocol.js';

declare global { interface Window { __FINAL_BELL_DEBUG__?: DebugSnapshot; } }

const {canvas,context}=init('game');
const gameShell=document.getElementById('game-shell');const fullscreenButton=document.getElementById('mobile-fullscreen');
type MobileFullscreenElement=HTMLElement&{webkitRequestFullscreen?:()=>void};
type MobileOrientation=ScreenOrientation&{lock?:(orientation:'landscape')=>Promise<void>};
const syncGameBounds=():void=>{const viewport=window.visualViewport;const viewportWidth=viewport?.width??window.innerWidth;const viewportHeight=viewport?.height??window.innerHeight;let horizontalPadding=0,verticalPadding=0;if(gameShell&&typeof getComputedStyle==='function'){const style=getComputedStyle(gameShell);horizontalPadding=(Number.parseFloat(style.paddingLeft)||0)+(Number.parseFloat(style.paddingRight)||0);verticalPadding=(Number.parseFloat(style.paddingTop)||0)+(Number.parseFloat(style.paddingBottom)||0);}const availableWidth=Math.max(1,viewportWidth-horizontalPadding);const availableHeight=Math.max(1,viewportHeight-verticalPadding);const width=Math.min(availableWidth,availableHeight*(GAME_WIDTH/GAME_HEIGHT));const height=width*(GAME_HEIGHT/GAME_WIDTH);document.documentElement.style.setProperty('--game-fit-width',`${Math.floor(width)}px`);document.documentElement.style.setProperty('--game-fit-height',`${Math.floor(height)}px`);};
const lockLandscape=async():Promise<void>=>{const orientation=screen.orientation as MobileOrientation|undefined;try{await orientation?.lock?.('landscape');}catch{/* O navegador pode bloquear o lock; o jogo continua contido. */}};
const enterMobileFullscreen=async():Promise<void>=>{if(!gameShell)return;const target=gameShell as MobileFullscreenElement;try{if(gameShell.requestFullscreen){await gameShell.requestFullscreen({navigationUI:'hide'});await lockLandscape();}else if(target.webkitRequestFullscreen){target.webkitRequestFullscreen();}else{gameShell.classList.add('mobile-expanded');window.scrollTo?.(0,1);}}catch{gameShell.classList.add('mobile-expanded');window.scrollTo?.(0,1);}requestAnimationFrame(syncGameBounds);};
fullscreenButton?.addEventListener('click',()=>void enterMobileFullscreen());
const onViewportChange=():void=>{requestAnimationFrame(syncGameBounds);};
window.addEventListener('resize',onViewportChange);window.addEventListener('orientationchange',onViewportChange);window.visualViewport?.addEventListener('resize',onViewportChange);document.addEventListener('fullscreenchange',onViewportChange);document.addEventListener('webkitfullscreenchange',onViewportChange as EventListener);syncGameBounds();
const input=new InputManager(canvas);
const audio=new AudioManager();
const settingsManager=new SettingsManager();
const network=new NetworkClient();
audio.setSettings(settingsManager.settings);
let scene:Scene;
let renderScale=settingsManager.settings.resolutionScale;
const applyCanvasSettings=():void=>{renderScale=settingsManager.settings.resolutionScale;canvas.width=Math.round(GAME_WIDTH*renderScale);canvas.height=Math.round(GAME_HEIGHT*renderScale);context.imageSmoothingEnabled=false;};
applyCanvasSettings();
let lastOnlineMode:RoomMode='versus';

const setScene=(next:Scene):void=>{scene?.destroy?.();scene=next;};
const touchControlsEnabled=():boolean=>{const setting=settingsManager.settings.touchControls;if(setting==='on')return true;if(setting==='off')return false;return Boolean(window.matchMedia?.('(pointer: coarse), (hover: none)').matches||navigator.maxTouchPoints>0||'ontouchstart'in window);};
const showHome=():void=>{audio.setSettings(settingsManager.settings);applyCanvasSettings();setScene(new MainMenuScene(input,audio,canvas,{local:showLocalSetup,online:()=>showOnlineEntry('versus'),tournament:()=>showOnlineEntry('tournament'),settings:showSettings}));window.__FINAL_BELL_DEBUG__={scene:'menu'};};
const showSettings=():void=>setScene(new SettingsScene(input,audio,settingsManager,showHome,canvas));
const showLocalSetup=():void=>setScene(new MenuScene(input,audio,showLocalSelect,canvas,showHome));
const showLocalSelect=(matchSettings:MatchSettings):void=>setScene(new CharacterSelectScene(input,audio,(fighters)=>showLocalFight(matchSettings,fighters),showLocalSetup,canvas));
const showLocalFight=(matchSettings:MatchSettings,loadouts:[FighterLoadout,FighterLoadout]):void=>{const fighters:[FighterDefinition,FighterDefinition]=[withSkin(getFighter(loadouts[0].fighterId,0),loadouts[0].skinId),withSkin(getFighter(loadouts[1].fighterId,1),loadouts[1].skinId)];audio.setSettings(settingsManager.settings);const controls=getControlPair(settingsManager.settings.controlsPreset);setScene(new FightScene(input,audio,showHome,canvas,{...matchSettings,mode:'local'},fighters,input,undefined,settingsManager.settings.screenShake,undefined,undefined,controls,touchControlsEnabled()));};
const showOnlineEntry=(mode:RoomMode):void=>{lastOnlineMode=mode;if(network.room){showLobby();return;}setScene(new OnlineEntryScene(mode,input,audio,network,showLobby,showHome,canvas));};
const showLobby=():void=>{if(!network.room){showOnlineEntry(lastOnlineMode);return;}lastOnlineMode=network.room.mode;setScene(new OnlineLobbyScene(input,audio,network,startOnlineMatch,showHome,canvas));};
const requestOnlineRematch=(roomCode:string):void=>{showLobby();const current=network.room;if(current?.code===roomCode&&!current.players.some(p=>p.status==='IN MATCH')){network.setReady(true);return;}let off=()=>{};off=network.on('room',room=>{if(room.code!==roomCode){off();return;}if(room.players.some(p=>p.status==='IN MATCH'))return;off();network.setReady(true);});};
const exitOnlineMatch=():void=>{network.leaveRoom();showHome();};
const startOnlineMatch=(match:MatchStartPayload):void=>{const side=match.p1Session===network.sessionId?1:2;const defs:[FighterDefinition,FighterDefinition]=[withSkin(getFighter(match.fighterIds[0],0),match.skinIds?.[0]??'default'),withSkin(getFighter(match.fighterIds[1],1),match.skinIds?.[1]??'default')];const controls=getControlPair(settingsManager.settings.controlsPreset);const onlineInput=new NetworkInputSource(input,network,match.matchId,side,match.netcode,controls[0],controls);audio.setSettings(settingsManager.settings);setScene(new FightScene(input,audio,showLobby,canvas,{...match.settings,mode:'online'},defs,onlineInput,undefined,settingsManager.settings.screenShake,undefined,()=>requestOnlineRematch(match.roomCode),controls,touchControlsEnabled(),exitOnlineMatch));};
showHome();

const loop=GameLoop({fps:FIXED_FPS,context,update:(dt)=>{scene.update(dt);input.endFrame();},render:()=>{context.setTransform(renderScale,0,0,renderScale,0,0);scene.render(context);context.setTransform(1,0,0,1,0,0);}});
loop.start();canvas.focus();
