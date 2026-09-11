import type { MatchSettings, PlayerId,RoundSimulationState } from '../types/game.js';
import type { Fighter } from '../characters/Fighter.js';

type Phase='roundIntro'|'fightIntro'|'fighting'|'ko'|'roundOver'|'finishWindow'|'finisher'|'matchOver';

export class RoundManager {
  round=1;
  timer:number;
  phase:Phase='roundIntro';
  phaseMs=0;
  matchWinner:PlayerId|null=null;

  constructor(readonly settings: MatchSettings){ this.timer=settings.roundSeconds; }

  resetMatch(p1:Fighter,p2:Fighter):void{
    p1.wins=0;p2.wins=0;this.round=1;this.matchWinner=null;this.beginRound();
  }

  beginRound():void{
    this.timer=this.settings.roundSeconds;this.phase='roundIntro';this.phaseMs=1050;
  }

  get canFight():boolean{return this.phase==='fighting';}
  get roundsToWin():number{return this.settings.roundsToWin;}
  get bestOf():number{return this.settings.roundsToWin*2-1;}
  startFinisher():void{if(this.phase==='finishWindow'){this.phase='finisher';this.phaseMs=2000;}}

  update(dt:number,p1:Fighter,p2:Fighter):{roundReset:boolean;matchEnded:boolean;koStarted:boolean}{
    const ms=dt*1000;let roundReset=false,matchEnded=false,koStarted=false;
    if(this.phase==='roundIntro'||this.phase==='fightIntro'||this.phase==='ko'||this.phase==='roundOver'||this.phase==='finishWindow'||this.phase==='finisher'){
      this.phaseMs-=ms;
      if(this.phaseMs<=0){
        if(this.phase==='roundIntro'){this.phase='fightIntro';this.phaseMs=700;}
        else if(this.phase==='fightIntro'){this.phase='fighting';}
        else if(this.phase==='ko'){this.finishRound(p1,p2);const decisive=p1.wins>=this.settings.roundsToWin||p2.wins>=this.settings.roundsToWin;if(decisive&&(p1.health<=0||p2.health<=0)){this.matchWinner=p1.wins>p2.wins?1:2;this.phase='finishWindow';this.phaseMs=3000;}else{this.phase='roundOver';this.phaseMs=1500;}}
        else if(this.phase==='roundOver'){
          if(p1.wins>=this.settings.roundsToWin||p2.wins>=this.settings.roundsToWin){
            this.phase='matchOver';this.matchWinner=p1.wins>p2.wins?1:2;matchEnded=true;
          }else{this.round++;this.beginRound();roundReset=true;}
        }
        else if(this.phase==='finishWindow'||this.phase==='finisher'){this.phase='matchOver';matchEnded=true;}
      }
    }
    if(this.phase==='fighting'){
      this.timer=Math.max(0,this.timer-dt);
      if(p1.health<=0||p2.health<=0||this.timer<=0){this.phase='ko';this.phaseMs=1350;koStarted=true;}
    }
    return{roundReset,matchEnded,koStarted};
  }

  private finishRound(p1:Fighter,p2:Fighter):void{
    if(p1.health===p2.health)return;
    if(p1.health>p2.health)p1.wins++;else p2.wins++;
  }
  simulationState():RoundSimulationState{return{round:this.round,timer:this.timer,phase:this.phase,phaseMs:this.phaseMs,matchWinner:this.matchWinner};}
  restoreSimulationState(state:RoundSimulationState):void{this.round=state.round;this.timer=state.timer;this.phase=state.phase;this.phaseMs=state.phaseMs;this.matchWinner=state.matchWinner;}
}
