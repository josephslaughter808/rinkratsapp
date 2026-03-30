"use client";

import Link from "next/link";
import { currentMember, games, getTeam } from "@/lib/mockLeagueData";

export default function FilmRoomPage() {
  return (
    <main className="page-shell">
      <section className="glass-panel" style={{ padding: "1.25rem", marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <div style={{ color: "var(--accent-light)", marginBottom: "0.35rem" }}>Film Room</div>
            <h1 style={{ fontSize: "2rem", marginBottom: "0.45rem" }}>Full game film and clip-tagged highlights</h1>
            <p style={{ color: "var(--text-muted)", maxWidth: "760px" }}>
              Team captains, assistant captains, and designated film managers upload
              full games, tag stat moments by timecode, and publish clips back into the app.
            </p>
          </div>
          <div style={filmAccessCardStyle}>
            <div style={{ color: "var(--text-muted)", marginBottom: "0.35rem" }}>Current Member Access</div>
            <div style={{ fontWeight: 700, fontSize: "1.1rem", textTransform: "capitalize" }}>
              {currentMember.role.replaceAll("_", " ")}
            </div>
            <div style={{ marginTop: "0.4rem", color: "var(--accent-light)" }}>
              Players see only their own team’s film for the season. Leadership roles can see league-wide film.
            </div>
          </div>
        </div>
      </section>

      <section style={{ display: "grid", gap: "1rem" }}>
        {games.map((game) => {
          const homeTeam = getTeam(game.homeTeamId);
          const awayTeam = getTeam(game.awayTeamId);

          if (!homeTeam || !awayTeam) {
            return null;
          }

          return (
            <article key={game.id} className="glass-panel" style={{ padding: "1.2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "0.8rem" }}>
                <div>
                  <div style={{ color: "var(--accent-light)", marginBottom: "0.3rem" }}>
                    Week {game.week} • {game.date} • {game.rink}
                  </div>
                  <h2 style={{ fontSize: "1.6rem" }}>
                    {awayTeam.name} at {homeTeam.name}
                  </h2>
                  <p style={{ color: "var(--text-muted)", marginTop: "0.35rem" }}>{game.recap}</p>
                </div>
                <div style={filmSummaryStyle}>
                  <div style={{ color: "var(--text-muted)", marginBottom: "0.35rem" }}>Access</div>
                  <div style={{ fontWeight: 700 }}>{game.fullFilmLabel}</div>
                  <div style={{ color: "var(--accent-light)", marginTop: "0.35rem" }}>
                    {game.status === "final" ? `${game.highlights.length} tagged highlights` : "Awaiting uploaded film"}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <Link href={`/dashboard/games/${game.id}`} style={filmPrimaryStyle}>
                  {game.status === "final" ? "Open highlights" : "Open game record"}
                </Link>
                <div style={filmSecondaryStyle}>
                  Clip workflow: upload full film, set time ranges, attach scorer, assists, hits, or penalties.
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}

const filmAccessCardStyle: React.CSSProperties = {
  minWidth: "270px",
  padding: "1rem",
  borderRadius: "16px",
  border: "1px solid var(--line)",
  background: "var(--surface-light)",
};

const filmSummaryStyle: React.CSSProperties = {
  minWidth: "250px",
  padding: "0.95rem",
  borderRadius: "16px",
  border: "1px solid var(--line)",
  background: "rgba(7, 17, 31, 0.7)",
};

const filmPrimaryStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "14px",
  padding: "0.8rem 1rem",
  background: "linear-gradient(135deg, #0ea5e9, #2563eb)",
  color: "white",
  fontWeight: 700,
};

const filmSecondaryStyle: React.CSSProperties = {
  borderRadius: "14px",
  padding: "0.8rem 1rem",
  background: "var(--surface-light)",
  border: "1px solid var(--line)",
  color: "var(--text-muted)",
};
