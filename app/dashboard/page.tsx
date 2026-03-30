"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import {
  currentMember,
  getGamesForWeek,
  getTeam,
  leagueOverview,
  type GameStar,
} from "@/lib/mockLeagueData";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [week, setWeek] = useState(7);
  const [availability, setAvailability] = useState<"in" | "out" | "unset">(
    "unset"
  );
  const [linesOpen, setLinesOpen] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        router.push("/auth/login");
        return;
      }

      setLoading(false);
    }

    loadUser();
  }, [router]);

  if (loading) {
    return (
      <main className="center-screen">
        <p>Loading...</p>
      </main>
    );
  }

  const weekGames = getGamesForWeek(week);
  const yourGame = weekGames.find(
    (game) =>
      game.homeTeamId === currentMember.teamId ||
      game.awayTeamId === currentMember.teamId
  );
  const otherGames = weekGames.filter((game) => game.id !== yourGame?.id);
  const linesArePosted = yourGame?.status !== "final" && week >= 8;
  const homeTeam = yourGame ? getTeam(yourGame.homeTeamId) : null;
  const awayTeam = yourGame ? getTeam(yourGame.awayTeamId) : null;
  const rinkLabel =
    yourGame?.rink?.toLowerCase().includes("north")
      ? "North Rink"
      : yourGame?.rink?.toLowerCase().includes("south")
      ? "South Rink"
      : yourGame?.rink || "Rink";

  return (
    <main className="page-shell" style={{ maxWidth: "760px", paddingTop: "1rem" }}>
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "48px 1fr 48px",
          alignItems: "center",
          gap: "0.75rem",
          marginBottom: "1rem",
        }}
      >
        <button
          onClick={() => setWeek((value) => Math.max(1, value - 1))}
          style={weekArrowStyle}
        >
          ←
        </button>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "var(--accent-light)", fontSize: "0.85rem", marginBottom: "0.2rem" }}>
            {leagueOverview.name}
          </div>
          <h1 style={{ fontSize: "1.9rem" }}>Week {week}</h1>
        </div>
        <button onClick={() => setWeek((value) => value + 1)} style={weekArrowStyle}>
          →
        </button>
      </section>

      {yourGame ? (
        <section
          className="glass-panel"
          style={{
            padding: "1.25rem",
            marginBottom: "1rem",
            border: "1px solid rgba(249,115,22,0.24)",
            background:
              "linear-gradient(180deg, rgba(9,18,33,0.98), rgba(5,11,20,0.98))",
            boxShadow: "0 26px 60px rgba(0,0,0,0.34)",
            color: "var(--text)",
            cursor: "pointer",
          }}
          onClick={() => router.push(`/dashboard/games/${yourGame.id}`)}
        >
          <div style={matchupCardStyle}>
            <div style={teamSideStyle}>
              <div style={teamBadgeStyle}>{awayTeam?.shortName || "AWY"}</div>
              <div style={teamNameStyle}>{awayTeam?.name}</div>
              <div style={teamMetaStyle}>Away</div>
              <div style={scoreValueStyle}>
                {yourGame.awayScore ?? "--"}
              </div>
            </div>

            <div style={centerStateStyle}>
              <div style={{ color: "var(--accent-light)", fontWeight: 700 }}>
                {yourGame.status === "final" ? "FINAL" : "GAME DAY"}
              </div>
              <div style={{ color: "var(--text-muted)", marginTop: "0.35rem", fontSize: "0.82rem" }}>
                {yourGame.status === "final" ? "Tap below for highlights" : "Availability opens below"}
              </div>
            </div>

            <div style={teamSideStyle}>
              <div style={teamBadgeStyle}>{homeTeam?.shortName || "HME"}</div>
              <div style={teamNameStyle}>{homeTeam?.name}</div>
              <div style={teamMetaStyle}>Home</div>
              <div style={scoreValueStyle}>
                {yourGame.homeScore ?? "--"}
              </div>
            </div>
          </div>

          <div style={gameFooterMetaStyle}>
            <div style={{ fontWeight: 700 }}>{yourGame.date}</div>
            <div style={{ marginTop: "0.15rem" }}>{yourGame.puckDrop}</div>
            <div style={{ marginTop: "0.15rem" }}>{rinkLabel}</div>
          </div>

          {yourGame.status !== "final" && !linesArePosted ? (
            <div style={{ marginTop: "1rem" }}>
              <div style={benchToggleWrapStyle}>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    setAvailability("in");
                  }}
                  style={benchToggleButtonStyle(availability === "in", "in")}
                >
                  ✓ In
                </button>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    setAvailability("out");
                  }}
                  style={benchToggleButtonStyle(availability === "out", "out")}
                >
                  ✕ Out
                </button>
              </div>
              <div style={{ color: "var(--accent-light)", marginTop: "0.6rem", fontSize: "0.9rem" }}>
                {availability === "unset"
                  ? "Set your status for the captain."
                  : availability === "in"
                  ? "Marked in for this game."
                  : "Marked out for this game."}
              </div>
            </div>
          ) : null}

          {yourGame.status !== "final" && linesArePosted ? (
            <div style={{ marginTop: "1rem" }}>
              <button
                style={linesButtonStyle}
                onClick={(event) => {
                  event.stopPropagation();
                  setLinesOpen(true);
                }}
              >
                Lines
              </button>
            </div>
          ) : null}
        </section>
      ) : (
        <section className="glass-panel" style={emptyCardStyle}>
          No game is scheduled for your team this week yet.
        </section>
      )}

      {yourGame?.stars ? (
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "0.8rem",
            marginBottom: "1rem",
          }}
        >
          <StarPlayerCard label="Offense" player={yourGame.stars.offense} />
          <StarPlayerCard label="Defense" player={yourGame.stars.defense} />
        </section>
      ) : null}

      <section className="glass-panel" style={{ padding: "1rem", marginBottom: "1rem" }}>
        <div style={{ color: "var(--accent-light)", marginBottom: "0.2rem" }}>
          League Schedule
        </div>
        <h2 style={{ fontSize: "1.45rem", marginBottom: "0.9rem" }}>Other Games</h2>

        <div style={{ display: "grid", gap: "0.8rem" }}>
          {otherGames.map((game) => {
            const homeTeam = getTeam(game.homeTeamId);
            const awayTeam = getTeam(game.awayTeamId);

            if (!homeTeam || !awayTeam) {
              return null;
            }

            return (
              <Link
                key={game.id}
                href={`/dashboard/games/${game.id}`}
                style={otherGameCardStyle}
              >
                <div style={matchupCardStyle}>
                  <div style={teamSideStyle}>
                    <div style={teamBadgeStyle}>{awayTeam.shortName}</div>
                    <div style={teamNameStyle}>{awayTeam.name}</div>
                    <div style={teamMetaStyle}>Away</div>
                    <div style={scoreValueStyle}>{game.awayScore ?? "--"}</div>
                  </div>

                  <div style={centerStateStyle}>
                    <div style={{ color: "var(--accent-light)", fontWeight: 700 }}>
                      {game.status === "final" ? "FINAL" : "UP NEXT"}
                    </div>
                    <div
                      style={{
                        color: "var(--text-muted)",
                        marginTop: "0.35rem",
                        fontSize: "0.82rem",
                      }}
                    >
                      {game.status === "final"
                        ? "Tap to open game page"
                        : "Tap to view matchup"}
                    </div>
                  </div>

                  <div style={teamSideStyle}>
                    <div style={teamBadgeStyle}>{homeTeam.shortName}</div>
                    <div style={teamNameStyle}>{homeTeam.name}</div>
                    <div style={teamMetaStyle}>Home</div>
                    <div style={scoreValueStyle}>{game.homeScore ?? "--"}</div>
                  </div>
                </div>

                <div style={gameFooterMetaStyle}>
                  <div style={{ fontWeight: 700 }}>{game.date}</div>
                  <div style={{ marginTop: "0.15rem" }}>{game.puckDrop}</div>
                  <div style={{ marginTop: "0.15rem" }}>
                    {game.rink.toLowerCase().includes("north")
                      ? "North Rink"
                      : game.rink.toLowerCase().includes("south")
                      ? "South Rink"
                      : game.rink}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {linesOpen ? (
        <div style={sheetOverlayStyle} onClick={() => setLinesOpen(false)}>
          <div style={sheetStyle} onClick={(event) => event.stopPropagation()}>
            <div style={sheetHandleStyle} />
            <div style={sheetHeaderStyle}>
              <div style={{ width: 56 }} />
              <h2 style={{ fontSize: "1.35rem" }}>Lines</h2>
              <button style={sheetDoneStyle} onClick={() => setLinesOpen(false)}>
                Done
              </button>
            </div>

            <div style={sheetContentStyle}>
              <LineGroup
                title="Forward 1st Line"
                rows={[
                  ["LW", "Evan Price"],
                  ["C", "Nate Keller"],
                  ["RW", "Micah Dunn"],
                ]}
              />
              <LineGroup
                title="Forward 2nd Line"
                rows={[
                  ["LW", "Mason Pope"],
                  ["C", "Leo Sandoval"],
                  ["RW", "Aiden Lowe"],
                ]}
              />
              <LineGroup
                title="Defence 1st Pair"
                rows={[
                  ["LD", "Jules Medina"],
                  ["RD", "Derek Cho"],
                ]}
              />
              <LineGroup
                title="Defence 2nd Pair"
                rows={[
                  ["LD", "Grant Holloway"],
                  ["RD", "Noah Briggs"],
                ]}
              />
              <LineGroup
                title="Goalies"
                rows={[
                  ["G", "Finn Walker"],
                  ["G2", "Miles Porter"],
                ]}
              />
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function LineGroup({
  title,
  rows,
}: {
  title: string;
  rows: [string, string][];
}) {
  return (
    <section style={{ marginBottom: "1.1rem" }}>
      <div style={{ fontWeight: 700, marginBottom: "0.45rem" }}>{title}</div>
      <div style={lineGroupCardStyle}>
        {rows.map(([position, player]) => (
          <div key={`${title}-${position}`} style={lineRowStyle}>
            <div style={linePositionStyle}>{position}</div>
            <div style={linePlayerStyle}>{player}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function StarPlayerCard({
  label,
  player,
}: {
  label: string;
  player: GameStar;
}) {
  return (
    <article
      className="glass-panel"
      style={{
        padding: "1rem 0.85rem",
        background:
          "linear-gradient(180deg, rgba(10,18,31,0.98), rgba(8,16,29,0.92))",
        border: "1px solid rgba(148,163,184,0.14)",
        textAlign: "center",
      }}
    >
      <div style={starTagStyle}>{label}</div>
      <img src={player.profileUrl} alt={player.name} style={starImageStyle} />
      <div style={starNameStyle}>{player.name}</div>
      <div style={starNumberStyle}>#{player.number}</div>
      <div style={starPositionStyle}>{player.position}</div>

      <div style={starStatsRowStyle}>
        {player.stats.map((stat) => (
          <div key={`${player.name}-${stat.label}`} style={starStatCellStyle}>
            <div style={starStatValueStyle}>{stat.value}</div>
            <div style={starStatLabelStyle}>{stat.label}</div>
          </div>
        ))}
      </div>
    </article>
  );
}

function benchToggleButtonStyle(
  active: boolean,
  type: "in" | "out"
): React.CSSProperties {
  return {
    padding: "0.95rem 1rem",
    borderRadius: "16px",
    border: `1px solid ${
      active
        ? type === "in"
          ? "rgba(34,197,94,0.45)"
          : "rgba(239,68,68,0.45)"
        : "var(--line)"
    }`,
    background: active
      ? type === "in"
        ? "rgba(34,197,94,0.18)"
        : "rgba(239,68,68,0.18)"
      : "var(--surface-light)",
    color: "var(--text)",
    fontWeight: 700,
  };
}

const benchToggleWrapStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "0.75rem",
  padding: "0.35rem",
  borderRadius: "18px",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(148,163,184,0.18)",
};

const weekArrowStyle: React.CSSProperties = {
  width: "48px",
  height: "48px",
  padding: 0,
  borderRadius: "999px",
  background: "rgba(15, 23, 42, 0.92)",
  border: "1px solid rgba(148,163,184,0.18)",
  color: "var(--text)",
  fontSize: "1.2rem",
};

const matchupCardStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr auto 1fr",
  gap: "0.75rem",
  alignItems: "center",
  padding: "1rem 0.2rem",
};

const teamSideStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
};

const teamBadgeStyle: React.CSSProperties = {
  width: "72px",
  height: "72px",
  borderRadius: "999px",
  border: "2px solid rgba(253,186,116,0.8)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 800,
  letterSpacing: "0.08em",
  background:
    "radial-gradient(circle at top, rgba(249,115,22,0.18), rgba(255,255,255,0.03))",
};

const teamNameStyle: React.CSSProperties = {
  marginTop: "0.65rem",
  fontWeight: 700,
  fontSize: "1rem",
};

const teamMetaStyle: React.CSSProperties = {
  color: "var(--text-muted)",
  marginTop: "0.2rem",
  fontSize: "0.82rem",
};

const scoreValueStyle: React.CSSProperties = {
  marginTop: "0.6rem",
  fontSize: "2rem",
  fontWeight: 800,
  lineHeight: 1,
};

const centerStateStyle: React.CSSProperties = {
  minWidth: "92px",
  textAlign: "center",
};

const linesButtonStyle: React.CSSProperties = {
  width: "100%",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0.9rem 1rem",
  borderRadius: "16px",
  background: "linear-gradient(135deg, #f97316, #ea580c)",
  color: "white",
  fontWeight: 700,
};

const gameFooterMetaStyle: React.CSSProperties = {
  marginTop: "0.9rem",
  paddingTop: "0.9rem",
  borderTop: "1px solid rgba(255,255,255,0.08)",
  color: "var(--text-muted)",
  textAlign: "center",
};

const otherGameCardStyle: React.CSSProperties = {
  border: "1px solid rgba(148,163,184,0.14)",
  borderRadius: "16px",
  padding: "1.1rem",
  background: "linear-gradient(180deg, rgba(10,18,31,0.96), rgba(7,17,31,0.82))",
  color: "var(--text)",
  display: "block",
};

const emptyCardStyle: React.CSSProperties = {
  padding: "1.1rem",
  borderRadius: "16px",
  border: "1px dashed var(--line)",
  color: "var(--text-muted)",
  marginBottom: "1rem",
};

const sheetOverlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(2,6,14,0.72)",
  zIndex: 120,
  display: "flex",
  alignItems: "flex-end",
  backdropFilter: "blur(10px)",
};

const sheetStyle: React.CSSProperties = {
  width: "100%",
  maxHeight: "86vh",
  background:
    "linear-gradient(180deg, rgba(9,16,29,0.98), rgba(5,10,19,0.98))",
  color: "var(--text)",
  borderTopLeftRadius: "24px",
  borderTopRightRadius: "24px",
  padding: "0.55rem 1rem 1.2rem",
  overflow: "hidden",
  borderTop: "1px solid rgba(148,163,184,0.16)",
  boxShadow: "0 -24px 80px rgba(0,0,0,0.45)",
};

const sheetHandleStyle: React.CSSProperties = {
  width: "56px",
  height: "5px",
  borderRadius: "999px",
  background: "rgba(226,232,240,0.22)",
  margin: "0.35rem auto 0.55rem",
};

const sheetHeaderStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "56px 1fr 56px",
  alignItems: "center",
  marginBottom: "0.9rem",
  textAlign: "center",
};

const sheetDoneStyle: React.CSSProperties = {
  background: "transparent",
  color: "var(--accent-light)",
  padding: 0,
  fontWeight: 700,
};

const sheetContentStyle: React.CSSProperties = {
  overflowY: "auto",
  maxHeight: "calc(86vh - 92px)",
  paddingBottom: "1rem",
};

const lineGroupCardStyle: React.CSSProperties = {
  background: "rgba(10,18,31,0.92)",
  borderRadius: "16px",
  overflow: "hidden",
  border: "1px solid rgba(148,163,184,0.14)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
};

const lineRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "52px 1fr",
  minHeight: "54px",
  borderBottom: "1px solid rgba(148,163,184,0.12)",
};

const linePositionStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700,
  fontSize: "0.82rem",
  color: "var(--accent-light)",
  background: "rgba(249,115,22,0.08)",
  borderRight: "1px solid rgba(148,163,184,0.12)",
};

const linePlayerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  padding: "0 0.9rem",
  fontWeight: 600,
  color: "var(--text)",
};

const starTagStyle: React.CSSProperties = {
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

const starImageStyle: React.CSSProperties = {
  width: "76px",
  height: "76px",
  borderRadius: "999px",
  objectFit: "cover",
  border: "2px solid rgba(249,115,22,0.45)",
  margin: "0 auto 0.8rem",
  background: "rgba(255,255,255,0.06)",
};

const starNameStyle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: "1rem",
  lineHeight: 1.15,
};

const starNumberStyle: React.CSSProperties = {
  marginTop: "0.35rem",
  color: "var(--accent-light)",
  fontWeight: 700,
};

const starPositionStyle: React.CSSProperties = {
  marginTop: "0.2rem",
  color: "var(--text-muted)",
  fontSize: "0.78rem",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const starStatsRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "0.45rem",
  marginTop: "0.9rem",
};

const starStatCellStyle: React.CSSProperties = {
  padding: "0.55rem 0.3rem",
  borderRadius: "14px",
  background: "rgba(20,37,64,0.82)",
  border: "1px solid rgba(148,163,184,0.12)",
};

const starStatValueStyle: React.CSSProperties = {
  fontWeight: 800,
  fontSize: "0.95rem",
};

const starStatLabelStyle: React.CSSProperties = {
  marginTop: "0.18rem",
  color: "var(--text-muted)",
  fontSize: "0.65rem",
  letterSpacing: "0.08em",
};
