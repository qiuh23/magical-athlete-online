import type { ReactNode } from 'react';
import { Eyes, Feet, yellow, red, blue, pink, green, paper, ink, orange, purple, brown, grey } from './expansion-portrait-parts.js';

// Costume colours and equipment follow the shipped model previews, not namesake variants.
const skin = '#e6d9b8', modelGreen = '#168a55', modelBlue = '#478ac4', cyan = '#87bbd6';

export const WURSTII_PORTRAITS: Record<string, ReactNode> = {
  'wurstii-bart-simpson': <>
    <path d="m32 66-8 30h65L80 66z" fill={orange} /><path d="M33 40V13l8 6 5-13 8 12 8-12 6 12 10-11 2 14 9-3v42q-5 21-28 17-28 1-28-21z" fill={yellow} />
    <Eyes x={47} y={38} gap={25} /><path d="M61 49h21q6 9-9 12M46 65q14 7 25-1" fill="none" /><path d="M28 79 12 91m74-12 15 12" stroke={yellow} strokeWidth="8" /><path d="M31 94h52v14H61v-8H52v8H31z" fill={blue} /><Feet x={41} y={107} gap={33} color={cyan} />
    <path d="M39 79q21 8 37-1m-44 13h50m-45 8v6m39-6v6" fill="none" strokeWidth="1.2" /><path d="m37 24 2 7m44-6v9" fill="none" stroke={paper} strokeWidth="1.7" opacity=".65" />
  </>,
  'wurstii-bucky-ohare': <>
    <path d="M35 34 30 8q6-13 13 0l7 24m16 0 7-24q7-12 12 1l-7 25" fill={modelGreen} /><path d="m34 70-9 37h65L79 70z" fill={purple} /><path d="M30 39q28-17 56 0v24q-27 23-54-1z" fill={modelGreen} />
    <Eyes x={44} y={47} gap={29} small /><ellipse cx="60" cy="65" rx="18" ry="11" fill={paper} /><path d="m53 56 7 5 7-5M55 66h11v10H55z" fill={paper} /><path d="M30 87 18 88m67-1 14 1M29 96h58" fill="none" /><circle cx="17" cy="88" r="6" fill={orange} /><circle cx="100" cy="88" r="6" fill={orange} /><rect x="53" y="91" width="13" height="10" fill={yellow} /><Feet x={40} y={107} gap={34} color={orange} />
    <path d="m35 10 5 18m38-17-5 17" fill="none" stroke={pink} strokeWidth="2.1" /><path d="m39 77 12 11 9-8 9 8 10-11M60 82v8m-25-5 8-1m31 0 7 1" fill="none" strokeWidth="1.2" /><rect x="36" y="80" width="5" height="4" rx="1" fill={yellow} strokeWidth="1" />
  </>,
  'wurstii-bullet-bill': <>
    <path d="M29 29h42q37 0 39 30-2 33-39 33H29z" fill={ink} /><path d="M24 25h14v71H24z" fill={grey} /><path d="M11 40h8M5 54h14M9 69h10M4 83h15" stroke={blue} strokeWidth="4" />
    <Eyes x={68} y={47} gap={23} small /><path d="m59 33 17 7m6-2 14-9" stroke={paper} /><path d="M72 70q12 7 22-2" fill="none" stroke={paper} /><path d="M45 67q-16-14-23 0-5 13 9 17h17l8-9-5-10z" fill={paper} /><path d="M34 68v9m8-10v10" strokeWidth="2" />
    <path d="M45 35h22q16 0 23 8m-48 43h15" fill="none" stroke={grey} strokeWidth="2" opacity=".65" /><path d="M28 31v20m0 32v7" fill="none" stroke={paper} strokeWidth="1.3" /><g fill={ink} stroke="none"><circle cx="32" cy="32" r="1.3" /><circle cx="32" cy="90" r="1.3" /></g><path d="m26 78 5 3m16-14 3 4" fill="none" stroke={grey} strokeWidth="1.2" />
  </>,
  'wurstii-chip-n-dale': <>
    <path d="M24 82Q6 59 9 94q3 17 20 10M94 85q21-33 18-4-1 24-19 23" fill={brown} />
    <ellipse cx="34" cy="80" rx="21" ry="30" fill={brown} /><ellipse cx="35" cy="84" rx="13" ry="23" fill={paper} /><circle cx="20" cy="34" r="9" fill={brown} /><circle cx="51" cy="34" r="9" fill={brown} /><ellipse cx="35" cy="49" rx="21" ry="24" fill={brown} />
    <path d="M18 30V13h31v17M12 31h45" fill={brown} /><path d="M20 24h28" stroke={ink} strokeWidth="4" /><Eyes x={27} y={46} gap={17} small /><ellipse cx="35" cy="60" rx="15" ry="11" fill={paper} /><circle cx="35" cy="54" r="5" fill={ink} /><path d="M30 63h10v6H30z" fill={paper} /><Feet x={25} y={102} gap={17} color={brown} />
    <ellipse cx="86" cy="81" rx="21" ry="29" fill={brown} /><ellipse cx="86" cy="85" rx="13" ry="23" fill={paper} /><circle cx="70" cy="36" r="9" fill={brown} /><circle cx="103" cy="36" r="9" fill={brown} /><ellipse cx="86" cy="51" rx="22" ry="24" fill={brown} />
    <path d="m75 31 3-13 7 10 5-16 5 17" fill={brown} /><Eyes x={77} y={47} gap={18} small /><ellipse cx="86" cy="62" rx="16" ry="11" fill={paper} /><circle cx="86" cy="56" r="5" fill={red} /><path d="M80 64h4v7h-4zm8 0h4v7h-4z" fill={paper} /><Feet x={76} y={102} gap={18} color={brown} />
    <path d="m16 75-6 15m42-15 8 14m6-13-5 15m40-15 8 15" stroke={brown} strokeWidth="6" /><path d="m22 79 3 11m68-12 2 11" stroke={paper} strokeWidth="1.2" fill="none" />
  </>,
  'wurstii-diddy-kong': <>
    <path d="M83 91q26 11 21-20-2-13-10-10" fill="none" stroke={brown} strokeWidth="8" /><path d="M35 71h46l5 33H28z" fill={red} /><circle cx="25" cy="46" r="11" fill={brown} /><circle cx="92" cy="46" r="11" fill={brown} /><ellipse cx="59" cy="46" rx="31" ry="29" fill={brown} /><path d="M33 38q24-18 51 0v21q-24 21-48-1z" fill={paper} /><Eyes x={46} y={42} gap={24} small />
    <path d="M27 28q2-27 32-23 28 0 29 23zm1 0h70" fill={red} strokeWidth="5" /><ellipse cx="60" cy="62" rx="23" ry="12" fill={paper} /><path d="M51 63q10 4 19-1M30 83 15 97m69-14 12 14" fill="none" /><path d="m58 80 5 8 10 2-8 6 2 10-9-5-9 5 2-10-8-6 10-2z" fill={yellow} /><Feet x={39} y={104} gap={33} color={paper} />
    <path d="M59 9v12m-23 3h42m-51 18q-8-4-7 5m70-5q8-3 7 5M40 76q19 7 36-1m-40 25h10m26 0h8" fill="none" strokeWidth="1.2" /><path d="m36 15 5-4" fill="none" stroke={paper} strokeWidth="1.5" /><path d="m98 83 2 7" fill="none" stroke={paper} strokeWidth="1" opacity=".6" />
  </>,
  'wurstii-dixie-kong': <>
    <path d="M75 28q31-24 30 18 15 31-5 52l-12-6q13-23 5-39-8-10-19 0z" fill={yellow} /><path d="M33 73h47l5 31H28z" fill={pink} /><circle cx="23" cy="48" r="11" fill={brown} /><circle cx="86" cy="48" r="11" fill={brown} /><ellipse cx="55" cy="48" rx="30" ry="29" fill={brown} /><path d="M31 39q25-19 47 0v23q-24 19-45-2z" fill={paper} />
    <path d="M24 28q8-25 37-19 31 3 23 22z" fill={pink} /><path d="m28 32 52-1" stroke={purple} strokeWidth="6" /><Eyes x={42} y={44} gap={23} small /><ellipse cx="55" cy="63" rx="21" ry="11" fill={paper} /><path d="M46 65q9 5 18-1M29 84l-15 12m66-12 14 12" fill="none" /><Feet x={38} y={104} gap={31} color={paper} />
    <path d="M89 24q10-8 10 10m-2 23q10 18-2 34" fill="none" stroke={orange} strokeWidth="1.8" /><path d="M39 14q16-6 31 2m-48 30q-6-2-5 4m68-4q6-2 6 4M38 78q18 5 34-1m-38 24h44" fill="none" strokeWidth="1.1" /><path d="m88 37 10 2-1 6-10-3z" fill={purple} strokeWidth="1.2" />
  </>,
  'wurstii-dr-wily': <>
    <path d="M38 87h43v19H63v-9H53v9H38z" fill={ink} /><Feet x={44} y={106} gap={28} />
    <path d="M32 66 25 94h66L81 66z" fill={paper} /><path d="M31 42 11 34l16-7-12-11 21 3 6-14 15 13 19-11 1 16 21-2-9 13 19 8-23 11" fill={paper} />
    <ellipse cx="59" cy="43" rx="28" ry="26" fill={skin} /><Eyes x={45} y={39} gap={28} small /><path d="m33 27 19 6m12 0 19-7" fill="none" stroke={paper} strokeWidth="6" /><path d="m58 55-14-4-14 11 27 1 7 2 25-4-14-11z" fill={paper} /><path d="M52 65h17m-27 9 17 17 17-18" fill="none" /><path d="m60 77-4 6 4 10 4-10z" fill={ink} /><path d="m27 86-14 9m77-9 15 9" stroke={skin} strokeWidth="7" />
    <path d="m37 75 5 15 9-3m26-12-5 15-7-3M59 88v5M34 81h10v9H33z" fill="none" strokeWidth="1.2" /><path d="M36 81v-6m4 6v-4" fill="none" stroke={blue} strokeWidth="1.4" /><g fill={grey} stroke="none"><circle cx="70" cy="86" r="1.4" /><circle cx="70" cy="92" r="1.4" /></g><path d="m39 57 13 3m17-2 12 1m-59-31 8 3m60-4-7 3" fill="none" stroke={grey} strokeWidth="1.1" />
  </>,
  'wurstii-dry-bones': <>
    <ellipse cx="72" cy="79" rx="27" ry="30" fill={grey} /><path d="m66 54-8 20 9 21 18-3m-27-18 34-1" fill="none" /><path d="M32 61q21-9 35 6v29H32z" fill={paper} /><path d="M33 32q-1-25 23-25 28-1 28 27l-8 23H43z" fill={paper} />
    <ellipse cx="49" cy="31" rx="8" ry="12" fill={ink} /><ellipse cx="71" cy="29" rx="8" ry="12" fill={ink} /><path d="M43 43q-16-5-17 7-3 16 28 17h22l-1-16z" fill={paper} /><path d="M36 51v2m13-2v2m-5 9v5m12-5v5m-20 9h29m-28 9h27M32 73 19 84m50-10 12 10" fill="none" /><Feet x={39} y={97} gap={34} color={grey} />
    <path d="m57 12-4 7 6 3-3 5M77 58l8 6-4 8m8 6-6 10 4 9M40 70h19m-19 11h20m-20 10h20" fill="none" stroke={grey} strokeWidth="1.2" /><path d="M87 61q9 13 7 25" fill="none" stroke={paper} strokeWidth="1.7" />
  </>,
  'wurstii-eric': <>
    <path d="M33 71h51l9 36H25z" fill={blue} /><path d="M31 37q26-17 52 0v28q-28 22-52-1z" fill={skin} /><path d="M29 32q2-24 30-24 29 0 28 24z" fill={grey} /><path d="M30 25 17 23 11 8l10-4 4 12 12 2m48 8 16-4 5-15 9 2-3 21-22 8" fill={paper} />
    <Eyes x={44} y={42} gap={29} small /><path d="m37 52 20 5 20-5 4 18-12 27-12-15-11 14-13-26z" fill={red} /><path d="m48 60 10 3 12-4" fill="none" /><path d="M25 96h67" stroke={ink} strokeWidth="7" /><rect x="54" y="91" width="13" height="10" fill={yellow} /><path d="m29 80-15 12m73-12 15 12" stroke={skin} strokeWidth="9" /><Feet x={38} y={107} gap={39} color={red} />
    <path d="M34 28h47m-24-15v12m-17 0h1m35 0h1m-34 43 4 13m5-17 4 11m7-10 3 15m5-14-1 14" fill="none" strokeWidth="1.2" /><path d="m36 77-3 11m50-11 3 11" fill="none" stroke={paper} strokeWidth="1.3" opacity=".65" /><path d="m57 94 7 0v4h-7z" fill={brown} strokeWidth="1" />
  </>,
  'wurstii-falco-lombardi': <>
    <path d="M35 89h46v17H63v-9H53v9H35z" fill={ink} />
    <path d="m34 69-6 24h57L79 68z" fill={paper} /><path d="M33 35 28 8l18 13 24-8-3 16q21 10 14 31-26 23-51-2z" fill={modelBlue} /><Eyes x={44} y={39} gap={28} small /><path d="m35 27 19 6m10-2 18-8" stroke={red} strokeWidth="5" />
    <path d="M55 50 90 57 61 70 43 59z" fill={yellow} /><path d="m42 73 14 17 14-17" fill="none" /><path d="m57 76 9 3-3 14-10-8z" fill={red} /><path d="M25 84 13 98m75-14 15 13" stroke={modelBlue} strokeWidth="8" /><Feet x={39} y={108} gap={34} color={brown} />
    <path d="m35 76 4 18 9-5m29-13-4 18-6-5M34 84h11v6H33zm36 0h11v6H70z" fill="none" strokeWidth="1.2" /><path d="m33 17 8 9m13-6 6 5M56 57l23 1" fill="none" stroke={paper} strokeWidth="1.2" opacity=".65" /><rect x="73" y="82" width="6" height="4" fill={modelBlue} strokeWidth="1" />
  </>,
  'wurstii-frogger': <>
    <path d="M27 65q-3-28 32-29 37 0 34 30L75 89H43z" fill={modelGreen} /><circle cx="38" cy="33" r="19" fill={modelGreen} /><circle cx="84" cy="33" r="19" fill={modelGreen} /><Eyes x={38} y={31} gap={46} />
    <path d="M35 57q26 18 51-2" fill="none" /><path d="M42 72q18 8 34-2l-7 16H49z" fill={yellow} /><path d="M35 77 15 86l11 18-16 5m74-32 20 9-10 18 17 5M35 65 12 58m73 7 23-8" fill="none" stroke={modelGreen} strokeWidth="9" /><path d="m10 105-6 7m8-3v6m97-10 6 7m-8-3v6" fill="none" stroke={modelGreen} strokeWidth="3" /><path d="M12 23 7 17m99 5 6-6" stroke={blue} />
    <path d="M25 29q1-7 7-10m42 4q4-6 10-5m-41 52q17 7 31-1m-29 8 24-1" fill="none" stroke={paper} strokeWidth="1.5" opacity=".7" /><g fill="#6d994f" stroke="none"><ellipse cx="33" cy="49" rx="2.5" ry="1.5" /><ellipse cx="40" cy="49" rx="1.6" ry="1.2" /><ellipse cx="81" cy="46" rx="2.5" ry="1.5" /><ellipse cx="88" cy="49" rx="1.6" ry="1.2" /></g>
  </>,
  'wurstii-hoagie': <>
    <path d="M22 61q-8-47 35-47 43 0 41 52l-15 13H34z" fill={ink} /><ellipse cx="60" cy="42" rx="24" ry="27" fill={skin} /><path d="M34 25q0-22 29-20 24 1 23 19zm-9 1h62" fill={blue} strokeWidth="5" /><Eyes x={49} y={40} gap={23} small /><path d="M49 57q12 6 22-1" fill="none" />
    <path d="M26 68q34-8 67 0l7 34H19z" fill={ink} /><path d="M22 77 10 94m84-17 14 16" stroke={skin} strokeWidth="12" /><path d="M31 101h53v9H65v-5H51v5H31z" fill={blue} /><Feet x={42} y={109} gap={31} color={paper} /><circle cx="60" cy="82" r="11" fill={paper} /><path d="M71 92q18 3 11-14 12 18-7 20H48q-13-6-7-15 0 10 10 9z" fill={orange} stroke="none" /><circle cx="56" cy="80" r="2" fill={ink} /><circle cx="64" cy="80" r="2" fill={ink} />
    <path d="M38 20q19-9 40-1m-13-8 1 8" fill="none" stroke={paper} strokeWidth="1.1" opacity=".5" /><path d="m29 35-3 23m64-23 2 24M33 74l-5 22m57-23 6 22" fill="none" stroke={grey} strokeWidth="1.2" opacity=".45" /><path d="M52 66q7 7 15-1m-13 19h12m-8-2v5m5-5v5" fill="none" strokeWidth="1" />
  </>,
  'wurstii-jason-vorhees': <>
    <path d="M34 65q26-9 49 0l7 31H27z" fill={purple} /><path d="M36 92h45l1 17H64V99h-9v10H35z" fill={purple} /><Feet x={44} y={108} gap={28} color={purple} />
    <path d="M29 41q-2-34 31-34 31 0 32 34v25H30z" fill={purple} /><ellipse cx="56" cy="38" rx="25" ry="31" fill={cyan} />
    <ellipse cx="46" cy="33" rx="4" ry="6" fill={ink} /><ellipse cx="66" cy="32" rx="4" ry="6" fill={ink} />
    <g fill={ink} stroke="none"><circle cx="48" cy="17" r="2" /><circle cx="59" cy="13" r="2" /><circle cx="68" cy="18" r="2" /><circle cx="40" cy="45" r="2" /><circle cx="44" cy="55" r="2" /><circle cx="70" cy="45" r="2" /><circle cx="67" cy="55" r="2" /><circle cx="55" cy="52" r="2" /><circle cx="55" cy="60" r="2" /></g>
    <path d="m53 43 3-4 3 4M36 73l-12 13m59-13 11 15" fill="none" /><path d="M35 75 25 86m58-11 10 13" stroke={purple} strokeWidth="10" /><circle cx="23" cy="89" r="6" fill={cyan} /><circle cx="95" cy="90" r="6" fill={cyan} />
    <path d="m39 71 15 10 14-10M56 82v10M37 90h12m22 0h10" fill="none" stroke="#cfbce3" strokeWidth="1.3" />
  </>,
  'wurstii-knuckles': <>
    <path d="M29 40q-5-26 28-28 34-1 36 29l7 29-18-8-8-25M32 29 18 67l16-6 9-27" fill={red} /><path d="M35 29q22-12 43 0v29q-22 20-44-1z" fill={red} /><Eyes x={45} y={37} gap={25} small /><ellipse cx="57" cy="56" rx="20" ry="11" fill={paper} /><ellipse cx="57" cy="49" rx="7" ry="5" fill={ink} /><path d="M47 62h20" />
    <path d="M36 68h42l10 33H28z" fill={red} /><path d="m38 74 20 12 19-12-5 15H45z" fill={paper} /><path d="M33 78 19 87m61-9 16 9" stroke={red} strokeWidth="9" />
    <path d="M11 83q9-8 20 0l-2 15H12zm76 0q10-8 21 0l-2 15H89z" fill={paper} /><path d="m15 84 4-13 5 13m69 0 4-13 5 13" fill={paper} /><path d="M31 106h20m15 0h20" stroke={yellow} strokeWidth="7" /><Feet x={39} y={107} gap={37} color={red} />
    <path d="m28 40-4 17m61-17 8 20M16 88h9m-9 5h8m68-5h10m-10 5h10M38 98h14m12 0h14" fill="none" strokeWidth="1.1" /><path d="m37 19 6-3m30 2 5 3" fill="none" stroke={paper} strokeWidth="1.6" opacity=".6" /><path d="M34 107h14m21 0h13" fill="none" stroke={yellow} strokeWidth="1.8" />
  </>,
  'wurstii-lakitu': <>
    <ellipse cx="72" cy="58" rx="24" ry="28" fill={modelGreen} /><path d="M35 41q-2-25 23-27 27-1 29 25l-6 36H39z" fill={yellow} /><path d="m56 14 3-11 5 10" fill={brown} /><Eyes x={46} y={37} gap={25} /><circle cx="46" cy="37" r="13" fill="none" stroke={ink} strokeWidth="3" /><circle cx="71" cy="35" r="13" fill="none" stroke={ink} strokeWidth="3" /><path d="M48 58q12 6 23-1m-36 6-15 10m64-10 13 10" fill="none" />
    <path d="M22 106q-18-2-14-18 2-10 15-10-3-22 17-20 11 0 15 15 18-26 32-6 5-1 11 6 21-2 17 18-1 19-20 17z" fill={paper} /><circle cx="49" cy="87" r="3" fill={modelGreen} /><circle cx="71" cy="87" r="3" fill={modelGreen} /><path d="M49 98q12 8 23-1" fill="none" stroke={green} />
    <path d="M37 34q0-6 6-7m20 4q2-6 7-6" fill="none" stroke={paper} strokeWidth="1.8" /><path d="M16 91q-3 9 9 10m7-34q6-3 11 3m36 3q7-2 10 5m12 11q8 9-3 13" fill="none" stroke={grey} strokeWidth="1.2" /><path d="m78 52 9-3 4 6" fill="none" stroke="#69934d" strokeWidth="1.2" />
  </>,
  'wurstii-lizzie': <>
    <path d="M80 88q26 19 27-10l9 18q-10 23-40 7" fill={modelGreen} /><path d="M37 61q-10 15-9 39h58q2-24-10-39z" fill={modelGreen} /><ellipse cx="57" cy="83" rx="16" ry="24" fill={yellow} /><path d="m77 57 13 9-9 8 14 9-11 9" fill={paper} />
    <path d="M31 27q25-20 50 0l-1 20q25 12 7 24-32 6-57-9z" fill={modelGreen} /><Eyes x={42} y={29} gap={28} /><path d="M37 51h3m19 0h3M36 63q19 4 36-1" fill="none" /><path d="M32 77 13 86m71-9 17 8" stroke={modelGreen} strokeWidth="11" /><Feet x={38} y={103} gap={38} color={modelGreen} />
    <path d="M44 78h24m-25 7h26m-23 8h21M39 24l3 1m25-2 3 1m18 73 7 5m-8 3 6 4" fill="none" stroke="#7c9a42" strokeWidth="1.4" /><path d="m34 42 4-2 4 2m24-2 4-2 4 2" fill="none" stroke="#69934d" strokeWidth="1.1" /><path d="m43 72 7-3" fill="none" stroke={paper} strokeWidth="1.2" />
  </>,
  'wurstii-magikarp': <>
    <path d="m80 52 28-22-4 31 5 30-29-16M43 33l8-24 11 12L74 9l-2 27M44 89l9 20 18-23" fill={yellow} /><ellipse cx="57" cy="62" rx="37" ry="33" fill={orange} /><path d="m49 54 28 12-23 16z" fill={paper} /><Eyes x={31} y={47} gap={26} small /><ellipse cx="23" cy="70" rx="15" ry="17" fill={paper} /><ellipse cx="22" cy="70" rx="8" ry="10" fill={red} />
    <path d="M16 81Q3 102 9 105m21-23q2 17 13 18" fill="none" stroke={yellow} strokeWidth="4" /><path d="m69 43 6 4m3 35 5-4m-4-24q5 5 0 10m-7-7q5 5 0 10m-8-7q5 5 0 10m30-23 8-8m-8 26 8 8" fill="none" strokeWidth="1.5" />
    <path d="m52 18 3 11m13-11-3 11m22 26 14-13m-12 21 12 13M57 94l-2 7" fill="none" stroke={brown} strokeWidth="1.2" /><path d="m31 77-3 5m17-45 4-1" fill="none" stroke={paper} strokeWidth="1.4" />
  </>,
  'wurstii-mario': <>
    <path d="m32 69-8 30h65L81 68z" fill={red} /><path d="M33 34q24-17 50 0v25q-25 22-49 0z" fill={skin} /><path d="M28 28q0-24 30-24 32 0 32 24zm-3 1h73" fill={red} strokeWidth="5" />
    <circle cx="59" cy="17" r="10" fill={paper} /><path d="M53 22V13l6 5 6-5v9" fill="none" stroke={red} strokeWidth="2.5" /><Eyes x={46} y={39} gap={25} small /><path d="M40 56q8 15 18 7 12 9 21-7l-20-7z" fill={brown} /><ellipse cx="59" cy="50" rx="11" ry="8" fill={skin} />
    <path d="M39 70v17h36V70m-37 16-5 22h22v-9h10v9h22l-8-22" fill={blue} strokeWidth="6" /><circle cx="42" cy="87" r="4" fill={yellow} /><circle cx="75" cy="87" r="4" fill={yellow} /><path d="m40 91-3 13m38-13 4 13M55 87v6h9v-6" fill="none" stroke="#7196d4" strokeWidth="1.2" /><circle cx="20" cy="96" r="10" fill={paper} /><circle cx="96" cy="96" r="10" fill={paper} /><Feet x={43} y={108} gap={33} color={brown} />
    <path d="M40 20q-3 3-3 5m42-5 3 5M37 43l-3 3m46-3 3 3M14 96h7m72 0h7" fill="none" strokeWidth="1.1" /><path d="m37 75-3 8m47-8 3 8" fill="none" stroke={paper} strokeWidth="1.1" opacity=".65" /><path d="m49 33 3-1m12 0 3 1" fill="none" stroke={brown} strokeWidth="1.2" />
  </>,
  'wurstii-mr-game-and-watch': <>
    <path d="m48 88-20 22h-9m46-22 19 22h13M43 60 28 78 16 54m56 7 17 17 17-20" strokeWidth="10" fill="none" /><path d="M42 51h32v28q0 17-16 17-16 0-16-17z" fill={ink} /><circle cx="58" cy="29" r="22" fill={ink} /><ellipse cx="80" cy="30" rx="16" ry="9" fill={ink} /><circle cx="14" cy="47" r="11" fill={ink} /><circle cx="108" cy="51" r="10" fill={ink} /><path d="M7 89h18m70-67h15" stroke={blue} strokeWidth="3" /><path d="m8 82 4-7m90-59 5-6" stroke={blue} />
    <path d="M43 19q8-9 18-7m-13 44v17" fill="none" stroke={grey} strokeWidth="1.5" opacity=".45" /><path d="M9 48h8m88 2h6" fill="none" stroke={paper} strokeWidth="1" opacity=".3" />
  </>,
  'wurstii-olaf': <>
    <path d="m28 66-12 40h63L71 65z" fill={green} /><ellipse cx="49" cy="43" rx="27" ry="29" fill={skin} /><path d="M22 30q0-22 28-22 28 0 29 22z" fill={grey} /><path d="M23 24 11 20 7 6l10-2 4 13 9 2m45 6 11-6 3-13 10 2-6 20-14 6" fill={yellow} />
    <Eyes x={36} y={40} gap={25} small /><path d="m27 50 22 6 22-6-5 39-17 10-16-10z" fill={yellow} /><path d="M39 61q10 5 19-1" fill="none" /><path d="M18 99h59" stroke={ink} strokeWidth="7" /><Feet x={29} y={106} gap={35} color={grey} />
    <path d="M80 47h32v63H80z" fill={brown} /><path d="M85 52h22v53H85z" fill="#d2ae7d" /><path d="M96 52v53M84 65h24m-24 25h24" stroke={brown} strokeWidth="3" /><g fill={grey} stroke="none"><circle cx="96" cy="52" r="1.7" /><circle cx="96" cy="104" r="1.7" /><circle cx="84" cy="78" r="1.5" /><circle cx="108" cy="78" r="1.5" /></g><path d="m93 75 3-2" fill="none" stroke={paper} strokeWidth="1.3" />
    <path d="M28 26h45m-23-13v10M32 62l3 20m6-19 2 27m9-26-2 29m11-31-3 21" fill="none" stroke={brown} strokeWidth="1.2" /><g fill={ink} stroke="none"><circle cx="30" cy="26" r="1.2" /><circle cx="68" cy="26" r="1.2" /></g><path d="m24 78-2 9m50-9 2 10" fill="none" stroke={paper} strokeWidth="1.2" opacity=".65" />
  </>,
  'wurstii-pitfall-harry': <>
    <Feet x={42} y={101} gap={29} color={modelBlue} /><path d="M34 61h45l8 39H28z" fill={cyan} /><path d="M37 94h15v12H36zm27 0h16v12H65z" fill={cyan} />
    <path d="m34 71-13 21m61-21 12 20" stroke={skin} strokeWidth="9" /><ellipse cx="57" cy="41" rx="23" ry="26" fill={skin} />
    <path d="M31 28 37 8h36l5 20M22 31q34 8 65-1" fill={cyan} strokeWidth="4" /><path d="M37 24h37" stroke="#719ea8" strokeWidth="4" /><Eyes x={46} y={40} gap={22} small /><path d="M49 57q9 5 17-1" fill="none" />
    <path d="m41 65 14 12 15-12m-15 13v19M37 85h10m20 0h10" fill="none" stroke="#6d979e" strokeWidth="1.3" /><path d="M39 13h30m-35 84h47" stroke={paper} strokeWidth="1.3" opacity=".6" />
  </>,
  'wurstii-simon-belmont': <>
    <path d="M28 62V29q0-25 28-24 30-1 30 29v34z" fill={brown} /><path d="M36 28q20-11 40 0v29q-20 21-40-1z" fill={skin} /><Eyes x={45} y={38} gap={23} small /><path d="M34 25h45" stroke={yellow} strokeWidth="6" /><path d="M47 57q10 5 19-1" fill="none" />
    <path d="m34 66-9 40h63L76 66z" fill={brown} /><path d="m39 69 32 35" stroke={yellow} strokeWidth="7" /><path d="M27 97h59" stroke={ink} strokeWidth="7" /><path d="m29 79-16 12m69-12 14 12" stroke={skin} strokeWidth="9" /><Feet x={38} y={107} gap={34} color={brown} />
    <path d="m98 83 7-11m-5 7q22 15 10 26-13 9-14-6" fill="none" stroke={brown} strokeWidth="4" /><circle cx="13" cy="91" r="6" fill={paper} />
    <path d="M32 24q2-14 15-16m33 12 1 31m-51-19v25M38 74l-4 18m38-20 5 11m-30 15 0 6m20-6 0 6" fill="none" stroke={yellow} strokeWidth="1.1" opacity=".8" /><path d="m52 83 4-3 6 6-4 3z" fill={grey} strokeWidth="1.2" /><path d="m101 84 5 4m1 3 4 4m-6 6 3 3" fill="none" stroke={ink} strokeWidth="1.1" />
  </>,
  'wurstii-tails': <>
    <path d="M74 80q29-48 35-17 6 26-25 35M76 89q40-5 30 17-12 15-34-3" fill={orange} /><path d="M97 58q19 1 10 23l-12-7zm-2 40 13 4q-1 14-15 10z" fill={paper} />
    <path d="M28 36 25 12l20 16 22-19 4 26q22 24-5 41l14 28H29L36 76Q13 60 28 36z" fill={orange} /><path d="m30 32 1-12 9 10m20-1 6-10 1 13" fill={paper} /><Eyes x={38} y={41} gap={27} small /><path d="m25 51 28 7 23-9-3 18-22 10-22-11z" fill={paper} /><ellipse cx="52" cy="56" rx="6" ry="4" fill={ink} /><path d="M42 68q10 5 19-2" fill="none" /><ellipse cx="53" cy="88" rx="13" ry="17" fill={paper} /><path d="m30 77-11 11m57-10 9 8" stroke={orange} strokeWidth="7" /><circle cx="18" cy="90" r="6" fill={paper} /><circle cx="86" cy="88" r="6" fill={paper} /><path d="M27 107h20m18 0h16" stroke={red} strokeWidth="8" />
    <path d="m86 84 10-16m-11 32 14 5M31 44l-2 3m41-3 2 3M45 82l3-5m11 2 3 5" fill="none" stroke={brown} strokeWidth="1.2" /><path d="m33 106 10 0m24 0h9" fill="none" stroke={paper} strokeWidth="2" /><path d="m91 87 6-4m-6 21 5 1" fill="none" stroke={paper} strokeWidth="1.3" />
  </>,
  'wurstii-yoshi': <>
    <path d="m76 36 14 6-8 10 15 5-10 10 12 7-15 10" fill={orange} /><path d="M38 66q-14 15-9 37h54q7-24-14-38z" fill={modelGreen} /><ellipse cx="57" cy="86" rx="17" ry="23" fill={paper} /><path d="M36 36q-6-25 8-27 10-2 12 20Q57 5 71 9q13 7 7 31z" fill={modelGreen} /><Eyes x={44} y={26} gap={24} small />
    <path d="M31 35q24-10 46 4 14 15-5 29-26 9-48-4-16-18 7-29z" fill={modelGreen} /><path d="M31 46v2m14-2v2M29 61q18 9 36-1" fill="none" /><path d="M31 78 15 91m66-13 17 12" stroke={modelGreen} strokeWidth="10" /><path d="M25 108h25m14 0h24" stroke={orange} strokeWidth="11" />
    <path d="M43 78q13-8 26 1m-27 8q15-6 30 0m-27 8q12-4 24 0" fill="none" stroke={grey} strokeWidth="1.1" /><path d="m30 41 6-2m34 3 5 3M33 107h12m24 0h13" fill="none" stroke={paper} strokeWidth="1.5" opacity=".7" /><path d="m85 48 3 1m0 13 3 1m-1 13 4 1" fill="none" stroke={paper} strokeWidth="1" />
  </>,
  'wurstii-rollercoaster-tycoon-guest': <>
    <Feet x={43} y={103} gap={29} color={brown} /><path d="M34 91h48v15H64v-8H52v8H34z" fill={cyan} /><path d="M36 61h43l7 32H29z" fill={modelGreen} />
    <path d="m34 70-13 20m60-20 12 21" stroke={skin} strokeWidth="8" /><ellipse cx="57" cy="38" rx="23" ry="27" fill={skin} />
    <path d="M34 30q-7-25 14-24l4 9 2-11q13-2 12 12l4-10q14 7 9 26l-11-8-11-6-8 10-7-10z" fill={brown} /><Eyes x={46} y={39} gap={22} small /><path d="M49 55q9 5 17-1" fill="none" />
    <path d="M44 64q12 8 25-1m-35 26h46M41 96h8m18 0h9" fill="none" stroke="#346454" strokeWidth="1.4" /><path d="m39 13 4-3m16-1 3 5" stroke="#d7b28c" strokeWidth="1.5" />
  </>,
  'wurstii-spot': <>
    <ellipse cx="58" cy="55" rx="27" ry="36" fill={red} /><path d="M34 46h20l5 6 6-6h20l-3 17H65l-6-8-5 8H37z" fill={ink} /><path d="m40 49 8 4m23-3 6 4" stroke={paper} strokeWidth="2" />
    <path d="M49 77q10 6 19-1m-35-18-17-9-6 7m75 4 18-17M47 90l-5 19m27-19 7 19" fill="none" strokeWidth="5" /><circle cx="10" cy="56" r="6" fill={paper} /><ellipse cx="38" cy="110" rx="12" ry="6" fill={paper} /><ellipse cx="80" cy="110" rx="12" ry="6" fill={paper} /><circle cx="104" cy="41" r="7" fill={paper} /><path d="M105 49v43" strokeWidth="2" /><circle cx="105" cy="98" r="7" fill={red} />
    <path d="M43 30q4-7 9-7m-17 76q2 6 6 9" fill="none" stroke={paper} strokeWidth="1.4" opacity=".7" /><path d="M31 109h12m31 0h12m-52 4h9m32 0h9m17-72 4 0" fill="none" stroke={grey} strokeWidth="1.1" />
  </>,
  'wurstii-rockford': <>
    <Feet x={43} y={102} gap={29} color={brown} /><path d="M36 91h44l2 15H64v-9H53v9H35z" fill={orange} /><path d="M35 63h45l9 31H27z" fill={orange} />
    <path d="m33 73-13 17m64-17 12 17" stroke={skin} strokeWidth="8" /><ellipse cx="57" cy="42" rx="24" ry="26" fill={skin} />
    <path d="M28 29Q27 3 57 5q31-1 30 25zM24 31h67" fill={red} strokeWidth="4" /><Eyes x={46} y={40} gap={22} small /><path d="M49 57q9 5 17-1" fill="none" />
    <path d="M35 24q1-12 17-14m-9 58q13 7 27-1M34 90h47" fill="none" stroke="#f6c58b" strokeWidth="1.6" />
  </>,
  'wurstii-burt': <>
    <ellipse cx="59" cy="79" rx="34" ry="32" fill={blue} /><path d="M42 56 38 99m19-43v53m16-53 7 43" stroke={paper} strokeWidth="8" /><path d="M28 53q34-10 62 0L78 65H40z" fill={paper} />
    <path d="M30 30q0-22 28-22 30 0 31 22l-7 21q-23 13-48-1z" fill={skin} /><Eyes x={45} y={26} gap={28} small /><ellipse cx="63" cy="41" rx="18" ry="8" fill={brown} /><ellipse cx="34" cy="40" rx="6" ry="8" fill={pink} stroke="none" /><ellipse cx="84" cy="39" rx="6" ry="8" fill={pink} stroke="none" /><path d="M44 51q15 8 28-1M47 9 41 2m21 6V1m12 9V3" fill="none" /><path d="m26 75-12 17m77-17 13 16" stroke={skin} strokeWidth="10" /><Feet x={42} y={108} gap={34} color={modelBlue} />
    <path d="M34 57q22 9 48-1M43 66l-3 25m16-23v31m16-31 5 25" fill="none" stroke={grey} strokeWidth="1.1" /><path d="m34 18 5-4m38 0 5 5" fill="none" stroke={paper} strokeWidth="1.5" /><circle cx="59" cy="66" r="2.4" fill={skin} strokeWidth="1" />
  </>,
  'wurstii-piranha-plant': <>
    <path d="M57 91V60" fill="none" stroke={ink} strokeWidth="13" /><path d="M57 91V60" fill="none" stroke={modelGreen} strokeWidth="9" />
    <path d="M52 81q-24 1-27-21 24-2 27 21zm12 3q2-22 29-20-5 22-29 20z" fill={modelGreen} /><path d="m31 66 17 12m21 2 18-11" fill="none" stroke="#6b994c" strokeWidth="1.5" />
    <path d="M31 94h56l-6 19H37z" fill={modelGreen} /><path d="M27 87h64v12H27z" fill={modelGreen} /><path d="M33 91h51m-43 10 1 8" fill="none" stroke={paper} strokeWidth="1.4" opacity=".65" />
    <circle cx="59" cy="36" r="29" fill={red} /><path d="M35 23q21 5 44-3 5 26-23 38-17-9-21-35z" fill={ink} strokeWidth="2" />
    <g fill={paper} strokeWidth="1.3"><path d="m38 27 5 12 6-11zM51 28l8 12 5-14zM67 25l7 12 3-14zM45 49l5-9 6 14zM59 53l5-13 6 7z" /></g>
    <path d="M34 22q20 6 46-3M43 49q6 7 13 10 15-6 23-18" fill="none" stroke={paper} strokeWidth="3" />
    <g fill={paper} stroke="none"><circle cx="35" cy="40" r="4" /><ellipse cx="63" cy="12" rx="5" ry="3" /><circle cx="83" cy="38" r="3.5" /><ellipse cx="69" cy="59" rx="4" ry="2.5" /></g>
    <path d="M40 15q7-5 14-5" fill="none" stroke={paper} strokeWidth="1.2" opacity=".65" />
    <path d="m33 70 8 1-2 6m36-2 8-1 0-5M42 103l1 7m32-7-1 7" fill="none" stroke="#5b8144" strokeWidth="1" />
  </>,
  'wurstii-fluffin-puffins': <>
    <ellipse cx="69" cy="60" rx="28" ry="35" fill={purple} /><ellipse cx="70" cy="66" rx="20" ry="28" fill={yellow} /><circle cx="68" cy="28" r="24" fill={paper} /><Eyes x={58} y={24} gap={22} small /><path d="m62 36 27-3-13 15-15-4z" fill={orange} /><path d="M43 53q-17 10-14 28l17-11m48-16q19 14 12 29L91 72" fill={paper} />
    <ellipse cx="27" cy="89" rx="18" ry="23" fill={purple} /><ellipse cx="28" cy="94" rx="13" ry="17" fill={yellow} /><circle cx="27" cy="70" r="15" fill={paper} /><Eyes x={21} y={68} gap={13} small /><path d="m23 78 17-2-9 9z" fill={orange} />
    <ellipse cx="88" cy="99" rx="16" ry="17" fill={purple} /><ellipse cx="88" cy="102" rx="11" ry="13" fill={yellow} /><circle cx="87" cy="84" r="13" fill={paper} /><circle cx="82" cy="82" r="2" fill={ink} /><circle cx="93" cy="82" r="2" fill={ink} /><path d="m84 90 16-2-10 8z" fill={orange} />
    <ellipse cx="56" cy="104" rx="12" ry="12" fill={purple} /><ellipse cx="56" cy="106" rx="8" ry="9" fill={yellow} /><circle cx="56" cy="91" r="11" fill={paper} /><circle cx="52" cy="89" r="2" fill={ink} /><circle cx="61" cy="89" r="2" fill={ink} /><path d="m52 96 13-2-6 7z" fill={orange} /><path d="M15 113h12m6 0h10m7 1h12m15 0h11m6 0h10" stroke={orange} strokeWidth="5" />
    <path d="m54 48 4 7 4-7m13 3 5 6 4-7m-65 43 3 3 2-4m10 3 2 4m43 9 2 3 3-3M57 100l-2 4" fill="none" stroke={grey} strokeWidth="1.2" /><path d="m45 62-9 11m61-8 4 9M67 38l10 0m-52 42h6" fill="none" stroke={brown} strokeWidth="1" />
  </>,
};
