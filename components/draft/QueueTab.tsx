"use client";

import { DraftPlayer } from "@/lib/mockLeagueData";

export default function QueueTab({ players }: { players: DraftPlayer[] }) {
  return (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      {players.map((player, index) => (
        <div
          key={player.id}
          style={{
            borderRadius: "16px",
            border: "1px solid var(--line)",
            background: "rgba(7, 17, 31, 0.72)",
            padding: "0.9rem",
          }}
        >
          <div style={{ color: "var(--accent-light)", marginBottom: "0.25rem" }}>
            Queue #{index + 1}
          </div>
          <div style={{ fontWeight: 700 }}>{player.name}</div>
          <div style={{ color: "var(--text-muted)", marginTop: "0.25rem" }}>
            {player.position} • Tier {player.tier} • {player.lastSeasonPoints} pts last season
          </div>
        </div>
      ))}
    </div>
  );
}
