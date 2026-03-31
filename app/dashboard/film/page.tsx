"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useTeam } from "@/context/TeamContext";

type GameRow = {
  id: string;
  date: string;
  season: string;
  league_id: string | null;
  home_team_id: string | null;
  away_team_id: string | null;
  home_score: number | null;
  away_score: number | null;
  rink?: string | null;
  status?: string | null;
  film_uploaded?: boolean | null;
};

type TeamRow = {
  id: string;
  name: string;
  logo_url: string | null;
};

type FilmRow = {
  id: string;
  game_id: string;
  source_url: string;
  visibility: string;
  notes: string | null;
  created_at: string;
};

type ClipRow = {
  id: string;
  game_id: string;
  title: string;
  description: string | null;
  clip_type: string;
  start_seconds: number;
  end_seconds: number;
  published: boolean;
  created_at: string;
};

type PlayerRow = {
  id: string;
  name: string | null;
  number: number | null;
  position: string | null;
};

const leadershipRoles = new Set(["captain", "assistant_captain", "film_manager"]);

export default function FilmRoomPage() {
  const { selectedTeam } = useTeam();
  const activeTeam = selectedTeam;
  const [loading, setLoading] = useState(true);
  const [schemaReady, setSchemaReady] = useState(true);
  const [games, setGames] = useState<GameRow[]>([]);
  const [teamsById, setTeamsById] = useState<Record<string, TeamRow>>({});
  const [filmsByGame, setFilmsByGame] = useState<Record<string, FilmRow[]>>({});
  const [clipsByGame, setClipsByGame] = useState<Record<string, ClipRow[]>>({});
  const [roster, setRoster] = useState<PlayerRow[]>([]);
  const [bannerMessage, setBannerMessage] = useState("");

  const [filmDraft, setFilmDraft] = useState({
    gameId: "",
    sourceUrl: "",
    visibility: "team_season",
    notes: "",
  });
  const [clipDraft, setClipDraft] = useState({
    gameId: "",
    filmId: "",
    title: "",
    description: "",
    clipType: "goal",
    startTime: "00:00",
    endTime: "00:15",
    playerId: "",
  });

  const role = selectedTeam?.role ?? "player";
  const isLeadership = leadershipRoles.has(role);

  useEffect(() => {
    if (!activeTeam) {
      return;
    }

    const team = activeTeam;
    let active = true;

    async function loadFilmRoom() {
      setLoading(true);
      setBannerMessage("");

      const baseGameSelect =
        "id, date, season, league_id, home_team_id, away_team_id, home_score, away_score";
      const enhancedGameSelect = `${baseGameSelect}, rink, status, film_uploaded`;

      let gamesQuery = supabase
        .from("games_v2")
        .select(enhancedGameSelect)
        .eq("league_id", team.leagueId)
        .order("date", { ascending: false });

      if (!isLeadership) {
        gamesQuery = gamesQuery.or(
          `home_team_id.eq.${team.id},away_team_id.eq.${team.id}`
        );
      }

      let gameRows = [] as GameRow[];
      let gamesError: { message?: string } | null = null;
      const initialResult = await gamesQuery;
      gameRows = (initialResult.data ?? []) as GameRow[];
      gamesError = initialResult.error;

      if (gamesError?.message?.includes("column games_v2.rink does not exist")) {
        const fallbackQuery = supabase
          .from("games_v2")
          .select(baseGameSelect)
          .eq("league_id", team.leagueId)
          .order("date", { ascending: false });

        const fallbackFiltered = !isLeadership
          ? fallbackQuery.or(
              `home_team_id.eq.${team.id},away_team_id.eq.${team.id}`
            )
          : fallbackQuery;

        const fallbackResult = await fallbackFiltered;
        gameRows = ((fallbackResult.data ?? []) as GameRow[]).map((game) => ({
          ...game,
          rink: null,
          status: null,
          film_uploaded: false,
        }));
        gamesError = fallbackResult.error;
      }

      if (gamesError || !active) {
        setLoading(false);
        return;
      }

      const nextGames = ((gameRows ?? []) as GameRow[]).map((game) => ({
        ...game,
        rink: game.rink ?? null,
        status:
          game.status ??
          (game.home_score !== null && game.away_score !== null ? "final" : "scheduled"),
        film_uploaded: game.film_uploaded ?? false,
      }));
      setGames(nextGames);

      const gameIds = nextGames.map((game) => game.id);
      const teamIds = Array.from(
        new Set(
          nextGames.flatMap((game) =>
            [game.home_team_id, game.away_team_id].filter(Boolean)
          )
        )
      ) as string[];

      const [teamsResult, rosterResult, filmsResult, clipsResult] = await Promise.all([
        teamIds.length
          ? supabase.from("teams").select("id, name, logo_url").in("id", teamIds)
          : Promise.resolve({ data: [], error: null }),
        supabase
          .from("players")
          .select("id, name, number, position")
          .eq("team_id", team.id)
          .order("name", { ascending: true }),
        gameIds.length
          ? supabase
              .from("game_films")
              .select("id, game_id, source_url, visibility, notes, created_at")
              .in("game_id", gameIds)
              .order("created_at", { ascending: false })
          : Promise.resolve({ data: [], error: null }),
        gameIds.length
          ? supabase
              .from("game_clips")
              .select(
                "id, game_id, title, description, clip_type, start_seconds, end_seconds, published, created_at"
              )
              .in("game_id", gameIds)
              .order("created_at", { ascending: false })
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (!active) {
        return;
      }

      setTeamsById(
        Object.fromEntries(((teamsResult.data ?? []) as TeamRow[]).map((team) => [team.id, team]))
      );
      setRoster((rosterResult.data ?? []) as PlayerRow[]);

      if (filmsResult.error || clipsResult.error) {
        setSchemaReady(false);
        setBannerMessage(
          "Run the film-room migration in Supabase to enable YouTube film links and clip tagging."
        );
        setFilmsByGame({});
        setClipsByGame({});
      } else {
        setSchemaReady(true);
        setFilmsByGame(groupByGame((filmsResult.data ?? []) as FilmRow[]));
        setClipsByGame(groupByGame((clipsResult.data ?? []) as ClipRow[]));
      }

      const firstGameId = nextGames[0]?.id ?? "";
      setFilmDraft((current) => ({
        ...current,
        gameId: current.gameId || firstGameId,
      }));

      setClipDraft((current) => ({
        ...current,
        gameId: current.gameId || firstGameId,
        filmId:
          current.filmId ||
          ((filmsResult.data ?? []) as FilmRow[])[0]?.id ||
          "",
        playerId: current.playerId || (rosterResult.data?.[0] as PlayerRow | undefined)?.id || "",
      }));

      setLoading(false);
    }

    loadFilmRoom();

    return () => {
      active = false;
    };
  }, [activeTeam, isLeadership]);

  const selectedGameFilms = useMemo(
    () => filmsByGame[clipDraft.gameId] ?? [],
    [clipDraft.gameId, filmsByGame]
  );

  async function handleSaveFilm() {
    if (!activeTeam || !schemaReady || !filmDraft.gameId || !filmDraft.sourceUrl.trim()) {
      return;
    }
    const team = activeTeam;

    const { data, error } = await supabase
      .from("game_films")
      .insert({
        game_id: filmDraft.gameId,
        uploaded_by_player_id: team.player_id,
        uploader_role: role,
        source_url: filmDraft.sourceUrl.trim(),
        visibility: filmDraft.visibility,
        notes: filmDraft.notes.trim() || null,
      })
      .select("id, game_id, source_url, visibility, notes, created_at")
      .single();

    if (error || !data) {
      setBannerMessage(error?.message || "Could not save film link.");
      return;
    }

    setFilmsByGame((current) => ({
      ...current,
      [data.game_id]: [data as FilmRow, ...(current[data.game_id] ?? [])],
    }));
    setFilmDraft((current) => ({ ...current, sourceUrl: "", notes: "" }));
    setClipDraft((current) => ({
      ...current,
      gameId: current.gameId || data.game_id,
      filmId: current.filmId || data.id,
    }));
    setBannerMessage("Film linked to the game.");
  }

  async function handleSaveClip() {
    if (
      !activeTeam ||
      !schemaReady ||
      !clipDraft.gameId ||
      !clipDraft.filmId ||
      !clipDraft.title.trim() ||
      !clipDraft.playerId
    ) {
      return;
    }
    const team = activeTeam;

    const startSeconds = parseClockInput(clipDraft.startTime);
    const endSeconds = parseClockInput(clipDraft.endTime);

    if (endSeconds <= startSeconds) {
      setBannerMessage("Clip end time must be after the start time.");
      return;
    }

    const { data: clipRow, error: clipError } = await supabase
      .from("game_clips")
      .insert({
        film_id: clipDraft.filmId,
        game_id: clipDraft.gameId,
        created_by_player_id: team.player_id,
        title: clipDraft.title.trim(),
        description: clipDraft.description.trim() || null,
        clip_type: clipDraft.clipType,
        start_seconds: startSeconds,
        end_seconds: endSeconds,
        published: true,
      })
      .select(
        "id, game_id, title, description, clip_type, start_seconds, end_seconds, published, created_at"
      )
      .single();

    if (clipError || !clipRow) {
      setBannerMessage(clipError?.message || "Could not save highlight clip.");
      return;
    }

    const selectedFilm = selectedGameFilms.find((film) => film.id === clipDraft.filmId);

    await Promise.all([
      supabase.from("game_clip_players").insert({
        clip_id: clipRow.id,
        player_id: clipDraft.playerId,
        involvement_role: clipDraft.clipType === "goal" ? "scorer" : "featured",
      }),
      supabase.from("video_clips").insert({
        player_id: clipDraft.playerId,
        game_id: clipDraft.gameId,
        url: selectedFilm?.source_url ?? "",
        timestamp_seconds: startSeconds,
        description: clipDraft.title.trim(),
      }),
    ]);

    setClipsByGame((current) => ({
      ...current,
      [clipRow.game_id]: [clipRow as ClipRow, ...(current[clipRow.game_id] ?? [])],
    }));
    setClipDraft((current) => ({
      ...current,
      title: "",
      description: "",
      startTime: "00:00",
      endTime: "00:15",
    }));
    setBannerMessage("Highlight saved and linked to the player.");
  }

  if (!activeTeam) {
    return (
      <main className="page-shell">
        <section className="glass-panel" style={{ padding: "1.2rem" }}>
          Select a team to open the film room.
        </section>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="center-screen">
        <p>Loading film room...</p>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="glass-panel" style={{ padding: "1.25rem", marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <div style={{ color: "var(--accent-light)", marginBottom: "0.35rem" }}>Film Room</div>
            <h1 style={{ fontSize: "2rem", marginBottom: "0.45rem" }}>
              Full game film and player-linked highlights
            </h1>
            <p style={{ color: "var(--text-muted)", maxWidth: "760px" }}>
              Captains, assistant captains, and film managers can paste an unlisted YouTube game link,
              attach it to a game, and publish clips that stay attached to the player’s highlight history.
            </p>
          </div>
          <div style={filmAccessCardStyle}>
            <div style={{ color: "var(--text-muted)", marginBottom: "0.35rem" }}>Current Access</div>
            <div style={{ fontWeight: 700, fontSize: "1.1rem", textTransform: "capitalize" }}>
              {role.replaceAll("_", " ")}
            </div>
            <div style={{ marginTop: "0.4rem", color: "var(--accent-light)" }}>
              {isLeadership
                ? "You can link full film and publish highlights."
                : "You can browse your team’s season film and published highlights."}
            </div>
          </div>
        </div>
      </section>

      {bannerMessage ? (
        <section className="glass-panel" style={bannerStyle}>
          {bannerMessage}
        </section>
      ) : null}

      {isLeadership ? (
        <section
          className="glass-panel"
          style={{
            padding: "1rem",
            marginBottom: "1rem",
            display: "grid",
            gap: "1rem",
          }}
        >
          <div>
            <div style={panelLabelStyle}>Link Full Film</div>
            <p style={{ color: "var(--text-muted)", marginTop: "0.25rem" }}>
              Paste the unlisted YouTube game URL and connect it to the right game.
            </p>
          </div>
          <div style={formGridStyle}>
            <select
              value={filmDraft.gameId}
              onChange={(event) =>
                setFilmDraft((current) => ({ ...current, gameId: event.target.value }))
              }
              style={inputStyle}
            >
              {games.map((game) => (
                <option key={game.id} value={game.id}>
                  {formatGameHeading(game, teamsById)}
                </option>
              ))}
            </select>
            <input
              value={filmDraft.sourceUrl}
              onChange={(event) =>
                setFilmDraft((current) => ({ ...current, sourceUrl: event.target.value }))
              }
              placeholder="https://youtube.com/watch?v=..."
              style={inputStyle}
            />
            <select
              value={filmDraft.visibility}
              onChange={(event) =>
                setFilmDraft((current) => ({ ...current, visibility: event.target.value }))
              }
              style={inputStyle}
            >
              <option value="team_season">Team Season</option>
              <option value="league_staff">League Staff</option>
              <option value="public_highlights_only">Public Highlights Only</option>
            </select>
          </div>
          <textarea
            value={filmDraft.notes}
            onChange={(event) =>
              setFilmDraft((current) => ({ ...current, notes: event.target.value }))
            }
            placeholder="Optional note about the film upload"
            style={{ ...inputStyle, minHeight: "84px", resize: "vertical" }}
          />
          <button
            style={primaryButtonStyle}
            onClick={handleSaveFilm}
            disabled={!schemaReady}
          >
            Save film link
          </button>

          <div style={{ borderTop: "1px solid rgba(148,163,184,0.12)", paddingTop: "1rem" }}>
            <div style={panelLabelStyle}>Create Highlight</div>
            <p style={{ color: "var(--text-muted)", marginTop: "0.25rem", marginBottom: "0.8rem" }}>
              Published clips will also write into the player’s legacy highlight feed so the goal stays visible on their page.
            </p>
            <div style={formGridStyle}>
              <select
                value={clipDraft.gameId}
                onChange={(event) =>
                  setClipDraft((current) => ({
                    ...current,
                    gameId: event.target.value,
                    filmId: filmsByGame[event.target.value]?.[0]?.id ?? "",
                  }))
                }
                style={inputStyle}
              >
                {games.map((game) => (
                  <option key={game.id} value={game.id}>
                    {formatGameHeading(game, teamsById)}
                  </option>
                ))}
              </select>
              <select
                value={clipDraft.filmId}
                onChange={(event) =>
                  setClipDraft((current) => ({ ...current, filmId: event.target.value }))
                }
                style={inputStyle}
              >
                <option value="">Select linked film</option>
                {selectedGameFilms.map((film) => (
                  <option key={film.id} value={film.id}>
                    {film.visibility} • {formatDateTime(film.created_at)}
                  </option>
                ))}
              </select>
              <select
                value={clipDraft.playerId}
                onChange={(event) =>
                  setClipDraft((current) => ({ ...current, playerId: event.target.value }))
                }
                style={inputStyle}
              >
                {roster.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name || "Unnamed player"}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ ...formGridStyle, marginTop: "0.8rem" }}>
              <input
                value={clipDraft.title}
                onChange={(event) =>
                  setClipDraft((current) => ({ ...current, title: event.target.value }))
                }
                placeholder="Goal title"
                style={inputStyle}
              />
              <select
                value={clipDraft.clipType}
                onChange={(event) =>
                  setClipDraft((current) => ({ ...current, clipType: event.target.value }))
                }
                style={inputStyle}
              >
                <option value="goal">Goal</option>
                <option value="assist">Assist</option>
                <option value="hit">Hit</option>
                <option value="penalty">Penalty</option>
                <option value="save">Save</option>
                <option value="custom">Custom</option>
              </select>
              <input
                value={clipDraft.startTime}
                onChange={(event) =>
                  setClipDraft((current) => ({ ...current, startTime: event.target.value }))
                }
                placeholder="00:00"
                style={inputStyle}
              />
              <input
                value={clipDraft.endTime}
                onChange={(event) =>
                  setClipDraft((current) => ({ ...current, endTime: event.target.value }))
                }
                placeholder="00:15"
                style={inputStyle}
              />
            </div>
            <textarea
              value={clipDraft.description}
              onChange={(event) =>
                setClipDraft((current) => ({ ...current, description: event.target.value }))
              }
              placeholder="What happens in the clip?"
              style={{ ...inputStyle, minHeight: "76px", resize: "vertical", marginTop: "0.8rem" }}
            />
            <button
              style={{ ...primaryButtonStyle, marginTop: "0.8rem" }}
              onClick={handleSaveClip}
              disabled={!schemaReady}
            >
              Publish highlight
            </button>
          </div>
        </section>
      ) : null}

      <section style={{ display: "grid", gap: "1rem" }}>
        {games.map((game) => {
          const homeTeam = teamsById[game.home_team_id ?? ""];
          const awayTeam = teamsById[game.away_team_id ?? ""];
          const films = filmsByGame[game.id] ?? [];
          const clips = clipsByGame[game.id] ?? [];

          return (
            <article key={game.id} className="glass-panel" style={{ padding: "1.2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "0.8rem" }}>
                <div>
                  <div style={{ color: "var(--accent-light)", marginBottom: "0.3rem" }}>
                    {formatGameDate(game.date)} • {game.rink || "Rink TBD"}
                  </div>
                  <h2 style={{ fontSize: "1.45rem" }}>
                    {awayTeam?.name ?? "Away"} at {homeTeam?.name ?? "Home"}
                  </h2>
                  <p style={{ color: "var(--text-muted)", marginTop: "0.35rem" }}>
                    {films.length
                      ? "Full game film is linked and ready for clip tagging."
                      : "No full game film is linked yet."}
                  </p>
                </div>
                <div style={filmSummaryStyle}>
                  <div style={{ color: "var(--text-muted)", marginBottom: "0.35rem" }}>Film Status</div>
                  <div style={{ fontWeight: 700 }}>
                    {films.length ? "Film linked" : "Awaiting upload"}
                  </div>
                  <div style={{ color: "var(--accent-light)", marginTop: "0.35rem" }}>
                    {clips.length} published highlight{clips.length === 1 ? "" : "s"}
                  </div>
                </div>
              </div>

              {films[0] ? (
                <div style={{ display: "grid", gap: "0.75rem", marginBottom: "0.85rem" }}>
                  <a href={films[0].source_url} target="_blank" rel="noreferrer" style={filmPrimaryStyle}>
                    Open full film
                  </a>
                  {films[0].notes ? (
                    <div style={filmSecondaryStyle}>Uploader note: {films[0].notes}</div>
                  ) : null}
                </div>
              ) : null}

              {clips.length ? (
                <div style={{ display: "grid", gap: "0.7rem" }}>
                  {clips.slice(0, 4).map((clip) => (
                    <div key={clip.id} style={clipRowStyle}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{clip.title}</div>
                        <div style={{ color: "var(--text-muted)", marginTop: "0.25rem" }}>
                          {clip.clip_type} • {formatClipRange(clip.start_seconds, clip.end_seconds)}
                        </div>
                      </div>
                      <Link href={`/dashboard/games/${game.id}`} style={clipOpenStyle}>
                        View
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={filmSecondaryStyle}>
                  No published highlights for this game yet.
                </div>
              )}
            </article>
          );
        })}
      </section>
    </main>
  );
}

function groupByGame<T extends { game_id: string }>(rows: T[]) {
  return rows.reduce<Record<string, T[]>>((accumulator, row) => {
    accumulator[row.game_id] = [...(accumulator[row.game_id] ?? []), row];
    return accumulator;
  }, {});
}

function parseClockInput(value: string) {
  const parts = value.split(":").map((part) => Number(part));

  if (parts.some((part) => Number.isNaN(part))) {
    return 0;
  }

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  return 0;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatGameDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatGameHeading(game: GameRow, teamsById: Record<string, TeamRow>) {
  const home = teamsById[game.home_team_id ?? ""]?.name ?? "Home";
  const away = teamsById[game.away_team_id ?? ""]?.name ?? "Away";
  return `${formatGameDate(game.date)} • ${away} at ${home}`;
}

function formatClipRange(start: number, end: number) {
  return `${formatClock(start)} - ${formatClock(end)}`;
}

function formatClock(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

const filmAccessCardStyle: CSSProperties = {
  minWidth: "270px",
  padding: "1rem",
  borderRadius: "16px",
  border: "1px solid var(--line)",
  background: "var(--surface-light)",
};

const filmSummaryStyle: CSSProperties = {
  minWidth: "220px",
  padding: "0.95rem",
  borderRadius: "16px",
  border: "1px solid var(--line)",
  background: "rgba(7, 17, 31, 0.7)",
};

const filmPrimaryStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "14px",
  padding: "0.8rem 1rem",
  background: "linear-gradient(135deg, #0ea5e9, #2563eb)",
  color: "white",
  fontWeight: 700,
};

const filmSecondaryStyle: CSSProperties = {
  borderRadius: "14px",
  padding: "0.8rem 1rem",
  background: "var(--surface-light)",
  border: "1px solid var(--line)",
  color: "var(--text-muted)",
};

const bannerStyle: CSSProperties = {
  padding: "0.95rem 1rem",
  marginBottom: "1rem",
  border: "1px solid rgba(14,165,233,0.22)",
  color: "#bae6fd",
  background: "rgba(14,165,233,0.08)",
};

const panelLabelStyle: CSSProperties = {
  color: "var(--accent-light)",
  fontSize: "0.76rem",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const formGridStyle: CSSProperties = {
  display: "grid",
  gap: "0.8rem",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
};

const inputStyle: CSSProperties = {
  width: "100%",
  borderRadius: "16px",
  border: "1px solid rgba(148,163,184,0.16)",
  background: "rgba(15,23,42,0.78)",
  color: "var(--text)",
  padding: "0.9rem 0.85rem",
  fontSize: "0.95rem",
  outline: "none",
};

const primaryButtonStyle: CSSProperties = {
  borderRadius: "16px",
  background: "linear-gradient(135deg, #f97316, #ea580c)",
  color: "white",
  fontWeight: 700,
  padding: "0.9rem 1rem",
};

const clipRowStyle: CSSProperties = {
  borderRadius: "14px",
  border: "1px solid rgba(148,163,184,0.12)",
  background: "rgba(7,17,31,0.72)",
  padding: "0.85rem 0.9rem",
  display: "flex",
  justifyContent: "space-between",
  gap: "0.75rem",
  alignItems: "center",
};

const clipOpenStyle: CSSProperties = {
  borderRadius: "12px",
  padding: "0.55rem 0.8rem",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(148,163,184,0.12)",
  color: "var(--text)",
  fontWeight: 700,
};
