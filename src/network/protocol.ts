import type { MatchSettings, MatchSimulationSnapshot, PlayerId } from '../types/game.js';

export type RoomMode='versus'|'tournament';
export type PlayerRoomStatus='WAITING'|'READY'|'IN MATCH'|'DISCONNECTED'|'ELIMINATED'|'CHAMPION';
export interface RoomPlayer { sessionId:string; name:string; fighterId:string; skinId:string; ready:boolean; host:boolean; connected:boolean; ping:number;jitter:number; status:PlayerRoomStatus; }
export interface TournamentMatch { id:string; round:number; slot:number; p1Session:string|null; p2Session:string|null; winnerSession:string|null; status:'pending'|'active'|'complete'; }
export interface TournamentState { name:string; maxPlayers:4|8; started:boolean; championSession:string|null; currentMatchId:string|null; matches:TournamentMatch[]; }
export interface RoomState { code:string; mode:RoomMode; hostSession:string; settings:MatchSettings; players:RoomPlayer[]; tournament?:TournamentState; }
export interface NetcodeConfig { protocolVersion:2;tickRate:60;startAt:number;inputDelayFrames:number;maxRollbackFrames:number;snapshotIntervalFrames:number; }
export interface MatchStartPayload { matchId:string; roomCode:string; p1Session:string; p2Session:string; fighterIds:[string,string]; skinIds:[string,string]; settings:MatchSettings; tournament:boolean;netcode:NetcodeConfig;resume?:boolean; }
export interface AuthoritativeStatePayload {matchId:string;frame:number;confirmedFrame:number;revision:number;acks:[number,number];checksum:string;paused:boolean;metrics:{rollbacks:number;maxRollbackDepth:number;lateInputs:number};state:MatchSimulationSnapshot;}

export type ClientMessage=
  | {type:'hello';protocolVersion:2;sessionId:string;name:string;resumeToken?:string}
  | {type:'createRoom';mode:RoomMode;settings:MatchSettings;tournamentName?:string;maxPlayers?:4|8}
  | {type:'joinRoom';code:string}
  | {type:'leaveRoom'}
  | {type:'selectFighter';fighterId:string}
  | {type:'selectSkin';skinId:string}
  | {type:'ready';ready:boolean}
  | {type:'startTournament'}
  | {type:'input';matchId:string;frame:number;bits:number}
  | {type:'matchResult';matchId:string;winner:PlayerId}
  | {type:'ping';sentAt:number;clientTime:number}
  | {type:'pingReport';ping:number;jitter:number};

export type ServerMessage=
  | {type:'welcome';sessionId:string;resumeToken:string;room?:RoomState}
  | {type:'roomState';room:RoomState}
  | {type:'matchStart';match:MatchStartPayload}
  | {type:'remoteInput';matchId:string;frame:number;bits:number;fromSession:string}
  | ({type:'stateSnapshot'}&AuthoritativeStatePayload)
  | {type:'matchPaused';matchId:string}
  | {type:'matchResumed';matchId:string;startAt:number}
  | {type:'matchEnded';matchId:string;winnerSession:string}
  | {type:'tournamentComplete';championSession:string}
  | {type:'pong';sentAt:number;serverTime:number}
  | {type:'error';message:string}
  | {type:'notice';message:string};
