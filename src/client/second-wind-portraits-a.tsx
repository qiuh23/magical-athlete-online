import type { ReactNode } from 'react';
import { Eyes as PortraitEyes } from './expansion-portrait-parts.js';

// Hand-authored 2D portraits: shapes evoke the reference silhouettes without tracing art.
// The shared Avatar supplies the 120px SVG, rounded stroke, and circular frame.
const yellow = '#ffda27', red = '#f44735', blue = '#254de4', pink = '#f6a8d0';
const green = '#b5d66b', paper = '#fffdf4', ink = '#191919';
const purple = '#9b73c7', orange = '#ef9544', turtle = '#87bbd6', armour = '#c6d2cf';

export const SECOND_WIND_PORTRAITS_A: Record<string, ReactNode> = {
  'bite-mark': <>
    <path d="M40 97v12H30q-3 6 16 5l6-15m18-2v12h13q3 6-15 5l-5-15" fill={purple} />
    <path d="M32 45q-9-29 12-35 11-7 23 0 21-3 24 17l-1 44-16 12H39z" fill={purple} />
    <path d="M39 66q23-9 44 2l5 35H34z" fill={paper} /><path d="M44 70q16 10 32-1m-36 29h41" fill="none" stroke={purple} strokeWidth="3" />
    <path d="m37 35-13-6 4 19 11 4m42-17 15-8-4 19-12 8" fill="#aaa05b" />
    <path d="M39 30q20-12 39 0v25q-2 18-20 18-19-1-19-18z" fill="#aaa05b" />
    <path d="M34 29q-3-17 14-16 8-10 18 0 16-3 18 14l-7 7-8-13-13 3-13-1-4 19z" fill={purple} />
    <g fill="#f0cf57" strokeWidth="1.6"><ellipse cx="49" cy="42" rx="5.1" ry="7" /><ellipse cx="69" cy="41" rx="5.1" ry="7" /></g><g fill={ink} stroke="none"><circle cx="50" cy="43" r="2" /><circle cx="69" cy="43" r="2" /></g>
    <path d="m45 33 8 3m11-1 8-4M59 42l-5 15q5 5 10 0" fill="#aaa05b" strokeWidth="1.7" /><path d="M49 63q10-7 20-1" fill="none" strokeWidth="1.6" /><path d="m65 61 3 7 3-6" fill={paper} strokeWidth="1" />
    <path d="M37 78 26 88l8 6 12-9m34-7 10 10-8 6-12-9" fill="#aaa05b" /><path d="m29 88 5 2m49-1 4-2" fill="none" strokeWidth="1" />
    <path d="M40 20q4-7 10-5m17 0 9 5m-37 13-1 16m44-16 1 14" fill="none" stroke="#c3a5d7" strokeWidth="1.4" /><path d="m46 85-4 12m31-12 4 12" fill="none" stroke={purple} strokeWidth="1.1" />
  </>,
  blunderdog: <>
    <path d="m36 71-11 41h68L80 70z" fill={blue} />
    <path d="m35 72-10 17 8 25h55l5-25-12-17z" fill={red} />
    <path d="m38 35-8-22 22 14m20 0 20-14-4 25" fill={yellow} />
    <path d="M29 36q32-20 61 0l3 24q-5 23-34 23-30-3-33-24z" fill={yellow} />
    <path d="m29 42 16 2 15-5 17 4 16-5-2 18-13 3-18-5-17 6-15-5z" fill={blue} />
    <PortraitEyes x={45} y={49} gap={28} small />
    <path d="M40 64q20-6 42 3l-4 9H47z" fill={paper} /><path d="m51 64 1 10m9-10 1 11m9-9v9" fill="none" strokeWidth="2" />
    <path d="M83 56q17-4 17 6-3 8-18 8l-8-7z" fill={pink} /><circle cx="89" cy="60" r="2" fill={ink} stroke="none" />
    <path d="m30 83-12-8-2-36 12-3 8 24m54 23 12-8 2-36-12-3-8 24" fill={yellow} />
    <path d="M13 40 9 31l3-10 5 1 2 9 1-14 6-1 2 15 3-9 6 4-1 14-8 7zm94 0 4-9-3-10-5 1-2 9-1-14-6-1-2 15-3-9-6 4 1 14 8 7z" fill={yellow} />
    <path d="m60 78 5 10 11 1-8 7 3 11-11-6-10 6 2-11-8-7 12-1z" fill={blue} />
    <path d="m37 22 7 6m38-7-3 9M37 86l-3 14m51-14 3 14M40 108h12m21 0h9" fill="none" stroke={paper} strokeWidth="1.1" opacity=".7" /><path d="m19 36 5 5m-1-10 3 6m75-1-5 5m1-10-3 6" fill="none" stroke="#dc994d" strokeWidth="1.2" /><path d="m57 86 2-3 3 3" fill="none" stroke={yellow} strokeWidth="1.2" />
  </>,
  cheatah: <>
    <path d="M87 104q24 8 21-14-2-10-8-8l-1 11-14-4" fill={orange} />
    <path d="M36 72q28-9 55 2l5 40H27z" fill={green} />
    <circle cx="43" cy="25" r="9" fill={orange} /><circle cx="82" cy="25" r="9" fill={orange} /><path d="M39 24q4-6 8 0m31 0q4-6 8 0" fill="none" stroke="#c07848" strokeWidth="2" />
    <path d="M37 29q27-14 47 6l8 21 13 4q-1 18-26 19L47 75q-18-12-10-46z" fill={orange} />
    <PortraitEyes x={52} y={43} gap={24} small look={-1} />
    <path d="M94 55q12-6 14 5-2 7-13 5z" fill={ink} />
    <path d="M57 62q18 7 36 1-8 17-27 9z" fill={paper} /><path d="m68 66 2 8m9-8 2 7m9-8-2 5" fill="none" strokeWidth="2" />
    <g fill={ink} stroke="none"><circle cx="41" cy="52" r="3" /><circle cx="43" cy="61" r="2.5" /><circle cx="49" cy="59" r="2" /><ellipse cx="43" cy="89" rx="5" ry="4" /><ellipse cx="66" cy="84" rx="5" ry="4" /><ellipse cx="82" cy="100" rx="6" ry="4" /><circle cx="54" cy="106" r="4" /><circle cx="91" cy="81" r="3" /></g>
    <path d="m33 94-12-11 2-13 8 2 7 11m51 1 9-9 6 5-4 16-9 4" fill={orange} />
    <path d="M9 56h24v28H9z" fill={paper} /><g fill={green} stroke="none"><circle cx="16" cy="63" r="2.4" /><circle cx="26" cy="63" r="2.4" /><circle cx="16" cy="70" r="2.4" /><circle cx="26" cy="70" r="2.4" /><circle cx="16" cy="77" r="2.4" /><circle cx="26" cy="77" r="2.4" /></g>
    <path d="M41 77l12 8 9-8 9 8 10-7M54 85l-3 14" fill="none" strokeWidth="1.1" /><path d="m51 28 6-2m28 14 4 5m-67 33 6 2" fill="none" stroke={paper} strokeWidth="1.3" /><path d="M12 59h17v22" fill="none" stroke="#c6cbaa" strokeWidth="1" />
  </>,
  critic: <>
    <path d="M23 91Q7 65 18 32q7-21 28-21 31 4 37 41l-8 45z" fill={purple} /><path d="M29 24q-10 32 1 58M45 15q-6 27 4 45m-31-9 27-7m-26 25 34-5" fill="none" strokeWidth="1.3" />
    <path d="M41 96v12H30q-1 6 17 5l4-15m21-2v12h13q2 7-15 5l-4-15" fill={turtle} />
    <path d="M37 59q23-8 45 0l5 39q-20 13-49 1z" fill="#9aab5d" /><path d="m44 63 10 16 9-16 12 16 6-16M63 76v25" fill="none" strokeWidth="1.2" />
    <path d="M41 32q6-20 28-16 23 4 23 25 0 22-26 23-26-1-25-19z" fill={turtle} /><PortraitEyes x={55} y={34} gap={22} small look={-1} /><path d="M58 51q11 4 21-1" fill="none" strokeWidth="1.6" />
    <path d="m42 69-14-9 7-16 9 4-5 10 11 6m30 8 11 9-4 9-14-7" fill={turtle} />
    <path d="M82 75h17l-2 20H84z" fill={paper} /><path d="M99 79q9-1 7 7l-8 2M84 77h13" fill="none" strokeWidth="1.3" />
    <path d="M49 89h9v9H47m20-14h1m-1 7h1m-18-68 6-3m25 8 3 5" fill="none" strokeWidth="1.1" /><path d="M21 32q2-9 8-12m13 65-1 11" fill="none" stroke={paper} strokeWidth="1.2" opacity=".6" />
  </>,
  diva: <>
    <path d="M30 40q0-31 29-31 31 0 31 32l1 43q-2 29-31 29-30 0-31-30z" fill="#a4b36c" />
    <path d="M31 40q-15-4-15 10-8 7-1 15-9 8-1 16-5 9 4 14-2 11 11 11l7-11-3-15 3-13-4-12zM89 40q15-4 15 10 8 7 1 15 9 8 1 16 5 9-4 14 2 11-11 11l-7-11 3-15-3-13 4-12z" fill={pink} />
    <path d="m21 47 7 6-8 5m-2 14 10 3-7 6m2 12 5 4m70-50-6 6 8 5m2 14-10 3 7 6m-2 12-5 4" fill="none" stroke="#c47d9e" strokeWidth="1.1" />
    <path d="M42 43q7-5 14 0l-1 7H43zm21 0q7-5 14 0l-1 7H64z" fill={ink} /><path d="M55 45h9" fill="none" strokeWidth="2" />
    <path d="M53 59q7-7 15 0-6 7-15 0z" fill={red} strokeWidth="1.3" /><path d="M55 59h11" fill="none" strokeWidth=".8" />
    <path d="M91 62V42" fill="none" stroke={purple} strokeWidth="4" /><ellipse cx="92" cy="31" rx="9" ry="13" fill="#c3c8c9" /><path d="m88 25 4-3m-5 9 8-6" fill="none" stroke={paper} strokeWidth="1.4" />
    <path d="M39 31q2-13 12-16M42 99q15 9 32 1" fill="none" stroke="#d4dca6" strokeWidth="1.6" />
  </>,
  doppelgangster: <>
    <path d="M16 78q21-13 43 0l7 36H11zM65 78q22-14 43 0l6 36H58z" fill={purple} />
    <path d="m26 79 10 25 12-25m28 0 12 25 10-25" fill="#c09ed2" /><path d="m35 82 5-2 4 5-4 18-5-14zm50 0 5-2 4 5-4 18-5-14z" fill={red} />
    <path d="M22 32h33v35q-1 15-16 15-17-1-17-16zm48-1h33v37q-2 15-17 15-17-2-17-16z" fill={orange} />
    <PortraitEyes x={31} y={46} gap={14} small look={-1} /><PortraitEyes x={80} y={47} gap={14} small look={-2} />
    <path d="M35 49q-8 20 1 22 8 1 7-8L42 50m42 2q-7 24 2 24 10-1 4-24" fill={orange} />
    <path d="m29 74 10 2 7-3m35 4q8-7 15 1m-22-40 9 3m7-2 9-4" fill="none" />
    <path d="M12 34 22 16l24 1 9 17zm50 0 11-20 23 3 12 17z" fill={purple} /><path d="M15 29h39v7H15zm51 0h38v7H66z" fill={red} /><path d="M8 36h51m2 0h51" fill="none" strokeWidth="5" />
    <path d="m21 89-1 22m8-11-1 13m22-23 4 22m18-22-1 22m28-23 4 23" fill="none" strokeWidth="1.8" /><path d="m52 84 6-2 5 5-5 6-6-3zm51 1 6-2 5 5-5 6-6-3z" fill={red} />
    <path d="M26 21h17m34-1 16 2M24 88l6 8m20-8-4 8m27-7 6 8m20-8-4 8M28 105h8m41 0h8" fill="none" stroke={paper} strokeWidth="1.1" opacity=".7" /><g fill={yellow} stroke="none"><circle cx="44" cy="108" r="1.5" /><circle cx="94" cy="108" r="1.5" /></g><path d="m26 68 2 2m69-1 2 2" fill="none" stroke="#8d6b48" strokeWidth="1" />
  </>,
  gloth: <>
    <path d="M30 65 17 50 9 27l12-7 19 26h39l18-26 13 6-9 30-13 11 13 47H21z" fill={ink} />
    <path d="M28 49Q18 13 51 10q36-4 41 29l-1 18L79 80H43z" fill={ink} />
    <path d="M35 37q19-16 40-4l10 17q3 27-23 33-29-1-32-24z" fill={paper} />
    <path d="m35 49 16-6 5 11-14 7-11-3zm29-5 15 2 7 10-15 4-10-6z" fill={ink} />
    <g fill={paper} stroke="none"><ellipse cx="45" cy="52" rx="4" ry="5" /><ellipse cx="73" cy="51" rx="4" ry="5" /></g><g fill={ink} stroke="none"><circle cx="46" cy="53" r="2" /><circle cx="72" cy="52" r="2" /></g>
    <path d="m55 62 11-1-4 7z" fill={purple} /><path d="m53 75 7-6 8 4-7 4z" fill={ink} />
    <path d="m36 79 7 12 7-7 9 12 8-12 9 7 8-13" fill={purple} />
    <path d="M10 29 8 12l5-4 3 16 1-17h6l1 20-3 12zm99 0 3-17-5-4-3 16-1-17h-6l-1 20 3 12z" fill={purple} />
    <path d="M31 88l-5 18m61-18 6 18M43 96q15 12 31-1m-26 2 2 4m7-1 1 4m7-5 2 3" fill="none" stroke={purple} strokeWidth="1.2" /><path d="m48 89 4-5 4 5-4 4z" fill={paper} strokeWidth="1" /><path d="M25 38q-3-10 2-16m53-1 4 5" fill="none" stroke={purple} strokeWidth="1.1" />
  </>,
  'hog-knight': <>
    <path d="M35 44q23-8 44 1l3 23-51-1z" fill={armour} /><path d="m39 47-13 12 4 10 14-10m31-12 13 12-4 10-13-10" fill={armour} />
    <path d="M38 28q-2-22 20-22 24 0 24 22v17q-22 13-44 0z" fill={armour} /><path d="M47 19q11-10 22 0l2 18q-12 12-24 0z" fill={pink} /><PortraitEyes x={52} y={26} gap={13} rx={3.8} ry={5.2} /><ellipse cx="59" cy="38" rx="3.2" ry="4" fill={ink} strokeWidth="1" />
    <path d="M42 15q6-6 14-6M43 46q15 6 31 0m-37 10h8m25 0h8" fill="none" stroke={paper} strokeWidth="1.2" />
    <path d="M88 79q22 2 21-11-1-9-8-4 7 9-4 13" fill="none" stroke="#5b9b5c" strokeWidth="4" />
    <path d="M33 87h52l9 21-11 5H72l-4-18H50l-4 18H30l-5-6z" fill="#69ab6c" /><path d="M27 107h20v7H27zm45 0h21v7H72z" fill="#46524d" />
    <path d="M32 71q-16-18-7-37 11 7 12 28m42 8q18-18 10-37-11 7-13 28" fill="#59995e" /><path d="M28 40q-2 13 6 23m52-23q2 13-7 23" fill="none" stroke="#b9ca84" strokeWidth="2" />
    <path d="M29 69q5-19 29-19 25 1 31 20v18q-3 20-31 20-28-1-31-20z" fill="#69ab6c" /><PortraitEyes x={43} y={69} gap={29} small /><ellipse cx="58" cy="88" rx="21" ry="14" fill="#5b9e60" /><g fill={ink} stroke="none"><ellipse cx="50" cy="87" rx="2.4" ry="3.5" /><ellipse cx="66" cy="87" rx="2.4" ry="3.5" /></g>
    <path d="M36 83q0 17-13 14 8-5 8-17m50 3q0 17 13 14-8-5-8-17" fill={paper} /><path d="M45 100q13 6 26-1" fill="none" strokeWidth="1.3" /><path d="m36 57 6-2m33 2 5 3" fill="none" stroke={paper} strokeWidth="1.2" opacity=".6" />
  </>,
  hopfrog: <>
    <path d="M25 60q-8-35 5-47 16-9 23 29m17-2q4-34 20-30 19 8 11 43" fill={red} />
    <ellipse cx="37" cy="35" rx="11" ry="21" fill={paper} /><ellipse cx="84" cy="32" rx="11" ry="21" fill={paper} />
    <g fill={ink} stroke="none"><ellipse cx="40" cy="35" rx="5" ry="14" /><ellipse cx="86" cy="31" rx="5" ry="14" /></g>
    <path d="M24 51q36-18 72 1l13 22q-11 27-50 26-38-3-49-23z" fill={red} />
    <path d="M22 69q37 21 77-1M33 65h1m54-2h1" fill="none" /><g fill={paper} stroke="none"><ellipse cx="37" cy="27" rx="2.3" ry="5" /><ellipse cx="83" cy="23" rx="2.3" ry="5" /></g><path d="m29 56 3 1m7-4 3 1m40-1 3-1m6 4 3-1" fill="none" stroke="#b92826" strokeWidth="1.6" />
    <path d="m34 88-8 13 14 10-22 3m62-26 16 12-14 11h26" fill={red} />
    <path d="m21 92-9-10-3-13 5-2 7 10-4-17 5-2 7 18-1 18m65 0 12-11 6-13-5-2-9 11 6-18-5-2-10 18-1 18" fill={red} />
    <path d="M34 54q22-7 47 0m-53 26q23 13 55 2m-56 20 9 6m54-7-7 7" fill="none" stroke="#b92d26" strokeWidth="1.2" /><path d="m29 60 5-1m50-1 6 1" fill="none" stroke={paper} strokeWidth="1.3" opacity=".6" />
  </>,
  hotel: <>
    <path d="M38 98v9H28q-2 7 17 6l5-14m23-1v9h12q3 7-18 6l-4-14" fill="#a88353" />
    <path d="M27 37h58v63H27z" fill={red} /><path d="m85 37 14-6v63l-14 6z" fill="#c95041" />
    <path d="M23 33 42 19l45 5 16 8-18 8H23z" fill={red} /><path d="m42 19 43 7-9 7H24z" fill="#df7561" strokeWidth="1.4" />
    <path d="M73 24V9h10v18" fill={red} /><path d="M74 9h9v4h-9z" fill="#e88973" strokeWidth="1.2" />
    <path d="M22 34h64l17-5v7l-17 6H22z" fill="#e8c181" /><path d="M26 38h57m5 0 11-4" fill="none" stroke={paper} strokeWidth="1.1" />
    <PortraitEyes x={44} y={56} gap={24} small /><ellipse cx="57" cy="70" rx="7" ry="6" fill="#e8b17f" />
    <path d="M38 81q18-8 36 0l-1 10q-18 8-34-1z" fill={ink} /><path d="M41 81h29v4H41z" fill={paper} strokeWidth="1" /><path d="M47 81v4m6-4v4m6-4v4m6-4v4" fill="none" strokeWidth="1" />
    <path d="m90 49 5-2v8l-5 2zm0 18 5-2v8l-5 2zm0 18 5-2v8l-5 2z" fill="#87b6ba" strokeWidth="1.2" />
    <path d="M31 45v27m-1 21 5 1m45-47v23m-3-46 3 1" fill="none" stroke={paper} strokeWidth="1.2" opacity=".6" />
  </>,
  icarus: <>
    <path d="M32 21Q12-4 14 47q-1 40 22 58l3-46zm55 0Q108-4 107 47q1 40-23 58l-3-46z" fill="#6eae6a" />
    <path d="M22 20q-6 37 10 72m-12-50 10 13m-9 0 11 13m67-48q6 37-10 72m12-50-10 13m9 0-11 13" fill="none" stroke="#478d57" strokeWidth="1.5" />
    <path d="M47 101v8H35q-3 6 18 5l5-13m12 0 1 8h13q3 6-18 5l-4-13" fill="#aa8751" />
    <path d="M42 51h36l7 54H36z" fill={pink} /><path d="m45 61-14 11-8-5m52-5 14 10 8-5" fill="none" stroke={pink} strokeWidth="9" />
    <path d="M42 29q2-20 18-20 21 0 21 23v25q-20 13-39 0z" fill={yellow} /><PortraitEyes x={51} y={40} gap={20} small /><path d="M51 54q10 4 19-1" fill="none" strokeWidth="1.4" />
    <path d="M40 31q0-23 20-23 23 0 23 24z" fill={pink} /><path d="M42 29h39m-33-13q11-5 22 0" fill="none" stroke="#c583a5" strokeWidth="1.2" />
    <path d="M24 23v77m72-77v77" fill="none" stroke="#ba9457" strokeWidth="3" /><circle cx="25" cy="70" r="5" fill={yellow} /><circle cx="95" cy="70" r="5" fill={yellow} />
    <path d="M59 66v32m-17 3h35" fill="none" stroke="#c583a5" strokeWidth="1.2" /><g fill={purple} stroke="none"><circle cx="62" cy="71" r="1.8" /><circle cx="62" cy="82" r="1.8" /><circle cx="62" cy="93" r="1.8" /></g><path d="M18 30v16m84-16v16" fill="none" stroke={paper} strokeWidth="1.1" opacity=".6" />
  </>,
  kingtripper: <>
    <path d="M30 82q28-10 55 2l13 30H18z" fill={purple} />
    <path d="M25 39q28-16 55-2l8 18 20 7q7 20-16 29-31 17-59-2-17-16-8-50z" fill={green} />
    <PortraitEyes x={44} y={50} gap={26} rx={6} ry={7.5} look={1} /><circle cx="96" cy="64" r="2" fill={ink} stroke="none" />
    <path d="M32 70q31 17 68 1-8 25-33 24-23-1-35-25z" fill={paper} /><path d="m44 75 3 12m10-9 2 15m11-14-1 14m13-17-4 14m15-17-5 11" fill="none" strokeWidth="2" />
    <path d="M25 35 23 17q14-7 23 8L56 9q9-5 15 17 10-13 19-9l-4 18z" fill={red} /><path d="M24 31h64v10H24z" fill={yellow} />
    <circle cx="23" cy="17" r="4" fill={yellow} /><circle cx="58" cy="8" r="4" fill={yellow} /><circle cx="89" cy="17" r="4" fill={yellow} /><path d="m50 25 4 7" fill="none" />
    <path d="M103 83v31" fill="none" stroke={yellow} strokeWidth="5" /><path d="M99 70q13-3 12 8l-5 9-10-6z" fill={red} /><path d="m88 101 8 4 5-10 7 2 2 14-12 3" fill={red} />
    <path d="m31 98 8 10 14-6m15 2 12 5 7-10" fill="none" stroke={yellow} />
    <path d="m32 19 4 4m38-6-5 5M29 35h54m-51 69 4 5m45-5-4 5" fill="none" stroke={paper} strokeWidth="1.2" opacity=".7" /><path d="m41 99 5 4m29-4-5 4" fill="none" stroke={yellow} strokeWidth="1.1" /><path d="m33 56 3 1m49 0 3 1" fill="none" stroke="#809e4d" strokeWidth="1.2" />
  </>,
};
