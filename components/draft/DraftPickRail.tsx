"use client";

import { useEffect, useRef } from "react";

interface Team {
  id: string;
  name: string;
  logo_url?: string;
}

interface Pick {
  id: string;
  round: number;
  overall: number;
  team_id: string;
  player_name: string | null;
  player_position?: string | null;
  player_photo?: string | null;
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

  const getPositionColor = (pos: string | null | undefined) => {
    if (!pos) return "black";
    if (pos === "C") return "yellow";
    if (pos === "LW" || pos === "RW" || pos === "F") return "dodgerblue";
    if (pos === "LD" || pos === "RD") return "red";
    if (pos === "G") return "white";
    return "black";
  };

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
          const team = getTeam(pick.team_id);
          const isCurrent = pick.overall === currentPickOverall;
          const isYourNext = pick.overall === yourNextPickOverall;

          const circleBorder = pick.player_name
            ? getPositionColor(pick.player_position)
            : "black";

          return (
            <div
              key={pick.id}
              data-pick={pick.overall}
              style={{
                width: 120,               // ESPN-style wide card
                minHeight: 115,           // enough room for all content
                borderRadius: 10,
                background: isCurrent ? "#12937f" : "#1A1A1A",
                border: isYourNext ? "3px solid #00ff88" : "1px solid #333",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start",
                padding: "0.45rem",
                color: "white",
                flexShrink: 0,
                transformStyle: "preserve-3d",
                transition: "transform 0.5s",
                transform: pick.player_name ? "rotateY(180deg)" : "none",
              }}
            >
              {/* PICK NUMBER */}
              <div style={{ fontSize: "0.7rem", opacity: 0.8 }}>
                Pick {pick.round} ({pick.overall})
              </div>

              {/* CIRCLE IMAGE */}
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: `3px solid ${circleBorder}`,
                  margin: "0.35rem 0",
                  flexShrink: 0,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  background: "#000",
                }}
              >
                {pick.player_photo ? (
                  <img
                    src={pick.player_photo}
                    alt="player"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <img
                    src={team?.logo_url || "/placeholder-logo.png"}
                    alt="team"
                    style={{ width: "70%", height: "70%", objectFit: "contain" }}
                  />
                )}
              </div>

              {/* TEAM NAME */}
              <div
                style={{
                  fontSize: "0.65rem",
                  textAlign: "center",
                  lineHeight: 1.1,
                }}
              >
                {team?.name}
              </div>

              {/* PLAYER NAME */}
              {pick.player_name && (
                <div
                  style={{
                    fontSize: "0.6rem",
                    marginTop: "0.2rem",
                    opacity: 0.9,
                    textAlign: "center",
                    lineHeight: 1.1,
                  }}
                >
                  {pick.player_name} ({pick.player_position})
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
