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
        background: "linear-gradient(to right, #111, #0A0A0A)",
        padding: "1rem",
        borderBottom: "1px solid #12937f",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      {/* LEFT SIDE */}
      <div>
        <div style={{ fontSize: "0.8rem", opacity: 0.7 }}>On The Clock</div>
        <div style={{ fontSize: "1.2rem", fontWeight: 700 }}>{currentTeam}</div>
        <div style={{ fontSize: "0.8rem", opacity: 0.7 }}>
          Pick {pickNumber} • Round {round}/{totalRounds}
        </div>
      </div>

      {/* TIMER */}
      <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#12937f" }}>
        {timeLeft}s
      </div>

      {/* EXIT BUTTON */}
      <button
        onClick={onExit}
        style={{
          background: "none",
          border: "1px solid #444",
          padding: "0.4rem 0.8rem",
          borderRadius: "4px",
          color: "white",
          fontSize: "0.8rem",
          cursor: "pointer",
        }}
      >
        Exit Draft
      </button>
    </div>
  );
}
