import type { ReactNode } from 'react';
import { Eyes as InkyEyes } from './expansion-portrait-parts.js';

// Hand-authored flat portraits; silhouettes and signature props follow the
// Second Wind references, using the original project's bold ink vocabulary.
const ink = '#191919', paper = '#fffdf4', yellow = '#ffda27', orange = '#f19a2b', pink = '#ef83b6', purple = '#8656a4', blue = '#478ac4', green = '#168a55', olive = '#a6a34c', cream = '#dfe5cb', brown = '#a07b46';
function Eyes({ x = 47, y = 50, gap = 22, rx = 7, ry = 9, look = 1.4 }: { x?: number; y?: number; gap?: number; rx?: number; ry?: number; look?: number }) {
  return <InkyEyes x={x} y={y} gap={gap} rx={rx * .9} ry={ry * .9} look={look} />;
}
function Die({ x, y, color, angle = 0 }: { x: number; y: number; color: string; angle?: number }) { return <g transform={`translate(${x} ${y}) rotate(${angle})`}><rect x="-9" y="-9" width="18" height="18" rx="2" fill={color} /><g fill={ink} stroke="none"><circle cx="-4" cy="-4" r="1.9" /><circle cx="4" cy="4" r="1.9" /><circle r="1.9" /></g></g>; }

export const SECOND_WIND_PORTRAITS_B: Record<string, ReactNode> = {
  kraken: <>
    <g fill={pink}>
      <path d="M47 48C36 33 17 43 12 30 7 17 25 11 29 23c3 8-7 11-9 5 13 18 29-3 41 15z" />
      <path d="M72 48c12-15 29-6 31-20 2-11-12-14-15-5-2 6 5 9 8 4-7 17-25 1-34 16z" />
      <path d="M45 66C29 48 9 57 10 74c1 12 16 12 19 4 2-6-5-9-8-4 2-15 17-1 24 5z" />
      <path d="M76 65c16-17 32-9 34 5 2 12-10 16-15 10-4-4 0-10 5-7-6-12-16 1-22 7z" />
      <path d="M48 78c-15-2-23 9-19 23 4 15 18 10 16 2-1-5-6-6-9-2-1-10 8-10 16-9z" />
      <path d="M70 78c15-3 26 6 24 20-3 17-19 16-19 6 0-6 7-7 9-2 2-10-8-12-17-10z" />
      <path d="M52 80c-9 4-7 19-19 16-12-3-17 8-7 13 8 4 12-3 7-6 17 6 23-9 26-18z" />
      <path d="M65 81c8 5 7 18 18 16 12-1 17 8 8 13-7 4-13-1-8-5-18 2-20-11-23-20z" />
      <path d="M61 15C47 25 36 44 39 65c0 18 11 27 24 24 22-1 27-23 15-43L69 24z" />
    </g>

    <Eyes x={51} y={68} gap={22} rx={8} ry={9} look={-2} /><path d="m43 59 16 4m6-2 16-7M55 82q9-6 17-1" fill="none" />
    <g fill={purple} strokeWidth="1.6"><ellipse cx="13" cy="68" rx="3" ry="4" /><ellipse cx="21" cy="60" rx="3" ry="4" /><ellipse cx="103" cy="64" rx="3" ry="4" /><ellipse cx="100" cy="33" rx="3" ry="4" /><ellipse cx="31" cy="94" rx="3" ry="4" /><ellipse cx="88" cy="94" rx="3" ry="4" /><ellipse cx="43" cy="100" rx="3" ry="4" /><ellipse cx="76" cy="101" rx="3" ry="4" /></g>
    <path d="m53 37 2-7m4 21 1-6m12-6 3 6m-32 9-4-3m45 8 4-3M37 92l4-4m38 1 5 3" fill="none" stroke={paper} strokeWidth="1.2" opacity=".65" /><g fill={purple} stroke="none"><circle cx="53" cy="52" r="1.1" /><circle cx="58" cy="47" r="1" /><circle cx="72" cy="46" r="1.2" /><circle cx="49" cy="43" r="1.1" /></g>
  </>,
  'le-saboteur': <>
    <path d="M28 79q29-13 59-2l11 33H22z" fill={paper} /><path d="m26 88 66-1m-70 14h74" stroke={ink} strokeWidth="9" />
    <path d="M35 33q1-19 20-18l21 3q13 5 12 19 24-3 22 13 0 22-40 27-43 2-41-22z" fill={green} />
    <path d="M35 32q-5-17 12-24 13-5 25 5L54 27z" fill={ink} /><path d="m55 9 1-4 6 1" fill="none" />
    <Eyes x={57} y={33} gap={21} rx={6.5} ry={8} look={-2} /><path d="m54 23 13-4m12 1 11 2" fill="none" />
    <path d="M40 49q25 22 61 6-4 17-32 17-18 0-29-23z" fill="#ed4f36" /><path d="m44 54 6 9 5-5 6 10 6-7 7 8 7-8 6 4 5-9" fill={paper} />
    <path d="M89 43q4-5 8 0m-17 6q5 3 8-1" fill="none" />
    <path d="m23 88-8-19 6-4 8 14 3-14q3-7 7-1l-1 26-8 7z" fill={yellow} />
    <path d="m87 90 17 12-3 8-19-9M35 111h10m30 0h11" fill={yellow} />
    <path d="M38 18q3-8 13-8m19 64 5 0m13-6 5-3M28 81l5-4m47 0 5 3" fill="none" stroke={paper} strokeWidth="1.1" opacity=".7" /><path d="m35 100 5 4m39-4-5 4" fill="none" stroke="#9da9a6" strokeWidth="1.2" />
  </>,
  'magical-athlete': <>
    <path d="M43 102v8H32q-1 5 20 4l5-12m14 0v8h13q2 5-19 4l-4-12" fill={brown} />
    <path d="M37 59q22-10 43 0l10 47H28z" fill={blue} /><path d="m38 66-16 4-5-20m63 16 15 11-5 11" fill="none" stroke={blue} strokeWidth="10" />
    <path d="M42 35q18-11 36 0v23q-17 17-37-1z" fill={orange} /><Eyes x={51} y={51} gap={18} rx={5} ry={7} /><path d="M51 62q10 4 19-1" fill="none" strokeWidth="1.4" />
    <path d="M35 35 59 5l10 14 12 17z" fill={blue} /><path d="M29 35q28-6 56 0v7H29z" fill={blue} />
    <path d="m58 18 2 4 5 1-4 3 1 5-4-3-4 2 1-4-4-3 5-1zM48 78l4 7 8 1-6 5 1 8-7-4-6 4 1-8-6-5 8-1zM72 61l2 5 6 1-4 3 1 6-5-3-4 2 1-5-4-3 5-1z" fill={yellow} strokeWidth="1.2" />
    <path d="M17 103V23" fill="none" stroke={ink} strokeWidth="5" /><path d="M17 103V23" fill="none" stroke={purple} strokeWidth="3" /><ellipse cx="18" cy="53" rx="5" ry="6" fill={orange} /><ellipse cx="92" cy="87" rx="5" ry="6" fill={orange} />
    <path d="M40 100h39M34 80l6-12m41 13 3 14M40 36q16-3 36 0m-20-18 4-6" fill="none" stroke={paper} strokeWidth="1.2" opacity=".65" />
  </>,
  mole: <>
    <path d="M19 105Q15 82 26 53 34 18 63 16q38-2 40 38l5 53z" fill={orange} /><path d="M32 40 21 51l2-14 10-13m37-8 6-6 6 6 8-4 2 9" fill={orange} strokeWidth="1.5" />
    <ellipse cx="58" cy="57" rx="6" ry="9" fill={paper} /><ellipse cx="83" cy="56" rx="6" ry="9" fill={paper} /><g fill={ink} stroke="none"><ellipse cx="60" cy="61" rx="2" ry="4" /><ellipse cx="85" cy="60" rx="2" ry="4" /></g><path d="m52 43 8-4m19 0 8 4" fill="none" />
    <ellipse cx="76" cy="71" rx="10" ry="12" fill="#ed8d92" /><ellipse cx="73" cy="72" rx="1.4" ry="3" fill={ink} stroke="none" /><ellipse cx="80" cy="72" rx="1.4" ry="3" fill={ink} stroke="none" />
    <path d="M66 83h9v13h-9zm10 0h9v13h-9z" fill={paper} strokeWidth="1.4" />
    <path d="M66 70 29 62m36 14-37 4m39-1-31 16M85 69l23-10M86 75l25 5M86 80l19 15" fill="none" strokeWidth="1.8" />
    <ellipse cx="36" cy="105" rx="16" ry="9" fill="#e69bb3" /><ellipse cx="89" cy="105" rx="16" ry="9" fill="#e69bb3" /><path d="M29 103v4m7-4v4m46-4v4m7-4v4" fill="none" stroke="#b86f86" strokeWidth="1" />
    <path d="M36 32q7-10 17-11m31 4 8 8m-56 19-3 7m-3 27 4 3m61-37 2 8M46 94l3 3" fill="none" stroke={paper} strokeWidth="1.2" opacity=".65" /><path d="m26 46 3 4m64-7 3 4m-68 62h8m9-1h8m28 0h8m12-3 5 2" fill="none" stroke="#8d6b48" strokeWidth="1.2" />
  </>,
  'mr-dice-guy': <>
    <path d="M43 102v8H31q-1 5 20 4l4-12m14 0 1 8h13q1 5-19 4l-4-12" fill={blue} />
    <path d="M34 62q25-11 50 0l5 42q-28 9-58 0z" fill={blue} /><path d="m37 71-12 11m56-11 13 11" fill="none" stroke={blue} strokeWidth="9" /><circle cx="25" cy="81" r="5" fill={olive} /><circle cx="94" cy="81" r="5" fill={olive} />
    <path d="M38 35q23-15 44 0v22q-20 21-44 0z" fill={olive} /><Eyes x={49} y={50} gap={21} rx={5} ry={7} /><path d="M49 62q12 4 22-1" fill="none" strokeWidth="1.5" />
    <path d="M39 14h42l4 20H35z" fill={purple} /><path d="M29 34q29-6 62 0v7H29z" fill={purple} /><path d="M43 27h35" fill="none" stroke={blue} strokeWidth="3" />
    <path d="m47 64 12 6-12 7zm24 0-12 6 12 7z" fill="#e46d4d" strokeWidth="1.2" /><circle cx="59" cy="70" r="3" fill="#e46d4d" />
    <Die x={18} y={19} color="#7eb478" angle={-12} /><Die x={101} y={18} color={paper} angle={12} /><Die x={15} y={56} color={yellow} angle={-9} /><Die x={104} y={54} color="#e46d4d" angle={13} />
    <path d="M59 79v24m-23-5h12m23 0h13M44 18h31" fill="none" stroke={paper} strokeWidth="1.2" opacity=".65" /><g fill={yellow} stroke="none"><circle cx="64" cy="85" r="1.5" /><circle cx="64" cy="95" r="1.5" /></g>
  </>,
  mush: <>
    <path d="M21 59Q9 29 33 13q24-14 38 10 27-12 36 12 11 24-5 41-3 34-38 37-33 4-44-25-4-15 1-29z" fill="#77b4b7" />
    <path d="M27 56q10-4 17 2m30-28q-5 9-4 19m24 26q-12-4-23 2" fill="none" stroke="#589599" strokeWidth="1.4" />
    <Eyes x={30} y={38} gap={16} rx={4.5} ry={6} look={0} /><path d="M31 52q8-7 16 0" fill="none" strokeWidth="1.4" />
    <Eyes x={77} y={49} gap={16} rx={4.5} ry={6} look={0} /><path d="M77 64q9 7 16-1" fill="none" strokeWidth="1.4" />
    <Eyes x={44} y={84} gap={21} rx={5} ry={6.5} look={0} /><ellipse cx="56" cy="99" rx="4.5" ry="5.5" fill={ink} strokeWidth="1" />
    <path d="M27 27q4-10 13-11m39 17 8 2M28 78q-3 9 2 16" fill="none" stroke={paper} strokeWidth="1.3" opacity=".55" /><path d="M65 107q15-3 20-11" fill="none" stroke="#589599" strokeWidth="1.2" />
  </>,
  nemesis: <>
    <path d="M35 67q22-7 43 0l14 42H22l5-30z" fill={cream} /><path d="m38 69 8 19 20 20M52 73l10 12 12-14m-28 17-8 19m36-23 10 24" fill="none" />
    <path d="M35 39q-4-24 22-27 30-2 30 24L75 61 42 62z" fill={cream} />
    <g fill={cream}><circle cx="36" cy="29" r="10" /><circle cx="42" cy="17" r="9" /><circle cx="55" cy="12" r="9" /><circle cx="69" cy="15" r="10" /><circle cx="80" cy="23" r="9" /><circle cx="85" cy="36" r="8" /><circle cx="32" cy="41" r="9" /></g>
    <g fill="none" strokeWidth="2"><path d="M35 26q-9 6-1 9 7 1 5-5m2-16q-7 4 0 8 6 2 5-4m10-8q-5-4-7 2-1 5 5 4m14-2q8 2 4 8-5 3-7-2m15 4q-6-3-7 3 0 5 6 4m4 5q7 5 1 9-6 1-4-4m-48-3q-8 4-1 8 6 2 5-4" /></g>
    <path d="M45 30q16-9 29 2l-2 17 6 7-13 2-2 12-19-5-6-14z" fill={cream} /><path d="m46 42 7-3m9 1 8 1m-16 1-2 9 9 2m-8 8q7-8 12-1l-1 7-10-1z" fill="none" strokeWidth="2.6" /><path d="m47 45 4 1m12-1 4-1" strokeWidth="3.5" />
    <path d="m96 8 6 9-7 66-7-1z" fill="#e5e8d4" /><path d="m90 19 5 0-6 57" fill="none" stroke="#a6ad99" strokeWidth="2" /><path d="m83 83 18 2m-11 0-1 22" stroke="#7f846d" strokeWidth="5" />
    <path d="m76 76 9 1 3 11q10 5 12-3l-3-9-9-2M29 82l-9 14 17 8" fill={cream} />
    <path d="M43 77l8 9-3 12m17-8 7 12m-36-9-5 11m31-4 3 7M51 34h8m2 20 5 0m-20 9 3 1" fill="none" stroke="#a5ad92" strokeWidth="1.1" /><path d="m97 20 1 6m-6 65-1 12" fill="none" stroke={paper} strokeWidth="1.1" />
  </>,
  'nepo-baby': <>
    <path d="M43 99v9H32q-1 6 20 5l5-13m13-1v9h13q3 6-18 5l-4-13" fill={blue} />
    <path d="M34 65q25-11 50 0l5 35q-27 13-59 0z" fill={blue} /><path d="m36 74-14 10m61-10 13 10" fill="none" stroke={blue} strokeWidth="9" /><circle cx="23" cy="83" r="5" fill={pink} /><circle cx="95" cy="83" r="5" fill={pink} />
    <circle cx="33" cy="49" r="7" fill={pink} /><circle cx="86" cy="49" r="7" fill={pink} /><ellipse cx="59" cy="50" rx="26" ry="27" fill={pink} /><Eyes x={48} y={49} gap={23} rx={5} ry={7} look={0} />
    <path d="M42 9h34l9 29q-26 8-52 0z" fill={blue} /><ellipse cx="59" cy="10" rx="17" ry="3" fill="#88b4d0" strokeWidth="1.3" /><path d="M36 36q22 5 46 0" fill="none" stroke="#6d9dbf" strokeWidth="1.3" />
    <ellipse cx="59" cy="64" rx="11" ry="7" fill="#e79c57" /><ellipse cx="59" cy="65" rx="4" ry="3.5" fill={paper} strokeWidth="1.2" />
    <path d="M44 76v20m29-20v20M40 97h38" fill="none" stroke="#315f8c" strokeWidth="3" /><circle cx="44" cy="81" r="3" fill={orange} strokeWidth="1" /><circle cx="73" cy="81" r="3" fill={orange} strokeWidth="1" />
    <path d="M96 84 99 57" fill="none" stroke="#99aaa7" strokeWidth="3" /><circle cx="100" cy="49" r="8" fill="#dbe3dd" /><path d="m96 46 7 1m-8 4 7 1" fill="none" stroke="#99aaa7" strokeWidth="1.2" /><ellipse cx="96" cy="83" rx="4.5" ry="5" fill={pink} />
    <path d="m38 88-1 9m44-9 2 9M47 15h8" fill="none" stroke={paper} strokeWidth="1.2" opacity=".6" />
  </>,
  null: <>
    <path d="M59 7q19-3 31 23 12 27 7 60-3 24-36 25-34 0-38-24-7-30 5-57Q39 9 59 7z" fill="#1e2022" />
    <g fill="#59605b" stroke="none"><circle cx="41" cy="30" r=".9" /><circle cx="73" cy="26" r=".9" /><circle cx="34" cy="50" r=".8" /><circle cx="86" cy="53" r=".8" /><circle cx="35" cy="83" r="1" /><circle cx="80" cy="94" r="1" /><circle cx="59" cy="105" r=".9" /></g>
    <Eyes x={53} y={65} gap={14} rx={3.5} ry={4.5} look={0} /><path d="M38 29q5-9 11-12m35 23 3 8M29 80q-1 15 6 20" fill="none" stroke="#3a4540" strokeWidth="1.1" />
  </>,
  overtaker: <>
    <path d="M41 100v10H29q-1 6 20 4l5-13m17-1v10h13q2 6-19 4l-4-13" fill={brown} />
    <path d="M34 56q24-10 49 0l5 48q-26 8-58 0z" fill="#a9875d" /><path d="m36 65-14 13m59-13 15 13" fill="none" stroke="#a9875d" strokeWidth="9" /><circle cx="22" cy="78" r="4.5" fill={blue} /><circle cx="96" cy="78" r="4.5" fill={blue} />
    <path d="M38 28q21-13 43 0v25q-20 18-43 0z" fill={blue} /><Eyes x={49} y={38} gap={21} rx={5} ry={7} look={-1} /><ellipse cx="59" cy="48" rx="11" ry="7" fill={blue} /><path d="M49 59q11 3 22-1" fill="none" strokeWidth="1.2" />
    <path d="M33 28q-1-23 25-22 29-1 29 24L73 36H44z" fill={cream} /><path d="M38 18q20 6 42 0m-42 8q23 7 43-1m-33-15 8-1" fill="none" stroke="#b3b494" strokeWidth="1.2" />
    <path d="M16 109V28" fill="none" stroke={brown} strokeWidth="4" /><path d="M8 13q9-10 18 0l1 11-5 6H12l-6-6z" fill={cream} /><g fill={ink} stroke="none"><ellipse cx="12" cy="19" rx="2.5" ry="3" /><ellipse cx="21" cy="19" rx="2.5" ry="3" /><path d="m16 24 2 0-1 3z" /></g>
    <path d="M101 38v56" fill="none" stroke={brown} strokeWidth="3.5" /><path d="M94 92h15v17q-7 9-15 0z" fill="#b9c3b8" /><path d="M101 95v13" fill="none" stroke={paper} strokeWidth="1.2" />
    <path d="M43 64l-4 34m38-34 5 34M55 66v36m-18 2h44m-66-77h6" fill="none" stroke="#876b48" strokeWidth="1.2" />
  </>,
  'party-pooper': <>
    <path d="M30 88q29-17 58 0l6 23H25z" fill={pink} /><path d="m37 88-2 22m23-26 2 27m17-23 6 22" stroke={green} strokeWidth="8" />
    <path d="M34 45 36 27l19 14q15-6 28 2l17-8-3 24q12 34-21 36-34 8-48-15-10-17 6-35z" fill={yellow} />
    <path d="M38 34q-3-24 19-25 25 0 31 25l-13 9-31-1q-7-12-21 1l-8 14-6-7q6-27 29-16z" fill={green} /><path d="M48 13q-1 10 7 26" fill="none" stroke="#a2c878" strokeWidth="1.2" /><path d="m36 37 51-3 1 10-48 4z" fill={pink} /><circle cx="16" cy="55" r="9" fill={pink} />
    <Eyes x={51} y={59} gap={22} rx={6} ry={8} look={1} /><path d="m43 48 14 5m10-1 14-3" fill="none" /><path d="m57 68 20-1-10 17z" fill="#348bbb" /><path d="m67 84 0 7m-12-1q7-4 12 1 7-4 13-1" fill="none" strokeWidth="2.6" />
    <path d="M87 81q3-12 10-6l-1 5q11-4 12 4l-1 12-17 1-7-7q-4-6 4-9z" fill={yellow} />
    <path d="m21 70-2 29h10l1-29z" fill="#c8d9a5" /><path d="M21 69q-7-8 4-17 5 10 2 16z" fill="#f29b32" /><path d="M15 100h22l-5 9H18zm1 1q-13-4-9 5 3 4 10 1" fill={brown} />
    <path d="m45 18 4-3m32 9 2 4m-61 17-3 6M44 94l1 11m23-13 2 13m20-26 3 5m4 1 0 6" fill="none" stroke={paper} strokeWidth="1.1" opacity=".7" /><path d="M24 76v18m-3 11h8" fill="none" stroke={yellow} strokeWidth="1.2" />
  </>,
  penguin: <>
    <path d="M39 58Q19 50 17 14q-13 26 0 56l20 18m43-30q20-8 22-44 13 26 0 56L82 88" fill={purple} />
    <path d="M40 100q-12 5-15 12 17 6 31 0m9-12q15 4 20 12-13 7-28 0" fill={orange} />
    <path d="M37 39q1-21 23-21 24 0 26 22l7 43q1 27-32 28-32 0-34-26z" fill={purple} />
    <path d="M43 92q15 13 34 0-3 17-16 18-13-1-18-18z" fill={paper} strokeWidth="1.2" />
    <Eyes x={49} y={43} gap={22} rx={5} ry={7} look={0} /><ellipse cx="61" cy="57" rx="15" ry="5.5" fill={orange} strokeWidth="1.5" />
    <path d="M40 26 45 14h29l7 12q-20 8-41 0z" fill={brown} /><path d="M43 14q16 5 33 0m-33 11h32" fill="none" stroke="#c5a374" strokeWidth="1.3" />
    <g fill={ink} stroke="none"><circle cx="63" cy="73" r="1.6" /><circle cx="63" cy="84" r="1.6" /><circle cx="63" cy="95" r="1.6" /></g><path d="m17 31 2 13m85-13-2 13M35 78q-1 12 3 18m46-14-1 12" fill="none" stroke="#b69acc" strokeWidth="1.3" /><path d="M51 56h11m-27 54h8m24 0h8" fill="none" stroke={paper} strokeWidth="1.1" opacity=".6" />
  </>,
};
