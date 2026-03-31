import { Oswald, Source_Sans_3 } from "next/font/google";
import type { Metadata, Viewport } from "next";
import "./globals.css";

const headingFont = Oswald({
  subsets: ["latin"],
  variable: "--font-heading",
});

const bodyFont = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Pucklytics",
  description: "Adult league hockey stats, highlights, draft room, film, and team communication.",
  applicationName: "Pucklytics",
  icons: {
    icon: "/pucklytics-logo.png",
    apple: "/pucklytics-logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Pucklytics",
  },
};

export const viewport: Viewport = {
  themeColor: "#07111f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${headingFont.variable} ${bodyFont.variable}`}
        style={{
          margin: 0,
          padding: 0,
          background: "var(--background)",
          color: "var(--text)",
        }}
      >
        {children}
      </body>
    </html>
  );
}
