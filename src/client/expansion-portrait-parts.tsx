// Shared inked details keep the expansion portraits legible at card and token sizes.
export const yellow = '#ffda27', red = '#f44735', blue = '#254de4', pink = '#f6a8d0';
export const green = '#b5d66b', paper = '#fffdf4', ink = '#191919';
export const orange = '#ef9544', purple = '#9b73c7', brown = '#a46b45', grey = '#aebbc5';

export function Eyes({ x = 46, y = 42, gap = 24, small = false, rx, ry, look = 1.4, offset = -1.5 }: { x?: number; y?: number; gap?: number; small?: boolean; rx?: number; ry?: number; look?: number; offset?: number }) {
  const width = rx ?? (small ? 4.8 : 6.8);
  const height = ry ?? (small ? 6.4 : 8.5);
  const pupilX = Math.max(-width * .34, Math.min(width * .34, look));
  return <g>
    {[0, 1].map(index => {
      const cx = x + index * gap, cy = y + index * offset;
      return <g key={index}>
        <ellipse cx={cx} cy={cy} rx={width} ry={height} fill={paper} strokeWidth="1.65" />
        <ellipse cx={cx + pupilX} cy={cy + .7} rx={width * .41} ry={height * .57} fill={ink} stroke="none" />
        <ellipse cx={cx + pupilX - .7} cy={cy - 1.3} rx={width * .14} ry={height * .14} fill={paper} stroke="none" />
        <path d={`M${cx - width * .72} ${cy - height * .65}q${width * .7}-${height * .6} ${width * 1.4}-.5`} fill="none" strokeWidth="1.1" opacity=".45" />
      </g>;
    })}
  </g>;
}
export function Feet({ x = 43, y = 94, gap = 31, color = ink }: { x?: number; y?: number; gap?: number; color?: string }) {
  const floor = Math.min(114, y + 17), ankle = floor - 5;
  return <g fill={color} strokeWidth="1.7">
    <path d={`M${x - 2} ${y}v${ankle - y}q-12 0-12 5h19V${y}zM${x + gap - 3} ${y}v${floor - y}h19q0-5-12-5V${y}z`} />
    <path d={`M${x - 10} ${floor - 1.5}h13m${gap - 4} 0h13`} fill="none" stroke={paper} strokeWidth=".8" opacity=".65" />
  </g>;
}
