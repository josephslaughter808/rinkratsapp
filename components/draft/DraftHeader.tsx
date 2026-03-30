"use client";

type DraftHeaderProps = {
  currentTeam: string;
  pickNumber: number;
  round: number;
  totalRounds: number;
  timeLeft: number;
  onExit?: () => void;
};

export default function DraftHeader({
  currentTeam,
  pickNumber,
  round,
  totalRounds,
  timeLeft,
  onExit,
}: DraftHeaderProps) {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(30,41,59,0.95))",
        padding: "1rem 1.1rem",
        borderBottom: "1px solid rgba(148, 163, 184, 0.18)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "1rem",
        flexWrap: "wrap",
      }}
    >
      <div>
        <div style={{ fontSize: "0.78rem", opacity: 0.72, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          On the clock
        </div>
        <div style={{ fontSize: "1.35rem", fontWeight: 700 }}>{currentTeam}</div>
        <div style={{ fontSize: "0.82rem", opacity: 0.72 }}>
          Pick {pickNumber} • Round {round}/{totalRounds}
        </div>
      </div>

      <div
        style={{
          padding: "0.7rem 1rem",
          borderRadius: "999px",
          background: "rgba(249, 115, 22, 0.12)",
          border: "1px solid rgba(249, 115, 22, 0.28)",
        }}
      >
        <div style={{ fontSize: "0.72rem", opacity: 0.72, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Pick timer
        </div>
        <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#fdba74" }}>
          {timeLeft}s
        </div>
      </div>

      <button
        onClick={onExit}
        style={{
          background: "rgba(15, 23, 42, 0.95)",
          border: "1px solid rgba(148, 163, 184, 0.18)",
          padding: "0.7rem 0.9rem",
          borderRadius: "14px",
          color: "white",
          fontSize: "0.82rem",
        }}
      >
        Exit Draft
      </button>
    </div>
  );
}
