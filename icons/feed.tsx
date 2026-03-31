import { GlowIcon, baseStroke } from "./shared";

export default function FeedIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <GlowIcon {...props}>
      <path d="M6.2 7.2H17.8V17.8H6.2V7.2Z" style={baseStroke} />
      <path d="M9.2 5.4V7.2" style={baseStroke} />
      <path d="M14.8 5.4V7.2" style={baseStroke} />
      <path d="M8.8 10.4H15.2" style={baseStroke} />
      <path d="M8.8 13.1H15.2" style={baseStroke} />
      <path d="M8.8 15.8H12.7" style={baseStroke} />
    </GlowIcon>
  );
}
