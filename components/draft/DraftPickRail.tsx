"use client";

import { useEffect, useRef } from "react";

interface Team {
  id: string;
  name: string;
  shortName?: string;
  accent?: string;
}

interface Pick {
  id: string;
  round: number;
  overall: number;
  teamId: string;
  player_name: string | null;
  player_position?: string | null;
}

interface Props {
  teams: Team[];
  picks: Pick[];
  currentPickOverall: number;
  yourNextPickOverall?: number;
}

export default function DraftPickRail({
  teams,
  picks,
  currentPickOverall,
  yourNextPickOverall,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  const getTeam = (teamId: string) => teams.find((t) => t.id === teamId);

  // Auto-scroll when the current pick changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const card = container.querySelector(
      `[data-pick="${currentPickOverall}"]`
    ) as HTMLElement | null;

    if (card) {
      card.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [currentPickOverall]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        overflowX: "auto",
        whiteSpace: "nowrap",
        padding: "0.75rem 0",
        background: "#0A0A0A",
        borderBottom: "1px solid #222",
      }}
    >
      <div style={{ display: "flex", gap: "0.75rem", padding: "0 1rem" }}>
        {picks.map((pick) => {
          const team = getTeam(pick.teamId);
          const isCurrent = pick.overall === currentPickOverall;
          const isYourNext = pick.overall === yourNextPickOverall;
          const hasPlayer = Boolean(pick.player_name);
          const playerOutline = getPositionOutline(pick.player_position);

          return (
            <div
              key={pick.id}
              data-pick={pick.overall}
              style={{
                width: 148,
                minHeight: 156,
                borderRadius: 18,
                background: isCurrent
                  ? "linear-gradient(180deg, rgba(249,115,22,0.95), rgba(194,65,12,0.95))"
                  : "linear-gradient(180deg, rgba(15,23,42,0.94), rgba(15,23,42,0.76))",
                border: hasPlayer
                  ? `2px solid ${playerOutline}`
                  : isYourNext
                  ? "2px solid rgba(34,197,94,0.9)"
                  : "1px solid rgba(148, 163, 184, 0.16)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "0.7rem",
                color: "white",
                flexShrink: 0,
                boxShadow: isCurrent
                  ? "0 16px 36px rgba(194,65,12,0.28)"
                  : hasPlayer
                  ? `0 10px 24px ${withAlpha(playerOutline, 0.18)}`
                  : "none",
                transition: "transform 180ms ease, border-color 180ms ease",
              }}
            >
              <div
                style={{
                  width: "100%",
                  textAlign: "center",
                  fontSize: "0.76rem",
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.82)",
                }}
              >
                Pick {pick.round} ({pick.overall})
              </div>

              {hasPlayer ? (
                <>
                  <img
                    src={`https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${encodeURIComponent(
                      pick.player_name || "Player"
                    )}`}
                    alt={pick.player_name || "Player"}
                    style={playerPhotoStyle}
                  />
                  <div style={teamNameUnderStyle}>{team?.name}</div>
                  <div style={pickedPlayerNameStyle}>{pick.player_name}</div>
                  <div style={pickedPlayerMetaStyle}>{pick.player_position}</div>
                </>
              ) : (
                <>
                  <div style={teamLogoStyle(team?.accent)}>
                    <span style={{ fontSize: "1.05rem", fontWeight: 800 }}>
                      {team?.shortName || team?.name?.slice(0, 3) || "TM"}
                    </span>
                  </div>
                  <div style={teamNameUnderStyle}>{team?.name}</div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getPositionOutline(position?: string | null) {
  const normalized = (position || "").toUpperCase();
  if (normalized === "C") return "#facc15";
  if (normalized === "LW" || normalized === "RW" || normalized === "W")
    return "#60a5fa";
  if (normalized === "D" || normalized === "LD" || normalized === "RD")
    return "#b91c1c";
  if (normalized === "G") return "#f8fafc";
  return "rgba(148, 163, 184, 0.5)";
}

function withAlpha(hex: string, alpha: number) {
  if (!hex.startsWith("#")) return hex;
  const value = hex.slice(1);
  const bigint = parseInt(value.length === 3 ? value.split("").map((c) => c + c).join("") : value, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function teamLogoStyle(accent?: string): React.CSSProperties {
  return {
    width: 64,
    height: 64,
    borderRadius: "999px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginTop: "0.65rem",
    background: `radial-gradient(circle at top, ${withAlpha(accent || "#f97316", 0.34)}, rgba(15,23,42,0.96) 68%)`,
    border: `2px solid ${withAlpha(accent || "#f97316", 0.86)}`,
    boxShadow: `0 10px 24px ${withAlpha(accent || "#f97316", 0.18)}`,
    textAlign: "center",
  };
}

const teamNameUnderStyle: React.CSSProperties = {
  marginTop: "0.8rem",
  textAlign: "center",
  fontSize: "0.82rem",
  fontWeight: 700,
  lineHeight: 1.15,
};

const playerPhotoStyle: React.CSSProperties = {
  width: 66,
  height: 66,
  borderRadius: "999px",
  objectFit: "cover",
  marginTop: "0.65rem",
  background: "rgba(255,255,255,0.08)",
  border: "2px solid rgba(255,255,255,0.12)",
};

const pickedPlayerNameStyle: React.CSSProperties = {
  marginTop: "0.55rem",
  textAlign: "center",
  fontSize: "0.8rem",
  fontWeight: 700,
  lineHeight: 1.1,
};

const pickedPlayerMetaStyle: React.CSSProperties = {
  marginTop: "0.2rem",
  textAlign: "center",
  fontSize: "0.72rem",
  color: "rgba(255,255,255,0.76)",
  fontWeight: 600,
};
