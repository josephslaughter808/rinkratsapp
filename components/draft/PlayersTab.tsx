"use client";

import { useEffect, useState } from "react";

type Player = {
  id: string;
  name: string;
  number: number;
  position: string;
  level: string;
  handedness: string;
  points_last_season: number | null;
  plus_minus_last_season: number | null;
  profile: string;
};

type SortField = "name" | "level" | "points" | "plusminus" | null;
type SortDirection = "asc" | "desc";

export default function PlayersTab({
  draftId,
  userId,
}: {
  draftId: string;
  userId: string;
}) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [queued, setQueued] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const [filterPosition, setFilterPosition] = useState("All");
  const [filterHand, setFilterHand] = useState("All");

  // Load players + queue
  useEffect(() => {
    const load = async () => {
      const p = await fetch(`/api/draft/${draftId}/players`).then((r) =>
        r.json()
      );
      const q = await fetch(`/api/draft/${draftId}/queue`).then((r) =>
        r.json()
      );

      setPlayers(p);
      setQueued(q.map((x: any) => x.player_id));
    };

    load();
  }, [draftId]);

  // Add/remove queue
  const toggleQueue = async (playerId: string) => {
    const isQueued = queued.includes(playerId);

    if (isQueued) {
      await fetch(`/api/draft/${draftId}/queue/${playerId}`, {
        method: "DELETE",
      });
      setQueued((prev) => prev.filter((id) => id !== playerId));
    } else {
      await fetch(`/api/draft/${draftId}/queue`, {
        method: "POST",
        body: JSON.stringify({ playerId, userId }),
      });
      setQueued((prev) => [...prev, playerId]);
    }
  };

  // Sorting + filtering logic stays the same
  const filteredPlayers = players.filter((p) => {
    if (filterPosition !== "All" && p.position !== filterPosition) return false;
    if (filterHand !== "All" && p.handedness !== filterHand) return false;
    return true;
  });

  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    if (!sortField) return 0;

    let valA: any;
    let valB: any;

    switch (sortField) {
      case "name":
        valA = a.name;
        valB = b.name;
        break;
      case "level": {
        const order = ["E", "A", "B", "C", "D", "R"];
        valA = order.indexOf(a.level);
        valB = order.indexOf(b.level);
        break;
      }
      case "points":
        valA = a.points_last_season ?? -9999;
        valB = b.points_last_season ?? -9999;
        break;
      case "plusminus":
        valA = a.plus_minus_last_season ?? -9999;
        valB = b.plus_minus_last_season ?? -9999;
        break;
      default:
        return 0;
    }

    if (valA < valB) return sortDirection === "asc" ? -1 : 1;
    if (valA > valB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const gridTemplate =
    "0.4fr 1.6fr 0.35fr 0.35fr 0.35fr 0.45fr 0.35fr 0.3fr";

  return (
    <div style={{ padding: "1rem" }}>
      {/* FILTER BAR */}
      {/* ... your filter UI stays unchanged ... */}

      {/* HEADER ROW */}
      {/* ... your header UI stays unchanged ... */}

      {/* PLAYER ROWS */}
      {sortedPlayers.map((p, index) => {
        const isQueued = queued.includes(p.id);
        const rowBg = index % 2 === 0 ? "#141414" : "#1b1b1b";

        return (
          <div
            key={p.id}
            style={{
              display: "grid",
              gridTemplateColumns: gridTemplate,
              alignItems: "center",
              padding: "0.85rem 1rem",
              marginBottom: "0.45rem",
              background: rowBg,
              borderRadius: "6px",
              border: "1px solid #1A1A1A",
              columnGap: "0.25rem",
            }}
          >
            <img
              src={p.profile}
              alt={p.name}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />

            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "0.35rem",
              }}
            >
              <div
                style={{
                  fontSize: "1.05rem",
                  fontWeight: 700,
                  color: "#3B82F6",
                }}
              >
                {p.name}
              </div>
              <div style={{ fontSize: "0.85rem", opacity: 0.6 }}>
                #{p.number}
              </div>
            </div>

            <div>{p.position}</div>
            <div>{p.level}</div>
            <div>{p.handedness}</div>
            <div>{p.points_last_season ?? "N/A"}</div>
            <div>{p.plus_minus_last_season ?? "N/A"}</div>

            <div style={{ textAlign: "center" }}>
              <button
                onClick={() => toggleQueue(p.id)}
                style={{
                  padding: "0.3rem 0.65rem",
                  borderRadius: "9999px",
                  border: `1px solid ${isQueued ? "#1D4ED8" : "#1E3A8A"}`,
                  background: isQueued ? "#1D4ED8" : "transparent",
                  color: isQueued ? "#FFFFFF" : "#93C5FD",
                  fontSize: "0.7rem",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap",
                }}
              >
                {isQueued ? "Queued" : "Queue"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
