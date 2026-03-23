"use client";

import Link from "next/link";

interface Game {
  id: string;
  opponent: string;
  date: string;
  final_score?: string;
}

export default function FilmRoomPage() {
  // TEMP MOCK DATA — replace with Supabase later
  const games: Game[] = [
    { id: "1", opponent: "Wolves", date: "Feb 12", final_score: "4–3 W" },
    { id: "2", opponent: "Falcons", date: "Feb 19", final_score: "2–5 L" },
    { id: "3", opponent: "Raptors", date: "Feb 26", final_score: "3–3 T" },
  ];

  return (
    <div
      style={{
        padding: "1rem",
        background: "#000",
        color: "white",
        minHeight: "100vh",
      }}
    >
      <h2 style={{ fontSize: "1.4rem", marginBottom: "1rem" }}>Film Room</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {games.map((game) => (
          <div
            key={game.id}
            style={{
              background: "#111",
              padding: "1rem",
              borderRadius: 10,
              border: "1px solid #222",
            }}
          >
            <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>
              vs {game.opponent}
            </div>
            <div style={{ opacity: 0.7, marginBottom: "0.5rem" }}>
              {game.date} • {game.final_score}
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <Link
                href={`/dashboard/film/${game.id}`}
                style={{
                  flex: 1,
                  background: "#12937f",
                  padding: "0.5rem",
                  borderRadius: 6,
                  textAlign: "center",
                  fontWeight: 600,
                }}
              >
                Watch Game
              </Link>

              <Link
                href={`/dashboard/film/${game.id}?view=highlights`}
                style={{
                  flex: 1,
                  background: "#1A1A1A",
                  padding: "0.5rem",
                  borderRadius: 6,
                  border: "1px solid #333",
                  textAlign: "center",
                  fontWeight: 600,
                }}
              >
                Highlights
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
