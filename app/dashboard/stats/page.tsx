"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function StatsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);

  const [personalStats, setPersonalStats] = useState<any>(null);
  const [teamStats, setTeamStats] = useState<any[]>([]);
  const [leagueStats, setLeagueStats] = useState<any[]>([]);

  // Sorting state
  const [teamSortField, setTeamSortField] = useState("points");
  const [teamSortDir, setTeamSortDir] = useState<"asc" | "desc">("desc");

  const [leagueSortField, setLeagueSortField] = useState("points");
  const [leagueSortDir, setLeagueSortDir] = useState<"asc" | "desc">("desc");

  const sortData = (data: any[], field: string, dir: "asc" | "desc") => {
    return [...data].sort((a, b) => {
      if (dir === "desc") return b[field] - a[field];
      return a[field] - b[field];
    });
  };

  useEffect(() => {
    async function loadData() {
      // 1. Get session
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;

      if (!session) {
        router.push("/auth/login");
        return;
      }

      const email = session.user.email!;
      setUserEmail(email);

      // 2. Find player row for this user
      const { data: playerRow } = await supabase
        .from("players")
        .select("id")
        .eq("email", email)
        .single();

      if (!playerRow) {
        console.error("No player found for this user");
        setLoading(false);
        return;
      }

      setPlayerId(playerRow.id);

      // 3. Find team for this player
      const { data: teamRow } = await supabase
        .from("player_teams")
        .select("team_id")
        .eq("player_id", playerRow.id)
        .single();

      if (!teamRow) {
        console.error("No team found for this player");
        setLoading(false);
        return;
      }

      setTeamId(teamRow.team_id);

      // 4. Load personal stats
      const { data: personal } = await supabase
        .from("player_stats")
        .select("points, goals, assists, pim")
        .eq("player_id", playerRow.id)
        .single();

      setPersonalStats(personal || { points: 0, goals: 0, assists: 0, pim: 0 });

      // 5. Load team stats
      const { data: teamPlayers } = await supabase
        .from("player_stats")
        .select("player_id, points, goals, assists, pim, players(name)")
        .eq("team_id", teamRow.team_id);

      const formattedTeamStats =
        teamPlayers?.map((p) => ({
          name: p.players.name,
          points: p.points,
          goals: p.goals,
          assists: p.assists,
          pim: p.pim,
        })) || [];

      setTeamStats(formattedTeamStats);

      // 6. Load league stats
      const { data: leaguePlayers } = await supabase
        .from("player_stats")
        .select("player_id, points, goals, assists, pim, players(name)");

      const formattedLeagueStats =
        leaguePlayers?.map((p) => ({
          name: p.players.name,
          points: p.points,
          goals: p.goals,
          assists: p.assists,
          pim: p.pim,
        })) || [];

      setLeagueStats(formattedLeagueStats);

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

  const statColumns = [
    { key: "points", label: "Points" },
    { key: "goals", label: "Goals" },
    { key: "assists", label: "Assists" },
    { key: "pim", label: "PIM" },
  ];

  return (
    <main style={{ padding: "2rem", textAlign: "center" }}>
      {/* Profile Picture */}
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

      {/* Name + Number */}
      <h1 style={{ fontSize: "1.6rem", fontWeight: 700 }}>
        {userEmail?.split("@")[0]}
      </h1>
      <p className="opacity-70" style={{ marginTop: "0.25rem" }}>
        #{playerId?.slice(-2) || "00"}
      </p>

      {/* Personal Stats */}
      <section style={{ marginTop: "2rem" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "1rem",
          }}
        >
          {statColumns.map((stat) => (
            <div
              key={stat.key}
              style={{
                background: "var(--surface)",
                padding: "1rem",
                borderRadius: "var(--radius)",
              }}
            >
              <div style={{ fontSize: "1.6rem", fontWeight: 700 }}>
                {personalStats?.[stat.key] ?? 0}
              </div>
              <div className="opacity-70" style={{ marginTop: "0.25rem" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TEAM STATS */}
      <section style={{ marginTop: "3rem", textAlign: "left" }}>
        <h2 style={{ fontSize: "1.3rem", fontWeight: 700 }}>Team Stats</h2>

        {/* Sortable Header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr repeat(4, 1fr)",
            marginTop: "1rem",
            padding: "0.5rem 0",
            color: "#9CA3AF",
            fontSize: "0.8rem",
            fontWeight: 600,
            textAlign: "center",
          }}
        >
          <div></div>
          {statColumns.map((col) => {
            const active = teamSortField === col.key;
            const arrow = active ? (teamSortDir === "desc" ? "↓" : "↑") : "";

            return (
              <div
                key={col.key}
                onClick={() => {
                  if (active) {
                    setTeamSortDir(teamSortDir === "desc" ? "asc" : "desc");
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
                }}
              >
                {col.label}
                {arrow && <span>{arrow}</span>}
              </div>
            );
          })}
        </div>

        {/* Team Rows */}
        {sortData(teamStats, teamSortField, teamSortDir).map((player) => (
          <div
            key={player.name}
            style={{
              background: "var(--surface)",
              padding: "1rem",
              borderRadius: "var(--radius)",
              marginBottom: "0.75rem",
              display: "grid",
              gridTemplateColumns: "2fr repeat(4, 1fr)",
              gap: "0.5rem",
              alignItems: "center",
            }}
          >
            <div>{player.name}</div>
            <div>{player.points}</div>
            <div>{player.goals}</div>
            <div>{player.assists}</div>
            <div>{player.pim}</div>
          </div>
        ))}
      </section>

      {/* LEAGUE STATS */}
      <section style={{ marginTop: "3rem", textAlign: "left" }}>
        <h2 style={{ fontSize: "1.3rem", fontWeight: 700 }}>League Stats</h2>

        {/* Sortable Header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr repeat(4, 1fr)",
            marginTop: "1rem",
            padding: "0.5rem 0",
            color: "#9CA3AF",
            fontSize: "0.8rem",
            fontWeight: 600,
            textAlign: "center",
          }}
        >
          <div></div>
          {statColumns.map((col) => {
            const active = leagueSortField === col.key;
            const arrow = active ? (leagueSortDir === "desc" ? "↓" : "↑") : "";

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
                }}
              >
                {col.label}
                {arrow && <span>{arrow}</span>}
              </div>
            );
          })}
        </div>

        {/* League Rows */}
        {sortData(leagueStats, leagueSortField, leagueSortDir).map(
          (player) => (
            <div
              key={player.name}
              style={{
                background: "var(--surface)",
                padding: "1rem",
                borderRadius: "var(--radius)",
                marginBottom: "0.75rem",
                display: "grid",
                gridTemplateColumns: "2fr repeat(4, 1fr)",
                gap: "0.5rem",
                alignItems: "center",
              }}
            >
              <div>{player.name}</div>
              <div>{player.points}</div>
              <div>{player.goals}</div>
              <div>{player.assists}</div>
              <div>{player.pim}</div>
            </div>
          )
        )}
      </section>
    </main>
  );
}
