"use client";

import { useState } from "react";
import DraftHeader from "@/components/draft/DraftHeader";
import PlayersTab from "@/components/draft/PlayersTab";
import QueueTab from "@/components/draft/QueueTab";
import BoardTab from "@/components/draft/BoardTab";
import RostersTab from "@/components/draft/RostersTab";

type DraftTab = "players" | "queue" | "board" | "rosters";

export default function DraftRoomPage() {
  const [activeTab, setActiveTab] = useState<DraftTab>("players");

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
        pickNumber={1}
        round={1}
        totalRounds={10}
        timeLeft={60}
        onExit={() => {
          // Temporary behavior for testing
          alert("Exit draft clicked");

          // Later:
          // router.push("/dashboard");
        }}
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
