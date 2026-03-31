import { GlowIcon, baseStroke, glowTailStyle } from "./shared";

export default function DraftIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <GlowIcon
      {...props}
      tail={<path d="M4.7 17.1C6.6 18.2 8.3 18.7 10.8 19.1" style={glowTailStyle} />}
    >
      <path d="M7 5.5H15.5L17 7V18.5H7V5.5Z" style={baseStroke} />
      <path d="M15.5 5.5V7H17" style={baseStroke} />
      <path d="M9.5 10H14.5" style={baseStroke} />
      <path d="M9.5 13H14.5" style={baseStroke} />
      <path d="M9.5 16H13" style={baseStroke} />
    </GlowIcon>
  );
}
