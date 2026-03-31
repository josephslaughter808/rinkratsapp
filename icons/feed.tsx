import { GlowIcon, baseStroke, glowTailStyle } from "./shared";

export default function FeedIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <GlowIcon
      {...props}
      tail={<path d="M5 16.8C6.8 17.9 8.2 18.5 10.9 18.9" style={glowTailStyle} />}
    >
      <rect x="5.5" y="6.5" width="13" height="11" rx="2.4" style={baseStroke} />
      <path d="M8.5 10H15.5" style={baseStroke} />
      <path d="M8.5 13H15.5" style={baseStroke} />
      <path d="M8.5 16H13" style={baseStroke} />
      <circle cx="8" cy="10" r="0.7" fill="currentColor" />
      <circle cx="8" cy="13" r="0.7" fill="currentColor" />
      <circle cx="8" cy="16" r="0.7" fill="currentColor" />
    </GlowIcon>
  );
}
