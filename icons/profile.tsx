import { GlowIcon, baseStroke } from "./shared";

export default function ProfileIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <GlowIcon {...props}>
      <circle cx="12" cy="9" r="3.1" style={baseStroke} />
      <path d="M6.5 18C7.5 15.7 9.4 14.5 12 14.5C14.6 14.5 16.5 15.7 17.5 18" style={baseStroke} />
    </GlowIcon>
  );
}
