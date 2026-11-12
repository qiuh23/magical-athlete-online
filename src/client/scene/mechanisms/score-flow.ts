/** Cosmetic score flow, not collision geometry or a rule mutation. Labels keep
 * the exact delta even when a large score change hits this visual count cap. */
export function scoreFlowCount(delta:number|undefined,lowQuality=false){return Number.isFinite(delta)?Math.min(lowQuality?8:16,Math.ceil(Math.abs(delta!))*3):0;}
export function scoreFlowSample(progress:number,index:number,count:number){
 if(!count||!Number.isFinite(progress))return;
 const delay=count<=1?0:index/(count-1)*.22,local=(progress-.08-delay)/.54;
 if(local<=0||local>=1)return;
 const u=local*local*(3-2*local);return{u,arc:Math.sin(local*Math.PI)*.32,scale:Math.sin(local*Math.PI)*.055};
}
