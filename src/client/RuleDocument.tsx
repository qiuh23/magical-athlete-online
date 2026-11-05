import { Fragment, type ReactNode } from 'react';

// A small renderer for our checked-in rule documents: no HTML or remote content.
function inline(text:string,onNavigate:(file:string)=>void):ReactNode[] {
  return text.split(/(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|`[^`]+`)/g).map((part,index)=>{
    const link=part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if(link){
      const [,label,target]=link,file=target!.split('#')[0]!.replace('/rules/','');
      if(['competition.md','special-events.md','bridges.md','wurstii-a.md','second-wind-verification.md'].includes(file))return <button key={index} type="button" className="rules-crosslink" onClick={()=>onNavigate(file)}>{label}</button>;
      const href=target!.startsWith('../../docs/')?`https://github.com/qiuh23/magical-athlete-online/blob/main/docs/${target!.slice('../../docs/'.length)}`:target;
      return <a key={index} href={href} target="_blank" rel="noreferrer">{label}</a>;
    }
    if(part.startsWith('**'))return <strong key={index}>{part.slice(2,-2)}</strong>;
    if(part.startsWith('`'))return <code key={index}>{part.slice(1,-1)}</code>;
    return part;
  });
}

export function RuleDocument({text,onNavigate}:{text:string;onNavigate:(file:string)=>void}) {
  const lines=text.split(/\r?\n/),blocks:ReactNode[]=[];
  for(let i=0;i<lines.length;){
    const line=lines[i]!.trim(),key=i;
    if(!line){i++;continue;}
    if(line.startsWith('|')){
      const rows:string[][]=[];
      while(i<lines.length&&lines[i]!.trim().startsWith('|')){
        const cells=lines[i++]!.trim().slice(1,-1).split('|').map(cell=>cell.trim());
        if(!cells.every(cell=>/^:?-+:?$/.test(cell)))rows.push(cells);
      }
      blocks.push(<div key={key} className="rules-table-scroll" role="region" aria-label={rows[0]?.join('、')} tabIndex={0}><table><thead><tr>{rows[0]?.map((cell,index)=><th key={index} scope="col">{inline(cell,onNavigate)}</th>)}</tr></thead><tbody>{rows.slice(1).map((row,index)=><tr key={index}>{row.map((cell,j)=><td key={j}>{inline(cell,onNavigate)}</td>)}</tr>)}</tbody></table></div>);
      continue;
    }
    const heading=line.match(/^(#{1,6})\s+(.+)$/);
    if(heading){blocks.push(heading[1]!.length===1?<h3 key={key}>{heading[2]}</h3>:<h4 key={key}>{heading[2]}</h4>);i++;continue;}
    if(/^(- |\d+\. )/.test(line)){
      const numbered=/^\d+\. /.test(line),items:ReactNode[]=[];
      while(i<lines.length&&(numbered?/^\d+\. /:/^- /).test(lines[i]!.trim())){
        items.push(<li key={i}>{inline(lines[i++]!.trim().replace(/^(- |\d+\. )/,''),onNavigate)}</li>);
      }
      blocks.push(numbered?<ol key={key}>{items}</ol>:<ul key={key}>{items}</ul>);continue;
    }
    const paragraph:string[]=[line];i++;
    while(i<lines.length&&lines[i]!.trim()&&!/^(#|\||- |\d+\. )/.test(lines[i]!.trim()))paragraph.push(lines[i++]!.trim());
    blocks.push(<p key={key}>{inline(paragraph.join(' '),onNavigate)}</p>);
  }
  return <Fragment>{blocks}</Fragment>;
}
