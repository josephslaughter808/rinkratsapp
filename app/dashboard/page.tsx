"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";


// TEMP MOCK DATA — replace with Supabase later
const LEAGUES: Record<string, string> = {
  "Desert Storm": "Rink Rats",
  "Ratt Damon": "Rink Rats",
  "Platypucks": "Rink Rats",
  "Rizzo": "Rink Rats",
  "Bungalators": "Rink Rats",
  "Mudsquatch": "Rink Rats",
  "Pink FlaRINKos": "Rink Rats",
  "PIRATES of the Caribbean": "Rink Rats",
  RB: "Rink Rats",
  GladiRATors: "Rink Rats",

  Bison: "Peaks",
  Mustangs: "Peaks",
  Peaks: "Peaks",
  Yeti: "Peaks",

  Jesters: "MIC D",
};

const mockGames = [
  {
    id: 1,
    week: 7,
    date: "2026-03-15",
    teamA: "Desert Storm",
    teamB: "Ratt Damon",
    scoreA: 4,
    scoreB: 2,
    status: "final",
    offensiveStar: "Ethan Carter",
    defensiveStar: "Liam Brooks",
  },
  {
    id: 2,
    week: 7,
    date: "2026-03-15",
    teamA: "Platypucks",
    teamB: "Rizzo",
    scoreA: 3,
    scoreB: 1,
    status: "final",
  },
  {
    id: 3,
    week: 7,
    date: "2026-03-15",
    teamA: "Bungalators",
    teamB: "Mudsquatch",
    scoreA: null,
    scoreB: null,
    status: "scheduled",
  },
  {
    id: 4,
    week: 7,
    date: "2026-03-15",
    teamA: "Pink FlaRINKos",
    teamB: "PIRATES of the Caribbean",
    scoreA: 5,
    scoreB: 5,
    status: "final",
  },
  {
    id: 5,
    week: 7,
    date: "2026-03-15",
    teamA: "RB",
    teamB: "GladiRATors",
    scoreA: 1,
    scoreB: 4,
    status: "final",
  },
  {
    id: 6,
    week: 7,
    date: "2026-03-15",
    teamA: "Bison",
    teamB: "Mustangs",
    scoreA: 2,
    scoreB: 3,
    status: "final",
  },
  {
    id: 7,
    week: 7,
    date: "2026-03-15",
    teamA: "Peaks",
    teamB: "Yeti",
    scoreA: 1,
    scoreB: 1,
    status: "final",
  },
  {
    id: 8,
    week: 7,
    date: "2026-03-15",
    teamA: "Jesters",
    teamB: "Some MIC D Team",
    scoreA: 4,
    scoreB: 4,
    status: "final",
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // TEMP — until global state is wired in
  const [selectedTeam] = useState("Desert Storm");

  const [week, setWeek] = useState(7);

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        router.push("/auth/login");
        return;
      }

      setUserEmail(data.session?.user?.email ?? null);
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

  const firstName = userEmail?.split("@")[0] || "Player";
  const selectedLeague = LEAGUES[selectedTeam];

  const leagueGames = mockGames.filter(
    (g) => LEAGUES[g.teamA] === selectedLeague
  );
  const weekGames = leagueGames.filter((g) => g.week === week);

  const yourGame = weekGames.find(
    (g) => g.teamA === selectedTeam || g.teamB === selectedTeam
  );

  const otherGames = weekGames.filter((g) => g.id !== yourGame?.id);

  const getWinner = (game: any) => {
    if (!game || game.status !== "final") return null;
    if (game.scoreA > game.scoreB) return "A";
    if (game.scoreB > game.scoreA) return "B";
    return null;
  };

  const offensivePlayer = yourGame
    ? {
        name: yourGame.offensiveStar || null,
        number: 13,
        position: "F",
        points: 3,
        goals: 1,
        assists: 2,
        plusMinus: 1,
      }
    : null;

  const defensivePlayer = yourGame
    ? {
        name: yourGame.defensiveStar || null,
        number: 30,
        position: "G",
        savePct: ".920",
        goalsAgainst: 2,
        shotsAgainst: 25,
      }
    : null;

  return (
    <main
      style={{
        padding: "1rem",
        color: "white",
        background: "#0B0D17",
        minHeight: "100vh",
      }}
    >
      

      {/* WEEK NAVIGATION */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
          alignItems: "center",
        }}
      >
        <button onClick={() => setWeek((w) => w - 1)} style={navButtonStyle}>
          ←
        </button>

        <h2 style={{ fontSize: "1.5rem" }}>Week {week}</h2>

        <button onClick={() => setWeek((w) => w + 1)} style={navButtonStyle}>
          →
        </button>
      </div>

      {/* YOUR GAME */}
      {yourGame ? (
        <section
          style={{
            background: "#F3F4F6",
            color: "#111",
            padding: "1rem",
            borderRadius: "12px",
            marginBottom: "1.5rem",
          }}
        >
          <h2 style={{ marginBottom: "0.75rem", color: "#0B0D17" }}>
            Your Game This Week
          </h2>

          <GameCard game={yourGame} getWinner={getWinner} />
        </section>
      ) : (
        <p>No game scheduled for your team this week.</p>
      )}

      {/* STARS OF THE GAME */}
      {yourGame && (
        <section style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ marginBottom: "0.75rem" }}>Stars of the Game</h2>

          <div
            style={{
              display: "flex",
              borderRadius: "12px",
              overflow: "hidden",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            {/* Offensive Star */}
            <div style={{ flex: 1, padding: "1rem" }}>
              <h3 style={{ marginBottom: "0.5rem" }}>Offensive Star</h3>
              <StarCard player={offensivePlayer} />
            </div>

            {/* Divider */}
            <div
              style={{
                width: "1px",
                background: "rgba(255, 255, 255, 0.2)",
              }}
            />

            {/* Defensive Star */}
            <div style={{ flex: 1, padding: "1rem" }}>
              <h3 style={{ marginBottom: "0.5rem" }}>Defensive Star</h3>
              <StarCard player={defensivePlayer} />
            </div>
          </div>
        </section>
      )}

      {/* OTHER GAMES */}
      <section>
        <h2 style={{ marginBottom: "0.75rem" }}>Other Games This Week</h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {otherGames.map((game) => (
            <GameCard key={game.id} game={game} getWinner={getWinner} />
          ))}
        </div>
      </section>
    </main>
  );
}

/* COMPONENTS */

function GameCard({ game, getWinner }: any) {
  const winner = getWinner(game);

  const teamAStyle = {
    opacity: winner === "B" ? 0.4 : 1,
    fontWeight: winner === "A" ? 700 : 500,
    width: "33%",
  };

  const teamBStyle = {
    opacity: winner === "A" ? 0.4 : 1,
    fontWeight: winner === "B" ? 700 : 500,
    width: "33%",
  };

  return (
    <div
      style={{
        background: "#F3F4F6",
        padding: "1rem",
        borderRadius: "12px",
        color: "#111",
      }}
    >
      {/* TEAMS + SCORES */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        {/* TEAM A */}
        <div style={teamAStyle}>
          <div
            style={{
              width: 60,
              height: 60,
              background: "#D1D5DB",
              borderRadius: "50%",
              margin: "0 auto",
            }}
          />
          <p style={{ marginTop: "0.5rem" }}>{game.teamA}</p>
          {game.status === "final" && (
            <p style={{ fontSize: "1.8rem", marginTop: "0.25rem" }}>
              {game.scoreA}
            </p>
          )}
        </div>

        {/* VS */}
        <div
          style={{
            width: "34%",
            fontSize: "1.2rem",
            fontWeight: 600,
          }}
        >
          VS
        </div>

        {/* TEAM B */}
        <div style={teamBStyle}>
          <div
            style={{
              width: 60,
              height: 60,
              background: "#D1D5DB",
              borderRadius: "50%",
              margin: "0 auto",
            }}
          />
          <p style={{ marginTop: "0.5rem" }}>{game.teamB}</p>
          {game.status === "final" && (
            <p style={{ fontSize: "1.8rem", marginTop: "0.25rem" }}>
              {game.scoreB}
            </p>
          )}
        </div>
      </div>

      {/* STATUS */}
      <div style={{ textAlign: "center", marginTop: "0.75rem" }}>
        {game.status === "final" && (
          <p style={{ fontSize: "1rem", fontWeight: 600, color: "#1F2937" }}>
            {game.scoreA === game.scoreB ? "Final/OT" : "Final"}
          </p>
        )}
        <p style={{ fontSize: "0.8rem", color: "#6B7280" }}>{game.date}</p>
      </div>
    </div>
  );
}

function StarCard({ player }: any) {
  if (!player) return null;

  const isGoalie = player?.position === "G";

  const skaterStats = [
    { label: "Points", value: player?.points ?? "--" },
    { label: "Goals", value: player?.goals ?? "--" },
    { label: "Assists", value: player?.assists ?? "--" },
    { label: "+/-", value: player?.plusMinus ?? "--" },
  ];

  const goalieStats = [
    { label: "SV%", value: player?.savePct ?? "--" },
    { label: "GA", value: player?.goalsAgainst ?? "--" },
    { label: "Shots", value: player?.shotsAgainst ?? "--" },
  ];

  const statsToShow = isGoalie ? goalieStats : skaterStats;

  return (
    <div
      style={{
        background: "#F3F4F6",
        padding: "1rem",
        borderRadius: "12px",
        color: "#111",
        textAlign: "center",
      }}
    >
      {/* Profile Picture */}
      <div
        style={{
          width: 70,
          height: 70,
          background: "#D1D5DB",
          borderRadius: "50%",
          margin: "0 auto",
        }}
      />

      {/* Name + Number */}
      <p style={{ marginTop: "0.75rem", fontWeight: 700 }}>
        {player?.name || "TBD"} {player?.number ? `#${player.number}` : ""}
      </p>

      {/* Position */}
      <p
        style={{
          marginTop: "0.15rem",
          fontSize: "0.8rem",
          color: "#6B7280",
          fontWeight: 300,
        }}
      >
        {player?.position || ""}
      </p>

      {/* Stats Row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "1rem",
        }}
      >
        {statsToShow.map((stat, idx) => (
          <div key={idx} style={{ flex: 1 }}>
            <p style={{ fontSize: "1.4rem", fontWeight: 700 }}>
              {stat.value}
            </p>
            <p style={{ fontSize: "0.75rem", color: "#6B7280" }}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

const navButtonStyle = {
  background: "none",
  border: "none",
  color: "white",
  fontSize: "1.5rem",
  cursor: "pointer",
};
