import Link from "next/link";
import { notFound } from "next/navigation";
import { getGame, getTeam, type GameStar } from "@/lib/mockLeagueData";

export default async function GameDetailsPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = await params;
  const game = getGame(gameId);

  if (!game) {
    notFound();
  }

  const homeTeam = getTeam(game.homeTeamId);
  const awayTeam = getTeam(game.awayTeamId);

  if (!homeTeam || !awayTeam) {
    notFound();
  }

  return (
    <main className="page-shell" style={{ paddingTop: "1.5rem" }}>
      <div className="glass-panel" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
        <Link href="/dashboard" style={{ display: "inline-block", marginBottom: "1rem" }}>
          Back to dashboard
        </Link>

        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <p style={{ color: "var(--text-muted)", marginBottom: "0.35rem" }}>
              {game.date} • {game.rink}
            </p>
            <h1 style={{ fontSize: "2.35rem", marginBottom: "0.35rem" }}>
              {awayTeam.name} at {homeTeam.name}
            </h1>
            <p style={{ color: "var(--text-muted)", maxWidth: "720px" }}>{game.recap}</p>
          </div>

          <div style={detailSummaryStyle}>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.4rem" }}>
              Game State
            </div>
            <div style={{ fontSize: "1.45rem", fontWeight: 700 }}>
              {game.status === "final"
                ? `${game.awayScore} - ${game.homeScore} final`
                : `${game.date} at ${game.puckDrop}`}
            </div>
            <div style={{ marginTop: "0.5rem", fontSize: "0.95rem", color: "var(--accent-light)" }}>
              {game.fullFilmLabel}
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: "1.5rem" }}>
        {game.stars ? (
          <section style={{ marginBottom: "1.25rem" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "1rem",
                flexWrap: "wrap",
                marginBottom: "0.95rem",
              }}
            >
              <div>
                <h2 style={{ fontSize: "1.8rem" }}>Stars of the Game</h2>
                <p style={{ color: "var(--text-muted)", marginTop: "0.25rem" }}>
                  Offensive and defensive selections posted by the captain staff.
                </p>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "0.9rem",
              }}
            >
              <GameStarCard label="Offense" player={game.stars.offense} />
              <GameStarCard label="Defense" player={game.stars.defense} />
            </div>
          </section>
        ) : null}

        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
          <div>
            <h2 style={{ fontSize: "1.8rem" }}>Tagged Highlights</h2>
            <p style={{ color: "var(--text-muted)", marginTop: "0.25rem" }}>
              Each clip is tied to a stat event and can store scorer, assists, hits, or penalties.
            </p>
          </div>
          <div style={detailBadgeStyle}>
            {game.highlights.length} clip{game.highlights.length === 1 ? "" : "s"} mapped
          </div>
        </div>

        <div style={{ display: "grid", gap: "1rem" }}>
          {game.highlights.map((highlight) => (
            <article
              key={highlight.id}
              style={{
                padding: "1.15rem",
                borderRadius: "18px",
                border: "1px solid var(--line)",
                background: "rgba(7, 17, 31, 0.74)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.65rem" }}>
                <div>
                  <div style={{ color: "var(--accent-light)", fontSize: "0.82rem", textTransform: "uppercase" }}>
                    {highlight.type} • {highlight.period} • {highlight.gameClock}
                  </div>
                  <h3 style={{ fontSize: "1.35rem", marginTop: "0.25rem" }}>{highlight.title}</h3>
                </div>
                <div style={clipChipStyle}>{highlight.filmLabel}</div>
              </div>

              <p style={{ color: "var(--text-muted)", marginBottom: "0.8rem" }}>{highlight.description}</p>
              <div style={{ display: "grid", gap: "0.5rem" }}>
                <div style={{ fontWeight: 700 }}>{highlight.statLine}</div>
                <div style={{ color: "var(--text-muted)" }}>
                  Players tagged: {highlight.players.join(", ")}
                </div>
                <div style={{ color: "var(--text-muted)" }}>
                  Clip window: {highlight.clipStart} to {highlight.clipEnd}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}

function GameStarCard({
  label,
  player,
}: {
  label: string;
  player: GameStar;
}) {
  return (
    <article
      style={{
        padding: "1rem",
        borderRadius: "18px",
        border: "1px solid rgba(148,163,184,0.14)",
        background: "rgba(7, 17, 31, 0.74)",
        textAlign: "center",
      }}
    >
      <div style={starChipStyle}>{label}</div>
      <img src={player.profileUrl} alt={player.name} style={starPortraitStyle} />
      <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>{player.name}</div>
      <div style={{ marginTop: "0.3rem", color: "var(--accent-light)", fontWeight: 700 }}>
        #{player.number}
      </div>
      <div
        style={{
          marginTop: "0.2rem",
          color: "var(--text-muted)",
          fontSize: "0.78rem",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {player.position}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: "0.45rem",
          marginTop: "0.9rem",
        }}
      >
        {player.stats.map((stat) => (
          <div key={`${player.name}-${stat.label}`} style={starStatBoxStyle}>
            <div style={{ fontWeight: 800 }}>{stat.value}</div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.68rem" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

const detailSummaryStyle: React.CSSProperties = {
  minWidth: "220px",
  padding: "1rem 1.1rem",
  borderRadius: "16px",
  background: "var(--surface-light)",
  border: "1px solid var(--line)",
};

const detailBadgeStyle: React.CSSProperties = {
  borderRadius: "999px",
  border: "1px solid rgba(251, 191, 36, 0.28)",
  background: "rgba(251, 191, 36, 0.12)",
  color: "#fde68a",
  padding: "0.45rem 0.85rem",
  fontSize: "0.85rem",
};

const clipChipStyle: React.CSSProperties = {
  padding: "0.55rem 0.8rem",
  borderRadius: "14px",
  background: "var(--surface-light)",
  border: "1px solid var(--line)",
  fontSize: "0.9rem",
};

const starChipStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0.28rem 0.65rem",
  borderRadius: "999px",
  marginBottom: "0.85rem",
  background: "rgba(249,115,22,0.12)",
  border: "1px solid rgba(249,115,22,0.24)",
  color: "var(--accent-light)",
  fontSize: "0.74rem",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const starPortraitStyle: React.CSSProperties = {
  width: "76px",
  height: "76px",
  borderRadius: "999px",
  objectFit: "cover",
  border: "2px solid rgba(249,115,22,0.45)",
  margin: "0 auto 0.8rem",
  background: "rgba(255,255,255,0.06)",
};

const starStatBoxStyle: React.CSSProperties = {
  padding: "0.55rem 0.3rem",
  borderRadius: "14px",
  background: "rgba(20,37,64,0.82)",
  border: "1px solid rgba(148,163,184,0.12)",
};
