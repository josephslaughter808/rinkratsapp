"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../../lib/supabaseClient";

function positionColor(pos: string) {
  if (pos === "C") return "#FFD700";
  if (pos === "LW" || pos === "RW") return "#3B82F6";
  if (pos === "LD" || pos === "RD") return "#EF4444";
  if (pos === "G") return "#FFFFFF";
  return "#9CA3AF";
}

type Player = {
  id: string;
  name: string;
  number: number;
  position: string;
  team_id: string | null;
};

type SeasonStats = {
  points: number;
  goals: number;
  assists: number;
  pim: number;
};

type GameStat = {
  id: string;
  game_id: string;
  goals: number;
  assists: number;
  pim: number;
  points: number;
};

type HighlightClip = {
  id: string;
  game_id: string;
  url: string;
  timestamp_seconds: number | null;
  description: string | null;
  created_at?: string | null;
};

type GameFilm = {
  id: string;
  game_id: string;
  source_url: string;
  created_at: string;
  segment_order?: number | null;
  segment_start_clock?: string | null;
  segment_end_clock?: string | null;
};

type GameInfo = {
  id: string;
  date: string;
  home_team_id: string | null;
  away_team_id: string | null;
  puck_drop_clock?: string | null;
  film_end_clock?: string | null;
};

type TeamInfo = {
  id: string;
  name: string;
};

export default function PlayerPage() {
  const params = useParams();
  const id = params?.id as string | undefined;

  const [loading, setLoading] = useState(true);
  const [player, setPlayer] = useState<Player | null>(null);
  const [seasonStats, setSeasonStats] = useState<SeasonStats | null>(null);
  const [gameStats, setGameStats] = useState<GameStat[]>([]);
  const [highlightClips, setHighlightClips] = useState<HighlightClip[]>([]);
  const [filmsByGame, setFilmsByGame] = useState<Record<string, GameFilm[]>>({});
  const [gamesById, setGamesById] = useState<Record<string, GameInfo>>({});
  const [teamsById, setTeamsById] = useState<Record<string, TeamInfo>>({});
  const [playbackState, setPlaybackState] = useState<{
    gameId: string;
    currentIndex: number;
    embedUrl: string;
    title: string;
  } | null>(null);

  useEffect(() => {
    if (!id) {
      console.error("No player id in route params");
      return;
    }

    async function load() {
      // 1. Player info
      const { data: p, error: pErr } = await supabase
        .from("players")
        .select("id, name, number, position, team_id")
        .eq("id", id)
        .single();

      if (pErr) {
        console.error("PLAYER ERROR:", pErr);
        setPlayer(null);
      } else {
        setPlayer(p as Player);
      }

      // 2. Season totals
      const { data: season, error: seasonErr } = await supabase
        .from("season_stats")
        .select("points, goals, assists, pim")
        .eq("player_id", id)
        .single();

      if (seasonErr) {
        console.error("SEASON ERROR:", seasonErr);
        setSeasonStats({ points: 0, goals: 0, assists: 0, pim: 0 });
      } else {
        setSeasonStats(
          (season as SeasonStats) || {
            points: 0,
            goals: 0,
            assists: 0,
            pim: 0,
          }
        );
      }

      // 3. Game-by-game stats + highlight feed
      const [{ data: games, error: gamesErr }, { data: clipRows }] = await Promise.all([
        supabase
        .from("game_stats")
        .select("id, game_id, goals, assists, pim, points")
        .eq("player_id", id)
        .order("id", { ascending: false }),
        supabase
          .from("video_clips")
          .select("id, game_id, url, timestamp_seconds, description, created_at")
          .eq("player_id", id)
          .order("created_at", { ascending: false }),
      ]);

      if (gamesErr) {
        console.error("GAME STATS ERROR:", gamesErr);
        setGameStats([]);
      } else {
        setGameStats((games as GameStat[]) || []);
      }

      const nextHighlightClips = (clipRows as HighlightClip[]) || [];
      setHighlightClips(nextHighlightClips);

      const highlightGameIds = Array.from(
        new Set(nextHighlightClips.map((clip) => clip.game_id).filter(Boolean))
      );

      if (highlightGameIds.length) {
        const [{ data: gameRows }, filmsResult] = await Promise.all([
          supabase
            .from("games_v2")
            .select("id, date, home_team_id, away_team_id, puck_drop_clock, film_end_clock")
            .in("id", highlightGameIds),
          supabase
            .from("game_films")
            .select(
              "id, game_id, source_url, created_at, segment_order, segment_start_clock, segment_end_clock"
            )
            .in("game_id", highlightGameIds)
            .order("segment_order", { ascending: true }),
        ]);

        const nextGamesById = Object.fromEntries(
          ((gameRows ?? []) as GameInfo[]).map((game) => [game.id, game])
        );
        setGamesById(nextGamesById);

        const teamIds = Array.from(
          new Set(
            ((gameRows ?? []) as GameInfo[]).flatMap((game) =>
              [game.home_team_id, game.away_team_id].filter(Boolean)
            )
          )
        ) as string[];

        if (teamIds.length) {
          const { data: teamRows } = await supabase
            .from("teams")
            .select("id, name")
            .in("id", teamIds);

          setTeamsById(
            Object.fromEntries(((teamRows ?? []) as TeamInfo[]).map((team) => [team.id, team]))
          );
        }

        if (!filmsResult.error) {
          setFilmsByGame(groupByGame((filmsResult.data ?? []) as GameFilm[]));
        }
      }

      setLoading(false);
    }

    load();
  }, [id]);

  const recentHighlights = useMemo(
    () => highlightClips.slice(0, 8),
    [highlightClips]
  );

  function openFullGame(gameId: string) {
    const game = gamesById[gameId];
    const segments = filmsByGame[gameId] ?? [];

    if (!game || !segments.length) {
      return;
    }

    const firstPlayable = findNextPlayableSegmentIndex(
      segments,
      game.puck_drop_clock ?? null,
      game.film_end_clock ?? null,
      0
    );

    if (firstPlayable === -1) {
      return;
    }

    const embedUrl = buildPlaybackEmbedUrl(
      segments[firstPlayable],
      game.puck_drop_clock ?? null,
      game.film_end_clock ?? null,
      firstPlayable
    );

    if (!embedUrl) {
      return;
    }

    setPlaybackState({
      gameId,
      currentIndex: firstPlayable,
      embedUrl,
      title: formatGameTitle(game, teamsById),
    });
  }

  useEffect(() => {
    if (!playbackState) {
      return;
    }

    const game = gamesById[playbackState.gameId];
    const segments = filmsByGame[playbackState.gameId] ?? [];
    const currentSegment = segments[playbackState.currentIndex];

    if (!game || !currentSegment) {
      return;
    }

    const durationSeconds = getSegmentPlaybackDuration(
      currentSegment,
      playbackState.currentIndex,
      game.puck_drop_clock ?? null,
      game.film_end_clock ?? null
    );

    if (durationSeconds <= 0) {
      return;
    }

    const timeout = window.setTimeout(() => {
      const nextIndex = findNextPlayableSegmentIndex(
        segments,
        game.puck_drop_clock ?? null,
        game.film_end_clock ?? null,
        playbackState.currentIndex + 1
      );

      if (nextIndex === -1) {
        setPlaybackState(null);
        return;
      }

      const nextEmbedUrl = buildPlaybackEmbedUrl(
        segments[nextIndex],
        game.puck_drop_clock ?? null,
        game.film_end_clock ?? null,
        nextIndex
      );

      if (!nextEmbedUrl) {
        setPlaybackState(null);
        return;
      }

      setPlaybackState({
        gameId: playbackState.gameId,
        currentIndex: nextIndex,
        embedUrl: nextEmbedUrl,
        title: playbackState.title,
      });
    }, durationSeconds * 1000);

    return () => window.clearTimeout(timeout);
  }, [filmsByGame, gamesById, playbackState, teamsById]);

  if (loading) {
    return (
      <main className="center-screen">
        <p>Loading...</p>
      </main>
    );
  }

  if (!id) {
    return (
      <main
        style={{
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "1.6rem", fontWeight: 700 }}>Player not found</h1>
      </main>
    );
  }

  if (!player) {
    return (
      <main
        style={{
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "1.6rem", fontWeight: 700 }}>
          Player not found
        </h1>
        <p style={{ marginTop: "0.75rem", opacity: 0.7 }}>
          This player ID does not match any player in the system.
        </p>
      </main>
    );
  }

  return (
    <main
      style={{
        padding: "1.5rem 1.5rem 5rem",
        maxWidth: "960px",
        margin: "0 auto",
      }}
    >
      {/* PROFILE HEADER */}
      <div
        style={{
          width: "120px",
          height: "120px",
          borderRadius: "50%",
          background: "var(--surface-light)",
          margin: "0 auto",
          marginBottom: "1rem",
          border: "3px solid var(--accent-light)",
        }}
      ></div>

      <h1
        style={{
          fontSize: "1.6rem",
          fontWeight: 700,
          textAlign: "center",
        }}
      >
        {player.name}
      </h1>

      <p
        className="opacity-70"
        style={{ marginTop: "0.25rem", textAlign: "center" }}
      >
        #{player.number}
        <span
          style={{
            marginLeft: "8px",
            padding: "2px 10px",
            borderRadius: "999px",
            border: `1px solid ${positionColor(player.position)}`,
            background:
              "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(15,23,42,0.8))",
            color: "#FFFFFF",
            fontSize: "0.75rem",
            fontWeight: 800,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            textShadow: "0 1px 2px rgba(0,0,0,0.6)",
          }}
        >
          {player.position}
        </span>
      </p>

      {/* SEASON TOTALS */}
      <section style={{ marginTop: "2rem" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "0.75rem",
          }}
        >
          {[
            { key: "points", label: "Points" },
            { key: "goals", label: "Goals" },
            { key: "assists", label: "Assists" },
            { key: "pim", label: "PIM" },
          ].map((stat) => (
            <div
              key={stat.key}
              style={{
                background:
                  "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,64,175,0.9))",
                padding: "1rem",
                borderRadius: "var(--radius)",
                border: "1px solid rgba(148,163,184,0.4)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "1.6rem", fontWeight: 700 }}>
                {seasonStats?.[stat.key as keyof SeasonStats] ?? 0}


              </div>
              <div
                className="opacity-70"
                style={{
                  marginTop: "0.25rem",
                  fontSize: "0.8rem",
                  textTransform: "uppercase",
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: "2.4rem" }}>
        <h2
          style={{
            fontSize: "1.3rem",
            fontWeight: 700,
            marginBottom: "1rem",
            textAlign: "left",
          }}
        >
          Highlights
        </h2>

        {recentHighlights.length === 0 ? (
          <p style={{ opacity: 0.7, fontSize: "0.9rem" }}>
            No highlights linked for this player yet.
          </p>
        ) : (
          <div style={{ display: "grid", gap: "0.85rem" }}>
            {recentHighlights.map((clip) => {
              const game = gamesById[clip.game_id];
              const hasFullGame = Boolean((filmsByGame[clip.game_id] ?? []).length);

              return (
                <article key={clip.id} style={highlightCardStyle}>
                  <div>
                    <div style={{ color: "var(--accent-light)", fontSize: "0.78rem", textTransform: "uppercase" }}>
                      {game ? formatGameTitle(game, teamsById) : `Game ${clip.game_id}`}
                    </div>
                    <h3 style={{ fontSize: "1.05rem", marginTop: "0.35rem" }}>
                      {clip.description || "Tagged highlight"}
                    </h3>
                    <div style={{ color: "var(--text-muted)", marginTop: "0.3rem" }}>
                      {clip.timestamp_seconds !== null
                        ? `Clip start • ${formatTimestamp(clip.timestamp_seconds)}`
                        : "Clip time pending"}
                    </div>
                  </div>
                  <div style={highlightActionRowStyle}>
                    <a
                      href={clip.url}
                      target="_blank"
                      rel="noreferrer"
                      style={watchClipStyle}
                    >
                      Watch Clip
                    </a>
                    {hasFullGame ? (
                      <button
                        style={fullGameButtonStyle}
                        onClick={() => openFullGame(clip.game_id)}
                      >
                        Full Game Film
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* GAME LOG + CARDS */}
      <section style={{ marginTop: "3rem" }}>
        <h2
          style={{
            fontSize: "1.3rem",
            fontWeight: 700,
            marginBottom: "1rem",
            textAlign: "left",
          }}
        >
          Game Log
        </h2>

        {gameStats.length === 0 && (
          <p style={{ opacity: 0.7, fontSize: "0.9rem" }}>
            No game stats recorded for this player yet.
          </p>
        )}

        {gameStats.map((gs) => (
          <div
            key={gs.id}
            style={{
              background: "var(--surface)",
              borderRadius: "var(--radius)",
              border: "1px solid var(--border)",
              padding: "1rem",
              marginBottom: "1rem",
            }}
          >
            {/* TOP ROW */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "0.75rem",
                opacity: 0.7,
                fontSize: "0.85rem",
              }}
            >
              <div>Game #{gs.game_id}</div>
              <div>Date: (coming soon)</div>
            </div>

            {/* GAME-SPECIFIC STATS */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "0.75rem",
                marginBottom: "0.75rem",
              }}
            >
              {[
                { key: "points", label: "Points" },
                { key: "goals", label: "Goals" },
                { key: "assists", label: "Assists" },
                { key: "pim", label: "PIM" },
              ].map((stat) => (
                <div
                  key={stat.key}
                  style={{
                    background: "var(--surface-light)",
                    padding: "0.75rem",
                    borderRadius: "var(--radius)",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "1.4rem", fontWeight: 700 }}>
                    {gs[stat.key as keyof GameStat] ?? 0}
                  </div>
                  <div
                    className="opacity-70"
                    style={{ fontSize: "0.75rem", marginTop: "0.25rem" }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* HIGHLIGHTS */}
            <div style={{ opacity: 0.85, fontSize: "0.85rem" }}>
              {highlightClips
                .filter((clip) => clip.game_id === gs.game_id)
                .slice(0, 3)
                .map((clip) => (
                  <a
                    key={clip.id}
                    href={clip.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "block",
                      marginTop: "0.35rem",
                      color: "var(--accent-light)",
                    }}
                  >
                    {clip.description || "Watch highlight"}
                    {clip.timestamp_seconds !== null
                      ? ` • ${formatTimestamp(clip.timestamp_seconds)}`
                      : ""}
                  </a>
                ))}
              {!highlightClips.some((clip) => clip.game_id === gs.game_id)
                ? "Highlights: none linked yet"
                : null}
            </div>
          </div>
        ))}
      </section>

      {playbackState ? (
        <div style={sheetOverlayStyle} onClick={() => setPlaybackState(null)}>
          <div style={playbackSheetStyle} onClick={(event) => event.stopPropagation()}>
            <div style={sheetHandleStyle} />
            <div style={sheetHeaderStyle}>
              <div style={{ width: 56 }} />
              <h2 style={{ fontSize: "1.15rem" }}>Full Game Film</h2>
              <button style={sheetDoneStyle} onClick={() => setPlaybackState(null)}>
                Done
              </button>
            </div>
            <div style={{ color: "var(--text-muted)", marginBottom: "0.75rem", textAlign: "center" }}>
              {playbackState.title}
            </div>
            <div style={iframeWrapStyle}>
              <iframe
                key={playbackState.embedUrl}
                src={playbackState.embedUrl}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                style={iframeStyle}
              />
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function groupByGame<T extends { game_id: string }>(rows: T[]) {
  return rows.reduce<Record<string, T[]>>((accumulator, row) => {
    accumulator[row.game_id] = [...(accumulator[row.game_id] ?? []), row];
    return accumulator;
  }, {});
}

function formatTimestamp(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function parseClockToMinutes(clock?: string | null) {
  if (!clock) {
    return null;
  }
  const [hours, minutes] = clock.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }
  return hours * 60 + minutes;
}

function findNextPlayableSegmentIndex(
  segments: GameFilm[],
  puckDropClock: string | null,
  filmEndClock: string | null,
  startIndex: number
) {
  for (let index = startIndex; index < segments.length; index += 1) {
    const duration = getSegmentPlaybackDuration(
      segments[index],
      index,
      puckDropClock,
      filmEndClock
    );
    if (duration > 0) {
      return index;
    }
  }
  return -1;
}

function getSegmentPlaybackDuration(
  segment: GameFilm,
  index: number,
  puckDropClock: string | null,
  filmEndClock: string | null
) {
  const start = parseClockToMinutes(segment.segment_start_clock);
  const end = parseClockToMinutes(segment.segment_end_clock);
  if (start === null || end === null) {
    return 0;
  }
  const playbackStart = index === 0 ? Math.max(start, parseClockToMinutes(puckDropClock) ?? start) : start;
  const playbackEnd = Math.min(end, parseClockToMinutes(filmEndClock) ?? end);
  return Math.max(0, (playbackEnd - playbackStart) * 60);
}

function buildPlaybackEmbedUrl(
  segment: GameFilm,
  puckDropClock: string | null,
  filmEndClock: string | null,
  index: number
) {
  const videoId = extractYoutubeId(segment.source_url);
  const start = parseClockToMinutes(segment.segment_start_clock);
  const end = parseClockToMinutes(segment.segment_end_clock);

  if (!videoId || start === null || end === null) {
    return null;
  }

  const playbackStart = index === 0 ? Math.max(start, parseClockToMinutes(puckDropClock) ?? start) : start;
  const playbackEnd = Math.min(end, parseClockToMinutes(filmEndClock) ?? end);
  if (playbackEnd <= playbackStart) {
    return null;
  }

  const startSeconds = (playbackStart - start) * 60;
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&start=${startSeconds}&rel=0&modestbranding=1&playsinline=1`;
}

function extractYoutubeId(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.replace("/", "");
    }
    if (parsed.searchParams.get("v")) {
      return parsed.searchParams.get("v");
    }
    const embedMatch = parsed.pathname.match(/\/embed\/([^/]+)/);
    return embedMatch?.[1] ?? null;
  } catch {
    return null;
  }
}

function formatGameTitle(game: GameInfo, teamsById: Record<string, TeamInfo>) {
  const home = teamsById[game.home_team_id ?? ""]?.name ?? "Home";
  const away = teamsById[game.away_team_id ?? ""]?.name ?? "Away";
  const date = new Date(game.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  return `${away} at ${home} • ${date}`;
}

const highlightCardStyle: CSSProperties = {
  background: "var(--surface)",
  borderRadius: "var(--radius)",
  border: "1px solid var(--border)",
  padding: "1rem",
  display: "grid",
  gap: "0.9rem",
};

const highlightActionRowStyle: CSSProperties = {
  display: "flex",
  gap: "0.7rem",
  flexWrap: "wrap",
};

const watchClipStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "14px",
  padding: "0.75rem 0.95rem",
  background: "linear-gradient(135deg, #0ea5e9, #2563eb)",
  color: "white",
  fontWeight: 700,
};

const fullGameButtonStyle: CSSProperties = {
  borderRadius: "14px",
  padding: "0.75rem 0.95rem",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(148,163,184,0.16)",
  color: "var(--text)",
  fontWeight: 700,
};

const sheetOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(2,6,14,0.72)",
  zIndex: 120,
  display: "flex",
  alignItems: "flex-end",
  backdropFilter: "blur(10px)",
};

const playbackSheetStyle: CSSProperties = {
  width: "100%",
  background: "linear-gradient(180deg, rgba(9,16,29,0.98), rgba(5,10,19,0.98))",
  color: "var(--text)",
  borderTopLeftRadius: "24px",
  borderTopRightRadius: "24px",
  padding: "0.55rem 1rem 1.2rem",
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
  marginBottom: "0.6rem",
  textAlign: "center",
};

const sheetDoneStyle: CSSProperties = {
  background: "transparent",
  color: "var(--accent-light)",
  padding: 0,
  fontWeight: 700,
};

const iframeWrapStyle: CSSProperties = {
  position: "relative",
  width: "100%",
  paddingTop: "56.25%",
  borderRadius: "18px",
  overflow: "hidden",
  background: "rgba(0,0,0,0.45)",
};

const iframeStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  border: "none",
};
