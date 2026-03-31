import type { CSSProperties, ReactNode, SVGProps } from "react";

type GlowIconProps = SVGProps<SVGSVGElement> & {
  children: ReactNode;
};

export function GlowIcon({ children, style, ...props }: GlowIconProps) {
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
