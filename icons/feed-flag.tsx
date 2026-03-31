import { GlowIcon, baseStroke } from "./shared";

export default function FeedFlagIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <GlowIcon {...props}>
      <path d="M7.2 18.6V5.3" style={baseStroke} />
      <path d="M7.6 6.4C9.5 5.4 11.5 5.5 13.1 6.2C14.8 7 16.4 7.1 18.2 6.2V12.2C16.4 13.1 14.8 13 13.1 12.2C11.5 11.5 9.5 11.4 7.6 12.4V6.4Z" style={baseStroke} />
    </GlowIcon>
  );
}
