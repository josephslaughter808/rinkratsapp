"use client";

import { useState } from "react";
import DraftHeader from "@/components/draft/DraftHeader";
import PlayersTab from "@/components/draft/PlayersTab";
import QueueTab from "@/components/draft/QueueTab";
import BoardTab from "@/components/draft/BoardTab";
import RostersTab from "@/components/draft/RostersTab";
import DraftPickRail from "@/components/draft/DraftPickRail";

type DraftTab = "players" | "queue" | "board" | "rosters";

export default function DraftRoomPage() {
  const [activeTab, setActiveTab] = useState<DraftTab>("players");

  // TEMP MOCK DATA — replace with real API data later
  const teams = [
    { id: "1", name: "Team 1" },
    { id: "2", name: "Team 2" },
    { id: "3", name: "Team 3" },
  ];

  const picks = [
    { id: "p1", round: 1, overall: 1, team_id: "1", player_name: null },
    { id: "p2", round: 1, overall: 2, team_id: "2", player_name: null },
    { id: "p3", round: 1, overall: 3, team_id: "3", player_name: null },
    { id: "p4", round: 2, overall: 4, team_id: "1", player_name: null },
  ];

  const pickNumber = 1; // TEMP — will come from server logic later

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#000",
        color: "white",
      }}
    >
      {/* HEADER */}
      <DraftHeader
        currentTeam="Team 1"
        pickNumber={pickNumber}
        round={1}
        totalRounds={10}
        timeLeft={60}
        onExit={() => {
          alert("Exit draft clicked");
        }}
      />

      {/* PICK RAIL */}
      <DraftPickRail
        teams={teams}
        picks={picks}
        currentPickOverall={pickNumber}
      />

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {activeTab === "players" && <PlayersTab />}
        {activeTab === "queue" && <QueueTab />}
        {activeTab === "board" && <BoardTab />}
        {activeTab === "rosters" && <RostersTab />}
      </div>

      {/* BOTTOM NAV */}
      <nav
        style={{
          display: "flex",
          justifyContent: "space-around",
          padding: "0.75rem 0",
          borderTop: "1px solid #12937f",
          background: "#0A0A0A",
          position: "sticky",
          bottom: 0,
          zIndex: 50,
        }}
      >
        <button
          onClick={() => setActiveTab("players")}
          style={{
            color: activeTab === "players" ? "#12937f" : "white",
            fontWeight: activeTab === "players" ? 700 : 400,
            background: "none",
            border: "none",
            fontSize: "0.8rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.2rem",
          }}
        >
          <span style={{ fontSize: "1.4rem" }}>👤</span>
          Players
        </button>

        <button
          onClick={() => setActiveTab("queue")}
          style={{
            color: activeTab === "queue" ? "#12937f" : "white",
            fontWeight: activeTab === "queue" ? 700 : 400,
            background: "none",
            border: "none",
            fontSize: "0.8rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.2rem",
          }}
        >
          <span style={{ fontSize: "1.4rem" }}>📥</span>
          Queue
        </button>

        <button
          onClick={() => setActiveTab("board")}
          style={{
            color: activeTab === "board" ? "#12937f" : "white",
            fontWeight: activeTab === "board" ? 700 : 400,
            background: "none",
            border: "none",
            fontSize: "0.8rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.2rem",
          }}
        >
          <span style={{ fontSize: "1.4rem" }}>📋</span>
          Board
        </button>

        <button
          onClick={() => setActiveTab("rosters")}
          style={{
            color: activeTab === "rosters" ? "#12937f" : "white",
            fontWeight: activeTab === "rosters" ? 700 : 400,
            background: "none",
            border: "none",
            fontSize: "0.8rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.2rem",
          }}
        >
          <span style={{ fontSize: "1.4rem" }}>🧑‍🤝‍🧑</span>
          Rosters
        </button>
      </nav>
    </div>
  );
}
