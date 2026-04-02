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
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/icons/icon-192.png"],
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
  maximumScale: 1,
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
