export const palette={
  bg:'#171614',panel:'#27231f',panel2:'#342e28',cream:'#f3e7d3',muted:'#b5a38b',accent:'#c98b4a',accent2:'#7d4738',line:'rgba(243,231,211,.18)',dark:'#171310',danger:'#e2968e',success:'#a8cf95'
} as const;

export const spacing={xs:8,sm:12,md:16,lg:24,xl:32,xxl:40} as const;
export const sizing={buttonHeight:48,inputHeight:58,panelRadius:12,cardRadius:10} as const;

export const fonts={
  title:(size:number)=>`900 ${size}px 'Orbitron', 'Arial Black', Impact, sans-serif`,
  heading:(size:number)=>`900 ${size}px 'Press Start 2P', 'Orbitron', 'Arial Black', sans-serif`,
  body:(size:number)=>`700 ${size}px 'Orbitron', 'Verdana', 'Trebuchet MS', system-ui, sans-serif`,
  bodyStrong:(size:number)=>`800 ${size}px 'Orbitron', 'Verdana', 'Trebuchet MS', system-ui, sans-serif`,
  mono:(size:number)=>`800 ${size}px 'Courier New', ui-monospace, monospace`,
};

export const rounded=(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r=8):void=>{ctx.beginPath();ctx.roundRect(x,y,w,h,r);};
export const panel=(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,alpha=.96):void=>{ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=palette.panel;rounded(ctx,x,y,w,h,sizing.panelRadius);ctx.fill();ctx.strokeStyle=palette.line;ctx.lineWidth=1.5;ctx.stroke();ctx.restore();};
export const button=(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,labelText:string,selected=false,hover=false):void=>{ctx.save();ctx.fillStyle=selected?(hover?'#d59b58':palette.accent):(hover?'#3b342d':'#2d2824');ctx.strokeStyle=selected?'#f0c78d':(hover?'rgba(255,220,176,.22)':palette.line);ctx.lineWidth=selected?2.5:1.5;rounded(ctx,x,y,w,h,8);ctx.fill();ctx.stroke();ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=fonts.heading(Math.max(12,Math.floor(h*.28)));ctx.fillStyle=selected?palette.dark:palette.cream;ctx.fillText(labelText,x+w/2,y+h/2);ctx.restore();};
export const title=(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,size=54,align:CanvasTextAlign='left'):void=>{ctx.save();ctx.textAlign=align;ctx.font=fonts.title(size);ctx.fillStyle=palette.cream;ctx.lineWidth=Math.max(2,Math.floor(size*.09));ctx.strokeStyle='rgba(48,36,27,.5)';ctx.strokeText(text,x,y);ctx.fillText(text,x,y);ctx.restore();};
export const label=(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,align:CanvasTextAlign='left'):void=>{ctx.save();ctx.textAlign=align;ctx.font=fonts.bodyStrong(12);ctx.fillStyle=palette.muted;ctx.fillText(text,x,y);ctx.restore();};
export const pill=(ctx:CanvasRenderingContext2D,x:number,y:number,text:string,tone:'accent'|'muted'|'success'|'danger'='muted'):void=>{
  const colors={accent:['rgba(201,139,74,.18)',palette.accent,palette.cream],muted:['rgba(255,255,255,.05)',palette.line,palette.muted],success:['rgba(120,165,113,.18)',palette.success,palette.success],danger:['rgba(194,84,84,.18)',palette.danger,palette.danger]} as const;
  const [fill,stroke,txt]=colors[tone];
  ctx.save();
  ctx.font=fonts.bodyStrong(10);
  const w=Math.max(62,ctx.measureText(text).width+20);
  ctx.fillStyle=fill; ctx.strokeStyle=stroke; ctx.lineWidth=1.3; rounded(ctx,x,y,w,24,999); ctx.fill(); ctx.stroke();
  ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle=txt; ctx.fillText(text,x+w/2,y+12);
  ctx.restore();
};
export const fieldBox=(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,labelText:string,value:string,selected:boolean,mono=false):void=>{
  ctx.save();
  ctx.fillStyle=selected?'#403326':'rgba(255,255,255,.025)';ctx.strokeStyle=selected?palette.accent:palette.line;ctx.lineWidth=selected?2:1.2;rounded(ctx,x,y,w,h,8);ctx.fill();ctx.stroke();
  ctx.textAlign='left';ctx.fillStyle=palette.muted;ctx.font=fonts.bodyStrong(10);ctx.fillText(labelText,x+16,y+18);
  ctx.fillStyle=palette.cream;ctx.font=mono?fonts.heading(18):fonts.bodyStrong(18);
  ctx.fillText(value,x+16,y+h-18);
  ctx.restore();
};
export const wrapText=(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,maxWidth:number,lineHeight:number,maxLines=99,align:CanvasTextAlign='left'):number=>{
  ctx.save();
  ctx.textAlign=align;
  const words=text.split(/\s+/).filter(Boolean);
  const lines:string[]=[];
  let current='';
  for(const word of words){
    const candidate=current?`${current} ${word}`:word;
    if(ctx.measureText(candidate).width>maxWidth && current){
      lines.push(current);
      current=word;
      if(lines.length>=maxLines) break;
    } else current=candidate;
  }
  if(current && lines.length<maxLines) lines.push(current);
  lines.slice(0,maxLines).forEach((line,index)=>ctx.fillText(line,x,y+index*lineHeight));
  ctx.restore();
  return Math.min(lines.length,maxLines);
};
export const drawBackdrop=(ctx:CanvasRenderingContext2D,w:number,h:number,now=0):void=>{const g=ctx.createLinearGradient(0,0,w,h);g.addColorStop(0,'#171512');g.addColorStop(.58,'#231d18');g.addColorStop(1,'#0f0e0d');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);ctx.strokeStyle='rgba(218,190,151,.038)';ctx.lineWidth=1;for(let x=-h;x<w+h;x+=90){ctx.beginPath();ctx.moveTo(x+(now*.004)%90,0);ctx.lineTo(x-h+(now*.004)%90,h);ctx.stroke();}ctx.fillStyle='rgba(182,122,67,.05)';ctx.beginPath();ctx.ellipse(w*.77,h*.34,360,170,-.28,0,Math.PI*2);ctx.fill();ctx.fillStyle='rgba(201,139,74,.025)';ctx.beginPath();ctx.ellipse(w*.2,h*.72,250,120,.18,0,Math.PI*2);ctx.fill();};
