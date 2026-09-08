import type { AppSettings } from '../types/game.js';
const KEY='final-bell-settings-v3';
const defaults:AppSettings={masterVolume:.72,musicVolume:.62,sfxVolume:.78,screenShake:true,fullscreen:false,resolutionScale:1,controlsPreset:'classic',touchControls:'auto'};
export class SettingsManager{
  private value:AppSettings;
  constructor(){this.value=this.load();}
  get settings():AppSettings{return {...this.value};}
  update(patch:Partial<AppSettings>):void{this.value={...this.value,...patch};this.save();}
  reset():void{this.value={...defaults};this.save();}
  private load():AppSettings{try{if(typeof localStorage==='undefined')return{...defaults};const raw=localStorage.getItem(KEY);return raw?{...defaults,...JSON.parse(raw) as Partial<AppSettings>}:{...defaults};}catch{return{...defaults};}}
  private save():void{try{if(typeof localStorage!=='undefined')localStorage.setItem(KEY,JSON.stringify(this.value));}catch{/* private mode */}}
}
