"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

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

type ClipRow = {
  id: string;
  description: string | null;
  url: string;
  timestamp_seconds: number | null;
  player_id: string | null;
  players?: Array<{
    name: string | null;
  }> | null;
};

export default function GameDetailsPage() {
  const params = useParams<{ gameId: string }>();
  const gameId = params?.gameId;
  const [loading, setLoading] = useState(true);
  const [game, setGame] = useState<GameRow | null>(null);
  const [teamsById, setTeamsById] = useState<Record<string, TeamRow>>({});
  const [clips, setClips] = useState<ClipRow[]>([]);

  useEffect(() => {
    if (!gameId) {
      return;
    }

    let active = true;

    async function loadGame() {
      const { data: gameRow } = await supabase
        .from("games_v2")
        .select(
          "id, league_id, season, date, home_team_id, away_team_id, home_score, away_score, is_playoff"
        )
        .eq("id", gameId)
        .maybeSingle();

      if (!active) {
        return;
      }

      setGame((gameRow as GameRow | null) ?? null);

      if (!gameRow) {
        setLoading(false);
        return;
      }

      const teamIds = [gameRow.home_team_id, gameRow.away_team_id].filter(Boolean) as string[];

      const [{ data: teamRows }, { data: clipRows }] = await Promise.all([
        supabase.from("teams").select("id, name, logo_url").in("id", teamIds),
        supabase
          .from("video_clips")
          .select("id, description, url, timestamp_seconds, player_id, players(name)")
          .eq("game_id", gameRow.id),
      ]);

      if (!active) {
        return;
      }

      setTeamsById(
        Object.fromEntries(((teamRows ?? []) as TeamRow[]).map((team) => [team.id, team]))
      );
      setClips((clipRows ?? []) as unknown as ClipRow[]);
      setLoading(false);
    }

    loadGame();

    return () => {
      active = false;
    };
  }, [gameId]);

  if (loading) {
    return (
      <main className="center-screen">
        <p>Loading game...</p>
      </main>
    );
  }

  if (!game) {
    return (
      <main className="page-shell" style={{ paddingTop: "1.5rem" }}>
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <Link href="/dashboard" style={{ display: "inline-block", marginBottom: "1rem" }}>
            Back to dashboard
          </Link>
          <h1 style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>Game not found</h1>
          <p style={{ color: "var(--text-muted)" }}>
            This game could not be loaded from the league schedule.
          </p>
        </div>
      </main>
    );
  }

  const homeTeam = teamsById[game.home_team_id ?? ""];
  const awayTeam = teamsById[game.away_team_id ?? ""];
  const isFinal = game.home_score !== null && game.away_score !== null;

  return (
    <main className="page-shell" style={{ paddingTop: "1.5rem" }}>
      <div className="glass-panel" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
        <Link href="/dashboard" style={{ display: "inline-block", marginBottom: "1rem" }}>
          Back to dashboard
        </Link>

        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <p style={{ color: "var(--text-muted)", marginBottom: "0.35rem" }}>
              {formatGameDate(game.date)} • {formatGameTime(game.date)} • {resolveRinkLabel(homeTeam, awayTeam)}
            </p>
            <h1 style={{ fontSize: "2.05rem", marginBottom: "0.35rem" }}>
              {awayTeam?.name ?? "Away"} at {homeTeam?.name ?? "Home"}
            </h1>
            <p style={{ color: "var(--text-muted)", maxWidth: "720px" }}>
              {isFinal
                ? "Final score and tagged highlights for this league game."
                : "Game details are live. Highlights and film links can be added after the game."}
            </p>
          </div>

          <div style={detailSummaryStyle}>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.4rem" }}>
              Game State
            </div>
            <div style={{ fontSize: "1.45rem", fontWeight: 700 }}>
              {isFinal
                ? `${game.away_score} - ${game.home_score} final`
                : `${formatGameDate(game.date)} at ${formatGameTime(game.date)}`}
            </div>
            <div style={{ marginTop: "0.5rem", fontSize: "0.95rem", color: "var(--accent-light)" }}>
              {game.is_playoff ? "Playoff game" : "Regular season"}
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
          <div>
            <h2 style={{ fontSize: "1.8rem" }}>Highlights</h2>
            <p style={{ color: "var(--text-muted)", marginTop: "0.25rem" }}>
              Captains can tag clips from uploaded film once they are available.
            </p>
          </div>
          <div style={detailBadgeStyle}>
            {clips.length} clip{clips.length === 1 ? "" : "s"} mapped
          </div>
        </div>

        {clips.length ? (
          <div style={{ display: "grid", gap: "1rem" }}>
            {clips.map((clip) => (
              <article
                key={clip.id}
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
                      Clip {clip.timestamp_seconds !== null ? `• ${formatTimestamp(clip.timestamp_seconds)}` : ""}
                    </div>
                    <h3 style={{ fontSize: "1.2rem", marginTop: "0.25rem" }}>
                      {clip.description || "Tagged clip"}
                    </h3>
                  </div>
                  <a href={clip.url} target="_blank" rel="noreferrer" style={clipChipStyle}>
                    Open clip
                  </a>
                </div>

                <div style={{ color: "var(--text-muted)" }}>
                  Tagged player: {clip.players?.[0]?.name || "Unassigned"}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div
            style={{
              padding: "1.2rem",
              borderRadius: "18px",
              border: "1px dashed var(--line)",
              color: "var(--text-muted)",
            }}
          >
            No highlight clips have been added for this game yet.
          </div>
        )}
      </div>
    </main>
  );
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

function resolveRinkLabel(homeTeam?: TeamRow, awayTeam?: TeamRow) {
  const names = `${homeTeam?.name ?? ""} ${awayTeam?.name ?? ""}`.toLowerCase();

  if (names.includes("north")) {
    return "North Rink";
  }

  if (names.includes("south")) {
    return "South Rink";
  }

  return "Main Rink";
}

function formatTimestamp(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

const detailSummaryStyle: CSSProperties = {
  minWidth: "220px",
  padding: "1rem 1.1rem",
  borderRadius: "16px",
  background: "var(--surface-light)",
  border: "1px solid var(--line)",
};

const detailBadgeStyle: CSSProperties = {
  borderRadius: "999px",
  border: "1px solid rgba(251, 191, 36, 0.28)",
  background: "rgba(251, 191, 36, 0.12)",
  color: "#fde68a",
  padding: "0.45rem 0.85rem",
  fontSize: "0.85rem",
};

const clipChipStyle: CSSProperties = {
  padding: "0.55rem 0.8rem",
  borderRadius: "14px",
  background: "var(--surface-light)",
  border: "1px solid var(--line)",
  fontSize: "0.9rem",
  color: "var(--text)",
};
