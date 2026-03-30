"use client";

import { DraftPick, DraftPlayer, Team, draftConfig } from "@/lib/mockLeagueData";

export default function DraftBoard({
  picks,
  teams,
  players,
  viewMode,
}: {
  picks: DraftPick[];
  teams: Team[];
  players: DraftPlayer[];
  viewMode: "round" | "roster";
}) {
  const rounds = Math.max(
    draftConfig.totalRounds,
    picks.length ? Math.max(...picks.map((pick) => pick.round)) : 0,
    Math.ceil(players.length / teams.length)
  );
  const slotPositions = buildSlotPositions(rounds);

  const getPick = (round: number, teamId: string) =>
    picks.find((pick) => pick.round === round && pick.teamId === teamId);

  const getPlayer = (playerId: string | null) =>
    players.find((player) => player.id === playerId);

  return (
    <div style={boardShellStyle}>
      <div style={boardScrollStyle}>
        <div style={boardGridStyle(teams.length + 1)}>
          <div style={cornerCellStyle} />
          {teams.map((team) => (
            <div
              key={team.id}
              style={teamHeaderStyle(team.id === draftConfig.yourTeamId)}
            >
              <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                {team.record}
              </div>
              <div style={{ marginTop: "0.18rem", fontWeight: 700 }}>
                {team.name}
              </div>
            </div>
          ))}

          {viewMode === "round"
            ? Array.from({ length: rounds }).flatMap((_, i) => {
                const round = i + 1;

                return [
                  <div key={`round-${round}`} style={roundLabelStyle}>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                      Round
                    </div>
                    <div style={{ marginTop: "0.2rem", fontWeight: 700 }}>{round}</div>
                  </div>,
                  ...teams.map((team) => {
                    const pick = getPick(round, team.id);
                    const player = getPlayer(pick?.playerId || null);
                    const isCurrentPick =
                      pick?.overall === draftConfig.currentPickOverall;
                    const isYourPick =
                      pick?.overall === draftConfig.yourNextPickOverall;

                    return (
                      <div
                        key={`${round}-${team.id}`}
                        style={boardCellStyle(isCurrentPick, isYourPick)}
                      >
                        {player ? (
                          <PlayerTile
                            label={`${pick?.round}.${pick?.overall}`}
                            player={player}
                            slotLabel={slotPositions[round - 1] || "UTIL"}
                            accent={isCurrentPick ? "clock" : isYourPick ? "your" : "default"}
                          />
                        ) : isCurrentPick ? (
                          <div style={clockTileStyle}>
                            <div style={emptyMetaStyle}>
                              <span>{slotPositions[round - 1] || "UTIL"}</span>
                              <span>{round}.{pick?.overall}</span>
                            </div>
                            <div style={{ marginTop: "0.55rem", fontWeight: 700 }}>
                              On the Clock
                            </div>
                          </div>
                        ) : (
                          <div style={emptyTileStyle}>
                            <div style={emptyMetaStyle}>
                              <span>{slotPositions[round - 1] || "UTIL"}</span>
                              <span>{round}.{pick?.overall}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }),
                ];
              })
            : Array.from({ length: rounds }).flatMap((_, i) => {
                const rosterIndex = i;

                return [
                  <div key={`roster-${rosterIndex}`} style={roundLabelStyle}>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                      Slot
                    </div>
                    <div style={{ marginTop: "0.2rem", fontWeight: 700 }}>
                      {rosterIndex + 1}
                    </div>
                    <div style={{ marginTop: "0.25rem", color: "var(--accent-light)", fontSize: "0.78rem" }}>
                      {slotPositions[rosterIndex] || "UTIL"}
                    </div>
                  </div>,
                  ...teams.map((team) => {
                    const teamPicks = picks
                      .filter((pick) => pick.teamId === team.id && pick.playerId)
                      .sort((a, b) => a.overall - b.overall);
                    const pick = teamPicks[rosterIndex];
                    const player = getPlayer(pick?.playerId || null);
                    const isYourPick =
                      pick?.overall === draftConfig.yourNextPickOverall;

                    return (
                      <div
                        key={`${team.id}-${rosterIndex}`}
                        style={boardCellStyle(false, isYourPick)}
                      >
                        {player ? (
                          <PlayerTile
                            label={`${pick?.round}.${pick?.overall}`}
                            player={player}
                            slotLabel={slotPositions[rosterIndex] || "UTIL"}
                            accent={isYourPick ? "your" : "default"}
                          />
                        ) : (
                          <div style={emptyTileStyle}>
                            <div style={emptyMetaStyle}>
                              <span>{slotPositions[rosterIndex] || "UTIL"}</span>
                              <span>{rosterIndex + 1}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }),
                ];
              })}
        </div>
      </div>
    </div>
  );
}

function PlayerTile({
  label,
  player,
  slotLabel,
  accent,
}: {
  label: string;
  player: DraftPlayer;
  slotLabel: string;
  accent: "default" | "your" | "clock";
}) {
  return (
    <div style={playerTileStyle(accent, player.position)}>
      <div style={playerTileTopStyle}>
        <span>{label}</span>
        <span>{slotLabel}</span>
      </div>
      <div style={{ fontWeight: 700, lineHeight: 1.02, fontSize: "0.84rem" }}>{player.name}</div>
      <div style={{ color: "rgba(255,255,255,0.54)", marginTop: "0.18rem", fontSize: "0.72rem" }}>
        {player.previousTeam}
      </div>
      <div style={{ display: "flex", gap: "0.28rem", marginTop: "0.28rem", alignItems: "center", flexWrap: "wrap" }}>
        <span style={positionPillStyle(player.position)}>{player.position}</span>
        <span style={smallMetaPillStyle}>{player.tier}</span>
      </div>
    </div>
  );
}

function buildSlotPositions(totalSlots: number) {
  const template = [
    "LW1",
    "C1",
    "RW1",
    "LW2",
    "C2",
    "RW2",
    "LW3",
    "C3",
    "RW3",
    "LW4",
    "C4",
    "RW4",
    "LD1",
    "RD1",
    "LD2",
    "RD2",
    "LD3",
    "RD3",
    "LD4",
    "RD4",
    "G",
  ];

  return Array.from({ length: totalSlots }, (_, index) => {
    if (index < template.length) return template[index];
    if (index % 6 === 0) return "G";
    if (index % 2 === 0) return "UTIL";
    return "BN";
  });
}

const boardShellStyle: React.CSSProperties = {
  borderRadius: "12px",
  border: "1px solid rgba(148,163,184,0.1)",
  background: "#0f0f12",
  overflow: "hidden",
};

const boardScrollStyle: React.CSSProperties = {
  width: "100%",
  overflowX: "auto",
  paddingBottom: "0.35rem",
};

function boardGridStyle(columns: number): React.CSSProperties {
  return {
    minWidth: `${Math.max(columns * 88, 620)}px`,
    display: "grid",
    gridTemplateColumns: `48px repeat(${columns - 1}, minmax(82px, 1fr))`,
    gap: "1px",
    background: "rgba(255,255,255,0.07)",
  };
}

const cornerCellStyle: React.CSSProperties = {
  minHeight: "38px",
  background: "#151519",
};

function teamHeaderStyle(active: boolean): React.CSSProperties {
  return {
    minHeight: "38px",
    padding: "0.35rem 0.28rem",
    background: active ? "rgba(127,29,29,0.88)" : "#151519",
    borderBottom: active
      ? "1px solid rgba(248,113,113,0.42)"
      : "1px solid rgba(148,163,184,0.14)",
    fontSize: "0.66rem",
    lineHeight: 1.05,
  };
}

const roundLabelStyle: React.CSSProperties = {
  minHeight: "72px",
  padding: "0.32rem 0.2rem",
  background: "#16171b",
  borderTop: "1px solid rgba(148,163,184,0.1)",
  fontSize: "0.65rem",
};

function boardCellStyle(isCurrent: boolean, isYourPick: boolean): React.CSSProperties {
  return {
    minHeight: "72px",
    padding: "0.08rem",
    background: isCurrent
      ? "rgba(127,29,29,0.96)"
      : isYourPick
      ? "rgba(69,10,10,0.92)"
      : "#151519",
    borderTop: "1px solid rgba(148,163,184,0.1)",
    borderLeft: isCurrent || isYourPick ? "1px solid rgba(248,113,113,0.4)" : undefined,
    borderRight: isCurrent || isYourPick ? "1px solid rgba(248,113,113,0.4)" : undefined,
  };
}

function playerTileStyle(
  accent: "default" | "your" | "clock",
  position: string
): React.CSSProperties {
  return {
    height: "100%",
    minHeight: "62px",
    borderRadius: "4px",
    padding: "0.28rem 0.32rem",
    background:
      accent === "clock"
        ? "linear-gradient(180deg, rgba(239,68,68,0.98), rgba(220,38,38,0.94))"
        : accent === "your"
        ? "linear-gradient(180deg, rgba(127,29,29,0.98), rgba(69,10,10,0.94))"
        : "linear-gradient(180deg, rgba(37,37,43,0.98), rgba(24,24,29,0.98))",
    border:
      accent === "default"
        ? `1px solid ${withAlpha(getPositionAccent(position), 0.68)}`
        : "1px solid rgba(248,113,113,0.45)",
    color: "white",
  };
}

const playerTileTopStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "0.3rem",
  fontSize: "0.62rem",
  color: "rgba(255,255,255,0.72)",
  marginBottom: "0.22rem",
};

const emptyTileStyle: React.CSSProperties = {
  height: "100%",
  minHeight: "62px",
  borderRadius: "4px",
  border: "1px solid rgba(148,163,184,0.12)",
  background: "rgba(0,0,0,0.12)",
  color: "rgba(255,255,255,0.28)",
  padding: "0.28rem 0.32rem",
  fontSize: "0.65rem",
};

const emptyMetaStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "0.3rem",
  fontSize: "0.62rem",
};

const clockTileStyle: React.CSSProperties = {
  height: "100%",
  minHeight: "62px",
  borderRadius: "4px",
  padding: "0.28rem 0.32rem",
  background: "linear-gradient(180deg, rgba(239,68,68,0.98), rgba(220,38,38,0.94))",
  border: "1px solid rgba(254,202,202,0.42)",
  color: "white",
};

const smallMetaPillStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: "18px",
  height: "15px",
  padding: "0 0.3rem",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.12)",
  color: "rgba(255,255,255,0.82)",
  fontSize: "0.58rem",
  fontWeight: 700,
  lineHeight: 1,
};

function positionPillStyle(position: string): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "18px",
    height: "15px",
    padding: "0 0.3rem",
    borderRadius: "999px",
    background: getPositionAccent(position),
    color: "#101010",
    fontSize: "0.58rem",
    fontWeight: 800,
    lineHeight: 1,
  };
}

function getPositionAccent(position: string) {
  const normalized = position.toUpperCase();
  if (normalized === "C") return "#facc15";
  if (normalized === "LW" || normalized === "RW" || normalized === "W") return "#60a5fa";
  if (normalized === "D" || normalized === "LD" || normalized === "RD") return "#b91c1c";
  if (normalized === "G") return "#f8fafc";
  return "#cbd5e1";
}

function withAlpha(hex: string, alpha: number) {
  if (!hex.startsWith("#")) return hex;
  const value = hex.slice(1);
  const bigint = parseInt(
    value.length === 3 ? value.split("").map((char) => char + char).join("") : value,
    16
  );
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
