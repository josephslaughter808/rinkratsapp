import type { CSSProperties, ReactNode, SVGProps } from "react";

type GlowIconProps = SVGProps<SVGSVGElement> & {
  children: ReactNode;
  tail?: ReactNode;
};

export function GlowIcon({ children, tail, style, ...props }: GlowIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
      style={{
        width: 22,
        height: 22,
        overflow: "visible",
        ...style,
      }}
    >
      <g opacity="0.4">{tail}</g>
      <g>{children}</g>
    </svg>
  );
}

export const baseStroke: CSSProperties = {
  stroke: "currentColor",
  strokeWidth: 1.85,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  vectorEffect: "non-scaling-stroke",
};

export const glowTailStyle: CSSProperties = {
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  vectorEffect: "non-scaling-stroke",
  opacity: 0.55,
  filter: "drop-shadow(0 0 4px currentColor)",
};
