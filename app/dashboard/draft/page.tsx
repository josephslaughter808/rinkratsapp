"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DraftHeader from "@/components/draft/DraftHeader";
import PlayersTab from "@/components/draft/PlayersTab";
import QueueTab from "@/components/draft/QueueTab";
import BoardTab from "@/components/draft/BoardTab";
import RostersTab from "@/components/draft/RostersTab";
import DraftPickRail from "@/components/draft/DraftPickRail";
import { supabase } from "@/lib/supabaseClient";
import { useTeam } from "@/context/TeamContext";
import {
  draftConfig as mockDraftConfig,
  DraftPick,
  DraftPlayer,
  draftPicks as mockDraftPicks,
  draftPlayers as mockDraftPlayers,
  draftQueue as mockDraftQueue,
  getTeam,
  Team,
  teams as mockTeams,
} from "@/lib/mockLeagueData";

type DraftTab = "players" | "queue" | "board" | "rosters";
type DraftMode = "live" | "mock";

type LeagueRow = {
  id: string;
  name: string;
  season: string;
};

type DraftRow = {
  id: string;
  season: string;
  is_active: boolean | null;
  current_pick: number | null;
  pick_duration_seconds: number | null;
  pick_start_time: string | null;
};

type DraftPickRow = {
  id: string;
  draft_id: string;
  round: number;
  pick_number: number;
  team_id: string | null;
  draft_pool_entry_id?: string | null;
};

type DraftPoolEntryRow = {
  id: string;
  draft_id: string;
  player_id: string;
  status: string;
  declared_position: string | null;
  level: string | null;
  previous_team_label: string | null;
  season_points: number | null;
};

type LivePlayerRow = {
  id: string;
  name: string | null;
  number: number | null;
  position: string | null;
  profile_pic_url: string | null;
  handedness?: string | null;
  level?: string | null;
};

type SeasonStatRow = {
  player_id: string;
  points: number | null;
};

type TeamRow = {
  id: string;
  name: string;
  logo_url: string | null;
  league_id: string | null;
};

const teamAccentPalette = [
  "#f97316",
  "#3b82f6",
  "#22c55e",
  "#a855f7",
  "#ef4444",
  "#facc15",
  "#06b6d4",
  "#f472b6",
  "#84cc16",
  "#fb7185",
];

export default function DraftRoomPage() {
  const { selectedTeam } = useTeam();
  const [activeTab, setActiveTab] = useState<DraftTab>("players");
  const [draftMode, setDraftMode] = useState<DraftMode>("mock");
  const [loading, setLoading] = useState(true);
  const [bannerMessage, setBannerMessage] = useState("");
  const [queuedPlayerIds, setQueuedPlayerIds] = useState<string[]>(mockDraftQueue);
  const [draftStatePicks, setDraftStatePicks] = useState<DraftPick[]>(mockDraftPicks);
  const [draftPlayersState, setDraftPlayersState] = useState<DraftPlayer[]>(mockDraftPlayers);
  const [teamsState, setTeamsState] = useState<Team[]>(mockTeams);
  const [pickDurationSeconds, setPickDurationSeconds] = useState<number>(
    mockDraftConfig.pickDurationSeconds
  );
  const [timeLeft, setTimeLeft] = useState<number>(mockDraftConfig.pickDurationSeconds);

  const draftedPlayerIds = useMemo(
    () =>
      draftStatePicks.filter((pick) => pick.playerId).map((pick) => pick.playerId as string),
    [draftStatePicks]
  );

  const currentPick = useMemo(
    () => draftStatePicks.find((pick) => !pick.playerId) ?? null,
    [draftStatePicks]
  );

  const currentPickOverall = currentPick?.overall ?? draftStatePicks.length;
  const currentRound =
    currentPick?.round ?? Math.max(1, Math.ceil(draftStatePicks.length / teamsState.length));
  const totalPicks = draftPlayersState.length;
  const totalRounds = Math.max(1, Math.ceil(Math.max(totalPicks, 1) / teamsState.length));
  const yourTeamId = selectedTeam?.id ?? mockDraftConfig.yourTeamId;
  const yourNextPickOverall =
    draftStatePicks.find((pick) => pick.teamId === yourTeamId && !pick.playerId)?.overall ??
    currentPickOverall;
  const onClockTeam = getCurrentTeamName(currentPick?.teamId, teamsState) || "Draft Complete";
  const canDraftForCurrentPick = currentPick?.teamId === yourTeamId;

  const queuePlayers = queuedPlayerIds
    .map((playerId) => draftPlayersState.find((player) => player.id === playerId))
    .filter((player): player is DraftPlayer => Boolean(player))
    .filter((player) => !draftedPlayerIds.includes(player.id));

  const transformedPicks = draftStatePicks.map((pick) => {
    const player = draftPlayersState.find((entry) => entry.id === pick.playerId);

    return {
      id: pick.id,
      round: pick.round,
      overall: pick.overall,
      teamId: pick.teamId,
      player_name: player?.name || null,
      player_position: player?.position || null,
      player_profile_url: player?.profileUrl || null,
    };
  });

  const getBestAvailablePlayerId = useCallback(() => {
    const availablePlayers = draftPlayersState.filter(
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
  }, [draftPlayersState, draftedPlayerIds]);

  const loadLiveDraft = useCallback(async () => {
    if (!selectedTeam?.leagueId) {
      setDraftMode("mock");
      setBannerMessage("Select a rostered team to open the live draft room.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setBannerMessage("");

    const leagueResult = await supabase
      .from("leagues")
      .select("id, name, season")
      .eq("id", selectedTeam.leagueId)
      .maybeSingle();

    const league = leagueResult.data as LeagueRow | null;

    if (!league) {
      setDraftMode("mock");
      setBannerMessage("League details were not found, so the draft room is using the preview board.");
      setLoading(false);
      return;
    }

    const poolCheck = await supabase.from("draft_pool_entries").select("id").limit(1);
    if (poolCheck.error?.code === "PGRST205") {
      setDraftMode("mock");
      setBannerMessage("Run the live draft migration first, then this screen will switch to your real player pool.");
      setLoading(false);
      return;
    }

    const draftResult = await supabase
      .from("drafts")
      .select("id, season, is_active, current_pick, pick_duration_seconds, pick_start_time")
      .eq("season", league.season)
      .eq("is_active", true)
      .order("draft_datetime", { ascending: false })
      .limit(1)
      .maybeSingle();

    const liveDraft = draftResult.data as DraftRow | null;
    if (!liveDraft?.id) {
      setDraftMode("mock");
      setBannerMessage("No live draft has been started for this league yet. The room is still using the preview board.");
      setLoading(false);
      return;
    }

    const [teamResult, poolResult, pickResult, playerResultWithOptional] = await Promise.all([
      supabase
        .from("teams")
        .select("id, name, logo_url, league_id")
        .eq("league_id", selectedTeam.leagueId)
        .order("name"),
      supabase
        .from("draft_pool_entries")
        .select("id, draft_id, player_id, status, declared_position, level, previous_team_label, season_points")
        .eq("draft_id", liveDraft.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("draft_picks")
        .select("id, draft_id, round, pick_number, team_id, draft_pool_entry_id")
        .eq("draft_id", liveDraft.id)
        .order("round", { ascending: true })
        .order("pick_number", { ascending: true }),
      supabase
        .from("players")
        .select("id, name, number, position, profile_pic_url, handedness, level")
        .limit(1),
    ]);

    const liveTeams = (teamResult.data ?? []) as TeamRow[];
    const livePool = (poolResult.data ?? []) as DraftPoolEntryRow[];
    const livePickRows = (pickResult.data ?? []) as DraftPickRow[];

    if (!liveTeams.length || !livePool.length || !livePickRows.length) {
      setDraftMode("mock");
      setBannerMessage("The live draft exists, but it still needs pool entries or pick slots before the app can use it.");
      setLoading(false);
      return;
    }

    const playerIds = Array.from(new Set(livePool.map((entry) => entry.player_id)));

    const livePlayersResult =
      playerResultWithOptional.error
        ? await supabase
            .from("players")
            .select("id, name, number, position, profile_pic_url")
            .in("id", playerIds)
        : await supabase
            .from("players")
            .select("id, name, number, position, profile_pic_url, handedness, level")
            .in("id", playerIds);

    const statResult = await supabase
      .from("season_stats")
      .select("player_id, points")
      .eq("season", league.season)
      .in("player_id", playerIds);

    const livePlayers = (livePlayersResult.data ?? []) as LivePlayerRow[];
    const statRows = (statResult.data ?? []) as SeasonStatRow[];
    const teamMap = new Map(liveTeams.map((team) => [team.id, team]));
    const playerMap = new Map(livePlayers.map((player) => [player.id, player]));
    const statMap = new Map(statRows.map((row) => [row.player_id, row]));
    const poolMap = new Map(livePool.map((entry) => [entry.id, entry]));

    const mappedTeams = liveTeams.map((team, index) =>
      mapLiveTeam(team, teamAccentPalette[index % teamAccentPalette.length])
    );

    const mappedPlayers = livePool
      .map((entry) => {
        const player = playerMap.get(entry.player_id);
        if (!player?.id) return null;

        const stats = statMap.get(entry.player_id);
        return mapLiveDraftPlayer(entry, player, stats);
      })
      .filter((player): player is DraftPlayer => Boolean(player));

    const mappedPicks = livePickRows.map((pick, index) => {
      const poolEntry = pick.draft_pool_entry_id ? poolMap.get(pick.draft_pool_entry_id) : null;
      const draftedPlayerId = poolEntry?.player_id ?? null;
      const team = pick.team_id ? teamMap.get(pick.team_id) : null;

      return {
        id: pick.id,
        round: pick.round,
        overall: index + 1,
        teamId: pick.team_id ?? mappedTeams[index % mappedTeams.length]?.id ?? "",
        playerId: draftedPlayerId,
        madeBy: team?.name ?? "Team",
      } satisfies DraftPick;
    });

    setDraftMode("live");
    setTeamsState(mappedTeams);
    setDraftPlayersState(mappedPlayers);
    setDraftStatePicks(mappedPicks);
    setQueuedPlayerIds([]);
    setPickDurationSeconds(liveDraft.pick_duration_seconds ?? 600);
    setTimeLeft(
      computeTimeLeft(liveDraft.pick_duration_seconds ?? 600, liveDraft.pick_start_time)
    );
    setLoading(false);
  }, [selectedTeam]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadLiveDraft();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadLiveDraft]);

  const handleDraftPlayer = useCallback(
    async (playerId: string) => {
      if (!currentPick || draftedPlayerIds.includes(playerId)) return;

      if (draftMode === "live") {
        const player = draftPlayersState.find((entry) => entry.id === playerId);
        if (!player?.draftPoolEntryId) return;

        const { error } = await supabase.rpc("finalize_draft_pick", {
          p_draft_pick_id: currentPick.id,
          p_draft_pool_entry_id: player.draftPoolEntryId,
          p_team_id: currentPick.teamId,
          p_picked_by_player_id: selectedTeam?.player_id ?? null,
        });

        if (error) {
          setBannerMessage(error.message);
          return;
        }
      }

      setDraftStatePicks((existing) =>
        existing.map((pick) => (pick.id === currentPick.id ? { ...pick, playerId } : pick))
      );
      setQueuedPlayerIds((existing) => existing.filter((id) => id !== playerId));
      setTimeLeft(pickDurationSeconds);
    },
    [currentPick, draftedPlayerIds, draftMode, draftPlayersState, pickDurationSeconds, selectedTeam?.player_id]
  );

  function handleToggleQueue(playerId: string) {
    setQueuedPlayerIds((current) =>
      current.includes(playerId) ? current.filter((id) => id !== playerId) : [...current, playerId]
    );
  }

  useEffect(() => {
    if (!currentPick) return;

    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          const queuedChoice =
            currentPick.teamId === yourTeamId
              ? queuedPlayerIds.find((playerId) => !draftedPlayerIds.includes(playerId))
              : undefined;
          const fallbackPlayerId = queuedChoice ?? getBestAvailablePlayerId();

          if (fallbackPlayerId) {
            void handleDraftPlayer(fallbackPlayerId);
          }

          return pickDurationSeconds;
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
    pickDurationSeconds,
    queuedPlayerIds,
    yourTeamId,
  ]);

  if (!selectedTeam) {
    return (
      <main className="page-shell">
        <section className="glass-panel" style={{ padding: "1.2rem" }}>
          Select a team to open the draft room.
        </section>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="center-screen">
        <p>Loading draft room...</p>
      </main>
    );
  }

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

      {bannerMessage ? (
        <div
          style={{
            padding: "0.65rem 0.8rem",
            background: draftMode === "live" ? "rgba(59,130,246,0.12)" : "rgba(250,204,21,0.12)",
            borderBottom: "1px solid rgba(148,163,184,0.14)",
            color: draftMode === "live" ? "#bfdbfe" : "#fde68a",
            fontSize: "0.82rem",
            lineHeight: 1.4,
          }}
        >
          {bannerMessage}
        </div>
      ) : null}

      <DraftPickRail
        teams={teamsState}
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
            players={draftPlayersState}
            queuedPlayerIds={queuedPlayerIds}
            draftedPlayerIds={draftedPlayerIds}
            onToggleQueue={handleToggleQueue}
          />
        )}
        {activeTab === "queue" && (
          <QueueTab
            players={queuePlayers}
            onToggleQueue={handleToggleQueue}
            onDraftPlayer={(playerId) => void handleDraftPlayer(playerId)}
            canDraft={canDraftForCurrentPick}
          />
        )}
        {activeTab === "board" && (
          <BoardTab
            picks={draftStatePicks}
            teams={teamsState}
            players={draftPlayersState}
            currentPickOverall={currentPickOverall}
            yourNextPickOverall={yourNextPickOverall}
            yourTeamId={yourTeamId}
            totalRounds={totalRounds}
          />
        )}
        {activeTab === "rosters" && (
          <RostersTab teams={teamsState} picks={draftStatePicks} players={draftPlayersState} />
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
        {([
          ["players", "Players"],
          ["queue", "Queue"],
          ["board", "Board"],
          ["rosters", "Rosters"],
        ] as const).map(([tabKey, label]) => (
          <button
            key={tabKey}
            onClick={() => setActiveTab(tabKey)}
            style={{
              color: activeTab === tabKey ? "#fdba74" : "white",
              fontWeight: activeTab === tabKey ? 700 : 400,
              background: "none",
              border: "none",
              fontSize: "0.8rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.2rem",
            }}
          >
            <span style={{ fontSize: "1rem" }}>{label}</span>
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}

function computeTimeLeft(pickDurationSeconds: number, pickStartTime: string | null) {
  if (!pickStartTime) {
    return pickDurationSeconds;
  }

  const elapsedSeconds = Math.floor((Date.now() - new Date(pickStartTime).getTime()) / 1000);
  return Math.max(0, pickDurationSeconds - elapsedSeconds);
}

function mapLiveTeam(team: TeamRow, accent: string): Team {
  return {
    id: team.id,
    name: team.name,
    shortName: team.name.slice(0, 3).toUpperCase(),
    accent,
    record: "",
    captain: team.name,
    assistant: "",
    logoUrl: team.logo_url,
  };
}

function mapLiveDraftPlayer(
  entry: DraftPoolEntryRow,
  player: LivePlayerRow,
  stats: SeasonStatRow | undefined
): DraftPlayer {
  return {
    id: player.id,
    name: player.name ?? "Player",
    age: 0,
    number: player.number ?? 0,
    position: normalizeDraftPosition(entry.declared_position ?? player.position),
    shoots: normalizeHandedness(player.handedness),
    tier: normalizeLevel(entry.level ?? player.level),
    previousTeam: entry.previous_team_label ?? "Draft Pool",
    lastSeasonPoints: entry.season_points ?? stats?.points ?? 0,
    plusMinus: 0,
    note: "Live draft player",
    profileUrl: player.profile_pic_url,
    draftPoolEntryId: entry.id,
  };
}

function normalizeDraftPosition(position: string | null | undefined): DraftPlayer["position"] {
  const normalized = (position ?? "").toUpperCase();
  if (normalized === "LW") return "LW";
  if (normalized === "RW") return "RW";
  if (normalized === "G") return "G";
  if (normalized === "D" || normalized === "LD" || normalized === "RD") return "D";
  return "C";
}

function normalizeHandedness(handedness: string | null | undefined): DraftPlayer["shoots"] {
  return handedness?.toUpperCase() === "R" ? "R" : "L";
}

function normalizeLevel(level: string | null | undefined): DraftPlayer["tier"] {
  const normalized = (level ?? "").toUpperCase();
  if (normalized === "E") return "E";
  if (normalized === "A") return "A";
  if (normalized === "B") return "B";
  if (normalized === "C") return "C";
  if (normalized === "D") return "D";
  return "R";
}

function getCurrentTeamName(teamId: string | undefined, teams: Team[]) {
  return teams.find((team) => team.id === teamId)?.name ?? getTeam(teamId || "")?.name;
}

function levelSortValue(level: DraftPlayer["tier"]) {
  const order: Record<DraftPlayer["tier"], number> = {
    E: 6,
    A: 5,
    B: 4,
    C: 3,
    D: 2,
    R: 1,
  };

  return order[level] ?? 0;
}
