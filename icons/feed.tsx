import { GlowIcon, baseStroke, glowTailStyle } from "./shared";

export default function FeedIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <GlowIcon
      {...props}
      tail={<path d="M5 16.8C6.8 17.9 8.2 18.5 10.9 18.9" style={glowTailStyle} />}
    >
      <path d="M12 5.5L13.9 9.6L18.5 10.1L15.1 13.2L16 17.7L12 15.5L8 17.7L8.9 13.2L5.5 10.1L10.1 9.6L12 5.5Z" style={baseStroke} />
    </GlowIcon>
  );
}
