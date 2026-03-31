import { GlowIcon, baseStroke } from "./shared";

export default function StatsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <GlowIcon {...props}>
      <path d="M6 18V11" style={baseStroke} />
      <path d="M12 18V7" style={baseStroke} />
      <path d="M18 18V13" style={baseStroke} />
      <path d="M4.5 18.5H19.5" style={baseStroke} />
    </GlowIcon>
  );
}
