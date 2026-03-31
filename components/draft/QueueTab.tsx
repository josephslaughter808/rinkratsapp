"use client";

import { DraftPlayer } from "@/lib/mockLeagueData";

export default function QueueTab({
  players,
  onToggleQueue,
  onDraftPlayer,
  canDraft,
}: {
  players: DraftPlayer[];
  onToggleQueue: (playerId: string) => void;
  onDraftPlayer: (playerId: string) => void;
  canDraft: boolean;
}) {
  return (
    <div style={queueTabShellStyle}>
      <div style={stickyControlsStyle}>
        <div style={headerRowStyle}>
          <div style={avatarHeaderStyle} />
          <div style={playerHeaderStyle}>PLAYER</div>
          <div style={statHeaderStyle}>LVL</div>
          <div style={statHeaderStyle}>PTS</div>
          <div style={statHeaderStyle}>HAND</div>
          <div style={statHeaderStyle}>+/-</div>
          <div style={queueHeaderStyle} />
        </div>
      </div>

      <div style={tableShellStyle}>
        {players.length === 0 ? (
          <div style={emptyStateStyle}>
            <div style={{ fontSize: "0.92rem", fontWeight: 700 }}>Queue is empty</div>
            <div style={{ color: "var(--text-muted)", marginTop: "0.3rem", fontSize: "0.8rem" }}>
              Add players from the Players tab and they will show up here.
            </div>
          </div>
        ) : (
          players.map((player) => (
            <div key={player.id} style={playerRowStyle}>
              <div style={avatarCellStyle}>
                <img
                  src={
                    player.profileUrl ||
                    `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${encodeURIComponent(player.name)}`
                  }
                  alt={player.name}
                  style={avatarStyle}
                />
              </div>

              <div style={playerCellStyle}>
                <div style={playerNameStyle}>{player.name}</div>
                <div style={playerSublineStyle}>
                  <span>#{player.number}</span>
                  <PositionBadge position={player.position} />
                </div>
              </div>

              <div style={statValueCellStyle}>{formatLevel(player.tier)}</div>
              <div style={statValueCellStyle}>{player.lastSeasonPoints}</div>
              <div style={statValueCellStyle}>{player.shoots}</div>
              <div style={statValueCellStyle}>
                {player.plusMinus > 0 ? `+${player.plusMinus}` : player.plusMinus}
              </div>

              <div style={queueCellStyle}>
                <button
                  onClick={() =>
                    canDraft ? onDraftPlayer(player.id) : onToggleQueue(player.id)
                  }
                  style={queueButtonStyle}
                >
                  {canDraft ? "Draft" : "Queue"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function PositionBadge({ position }: { position: string }) {
  return <span style={positionBadgeStyle(position)}>{position}</span>;
}

function formatLevel(level: DraftPlayer["tier"]) {
  return level;
}

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

const queueTabShellStyle: React.CSSProperties = {
  display: "block",
  alignSelf: "start",
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

const tableShellStyle: React.CSSProperties = {
  display: "grid",
  gap: "0.15rem",
  borderTop: "1px solid rgba(148,163,184,0.14)",
  alignContent: "start",
};

const emptyStateStyle: React.CSSProperties = {
  borderRadius: "18px",
  border: "1px solid rgba(148,163,184,0.14)",
  background: "rgba(8,14,25,0.92)",
  padding: "1rem",
};

const headerRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "34px minmax(0, 1.18fr) 30px 34px 36px 42px 68px",
  alignItems: "center",
  gap: "0.125rem",
  padding: "0.45rem 0.35rem 0.35rem",
  color: "rgba(255,255,255,0.65)",
  fontSize: "0.66rem",
  fontWeight: 700,
  letterSpacing: "0.06em",
};

const avatarHeaderStyle: React.CSSProperties = {
  textAlign: "center",
};

const playerHeaderStyle: React.CSSProperties = {
  textAlign: "left",
};

const statHeaderStyle: React.CSSProperties = {
  textAlign: "center",
};

const queueHeaderStyle: React.CSSProperties = {
  textAlign: "right",
};

const playerRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "34px minmax(0, 1.18fr) 30px 34px 36px 42px 68px",
  alignItems: "center",
  gap: "0.125rem",
  minHeight: "50px",
  padding: "0.38rem 0.35rem",
  borderTop: "1px solid rgba(148,163,184,0.08)",
  background: "rgba(255,255,255,0.02)",
};

const avatarCellStyle: React.CSSProperties = {
  textAlign: "center",
  display: "flex",
  justifyContent: "center",
};

const avatarStyle: React.CSSProperties = {
  width: "28px",
  height: "28px",
  borderRadius: "999px",
  objectFit: "cover",
  border: "1px solid rgba(148,163,184,0.22)",
  background: "linear-gradient(180deg, rgba(30,41,59,0.95), rgba(15,23,42,0.95))",
};

const playerCellStyle: React.CSSProperties = {
  minWidth: 0,
};

const playerNameStyle: React.CSSProperties = {
  color: "#60a5fa",
  fontSize: "0.88rem",
  fontWeight: 700,
  lineHeight: 1.05,
};

const playerSublineStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.35rem",
  flexWrap: "nowrap",
  marginTop: "0.14rem",
  color: "rgba(255,255,255,0.58)",
  fontSize: "0.72rem",
};

const statValueCellStyle: React.CSSProperties = {
  textAlign: "center",
  color: "rgba(255,255,255,0.8)",
  fontSize: "0.8rem",
  fontWeight: 600,
};

const queueCellStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
};

const queueButtonStyle: React.CSSProperties = {
  borderRadius: "999px",
  padding: "0.28rem 0.68rem",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(255,255,255,0.92)",
  border: "1px solid rgba(255,255,255,0.78)",
  color: "rgba(55,65,81,0.96)",
  fontSize: "0.72rem",
  fontWeight: 700,
  minWidth: "64px",
};
