"use client";

import { useEffect, useRef } from "react";

interface Team {
  id: string;
  name: string;
  shortName?: string;
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

          return (
            <div
              key={pick.id}
              data-pick={pick.overall}
              style={{
                width: 148,
                minHeight: 136,
                borderRadius: 18,
                background: isCurrent
                  ? "linear-gradient(180deg, rgba(249,115,22,0.95), rgba(194,65,12,0.95))"
                  : "linear-gradient(180deg, rgba(15,23,42,0.94), rgba(15,23,42,0.76))",
                border: isYourNext
                  ? "2px solid rgba(34,197,94,0.9)"
                  : "1px solid rgba(148, 163, 184, 0.16)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "0.7rem",
                color: "white",
                flexShrink: 0,
                boxShadow: isCurrent ? "0 16px 36px rgba(194,65,12,0.28)" : "none",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: "0.4rem", fontSize: "0.72rem" }}>
                <span style={{ opacity: 0.8 }}>R{pick.round}</span>
                <span style={{ opacity: 0.8 }}>#{pick.overall}</span>
              </div>

              <div style={{ minHeight: "56px" }}>
                <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>{team?.shortName || team?.name}</div>
                <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.75)", marginTop: "0.2rem" }}>
                  {pick.player_name ? pick.player_position : "On deck"}
                </div>
              </div>

              <div
                style={{
                  fontSize: "0.75rem",
                  lineHeight: 1.2,
                }}
              >
                {team?.name}
              </div>

              <div
                style={{
                  marginTop: "0.2rem",
                  paddingTop: "0.5rem",
                  borderTop: "1px solid rgba(255,255,255,0.16)",
                  fontSize: "0.74rem",
                  lineHeight: 1.2,
                }}
              >
                {pick.player_name ? `${pick.player_name} (${pick.player_position})` : "Awaiting selection"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
