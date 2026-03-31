import { GlowIcon, baseStroke, glowTailStyle } from "./shared";

export default function HomeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <GlowIcon
      {...props}
      tail={<path d="M4.5 17.5C6 18.6 7.7 19.3 9.9 19.8" style={glowTailStyle} />}
    >
      <path d="M4 10.5L12 4L20 10.5" style={baseStroke} />
      <path d="M6.5 9.8V19H17.5V9.8" style={baseStroke} />
      <path d="M10 19V13H14V19" style={baseStroke} />
    </GlowIcon>
  );
}
