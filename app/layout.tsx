import "./globals.css";

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
