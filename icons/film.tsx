import { GlowIcon, baseStroke } from "./shared";

export default function FilmIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <GlowIcon {...props}>
      <rect x="4.5" y="6.5" width="11.5" height="11" rx="2.2" style={baseStroke} />
      <path d="M16 10L19.5 8.2V15.8L16 14" style={baseStroke} />
      <path d="M9.5 10L13.5 12L9.5 14V10Z" style={baseStroke} />
    </GlowIcon>
  );
}
