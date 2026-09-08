import assert from 'node:assert/strict';

class Storage { #m=new Map(); getItem(k){return this.#m.get(k)??null;} setItem(k,v){this.#m.set(k,String(v));} removeItem(k){this.#m.delete(k);} }
const listeners=new Map();
const noop=()=>{};
const ctxTarget={canvas:null,imageSmoothingEnabled:false,measureText:(s)=>({width:String(s).length*8}),createLinearGradient:()=>({addColorStop:noop}),createRadialGradient:()=>({addColorStop:noop})};
const context=new Proxy(ctxTarget,{get(t,p){if(p in t)return t[p];return noop;},set(t,p,v){t[p]=v;return true;}});
class FakeCanvas {
  width=1280;height=720;tabIndex=0;style={};
  getContext(type){return type==='2d'?context:null;}
  addEventListener(type,fn){const a=listeners.get(type)??[];a.push(fn);listeners.set(type,a);}
  removeEventListener(){} focus(){} requestFullscreen(){return Promise.resolve();}
  getBoundingClientRect(){return{left:0,top:0,width:1280,height:720,right:1280,bottom:720,x:0,y:0,toJSON(){}};}
}
const canvas=new FakeCanvas();context.canvas=canvas;
let fullscreenRequests=0;let fullscreenOptions=null;let orientationLocks=0;
class FakeElement {
  handlers=new Map();classList={add:noop};
  addEventListener(type,fn){this.handlers.set(type,fn);}
  requestFullscreen(options){fullscreenRequests++;fullscreenOptions=options;return Promise.resolve();}
  click(){return this.handlers.get('click')?.({});}
}
const gameShell=new FakeElement();const fullscreenButton=new FakeElement();
globalThis.HTMLCanvasElement=FakeCanvas;
globalThis.CanvasRenderingContext2D=class {};
globalThis.localStorage=new Storage();
globalThis.location={protocol:'http:',host:'127.0.0.1:4173'};
globalThis.document={getElementById:(id)=>id==='game'?canvas:id==='game-shell'?gameShell:id==='mobile-fullscreen'?fullscreenButton:null,documentElement:{style:{setProperty:noop}},fullscreenElement:null,exitFullscreen:()=>Promise.resolve(),addEventListener:noop};
globalThis.window=globalThis;
globalThis.innerWidth=1280;globalThis.innerHeight=720;globalThis.screen={orientation:{lock:()=>{orientationLocks++;return Promise.resolve();},unlock:noop}};
globalThis.addEventListener=(type,fn)=>{const a=listeners.get(type)??[];a.push(fn);listeners.set(type,a);};
globalThis.removeEventListener=noop;
globalThis.setInterval=()=>1;globalThis.clearInterval=noop;globalThis.setTimeout=()=>1;globalThis.clearTimeout=noop;
let scheduled=null;globalThis.requestAnimationFrame=(cb)=>{scheduled=cb;return 1;};globalThis.cancelAnimationFrame=noop;
// Asset loading is intentionally asynchronous/failable; boot must not depend on it.
globalThis.Image=class {set src(_v){queueMicrotask(()=>this.onerror?.());} crossOrigin='';};

await import('../dist/src/main.js');
assert.equal(globalThis.__FINAL_BELL_DEBUG__?.scene,'menu','application should boot into the main menu');
await fullscreenButton.click();
assert.equal(fullscreenRequests,1,'mobile fullscreen button should request fullscreen on the game shell');
assert.equal(fullscreenOptions?.navigationUI,'hide','mobile fullscreen should ask the browser to hide navigation UI');
assert.equal(orientationLocks,1,'mobile fullscreen should request landscape orientation');
assert.equal(typeof scheduled,'function','game loop should schedule a frame');
const frame=scheduled;scheduled=null;frame(performance.now()+20);
assert.ok(scheduled,'rendered frame should schedule the next frame');
assert.equal(canvas.width,1280);assert.equal(canvas.height,720);

const {OnlineEntryScene}=await import('../dist/src/scenes/OnlineEntryScene.js');
let createdRooms=0;
const textInput={wasPressed:(code)=>code==='KeyC'};
const textAudio={startMusic:noop,unlock:()=>Promise.resolve()};
const textNetwork={playerName:'ANA',on:()=>noop,connect:noop,createRoom:()=>{createdRooms++;}};
const entry=new OnlineEntryScene('versus',textInput,textAudio,textNetwork,noop,noop,canvas);
entry.onTextKey({key:'C',ctrlKey:false,metaKey:false,altKey:false,preventDefault:noop});
entry.update(1/60);
assert.equal(entry.name,'ANAC','the C key should be entered in the player name');
assert.equal(createdRooms,0,'typing C must not trigger room creation');
entry.destroy();
console.log('Runtime boot smoke passed: main.ts, canvas init, mobile fullscreen, safe text entry, fixed-step update and one render frame.');
