"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DraftHeader from "@/components/draft/DraftHeader";
import PlayersTab from "@/components/draft/PlayersTab";
import QueueTab from "@/components/draft/QueueTab";
import BoardTab from "@/components/draft/BoardTab";
import RostersTab from "@/components/draft/RostersTab";
import DraftPickRail from "@/components/draft/DraftPickRail";
import {
  draftConfig,
  DraftPick,
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
  const [queuedPlayerIds, setQueuedPlayerIds] = useState<string[]>(draftQueue);
  const [draftStatePicks, setDraftStatePicks] = useState<DraftPick[]>(draftPicks);
  const [timeLeft, setTimeLeft] = useState<number>(draftConfig.pickDurationSeconds);

  const draftedPlayerIds = useMemo(
    () =>
      draftStatePicks
        .filter((pick) => pick.playerId)
        .map((pick) => pick.playerId as string),
    [draftStatePicks]
  );

  const currentPick = useMemo(
    () => draftStatePicks.find((pick) => !pick.playerId) ?? null,
    [draftStatePicks]
  );

  const currentPickOverall = currentPick?.overall ?? draftStatePicks.length;
  const currentRound =
    currentPick?.round ?? Math.max(1, Math.ceil(draftStatePicks.length / teams.length));
  const totalPicks = draftPlayers.length;
  const totalRounds = Math.max(1, Math.ceil(totalPicks / teams.length));
  const yourNextPickOverall =
    draftStatePicks.find(
      (pick) => pick.teamId === draftConfig.yourTeamId && !pick.playerId
    )?.overall ?? currentPickOverall;
  const onClockTeam = getTeam(currentPick?.teamId || "")?.name || "Draft Complete";
  const canDraftForCurrentPick = currentPick?.teamId === draftConfig.yourTeamId;

  const queuePlayers = queuedPlayerIds
    .map((playerId) => getPlayer(playerId))
    .filter((player): player is NonNullable<typeof player> => Boolean(player))
    .filter((player) => !draftedPlayerIds.includes(player.id));

  const transformedPicks = draftStatePicks.map((pick) => {
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

  const getBestAvailablePlayerId = useCallback(() => {
    const availablePlayers = draftPlayers.filter(
      (player) => !draftedPlayerIds.includes(player.id)
    );

    return [...availablePlayers]
      .sort((a, b) => {
        if (b.lastSeasonPoints !== a.lastSeasonPoints) {
          return b.lastSeasonPoints - a.lastSeasonPoints;
        }

        const levelDifference = levelSortValue(b.tier) - levelSortValue(a.tier);
        if (levelDifference !== 0) {
          return levelDifference;
        }

        return a.name.localeCompare(b.name);
      })[0]?.id;
  }, [draftedPlayerIds]);

  const handleDraftPlayer = useCallback(
    (playerId: string) => {
      if (!currentPick) return;
      if (draftedPlayerIds.includes(playerId)) return;

      setDraftStatePicks((existing) =>
        existing.map((pick) =>
          pick.id === currentPick.id ? { ...pick, playerId } : pick
        )
      );
      setQueuedPlayerIds((existing) => existing.filter((id) => id !== playerId));
      setTimeLeft(draftConfig.pickDurationSeconds);
    },
    [currentPick, draftedPlayerIds]
  );

  function handleToggleQueue(playerId: string) {
    setQueuedPlayerIds((current) =>
      current.includes(playerId)
        ? current.filter((id) => id !== playerId)
        : [...current, playerId]
    );
  }

  useEffect(() => {
    if (!currentPick) return;

    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          const queuedChoice =
            currentPick.teamId === draftConfig.yourTeamId
              ? queuedPlayerIds.find((playerId) => !draftedPlayerIds.includes(playerId))
              : undefined;
          const fallbackPlayerId = queuedChoice ?? getBestAvailablePlayerId();

          if (fallbackPlayerId) {
            handleDraftPlayer(fallbackPlayerId);
          }

          return draftConfig.pickDurationSeconds;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [
    currentPick,
    draftedPlayerIds,
    getBestAvailablePlayerId,
    handleDraftPlayer,
    queuedPlayerIds,
  ]);

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
        pickNumber={currentPickOverall}
        round={currentRound}
        totalPicks={totalPicks}
        timeLeft={timeLeft}
        onExit={() => {
          window.history.back();
        }}
      />

      <DraftPickRail
        teams={teams}
        picks={transformedPicks}
        currentPickOverall={currentPickOverall}
        yourNextPickOverall={yourNextPickOverall}
      />

      <div
        style={{
          padding: "0.65rem 0.55rem 6.25rem",
          display: "grid",
          gap: "0.75rem",
          flex: 1,
        }}
      >
        {activeTab === "players" && (
          <PlayersTab
            players={draftPlayers}
            queuedPlayerIds={queuedPlayerIds}
            draftedPlayerIds={draftedPlayerIds}
            onToggleQueue={handleToggleQueue}
          />
        )}
        {activeTab === "queue" && (
          <QueueTab
            players={queuePlayers}
            onToggleQueue={handleToggleQueue}
            onDraftPlayer={handleDraftPlayer}
            canDraft={canDraftForCurrentPick}
          />
        )}
        {activeTab === "board" && (
          <BoardTab
            picks={draftStatePicks}
            teams={teams}
            players={draftPlayers}
            currentPickOverall={currentPickOverall}
            yourNextPickOverall={yourNextPickOverall}
            yourTeamId={draftConfig.yourTeamId}
            totalRounds={totalRounds}
          />
        )}
        {activeTab === "rosters" && (
          <RostersTab teams={teams} picks={draftStatePicks} players={draftPlayers} />
        )}
      </div>

      <nav
        style={{
          display: "flex",
          justifyContent: "space-around",
          padding: "0.85rem 0.5rem calc(0.85rem + var(--safe-bottom))",
          borderTop: "1px solid rgba(148, 163, 184, 0.18)",
          background: "rgba(7, 17, 31, 0.96)",
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 80,
          backdropFilter: "blur(18px)",
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

function levelSortValue(level: string) {
  const order: Record<string, number> = {
    E: 6,
    A: 5,
    B: 4,
    C: 3,
    D: 2,
    R: 1,
  };

  return order[level] ?? 0;
}
