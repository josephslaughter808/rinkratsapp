import "./globals.css";
import TeamSwitcher from "../components/TeamSwitcher";

export const metadata = {
  title: "Hockey App",
  description: "Dashboard",
};

export default function DashboardLayout({
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
          background: "#000",
          color: "white",
        }}
      >
        {/* GLOBAL TOP BAR */}
        <div
          style={{
            width: "100%",
            background: "#0A1A2F",
            padding: "1rem",
            borderBottom: "1px solid #1f2937",
            position: "sticky",
            top: 0,
            zIndex: 1000,
          }}
        >
          <TeamSwitcher />
        </div>

        {/* PAGE CONTENT */}
        <div>{children}</div>
      </body>
    </html>
  );
}
