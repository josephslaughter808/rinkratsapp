"use client";

import { useState } from "react";

type Player = {
  id: number;
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

const mockPlayers: Player[] = [
  {
    id: 1,
    name: "Connor McDavid",
    number: 97,
    position: "C",
    level: "E",
    handedness: "L",
    points_last_season: 123,
    plus_minus_last_season: 22,
    profile: "https://via.placeholder.com/40",
  },
  {
    id: 2,
    name: "Auston Matthews",
    number: 34,
    position: "C",
    level: "E",
    handedness: "R",
    points_last_season: 107,
    plus_minus_last_season: 14,
    profile: "https://via.placeholder.com/40",
  },
  {
    id: 3,
    name: "Jake Thompson",
    number: 12,
    position: "RD",
    level: "R",
    handedness: "L",
    points_last_season: null,
    plus_minus_last_season: null,
    profile: "https://via.placeholder.com/40",
  },
];

const positionColors: { [key: string]: { bg: string; text: string } } = {
  C: { bg: "#FACC15", text: "#000000" }, // Yellow
  LW: { bg: "#3B82F6", text: "#FFFFFF" }, // Blue
  RW: { bg: "#3B82F6", text: "#FFFFFF" },
  LD: { bg: "#EF4444", text: "#FFFFFF" }, // Red
  RD: { bg: "#EF4444", text: "#FFFFFF" },
  G: { bg: "#FFFFFF", text: "#111827" }, // White
};

function PositionPill({ pos }: { pos: string }) {
  const c = positionColors[pos] || { bg: "#4B5563", text: "#FFFFFF" };
  return (
    <span
      style={{
        background: c.bg,
        color: c.text,
        padding: "0.15rem 0.55rem",
        borderRadius: "9999px",
        fontSize: "0.7rem",
        fontWeight: 600,
      }}
    >
      {pos}
    </span>
  );
}

export default function PlayersTab() {
  const [queued, setQueued] = useState<number[]>([]);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const [filterPosition, setFilterPosition] = useState("All");
  const [filterHand, setFilterHand] = useState("All");

  const toggleQueue = (id: number) => {
    setQueued((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const arrow = (field: SortField) => {
    if (sortField !== field) return "↕";
    return sortDirection === "asc" ? "↑" : "↓";
  };

  const filteredPlayers = mockPlayers.filter((p) => {
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
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem" }}>
        <select
          value={filterPosition}
          onChange={(e) => setFilterPosition(e.target.value)}
          style={{
            background: "transparent",
            color: "#93C5FD",
            border: "1px solid #1E3A8A",
            padding: "0.35rem 0.9rem",
            borderRadius: "9999px",
            fontSize: "0.8rem",
            cursor: "pointer",
            appearance: "none",
          }}
        >
          <option style={{ background: "#111" }}>All</option>
          <option style={{ background: "#111" }}>C</option>
          <option style={{ background: "#111" }}>LW</option>
          <option style={{ background: "#111" }}>RW</option>
          <option style={{ background: "#111" }}>LD</option>
          <option style={{ background: "#111" }}>RD</option>
          <option style={{ background: "#111" }}>G</option>
        </select>

        <select
          value={filterHand}
          onChange={(e) => setFilterHand(e.target.value)}
          style={{
            background: "transparent",
            color: "#93C5FD",
            border: "1px solid #1E3A8A",
            padding: "0.35rem 0.9rem",
            borderRadius: "9999px",
            fontSize: "0.8rem",
            cursor: "pointer",
            appearance: "none",
          }}
        >
          <option style={{ background: "#111" }}>All</option>
          <option style={{ background: "#111" }}>L</option>
          <option style={{ background: "#111" }}>R</option>
        </select>
      </div>

      {/* HEADER ROW */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: gridTemplate,
          padding: "0.5rem 1rem",
          fontSize: "0.75rem",
          opacity: 0.7,
          borderBottom: "1px solid #1A1A1A",
          marginBottom: "0.5rem",
          userSelect: "none",
          columnGap: "0.25rem",
        }}
      >
        <div></div>
        <div onClick={() => handleSort("name")} style={{ cursor: "pointer" }}>
          Name {arrow("name")}
        </div>
        <div>Pos</div>
        <div onClick={() => handleSort("level")} style={{ cursor: "pointer" }}>
          Lvl {arrow("level")}
        </div>
        <div>Hand</div>
        <div onClick={() => handleSort("points")} style={{ cursor: "pointer" }}>
          PTS {arrow("points")}
        </div>
        <div
          onClick={() => handleSort("plusminus")}
          style={{ cursor: "pointer" }}
        >
          +/- {arrow("plusminus")}
        </div>
        <div style={{ textAlign: "center" }}>Queue</div>
      </div>

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

            <div>
              <PositionPill pos={p.position} />
            </div>

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
