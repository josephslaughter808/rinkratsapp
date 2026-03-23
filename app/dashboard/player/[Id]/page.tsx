"use client";

import { useEffect, useState } from "react";
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

export default function PlayerPage() {
  const params = useParams();
  const id = params?.id as string | undefined;

  const [loading, setLoading] = useState(true);
  const [player, setPlayer] = useState<Player | null>(null);
  const [seasonStats, setSeasonStats] = useState<SeasonStats | null>(null);
  const [gameStats, setGameStats] = useState<GameStat[]>([]);

  useEffect(() => {
    if (!id) {
      console.error("No player id in route params");
      setLoading(false);
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

      // 3. Game-by-game stats (simple, no joins)
      const { data: games, error: gamesErr } = await supabase
        .from("game_stats")
        .select("id, game_id, goals, assists, pim, points")
        .eq("player_id", id)
        .order("id", { ascending: false });

      if (gamesErr) {
        console.error("GAME STATS ERROR:", gamesErr);
        setGameStats([]);
      } else {
        setGameStats((games as GameStat[]) || []);
      }

      setLoading(false);
    }

    load();
  }, [id]);

  if (loading) {
    return (
      <main className="center-screen">
        <p>Loading...</p>
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
                {seasonStats?.[stat.key] ?? 0}
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

      {/* GAME CARDS */}
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
            {/* TOP ROW: SCORE + DATE (placeholder for now) */}
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

            {/* HIGHLIGHTS (placeholder) */}
            <div style={{ opacity: 0.7, fontSize: "0.85rem" }}>
              Highlights: (coming soon)
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
