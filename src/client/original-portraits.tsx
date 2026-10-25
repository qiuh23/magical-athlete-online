import type { ReactNode } from 'react';

// Species, costume, palette and props follow the delivered model previews and manifest.
const paper='#fffdf4', ink='#191919', green='#78af80', darkGreen='#4e8c72', olive='#a6a34c';
const blue='#87bbd6', violet='#9b73c7', pink='#ef83b6', red='#f44735', orange='#ef9544';
const skin='#e1a177', yellow='#e7cb79', grey='#c6d2cf', brown='#a07b46';

export function Eyes({ x = 46, y = 42, gap = 23, small = false }: { x?: number; y?: number; gap?: number; small?: boolean }) {
  const rx = small ? 5.1 : 7, ry = small ? 6.7 : 9;
  return <g fill={paper} strokeWidth="2"><ellipse cx={x} cy={y} rx={rx} ry={ry} /><ellipse cx={x + gap} cy={y - 1} rx={rx} ry={ry} /><g fill={ink} stroke="none"><ellipse cx={x + 1.3} cy={y + 1} rx={small ? 2.1 : 2.8} ry={small ? 3.1 : 4} /><ellipse cx={x + gap + 1.3} cy={y} rx={small ? 2.1 : 2.8} ry={small ? 3.1 : 4} /></g><g fill={paper} stroke="none"><circle cx={x + 0.3} cy={y - 0.6} r="1" /><circle cx={x + gap + 0.3} cy={y - 1.6} r="1" /></g></g>;
}
function Gaze({x,y,gap=17,size=4}: {x:number;y:number;gap?:number;size?:number}) {
  return <g strokeWidth="1.25" fill={paper}><ellipse cx={x} cy={y} rx={size} ry={size*1.35}/><ellipse cx={x+gap} cy={y-1} rx={size} ry={size*1.35}/><g fill={ink} stroke="none"><ellipse cx={x+.8} cy={y+.4} rx={size*.43} ry={size*.7}/><ellipse cx={x+gap+.8} cy={y-.6} rx={size*.43} ry={size*.7}/></g><g fill={paper} stroke="none"><circle cx={x+.4} cy={y-.8} r=".7"/><circle cx={x+gap+.4} cy={y-1.8} r=".7"/></g></g>;
}
function Shoes({x=45,y=108,gap=28,color=ink}: {x?:number;y?:number;gap?:number;color?:string}) {
  return <g fill={color}><path d={`M${x-6} ${y-5}h11v8h-17q-2-5 6-8zM${x+gap-5} ${y-5}h11q8 3 6 8h-17z`}/></g>;
}
function Pips({x,y,color=paper}: {x:number;y:number;color?:string}) {
  return <g transform={`translate(${x} ${y})`}><rect width="12" height="12" rx="2" fill={color} strokeWidth="1.25"/><g fill={ink} stroke="none"><circle cx="3.4" cy="3.4" r="1"/><circle cx="8.6" cy="8.6" r="1"/><circle cx="6" cy="6" r="1"/></g></g>;
}

export const ORIGINAL_PORTRAITS: Record<string, ReactNode> = {
  alchemist: <>
    <Shoes x={47} y={109} gap={27}/><path d="M42 53q17-8 34 0l11 50q-26 11-54 0z" fill={green}/><path d="M40 65 25 80l9 8m42-22 12 18-13 4" fill="none" stroke={green} strokeWidth="10"/>
    <path d="M43 33q16-13 32 0v24q-16 16-32-1z" fill={pink}/><Gaze x={50} y={39} gap={17} size={3}/><ellipse cx="61" cy="48" rx="7" ry="9" fill={skin}/>
    <path d="m44 47 9 7 8-4 8 4 8-7-4 30-9-7-5 12-8-8-7 4z" fill={orange}/><path d="M51 56v13m9-11v15m9-16v10" fill="none" stroke="#a86b4a" strokeWidth="1.4"/>
    <path d="M39 34q7-12 5-24 13-4 20 12l13 13z" fill={green}/><path d="M36 34q25 7 45 0" fill="none" stroke={darkGreen} strokeWidth="5"/><path d="m48 13 5 4" stroke={paper} opacity=".6"/>
    <path d="M28 81h40l-4 20q-17 12-33-1z" fill={violet}/><ellipse cx="48" cy="81" rx="20" ry="5" fill={darkGreen}/><path d="M31 85q-13-9-12 5 1 9 13 5m35-10q13-9 12 5-1 9-14 5" fill="none" stroke={violet} strokeWidth="3"/>
    <path d="m46 81-7-20" stroke={brown} strokeWidth="3"/><circle cx="39" cy="61" r="4" fill={pink}/><path d="M54 75q-5-7 1-12" fill="none" stroke={paper} strokeWidth="1.7"/>
  </>,
  'baba-yaga': <>
    <path d="m47 62-4 27-8 19m40-46 3 23-11 23" fill="none" stroke={yellow} strokeWidth="7"/><path d="m35 107-13 5m13-5 2 8m30-8-12 6m12-6 6 7" fill="none" stroke={orange} strokeWidth="2.4"/>
    <path d="M30 29h54v35H30z" fill={paper}/><path d="m84 29 10-6v34l-10 7z" fill={grey}/><path d="M31 39h51M31 50h51M31 60h51" stroke="#b4bcb2" strokeWidth="1.2"/>
    <path d="m22 30 35-21 40 20-13 4-27-14-27 14z" fill={orange}/><path d="M75 19V8h8v15" fill={brown}/><path d="M40 36h13v13H40zm23 0h13v13H63z" fill={blue}/><path d="M46 36v13m-6-7h13M69 36v13m-6-7h13" fill="none" stroke={paper} strokeWidth="1.3"/>
    <path d="M53 53h12v11H53z" fill={brown}/><circle cx="62" cy="59" r="1" fill={yellow} stroke="none"/><path d="m32 27 19-11" stroke={paper} strokeWidth="1.6" opacity=".6"/>
  </>,
  banana: <>
    <path d="M80 16q8 29-6 52-8 15-27 21-14 4-15-7 0-7 10-14 25-17 24-52z" fill={yellow}/><path d="m66 17-3-10 10-1 5 11z" fill={brown}/><path d="M69 26q2 29-18 48" fill="none" stroke="#f7e6a8" strokeWidth="3"/>
    <path d="M49 89v18m17-29v28" fill="none" stroke={orange} strokeWidth="4"/><path d="m49 106-12 7m12-7 2 8m15-8-12 7m12-7 4 8" fill="none" stroke={orange} strokeWidth="2"/>
    <Gaze x={69} y={44} gap={10} size={2.6}/><path d="M67 59q6 4 11-3" fill="none" strokeWidth="1.7"/><path d="M47 74q-3 4-4 8" fill="none" stroke="#b9a054" strokeWidth="1.5"/>
  </>,
  blimp: <>
    <path d="M88 38 94 24l7 1-1 21m-8 19 8 12 7-3-6-17" fill={grey}/><path d="M45 75v15h23V74" fill={grey}/><path d="M52 78v7h9v-7" fill={blue} strokeWidth="1.5"/>
    <path d="M17 55q2-26 43-27 41 0 44 26-2 25-43 26-42 1-44-25z" fill={grey}/><path d="M41 31q-11 23 0 46m38-46q10 23 0 45M23 45q39-14 73 0" fill="none" stroke="#94aba6" strokeWidth="1.4"/>
    <Gaze x={26} y={53} gap={9} size={2.6}/><ellipse cx="19" cy="61" rx="5" ry="3" fill={pink}/><path d="M27 67q5 3 10 0M46 35q14-3 27-1" fill="none" strokeWidth="1.5"/><path d="M13 84h14m-10 8h20" stroke={blue} strokeWidth="1.8"/>
  </>,
  centaur: <>
    <path d="m56 80 1 24m34-25v24" stroke={red} strokeWidth="8"/><path d="M96 61q15-12 15 5l-4 18q-2-13-10-11" fill={paper}/>
    <path d="M36 61h50q16 1 17 16l-6 15H41q-13-2-12-17z" fill={red}/><path d="m40 84-3 23m43-23 3 23" fill="none" stroke={red} strokeWidth="9"/><g fill={ink}><ellipse cx="36" cy="109" rx="7" ry="4"/><ellipse cx="58" cy="106" rx="6" ry="4"/><ellipse cx="84" cy="109" rx="7" ry="4"/><ellipse cx="92" cy="105" rx="6" ry="4"/></g>
    <path d="M44 36q-12 2-13 17l5 15h30l6-16q-1-14-13-16z" fill={skin}/><path d="M35 47 26 59l15 4m25-15 9 13-14 3" fill="none" stroke={skin} strokeWidth="7"/>
    <path d="M40 21q0-16 16-15 17 0 17 19l-4 23-8-8-20-9z" fill={paper}/><ellipse cx="52" cy="25" rx="15" ry="18" fill={skin}/><Gaze x={46} y={23} gap={12} size={2.8}/><path d="M47 36q6 4 12-1M48 50h12" fill="none" strokeWidth="1.6"/><path d="M67 16v15" stroke="#c9cabe" strokeWidth="1.5"/>
  </>,
  cheerleader: <>
    <Shoes x={47} y={109} gap={26} color={blue}/><path d="M36 55 23 34m60 21 14-22" fill="none" stroke={red} strokeWidth="9"/>
    <path d="M31 51q0-22 28-22 29 0 29 24v35q-2 21-29 22-28-1-28-22z" fill={red}/><path d="m33 42-5 5 5 3m52-8 5 5-4 4m-52 36-4 4 4 3m51-8 5 5-4 3" fill="none" strokeWidth="1.5"/>
    <Gaze x={46} y={49} gap={24} size={4.7}/><ellipse cx="59" cy="64" rx="15" ry="10" fill={violet}/><path d="M45 80q15-8 28 0l-4 12H50z" fill={ink}/><path d="M48 81h22v5H48z" fill={paper} strokeWidth="1"/><path d="M54 81v5m8-5v5" strokeWidth="1"/>
    <circle cx="23" cy="33" r="6" fill={paper}/><circle cx="96" cy="33" r="6" fill={paper}/><path d="M14 29 9 18q-1-5 3-5l7 10-3-13q0-5 4-4l5 15 2-12q2-4 5-1l-2 16 6-7q4-3 6 1l-10 15zm74 0-5-11q-1-5 3-5l7 10-3-13q0-5 4-4l5 15 2-12q2-4 5-1l-2 16 6-7q4-3 6 1l-10 15z" fill={violet}/><path d="m19 17 4 10m7-10-3 11m66-10 1 10m8-10-5 12" stroke={paper} opacity=".6" strokeWidth="1.3"/>
  </>,
  coach: <>
    <path d="M83 84q22 10 19-13-5 9-15 5" fill={green}/><Shoes x={43} y={109} gap={29} color={red}/><path d="M36 58q23-8 46 0l8 43H29z" fill={paper}/><path d="M45 60v41h30V60" fill={green}/><path d="M54 65h10m-10 9h10m-10 9h10m-10 9h10" stroke={darkGreen} strokeWidth="1.5"/>
    <path d="M34 64 22 77l-9-4m69-9 13 12-8 8" fill="none" stroke={red} strokeWidth="10"/><circle cx="13" cy="73" r="6" fill={green}/>
    <path d="M40 32q-1-20 21-20 22 0 22 20v15q-23 17-45 1l-11-7q-3-10 13-9z" fill={green}/><Gaze x={52} y={29} gap={17} size={3.5}/><path d="M36 45q16 9 35 1" fill="none" strokeWidth="1.5"/><path d="M36 22q1-18 25-17 22 0 24 17zM34 23h49l10 5H38z" fill={red}/>
    <path d="m80 66 23-7 1 22-24-7z" fill={violet}/><ellipse cx="103" cy="70" rx="6" ry="11" fill={blue}/><ellipse cx="103" cy="70" rx="3" ry="6" fill={ink}/><path d="m78 75-1 8h7v-7" fill={violet}/><path d="M37 61v31m44-30v30" stroke={red} strokeWidth="2"/>
  </>,
  copycat: <>
    <path d="M30 91q-22 10-22-9m87 10q17 3 16-15" fill="none" stroke={blue} strokeWidth="5"/>
    <path d="M16 66q-2-25 4-45l13 12 17-15 8 28v50q-2 13-20 13-19 0-21-13z" fill={blue}/><path d="M62 71q-2-23 4-40l14 10 16-15 8 26v45q-1 12-20 12-19 0-21-12z" fill={blue}/>
    <Gaze x={28} y={48} gap={15} size={3.5}/><Gaze x={75} y={57} gap={15} size={3.5}/><path d="m32 60 5 3 5-4m33 10 6 3 5-4" fill={skin}/><path d="m29 65 8 3 9-4m28 12 8 3 10-4" fill="none" strokeWidth="1.4"/>
    <path d="m20 72 17 6 17-7-7 14-10-7-9 7zm47 9 15 5 17-7-6 14-11-7-8 6z" fill={paper}/><path d="m35 79-3 20 6 6 5-8-4-18" fill={yellow}/><path d="m81 87-3 15 6 5 4-8-4-12" fill={violet}/><path d="M26 107v5h10m52-5v5h11m-60-5v5h9m19-5v5h10" stroke={blue} strokeWidth="5"/>
  </>,
  dicemonger: <>
    <Shoes x={44} y={109} gap={29}/><path d="M32 49q28-9 56 0l7 55H26z" fill={red}/><path d="m38 57-15 12 11 12m49-23 15 13-10 12" fill="none" stroke={red} strokeWidth="10"/><circle cx="33" cy="80" r="5" fill={violet}/><circle cx="87" cy="81" r="5" fill={violet}/>
    <path d="M41 25q20-13 39 0v22q-19 16-39-1z" fill={violet}/><Gaze x={50} y={32} gap={18} size={3}/><ellipse cx="61" cy="44" rx="7" ry="5" fill={violet}/><path d="M35 23q3-17 25-17 21 0 27 17zM32 25h58" fill={red}/>
    <path d="M37 59h46v40H37z" fill={brown}/><path d="M37 72h46m-46 13h46" stroke="#7c5e3d" strokeWidth="2"/><Pips x={39} y={59} color={blue}/><Pips x={54} y={59} color={yellow}/><Pips x={69} y={59} color={green}/><Pips x={39} y={73} color={green}/><Pips x={54} y={73}/><Pips x={69} y={73} color={blue}/><Pips x={39} y={87} color={yellow}/><Pips x={54} y={87} color={pink}/><Pips x={69} y={87}/><path d="m32 54 5 45m51-44-5 44" stroke={paper} strokeWidth="1.6" opacity=".7"/>
  </>,
  duelist: <>
    <Shoes x={45} y={109} gap={28} color={brown}/><path d="M40 53q20-8 38 0l11 50H30z" fill={blue}/><path d="M51 56v44m16-44v44" stroke={red} strokeWidth="3"/>
    <path d="M39 62 27 79l-8-10m61-7 12 13 5-12" fill="none" stroke={blue} strokeWidth="8"/><circle cx="19" cy="68" r="5" fill={blue}/><path d="m97 65 12-36m-17 31 11 4" fill="none" stroke={grey} strokeWidth="2"/><ellipse cx="97" cy="63" rx="6" ry="3" fill={yellow} transform="rotate(17 97 63)"/>
    <path d="M42 29q17-12 34 0v21H42z" fill={blue}/><Gaze x={51} y={32} gap={17} size={3}/><path d="M59 40q-13 2-15 8 9 5 19 1z" fill={red}/>
    <path d="m38 49 7 3 5-3 6 5 6-4 6 4 8-5 8 4-7 9-34-1z" fill={paper}/><path d="M37 25 42 9q20-6 37 13l8 8H35z" fill={blue}/><path d="M71 16q12-12 10-15 11 7-1 21" fill={paper}/><path d="M36 29h48" stroke="#5c8caa" strokeWidth="3"/>
  </>,
  egg: <>
    <Shoes x={48} y={108} gap={21} color={blue}/><path d="M45 77h28l6 29H39z" fill={blue}/><path d="M49 67q11-6 21 0v17H49z" fill={violet}/><ellipse cx="60" cy="79" rx="6" ry="7" fill={red}/><path d="m44 87-8 9m39-9 8 9" stroke={blue} strokeWidth="5"/>
    <path d="M60 8C47 8 25 39 20 67q40 15 80 0C95 38 73 8 60 8z" fill={orange}/><path d="M20 67q40 11 80 0" fill="none" stroke={brown} strokeWidth="3"/><ellipse cx="60" cy="72" rx="28" ry="5" fill={violet}/><Gaze x={55} y={49} gap={10} size={2.2}/><path d="M42 32q-6 9-9 18" fill="none" stroke={paper} strokeWidth="2.2" opacity=".55"/>
  </>,
  'flip-flop': <>
    <path d="M23 96q3-30 14-53 7-14 22-14 18 0 27 15 13 22 14 52-4 16-38 16-34 0-39-16z" fill={violet}/>
    <path d="M42 30q-7-18 5-20l2 14 5-11 1 16m14-2q-1-20 12-17l-4 15 9-9-3 16" fill={grey}/><path d="M44 17v9m33-8-3 9" stroke="#849f9b" strokeWidth="1.3"/>
    <Gaze x={48} y={50} gap={23} size={3.4}/><ellipse cx="59" cy="73" rx="9" ry="6" fill={ink}/><path d="M59 58q-17-8-22 11L30 98q15-9 17-24l12-8 11 8q3 16 18 24l-7-29q-6-19-22-11z" fill={yellow}/><path d="M43 68q-5 8-7 18m39-18 7 18" fill="none" stroke="#bba35e" strokeWidth="1.5"/><ellipse cx="59" cy="59" rx="7" ry="5" fill={violet}/>
  </>,
  genius: <>
    <Shoes x={44} y={109} gap={28} color={green}/><path d="M34 60q24-10 49 0l8 45H28z" fill={red}/><path d="m35 68-14 19m61-20 13 18" stroke={pink} strokeWidth="8"/><path d="m45 60 13 13 14-13" fill={paper}/><path d="M59 72v26" stroke={orange} strokeWidth="2"/>
    <path d="M40 32q-1-22 21-21 22 1 23 25v21q-24 15-45-1z" fill={pink}/><path d="M43 25 27 17l10-10 9 10m27 3 8-14 12 12-9 13" fill={blue}/><Gaze x={49} y={32} gap={22} size={3.4}/><circle cx="49" cy="32" r="8" fill="none"/><circle cx="71" cy="31" r="8" fill="none"/><path d="M57 32h6"/>
    <path d="M48 41q-17-9-23 2-4 15 24 15h22l-1-11z" fill={pink}/><path d="M32 48h1m8 6q15 5 28-1" fill="none" strokeWidth="1.4"/>
    <rect x="72" y="73" width="20" height="26" rx="2" fill={blue}/><path d="M76 77h12v5H76z" fill={paper} strokeWidth="1.2"/><path d="M77 87h1m6 0h1m-8 5h1m6 0h1" stroke={paper} strokeWidth="2.5"/>
  </>,
  gunk: <>
    <path d="M43 24q1-17 19-17 20 0 22 19l-4 51q-1 12 15 14 18 3 14 12-9 12-47 11-44 0-49-11-4-9 15-12 12-3 11-15z" fill={olive}/>
    <path d="M48 33q-10 16-12 41-1 11 8 11 10 0 11-11l8-33z" fill={olive}/><Gaze x={51} y={27} gap={18} size={3}/><path d="M46 24h11m6-1h11" stroke={olive} strokeWidth="4"/><path d="M63 58q6 4 11 0" fill="none" strokeWidth="1.5"/><path d="m69 59 3 8 2-9" fill={red} strokeWidth="1"/>
    <path d="M51 14q5-3 9-3m-37 87q10 6 21 3m39-3q8 5 15 2" fill="none" stroke={paper} strokeWidth="2" opacity=".4"/><path d="M76 77q-3 12 6 16" fill="none" stroke="#7e814e" strokeWidth="1.7"/>
  </>,
  hare: <>
    <path d="M47 41Q19 3 31 5q12 2 26 32M64 37Q76 1 88 5q2 12-13 39" fill={blue}/><path d="M34 14 48 34m33-18-12 20" stroke={paper} strokeWidth="3" opacity=".7"/>
    <ellipse cx="59" cy="84" rx="23" ry="25" fill={blue}/><ellipse cx="53" cy="101" rx="20" ry="8" fill={blue}/><ellipse cx="77" cy="107" rx="12" ry="5" fill={blue}/><path d="M46 74 35 87m37-12 9 12" stroke={blue} strokeWidth="7"/>
    <path d="M39 44q2-16 21-15 22 0 22 20l-3 16q-20 15-39-1z" fill={blue}/><Gaze x={49} y={46} gap={18} size={3.3}/><ellipse cx="47" cy="58" rx="8" ry="6" fill={red}/><path d="M46 66q10 5 20 0" fill="none"/><path d="M53 67h10v9H53zM58 67v9" fill={paper} strokeWidth="1.2"/><path d="M53 84q4-7 10-5" stroke={paper} strokeWidth="2" fill="none" opacity=".5"/>
  </>,
  heckler: <>
    <Shoes x={44} y={109} gap={30} color={pink}/><path d="M41 61q17-7 34 0l12 41q-26 11-53 0z" fill={pink}/><path d="m39 71-15 16m53-17 16 16" stroke={pink} strokeWidth="9"/>
    <path d="M39 35 26 13q-12 0-8 15l19 23m39-17 16-22q13 4 7 17L81 49" fill={pink}/><path d="M48 24q3-20 17-17l-4 8 13 4-9 10" fill={yellow}/>
    <path d="M35 38q25-16 49 0v25q-24 20-49-1z" fill={pink}/><Gaze x={46} y={42} gap={24} size={3.6}/><ellipse cx="44" cy="56" rx="10" ry="7" fill={red}/><path d="M42 67q16-6 32-2l-4 11H47z" fill={ink}/><path d="M45 67h26v5H45z" fill={paper} strokeWidth="1.1"/><path d="M52 67v5m7-5v5m7-5v5" strokeWidth="1"/>
    <path d="M38 78q21 6 42-1" stroke={green} strokeWidth="5"/><g fill={violet} stroke="none"><ellipse cx="45" cy="91" rx="3" ry="4"/><ellipse cx="68" cy="86" rx="3" ry="4"/><ellipse cx="75" cy="98" rx="3" ry="4"/><ellipse cx="58" cy="103" rx="3" ry="3"/></g>
  </>,
  'huge-baby': <>
    <Shoes x={47} y={109} gap={24} color={pink}/><ellipse cx="60" cy="81" rx="27" ry="24" fill={pink}/><path d="m37 77-10 10m56-10 10 10" stroke={pink} strokeWidth="10"/><path d="M35 91q25 9 50 0l-6 16H41z" fill={paper}/><path d="m43 96 16 7 17-7" fill="none" stroke="#c9cabe" strokeWidth="1.4"/>
    <path d="M31 43q-1-31 29-32 31 0 31 32v18q-1 20-31 21-29-2-29-21z" fill={pink}/><ellipse cx="29" cy="50" rx="5" ry="8" fill={pink}/><ellipse cx="92" cy="50" rx="5" ry="8" fill={pink}/><path d="M53 12q7-8 15 0" fill={pink}/>
    <Gaze x={50} y={44} gap={21} size={2.9}/><path d="M47 40h7m13-1h7" stroke={pink} strokeWidth="2.5"/><ellipse cx="61" cy="57" rx="8" ry="6" fill={orange}/><circle cx="61" cy="59" r="4" fill={blue}/><circle cx="61" cy="63" r="5" fill="none" stroke={blue} strokeWidth="2"/>
  </>,
  hypnotist: <>
    <ellipse cx="61" cy="102" rx="35" ry="12" fill={green}/><ellipse cx="61" cy="97" rx="25" ry="5" fill={darkGreen}/><path d="M47 82v17q14 9 28-1V81" fill={green}/>
    <path d="M60 13Q29 4 25 37q-3 28 22 45h28q26-17 23-45Q94 6 64 13z" fill={green}/><path d="M47 22q13-10 26 0l2 59H45z" fill={green}/>
    <g stroke={blue} strokeWidth="5"><path d="M31 31h10m-12 13h11m-10 13h11m-6 12h9m35-38h11M80 44h12M79 57h12m-14 12h10"/></g>
    <g fill={paper}><circle cx="51" cy="37" r="8"/><circle cx="72" cy="37" r="8"/></g><path d="M50 37q0-3 3-1 3 3-1 5-7 2-7-4 1-8 9-7m17 7q0-3 3-1 3 3-1 5-7 2-7-4 1-8 9-7" fill="none" strokeWidth="1.2"/>
    <ellipse cx="62" cy="56" rx="14" ry="5" fill={red}/><path d="m60 79-14-7v15l14-5 14 5V72z" fill={red}/><circle cx="60" cy="80" r="4" fill={orange}/><path d="M49 90h24" stroke={darkGreen} strokeWidth="1.5"/>
  </>,
  inchworm: <>
    <path d="M17 105C19 50 43 35 57 80s28 28 31-31" fill="none" stroke={ink} strokeWidth="20"/>
    <path d="M17 105C19 50 43 35 57 80s28 28 31-31" fill="none" stroke={violet} strokeWidth="16"/>
    <path d="M20 83q4-17 10-22M43 61q7 7 11 22m10 17q10 10 17-13" fill="none" stroke={blue} strokeWidth="16"/>
    <path d="M78 32q0-13 11-13 13 1 13 15l-2 20H78z" fill={green}/><Gaze x={84} y={34} gap={10} size={2.7}/><path d="M85 47q5 3 10-1m-10-25-4-12m14 13 5-12" fill="none" strokeWidth="1.6"/><circle cx="81" cy="8" r="2" fill={green}/><circle cx="99" cy="9" r="2" fill={green}/><path d="m30 57 2-4m5 5 4-4m11 17 4-1m6 22 4-2" stroke={violet} strokeWidth="2"/>
  </>,
  lackey: <>
    <Shoes x={46} y={109} gap={28} color={green}/><path d="M31 91q-2-41 13-67 8-13 22-12 25 0 28 28v62q-34 13-64 0z" fill={pink}/><path d="M42 31q3-18 20-18 21 1 20 24v19H42z" fill={darkGreen}/>
    <path d="M43 32q16-10 31 0v16q-15 13-30 0z" fill={green}/><Gaze x={50} y={34} gap={16} size={3.2}/><path d="M51 43q-15 4-14 15 4 11 12 0l12-8" fill={green}/><path d="M57 54q8 3 13-1" fill="none" strokeWidth="1.4"/>
    <path d="m34 72 10 15m43-15L75 87" fill="none" stroke={pink} strokeWidth="10"/><ellipse cx="45" cy="86" rx="7" ry="5" fill={green}/><ellipse cx="74" cy="86" rx="7" ry="5" fill={green}/>
    <path d="m49 14 14 1-2 7-14-1zM76 66l9 3-3 13-10-4z" fill={green} strokeWidth="1.2"/><path d="m76 69 7 2m-9 5 7 2M47 95l5 3m20 0 7-3" fill="none" stroke={paper} opacity=".6" strokeWidth="1.2"/>
  </>,
  leaptoad: <>
    <path d="M42 76 21 86l15 18m40-28 23 11-14 17" fill="none" stroke={blue} strokeWidth="9"/><path d="m36 101-17 9 8-1-1 6 9-5 6 3-1-10zm48 0 17 9-8-1 1 6-9-5-6 3 1-10z" fill={orange} strokeWidth="1.6"/>
    <ellipse cx="60" cy="76" rx="24" ry="24" fill={blue}/><path d="M35 49q24-17 51 0l4 15q-29 26-59 0z" fill={blue}/><ellipse cx="42" cy="37" rx="13" ry="19" fill={blue}/><ellipse cx="78" cy="37" rx="13" ry="19" fill={blue}/>
    <ellipse cx="42" cy="36" rx="9" ry="15" fill={paper}/><ellipse cx="78" cy="36" rx="9" ry="15" fill={paper}/><ellipse cx="44" cy="36" rx="4" ry="10" fill={ink} stroke="none"/><ellipse cx="80" cy="36" rx="4" ry="10" fill={ink} stroke="none"/>
    <path d="M35 64q25 15 50 0" fill="none" stroke={paper} strokeWidth="4"/><path d="M41 78 30 96m47-18 12 18" fill="none" stroke={blue} strokeWidth="5"/>
  </>,
  legs: <>
    <path d="M43 41h15l-5 65H37zm20 0h15l7 65H69z" fill={green}/><path d="m49 46-5 55m27-55 5 55" stroke={yellow} strokeWidth="3"/><Shoes x={43} y={109} gap={33} color={red}/>
    <path d="M36 27q24-9 47 0l3 20H33z" fill={violet}/><path d="M52 14q0-8 8-8 8 0 8 8v9H52z" fill={yellow}/><Gaze x={56} y={14} gap={8} size={1.8}/><path d="M56 21h8" strokeWidth="1.3"/>
    <path d="m59 34-10-6v13l10-5 11 5V28z" fill={red}/><circle cx="60" cy="35" r="3" fill={red}/><circle cx="34" cy="41" r="5" fill={yellow}/><circle cx="86" cy="41" r="5" fill={yellow}/><path d="M60 43v6" stroke={paper} strokeWidth="1.5"/>
  </>,
  'lovable-loser': <>
    <circle cx="51" cy="64" r="37" fill={pink}/><path d="M54 64q0-12-12-9-18 9-3 25 20 15 34-10 10-29-21-39" fill="none" stroke={violet} strokeWidth="3"/>
    <path d="M70 62q0-12 12-12 13 1 11 15v25q0 9 14 12 11 8-5 12H28q-16-1-12-9 3-7 21-6 29 0 33-15z" fill={green}/><path d="M76 54V37m12 18 6-18" stroke={green} strokeWidth="5"/><Gaze x={76} y={34} gap={18} size={4}/><path d="M77 72q6 4 12-1" fill="none" strokeWidth="1.6"/>
    <path d="M93 91 102 74" fill="none" stroke={darkGreen} strokeWidth="2"/><g fill={paper} strokeWidth="1"><circle cx="103" cy="70" r="4"/><circle cx="108" cy="74" r="4"/><circle cx="106" cy="79" r="4"/><circle cx="100" cy="78" r="4"/><circle cx="98" cy="73" r="4"/></g><circle cx="103" cy="74" r="3" fill={yellow}/><path d="M31 106h26" stroke={paper} opacity=".5" strokeWidth="1.7"/>
  </>,
  magician: <>
    <Shoes x={44} y={109} gap={31}/><path d="M34 58q27-10 52 0l8 46H26z" fill={blue}/><path d="M48 60h25v43H48z" fill={orange}/><path d="M61 72v26" stroke="#a86b4a" strokeWidth="1.5"/>
    <ellipse cx="34" cy="37" rx="16" ry="24" fill={violet}/><ellipse cx="87" cy="37" rx="15" ry="24" fill={violet}/><ellipse cx="34" cy="37" rx="9" ry="17" fill={pink}/><ellipse cx="87" cy="37" rx="8" ry="17" fill={pink}/>
    <path d="M39 29q0-21 22-21 22 0 22 22v24H39z" fill={violet}/><Gaze x={50} y={32} gap={20} size={3.5}/><path d="M55 43v27q-1 15-14 14-10-3-5-11 3 8 10 3V43" fill={violet}/><path d="m52 68 9 6 12-6v13l-12-6-9 6z" fill={paper}/>
    <path d="M35 66 24 82l-9-6m69-10 12 14" fill="none" stroke={blue} strokeWidth="8"/><path d="M16 78 8 45" stroke={ink} strokeWidth="4"/><path d="m8 46-2-8" stroke={paper} strokeWidth="4"/>
    <path d="M84 78h25l-3 17H87zM80 77h32" fill={blue}/><Pips x={90} y={64}/><ellipse cx="96" cy="96" rx="10" ry="4" fill={violet}/>
  </>,
  mastermind: <>
    <path d="M39 62q22-10 42 0l7 39q-1 13-29 13-28-1-27-13z" fill={green}/><path d="M43 43q0-18 19-18 21 0 20 20v16q-19 17-39 0z" fill={skin}/><Gaze x={51} y={46} gap={21} size={3}/>
    <path d="M56 51q-10 4-12 14 1 7 7 3l11-11" fill={skin}/><path d="M60 65q7 3 13-2" fill="none" strokeWidth="1.4"/>
    <path d="M29 28q-8-13 5-18 13-10 26-5 18-6 30 5 14 6 6 20-4 14-32 14-30 0-35-16z" fill={paper}/><path d="M40 14q-6 9-1 18m11-21q6 11 0 22m13-24q-4 14 0 24m12-23q7 13 1 24m9-21q8 8 3 16" fill="none" stroke={yellow} strokeWidth="1.7"/>
    <path d="M40 80 54 89l9-13m19 4L69 89l-6-13" fill="none" stroke={green} strokeWidth="9"/><path d="m55 87 8-11 7 11-7 7z" fill={skin}/><path d="M62 79v11m-3-8 1 7m6-7v7" stroke="#b77d5a" strokeWidth="1.1"/>
  </>,
  mouth: <>
    <path d="M41 89v17m37-17v17M24 53 12 61m85-7 12 7" stroke={blue} strokeWidth="7"/><Shoes x={39} y={109} gap={39} color={blue}/>
    <path d="M18 58q3-28 41-28 40 0 43 29-1 35-42 36-39 0-42-37z" fill={red}/><path d="M30 52q30-10 60 0v23q-29 14-59 0z" fill={ink}/>
    <path d="M31 50q29-7 58 0v9q-29-5-58 0zM32 75q29 8 56 0v9q-29 7-56 0z" fill={paper}/><path d="M40 49v9m10-10v9m10-10v9m10-9v10m10-9v10M41 78v8m10-7v9m10-8v8m10-9v8m9-9v7" strokeWidth="1.2"/>
    <Gaze x={52} y={27} gap={16} size={2.7}/><path d="M29 43q6-4 13-4m38 49 7-3" fill="none" stroke={paper} strokeWidth="1.7" opacity=".6"/>
  </>,
  'party-animal': <>
    <Shoes x={45} y={109} gap={29} color={yellow}/><path d="M35 57q26-10 49 0l4 47H30z" fill={pink}/><path d="M43 59v43m16-46v47m17-44v42" stroke={green} strokeWidth="4"/>
    <path d="M35 65 23 74l-7-18m68 9 14 9 6-20" fill="none" stroke={pink} strokeWidth="7"/><circle cx="16" cy="54" r="6" fill={yellow}/><circle cx="104" cy="52" r="6" fill={yellow}/>
    <path d="M38 27 25 19l4 21 11 6m39-19 15-7-5 20-10 5" fill={yellow}/><path d="M38 28q22-14 42 0v25q-21 17-43-1z" fill={yellow}/><Gaze x={49} y={35} gap={21} size={3.2}/><ellipse cx="60" cy="47" rx="8" ry="6" fill={blue}/><path d="M50 56q10 5 20-1" fill="none" strokeWidth="1.5"/>
    <path d="M39 22 42 7h34l4 15zM33 24h54" fill={pink}/><path d="M42 17h35" stroke={green} strokeWidth="4"/><path d="m47 63 12 5 13-6" fill="none" stroke={paper} strokeWidth="2"/>
  </>,
  'rocket-scientist': <>
    <Shoes x={42} y={109} gap={26}/><path d="M31 55q24-9 44 0l11 48H23z" fill={paper}/><path d="M42 58 55 72l12-14M55 73v27" fill="none" stroke="#a7b9ba" strokeWidth="1.5"/><circle cx="61" cy="81" r="1.6" fill={ink}/><circle cx="61" cy="92" r="1.6" fill={ink}/>
    <path d="M37 27q0-19 18-19 21 0 21 21v26H37z" fill={green}/><path d="M37 25 27 14l12-2 5-9 13 6 11 16-14-9z" fill={yellow}/><Gaze x={46} y={30} gap={20} size={4.7}/><g fill="none" stroke={paper} strokeWidth="3.5"><ellipse cx="46" cy="30" rx="8" ry="11"/><ellipse cx="66" cy="30" rx="8" ry="11"/></g><path d="M54 30h4m-8 18q8 4 15-1" fill="none" strokeWidth="1.5"/>
    <path d="M84 34 96 8l12 26v67H84z" fill={red}/><path d="M84 35h24m-24 7h24" stroke={ink} strokeWidth="2"/><path d="M84 83 76 103h8m24-20 8 20h-8" fill={red}/><path d="M95 13 91 29" stroke={paper} strokeWidth="2" opacity=".6"/>
    <path d="M72 65 86 72" stroke={paper} strokeWidth="9"/><ellipse cx="86" cy="72" rx="6" ry="5" fill={green}/>
  </>,
  romantic: <>
    <Shoes x={45} y={109} gap={28} color={pink}/><path d="M35 61q24-9 48 0l7 43H27z" fill={yellow}/><path d="m45 60 11 12 16-12m-16 12-3 13m19-25-5 23" stroke={red} strokeWidth="4" fill="none"/>
    <path d="M41 29q1-21 22-20 23 1 23 23v22q-23 18-45-1z" fill={pink}/><Gaze x={50} y={30} gap={21} size={3.2}/><path d="M46 39q-22-10-24 4-2 15 28 14h20l-2-13z" fill={pink}/><path d="M28 46h1m5 7q16 6 29 0" fill="none" strokeWidth="1.4"/>
    <path d="M31 79q13-4 28 3 16-7 31-3v22q-17-4-31 2-14-6-28-2z" fill={paper}/><path d="M59 82v21m-21-18 13 2m-13 5 13 2m15-7 16-2m-16 9 16-2" fill="none" stroke="#a7b9ba" strokeWidth="1.2"/><ellipse cx="29" cy="89" rx="5" ry="6" fill={pink}/><ellipse cx="91" cy="89" rx="5" ry="6" fill={pink}/>
    <path d="m79 75-2-9" stroke={green} strokeWidth="1.5"/><circle cx="78" cy="64" r="5" fill={red}/><path d="M76 64q3-4 5 1" fill="none" strokeWidth="1.2"/>
  </>,
  scoocher: <>
    <path d="M37 65q-10 12-9 35 0 15 28 15 35 0 37-16 0-23-13-37z" fill={brown}/><path d="M35 86 30 105m52-20 4 21" stroke="#7c5e3d" strokeWidth="1.7"/><ellipse cx="39" cy="108" rx="15" ry="7" fill={brown}/><ellipse cx="78" cy="109" rx="14" ry="6" fill={brown}/>
    <path d="M35 35Q17 15 7 34l-1 24q12-3 21-15l13 5m38-15q18-16 31 2l4 23q-12-1-22-15l-12 4" fill={brown}/><path d="M29 38q2-26 31-25 30-1 31 26l-3 25q-27 18-54 0z" fill={brown}/>
    <path d="m34 22 9-8 7 4 9-7 9 6 9-3 9 12" fill={brown}/><Gaze x={46} y={41} gap={26} size={3.3}/><path d="M41 37h12m13-1h12" stroke={brown} strokeWidth="4"/><ellipse cx="59" cy="54" rx="10" ry="6" fill="#7c5e3d"/>
    <path d="M46 66q12 7 25 0" fill="none" strokeWidth="1.7"/><path d="M55 69h12v13q-1 10-9 6-6-3-3-19z" fill={pink}/><path d="M61 72v10" stroke="#ae6084" strokeWidth="1.3"/><path d="m39 78 5 7m31-6-5 7M51 97l5 7" fill="none" stroke="#7c5e3d" strokeWidth="1.5"/>
  </>,
  sisyphus: <>
    <Shoes x={44} y={109} gap={29} color={skin}/><path d="M35 54q23-9 47 0l8 48q-28 10-60 0z" fill={paper}/><path d="M36 59q7 29 44 40M48 56q0 24 32 35M37 89l-1 10" fill="none" stroke="#c9cabe" strokeWidth="1.6"/>
    <path d="M38 65 24 55l-8-22m64 33 16-13 4-21" fill="none" stroke={skin} strokeWidth="9"/><ellipse cx="15" cy="31" rx="5" ry="8" fill={skin}/><ellipse cx="101" cy="30" rx="5" ry="8" fill={skin}/>
    <path d="M39 28q0-20 21-20 24 0 23 24v24q-21 18-44-1z" fill={skin}/><Gaze x={49} y={29} gap={22} size={3.3}/><path d="M51 39q-15-6-19 4-2 10 22 12h14V45z" fill={skin}/><path d="M43 53q12 6 24-1" fill="none" strokeWidth="1.5"/>
    <path d="m45 13-4-6m13 3-1-7m10 7 2-7m7 9 4-6" stroke={paper} strokeWidth="3"/><path d="m34 62 6 11m38-14-4 13" fill="none" strokeWidth="1.4"/>
  </>,
  skipper: <>
    <Shoes x={44} y={109} gap={29} color={yellow}/><path d="M34 56q26-9 50 0l7 47H28z" fill={yellow}/><path d="M59 61v40m-20-7h10m23 0h9" stroke="#bba35e" strokeWidth="1.5"/>
    <path d="M39 27q21-14 42 0v26q-20 17-42-1z" fill={skin}/><Gaze x={49} y={31} gap={20} size={3}/><path d="M47 41q-12-5-15 3-1 10 19 10h16V47z" fill={skin}/><path d="M43 52q12 4 23-1" fill="none" strokeWidth="1.5"/>
    <path d="M35 27q0-21 25-21 25 0 26 21l5 5H30z" fill={yellow}/><path d="M32 29h57m-46-14q6-4 11-4" fill="none" strokeWidth="1.6"/>
    <path d="M35 67 25 82l12 8m47-23 12 16-15 7" fill="none" stroke={yellow} strokeWidth="8"/><circle cx="58" cy="85" r="21" fill="none" stroke={pink} strokeWidth="5"/><path d="M58 62v46M35 85h46M42 69l32 32M74 69 42 101" stroke={pink} strokeWidth="2.5"/><circle cx="58" cy="85" r="4" fill={yellow}/><ellipse cx="36" cy="85" rx="5" ry="6" fill={skin}/><ellipse cx="81" cy="85" rx="5" ry="6" fill={skin}/>
  </>,
  stickler: <>
    <ellipse cx="59" cy="105" rx="35" ry="10" fill={pink}/><ellipse cx="60" cy="95" rx="30" ry="9" fill={pink}/><ellipse cx="60" cy="86" rx="23" ry="9" fill={pink}/>
    <path d="M39 39q0-21 22-21 22 0 22 22v43q-23 14-44-1z" fill={pink}/><path d="M43 22 42 8l7 3 2 12m3-1V5l7 2v16m4-1 5-14 6 5-4 12" fill={blue}/><Gaze x={50} y={35} gap={20} size={3.3}/>
    <path d="M52 44q-15-6-19 3-2 11 19 14h18V50z" fill={pink}/><ellipse cx="58" cy="68" rx="7" ry="4" fill={ink}/>
    <path d="M28 75h55v24H28z" fill={orange}/><path d="M33 79h44v16H33z" fill={paper} strokeWidth="1.2"/><path d="M38 83h33m-33 4h33m-33 4h25" stroke={blue} strokeWidth="1.1"/>
    <path d="M39 77 28 83m52-5 10 8-8 8" stroke={pink} strokeWidth="6" fill="none"/>
  </>,
  suckerfish: <>
    <path d="M78 51 109 38l-4 17 8 20-32-6M52 38l7-23 7 14 7-15 5 26" fill={green}/><path d="m58 20 5 2m4-3 5 3m-18 5 5 2" stroke={red} strokeWidth="4"/>
    <ellipse cx="60" cy="62" rx="35" ry="26" fill={green}/><path d="m59 78-8 21 16-10m13-13 11 17-1-23" fill={green}/><path d="m82 56 8 7-9 7" fill={darkGreen}/>
    <Gaze x={49} y={48} gap={23} size={3.7}/><ellipse cx="28" cy="66" rx="18" ry="21" fill={orange}/><ellipse cx="27" cy="66" rx="11" ry="15" fill={ink}/><path d="M18 55q4-7 10-6" stroke={paper} strokeWidth="2" fill="none" opacity=".6"/><path d="m55 68 7 5m4-12 8 5" stroke={darkGreen} strokeWidth="1.5"/>
  </>,
  'third-wheel': <>
    <path d="M82 69q25 10 22-11" fill="none" stroke={yellow} strokeWidth="4"/><circle cx="60" cy="96" r="18" fill={ink}/><circle cx="60" cy="96" r="11" fill={grey}/><path d="M60 85v22M49 96h22m-19-8 16 16m0-16-16 16" stroke="#849f9b" strokeWidth="1.5"/><circle cx="60" cy="96" r="3" fill={orange}/>
    <path d="M39 52q22-9 44 0l3 31q-24 9-49 0z" fill={red}/><path d="M39 61h44m-45 10h47m-46 10h45" stroke={pink} strokeWidth="4"/>
    <path d="m40 59-13 13-6-15m60 2 13 10" stroke={yellow} strokeWidth="6" fill="none"/><circle cx="21" cy="54" r="4" fill={yellow}/>
    <circle cx="43" cy="19" r="11" fill={yellow}/><circle cx="80" cy="18" r="10" fill={yellow}/><circle cx="43" cy="19" r="5" fill={pink} stroke="none"/><path d="M40 24q19-17 39 0v24q-19 18-39 0z" fill={yellow}/><Gaze x={50} y={28} gap={19} size={3.2}/><path d="M46 36q-18-4-23 4-2 11 21 13h23V43z" fill={yellow}/><ellipse cx="24" cy="43" rx="5" ry="4" fill={skin}/><path d="M39 50q10 5 19 0" fill="none" strokeWidth="1.4"/>
  </>,
  twin: <>
    <path d="M23 91Q7 106 6 90m94 0q17 16 17-1" fill="none" stroke={yellow} strokeWidth="4"/>
    <path d="M16 62q19-9 37 0l3 42H12z" fill={paper}/><path d="M16 70h36m-37 11h38m-39 12h40" stroke={ink} strokeWidth="5"/><path d="M66 62q19-9 37 0l5 42H62z" fill={pink}/>
    <path d="M18 29q-1-21 17-21 21 0 21 22v24H18zM67 29q0-21 19-21 20 0 20 22v24H67z" fill={yellow}/><Gaze x={27} y={29} gap={15} size={3}/><Gaze x={76} y={29} gap={15} size={3}/>
    <path d="M25 38q-15-4-17 5-2 12 22 13h19V44zM75 38q-15-4-17 5-2 12 22 13h19V44z" fill={yellow}/><path d="M19 50q11 4 22 0m29 0q11 4 21 0" fill="none" strokeWidth="1.3"/>
    <path d="M16 73 9 86m43-12 5 11m10-12-6 13m41-12 7 12" stroke={yellow} strokeWidth="5"/><Shoes x={25} y={109} gap={20} color={yellow}/><Shoes x={75} y={109} gap={20} color={yellow}/>
  </>,
};
