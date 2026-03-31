"use client";

type DraftHeaderProps = {
  currentTeam: string;
  pickNumber: number;
  round: number;
  totalPicks: number;
  timeLeft: number;
  onExit?: () => void;
};

export default function DraftHeader({
  currentTeam,
  pickNumber,
  round,
  totalPicks,
  timeLeft,
  onExit,
}: DraftHeaderProps) {
  return (
    <div style={{ background: "#05070b", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <div
        style={{
          padding: "0.45rem 0.8rem 0.4rem",
          display: "grid",
          gridTemplateColumns: "52px 1fr 52px",
          alignItems: "center",
          gap: "0.35rem",
          minHeight: "58px",
        }}
      >
        <button onClick={onExit} style={headerEdgeButtonStyle}>
          Exit
        </button>

        <div
          style={{
            display: "grid",
            justifyItems: "center",
            textAlign: "center",
            gap: "0.08rem",
          }}
        >
          <div style={{ fontSize: "0.66rem", color: "rgba(255,255,255,0.62)" }}>
            {currentTeam}
          </div>
          <div style={{ fontSize: "1.95rem", fontWeight: 700, lineHeight: 1 }}>
            {formatTime(timeLeft)}
          </div>
        </div>

        <button style={headerEdgeButtonStyle} aria-label="Draft settings">
          ⚙
        </button>
      </div>

      <div
        style={{
          minHeight: "24px",
          padding: "0.28rem 0.8rem 0.3rem",
          background: "rgba(255,255,255,0.08)",
          borderTop: "1px solid rgba(255,255,255,0.04)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          fontSize: "0.72rem",
          color: "rgba(255,255,255,0.72)",
          lineHeight: 1.1,
        }}
      >
        Rnd {round}, Pick {pickNumber} of {totalPicks}
      </div>
    </div>
  );
}

function formatTime(timeLeft: number) {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

const headerEdgeButtonStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "white",
  fontSize: "0.95rem",
  fontWeight: 500,
  padding: "0.1rem 0.15rem",
  minWidth: "44px",
  minHeight: "28px",
};
