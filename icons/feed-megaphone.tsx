import { GlowIcon, baseStroke } from "./shared";

export default function FeedMegaphoneIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <GlowIcon {...props}>
      <path d="M6.6 12.6L15.4 8.4V15.8L6.6 13.2V12.6Z" style={baseStroke} />
      <path d="M15.4 10V14.2C17 13.9 18.2 12.9 18.9 11.7" style={baseStroke} />
      <path d="M7.4 13.2L8.6 17.1C8.8 17.7 9.5 18 10.1 17.8L11.2 17.4" style={baseStroke} />
      <path d="M18.1 8.8C18.8 9.3 19.3 9.9 19.6 10.7" style={baseStroke} />
    </GlowIcon>
  );
}
