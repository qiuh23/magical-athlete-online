import type { ReactNode } from 'react';
import { Eyes, yellow, red, blue, pink, green, paper, ink, orange, purple, brown, grey } from './expansion-portrait-parts.js';


function ModelFeet({x, y, gap, color}: {x: number; y: number; gap: number; color: string}) {
  return <g fill={color} strokeWidth="1.7" transform={'translate(' + x + ' ' + y + ')'}>
    {[0, gap].map((offset, index) => <g key={offset} transform={'translate(' + offset + ' 0)'}>
      <path d={index ? 'M-4 0h8v10q10 0 11 6H-5z' : 'M-4 0h8v16H-15q1-6 11-6z'} />
      <path d={index ? 'M-2 13h11' : 'M-10 13H1'} stroke={paper} strokeWidth=".8" opacity=".6" />
    </g>)}
  </g>;
}

// Independently drawn silhouettes, using the model's identifying costume and props.
export const EXTRA_MILE_PORTRAITS: Record<string, ReactNode> = {
  'extra-mile-broken-clock': <>
    <ModelFeet x={43} y={94} gap={33} color={brown} />
    <path d="M24 64 12 73m84-10 12 9" fill="none" stroke={brown} strokeWidth="5" />
    <path d="M60 24C39 24 22 41 22 62s17 38 38 38 38-17 38-38V49H86V36H75v-9q-7-3-15-3z" fill={yellow} />
    <path d="M47 30q-20 8-20 32 0 33 33 33 27 0 32-26" fill="none" stroke={orange} strokeWidth="2.2" />
    <path d="M60 35v4m24 22h-4m-44 0h4m20 26v-4m-20-42 3 3m34 33 3 3m0-39-3 3m-34 33-3 3" fill="none" strokeWidth="1.6" />
    <path d="M39 28V18q21-16 42 0v10z" fill={ink} /><path d="M40 23h40" fill="none" stroke={grey} strokeWidth="1.5" /><path d="M29 29h62" fill="none" strokeWidth="5" />
    <path d="m60 33-7 10 8 7-5 12m31-28-5 8 7 4-4 8" fill="none" strokeWidth="1.6" />
    <Eyes x={46} y={54} gap={27} small />
    <path d="m60 63 3 8 12 3" fill="none" strokeWidth="2.5" /><circle cx="60" cy="63" r="2" fill={orange} />
    <path d="M59 73q-12-9-19 2 10 7 20 1 10 7 20-1-8-11-20-2z" fill={ink} strokeWidth="1.5" />
    <path d="M29 46q-5 12-3 22m62 5-4 9" fill="none" stroke={paper} strokeWidth="1.3" opacity=".8" /><path d="M23 56v11m74-11v11m-42 24h10" fill="none" stroke={brown} strokeWidth="1.1" />
  </>,
  'extra-mile-cletus': <>
    <ModelFeet x={44} y={97} gap={29} color={brown} />
    <path d="M35 88h46v18H63V95h-9v11H35z" fill={blue} />
    <path d="m37 64-8 30h58l-9-30z" fill={red} />
    <path d="M36 38 44 6h25l13 32z" fill={brown} /><path d="M32 38q25 5 55 0" fill="none" strokeWidth="3" />
    <path d="M35 40q24-8 47 0l2 20q-1 18-26 16-24-2-23-20z" fill={pink} /><Eyes x={47} y={47} gap={22} small />
    <path d="M57 57h23q5 11-15 12m-18-7h10" fill={pink} />
    <path d="m35 78 28 12 27-23m-19 22 17 9 21-44-9-5-18 37" fill={brown} />
    <path d="m90 71 14-29m-9 32 14-29" stroke={grey} strokeWidth="5" /><path d="m34 76 18 8m29-9-13 10" fill="none" stroke={pink} strokeWidth="6" />
    <path d="M47 12h17m-21 8 27 0m-29 53-3 10m36-9 4 9M38 88h12m13 0h15" fill="none" strokeWidth="1.1" /><path d="m101 49 5-9" fill="none" stroke={paper} strokeWidth="1.3" />
  </>,
  'extra-mile-doc-paradox': <>
    <ellipse cx="87" cy="61" rx="23" ry="46" fill="none" stroke={green} strokeWidth="8" /><path d="M92 18q18 13 17 43t-17 43" fill="none" stroke="#6f955b" strokeWidth="1.5" />
    <ModelFeet x={38} y={96} gap={25} color={brown} />
    <path d="m29 64-9 38h55L64 64z" fill={paper} />
    <path d="M24 38q-4-29 28-31 21-1 25 25l-11-8-2 12-9-12-2 10-10-9-3 13z" fill={paper} />
    <path d="M27 32q18-10 37 4v25q-16 18-36-1z" fill="#87bbd6" /><Eyes x={37} y={43} gap={19} small />
    <g fill="none" stroke={grey} strokeWidth="2"><circle cx="37" cy="43" r="8" /><circle cx="56" cy="42" r="8" /><path d="M45 42h3" /></g>
    <path d="M35 61q10 6 20-1m-23 9 11 18 13-18M22 78 11 70m56 8 15-18" fill="none" />
    <path d="m15 70-5-2m68-7 5-4" stroke="#87bbd6" strokeWidth="5" />
    <path d="M30 72v13l9-3m22-11 2 13-10-3M29 91h10v8H27z" fill="none" strokeWidth="1.2" />
    <rect x="62" y="66" width="13" height="24" rx="2" fill="#bc976d" /><path d="M65 71h7m-7 4h6" stroke={paper} strokeWidth="1.1" /><path d="M31 92v-7m4 7v-5" stroke={red} strokeWidth="1.3" />
  </>,
  'extra-mile-doctor-dice': <>
    <ModelFeet x={43} y={96} gap={32} color={blue} />
    <path d="M28 57 15 72m74-15 14 15" fill="none" stroke={blue} strokeWidth="7" />
    <path d="m12 70-3 7 5 5 7-5-2-7m80 0-2 7 7 5 5-5-3-7" fill={blue} strokeWidth="2" />
    <path d="m30 31 10-7h48l7 8v58l-7 8H30z" fill={grey} /><rect x="26" y="32" width="62" height="64" rx="8" fill={paper} />
    <path d="m89 35 4-3m-4 57 4-3" fill="none" strokeWidth="1.3" />
    <g fill={ink} stroke="none"><circle cx="36" cy="41" r="3" /><circle cx="78" cy="41" r="3" /><circle cx="36" cy="86" r="3" /><circle cx="78" cy="86" r="3" /></g>
    <Eyes x={44} y={54} gap={26} small /><path d="M47 70q11 6 21-1" fill="none" strokeWidth="1.8" />
    <path d="M37 33v-8h42v8" fill="none" stroke={grey} strokeWidth="4" /><circle cx="59" cy="23" r="11" fill={grey} /><circle cx="59" cy="23" r="7" fill={paper} strokeWidth="1.5" /><circle cx="59" cy="23" r="2.3" fill={grey} stroke="none" />
    <path d="M42 69v12q0 11 11 11 10 0 10-11v-6" fill="none" stroke={blue} strokeWidth="2.8" /><circle cx="65" cy="75" r="4" fill={grey} strokeWidth="1.6" /><circle cx="65" cy="75" r="1.2" fill={paper} stroke="none" />
    <path d="M32 36q4-2 9-2m-11 43v6m53-27v19" fill="none" stroke={grey} strokeWidth="1" opacity=".7" />
  </>,
  'extra-mile-dom-and-gary': <>
    <path d="M40 90Q10 103 16 75q3-12 12-8" fill="none" stroke={orange} strokeWidth="8" />
    <ModelFeet x={42} y={97} gap={24} color={orange} />
    <path d="M31 61q21-14 41 0v29q-3 16-20 14-21 0-21-14z" fill={orange} />
    <path d="M28 39 29 10l18 16h14l17-17v31q-1 21-24 21T28 39z" fill={orange} />
    <path d="m33 18 9 10-9 3m33-3 7-10v15" fill={pink} strokeWidth="1.2" /><Eyes x={42} y={38} gap={23} small />
    <path d="m46 50 7 4 7-5m-7 5v5m-17-10-12-3m46 2 13-5" fill="none" />
    <path d="M68 68q10 1 14-9" fill="none" stroke={orange} strokeWidth="8" />
    <path d="M98 80q17 7 13-10" fill="none" stroke={grey} strokeWidth="3" />
    <ellipse cx="91" cy="65" rx="11" ry="17" fill={grey} /><circle cx="81" cy="41" r="8" fill={grey} /><circle cx="101" cy="41" r="8" fill={grey} /><ellipse cx="91" cy="49" rx="13" ry="12" fill={grey} />
    <Eyes x={86} y={47} gap={11} rx={3.2} ry={4.4} small /><circle cx="92" cy="55" r="2.5" fill={pink} /><path d="m85 80-3 10m15-10 3 10m-18-26-7-4m26 4 6-5" fill="none" stroke={grey} strokeWidth="4" />
    <path d="M82 40h2m15 0h2M40 78q10 8 20 0m25-20q6 3 11-1" fill="none" stroke={paper} strokeWidth="1.3" />
  </>,
  'extra-mile-echo': <>
    <path d="M105 110V15M17 19h88" fill="none" stroke={brown} strokeWidth="7" /><path d="M25 17h12m61 4 4 0" stroke={paper} strokeWidth="1.2" opacity=".65" />
    <path d="M54 20v10m11-10v10" fill="none" stroke={grey} strokeWidth="3" />
    <path d="M56 28q-12 9-17 32-6 24 7 33l13-8 13 8q14-9 8-33-5-23-17-32z" fill="#49475e" />
    <path d="M55 32q-9 25-5 49l10 7 9-8q4-23-7-48" fill="#343645" />
    <path d="M51 37q-6 25-5 40m22-40q8 23 6 40" fill="none" stroke="#9393a8" strokeWidth="1.4" />
    <path d="m46 87 2 22 9-10h8l9 10 1-22q-15-10-29 0z" fill="#49475e" />
    <Eyes x={54} y={90} gap={13} rx={3.4} ry={4.3} small /><ellipse cx="60" cy="98" rx="3" ry="2" fill={pink} strokeWidth="1" />
    <path d="m53 102 3 3 3-3m4 0 3 3 3-3" fill={paper} strokeWidth="1" />
  </>,
  'extra-mile-gingy': <>
    <path d="M41 43q-16-24 6-34 10-3 18 0l-2 7 7 1-2 7 8 2q0 10-7 17l27 12q12 8 3 18l-22-9 7 34q0 18-15 14L58 89l-11 23q-15 3-15-11l7-36-22 9q-14-7-4-18z" fill="#c88e61" />
    <Eyes x={48} y={27} gap={20} small /><path d="M46 41q13 8 23-2m-46 23 12-6m44 0 12 7M36 98l11 4m23-1 10-4" fill="none" stroke={paper} />
    <path d="m59 57-13-9v18l13-7 13 7V48z" fill={blue} /><circle cx="59" cy="73" r="4" fill={blue} /><circle cx="59" cy="86" r="4" fill={blue} />
    <path d="M102 100V47q0-15-12-12-10 4-3 13" stroke={ink} strokeWidth="9" fill="none" /><path d="M102 100V47q0-15-12-12-10 4-3 13" stroke={paper} strokeWidth="6" fill="none" /><path d="m99 59 6 5m-6 10 6 5m-6 10 6 5m-16-55 6 4" stroke={red} />
    <path d="m38 16 5-3m-2 16-2 5M18 63l5-2m65 4 4 2m-54 40 5-1m29 0 4-1" fill="none" stroke={paper} strokeWidth="1.5" /><g fill="#785237" stroke="none"><circle cx="38" cy="81" r="1.1" /><circle cx="73" cy="76" r="1.2" /><circle cx="50" cy="19" r="1" /></g>
  </>,
  'extra-mile-gluebert': <>
    <ModelFeet x={42} y={95} gap={34} color={paper} />
    <path d="M31 61Q9 61 15 78l15 5m58-22q22 1 16 17l-15 5" fill="none" stroke={paper} strokeWidth="7" /><path d="M28 64q-12 0-11 11m75-11q12 0 10 11" fill="none" stroke={grey} strokeWidth="1.2" />
    <path d="M44 29 54 7h12l8 22" fill={orange} /><path d="M42 28h35v13q13 7 13 21v31q-30 12-60 0V62q0-14 12-21z" fill={paper} />
    <rect x="33" y="57" width="54" height="31" rx="2" fill={orange} stroke={blue} strokeWidth="2.5" /><Eyes x={46} y={67} gap={27} small /><path d="M49 81q11 6 22-1M49 35h20" fill="none" />
    <path d="M57 11v13m7-13 2 13M37 45q-4 4-4 11m5 35q10 3 18 2" fill="none" stroke={grey} strokeWidth="1.1" /><path d="M38 61v5m44 14v4" stroke={paper} strokeWidth="1.3" />
  </>,
  'extra-mile-heads': <>
    <ModelFeet x={39} y={84} gap={40} color={paper} />
    <path d="M24 58 12 46m84 12 13-13" fill="none" stroke={paper} strokeWidth="5" /><circle cx="12" cy="44" r="4" fill={paper} /><circle cx="109" cy="43" r="4" fill={paper} />
    <ellipse cx="59" cy="66" rx="43" ry="20" fill={brown} /><ellipse cx="59" cy="56" rx="43" ry="19" fill={orange} />
    <path d="M27 70v5m13 0v5m19-2v6m20-10v5m13-10v5" strokeWidth="1.4" />
    <path d="M43 48V27m29 21V26" stroke={paper} strokeWidth="6" /><Eyes x={43} y={25} gap={29} rx={6} ry={11} />
    <path d="M44 60q16 10 32-1M25 53q6-8 14-9M22 57q2-13 23-15m32 1q19 4 19 13" fill="none" stroke={yellow} strokeWidth="1.4" />
    <path d="m48 53 12-6 12 6-12 9z" fill="none" stroke={yellow} strokeWidth="1.3" opacity=".7" />
  </>,
  'extra-mile-honey-pot': <>
    <ellipse cx="29" cy="44" rx="15" ry="25" transform="rotate(-25 29 44)" fill={paper} /><ellipse cx="91" cy="44" rx="15" ry="25" transform="rotate(25 91 44)" fill={paper} />
    <ellipse cx="60" cy="53" rx="27" ry="35" fill={yellow} /><path d="M35 54h50m-47 14h45" strokeWidth="8" /><Eyes x={48} y={35} gap={24} small /><path d="m49 20-7-13m29 12 8-12M51 49q10 5 18-2" fill="none" />
    <path d="M31 80q29-9 58 0l-4 24q-25 12-50 0z" fill={blue} /><ellipse cx="60" cy="81" rx="29" ry="7" fill={brown} />
    <path d="M32 79q28-8 56 0v10q-7 11-12-3-7 20-13 1-9 13-14 0-9 10-13-2z" fill={yellow} />
    <path d="M36 65 28 76m51-12 11 2" fill="none" strokeWidth="4" />
    <path d="m82 81 12-39" fill="none" stroke={brown} strokeWidth="4" /><rect x="88" y="28" width="13" height="20" rx="5" transform="rotate(16 94 38)" fill={brown} /><path d="m89 33 11 3m-12 2 11 3m-12 2 10 3" stroke={yellow} strokeWidth="1.4" />
    <path d="M25 26q-4 20 6 34m65-34q4 20-6 34M42 101q18 5 35-1" fill="none" stroke={paper} strokeWidth="1.2" />
  </>,
  'extra-mile-king-pete': <>
    <ModelFeet x={44} y={98} gap={29} color={ink} />
    <path d="M34 89h49v18H65V95h-9v12H34z" fill={purple} />
    <path d="m37 61-9 31h60l-9-31z" fill={red} /><path d="M35 68 23 78m61-10 11 7" stroke="#87bbd6" strokeWidth="6" fill="none" />
    <path d="M34 32q26-14 49 0v22q-1 23-24 21-24 0-25-20z" fill="#87bbd6" />
    <path d="m34 34-4-26 15 16 2-20 12 19L69 4l5 20L89 8l-6 26z" fill={yellow} /><path d="M35 29h47" stroke={brown} strokeWidth="1.2" />
    <Eyes x={47} y={43} gap={24} small /><path d="M48 62q11 8 22-2" fill="none" />
    <path d="m45 78 5-4v15m11-15h11L63 89" fill="none" stroke={paper} strokeWidth="2.3" />
    <path d="M94 78 100 34q1-12 10-9 5 3 1 13L99 80z" fill={brown} /><path d="m103 31 4-2M100 47l3-8" stroke={paper} strokeWidth="1.2" />
    <path d="M33 91h51m-47-21 6 3m32-3-5 3" fill="none" stroke={yellow} strokeWidth="1.2" />
  </>,
  'extra-mile-lazy-bones': <>
    <path d="M28 91V35q0-13 13-13h38q13 0 13 13v56" fill={red} /><path d="M14 69q0-10 14-8l9 19h46l8-19q15-2 15 8v38H14z" fill={red} />
    <path d="M42 35q0-19 19-19 20 0 20 20v12l-9 9H51l-9-9z" fill={paper} />
    <ellipse cx="53" cy="35" rx="5" ry="7" fill={ink} /><ellipse cx="69" cy="35" rx="5" ry="7" fill={ink} /><path d="m57 47 4-5 4 5z" fill={ink} /><path d="M52 53h18m-13-2v5m7-5v5" stroke={grey} strokeWidth="1.4" />
    <path d="M60 58v26m-13-20q13 8 27 0m-27 8q14 8 27 0m-25 8q11 6 23 0M46 60 35 73 25 69m50-9 11 12 12-2M56 84 44 96 27 108m37-24 17 12 15 11" fill="none" stroke={paper} strokeWidth="5" />
    <path d="M52 84h17l-3 7H55z" fill={paper} /><g fill={paper} strokeWidth="1"><circle cx="35" cy="73" r="3" /><circle cx="86" cy="72" r="3" /><circle cx="44" cy="96" r="3" /><circle cx="81" cy="96" r="3" /></g>
    <path d="M20 54h8v21h-8zM22 45h4v10h-4z" fill={blue} /><path d="M23 49v5m0 5v10" stroke={paper} strokeWidth="1.2" />
    <path d="M34 38q0-9 8-9m39 0q6 3 6 10M20 80v21h12m62-22v22h7" fill="none" stroke={paper} strokeWidth="1.2" opacity=".7" />
  </>,
  'extra-mile-marksman': <>
    <path d="M40 88v18l-11 5m27-23v18l10 5" fill="none" stroke={yellow} strokeWidth="4" />
    <path d="M27 92q-10-22 14-33l1-26q0-16 13-16 17 0 15 19L59 61q18 24-2 34z" fill={paper} />
    <path d="M48 19 43 7l8 7 2-10 7 12 4-8 1 15" fill={paper} /><path d="M65 31 94 41 64 47z" fill={yellow} />
    <Eyes x={48} y={30} gap={14} rx={4} ry={5.4} small /><path d="M30 66q9 16 25 12l12-14M29 84l-14 7 17 5" fill={paper} />
    <path d="M91 19q34 39 0 82" fill="none" stroke={brown} strokeWidth="5" /><path d="M91 19v82M55 61h58m-9-6 9 6-9 6m-49-6-8-5m8 5-8 5" fill="none" strokeWidth="1.7" />
    <path d="M32 69q9 8 15 8m-10-13 13 8m-8-13 9 5m-9-23v12M31 109h-8m40 0h7" fill="none" stroke={grey} strokeWidth="1.1" /><path d="M94 32q9 17 8 30m-4 18-4 10" stroke={orange} strokeWidth="1.1" fill="none" />
  </>,
  'extra-mile-moneybags': <>
    <path d="M84 87q27 13 22-5-4-9-12-1" fill="none" stroke={pink} strokeWidth="5" />
    <ModelFeet x={41} y={98} gap={33} color={green} />
    <path d="M29 65q31-14 60 0l4 28q-32 12-66 0z" fill={pink} />
    <path d="M27 88h66v17H65V95H55v10H27z" fill={green} />
    <path d="m36 29-6-12 18 5m26 0 17-7-3 17" fill={pink} /><ellipse cx="59" cy="48" rx="32" ry="27" fill={pink} />
    <path d="M39 24V5h38v19M29 26h60" fill={ink} /><path d="M42 18h32" stroke={grey} strokeWidth="1.3" />
    <Eyes x={46} y={40} gap={26} small /><ellipse cx="60" cy="57" rx="16" ry="10" fill={pink} /><path d="M54 55v4m12-4v4" strokeWidth="2.4" />
    <path d="m37 72-2 19m46-19 3 19" fill="none" strokeWidth="5" /><path d="m51 72 9 5 9-5v11l-9-5-9 5z" fill={red} strokeWidth="1.3" />
    <path d="M30 74 17 87m72-13 13 12" fill="none" stroke={pink} strokeWidth="7" /><path d="M33 91h53m-27 3v8" fill="none" strokeWidth="1.1" />
  </>,
  'extra-mile-mr-fox': <>
    <ModelFeet x={43} y={97} gap={30} color={ink} />
    <path d="M34 91h49v16H64V98H54v9H34z" fill={purple} />
    <path d="m37 66-10 33h63L79 66z" fill={purple} />
    <path d="m28 40 3-30 23 20h15L91 9l2 33-30 35z" fill={orange} /><path d="m31 42 31 12 29-12-12 23-17 12-16-11z" fill={paper} /><Eyes x={45} y={37} gap={29} small />
    <path d="m55 53 9 1-4 8z" fill={ink} /><path d="m49 63 11 5 12-5" fill="none" />
    <path d="m48 73 13 24 14-24z" fill={paper} /><path d="m61 76-4 7 4 13 5-13z" fill={ink} />
    <path d="m39 74-3 16 13-4m30-12 3 16-12-4" fill="none" strokeWidth="1.2" />
    <path d="M11 82h23v22H11zm5-1v-7h12v7" fill={brown} /><path d="M98 50v50m-13-35h27m-24 1-8 19h16zm20 0-8 19h16z" fill={yellow} strokeWidth="2" />
    <path d="M32 78 23 79m62 1 13-3" stroke={orange} strokeWidth="5" /><path d="m36 18 9 9-8 3m47-12-7 9 8 3" fill={pink} strokeWidth="1" /><rect x="20" y="89" width="5" height="4" fill={yellow} strokeWidth="1" />
  </>,
  'extra-mile-oddball': <>
    <circle cx="60" cy="61" r="44" fill={paper} />
    <path d="M35 25q20 31-4 68m54-67Q67 57 89 93" stroke={red} fill="none" strokeWidth="1.7" />
    <path d="m38 36 9-3m-7 14 9-2m-9 15 8 2m-13 12 8 3m-16 10 8 3m40-50 8 3m-9 9 8 2m-8 10 8-1m-6 13 8-2m-5 13 8-3" stroke={red} strokeWidth="1.6" />
    <Eyes x={45} y={52} gap={29} rx={4.8} ry={7} small />
    <g fill="none" strokeWidth="2.8"><circle cx="45" cy="52" r="13" /><circle cx="74" cy="52" r="13" /><path d="M58 51h3m-29-2-9-4m64 4 10-4" /></g>
    <path d="M43 74q17 15 34-1" fill="none" /><path d="M53 76h14v13H53zm7 0v13" fill={paper} strokeWidth="1.5" />
    <path d="M43 26q9-4 18-3m24 60-3 7" fill="none" stroke={grey} strokeWidth="1.2" opacity=".65" />
  </>,
  'extra-mile-pooh': <>
    <path d="m81 89 3-57m-2 55 22-66" fill="none" strokeWidth="1.2" /><ellipse cx="82" cy="21" rx="11" ry="15" fill={red} /><ellipse cx="105" cy="22" rx="10" ry="15" fill={red} />
    <ModelFeet x={34} y={98} gap={28} color="#e4d69e" />
    <ellipse cx="46" cy="79" rx="27" ry="29" fill="#e4d69e" /><circle cx="28" cy="31" r="9" fill="#e4d69e" /><circle cx="62" cy="31" r="9" fill="#e4d69e" /><circle cx="45" cy="49" r="24" fill="#e4d69e" />
    <Eyes x={36} y={45} gap={19} small /><ellipse cx="46" cy="57" rx="5" ry="3.5" fill={ink} /><path d="M37 65q9 7 17-1" fill="none" />
    <path d="m40 80 3 26q14 8 28-1l6-25z" fill={brown} /><ellipse cx="58" cy="80" rx="19" ry="5" fill="#79583f" /><path d="M40 80q17-5 36 0v8q-6 8-11-1-6 13-11 0-8 8-13-1z" fill={yellow} />
    <path d="m26 77 17 13m24-17 15 9" fill="none" stroke="#e4d69e" strokeWidth="7" /><path d="M80 82v5" stroke="#e4d69e" strokeWidth="7" />
    <path d="M46 100h22m-21-6h5m8 0h6m-43-18q-4 8 0 15m55-57 2-5m21 5 2-5" fill="none" stroke={paper} strokeWidth="1.3" />
  </>,
  'extra-mile-robin-hood': <>
    <path d="m76 65 8-31 11 3-7 38z" fill={brown} /><path d="m84 38 6-19m-3 20 9-16" stroke={brown} strokeWidth="1.5" /><path d="m88 23-3-5m10 8 3-6" stroke={paper} strokeWidth="2.5" />
    <ModelFeet x={37} y={98} gap={32} color={brown} />
    <path d="m33 67-12 34h62L73 65z" fill={green} /><path d="M32 32q22-16 43 0v27q-20 20-42-1z" fill={grey} />
    <path d="M20 34 65 14l21 21z" fill={green} /><path d="M65 25Q69 7 87 6q0 16-20 22" fill={paper} /><path d="m69 24 12-12" stroke={grey} strokeWidth="1.1" />
    <Eyes x={43} y={42} gap={23} small /><path d="M54 56q-10-7-15 0 8 7 16 2 8 5 16-2-7-7-17 0z" fill={ink} strokeWidth="1.2" />
    <path d="M39 70l12 13 13-14M26 91h53" fill="none" /><rect x="47" y="86" width="12" height="10" fill={yellow} />
    <path d="M95 29q29 36 0 75" fill="none" stroke={brown} strokeWidth="5" /><path d="M95 29v75M71 68h42m-7-6 7 6-7 6M72 79l20-11" fill="none" />
    <path d="m38 76 8 11m16-11-7 11M51 80v6M30 96h12m21 0h12" fill="none" strokeWidth="1.1" />
  </>,
  'extra-mile-saint-nick': <>
    <ModelFeet x={43} y={98} gap={27} color={ink} />
    <path d="M23 74q-22 32 11 35l12-21z" fill="#c5a77b" /><path d="m39 62-11 43h57L74 61z" fill={red} /><path d="M34 35V22L57 4l23 18v15z" fill={red} /><path d="M57 11v23m-9-12h18" stroke={yellow} strokeWidth="4" />
    <path d="M34 37h47v24L58 89 33 62z" fill={paper} /><Eyes x={45} y={44} gap={25} small /><ellipse cx="57" cy="57" rx="8" ry="6" fill={pink} /><path d="M45 64q12 8 25-1M56 90v13" fill="none" />
    <path d="M99 109V28q0-20 13-17 13 6 0 17" fill="none" stroke={ink} strokeWidth="7" /><path d="M99 109V28q0-20 13-17 13 6 0 17" fill="none" stroke={yellow} strokeWidth="4" />
    <path d="M78 79 96 71M31 84l-13-5" stroke={red} strokeWidth="6" /><ellipse cx="96" cy="71" rx="4" ry="5" fill={green} /><ellipse cx="18" cy="79" rx="4" ry="5" fill={green} />
    <path d="M39 30h10m20 0h7M37 79l-4 22m45-21 3 21M39 101h36" fill="none" stroke={yellow} strokeWidth="1.3" /><path d="m43 70 3 6m4-5 3 7m14-8-2 7m7-10-2 6M19 87q-7 8-2 17" fill="none" stroke={grey} strokeWidth="1.1" />
  </>,
  'extra-mile-school-bully': <>
    <ModelFeet x={39} y={97} gap={40} color={purple} />
    <path d="M28 60q-17 10-12 31l17 3 4-20m51-14q19 10 15 31l-17 3-3-20" fill={grey} />
    <path d="M31 45q-2-27 29-27 28 0 30 27v43H29z" fill={grey} />
    <path d="M30 32q1-23 28-23 27 0 29 25H43l-3 6-9-4-12-7z" fill={purple} /><path d="M38 28h43m-50 2-11-1" stroke="#795c9e" strokeWidth="2" />
    <Eyes x={45} y={44} gap={28} small /><path d="M36 35l14 4m17-1 15-4" strokeWidth="2.4" />
    <ellipse cx="60" cy="61" rx="21" ry="14" fill={grey} /><path d="M45 65h30v9H45z" fill={paper} /><path d="M52 65v8m8-8v8m8-8v8m-15-16h2m11 0h2" strokeWidth="1.2" />
    <path d="M29 85h61v20H65V96H54v9H29z" fill="#49475e" />
    <path d="m94 88-8-14m8 14 10-14m-10 14v18" stroke={brown} strokeWidth="5" /><path d="M86 74h18" fill="none" strokeWidth="1.3" />
    <path d="M34 90h12v8H34zm38 0h12v8H72zm-52-7h7m68 0h7" fill="none" strokeWidth="1.1" />
  </>,
  'extra-mile-scout': <>
    <ModelFeet x={40} y={98} gap={32} color={ink} />
    <path d="m34 67-9 36h63L78 67z" fill="#c8ad75" /><path d="M32 34q25-17 49 0v27q-23 21-48-1z" fill={red} />
    <path d="M22 32h71M34 29l9-18h24l14 18" fill="#c8ad75" strokeWidth="3" /><path d="M38 25h38" stroke={green} strokeWidth="3" />
    <Eyes x={43} y={43} gap={26} small /><path d="M45 61q12 8 23-1" fill="none" />
    <path d="m36 69 19 14 20-14-18 24z" fill={purple} /><path d="m54 81 5 7-4 10-5-10z" fill={purple} strokeWidth="1.3" />
    <path d="m41 69 36 35" stroke={green} strokeWidth="10" /><g fill={yellow} strokeWidth="1"><circle cx="50" cy="80" r="3" /><circle cx="61" cy="91" r="3" /><circle cx="71" cy="100" r="3" /></g>
    <path d="M97 28v80m-68-24-14-7m69 6 13-8" fill="none" stroke={brown} /><path d="M98 29h16l-7 11 7 11H98z" fill={green} />
    <path d="m29 84-13-7m67 6 13-8" stroke={red} strokeWidth="5" /><path d="M29 91h13v10H27zm42-15h10v10H71zM45 15h20" fill="none" strokeWidth="1.1" /><path d="M103 34h7" stroke={paper} strokeWidth="1.2" />
  </>,
  'extra-mile-shuffler': <>
    <ModelFeet x={45} y={94} gap={29} color={blue} />
    <path d="m28 57-15 8m75-8 12 9" stroke={blue} strokeWidth="5" fill="none" /><circle cx="13" cy="65" r="3" fill={blue} />
    <rect x="29" y="13" width="59" height="81" rx="7" fill={paper} />
    <path d="M46 33q-17 13-2 17 7 1 8-4-2 9-6 11h13q-5-4-5-11 10 10 16-1 3-5-13-18z" fill={ink} />
    <Eyes x={49} y={66} gap={24} small /><path d="M52 83q10 6 20-1" fill="none" />
    <path d="m89 63 18-5 7 30-18 4z" fill={red} /><path d="m87 63 20 0v30H87z" fill={red} /><path d="m86 64 18 7-10 27-18-7z" fill={red} />
    <path d="m92 63 12 0m-16 7 11 4m-13 3 11 4m-8 4 9 3" stroke={paper} strokeWidth="1.2" /><path d="m87 80 8 4" stroke={blue} strokeWidth="5" />
    <path d="M35 30V19h10m28 0h9v11M35 80v8h10m29 0h8v-8" fill="none" stroke={grey} strokeWidth="1.1" />
  </>,
  'extra-mile-silly-goose': <>
    <path d="M41 98v9l-12 6h19v-7m18-8v9l14 6H62v-7" fill={orange} strokeWidth="1.6" />
    <path d="M29 98q-18-11-9-29l25-9 2-24q1-19 19-19 20 0 20 19L74 61l4 23q-1 18-28 18z" fill={paper} />
    <path d="M80 34 107 43 79 50z" fill={orange} />
    <ellipse cx="55" cy="39" rx="10" ry="8" fill={ink} /><ellipse cx="76" cy="38" rx="10" ry="8" fill={ink} /><path d="M64 37h3" strokeWidth="3" /><path d="m50 36 5 3m18-4 5 3" stroke={paper} strokeWidth="1.5" />
    <path d="M43 25q19-25 42-3z" fill={green} /><path d="M44 25 62 11l2 13z" fill={orange} /><path d="m64 11 20 11-20 2z" fill={blue} /><path d="M64 12V6m-14 0h28" stroke={blue} strokeWidth="2.5" />
    <path d="M27 75q13 20 33-2m-33 16-13 5 15 4" fill={paper} /><path d="M28 77q9 12 20 8m-14-7 8 5m-3-9 9 5m-5-10 7 4M85 42l13 1" fill="none" stroke={grey} strokeWidth="1.1" />
  </>,
  'extra-mile-snake-eyes': <>
    <path d="M52 80q-22-6-29 10-7 19 25 19 41 0 50-17 7-13 4-28" fill="none" stroke="#168a55" strokeWidth="15" />
    <path d="M49 89V43q-14-4-13-17 1-14 22-14 23 0 23 15 0 12-18 16v46z" fill="#168a55" />
    <path d="M50 45v40q-3 10-12 12" fill="none" stroke={paper} strokeWidth="9" /><path d="M45 49h10m-10 8h10m-10 8h10m-10 8h10m-10 8h10m-15 10 8 5" stroke="#a6b58b" strokeWidth="1.2" />
    <rect x="37" y="13" width="19" height="20" rx="3" fill={paper} /><rect x="59" y="13" width="19" height="20" rx="3" fill={paper} />
    <g fill={ink} stroke="none"><circle cx="47" cy="23" r="3" /><circle cx="69" cy="23" r="3" /></g>
    <path d="M48 37q10 4 20-1m-8 3 5 15m0 0-6 5m6-5 7 2" fill="none" stroke={red} strokeWidth="1.7" />
    <path d="m89 51 13-6 9 20-13 6z" fill={paper} /><path d="m88 52 15-1 2 23-15 1z" fill={paper} /><path d="m87 54 14 4-6 22-14-4z" fill={paper} />
    <path d="m90 64 4 3-4 3-2-3z" fill={red} strokeWidth=".8" /><path d="M98 75q6-2 6-9" fill="none" stroke="#168a55" strokeWidth="5" />
    <path d="M28 96q8 6 19 5m34-3 9-4" stroke={paper} strokeWidth="1.2" fill="none" opacity=".6" />
  </>,
  'extra-mile-snub': <>
    <ModelFeet x={41} y={98} gap={35} color={pink} />
    <ellipse cx="27" cy="43" rx="17" ry="25" fill={pink} /><ellipse cx="91" cy="43" rx="17" ry="25" fill={pink} />
    <path d="M30 51q-2-35 30-35 31 0 31 35v37H29z" fill={pink} />
    <Eyes x={44} y={40} gap={29} small /><path d="m36 29 12 3m18-1 14-3" fill="none" strokeWidth="1.6" />
    <path d="M55 50v29q-1 15 10 16 12 0 14-10l-9-3q-2 5-5 3l1-35" fill={pink} />
    <path d="M29 87h61v16H64V96H54v7H29z" fill={red} /><path d="M31 88h57m-27 8v6" fill="none" strokeWidth="1.1" />
    <rect x="47" y="19" width="24" height="8" rx="2" fill={paper} transform="rotate(9 59 23)" /><path d="m57 20 3 0v5h-3" fill="#e0c8ac" strokeWidth=".8" />
    <path d="m37 48-4 7q1 6 5 3 3-3-1-10z" fill={blue} stroke="none" />
    <path d="M21 27q-10 13-2 28m79-28q10 13 2 28M57 60h6m-6 7h6m-6 7h6m11 17 6-3" fill="none" stroke="#c5789b" strokeWidth="1.2" />
  </>,
  'extra-mile-terrible-toddler': <>
    <ModelFeet x={44} y={98} gap={29} color={pink} />
    <path d="M37 69q22-13 44 0v23H36z" fill={pink} /><path d="M38 74 17 66m63 8 22-8" stroke={pink} strokeWidth="7" fill="none" />
    <ellipse cx="29" cy="42" rx="7" ry="10" fill={pink} /><ellipse cx="90" cy="42" rx="7" ry="10" fill={pink} />
    <ellipse cx="59" cy="43" rx="31" ry="29" fill={pink} /><path d="M53 15q4-13 12-10" fill="none" stroke={pink} strokeWidth="4" />
    <path d="m38 30 10-3m21 0 11 3M39 40q6-7 12 0m16 0q6-7 12 0" fill="none" />
    <ellipse cx="59" cy="56" rx="20" ry="14" fill={ink} /><path d="M46 64q13-10 27 0" fill={red} /><path d="M49 44h7v7h-7zm14 0h7v7h-7z" fill={paper} strokeWidth="1" />
    <path d="M36 86h47v17H67l-8-5-8 5H36z" fill={paper} /><path d="m39 89 10 11m31-11-11 11M41 89h6m25 0h6" stroke={grey} strokeWidth="1.1" fill="none" />
  </>,
  'extra-mile-thief': <>
    <ModelFeet x={36} y={98} gap={28} color={ink} />
    <path d="M84 65q28 15 22 40H79l-7-27z" fill="#c5a77b" /><path d="m87 66-7-13 17 2-4 12" fill="#c5a77b" />
    <path d="m30 66-8 36h57L70 66z" fill={grey} /><path d="M29 77h45m-48 11h51m-50 11h50" stroke={paper} strokeWidth="5" />
    <path d="M31 35 15 26l6 19 11 4m39-14 16-9-6 19-11 4" fill={green} />
    <path d="M29 34q22-17 43 0v24q-23 22-44-1z" fill={green} /><path d="M27 31q-1-24 25-24 25 0 24 24z" fill={ink} /><path d="M30 37h44v17H30z" fill={ink} /><Eyes x={40} y={44} gap={22} small />
    <path d="M41 61q10 6 19-2m-31 17-15 9m57-12 15-8" fill="none" stroke={green} strokeWidth="5" /><ellipse cx="85" cy="65" rx="5" ry="4" fill={green} />
    <path d="M33 23q4-10 16-11m10 1 7 3m-46 22 6 4m49-4-6 4M83 72l8 2 8-3m-14 9q-6 11-3 20m18-16 2 9" fill="none" strokeWidth="1.1" />
  </>,
  'extra-mile-toll-troll': <>
    <ModelFeet x={42} y={98} gap={33} color={green} />
    <path d="M34 73 20 55l-4-11m69 30 14-20 5-11" fill="none" stroke={green} strokeWidth="8" /><path d="M16 45l-7-6m7 6-1-10m90 9 7-5m-7 5 1-10" stroke={green} strokeWidth="3" />
    <path d="m35 65-9 37 15-3 8 5 12-4 12 4 16-3-9-37z" fill="#c5a77b" />
    <path d="M32 37 13 26l6 23 15 8m49-20 22-11-7 24-16 6" fill={green} /><path d="M31 31q29-24 59 2v29q-26 22-58 0z" fill={green} />
    <path d="m36 26-5-17 12 10-2-17 12 16 4-18 8 18L74 1l-1 18 13-13-4 21z" fill={brown} />
    <Eyes x={46} y={42} gap={28} rx={7} ry={9} /><ellipse cx="60" cy="59" rx="8" ry="5" fill={green} /><path d="M47 67q12 6 24-2" fill="none" />
    <path d="M55 77h11m-11 0 11 7m0-7-11 7m0 0h11m-11 0 11 7m0-7-11 7m0 0h11" fill="none" strokeWidth="1.2" />
    <path d="m22 36 6 9m67-9-5 9M36 78l5 4m34-4-5 4M37 96l6 4m29-5-5 5" fill="none" strokeWidth="1.1" />
  </>,
  'extra-mile-totally-fair-ref': <>
    <ModelFeet x={41} y={98} gap={33} color={ink} />
    <path d="M30 91h59v15H65V98H54v8H30z" fill={ink} />
    <path d="m33 66-10 29h70L80 66z" fill={paper} /><path d="M37 71v21m13-23v24m14-24v24m14-22v21" strokeWidth="5" />
    <path d="M32 30q-14 5-13 29l14-6m51-23q15 5 14 29l-14-6" fill={grey} />
    <path d="M31 29q26-19 53 0v28q-24 25-52 0z" fill={grey} /><path d="M30 28q-2-22 27-22 29 0 28 22zm-8 1h73" fill={ink} />
    <Eyes x={43} y={39} gap={29} small /><ellipse cx="58" cy="55" rx="19" ry="12" fill={grey} /><ellipse cx="58" cy="50" rx="8" ry="5" fill={ink} /><path d="m58 56-1 8m0-1-9 2m9-2 10 2" fill="none" />
    <path d="M28 78 14 72m71 7 17-10" fill="none" stroke={grey} strokeWidth="6" /><path d="m100 64 12 4-3 17-12-8z" fill={yellow} />
    <path d="M35 20q1-9 20-10m8 0q13 1 15 9M22 37l-1 14m72-14 1 14M37 68l10 9 10-7m7 0 7 7 10-9" fill="none" stroke={grey} strokeWidth="1.2" />
  </>,
  'extra-mile-whisper': <>
    <path d="M29 98V45q0-33 30-33 31 0 31 33l5 55-11-3-8 10-14-7-13 7-10-9-12 5z" fill={purple} />
    <Eyes x={48} y={40} gap={24} rx={4.8} ry={7} small /><ellipse cx="60" cy="56" rx="7" ry="5" fill="#795c9e" strokeWidth="1.2" />
    <path d="M31 62q6-13 17-12l12 10-7 9-12-7-5 10q-9 1-5-10z" fill={purple} /><path d="M89 62q-6-13-17-12L60 60l7 9 12-7 5 10q9 1 5-10z" fill={purple} />
    <path d="m49 55 9 7m-12-3 9 6m17-10-10 7m13-3-10 6M36 78l-1 16m49-16 2 16m-35-8 2 13m16-13-2 13" fill="none" stroke="#795c9e" strokeWidth="1.2" />
    <path d="M38 31q2-11 13-13m25 10 4 6" fill="none" stroke="#c9a9db" strokeWidth="1.6" /><path d="m42 28 10 3m14 0 9-3" fill="none" strokeWidth="1.2" />
  </>,
  'extra-mile-witch-hazel': <>
    <ModelFeet x={43} y={98} gap={29} color={red} />
    <path d="m39 65-14 38h68L78 65z" fill={ink} /><path d="M34 37q24-12 47 0v14l17 10-18 7q-22 10-44-5z" fill={green} />
    <Eyes x={46} y={44} gap={25} small /><path d="M49 65q11 7 23-1" fill="none" />
    <path d="m29 34 21-19-5-13 24 12 15 20z" fill={ink} /><path d="M22 36h72" strokeWidth="5" /><path d="M40 26h36" stroke={paper} strokeWidth="5" />
    <path d="M19 84h88" stroke={brown} strokeWidth="5" /><path d="m19 77-11-1v17l12-1 10-7z" fill={yellow} />
    <path d="m10 80 12 4m-12 5 12-3m-7-7 2 12" stroke={brown} strokeWidth="1.2" />
    <path d="M36 74 44 85m36-11-6 11" stroke={green} strokeWidth="7" /><ellipse cx="44" cy="85" rx="4" ry="3" fill={green} /><ellipse cx="74" cy="85" rx="4" ry="3" fill={green} />
    <path d="m48 17 4-6 10 7M38 76l-7 18m45-18 7 18m-43 4h9m18-1h8" fill="none" stroke={grey} strokeWidth="1.1" opacity=".6" />
  </>,
};
