import{readFileSync,writeFileSync}from'node:fs';import{r1Pose}from'../../../src/client/scene/mechanisms/punch-r1/plan.js';
const rows=['actor-provisional','actor-coach'].flatMap(name=>JSON.parse(readFileSync(`docs/qa/punch-r1-contact/${name}.json`,'utf8')).reports);
writeFileSync('docs/qa/punch-r1-contact/self-poses.json',JSON.stringify(rows.flatMap((r:any)=>Array.from({length:101},(_,i)=>({node:r.node,compact:r.compact,lowQuality:r.lowQuality,t:i/100,pose:r1Pose(r.solution,i/100)}))),null,2));
