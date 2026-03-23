"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import TeamSwitcher from "../../components/TeamSwitcher";
import { TeamProvider } from "@/context/TeamContext";

// SVG ICON IMPORTS
import HomeIcon from "@/icons/home.svg";
import StatsIcon from "@/icons/stats.svg";
import FeedIcon from "@/icons/feed.svg";
import FilmIcon from "@/icons/film.svg";
import DraftIcon from "@/icons/draft.svg";
import ChatIcon from "@/icons/chat.svg";
import ProfileIcon from "@/icons/profile.svg";

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
