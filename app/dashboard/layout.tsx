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
              bottom: "calc(0.45rem + var(--safe-bottom))",
              left: "50%",
              transform: "translateX(-50%)",
              width: "min(94vw, 430px)",
              background:
                "linear-gradient(180deg, rgba(7,17,31,0.96), rgba(5,11,20,0.94))",
              border: "1px solid rgba(96, 165, 250, 0.42)",
              display: "flex",
              justifyContent: "space-around",
              alignItems: "center",
              padding: "0.7rem 0.55rem 0.75rem",
              zIndex: 100,
              backdropFilter: "blur(22px)",
              minHeight: "70px",
              borderRadius: "999px",
              boxShadow:
                "0 0 0 1px rgba(191,219,254,0.08), 0 0 22px rgba(59,130,246,0.24), 0 18px 40px rgba(2,6,23,0.42)",
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
                    justifyContent: "center",
                    gap: "0.26rem",
                    minWidth: 42,
                    textDecoration: "none",
                    fontSize: "0.68rem",
                    lineHeight: 1,
                    color: active ? "var(--text)" : "var(--text-muted)",
                    flex: 1,
                  }}
                >
                  <Icon
                    style={{
                      color: active ? "#93c5fd" : "rgba(226,232,240,0.62)",
                      width: 22,
                      height: 22,
                      filter: active
                        ? "drop-shadow(0 0 8px rgba(96,165,250,0.55))"
                        : "none",
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
