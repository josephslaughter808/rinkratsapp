"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import TeamSwitcher from "../../components/TeamSwitcher";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNav = pathname.startsWith("/dashboard/draft");

  const navItems = [
    { href: "/dashboard", label: "Home", icon: "🏠" },
    { href: "/dashboard/stats", label: "Stats", icon: "📊" },
    { href: "/dashboard/feed", label: "Feed", icon: "📣" },
    { href: "/dashboard/film", label: "Film", icon: "🎥" },
    { href: "/dashboard/draft", label: "Draft", icon: "🧩" },
    { href: "/dashboard/chat", label: "Chat", icon: "💬" },
    { href: "/dashboard/profile", label: "Profile", icon: "👤" },
  ];

  return (
    <div style={{ minHeight: "100vh", paddingBottom: hideNav ? "0px" : "80px" }}>
      
      {!hideNav && (
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
      )}

      {children}

      {!hideNav && (
        <nav
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            width: "100%",
            background: "var(--surface)",
            borderTop: "1px solid #1f2937",
            display: "flex",
            justifyContent: "space-around",
            padding: "0.75rem 0",
            zIndex: 100,
          }}
        >
          {navItems.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item${active ? " active" : ""}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textDecoration: "none",
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                }}
              >
                <span style={{ fontSize: "1.4rem" }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
