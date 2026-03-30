"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import TeamSwitcher from "../../components/TeamSwitcher";
import { TeamProvider } from "@/context/TeamContext";

// SVG ICON COMPONENT IMPORTS (TSX)
import HomeIcon from "@/icons/home";
import StatsIcon from "@/icons/stats";
import FeedIcon from "@/icons/feed";
import FilmIcon from "@/icons/film";
import DraftIcon from "@/icons/draft";
import ChatIcon from "@/icons/chat";
import ProfileIcon from "@/icons/profile";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // FIXED: pathname always starts with "/"
  const hideNav = pathname.startsWith("/dashboard/draft");

  const navItems = [
    { href: "/dashboard", label: "Home", icon: HomeIcon },
    { href: "/dashboard/stats", label: "Stats", icon: StatsIcon },
    { href: "/dashboard/feed", label: "Feed", icon: FeedIcon },
    { href: "/dashboard/film", label: "Film", icon: FilmIcon },
    { href: "/dashboard/draft", label: "Draft", icon: DraftIcon },
    { href: "/dashboard/chat", label: "Chat", icon: ChatIcon },
    { href: "/dashboard/profile", label: "Profile", icon: ProfileIcon },
  ];

  return (
    <TeamProvider>
      <div
        style={{
          minHeight: "100vh",
          paddingBottom: hideNav ? "0px" : "var(--app-bottomnav-height)",
        }}
      >
        
        {!hideNav && (
          <div
            style={{
              width: "100%",
              background: "#0A1A2F",
              padding:
                "calc(0.75rem + var(--safe-top)) calc(0.9rem + var(--safe-right)) 0.75rem calc(0.9rem + var(--safe-left))",
              borderBottom: "1px solid #1f2937",
              position: "fixed",
              top: 0,
              left: 0,
              zIndex: 1000,
              backdropFilter: "blur(18px)",
              minHeight: "var(--app-topbar-height)",
            }}
          >
            <TeamSwitcher />
          </div>
        )}

        <div style={{ paddingTop: hideNav ? 0 : "var(--app-topbar-height)" }}>{children}</div>

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
              padding:
                "0.7rem calc(0.2rem + var(--safe-right)) calc(0.7rem + var(--safe-bottom)) calc(0.2rem + var(--safe-left))",
              zIndex: 100,
              backdropFilter: "blur(18px)",
              minHeight: "var(--app-bottomnav-height)",
            }}
          >
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;

              return (
                <Link
                  key={href}
                  href={href}
                  className={`nav-item${active ? " active" : ""}`}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textDecoration: "none",
                    fontSize: "0.8rem",
                    color: active ? "var(--text)" : "var(--text-muted)",
                  }}
                >
                  <Icon
                    className="w-6 h-6"
                    style={{
                      color: active ? "var(--text)" : "var(--text-muted)",
                    }}
                  />
                  {label}
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </TeamProvider>
  );
}
