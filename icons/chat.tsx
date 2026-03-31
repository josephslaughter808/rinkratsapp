import { GlowIcon, baseStroke } from "./shared";

export default function ChatIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <GlowIcon {...props}>
      <path d="M6.5 7.5H17.5C18.6 7.5 19.5 8.4 19.5 9.5V15C19.5 16.1 18.6 17 17.5 17H11.3L8 19.5V17H6.5C5.4 17 4.5 16.1 4.5 15V9.5C4.5 8.4 5.4 7.5 6.5 7.5Z" style={baseStroke} />
      <path d="M8.5 11.8H15.5" style={baseStroke} />
      <path d="M8.5 14.2H13.5" style={baseStroke} />
    </GlowIcon>
  );
}
