import { GlowIcon, baseStroke } from "./shared";

export default function FeedIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <GlowIcon {...props}>
      <path d="M6.5 17.5V8.7C6.5 7.8 7.2 7 8.2 7H14.8C15.8 7 16.5 7.8 16.5 8.7V17.5" style={baseStroke} />
      <path d="M9 7V5.8C9 5 9.7 4.4 10.5 4.4H13.5C14.3 4.4 15 5 15 5.8V7" style={baseStroke} />
      <path d="M4.8 11.5H18.2" style={baseStroke} />
      <path d="M11.5 11.5V14.6" style={baseStroke} />
      <path d="M9.8 14.6H13.2" style={baseStroke} />
    </GlowIcon>
  );
}
