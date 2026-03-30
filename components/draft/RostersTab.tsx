"use client";

import { useState } from "react";
import { DraftPick, DraftPlayer, Team } from "@/lib/mockLeagueData";

export default function RostersTab({
  teams,
  picks,
  players,
}: {
  teams: Team[];
  picks: DraftPick[];
  players: DraftPlayer[];
}) {
  const [viewMode, setViewMode] = useState<"team" | "order">("team");

  const draftedEntries = picks
    .filter((pick) => pick.playerId)
    .map((pick) => ({
      pick,
      team: teams.find((team) => team.id === pick.teamId),
      player: players.find((player) => player.id === pick.playerId),
    }))
    .filter(
      (entry): entry is { pick: DraftPick; team: Team; player: DraftPlayer } =>
        Boolean(entry.team && entry.player)
    )
    .sort((a, b) => a.pick.overall - b.pick.overall);

  return (
    <div style={{ display: "grid", gap: "0.9rem" }}>
      <div style={toggleWrapStyle}>
        <button
          onClick={() => setViewMode("team")}
          style={toggleButtonStyle(viewMode === "team")}
        >
          By Team
        </button>
        <button
          onClick={() => setViewMode("order")}
          style={toggleButtonStyle(viewMode === "order")}
        >
          Draft Order
        </button>
      </div>

      {viewMode === "team" ? (
        <div style={{ display: "grid", gap: "0.85rem" }}>
          {teams.map((team) => {
            const teamEntries = draftedEntries.filter((entry) => entry.team.id === team.id);

            return (
              <section key={team.id} style={teamSectionStyle}>
                <div style={{ marginBottom: "0.75rem" }}>
                  <div style={{ color: "var(--accent-light)", fontSize: "0.82rem" }}>
                    {team.record}
                  </div>
                  <h3 style={{ marginTop: "0.2rem", fontSize: "1.1rem" }}>{team.name}</h3>
                </div>

                {teamEntries.length === 0 ? (
                  <div style={{ color: "var(--text-muted)" }}>No drafted players yet.</div>
                ) : (
                  <div style={{ display: "grid", gap: "0.55rem" }}>
                    {teamEntries.map(({ pick, player }) => (
                      <div key={pick.id} style={rosterRowStyle}>
                        <div style={{ color: "var(--accent-light)", fontWeight: 700 }}>
                          {pick.round}.{pick.overall}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700 }}>{player.name}</div>
                          <div style={{ color: "var(--text-muted)", marginTop: "0.15rem" }}>
                            {player.position} • {player.tier} • {player.lastSeasonPoints} pts
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      ) : (
        <div style={{ display: "grid", gap: "0.55rem" }}>
          {draftedEntries.map(({ pick, team, player }) => (
            <div key={pick.id} style={draftOrderRowStyle}>
              <div style={{ color: "var(--accent-light)", fontWeight: 700, minWidth: "58px" }}>
                {pick.round}.{pick.overall}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{player.name}</div>
                <div style={{ color: "var(--text-muted)", marginTop: "0.15rem" }}>
                  {player.position} • {player.tier} • {team.name}
                </div>
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
                {pick.madeBy}
              </div>
            </div>
          ))}
        </div>
      )}
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

const teamSectionStyle: React.CSSProperties = {
  borderRadius: "18px",
  border: "1px solid rgba(148,163,184,0.14)",
  background: "rgba(8,14,25,0.92)",
  padding: "0.95rem",
};

const rosterRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "56px minmax(0, 1fr)",
  gap: "0.7rem",
  alignItems: "center",
  borderRadius: "14px",
  background: "rgba(17,22,31,0.96)",
  border: "1px solid rgba(148,163,184,0.12)",
  padding: "0.75rem",
};

const draftOrderRowStyle: React.CSSProperties = {
  display: "flex",
  gap: "0.8rem",
  alignItems: "center",
  borderRadius: "14px",
  background: "rgba(17,22,31,0.96)",
  border: "1px solid rgba(148,163,184,0.12)",
  padding: "0.78rem 0.85rem",
};
