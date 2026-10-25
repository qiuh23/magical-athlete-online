import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';

// A small, self-contained ink palette. Gradients follow the whole drawing's light,
// rather than inflating every tiny shape into a glossy bubble.
const inks: Record<string, readonly [string, string, string]> = {
  '#ffda27': ['#ffe9a0', '#efbf48', '#cf8e30'],
  '#f44735': ['#f59878', '#d96350', '#ab443e'],
  '#254de4': ['#89acda', '#5275b1', '#385180'],
  '#f6a8d0': ['#f8d7d5', '#dfa0b4', '#b96f92'],
  '#b5d66b': ['#dce5ad', '#a6bf76', '#6f955b'],
  '#fffdf4': ['#fffef6', '#f3ebd8', '#dfd1b4'],
  '#ef9544': ['#f6c58b', '#dd9754', '#b8663c'],
  '#9b73c7': ['#d3c5e6', '#aa8fc5', '#795c9e'],
  '#a46b45': ['#d7b28c', '#b18765', '#79583f'],
  '#aebbc5': ['#e2e6df', '#a7b9ba', '#6c898e'],
  '#87bbd6': ['#cce2e5', '#8ab7c6', '#5c8caa'],
  '#c6d2cf': ['#eff0e6', '#bccdc5', '#849f9b'],
  '#f19a2b': ['#f6cb89', '#dc9d51', '#b46e35'],
  '#ef83b6': ['#f5c4cc', '#d989a7', '#ae6084'],
  '#8656a4': ['#c5b0d8', '#9677b1', '#6a4d87'],
  '#9664bb': ['#cfbce3', '#a081bb', '#73528f'],
  '#478ac4': ['#a6c8dc', '#6595bb', '#416887'],
  '#168a55': ['#91bca5', '#4e8c72', '#346454'],
  '#a6a34c': ['#dbd69d', '#afac6c', '#7e814e'],
  '#dfe5cb': ['#f8f6df', '#dce2c1', '#b4c09b'],
  '#a07b46': ['#d8bd91', '#ad8b5d', '#7c5e3d'],
};

type DrawingProps = { fill?: string; stroke?: string; children?: ReactNode };

export function PortraitFinish({ children, prefix }: { children: ReactNode; prefix: string }) {
  const used = new Map<string, string>();
  function paint(nodes: ReactNode): ReactNode {
    return Children.map(nodes, child => {
      if (!isValidElement<DrawingProps>(child)) return child;
      const props: DrawingProps = {};
      if (child.props.fill && inks[child.props.fill]) {
        const color = child.props.fill;
        const key = `${prefix}-${color.slice(1)}`;
        used.set(color, key);
        props.fill = `url(#${key})`;
      }
      if (child.props.stroke && inks[child.props.stroke]) props.stroke = inks[child.props.stroke]![1];
      if (child.props.stroke === '#191919') props.stroke = '#293b36';
      if (child.props.children) props.children = paint(child.props.children);
      return cloneElement(child as ReactElement<DrawingProps>, props);
    });
  }
  const artwork = paint(children);
  return <>
    <defs>{Array.from(used, ([color, key]) => <linearGradient key={key} id={key} x1="22" y1="12" x2="88" y2="112" gradientUnits="userSpaceOnUse">
      <stop stopColor={inks[color]![0]} />
      <stop offset=".55" stopColor={inks[color]![1]} />
      <stop offset="1" stopColor={inks[color]![2]} />
    </linearGradient>)}</defs>
    <g data-portrait-drawing="" transform="translate(6 5) scale(.9)">{artwork}</g>
  </>;
}
