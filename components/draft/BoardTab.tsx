"use client";

import { useState } from "react";
import DraftBoard from "./DraftBoard";
import { DraftPick, DraftPlayer, Team } from "@/lib/mockLeagueData";

export default function BoardTab({
  picks,
  teams,
  players,
  currentPickOverall,
  yourNextPickOverall,
  yourTeamId,
  totalRounds,
}: {
  picks: DraftPick[];
  teams: Team[];
  players: DraftPlayer[];
  currentPickOverall: number;
  yourNextPickOverall?: number;
  yourTeamId: string;
  totalRounds: number;
}) {
  const [viewMode, setViewMode] = useState<"round" | "roster">("round");

  return (
    <div style={{ display: "grid", gap: "0.9rem" }}>
      <div style={toggleWrapStyle}>
        <button
          onClick={() => setViewMode("round")}
          style={toggleButtonStyle(viewMode === "round")}
        >
          Round View
        </button>
        <button
          onClick={() => setViewMode("roster")}
          style={toggleButtonStyle(viewMode === "roster")}
        >
          Roster View
        </button>
      </div>

      <DraftBoard
        picks={picks}
        teams={teams}
        players={players}
        viewMode={viewMode}
        currentPickOverall={currentPickOverall}
        yourNextPickOverall={yourNextPickOverall}
        yourTeamId={yourTeamId}
        totalRounds={totalRounds}
      />
    </div>
  );
}

const toggleWrapStyle: React.CSSProperties = {
  display: "inline-grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "0.35rem",
  padding: "0.3rem",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(148,163,184,0.14)",
  justifySelf: "center",
};

function toggleButtonStyle(active: boolean): React.CSSProperties {
  return {
    padding: "0.72rem 1rem",
    borderRadius: "999px",
    background: active ? "#3b82f6" : "transparent",
    color: "white",
    fontWeight: 700,
    fontSize: "0.82rem",
    minWidth: "116px",
  };
}
