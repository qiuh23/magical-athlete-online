export interface LabelBox {left:number;top:number;right:number;bottom:number}
export interface ProjectedNodeLabel {node:number;x:number;y:number;depth:number}
const overlaps=(a:LabelBox,b:LabelBox)=>a.left<b.right+4&&a.right>b.left-4&&a.top<b.bottom+4&&a.bottom>b.top-4;
/** Inputs are priority ordered: current occupied node first, then the short
 * confirmed path. Labels never get shoved away from their real board anchor. */
export function placeFocusLabels(candidates:readonly ProjectedNodeLabel[],width:number,height:number,blocked:readonly LabelBox[]){
 const placed:{node:number;x:number;y:number;box:LabelBox}[]=[],seen=new Set<number>();
 for(const c of candidates){if(seen.has(c.node))continue;seen.add(c.node);if(![c.x,c.y,c.depth].every(Number.isFinite)||Math.abs(c.depth)>1)continue;const w=String(c.node).length>2?36:28,h=22,box={left:c.x-w/2,right:c.x+w/2,top:c.y-h/2,bottom:c.y+h/2};
  if(box.left<8||box.right>width-8||box.top<8||box.bottom>height-8||blocked.some(b=>overlaps(box,b))||placed.some(p=>overlaps(box,p.box)))continue;
  placed.push({node:c.node,x:c.x,y:c.y,box});
 }
 return placed;
}
