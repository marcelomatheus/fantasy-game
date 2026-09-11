import type { MatchSettings } from '../types/game.js';
import type { AuthoritativeStatePayload,ClientMessage, MatchStartPayload, RoomMode, RoomState, ServerMessage } from './protocol.js';

type EventMap={
  status:string; room:RoomState; match:MatchStartPayload; input:{matchId:string;frame:number;bits:number;fromSession:string}; state:AuthoritativeStatePayload;matchPaused:{matchId:string};matchResumed:{matchId:string;startAt:number};matchEnded:{matchId:string;winnerSession:string}; tournamentComplete:{championSession:string}; notice:string; error:string;
};
type Listener<K extends keyof EventMap>=(payload:EventMap[K])=>void;
const SESSION_KEY='final-bell-online-session';
const NAME_KEY='final-bell-online-name';
const RESUME_TOKEN_KEY='final-bell-online-resume-token';

export class NetworkClient {
  private socket:WebSocket|null=null;
  private listeners=new Map<keyof EventMap,Set<(payload:unknown)=>void>>();
  private reconnectTimer:number|null=null;
  private reconnectAttempts=0;
  private closedByUser=false;
  private pingTimer:number|null=null;
  private roomState:RoomState|null=null;
  readonly sessionId:string;
  playerName:string;
  ping=0;
  jitter=0;
  droppedInputs=0;
  private serverClockOffset=0;
  private resumeToken='';

  constructor(){
    this.sessionId=this.loadSession();
    this.playerName=this.loadName();
    this.resumeToken=this.loadResumeToken();
  }
  get room():RoomState|null{return this.roomState;}
  get connected():boolean{return this.socket?.readyState===WebSocket.OPEN;}
  get bufferedAmount():number{return this.socket?.bufferedAmount??0;}
  serverTimeNow():number{return Date.now()+this.serverClockOffset;}
  on<K extends keyof EventMap>(event:K,listener:Listener<K>):()=>void{let set=this.listeners.get(event);if(!set){set=new Set();this.listeners.set(event,set);}const wrapped=(payload:unknown):void=>listener(payload as EventMap[K]);set.add(wrapped);return()=>set?.delete(wrapped);}
  private emit<K extends keyof EventMap>(event:K,payload:EventMap[K]):void{this.listeners.get(event)?.forEach(fn=>fn(payload));}
  connect(name=this.playerName):void{
    this.playerName=(name.trim()||'Player').slice(0,18);this.saveName();this.closedByUser=false;
    if(this.socket&&(this.socket.readyState===WebSocket.OPEN||this.socket.readyState===WebSocket.CONNECTING))return;
    this.emit('status','Conectando…');
    const protocol=location.protocol==='https:'?'wss:':'ws:';const url=`${protocol}//${location.host}/ws`;
    try{const ws=new WebSocket(url);this.socket=ws;
      ws.onopen=()=>{this.reconnectAttempts=0;this.emit('status','Online');this.send({type:'hello',protocolVersion:2,sessionId:this.sessionId,name:this.playerName,resumeToken:this.resumeToken||undefined});this.startPing();};
      ws.onmessage=e=>this.handleMessage(String(e.data));
      ws.onerror=()=>this.emit('status','Erro de conexão');
      ws.onclose=()=>{this.stopPing();this.emit('status','Desconectado');if(!this.closedByUser)this.scheduleReconnect();};
    }catch{this.emit('status','Servidor indisponível');this.scheduleReconnect();}
  }
  disconnect():void{this.closedByUser=true;this.stopPing();if(this.reconnectTimer!==null)window.clearTimeout(this.reconnectTimer);this.reconnectTimer=null;this.socket?.close();this.socket=null;}
  createRoom(mode:RoomMode,settings:MatchSettings,tournamentName?:string,maxPlayers?:4|8):void{this.send({type:'createRoom',mode,settings,tournamentName,maxPlayers});}
  joinRoom(code:string):void{this.send({type:'joinRoom',code:code.trim().toUpperCase()});}
  leaveRoom():void{this.send({type:'leaveRoom'});this.roomState=null;}
  selectFighter(fighterId:string):void{this.send({type:'selectFighter',fighterId});}
  selectSkin(skinId:string):void{this.send({type:'selectSkin',skinId});}
  setReady(ready:boolean):void{this.send({type:'ready',ready});}
  startTournament():void{this.send({type:'startTournament'});}
  sendInput(matchId:string,frame:number,bits:number):void{if(this.bufferedAmount>131_072){this.droppedInputs++;return;}this.send({type:'input',matchId,frame,bits});}
  reportMatch(matchId:string,winner:1|2):void{this.send({type:'matchResult',matchId,winner});}
  private send(message:ClientMessage):void{if(this.socket?.readyState===WebSocket.OPEN)this.socket.send(JSON.stringify(message));else this.emit('error','Sem conexão com o servidor.');}
  private handleMessage(raw:string):void{let msg:ServerMessage;try{msg=JSON.parse(raw) as ServerMessage;}catch{return;}
    if(msg.type==='welcome'){this.resumeToken=msg.resumeToken;this.saveResumeToken();if(msg.room){this.roomState=msg.room;this.emit('room',msg.room);}return;}
    if(msg.type==='roomState'){this.roomState=msg.room;this.emit('room',msg.room);return;}
    if(msg.type==='matchStart'){this.emit('match',msg.match);return;}
    if(msg.type==='remoteInput'){this.emit('input',{matchId:msg.matchId,frame:msg.frame,bits:msg.bits,fromSession:msg.fromSession});return;}
    if(msg.type==='stateSnapshot'){this.emit('state',msg);return;}
    if(msg.type==='matchPaused'){this.emit('matchPaused',msg);return;}
    if(msg.type==='matchResumed'){this.emit('matchResumed',msg);return;}
    if(msg.type==='matchEnded'){this.emit('matchEnded',{matchId:msg.matchId,winnerSession:msg.winnerSession});return;}
    if(msg.type==='tournamentComplete'){this.emit('tournamentComplete',{championSession:msg.championSession});return;}
    if(msg.type==='notice'){this.emit('notice',msg.message);return;}
    if(msg.type==='error'){this.emit('error',msg.message);return;}
    if(msg.type==='pong'){const previous=this.ping;this.ping=Math.max(0,Math.round(performance.now()-msg.sentAt));this.jitter=previous?Math.round(this.jitter*.75+Math.abs(this.ping-previous)*.25):0;this.serverClockOffset=msg.serverTime-(Date.now()-this.ping/2);this.send({type:'pingReport',ping:this.ping,jitter:this.jitter});}
  }
  private scheduleReconnect():void{if(this.reconnectTimer!==null)return;const delay=Math.min(8000,750*Math.pow(1.7,this.reconnectAttempts++));this.emit('status',`Reconectando…`);this.reconnectTimer=window.setTimeout(()=>{this.reconnectTimer=null;this.connect(this.playerName);},delay);}
  private startPing():void{this.stopPing();const ping=()=>{if(this.connected)this.send({type:'ping',sentAt:performance.now(),clientTime:Date.now()});};ping();this.pingTimer=window.setInterval(ping,2000);}
  private stopPing():void{if(this.pingTimer!==null)window.clearInterval(this.pingTimer);this.pingTimer=null;}
  private loadSession():string{try{const existing=localStorage.getItem(SESSION_KEY);if(existing)return existing;}catch{/* ignore */}const value=crypto.randomUUID?.()??`${Date.now()}-${Math.random()}`;try{localStorage.setItem(SESSION_KEY,value);}catch{/* ignore */}return value;}
  private loadName():string{try{return localStorage.getItem(NAME_KEY)||`Player${Math.floor(Math.random()*900+100)}`;}catch{return'Player';}}
  private saveName():void{try{localStorage.setItem(NAME_KEY,this.playerName);}catch{/* ignore */}}
  private loadResumeToken():string{try{return localStorage.getItem(RESUME_TOKEN_KEY)||'';}catch{return'';}}
  private saveResumeToken():void{try{localStorage.setItem(RESUME_TOKEN_KEY,this.resumeToken);}catch{/* ignore */}}
}
