"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useRouter } from "next/navigation";

function positionColor(pos: string) {
  if (pos === "C") return "#FFD700";
  if (pos === "LW" || pos === "RW") return "#3B82F6";
  if (pos === "LD" || pos === "RD") return "#EF4444";
  if (pos === "G") return "#FFFFFF";
  return "#9CA3AF";
}

type StatRow = {
  player_id: string;
  name: string;
  points: number;
  goals: number;
  assists: number;
  pim: number;
};

export default function StatsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);

  const [playerNumber, setPlayerNumber] = useState<number | null>(null);
  const [playerPosition, setPlayerPosition] = useState<string | null>(null);
  const [profilePic, setProfilePic] = useState<string | null>(null); // ⭐ NEW

  const [personalStats, setPersonalStats] = useState({
    points: 0,
    goals: 0,
    assists: 0,
    pim: 0,
  });

  const [teamStats, setTeamStats] = useState<StatRow[]>([]);
  const [leagueStats, setLeagueStats] = useState<StatRow[]>([]);

  const [teamSortField, setTeamSortField] = useState<keyof StatRow>("points");
  const [teamSortDir, setTeamSortDir] = useState<"asc" | "desc">("desc");

  const [leagueSortField, setLeagueSortField] =
    useState<keyof StatRow>("points");
  const [leagueSortDir, setLeagueSortDir] = useState<"asc" | "desc">("desc");

  const statColumns = [
    { key: "points" as const, label: "Points" },
    { key: "goals" as const, label: "Goals" },
    { key: "assists" as const, label: "Assists" },
    { key: "pim" as const, label: "PIM" },
  ];

  const sortData = (
    data: StatRow[],
    field: keyof StatRow,
    dir: "asc" | "desc"
  ) => {
    return [...data].sort((a, b) => {
      const av = a[field] as number;
      const bv = b[field] as number;
      return dir === "desc" ? bv - av : av - bv;
    });
  };

  useEffect(() => {
    async function loadData() {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;

      if (!session) {
        router.push("/auth/login");
        return;
      }

      setUserEmail(session.user.email!);

      // 1. Find player + team
      const { data: ptRow } = await supabase
        .from("player_teams")
        .select("player_id, team_id")
        .eq("user_id", session.user.id)
        .single();

      if (!ptRow) {
        setLoading(false);
        return;
      }

      setPlayerId(ptRow.player_id);
      setTeamId(ptRow.team_id);

      // 2. Player info (⭐ UPDATED to include profile_pic_url)
      const { data: playerInfo } = await supabase
        .from("players")
        .select("number, position, profile_pic_url")
        .eq("id", ptRow.player_id)
        .single();

      if (playerInfo) {
        setPlayerNumber(playerInfo.number);
        setPlayerPosition(playerInfo.position);
        setProfilePic(playerInfo.profile_pic_url); // ⭐ NEW
      }

      // 3. Personal stats
      const { data: personal } = await supabase
        .from("season_stats")
        .select("points, goals, assists, pim")
        .eq("player_id", ptRow.player_id)
        .eq("season", "2026a")
        .maybeSingle();

      if (personal) {
        setPersonalStats(personal);
      }

      // 4. Team stats
      const { data: teamPlayers } = await supabase
        .from("season_stats")
        .select("player_id, points, goals, assists, pim, players(name)")
        .eq("team_id", ptRow.team_id)
        .eq("season", "2026a");

      setTeamStats(
        teamPlayers?.map((p: any) => ({
          player_id: p.player_id,
          name: p.players.name,
          points: p.points,
          goals: p.goals,
          assists: p.assists,
          pim: p.pim,
        })) || []
      );

      // 5. League stats
      const { data: leaguePlayers } = await supabase
        .from("season_stats")
        .select("player_id, points, goals, assists, pim, players(name)")
        .eq("season", "2026a");

      setLeagueStats(
        leaguePlayers?.map((p: any) => ({
          player_id: p.player_id,
          name: p.players.name,
          points: p.points,
          goals: p.goals,
          assists: p.assists,
          pim: p.pim,
        })) || []
      );

      setLoading(false);
    }

    loadData();
  }, [router]);

  if (loading) {
    return (
      <main className="center-screen">
        <p>Loading...</p>
      </main>
    );
  }

  if (!playerId) {
    return (
      <main style={{ padding: "2rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 700 }}>Stats</h1>
        <p style={{ marginTop: "1rem", opacity: 0.7 }}>
          No player profile found for this account yet.
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
      {/* ⭐ REAL PROFILE PICTURE (replaces placeholder) */}
      <img
        src={profilePic || "https://via.placeholder.com/120?text=?"}
        alt="Profile"
        style={{
          width: "120px",
          height: "120px",
          borderRadius: "50%",
          objectFit: "cover",
          margin: "0 auto",
          marginBottom: "1rem",
          border: "3px solid var(--accent-light)",
          display: "block",
        }}
      />

      {/* Name + Number + Position Pill */}
      <h1
        style={{
          fontSize: "1.6rem",
          fontWeight: 700,
          textAlign: "center",
        }}
      >
        {userEmail?.split("@")[0]}
      </h1>
      <p
        className="opacity-70"
        style={{ marginTop: "0.25rem", textAlign: "center" }}
      >
        #{playerNumber ?? "00"}
        {playerPosition && (
          <span
            style={{
              marginLeft: "8px",
              padding: "2px 10px",
              borderRadius: "999px",
              border: `1px solid ${positionColor(playerPosition)}`,
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
            {playerPosition}
          </span>
        )}
      </p>

      {/* Everything below this point is unchanged */}
      {/* PERSONAL STATS */}
      <section style={{ marginTop: "2rem" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: "0.75rem",
          }}
        >
          {statColumns.map((stat) => (
            <div
              key={stat.key}
              style={{
                background:
                  "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,64,175,0.9))",
                padding: "0.9rem 0.75rem",
                borderRadius: "var(--radius)",
                border: "1px solid rgba(148,163,184,0.4)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "1.6rem",
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                {personalStats[stat.key]}
              </div>
              <div
                className="opacity-70"
                style={{
                  marginTop: "0.25rem",
                  fontSize: "0.8rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TEAM STATS */}
      <section style={{ marginTop: "3rem" }}>
        <h2
          style={{
            fontSize: "1.3rem",
            fontWeight: 700,
            marginBottom: "0.75rem",
            textAlign: "left",
          }}
        >
          Team Stats
        </h2>

        <div
          style={{
            borderRadius: "var(--radius)",
            border: "1px solid var(--border)",
            background: "var(--surface)",
          }}
        >
          {/* Sticky Header */}
          <div
            style={{
              position: "sticky",
              top: "79px",
              zIndex: 10,
              background: "var(--surface)",
              display: "grid",
              gridTemplateColumns: "2fr repeat(4, minmax(0, 1fr))",
              padding: "0.5rem 0.75rem",
              color: "#9CA3AF",
              fontSize: "0.8rem",
              fontWeight: 600,
              textAlign: "center",
              boxShadow: "0 2px 4px rgba(0,0,0,0.35)",
            }}
          >
            <div style={{ textAlign: "left" }}>Name</div>
            {statColumns.map((col) => {
              const active = teamSortField === col.key;
              const arrow = active
                ? teamSortDir === "desc"
                  ? "↓"
                  : "↑"
                : "";

              return (
                <div
                  key={col.key}
                  onClick={() => {
                    if (active) {
                      setTeamSortDir(
                        teamSortDir === "desc" ? "asc" : "desc"
                      );
                    } else {
                      setTeamSortField(col.key);
                      setTeamSortDir("desc");
                    }
                  }}
                  style={{
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "4px",
                    userSelect: "none",
                  }}
                >
                  {col.label}
                  {arrow && <span>{arrow}</span>}
                </div>
              );
            })}
          </div>

          {/* Rows */}
          {sortData(teamStats, teamSortField, teamSortDir).map((player) => {
            const isCurrent = player.player_id === playerId;
            return (
              <div
                key={player.player_id}
                onClick={() =>
                  router.push(`/dashboard/player/${player.player_id}`)
                }
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr repeat(4, minmax(0, 1fr))",
                  padding: "0.75rem",
                  alignItems: "center",
                  cursor: "pointer",
                  transition: "background 0.15s",
                  background: isCurrent
                    ? "rgba(37,99,235,0.18)"
                    : "transparent",
                  borderBottom: "1px solid rgba(31,41,55,0.9)",
                  fontWeight: isCurrent ? 600 : 400,
                  textAlign: "center",
                }}
              >
                <div style={{ textAlign: "left" }}>{player.name}</div>
                <div>{player.points}</div>
                <div>{player.goals}</div>
                <div>{player.assists}</div>
                <div>{player.pim}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* LEAGUE STATS */}
      <section style={{ marginTop: "3rem", marginBottom: "2rem" }}>
        <h2
          style={{
            fontSize: "1.3rem",
            fontWeight: 700,
            marginBottom: "0.75rem",
            textAlign: "left",
          }}
        >
          League Stats
        </h2>

        <div
          style={{
            borderRadius: "var(--radius)",
            border: "1px solid var(--border)",
            background: "var(--surface)",
          }}
        >
          {/* Sticky Header */}
          <div
            style={{
              position: "sticky",
              top: "79px",
              zIndex: 10,
              background: "var(--surface)",
              display: "grid",
              gridTemplateColumns: "2fr repeat(4, minmax(0, 1fr))",
              padding: "0.5rem 0.75rem",
              color: "#9CA3AF",
              fontSize: "0.8rem",
              fontWeight: 600,
              textAlign: "center",
              boxShadow: "0 2px 4px rgba(0,0,0,0.35)",
            }}
          >
            <div style={{ textAlign: "left" }}>Name</div>
            {statColumns.map((col) => {
              const active = leagueSortField === col.key;
              const arrow = active
                ? leagueSortDir === "desc"
                  ? "↓"
                  : "↑"
                : "";

              return (
                <div
                  key={col.key}
                  onClick={() => {
                    if (active) {
                      setLeagueSortDir(
                        leagueSortDir === "desc" ? "asc" : "desc"
                      );
                    } else {
                      setLeagueSortField(col.key);
                      setLeagueSortDir("desc");
                    }
                  }}
                  style={{
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "4px",
                    userSelect: "none",
                  }}
                >
                  {col.label}
                  {arrow && <span>{arrow}</span>}
                </div>
              );
            })}
          </div>

          {/* Rows */}
          {sortData(leagueStats, leagueSortField, leagueSortDir).map(
            (player) => {
              const isCurrent = player.player_id === playerId;
              return (
                <div
                  key={player.player_id}
                  onClick={() =>
                    router.push(`/dashboard/player/${player.player_id}`)
                  }
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr repeat(4, minmax(0, 1fr))",
                    padding: "0.75rem",
                    alignItems: "center",
                    cursor: "pointer",
                    transition: "background 0.15s",
                    background: isCurrent
                      ? "rgba(37,99,235,0.18)"
                      : "transparent",
                    borderBottom: "1px solid rgba(31,41,55,0.9)",
                    fontWeight: isCurrent ? 600 : 400,
                    textAlign: "center",
                  }}
                >
                  <div style={{ textAlign: "left" }}>{player.name}</div>
                  <div>{player.points}</div>
                  <div>{player.goals}</div>
                  <div>{player.assists}</div>
                  <div>{player.pim}</div>
                </div>
              );
            }
          )}
        </div>
      </section>
    </main>
  );
}
