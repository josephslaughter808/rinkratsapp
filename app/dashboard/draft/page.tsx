"use client";

import { useState } from "react";
import DraftHeader from "@/components/draft/DraftHeader";
import PlayersTab from "@/components/draft/PlayersTab";
import QueueTab from "@/components/draft/QueueTab";
import BoardTab from "@/components/draft/BoardTab";
import RostersTab from "@/components/draft/RostersTab";
import DraftPickRail from "@/components/draft/DraftPickRail";
import {
  draftConfig,
  draftedPlayerIds,
  draftPicks,
  draftPlayers,
  draftQueue,
  getPlayer,
  getTeam,
  teams,
} from "@/lib/mockLeagueData";

type DraftTab = "players" | "queue" | "board" | "rosters";

export default function DraftRoomPage() {
  const [activeTab, setActiveTab] = useState<DraftTab>("players");
  const onClockTeam =
    getTeam(
      draftPicks.find((pick) => pick.overall === draftConfig.currentPickOverall)
        ?.teamId || ""
    )?.name || "League Team";
  const queuePlayers = draftQueue
    .map((playerId) => getPlayer(playerId))
    .filter((player): player is NonNullable<typeof player> => Boolean(player));
  const transformedPicks = draftPicks.map((pick) => {
    const player = getPlayer(pick.playerId);

    return {
      id: pick.id,
      round: pick.round,
      overall: pick.overall,
      teamId: pick.teamId,
      player_name: player?.name || null,
      player_position: player?.position || null,
    };
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background:
          "radial-gradient(circle at top right, rgba(249,115,22,0.12), transparent 24%), linear-gradient(180deg, #07111f 0%, #050b14 100%)",
        color: "white",
      }}
    >
      <DraftHeader
        currentTeam={onClockTeam}
        pickNumber={draftConfig.currentPickOverall}
        round={draftConfig.currentRound}
        totalRounds={draftConfig.totalRounds}
        timeLeft={draftConfig.timeLeft}
        onExit={() => {
          window.history.back();
        }}
      />

      <DraftPickRail
        teams={teams}
        picks={transformedPicks}
        currentPickOverall={draftConfig.currentPickOverall}
        yourNextPickOverall={draftConfig.yourNextPickOverall}
      />

      <div
        style={{
          padding: "0.65rem 0.55rem 1rem",
          display: "grid",
          gap: "0.75rem",
          flex: 1,
        }}
      >
        {activeTab === "players" && (
          <PlayersTab
            players={draftPlayers}
            queuedPlayerIds={draftQueue}
            draftedPlayerIds={draftedPlayerIds}
          />
        )}
        {activeTab === "queue" && <QueueTab players={queuePlayers} />}
        {activeTab === "board" && (
          <BoardTab picks={draftPicks} teams={teams} players={draftPlayers} />
        )}
        {activeTab === "rosters" && (
          <RostersTab teams={teams} picks={draftPicks} players={draftPlayers} />
        )}
      </div>

      <nav
        style={{
          display: "flex",
          justifyContent: "space-around",
          padding: "0.9rem 0.5rem",
          borderTop: "1px solid rgba(148, 163, 184, 0.18)",
          background: "rgba(7, 17, 31, 0.96)",
          position: "sticky",
          bottom: 0,
          zIndex: 50,
        }}
      >
        <button
          onClick={() => setActiveTab("players")}
          style={{
            color: activeTab === "players" ? "#fdba74" : "white",
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
          <span style={{ fontSize: "1rem" }}>Players</span>
          Players
        </button>

        <button
          onClick={() => setActiveTab("queue")}
          style={{
            color: activeTab === "queue" ? "#fdba74" : "white",
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
          <span style={{ fontSize: "1rem" }}>Queue</span>
          Queue
        </button>

        <button
          onClick={() => setActiveTab("board")}
          style={{
            color: activeTab === "board" ? "#fdba74" : "white",
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
          <span style={{ fontSize: "1rem" }}>Board</span>
          Board
        </button>

        <button
          onClick={() => setActiveTab("rosters")}
          style={{
            color: activeTab === "rosters" ? "#fdba74" : "white",
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
          <span style={{ fontSize: "1rem" }}>Rosters</span>
          Rosters
        </button>
      </nav>
    </div>
  );
}
