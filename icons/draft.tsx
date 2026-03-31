import { GlowIcon, baseStroke } from "./shared";

export default function DraftIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <GlowIcon {...props}>
      <path d="M6.5 5.5H14.8L17 7.7V18.5H6.5V5.5Z" style={baseStroke} />
      <path d="M14.8 5.5V7.7H17" style={baseStroke} />
      <path d="M9 10H14" style={baseStroke} />
      <path d="M9 13H13.2" style={baseStroke} />
      <path d="M14.8 15.3L18.5 11.6L19.9 13L16.2 16.7L14.2 17.2L14.8 15.3Z" style={baseStroke} />
    </GlowIcon>
  );
}
