"use client";

import { useState } from "react";
import { DraftPlayer } from "@/lib/mockLeagueData";

export default function PlayersTab({
  players,
  queuedPlayerIds,
  draftedPlayerIds,
}: {
  players: DraftPlayer[];
  queuedPlayerIds: string[];
  draftedPlayerIds: string[];
}) {
  const [positionFilter, setPositionFilter] = useState<string>("All");
  const [tierFilter, setTierFilter] = useState<string>("All");
  const yourPickIndex = 5;

  const visiblePlayers = players
    .filter((player) => {
      if (draftedPlayerIds.includes(player.id)) return false;
      if (positionFilter === "Offense" && !["C", "LW", "RW"].includes(player.position)) {
        return false;
      }
      if (positionFilter === "Defense" && player.position !== "D") {
        return false;
      }
      if (
        !["All", "Offense", "Defense"].includes(positionFilter) &&
        player.position !== positionFilter
      ) {
        return false;
      }
      if (tierFilter !== "All" && player.tier !== tierFilter) return false;
      return true;
    })
    .sort((a, b) => b.lastSeasonPoints - a.lastSeasonPoints);

  return (
    <div style={{ display: "grid", gap: "0.9rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 152px", gap: "0.7rem" }}>
        <label style={selectWrapStyle}>
          <span style={selectLabelStyle}>Position</span>
          <select
            value={positionFilter}
            onChange={(event) => setPositionFilter(event.target.value)}
            style={selectStyle}
          >
            {[
              { value: "All", label: "All Positions" },
              { value: "Offense", label: "All Offense" },
              { value: "Defense", label: "All Defense" },
              { value: "C", label: "Center" },
              { value: "LW", label: "Left Wing" },
              { value: "RW", label: "Right Wing" },
              { value: "D", label: "Defense" },
              { value: "G", label: "Goalie" },
            ].map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label style={selectWrapStyle}>
          <span style={selectLabelStyle}>Level</span>
          <select
            value={tierFilter}
            onChange={(event) => setTierFilter(event.target.value)}
            style={selectStyle}
          >
            {["All", "R", "D", "C", "B", "A", "E"].map((value) => (
              <option key={value} value={value}>
                {value === "All" ? "All Levels" : value}
              </option>
            ))}
          </select>
        </label>
      </div>

      {visiblePlayers.map((player, index) => {
        const isQueued = queuedPlayerIds.includes(player.id);

        return (
          <div key={player.id} style={{ display: "grid", gap: "0.55rem" }}>
            {index === yourPickIndex ? (
              <div style={pickMarkerStyle}>
                <span style={pickMarkerTagStyle}>Your Pick (R2,P8)</span>
              </div>
            ) : null}

            <div
              style={{
                display: "flex",
                gap: "0.85rem",
                alignItems: "center",
                padding: "0.95rem",
                borderRadius: "18px",
                border: "1px solid rgba(148, 163, 184, 0.16)",
                background:
                  "linear-gradient(180deg, rgba(15,23,42,0.92), rgba(15,23,42,0.76))",
              }}
            >
              <img
                src={`https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${encodeURIComponent(player.name)}`}
                alt={player.name}
                style={avatarStyle}
              />

              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: "1.02rem", fontWeight: 700, lineHeight: 1.1 }}>
                  {player.name}
                </div>
                <div style={{ marginTop: "0.25rem", color: "var(--text-muted)", fontSize: "0.86rem" }}>
                  #{player.number} • {player.position}
                </div>

                <div style={statsBarStyle}>
                  <StatPill label="Lvl" value={formatLevel(player.tier)} />
                  <StatPill label="Hand" value={player.shoots} />
                  <StatPill label="Pts" value={player.lastSeasonPoints} />
                  <StatPill
                    label="+/-"
                    value={player.plusMinus > 0 ? `+${player.plusMinus}` : player.plusMinus}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gap: "0.35rem", justifyItems: "end" }}>
                <button style={queueButtonStyle(isQueued)}>
                  Queue
                </button>
                <div style={{ color: "var(--text-muted)", fontSize: "0.72rem", textAlign: "right" }}>
                  {player.previousTeam}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatPill({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div style={statPillStyle}>
      <div style={statPillLabelStyle}>{label}</div>
      <div style={statPillValueStyle}>{value}</div>
    </div>
  );
}

function formatLevel(level: DraftPlayer["tier"]) {
  if (level === "A") return "A";
  if (level === "B") return "B";
  if (level === "C") return "C";
  return level;
}

function queueButtonStyle(queued: boolean): React.CSSProperties {
  return {
    borderRadius: "999px",
    padding: "0.46rem 0.95rem",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: queued
      ? "rgba(249, 115, 22, 0.18)"
      : "rgba(255,255,255,0.02)",
    border: `1px solid ${
      queued
        ? "rgba(249,115,22,0.34)"
        : "rgba(255,255,255,0.54)"
    }`,
    color: "white",
    fontSize: "0.82rem",
    fontWeight: 700,
    minWidth: "82px",
  };
}

const selectWrapStyle: React.CSSProperties = {
  display: "grid",
  gap: "0.25rem",
};

const selectLabelStyle: React.CSSProperties = {
  color: "var(--text-muted)",
  fontSize: "0.72rem",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--surface-light)",
  color: "var(--text)",
  border: "1px solid var(--line)",
  borderRadius: "999px",
  padding: "0.7rem 0.9rem",
  appearance: "none",
  WebkitAppearance: "none",
};

const avatarStyle: React.CSSProperties = {
  width: "58px",
  height: "58px",
  borderRadius: "999px",
  objectFit: "cover",
  border: "1px solid rgba(148,163,184,0.22)",
  background: "linear-gradient(180deg, rgba(30,41,59,0.95), rgba(15,23,42,0.95))",
  flexShrink: 0,
};

const statsBarStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "0.45rem",
  marginTop: "0.7rem",
};

const statPillStyle: React.CSSProperties = {
  padding: "0.5rem 0.28rem",
  borderRadius: "12px",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(148,163,184,0.12)",
  textAlign: "center",
};

const statPillLabelStyle: React.CSSProperties = {
  color: "var(--text-muted)",
  fontSize: "0.62rem",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const statPillValueStyle: React.CSSProperties = {
  marginTop: "0.18rem",
  fontSize: "0.92rem",
  fontWeight: 700,
};

const pickMarkerStyle: React.CSSProperties = {
  position: "relative",
  height: "7px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background:
    "linear-gradient(90deg, rgba(239,68,68,0) 0%, rgba(239,68,68,0.9) 14%, rgba(239,68,68,0.9) 86%, rgba(239,68,68,0) 100%)",
};

const pickMarkerTagStyle: React.CSSProperties = {
  position: "relative",
  zIndex: 1,
  padding: "0.04rem 0.45rem",
  borderRadius: "999px",
  background: "rgba(7,17,31,0.98)",
  border: "1px solid rgba(239,68,68,0.55)",
  color: "#fca5a5",
  fontSize: "0.6rem",
  fontWeight: 700,
};
