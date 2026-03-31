import { GlowIcon, baseStroke, glowTailStyle } from "./shared";

export default function StatsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <GlowIcon
      {...props}
      tail={<path d="M4.5 17.5C6.4 18.4 8 19 10.5 19.4" style={glowTailStyle} />}
    >
      <path d="M6 18V11" style={baseStroke} />
      <path d="M12 18V7" style={baseStroke} />
      <path d="M18 18V13" style={baseStroke} />
      <path d="M4.5 18.5H19.5" style={baseStroke} />
    </GlowIcon>
  );
}
