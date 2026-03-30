import { Oswald, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const headingFont = Oswald({
  subsets: ["latin"],
  variable: "--font-heading",
});

const bodyFont = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata = {
  title: "Hockey App",
  description: "Root Layout",
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
