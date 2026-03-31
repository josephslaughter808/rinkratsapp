"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { useTeam } from "@/context/TeamContext";

type GameRow = {
  id: string;
  league_id: string | null;
  season: string;
  date: string;
  home_team_id: string | null;
  away_team_id: string | null;
  home_score: number | null;
  away_score: number | null;
  is_playoff: boolean | null;
};

type TeamRow = {
  id: string;
  name: string;
  logo_url: string | null;
};

type LeagueRow = {
  id: string;
  name: string;
  season: string;
};

type WeekBucket = {
  label: string;
  key: string;
  games: GameRow[];
};

export default function DashboardPage() {
  const router = useRouter();
  const { selectedTeam } = useTeam();
  const selectedTeamId = selectedTeam?.id ?? null;
  const leagueId = selectedTeam?.leagueId ?? null;
  const [loading, setLoading] = useState(true);
  const [weekOverride, setWeekOverride] = useState<number | null>(null);
  const [linesOpen, setLinesOpen] = useState(false);
  const [games, setGames] = useState<GameRow[]>([]);
  const [teamsById, setTeamsById] = useState<Record<string, TeamRow>>({});
  const [league, setLeague] = useState<LeagueRow | null>(null);
  const [playerPosition, setPlayerPosition] = useState<string | null>(null);

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

  useEffect(() => {
    if (!leagueId) {
      return;
    }

    let active = true;

    async function loadLeagueGames() {
      const [{ data: gameRows, error: gamesError }, { data: leagueRow }] =
        await Promise.all([
          supabase
            .from("games_v2")
            .select(
              "id, league_id, season, date, home_team_id, away_team_id, home_score, away_score, is_playoff"
            )
            .eq("league_id", leagueId)
            .order("date", { ascending: true }),
          supabase
            .from("leagues")
            .select("id, name, season")
            .eq("id", leagueId)
            .single(),
        ]);

      if (gamesError || !active) {
        return;
      }

      const safeGames = (gameRows ?? []) as GameRow[];
      setGames(safeGames);
      setLeague((leagueRow as LeagueRow | null) ?? null);

      const teamIds = Array.from(
        new Set(
          safeGames.flatMap((game) =>
            [game.home_team_id, game.away_team_id].filter(Boolean)
          )
        )
      ) as string[];

      if (teamIds.length === 0) {
        setTeamsById({});
        return;
      }

      const { data: teamRows } = await supabase
        .from("teams")
        .select("id, name, logo_url")
        .in("id", teamIds);

      if (!active) {
        return;
      }

      const nextTeams = Object.fromEntries(
        ((teamRows ?? []) as TeamRow[]).map((team) => [team.id, team])
      );
      setTeamsById(nextTeams);
    }

    loadLeagueGames();

    return () => {
      active = false;
    };
  }, [leagueId]);

  useEffect(() => {
    const playerId = selectedTeam?.player_id;

    if (!playerId) {
      return;
    }

    let active = true;

    async function loadPlayerPosition() {
      const { data } = await supabase
        .from("players")
        .select("position")
        .eq("id", playerId)
        .maybeSingle();

      if (active) {
        setPlayerPosition(data?.position ?? null);
      }
    }

    loadPlayerPosition();

    return () => {
      active = false;
    };
  }, [selectedTeam?.player_id]);

  const weekBuckets = useMemo(() => buildWeekBuckets(games), [games]);
  const recommendedWeekIndex = useMemo(() => {
    if (!selectedTeamId || weekBuckets.length === 0) {
      return 0;
    }

    const today = startOfDay(new Date()).getTime();
    const nextIndex = weekBuckets.findIndex((bucket) =>
      bucket.games.some(
        (game) =>
          (game.home_team_id === selectedTeamId || game.away_team_id === selectedTeamId) &&
          new Date(game.date).getTime() >= today
      )
    );

    if (nextIndex >= 0) {
      return nextIndex;
    }

    const anyTeamWeekIndex = weekBuckets.findIndex((bucket) =>
      bucket.games.some(
        (game) =>
          game.home_team_id === selectedTeamId || game.away_team_id === selectedTeamId
      )
    );

    return anyTeamWeekIndex >= 0 ? anyTeamWeekIndex : 0;
  }, [selectedTeamId, weekBuckets]);

  if (loading) {
    return (
      <main className="center-screen">
        <p>Loading...</p>
      </main>
    );
  }

  if (!selectedTeam) {
    return (
      <main className="page-shell" style={{ maxWidth: "760px", paddingTop: "1rem" }}>
        <section className="glass-panel" style={emptyCardStyle}>
          Select a team to load your schedule.
        </section>
      </main>
    );
  }

  const weekIndex =
    weekOverride !== null && weekBuckets[weekOverride] ? weekOverride : recommendedWeekIndex;
  const activeWeek = weekBuckets[weekIndex] ?? null;
  const yourGame =
    activeWeek?.games.find(
      (game) =>
        game.home_team_id === selectedTeam.id || game.away_team_id === selectedTeam.id
    ) ?? null;
  const otherGames = activeWeek?.games.filter((game) => game.id !== yourGame?.id) ?? [];
  const linesArePosted = ["captain", "assistant_captain"].includes(
    selectedTeam.role ?? ""
  );
  const linePreview = selectedTeam
    ? linesArePosted
      ? buildLinePreview(playerPosition, selectedTeam.player_id)
      : null
    : null;

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
          onClick={() => setWeekOverride(Math.max(0, weekIndex - 1))}
          style={weekArrowStyle}
          disabled={weekIndex === 0}
        >
          ←
        </button>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              color: "var(--accent-light)",
              fontSize: "0.85rem",
              marginBottom: "0.2rem",
            }}
          >
            {league?.name ?? "League"}
          </div>
          <h1 style={{ fontSize: "1.9rem" }}>
            {activeWeek?.label ?? "Schedule"}
          </h1>
        </div>
        <button
          onClick={() =>
            setWeekOverride(Math.min(weekBuckets.length - 1, weekIndex + 1))
          }
          style={weekArrowStyle}
          disabled={weekIndex >= weekBuckets.length - 1}
        >
          →
        </button>
      </section>

      {yourGame ? (
        <section
          className="glass-panel"
          style={mainGameCardStyle}
          onClick={() => router.push(`/dashboard/games/${yourGame.id}`)}
        >
          <div style={matchupCardStyle}>
            <TeamSide
              team={teamsById[yourGame.away_team_id ?? ""]}
              side="Away"
              score={yourGame.away_score}
            />

            <div style={centerStateStyle}>
              <div style={{ color: "var(--accent-light)", fontWeight: 700 }}>
                {isFinalGame(yourGame) ? "FINAL" : "GAME DAY"}
              </div>
              <div
                style={{
                  color: "var(--text-muted)",
                  marginTop: "0.35rem",
                  fontSize: "0.82rem",
                }}
              >
                {isFinalGame(yourGame)
                  ? "Tap the card for details"
                  : "Tap to open game details"}
              </div>
            </div>

            <TeamSide
              team={teamsById[yourGame.home_team_id ?? ""]}
              side="Home"
              score={yourGame.home_score}
            />
          </div>

          <div style={gameFooterMetaStyle}>
            <div style={{ fontWeight: 700 }}>{formatGameDate(yourGame.date)}</div>
            <div style={{ marginTop: "0.15rem" }}>{formatGameTime(yourGame.date)}</div>
            <div style={{ marginTop: "0.15rem" }}>
              {resolveRinkLabel(yourGame, teamsById)}
            </div>
          </div>

          {!isFinalGame(yourGame) && linePreview ? (
            <div style={{ marginTop: "1rem" }}>
              <button
                style={linesButtonStyle}
                onClick={(event) => {
                  event.stopPropagation();
                  setLinesOpen(true);
                }}
              >
                <span style={linesIconStyle}>≡</span>
                <span style={{ textAlign: "left", minWidth: 0 }}>{linePreview}</span>
                <span style={linesLinkStyle}>See Lines</span>
              </button>
            </div>
          ) : null}
        </section>
      ) : (
        <section className="glass-panel" style={emptyCardStyle}>
          No game is scheduled for {selectedTeam.name} in this week yet.
        </section>
      )}

      <section className="glass-panel" style={{ padding: "1rem", marginBottom: "1rem" }}>
        <div style={{ color: "var(--accent-light)", marginBottom: "0.2rem" }}>
          League Schedule
        </div>
        <h2 style={{ fontSize: "1.45rem", marginBottom: "0.9rem" }}>Other Games</h2>

        <div style={{ display: "grid", gap: "0.8rem" }}>
          {otherGames.length ? (
            otherGames.map((game) => (
              <Link
                key={game.id}
                href={`/dashboard/games/${game.id}`}
                style={otherGameCardStyle}
              >
                <div style={matchupCardStyle}>
                  <TeamSide
                    team={teamsById[game.away_team_id ?? ""]}
                    side="Away"
                    score={game.away_score}
                  />
                  <div style={centerStateStyle}>
                    <div style={{ color: "var(--accent-light)", fontWeight: 700 }}>
                      {isFinalGame(game) ? "FINAL" : "UP NEXT"}
                    </div>
                    <div
                      style={{
                        color: "var(--text-muted)",
                        marginTop: "0.35rem",
                        fontSize: "0.82rem",
                      }}
                    >
                      Tap to open game page
                    </div>
                  </div>
                  <TeamSide
                    team={teamsById[game.home_team_id ?? ""]}
                    side="Home"
                    score={game.home_score}
                  />
                </div>

                <div style={gameFooterMetaStyle}>
                  <div style={{ fontWeight: 700 }}>{formatGameDate(game.date)}</div>
                  <div style={{ marginTop: "0.15rem" }}>{formatGameTime(game.date)}</div>
                  <div style={{ marginTop: "0.15rem" }}>
                    {resolveRinkLabel(game, teamsById)}
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div style={{ color: "var(--text-muted)" }}>
              No other league games are scheduled in this week.
            </div>
          )}
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
                  ["LW", "To be posted"],
                  ["C", "To be posted"],
                  ["RW", "To be posted"],
                ]}
              />
              <LineGroup
                title="Forward 2nd Line"
                rows={[
                  ["LW", "To be posted"],
                  ["C", "To be posted"],
                  ["RW", "To be posted"],
                ]}
              />
              <LineGroup
                title="Forward 3rd Line"
                rows={[
                  ["LW", "To be posted"],
                  ["C", "To be posted"],
                  ["RW", "To be posted"],
                ]}
              />
              <LineGroup
                title="Defence 1st Pair"
                rows={[
                  ["LD", "To be posted"],
                  ["RD", "To be posted"],
                ]}
              />
              <LineGroup
                title="Defence 2nd Pair"
                rows={[
                  ["LD", "To be posted"],
                  ["RD", "To be posted"],
                ]}
              />
              <LineGroup
                title="Defence 3rd Pair"
                rows={[
                  ["LD", "To be posted"],
                  ["RD", "To be posted"],
                ]}
              />
              <LineGroup
                title="Goalie"
                rows={[
                  ["G", "To be posted"],
                ]}
              />
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function TeamSide({
  team,
  side,
  score,
}: {
  team?: TeamRow;
  side: string;
  score: number | null;
}) {
  return (
    <div style={teamSideStyle}>
      {team?.logo_url ? (
        <img src={team.logo_url} alt={team.name} style={teamLogoStyle} />
      ) : (
        <div style={teamBadgeStyle}>{buildShortName(team?.name)}</div>
      )}
      <div style={teamNameStyle}>{team?.name ?? "TBD"}</div>
      <div style={teamMetaStyle}>{side}</div>
      <div style={scoreValueStyle}>{score ?? "--"}</div>
    </div>
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

function buildWeekBuckets(games: GameRow[]): WeekBucket[] {
  const map = new Map<string, WeekBucket>();

  for (const game of games) {
    const weekStart = getWeekStart(new Date(game.date));
    const key = weekStart.toISOString();
    const label = `Week of ${weekStart.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })}`;

    if (!map.has(key)) {
      map.set(key, { key, label, games: [] });
    }

    map.get(key)?.games.push(game);
  }

  return Array.from(map.values());
}

function getWeekStart(date: Date) {
  const result = startOfDay(date);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  return result;
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function formatGameDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatGameTime(value: string) {
  return new Date(value).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function isFinalGame(game: GameRow) {
  return game.home_score !== null && game.away_score !== null;
}

function buildShortName(name?: string) {
  if (!name) {
    return "TBD";
  }

  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
    .slice(0, 3);
}

function resolveRinkLabel(game: GameRow, teamsById: Record<string, TeamRow>) {
  const home = teamsById[game.home_team_id ?? ""]?.name.toLowerCase() ?? "";
  const away = teamsById[game.away_team_id ?? ""]?.name.toLowerCase() ?? "";

  if (home.includes("north") || away.includes("north")) {
    return "North Rink";
  }

  if (home.includes("south") || away.includes("south")) {
    return "South Rink";
  }

  return "Main Rink";
}

function buildLinePreview(position: string | null, playerId: string) {
  const index = (playerId.charCodeAt(0) % 4) + 1;

  if (position === "G") return "Goalie - Starting";
  if (position === "LD" || position === "RD" || position === "D") {
    return `Defense - ${ordinal(index)} pair`;
  }
  if (position === "LW" || position === "RW") return `Wing - ${ordinal(index)} line`;
  return `Center - ${ordinal(index)} line`;
}

function ordinal(value: number) {
  if (value === 1) return "1st";
  if (value === 2) return "2nd";
  if (value === 3) return "3rd";
  return `${value}th`;
}

const mainGameCardStyle: CSSProperties = {
  padding: "1.25rem",
  marginBottom: "1rem",
  border: "1px solid rgba(96,165,250,0.44)",
  background:
    "linear-gradient(180deg, rgba(9,18,33,0.98), rgba(5,11,20,0.98)), radial-gradient(circle at top, rgba(56,189,248,0.12), transparent 60%)",
  boxShadow:
    "0 0 0 1px rgba(125,211,252,0.08), 0 0 22px rgba(56,189,248,0.14), 0 26px 60px rgba(0,0,0,0.34)",
  color: "var(--text)",
  cursor: "pointer",
};

const weekArrowStyle: CSSProperties = {
  width: "48px",
  height: "48px",
  padding: 0,
  borderRadius: "999px",
  background: "rgba(15, 23, 42, 0.92)",
  border: "1px solid rgba(148,163,184,0.18)",
  color: "var(--text)",
  fontSize: "1.2rem",
  opacity: 1,
};

const matchupCardStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr auto 1fr",
  gap: "0.75rem",
  alignItems: "center",
  padding: "1rem 0.2rem",
};

const teamSideStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
};

const teamBadgeStyle: CSSProperties = {
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

const teamLogoStyle: CSSProperties = {
  width: "72px",
  height: "72px",
  borderRadius: "999px",
  objectFit: "cover",
  border: "2px solid rgba(253,186,116,0.8)",
  background: "rgba(255,255,255,0.04)",
};

const teamNameStyle: CSSProperties = {
  marginTop: "0.65rem",
  fontWeight: 700,
  fontSize: "1rem",
};

const teamMetaStyle: CSSProperties = {
  color: "var(--text-muted)",
  marginTop: "0.2rem",
  fontSize: "0.82rem",
};

const scoreValueStyle: CSSProperties = {
  marginTop: "0.6rem",
  fontSize: "2rem",
  fontWeight: 800,
  lineHeight: 1,
};

const centerStateStyle: CSSProperties = {
  minWidth: "92px",
  textAlign: "center",
};

const linesButtonStyle: CSSProperties = {
  width: "100%",
  display: "grid",
  gridTemplateColumns: "20px minmax(0, 1fr) auto",
  alignItems: "center",
  gap: "0.7rem",
  padding: "0.9rem 1rem",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.03)",
  color: "var(--text)",
  fontWeight: 700,
  border: "1px solid rgba(96,165,250,0.2)",
};

const linesIconStyle: CSSProperties = {
  color: "#4ade80",
  fontSize: "1.1rem",
  fontWeight: 700,
  lineHeight: 1,
};

const linesLinkStyle: CSSProperties = {
  color: "#93c5fd",
  whiteSpace: "nowrap",
};

const gameFooterMetaStyle: CSSProperties = {
  marginTop: "0.9rem",
  paddingTop: "0.9rem",
  borderTop: "1px solid rgba(255,255,255,0.08)",
  color: "var(--text-muted)",
  textAlign: "center",
};

const otherGameCardStyle: CSSProperties = {
  border: "1px solid rgba(148,163,184,0.14)",
  borderRadius: "16px",
  padding: "1.1rem",
  background: "linear-gradient(180deg, rgba(10,18,31,0.96), rgba(7,17,31,0.82))",
  color: "var(--text)",
  display: "block",
};

const emptyCardStyle: CSSProperties = {
  padding: "1.1rem",
  borderRadius: "16px",
  border: "1px dashed var(--line)",
  color: "var(--text-muted)",
  marginBottom: "1rem",
};

const sheetOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(2,6,14,0.72)",
  zIndex: 2200,
  display: "flex",
  alignItems: "flex-end",
  backdropFilter: "blur(10px)",
};

const sheetStyle: CSSProperties = {
  width: "100%",
  maxHeight: "100vh",
  background: "linear-gradient(180deg, rgba(9,16,29,0.98), rgba(5,10,19,0.98))",
  color: "var(--text)",
  borderTopLeftRadius: "24px",
  borderTopRightRadius: "24px",
  padding: "calc(var(--safe-top) + 0.55rem) 1rem 1.2rem",
  overflow: "hidden",
  borderTop: "1px solid rgba(148,163,184,0.16)",
  boxShadow: "0 -24px 80px rgba(0,0,0,0.45)",
};

const sheetHandleStyle: CSSProperties = {
  width: "56px",
  height: "5px",
  borderRadius: "999px",
  background: "rgba(226,232,240,0.22)",
  margin: "0.35rem auto 0.55rem",
};

const sheetHeaderStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "56px 1fr 56px",
  alignItems: "center",
  marginBottom: "0.9rem",
  textAlign: "center",
};

const sheetDoneStyle: CSSProperties = {
  background: "transparent",
  color: "var(--accent-light)",
  padding: 0,
  fontWeight: 700,
};

const sheetContentStyle: CSSProperties = {
  overflowY: "auto",
  maxHeight: "calc(100vh - var(--safe-top) - 92px)",
  paddingBottom: "1rem",
};

const lineGroupCardStyle: CSSProperties = {
  background: "rgba(10,18,31,0.92)",
  borderRadius: "16px",
  overflow: "hidden",
  border: "1px solid rgba(148,163,184,0.14)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
};

const lineRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "52px 1fr",
  minHeight: "54px",
  borderBottom: "1px solid rgba(148,163,184,0.12)",
};

const linePositionStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700,
  fontSize: "0.82rem",
  color: "var(--accent-light)",
  background: "rgba(249,115,22,0.08)",
  borderRight: "1px solid rgba(148,163,184,0.12)",
};

const linePlayerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  padding: "0 0.9rem",
  fontWeight: 600,
  color: "var(--text)",
};
