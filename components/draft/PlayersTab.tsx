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
  const [handFilter, setHandFilter] = useState<string>("All");
  const yourPickIndex = 2;

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
      if (handFilter !== "All" && player.shoots !== handFilter) return false;
      return true;
    })
    .sort((a, b) => b.lastSeasonPoints - a.lastSeasonPoints);

  return (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      <div style={stickyControlsStyle}>
        <div style={filtersRowStyle}>
          <select
            value={positionFilter}
            onChange={(event) => setPositionFilter(event.target.value)}
            style={compactSelectStyle}
            aria-label="Filter by position"
          >
            {[
              { value: "All", label: "All Pos" },
              { value: "Offense", label: "All Off" },
              { value: "Defense", label: "All Def" },
              { value: "C", label: "C" },
              { value: "LW", label: "LW" },
              { value: "RW", label: "RW" },
              { value: "D", label: "D" },
              { value: "G", label: "G" },
            ].map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={handFilter}
            onChange={(event) => setHandFilter(event.target.value)}
            style={compactSelectStyle}
            aria-label="Filter by handedness"
          >
            {[
              { value: "All", label: "Hand" },
              { value: "L", label: "Left" },
              { value: "R", label: "Right" },
            ].map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={tierFilter}
            onChange={(event) => setTierFilter(event.target.value)}
            style={compactSelectStyle}
            aria-label="Filter by level"
          >
            {["All", "R", "D", "C", "B", "A", "E"].map((value) => (
              <option key={value} value={value}>
                {value === "All" ? "Level" : value}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              setPositionFilter("All");
              setHandFilter("All");
              setTierFilter("All");
            }}
            style={resetButtonStyle}
          >
            Reset
          </button>
        </div>

        <div style={headerRowStyle}>
          <div style={rankHeaderStyle}>RK</div>
          <div style={playerHeaderStyle}>PLAYER</div>
          <div style={numberHeaderStyle}>ADP</div>
          <div style={numberHeaderStyle}>PROJ</div>
          <div style={queueHeaderStyle} />
        </div>
      </div>

      <div style={tableShellStyle}>

        {visiblePlayers.map((player, index) => {
          const isQueued = queuedPlayerIds.includes(player.id);

          return (
            <div key={player.id} style={{ display: "grid", gap: "0.35rem" }}>
              {index === yourPickIndex ? (
                <div style={pickMarkerStyle}>
                  <span style={pickMarkerTagStyle}>Your Pick (R1,P3)</span>
                </div>
              ) : null}

              <div style={playerRowStyle}>
                <div style={rankCellStyle}>{index + 1}</div>

                <div style={playerCellStyle}>
                  <div style={playerNameStyle}>{player.name}</div>
                  <div style={playerMetaLineStyle}>
                    <span>{player.previousTeam}</span>
                    <PositionBadge position={player.position} />
                    <MiniTag label={formatLevel(player.tier)} />
                    <MiniTag label={player.shoots} />
                  </div>
                </div>

                <div style={numberCellStyle}>0.0</div>
                <div style={numberCellStyle}>{player.lastSeasonPoints}</div>

                <div style={queueCellStyle}>
                  <button style={queueButtonStyle(isQueued)}>Queue</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PositionBadge({ position }: { position: string }) {
  return <span style={positionBadgeStyle(position)}>{position}</span>;
}

function MiniTag({ label }: { label: string }) {
  return <span style={miniTagStyle}>{label}</span>;
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
    padding: "0.36rem 0.88rem",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: queued ? "rgba(249, 115, 22, 0.16)" : "rgba(255,255,255,0.02)",
    border: `1px solid ${
      queued ? "rgba(249,115,22,0.34)" : "rgba(255,255,255,0.54)"
    }`,
    color: "white",
    fontSize: "0.78rem",
    fontWeight: 700,
    minWidth: "78px",
  };
}

const filtersRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  flexWrap: "wrap",
  padding: "0 0.15rem",
};

const stickyControlsStyle: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 30,
  display: "grid",
  gap: "0.35rem",
  paddingBottom: "0.35rem",
  background:
    "linear-gradient(180deg, rgba(5,11,20,0.98) 0%, rgba(5,11,20,0.96) 78%, rgba(5,11,20,0) 100%)",
};

const compactSelectStyle: React.CSSProperties = {
  minWidth: "92px",
  background: "rgba(31, 41, 55, 0.95)",
  color: "rgba(255,255,255,0.92)",
  border: "1px solid rgba(148,163,184,0.18)",
  borderRadius: "999px",
  padding: "0.52rem 1.8rem 0.52rem 0.75rem",
  fontSize: "0.8rem",
  fontWeight: 600,
  appearance: "none",
  WebkitAppearance: "none",
};

const resetButtonStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "#60a5fa",
  fontSize: "0.82rem",
  fontWeight: 600,
  padding: "0.4rem 0.25rem",
};

const tableShellStyle: React.CSSProperties = {
  display: "grid",
  gap: "0.15rem",
  borderTop: "1px solid rgba(148,163,184,0.14)",
};

const headerRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "38px minmax(0, 1fr) 56px 56px 86px",
  alignItems: "center",
  gap: "0.45rem",
  padding: "0.45rem 0.35rem 0.35rem",
  color: "rgba(255,255,255,0.65)",
  fontSize: "0.7rem",
  fontWeight: 700,
  letterSpacing: "0.06em",
};

const rankHeaderStyle: React.CSSProperties = {
  textAlign: "center",
};

const playerHeaderStyle: React.CSSProperties = {
  textAlign: "left",
};

const numberHeaderStyle: React.CSSProperties = {
  textAlign: "right",
};

const queueHeaderStyle: React.CSSProperties = {
  textAlign: "right",
};

const playerRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "38px minmax(0, 1fr) 56px 56px 86px",
  alignItems: "center",
  gap: "0.45rem",
  minHeight: "62px",
  padding: "0.55rem 0.35rem",
  borderTop: "1px solid rgba(148,163,184,0.08)",
  background: "rgba(255,255,255,0.02)",
};

const rankCellStyle: React.CSSProperties = {
  textAlign: "center",
  color: "rgba(255,255,255,0.62)",
  fontSize: "0.9rem",
};

const playerCellStyle: React.CSSProperties = {
  minWidth: 0,
};

const playerNameStyle: React.CSSProperties = {
  color: "#60a5fa",
  fontSize: "0.95rem",
  fontWeight: 700,
  lineHeight: 1.05,
};

const playerMetaLineStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.35rem",
  flexWrap: "wrap",
  marginTop: "0.2rem",
  color: "rgba(255,255,255,0.58)",
  fontSize: "0.76rem",
};

const numberCellStyle: React.CSSProperties = {
  textAlign: "right",
  color: "rgba(255,255,255,0.78)",
  fontSize: "0.9rem",
};

const queueCellStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
};

function positionBadgeStyle(position: string): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "22px",
    height: "18px",
    borderRadius: "999px",
    padding: "0 0.38rem",
    fontSize: "0.66rem",
    fontWeight: 800,
    color: "#101010",
    background: getPositionBadgeColor(position),
    lineHeight: 1,
  };
}

function getPositionBadgeColor(position: string) {
  const normalized = position.toUpperCase();
  if (normalized === "C") return "#facc15";
  if (normalized === "LW" || normalized === "RW" || normalized === "W") return "#60a5fa";
  if (normalized === "D" || normalized === "LD" || normalized === "RD") return "#b91c1c";
  if (normalized === "G") return "#f8fafc";
  return "#cbd5e1";
}

const miniTagStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: "20px",
  height: "18px",
  padding: "0 0.34rem",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.1)",
  color: "rgba(255,255,255,0.78)",
  fontSize: "0.66rem",
  fontWeight: 700,
  lineHeight: 1,
};

const pickMarkerStyle: React.CSSProperties = {
  position: "relative",
  height: "5px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background:
    "linear-gradient(90deg, rgba(239,68,68,0) 0%, rgba(239,68,68,0.82) 12%, rgba(239,68,68,0.82) 88%, rgba(239,68,68,0) 100%)",
};

const pickMarkerTagStyle: React.CSSProperties = {
  position: "relative",
  zIndex: 1,
  padding: "0.02rem 0.38rem",
  borderRadius: "999px",
  background: "rgba(7,17,31,0.98)",
  border: "1px solid rgba(239,68,68,0.55)",
  color: "#fca5a5",
  fontSize: "0.56rem",
  fontWeight: 700,
};
