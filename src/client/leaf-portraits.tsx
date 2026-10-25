import type { ReactNode } from 'react';
import { Eyes, Feet, yellow, red, blue, pink, green, paper, ink, orange, purple, brown, grey } from './expansion-portrait-parts.js';

// Match the authored 20261024 models; keep silhouette, costume and props recognizable.
const powderBlue = '#87bbd6', modelGreen = '#168a55';

export const LEAF_PORTRAITS: Record<string, ReactNode> = {
  'leaf-catfish': <>
    <path d="M82 88q36-6 20-48l-9-13 19-15q-29-6-34 13l10 32-21 13z" fill={powderBlue} /><path d="M20 49 14 23l27 13q22-10 41 7 25 40-9 59-40 10-54-17z" fill={powderBlue} />
    <path d="M32 70q31-14 48 5 1 26-21 27-24-2-27-32z" fill={paper} /><Eyes x={34} y={48} gap={28} /><ellipse cx="52" cy="65" rx="7" ry="5" fill={pink} /><path d="m43 72-29-6m29 13-26 9m45-16 28-7M61 79l26 10" stroke={paper} strokeWidth="4" /><path d="m37 96-12 13h16m29-13 12 13H67" fill="none" />
    <path d="m91 22 10-4m-10 6 8 2m-9 33 7 9m-10-1 8 7M35 83q16 11 30 4m-27 4 7 5" fill="none" stroke="#67849b" strokeWidth="1.3" /><path d="m21 31 10 6-8 7" fill={pink} strokeWidth="1.1" /><path d="m76 52 4 3m-1 4 4 4" fill="none" stroke={paper} strokeWidth="1.1" />
  </>,
  'leaf-crash-dummy': <>
    <path d="m37 66-17 17 7 17m55-34 18 16-7 19M47 92l-6 16m31-16 8 16" fill="none" stroke={ink} strokeWidth="11" />
    <path d="m37 66-17 17 7 17m55-34 18 16-7 19M47 92l-6 16m31-16 8 16" fill="none" stroke={orange} strokeWidth="7" />
    <path d="M53 49h14v14H53z" fill={grey} /><path d="M36 60q24-7 47 0l-5 31q-18 7-37 0z" fill={orange} />
    <circle cx="60" cy="30" r="22" fill={orange} /><path d="M44 20q5-8 13-8" fill="none" stroke={yellow} strokeWidth="2" />
    <Eyes x={50} y={29} gap={20} small /><path d="M53 44h14m-7-34v8" fill="none" strokeWidth="1.8" />
    <g fill={grey} strokeWidth="1.8"><circle cx="36" cy="66" r="5" /><circle cx="83" cy="66" r="5" /><circle cx="20" cy="83" r="4.5" /><circle cx="100" cy="82" r="4.5" /><circle cx="47" cy="93" r="5" /><circle cx="73" cy="93" r="5" /></g>
    <g fill={paper} stroke="none"><circle cx="35" cy="65" r="1.4" /><circle cx="82" cy="65" r="1.4" /><circle cx="19" cy="82" r="1.2" /><circle cx="99" cy="81" r="1.2" /></g>
    <circle cx="60" cy="76" r="12" fill={yellow} strokeWidth="1.8" /><path d="M60 64a12 12 0 0 1 12 12H60zm0 24a12 12 0 0 1-12-12h12z" fill={ink} stroke="none" />
    <path d="M48 59h24m-19 31h15" fill="none" strokeWidth="1.3" /><Feet x={40} y={107} gap={41} color={orange} />
    <path d="m43 63 6-1m23 0 5 2m-33 25 4 1m25-1 3-1M54 53h12" fill="none" stroke={yellow} strokeWidth="1.3" /><path d="M53 94h12m-10 3h8" fill="none" strokeWidth="1" /><path d="m24 91 3 5m68-5-2 5" fill="none" stroke={yellow} strokeWidth="1.1" />
  </>,
  'leaf-dark-horse': <>
    <path d="M82 74q28-2 25 23L95 88l-8 10" fill={ink} /><path d="M32 60h48q16 1 10 29H33z" fill={powderBlue} /><path d="M42 79v27m39-27 6 27" fill="none" stroke={powderBlue} strokeWidth="7" /><path d="M31 79 26 109m40-28 5 28" fill="none" stroke={powderBlue} strokeWidth="9" /><path d="M21 110h10m7-3h9m19 3h11m6-3h10" stroke={ink} strokeWidth="5" />
    <path d="M29 62 19 43l6-28 14 9 16-14 6 30-10 37z" fill={powderBlue} /><path d="m55 21 18 14-10 5 9 12-11 4 4 15-13-3z" fill={ink} /><Eyes x={31} y={36} gap={19} small /><ellipse cx="37" cy="61" rx="17" ry="12" fill={grey} /><path d="M30 58v3m14-3v3m-16 10h15" />
    <path d="m60 33 6 2m-6 11 5 2m-6 10 4 3M59 67h16q9 1 10 10m-45 6h8m27-2 5 1" fill="none" stroke={grey} strokeWidth="1.1" /><path d="m29 101-1 4m18-4-1 4m34-4 1 4" fill="none" stroke={paper} strokeWidth="2" /><path d="m28 24 3 5m17-3 3-7" fill="none" stroke={pink} strokeWidth="1.5" />
  </>,
  'leaf-filmmaker': <>
    <path d="m37 69-10 29h57L75 68z" fill={paper} /><path d="M36 32q20-14 41 0v27q-21 20-42-1z" fill={pink} /><path d="m33 32-3-18 17 5L59 7l8 13 17-7-6 25-15-12-13 9z" fill={modelGreen} /><Eyes x={45} y={41} gap={23} small /><path d="M44 59q11 6 23-2" fill="none" />
    <path d="M32 95h48v17H62v-11H49v11H32z" fill={powderBlue} /><path d="M28 112h20m17 0h21" stroke={yellow} strokeWidth="8" /><path d="M28 78 14 68m64 7 12-17" strokeWidth="5" />
    <path d="M74 39h31v28H74zM105 46l10-6v26l-10-7z" fill={grey} /><circle cx="80" cy="32" r="9" fill={grey} /><circle cx="99" cy="31" r="10" fill={grey} /><circle cx="80" cy="32" r="3" fill={ink} /><circle cx="99" cy="31" r="3" fill={ink} />
    <path d="m41 72 12 9 11-9M33 85h12v8H32zm25-1h12v9H58zM55 82v10" fill="none" strokeWidth="1.1" /><rect x="79" y="43" width="21" height="18" rx="2" fill={powderBlue} strokeWidth="1.2" /><path d="M82 47h9m-9 3h6m15-5v13" fill="none" stroke={paper} strokeWidth="1" /><g fill={paper} stroke="none"><circle cx="77" cy="27" r="1.4" /><circle cx="85" cy="33" r="1.4" /><circle cx="96" cy="25" r="1.4" /><circle cx="105" cy="33" r="1.4" /></g>
  </>,
  'leaf-kangaroo': <>
    <path d="M66 87q20 22 44 20-16 15-47-2" fill={orange} /><path d="M40 40 27 13q-4-16 9-8l17 30m8 2 3-29q10-12 13 2l-4 34" fill={orange} />
    <path d="M35 41q12-15 34-6 18 10 8 29l10 24-15 17H35L24 84l13-23z" fill={orange} /><Eyes x={43} y={43} gap={23} small /><ellipse cx="49" cy="59" rx="20" ry="11" fill={paper} /><circle cx="31" cy="56" r="5" fill={ink} />
    <path d="M39 79h35q0 24-18 21-17-2-18-21z" fill={paper} /><path d="M45 77q9-14 22 0m-33-10-17 7m59-9 16 7" fill="none" /><path d="M38 102 22 112h30m20-10 17 10H62" fill={orange} />
    <path d="m33 12 12 23m24-22-1 23" fill="none" stroke={pink} strokeWidth="2.5" /><path d="M43 84q13 5 26 0m-25 5 1 3m4-2 1 3m5-2v3m5-3-1 3m7-5-1 3M83 101l12 6" fill="none" stroke={brown} strokeWidth="1.1" /><path d="m33 68 4 4m30-3 4-4" fill="none" stroke={paper} strokeWidth="1.2" />
  </>,
  'leaf-loan-shark': <>
    <path d="M36 54 11 65l18 14m56-24 25 14-24 9" fill={powderBlue} /><path d="M29 37q10-25 33-20 29 6 31 35l-7 48H30z" fill={powderBlue} /><path d="M32 27 39 9h16l11 5 18-4 5 17M23 29h78" fill={red} strokeWidth="5" />
    <Eyes x={44} y={40} gap={30} small /><path d="M28 57q30-6 64 0L79 82H43z" fill={orange} /><path d="m32 58 9 13 9-14 10 15 10-15 10 14 10-13m-46 22 7-10 9 11 10-11 8 10" fill={paper} /><path d="m31 95 21 6 14-7 20 7-8 12H41z" fill={powderBlue} />
    <path d="M36 23h48m-41-10 9 1M37 85l3 6m4-4 3 6m28-8-3 6m-4-4-3 6m-46-24 7 3m72-5-7 4" fill="none" strokeWidth="1.1" /><path d="m39 33 4-1m31 0 5 1M47 106h24" fill="none" stroke={paper} strokeWidth="1.2" opacity=".6" />
  </>,
  'leaf-lonely-wolf': <>
    <path d="M83 83q32 1 25-25l-16 9-7-10" fill={grey} /><path d="M35 68h46q15 6 10 28H32z" fill={grey} /><path d="m28 35-8-23 23 11 24-13-5 27 10 21-25 23-23-19z" fill={grey} />
    <path d="m29 58 14 7 18-8-2 14 10 6-19 20-19-12-9-19z" fill={paper} /><Eyes x={33} y={39} gap={23} small /><path d="m37 54 8-5 8 5-8 7z" fill={ink} /><path d="m34 65 10 4 12-5" fill="none" /><path d="M42 89v18m33-18 5 18M32 90l-4 20m56-19 4 19" fill="none" stroke={grey} strokeWidth="6" /><path d="M24 112h10m4-3h10m29 0h9m-1 3h10" stroke={grey} strokeWidth="5" /><path d="M10 32q-5 14 0 22" fill="none" stroke={blue} />
    <path d="m26 21 8 6-5 4m20-3 9-10-2 13M31 73l7 9 3-3 5 9 4-4m39-12 9-6-2 10m-18 7 6 4-2 5" fill="none" stroke="#81909a" strokeWidth="1.2" /><path d="m31 31 4 1m14-2 4-1M59 83l6-6m-5 10 7-7" fill="none" stroke={paper} strokeWidth="1.2" />
  </>,
  'leaf-nepo-baby': <>
    <path d="M38 73h44l5 19H33z" fill={pink} /><path d="M34 91h52l-5 16H39z" fill={paper} /><path d="m41 96 7 7m24-7-6 7" fill="none" /><ellipse cx="44" cy="112" rx="10" ry="4" fill={pink} /><ellipse cx="77" cy="112" rx="10" ry="4" fill={pink} /><circle cx="23" cy="49" r="10" fill={pink} /><circle cx="96" cy="49" r="10" fill={pink} /><ellipse cx="60" cy="46" rx="33" ry="31" fill={pink} />
    <path d="M26 29q-2-24 33-24 32 0 34 24z" fill={pink} /><path d="M26 29h67M35 16v12m12-16v16m12-18v18m12-16v16m12-12v12" fill="none" stroke={purple} /><Eyes x={45} y={42} gap={29} small />
    <ellipse cx="60" cy="63" rx="16" ry="10" fill={orange} /><circle cx="60" cy="65" r="6" fill={paper} /><path d="M38 75q22 27 44 0" fill="none" stroke={yellow} strokeWidth="5" /><circle cx="61" cy="88" r="6" fill={yellow} /><path d="m31 84-15 10m72-10 16 10" stroke={pink} strokeWidth="9" />
    <path d="M32 25h55M19 45q-4 3 0 7m82-7q4 3 0 7M37 96l8 8m29 0 8-8" fill="none" strokeWidth="1.1" /><path d="M37 14q7-6 16-6" fill="none" stroke={paper} strokeWidth="1.5" opacity=".7" /><circle cx="61" cy="88" r="3.6" fill="none" stroke={brown} strokeWidth="1" />
  </>,
  'leaf-philanthropist': <>
    <path d="M43 38q17-12 32 0v27q-12 18-32-1z" fill="#cda875" /><path d="M42 30V8h35v22m-45 2h55" fill={powderBlue} strokeWidth="5" /><path d="M44 23h31" stroke={pink} strokeWidth="6" /><Eyes x={49} y={45} gap={19} small /><path d="M49 61q10 6 19-2" fill="none" />
    <path d="M42 70h34l6 39H35z" fill={powderBlue} /><path d="m47 70 12 17 12-17M59 87v21" fill="none" /><circle cx="66" cy="94" r="2" fill={yellow} /><path d="M39 79 20 90l-10-5m70-6 19 11 11-5" fill="none" strokeWidth="5" />
    <path d="M12 72q-8-12 2-14 7-1 9 6 4-8 10-3 8 8-14 18z" fill={pink} /><circle cx="99" cy="75" r="9" fill={yellow} /><Feet x={44} y={108} gap={27} />
    <path d="m45 75-4 18 11-4m21-14 4 18-11-4M41 101h10m18 0h9m-33-89h27M50 17v3m20-3v3" fill="none" stroke={paper} strokeWidth="1.1" opacity=".7" /><path d="M96 72h6m-6 5h6m-3-8v11" fill="none" stroke={brown} strokeWidth="1" /><path d="m13 63 2-1" fill="none" stroke={paper} strokeWidth="1.3" />
  </>,
  'leaf-race-car': <>
    <path d="M28 33h65v14H28z" fill={red} /><path d="M39 47 28 85h65L80 47z" fill={red} /><path d="M44 49h31l7 20H38z" fill={blue} /><Eyes x={48} y={58} gap={23} small />
    <g fill={ink}><rect x="14" y="46" width="17" height="24" rx="6" /><rect x="89" y="46" width="17" height="24" rx="6" /><rect x="10" y="81" width="22" height="29" rx="7" /><rect x="89" y="81" width="22" height="29" rx="7" /></g>
    <path d="m45 69-8 31h47L73 69z" fill={red} /><path d="M22 98h76v11H22z" fill={red} /><path d="M53 75h14l-3 18h-8z" fill={yellow} /><path d="M6 30h19m-13-9h14m68 96h4" stroke={blue} />
    <path d="M33 37h54m-54 5h54M14 88h13m-13 7h13m-13 7h13m66-14h13m-13 7h13m-13 7h13m-88-52h9m62 0h9m-88 7h9m62 0h9" fill="none" stroke={grey} strokeWidth="1.1" /><path d="m43 77-4 17m36-17 4 17M27 102h20m25 0h22M41 64h7" fill="none" stroke={paper} strokeWidth="1.2" /><path d="m57 78 5 0-1 11h-3z" fill={paper} stroke="none" />
  </>,
  'leaf-revolutionary': <>
    <path d="m33 63-11 45h64L73 63z" fill={purple} /><path d="M33 35q21-18 44-1v26q-22 20-44 0z" fill={pink} /><path d="M28 35q-7-30 28-29 37-3 36 19l-10 4q4-16-11-15 13 16 6 24z" fill={purple} /><path d="M31 33q22 7 45 1m-6-20q-7-3-13-1" fill="none" stroke="#d3c5e6" strokeWidth="2" /><Eyes x={43} y={43} gap={24} small /><path d="M44 62q12 6 22-1" fill="none" />
    <path d="m41 68 13 21 11-20M54 89v17" fill="none" /><circle cx="66" cy="90" r="3" fill={yellow} /><path d="M25 82 12 92m67-11 19-12" fill="none" strokeWidth="5" /><path d="M97 110V49q0-12 10-9" stroke={brown} strokeWidth="4" fill="none" /><Feet x={35} y={107} gap={35} />
    <path d="M34 26q1-13 16-15m-10 62-4 22m35-22 7 21M34 99h11m22 0h11" fill="none" stroke={yellow} strokeWidth="1.2" /><g fill={yellow} stroke="none"><circle cx="65" cy="98" r="1.6" /><circle cx="65" cy="105" r="1.6" /></g><path d="m36 74 11 11-3 5m26-16-9 11 3 5" fill="none" strokeWidth="1.1" />
  </>,
  'leaf-sole-survivor': <>
    <Feet x={43} y={103} gap={31} color={orange} />
    <path d="M31 31q26-13 52 0v33q-26 15-51 0z" fill={orange} /><path d="M25 31q0-29 33-27 33 1 34 27z" fill={modelGreen} /><path d="M21 33h76M60 5v23" fill="none" /><Eyes x={44} y={43} gap={28} small />
    <path d="M57 56Q38 46 29 65l30 4 27-4q-7-19-27-9z" fill={brown} /><path d="m39 58 4 8m7-12 3 13m13-13-3 13m12-10-4 10" stroke={yellow} strokeWidth="2" /><path d="M40 69h37l5 22H34z" fill={orange} />
    <path d="m34 87-7 14 13-3 9 6 10-5 11 5 10-6 11 3-11-14z" fill={modelGreen} /><path d="m42 90-3 9m14-9-4 11m17-11 3 11m6-11 5 9" fill="none" /><path d="M101 109V30m-68 47-18 11m64-9 22-12" strokeWidth="5" /><path d="m101 9-8 22h16z" fill={grey} />
    <path d="M34 24q1-11 14-15m20 1q11 3 13 14m-52 5h56" fill="none" stroke="#6d994f" strokeWidth="1.2" /><g fill={yellow} stroke="none"><circle cx="31" cy="30" r="1.5" /><circle cx="86" cy="30" r="1.5" /></g><path d="m43 75 6 2m16-2 7 1m-25 16-4 8m19-8 2 9m7-9 3 6" fill="none" stroke={paper} strokeWidth="1.1" opacity=".7" /><path d="m101 17-3 10h3" fill="none" stroke={paper} strokeWidth="1.2" />
  </>,
  'leaf-sore-loser': <>
    <path d="M31 67h54l5 28H27z" fill={orange} /><path d="M32 90h55v18H64v-10H52v10H32z" fill={blue} /><ellipse cx="59" cy="42" rx="29" ry="31" fill={orange} /><Eyes x={43} y={32} gap={29} small /><path d="m33 21 18 5m13-1 18-7" fill="none" />
    <path d="M47 44q25-21 43-1 8 18-14 19H46z" fill={orange} /><path d="M45 67q13-10 29-2M30 79 15 62l5-21m66 37 17-16-5-21" fill="none" strokeWidth="6" />
    <path d="M12 43V29l7-2 4 8 3-7 7 5-3 15zm95 0V29l-7-2-4 8-3-7-7 5 3 15z" fill={orange} /><Feet x={40} y={107} gap={36} color={orange} />
    <path d="m39 15 5 3m27-5 5 3M17 35l2 7m7-5 0 6m75-8-2 7m-7-5 0 6M33 82h11m28 0h12M38 96h10m21 0h12" fill="none" strokeWidth="1.1" /><path d="m51 50 6-4m17-1 6 3" fill="none" stroke={paper} strokeWidth="1.3" opacity=".65" />
  </>,
  'leaf-spiteful-spirit': <>
    <path d="M28 105Q2 85 22 49l4 21Q43 43 36 13l18 23Q69 19 65 5q29 16 21 45l12-13q24 40 5 65l-23 11-20-9-13 10z" fill={orange} />
    <path d="M39 99q-14-18 6-47l9 15 17-34q17 22 8 41l13-8q9 31-19 42z" fill={yellow} stroke="none" /><path d="m30 66 24 9-5 9-16-6z" fill={paper} /><path d="m69 75 24-9-3 12-17 6z" fill={paper} /><path d="m44 75 2 5m34-5-2 5" strokeWidth="5" /><path d="m39 94 13-5 8 8 9-8 14 4-10 13-15-5-11 4z" fill={red} />
    <path d="M25 94q-9-12-4-25m22-42 6 13m25-20q10 11 8 23m18 13q9 18 4 28M53 71l5 7 10-14" fill="none" stroke={paper} strokeWidth="1.2" opacity=".6" /><path d="m49 97 4 2m13-2 4 2" fill="none" stroke={yellow} strokeWidth="1.1" />
  </>,
  'leaf-thespian': <>
    <path d="m39 64-20 48h72L75 63z" fill={red} /><path d="M35 31q21-17 45 0v27L59 77 34 56z" fill={orange} /><path d="m35 28-7-19 19 10L59 5l11 14 16-10-6 19z" fill={yellow} /><Eyes x={45} y={40} gap={24} small />
    <path d="m39 53 11 5 9-3 10 3 10-6-3 16-16 14-20-15z" fill={brown} /><path d="M46 61q13 6 23-1" fill="none" stroke={paper} /><path d="m32 70 10 3 3 10 12-3 10 4 9-8 9-4-5 15-21 7-22-8z" fill={paper} />
    <path d="M98 79v32" stroke={brown} strokeWidth="5" /><path d="M84 44q15 7 29-2v22q-2 20-15 20-13-3-14-20z" fill={blue} /><path d="m90 56 5 3m9-3 5-3M92 73q6-12 13-1" fill="none" stroke={paper} /><Feet x={37} y={108} gap={36} color={orange} />
    <path d="M38 24h38M31 88l-6 18m55-18 5 18m-51 2h44" fill="none" stroke={yellow} strokeWidth="1.4" /><path d="m56 19 3-5 4 5-4 4z" fill={red} strokeWidth="1" /><path d="m41 94 3 7 6-4m21-3-3 7-6-4" fill="none" stroke={yellow} strokeWidth="1.1" /><path d="M87 49q10 4 23-1m-18 33 6 1" fill="none" stroke={paper} strokeWidth="1" />
  </>,
  'leaf-toucan': <>
    <path d="M24 68q-4-35 22-44 28-7 35 20l-8 48-19 17-26-18z" fill={pink} /><path d="M34 37q13-18 32-8l13 19-12 17H37z" fill={yellow} /><Eyes x={44} y={41} gap={22} small />
    <path d="M69 44q19-22 43-8 3 23-43 29z" fill={blue} /><path d="M97 31q12-1 17 7-2 13-16 18z" fill={orange} /><path d="m73 54 28-10M34 69q20-2 28 14L37 97z" fill="none" /><Feet x={40} y={101} gap={23} /><path d="m25 85-13 14 19 2" fill={pink} />
    <path d="m36 76 13 11m-14-5 9 10m-10-4 5 7m35-45 17-9m10-4 5 3M32 57l5 4" fill="none" stroke="#b76d91" strokeWidth="1.3" /><path d="M78 40q10-6 18-4m6 2 6 2" fill="none" stroke={paper} strokeWidth="1.2" /><path d="m31 96 4 4m28-3-3 5" fill="none" stroke={paper} strokeWidth="1.1" />
  </>,
  'leaf-triangle-man': <>
    <path d="m60 8 48 88H12z" fill="#e4cf83" /><path d="m60 8 48 88H91z" fill="#bba669" /><Eyes x={46} y={56} gap={26} /><path d="M46 76q13 8 26-2M25 72 11 81m87-9 12 9" fill="none" />
    <path d="m59 87-13-7v18l13-8 13 8V80z" fill={pink} /><circle cx="59" cy="89" r="4" fill={pink} /><Feet x={38} y={98} gap={40} />
    <path d="m57 22-7 14m-3 6-3 6M24 91h14m40 0h12" fill="none" stroke={paper} strokeWidth="1.5" /><path d="m71 47 3 3m2 3 3 3m2 3 3 3m2 3 3 3" fill="none" stroke="#bba669" strokeWidth="1" /><path d="m49 85 6 3m8 1 6-4" fill="none" stroke={purple} strokeWidth="1" />
  </>,
  'leaf-zombie': <>
    <path d="m32 68-9 28 16-3 9 8 15-6 20 5 9-31z" fill={powderBlue} /><path d="M32 35q-1-22 23-23h25l7 25-4 27q-27 22-50-2z" fill={modelGreen} /><path d="M52 14q-4-11 8-9 6-9 14-1 15-1 14 12l-7 10H53z" fill={pink} /><path d="m63 7-4 12m13-12-3 16m10-10-4 8" fill="none" strokeWidth="2" />
    <Eyes x={44} y={40} gap={30} small /><path d="M44 62 74 58l-4 13H48z" fill={ink} /><path d="M50 62h7v8h-7m14-10h6v7h-6" fill={paper} /><path d="M30 75 12 62l-6 5m80 8 22-13 6 5" fill="none" stroke={modelGreen} strokeWidth="8" /><path d="M36 95h45v16H65v-9H52v9H36z" fill={brown} />
    <path d="M34 49l9 4m-8-5-1 5m5-4-1 5M76 48l5-3m-6-1 3 6m-39 30 10 6-4 9-10-6z" fill="none" strokeWidth="1.1" /><path d="m62 77 3 7 10-3m-30 23v4m28-4v4" fill="none" stroke={paper} strokeWidth="1.2" /><path d="m57 11 3-2m10 2 3-3" fill="none" stroke={paper} strokeWidth="1.1" opacity=".6" />
  </>,
};
