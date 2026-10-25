import type { ReactNode } from 'react';
import { Eyes as InkyEyes } from './expansion-portrait-parts.js';

// Hand-drawn vector counterparts to the original box's flat, inked portraits.
// The Avatar component supplies the shared 120 × 120 viewport and outline.
const ink = '#191919', paper = '#fffdf4', yellow = '#ffda27', red = '#f44735';
const blue = '#254de4', pink = '#f6a8d0', green = '#b5d66b', purple = '#9664bb';

function Eyes({ x, y, gap = 18 }: { x: number; y: number; gap?: number }) {
  return <InkyEyes x={x} y={y} gap={gap} rx={5.5} ry={7.2} offset={-1} />;
}

export const SECOND_WIND_PORTRAITS_C: Record<string, ReactNode> = {
  're-runner': <>
    <path d="m43 80-12 22-16 1q-9 8 10 9h17l14-25m10-8 17 13 14-8 8 7-20 13q-5 2-10-3L57 90" fill={pink} />
    <path d="m43 54-11 32 34 7 16-27-17-13z" fill={pink} />
    <path d="m36 70 36 9m-34-17 35 9" stroke={yellow} strokeWidth="6" />
    <path d="m40 57-13-5-9 14-9-7 14-22q3-5 9-2l19 9m22 15 12 9 13-14 8 8-17 20q-4 5-10 0L65 72" fill={pink} />
    <path d="M42 27q-2-20 20-21 25-1 26 22l-7 25q-5 12-20 10-22-3-23-18z" fill="#d69a58" />
    <g fill="#b8b3bb"><circle cx="44" cy="19" r="8" /><circle cx="55" cy="12" r="8" /><circle cx="68" cy="11" r="8" /><circle cx="81" cy="17" r="8" /><circle cx="85" cy="29" r="7" /><circle cx="39" cy="30" r="7" /></g>
    <path d="M39 25q24-11 49 2l-2 9q-24-11-46-1z" fill={purple} />
    <Eyes x={51} y={39} gap={18} />
    <path d="m50 33 7-2m10 0 8 2M51 52q11 11 22-1m-17-5 4 3M21 101l9 8m66-24 5 7" fill="none" />
    <path d="m85 31 12 2-6 10-8-2" fill={purple} /><path d="m10 57 6 5 5-7-6-5zm88-3 7 7-4 5-8-6z" fill="#d69a58" strokeWidth="1.3" />
    <path d="m42 72 6 1m12 3 8 2M19 105h10m55-7 5-3m-57-53 6 2m50 28 6-5" fill="none" stroke={paper} strokeWidth="1.2" /><path d="m43 19 3-2m9-6 3 1m12 1 3 2m8 6 1 3" fill="none" stroke={paper} strokeWidth="1.1" /><path d="m46 57 5 2m23-3 3-1" fill="none" stroke="#ba7e9f" strokeWidth="1" />
  </>,

  'show-off': <>
    <path d="M28 111V12h63v99M28 79h63" fill="none" stroke="#bca86d" strokeWidth="5" /><path d="M31 13h57v11H31zM31 75h57v8H31z" fill="#8bbcc1" /><path d="M36 17h47" fill="none" stroke={paper} strokeWidth="1.1" />
    <path d="M40 64q20-12 40 0l4 33q-25 13-49 0z" fill={purple} /><path d="m40 74-12 9-7-10m57 0 11 8" fill="none" stroke={purple} strokeWidth="9" />
    <ellipse cx="36" cy="44" rx="13" ry="18" fill={purple} /><ellipse cx="82" cy="44" rx="13" ry="18" fill={purple} /><path d="M39 34q-2-21 21-21 24 0 23 22v25q-22 16-45 0z" fill={purple} /><Eyes x={49} y={41} gap={21} />
    <path d="M58 48q-6 10-2 24 2 10 11 8 7-2 5-8-4 5-8 0l2-21" fill={purple} /><path d="m57 59 6 1m-5 5 5 1m-2 6 4 1M29 36q-5 8 1 16m60-16q5 8-1 16" fill="none" stroke="#72519a" strokeWidth="1.2" />
    <path d="M41 22 46 8h27l7 14zM37 23h46v6H37z" fill={pink} /><path d="M45 19h30M49 12h18" fill="none" stroke="#c07a9c" strokeWidth="1.1" />
    <path d="m39 98 17 1 2 10H32q-4-8 7-11zm25 1 16-1q11 3 7 11H62z" fill={pink} /><g fill={green} strokeWidth="1.1"><circle cx="37" cy="113" r="3" /><circle cx="53" cy="113" r="3" /><circle cx="67" cy="113" r="3" /><circle cx="83" cy="113" r="3" /></g>
    <path d="M39 104h14m14 0h15M44 86v7m32-7v7" fill="none" stroke={paper} strokeWidth="1.2" opacity=".6" />
  </>,

  soulmate: <>
    <path d="M79 86q24 12 27-4 3-13-12-13" fill="none" stroke={yellow} strokeWidth="7" /><path d="M43 102v8H31q-2 6 20 4l5-12m14 0v8h13q3 6-18 4l-4-12" fill={yellow} />
    <path d="M36 59q25-12 48 0l4 34q-1 17-29 17-27 0-29-17z" fill={yellow} /><path d="m37 70-14 13-2 12m62-23 12 12-8 10" fill="none" stroke={yellow} strokeWidth="10" />
    <ellipse cx="60" cy="36" rx="26" ry="30" fill={yellow} /><g fill={paper} strokeWidth="1.4"><ellipse cx="48" cy="33" rx="9" ry="12" /><ellipse cx="72" cy="33" rx="9" ry="12" /></g>
    <g fill={red} strokeWidth="1"><path d="M48 41 41 32q-2-7 4-6l3 3q3-5 6-2 5 5-6 14zM72 41l-7-9q-2-7 4-6l3 3q3-5 6-2 5 5-6 14z" /></g>
    <ellipse cx="60" cy="49" rx="10" ry="7" fill={pink} /><path d="M46 58q14-7 28 0-1 15-13 15-13 0-15-15z" fill={ink} /><path d="M55 65q11-4 14 3-5 6-11 3z" fill={pink} strokeWidth="1" />
    <path d="M43 19q6-8 14-9M39 88q-2 10 5 13m24 2 10-4" fill="none" stroke={paper} strokeWidth="1.3" opacity=".65" />
  </>,

  'speed-demon': <>
    <g fill={ink}><circle cx="26" cy="95" r="17" /><circle cx="94" cy="95" r="17" /></g>
    <g fill={paper}><circle cx="26" cy="95" r="9" /><circle cx="94" cy="95" r="9" /></g>
    <path d="m20 89 12 12m-12 0 12-12m56 0 12 12m-12 0 12-12" fill="none" stroke="#858699" strokeWidth="1.2" /><g fill="#858699" strokeWidth="1.2"><circle cx="26" cy="95" r="2.8" /><circle cx="94" cy="95" r="2.8" /></g>
    <path d="m26 95 24-28 24 28H26m49-27 19 27M70 69l12-15h12" fill="none" stroke="#858699" strokeWidth="5" />
    <path d="M38 69q9-15 31-8l15 16-9 15H42l-11-9z" fill={red} />
    <path d="M25 70h35M76 66l13-3 10 8M49 91h17m-14-13h15" fill="none" /><ellipse cx="96" cy="69" rx="6" ry="5" fill={yellow} strokeWidth="1.4" /><path d="m95 67 2 0" fill="none" stroke={paper} strokeWidth="1.1" />
    <path d="m42 59-10 13 15 10-7 11h17l7-16-14-10 13-10" fill={ink} />
    <path d="M37 38q17-11 32 3l1 24-25 3-12-15z" fill={blue} />
    <path d="m61 45 13 10 11-4 3 9-17 5-19-12" fill={blue} />
    <path d="M41 42Q19 38 23 23l-12-4 15-4-10-8 28 6 8-6 12 14z" fill="#f08d32" />
    <path d="M40 20q17-13 28 3l4 17-10 12-19-7-9-14z" fill="#a1aa50" />
    <path d="M42 19 36 6l14 10m12 6L69 9l4 18" fill="#a1aa50" />
    <path d="m47 28 8 3m4-4 8 1M52 40q9 4 14-3" fill="none" />
    <g fill={paper}><path d="m45 28 10 3-3 7-7-3zm14-1 9 1 1 7-9 2z" /></g>
    <g fill={ink} stroke="none"><ellipse cx="51" cy="33" rx="1.7" ry="2.4" /><ellipse cx="65" cy="32" rx="1.7" ry="2.4" /></g><path d="m42 24 4-3m13-1 4 1" fill="none" stroke={paper} strokeWidth="1.2" />
    <path d="m12 60 13-4m-12 15h10M85 50l9 1" fill="none" />
    <path d="m43 73 7-3m16-3 7 4M39 83h8m17 0h7M39 47l3 8m20 4 4 1" fill="none" stroke={paper} strokeWidth="1.1" opacity=".7" /><path d="m30 24 8 0m0-7 6 4" fill="none" stroke={yellow} strokeWidth="1.2" /><circle cx="59" cy="83" r="3" fill="#9da9a6" strokeWidth="1.2" />
  </>,

  spoilsport: <>
    <path d="M87 78q25-13 25 1-1 11-11 6-8-6 4-10" fill="none" stroke={pink} strokeWidth="7" />
    <path d="M37 68q-12 7-15 29l22 10h34l21-15q-4-21-22-25z" fill={pink} />
    <path d="m34 96-8 14h19l7-12m21 1 4 11h19L86 98" fill={pink} />
    <path d="M33 32Q14 9 31 7l16 19m30 0Q90 5 101 12l-8 27" fill={pink} />
    <path d="M24 46q-2-27 31-28 36-4 43 25l-1 23q-4 26-38 25-35-2-37-25z" fill={pink} />
    <path d="m38 37 11-5m23 0 12 7M34 48q8-10 17-1m20 0q8-9 17 3" fill="none" />
    <path d="M39 49q-12 9-9 24 6 5 11-1l4-21m35-1q12 7 12 24-6 5-11-1l-6-21" fill="#58b9e5" />
    <ellipse cx="61" cy="63" rx="23" ry="16" fill="#f486ae" />
    <g fill={ink} stroke="none"><ellipse cx="51" cy="63" rx="5" ry="7" /><ellipse cx="71" cy="63" rx="5" ry="7" /></g>
    <path d="M47 82q15-12 28 1m-48 0-14-9m79 9 14-7" fill="none" />
    <path d="m28 19 6 5m57-3 7-4M39 76l3 1m38-1 3-1M35 99l5 0m38 1 5 0m-27-8 5 3 6-3" fill="none" stroke="#bd7d99" strokeWidth="1.2" /><path d="m34 59-1 7m55-8 1 8" fill="none" stroke={paper} strokeWidth="1.2" />
  </>,

  stepdad: <>
    <path d="M27 70q4-22 31-24 31 0 36 25l4 35q-38 12-78-1z" fill={purple} />
    <path d="M32 68 15 87l-7-8 16-25 13-2m45 7 14-10-1-22 10-2 3 30-19 21" fill={purple} />
    <path d="M93 29V15q4-9 9-1l1 14 6-7 4 4-5 14-14 3z" fill="#ee9138" />
    <path d="M35 35q-2-29 25-29 31-1 32 28l-4 24-23 13-28-13z" fill={purple} />
    <Eyes x={47} y={33} gap={23} />
    <path d="M36 47q7-15 25-3 17-13 26 2l-6 13q-14 1-20-7-10 8-24 6z" fill="#a65c3d" />
    <path d="m45 53 3 26q10-5 8-23m13 0q-3 22 6 24l4-27" fill={paper} />
    <ellipse cx="61" cy="42" rx="7" ry="5" fill={pink} />
    <path d="M40 69v35m40-36-2 37" fill="none" stroke={red} strokeWidth="9" />
    <path d="m51 72 11 6-11 7zm22 0-11 6 11 7z" fill={yellow} />
    <path d="M27 106 16 112h29l9-7m17 0 9 8h24l-11-9" fill={purple} />
    <path d="M30 91h7m39 0h8M43 47l-6-4m39 5 7-5" fill="none" />
    <path d="M42 97h-5v6h5m37-6h-5v6h5M47 89h7m12 0h7m-15 6h1m-1 7h1M99 19v9" fill="none" stroke={yellow} strokeWidth="1.2" /><path d="m43 49 5 2m29-2-5 2m-21 8 1 11m20-10 1 11" fill="none" stroke="#b58265" strokeWidth="1" /><path d="M45 14q7-4 15-4" fill="none" stroke={paper} strokeWidth="1.2" opacity=".65" />
  </>,

  streaker: <>
    <path d="M73 90q27-5 27-22 8 29-26 34" fill="#efe3bb" /><path d="M45 95v17H34q-1 4 17 3l5-18m15-2 3 17h12q1 5-17 3l-7-18" fill="#efe3bb" />
    <path d="M47 50 64 7q12 20 13 46l5 39q-2 17-23 18-22-2-22-18z" fill="#efe3bb" /><path d="m45 60-13 21-3 20m46-41 13 21 3 20" fill="none" stroke="#efe3bb" strokeWidth="7" />
    <path d="M47 39 33 42q-8 4 0 7l17 1" fill="#efe3bb" /><InkyEyes x={55} y={39} gap={13} small /><path d="M53 54q8 5 15-1" fill="none" strokeWidth="1.3" />
    <path d="M58 28l5-12m-16 67-2 12m26-13 3 11M40 112h8m25 0h8" fill="none" stroke="#c6b891" strokeWidth="1.1" /><path d="M52 62q-4 13-4 17" fill="none" stroke={paper} strokeWidth="1.2" />
  </>,

  stunner: <>
    <path d="m45 99-5 10H29q-4 8 22 6l5-13m15-4 5 10h13q4 8-20 6l-6-13" fill={pink} />
    <path d="M31 49q-1-21 14-24 11-9 21-1 19-3 25 16 8 17 5 38-2 31-29 32-29 5-38-21-6-18 2-40z" fill="#ed9a52" />
    <path d="M57 25q-3-18 4-21 6-2 13 2l-3 5-6-1-1 16z" fill="#a8845c" /><path d="M44 29q-13 32-4 65m22-65q-6 39-2 72m20-69q12 26 4 60" fill="none" stroke="#cb7b39" strokeWidth="1.4" />
    <InkyEyes x={49} y={50} gap={21} small /><path d="m44 42-2-4m6 3-1-4m6 4 1-4m10 3-1-4m5 4v-5m5 5 2-4" fill="none" strokeWidth="1.1" />
    <path d="M51 65q8-5 16 0-7 8-16 0z" fill={red} strokeWidth="1.1" /><path d="M53 65h11" fill="none" strokeWidth=".8" />
    <path d="m31 62-9 12m68-12 12 4" fill="none" stroke="#ed9a52" strokeWidth="8" /><path d="M36 43q2-10 8-13m35 5 3 7m-48 39 3 8" fill="none" stroke={paper} strokeWidth="1.3" opacity=".6" />
  </>,

  switcharoo: <>
    <path d="M79 77q19 12 32-4-1 28-35 25" fill={yellow} />
    <path d="M38 68q-11 23-6 32l22 4 26-1q12-12-3-33z" fill={yellow} />
    <path d="m41 96-19 9-11 5q-3 5 23 3l21-9m18-7 13 7 20 3q9 9-17 7l-22-10" fill={yellow} />
    <path d="M43 71q-4-20 5-28h25l9 28-15 18-19-4z" fill={yellow} />
    <path d="M38 30Q25 4 39 5q11 0 16 25m13-2Q79 1 88 8q6 7-7 28" fill={yellow} />
    <path d="m40 13 7 14m31-11-5 13" stroke={pink} strokeWidth="5" />
    <path d="M38 39q0-17 23-16 25 3 22 22l-7 15-25 3-17-11z" fill={yellow} />
    <g fill={paper}><circle cx="45" cy="40" r="11" /><circle cx="71" cy="40" r="11" /></g>
    <g fill="none" stroke={pink} strokeWidth="5"><circle cx="45" cy="40" r="11" /><circle cx="71" cy="40" r="11" /><path d="M56 39h4" /></g>
    <g fill={ink} stroke="none"><circle cx="47" cy="41" r="3" /><circle cx="73" cy="41" r="3" /></g>
    <ellipse cx="58" cy="53" rx="7" ry="4" fill={pink} />
    <path d="M54 60q6 6 13-2m-22 10-18 7m51-10 11 10" fill="none" />
    <path d="M44 78q17 10 35-1l-5 18q-14 9-25-1z" fill="#f2d4a2" />
    <path d="m49 83 4 4m14 1 5-5" fill="none" />
    <path d="M38 35q4-4 8-3m18 2q4-4 8-3" fill="none" stroke={paper} strokeWidth="1.7" /><path d="m51 92 4 2m3-1 4 2m3-2 4-1M31 108l11-3m43 2 9 3M85 86l10-2" fill="none" stroke="#dc994d" strokeWidth="1.1" /><path d="m51 69 5 3 5-3" fill="none" stroke={paper} strokeWidth="1.1" />
  </>,

  tail: <>
    <path d="m77 21 11 10-8 5m3 6 12 9-9 6m-2 5 10 10-13 4" fill="#8eaa5e" />
    <path d="M75 10q13 0 14 19 6 26-1 47-10 31-33 37-27 2-34-20-5-13 7-29 22-5 34-23 10-12 6-23z" fill="#66ad79" />
    <path d="M26 77q17-7 30-22 15-18 17-36" fill="none" stroke="#8dc69b" strokeWidth="2.1" /><InkyEyes x={71} y={22} gap={11} rx={4} ry={5.7} offset={0} look={0} />
    <path d="M29 110q8-4 17 0l-1 5H29zm24 1q9-6 18-2l-1 6H54z" fill="#dc775a" strokeWidth="1.4" /><path d="M32 96q13 7 24 1m20-41q1 10-3 19" fill="none" stroke="#4f9561" strokeWidth="1.3" />
  </>,

  'the-hose': <>
    <path d="M28 104q-18 7-13-9l9-9" fill="none" stroke="#397e50" strokeWidth="11" /><path d="M28 104q-18 7-13-9l9-9" fill="none" stroke="#72b681" strokeWidth="7" />
    <path d="M93 80V31q0-15-15-15l-7 5 4 11 9-1v51" fill="#72b681" /><InkyEyes x={78} y={17} gap={11} rx={3.5} ry={5} offset={1} look={-1} />
    <path d="M76 24 64 20l-9 8 4 9 17-2z" fill="#d3b766" /><ellipse cx="58" cy="29" rx="6" ry="8" fill="#dfc87b" /><g fill={ink} stroke="none"><circle cx="56" cy="27" r="1" /><circle cx="60" cy="27" r="1" /><circle cx="58" cy="32" r="1" /></g>
    {[{cx:35,cy:80,rx:17,ry:29},{cx:56,cy:76,rx:17,ry:33},{cx:77,cy:73,rx:17,ry:36}].map(coil => <g key={coil.cx}><ellipse {...coil} fill="none" stroke="#397e50" strokeWidth="11" /><ellipse {...coil} fill="none" stroke="#72b681" strokeWidth="7" /><path d={`M${coil.cx-9} ${coil.cy-coil.ry+7}q-9 13-6 28`} fill="none" stroke="#b6d2a5" strokeWidth="1.3" /></g>)}
    <path d="M86 37v12m-24-25 4-2" fill="none" stroke={paper} strokeWidth="1.1" opacity=".65" />
  </>,

  understudy: <>
    <path d="m41 86-5 22H24m47-22 9 22h15" fill="none" stroke={yellow} strokeWidth="9" />
    <path d="M36 59q23-12 43 2l8 27-19 8-13-7-14 7-14-14z" fill={yellow} />
    <path d="m43 63-5 19m17-20-1 26m14-25 7 21" fill="none" stroke="#d2a237" strokeWidth="5" />
    <path d="m35 64-17 8 8 20 11-6-5-11m43-10 18 7-1 14-11-1-1-10" fill={yellow} />
    <path d="M44 27q-3-18 19-19 22-2 24 18l-1 12 16 10-20 4q-4 13-22 11-24-3-23-23z" fill={purple} />
    <path d="M33 27q5-20 29-20 24 0 30 17l-23 7z" fill="#6f9d58" />
    <path d="M35 27q26-7 56 0" fill="none" stroke={yellow} strokeWidth="6" />
    <path d="M65 18q18-18 20-7 0 8-20 11z" fill="#dc9a56" /><path d="m68 18 12-8" fill="none" stroke="#ac733b" strokeWidth="1.1" />
    <Eyes x={53} y={39} gap={18} />
    <path d="m57 53 10 3 8-4" fill="none" />
    <path d="m36 57 10 1 2 7 8-5 7 7 7-6 8 3 7-7 4 12-13 7-16-4-13 1-10-9z" fill={paper} />
    <path d="m86 73 23-6v33l-23 8-13-7V69z" fill={paper} />
    <path d="M86 73v35m5-30 11-3m-11 11 11-3m-11 11 8-2m-20-16 3 2m-3 9 3 2" fill="none" strokeWidth="1.4" /><path d="m104 69 0 28-15 5m-11-28 0 5" fill="none" stroke="#c5b994" strokeWidth="1" />
    <path d="M81 82q-11-5-11 3l10 8 7-4" fill={purple} />
    <path d="m43 18 4-3m31 1 5 4M33 66l5 3m39-2 4 2m-32 22 3 2m10-2 3 2M28 107h8m45 0h9" fill="none" stroke={paper} strokeWidth="1.2" opacity=".7" /><path d="m88 100 4-1v6l-2-1-2 2z" fill={red} strokeWidth="1" />
  </>,
};
