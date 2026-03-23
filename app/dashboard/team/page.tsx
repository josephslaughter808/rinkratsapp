"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function TeamPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [player, setPlayer] = useState<any>(null);
  const [team, setTeam] = useState<any>(null);
  const [roster, setRoster] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push("/auth/login");
        return;
      }

      setUser(data.session.user);

      // Load player profile
      const { data: playerData } = await supabase
        .from("players")
        .select("*")
        .eq("id", data.session.user.id)
        .single();

      setPlayer(playerData);

      if (!playerData.team_id) {
        setLoading(false);
        return;
      }

      // Load team
      const { data: teamData } = await supabase
        .from("teams")
        .select("*")
        .eq("id", playerData.team_id)
        .single();

      setTeam(teamData);

      // Load roster
      const { data: rosterData } = await supabase
        .from("players")
        .select("*")
        .eq("team_id", playerData.team_id);

      setRoster(rosterData ?? []);

      setLoading(false);
    }

    load();
  }, [router]);

  if (loading) {
    return (
      <main className="center-screen">
        <p>Loading...</p>
      </main>
    );
  }

  if (!player?.team_id) {
    return (
      <main style={{ padding: "2rem", textAlign: "center" }}>
        <h1>You are not on a team</h1>

        <button
          style={{
            marginTop: "1rem",
            width: "100%",
            padding: "0.75rem",
            borderRadius: "var(--radius)",
            background: "var(--accent)",
            color: "white",
            fontWeight: 600,
            border: "none",
          }}
          onClick={() => router.push("/dashboard/team/create")}
        >
          Create Team
        </button>

        <button
          style={{
            marginTop: "1rem",
            width: "100%",
            padding: "0.75rem",
            borderRadius: "var(--radius)",
            background: "var(--surface-light)",
            color: "white",
            fontWeight: 600,
            border: "1px solid var(--accent-light)",
          }}
          onClick={() => router.push("/dashboard/team/join")}
        >
          Join Team
        </button>
      </main>
    );
  }

  return (
    <main style={{ padding: "2rem" }}>
      <h1 style={{ fontSize: "1.6rem", fontWeight: 700 }}>
        {team.name}
      </h1>

      <p className="opacity-70" style={{ marginTop: "0.25rem" }}>
        Your role: {player.role}
      </p>

      <h2 style={{ marginTop: "2rem", fontSize: "1.3rem", fontWeight: 700 }}>
        Roster
      </h2>

      {roster.map((p) => (
        <div
          key={p.id}
          style={{
            background: "var(--surface)",
            padding: "1rem",
            borderRadius: "var(--radius)",
            marginTop: "0.75rem",
          }}
        >
          <strong>{p.name}</strong> — #{p.number} ({p.position})
        </div>
      ))}
    </main>
  );
}
