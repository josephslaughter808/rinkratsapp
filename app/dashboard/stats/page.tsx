"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useTeam } from "@/context/TeamContext";

function positionColor(pos: string) {
  if (pos === "C") return "#FFD700";
  if (pos === "LW" || pos === "RW") return "#3B82F6";
  if (pos === "LD" || pos === "RD" || pos === "D") return "#EF4444";
  if (pos === "G") return "#FFFFFF";
  return "#9CA3AF";
}

type StatRow = {
  player_id: string;
  name: string;
  points: number;
  goals: number;
  assists: number;
  pim: number;
  hits: number;
};

type SeasonStatsRow = {
  player_id: string;
  points: number | null;
  goals: number | null;
  assists: number | null;
  pim: number | null;
  players: { name: string | null } | { name: string | null }[] | null;
};

type LoggedEvent =
  | {
      id: string;
      type: "goal";
      scorerId: string;
      scorerName: string;
      assists: string[];
      createdAt: string;
    }
  | {
      id: string;
      type: "penalty";
      playerId: string;
      playerName: string;
      penaltyType: string;
      pim: number;
      createdAt: string;
    }
  | {
      id: string;
      type: "hit";
      playerId: string;
      playerName: string;
      targetNumber: string;
      createdAt: string;
    };

type ProfileSummary = {
  number: number | null;
  position: string | null;
  profile_pic_url: string | null;
};

type TeamFallback = {
  season: string;
  teamStats: StatRow[];
  leagueStats: StatRow[];
};

type PersonalSeasonStat = {
  points: number | null;
  goals: number | null;
  assists: number | null;
  pim: number | null;
};

function generatePreviewPlayers(
  prefix: string,
  label: string,
  count: number,
  startIndex = 1
): StatRow[] {
  return Array.from({ length: count }, (_, index) => {
    const rank = startIndex + index;
    const goals = Math.max(0, 24 - Math.floor(index / 3));
    const assists = Math.max(0, 28 - Math.floor(index / 2));
    const pim = (index * 2) % 18;
    const hits = 18 + ((count - index) % 17);

    return {
      player_id: `${prefix}-${rank}`,
      name: `${label} Player ${rank}`,
      points: goals + assists,
      goals,
      assists,
      pim,
      hits,
    };
  });
}

function mergeStatRows(primary: StatRow[], supplemental: StatRow[]) {
  const seen = new Set<string>();
  const merged: StatRow[] = [];

  for (const row of [...primary, ...supplemental]) {
    if (seen.has(row.player_id)) continue;
    seen.add(row.player_id);
    merged.push(row);
  }

  return merged;
}

function upsertCurrentPlayerRow(
  rows: StatRow[],
  playerId: string,
  playerName: string,
  personal: PersonalSeasonStat | null | undefined
) {
  const nextRow: StatRow = {
    player_id: playerId,
    name: playerName || "Unknown Player",
    points: personal?.points ?? 0,
    goals: personal?.goals ?? 0,
    assists: personal?.assists ?? 0,
    pim: personal?.pim ?? 0,
    hits: rows.find((row) => row.player_id === playerId)?.hits ?? 0,
  };

  const existingIndex = rows.findIndex((row) => row.player_id === playerId);

  if (existingIndex === -1) {
    return [...rows, nextRow];
  }

  return rows.map((row, index) => (index === existingIndex ? { ...row, ...nextRow } : row));
}

const fallbackStatsByTeam: Record<string, TeamFallback> = {
  Bison: {
    season: "2026a",
    teamStats: mergeStatRows(
      [
        { player_id: "bison-1", name: "Eli Mercer", points: 14, goals: 7, assists: 7, pim: 4, hits: 9 },
        { player_id: "bison-2", name: "Grant Holloway", points: 11, goals: 4, assists: 7, pim: 2, hits: 6 },
        { player_id: "bison-3", name: "Noah Briggs", points: 8, goals: 3, assists: 5, pim: 10, hits: 13 },
        { player_id: "bison-4", name: "Dane Archer", points: 6, goals: 2, assists: 4, pim: 6, hits: 8 },
        { player_id: "bison-5", name: "Miles Porter", points: 3, goals: 1, assists: 2, pim: 0, hits: 4 },
      ],
      generatePreviewPlayers("bison", "Bison", 100, 6)
    ),
    leagueStats: mergeStatRows(
      [
        { player_id: "bison-1", name: "Eli Mercer", points: 14, goals: 7, assists: 7, pim: 4, hits: 9 },
        { player_id: "mustangs-1", name: "Cal Romero", points: 13, goals: 6, assists: 7, pim: 8, hits: 7 },
        { player_id: "peaks-1", name: "Jace Tanner", points: 12, goals: 5, assists: 7, pim: 2, hits: 10 },
        { player_id: "yeti-1", name: "Cole Ramsey", points: 10, goals: 4, assists: 6, pim: 12, hits: 14 },
        { player_id: "bison-2", name: "Grant Holloway", points: 11, goals: 4, assists: 7, pim: 2, hits: 6 },
      ],
      [
        ...generatePreviewPlayers("bison-league", "Bison League", 40, 6),
        ...generatePreviewPlayers("mustangs", "Mustangs", 20, 1),
        ...generatePreviewPlayers("peaks", "Peaks", 20, 1),
        ...generatePreviewPlayers("yeti", "Yeti", 20, 1),
      ]
    ),
  },
  "Desert Storm": {
    season: "2026a",
    teamStats: mergeStatRows(
      [
        { player_id: "dst-1", name: "Evan Price", points: 16, goals: 8, assists: 8, pim: 4, hits: 5 },
        { player_id: "dst-2", name: "Nate Keller", points: 13, goals: 4, assists: 9, pim: 6, hits: 8 },
        { player_id: "dst-3", name: "Jules Medina", points: 9, goals: 2, assists: 7, pim: 12, hits: 15 },
        { player_id: "dst-4", name: "Micah Dunn", points: 8, goals: 5, assists: 3, pim: 2, hits: 4 },
        { player_id: "dst-5", name: "Mason Pope", points: 6, goals: 3, assists: 3, pim: 0, hits: 3 },
      ],
      generatePreviewPlayers("dst", "Desert Storm", 100, 6)
    ),
    leagueStats: mergeStatRows(
      [
        { player_id: "dst-1", name: "Evan Price", points: 16, goals: 8, assists: 8, pim: 4, hits: 5 },
        { player_id: "rdm-1", name: "Chris Boone", points: 15, goals: 6, assists: 9, pim: 8, hits: 6 },
        { player_id: "ply-1", name: "Ava Reese", points: 12, goals: 5, assists: 7, pim: 2, hits: 7 },
        { player_id: "dst-2", name: "Nate Keller", points: 13, goals: 4, assists: 9, pim: 6, hits: 8 },
        { player_id: "mds-1", name: "Tyson Black", points: 11, goals: 4, assists: 7, pim: 14, hits: 16 },
      ],
      [
        ...generatePreviewPlayers("dst-league", "Rink Rats", 40, 6),
        ...generatePreviewPlayers("rdm", "Ratt Damon", 20, 2),
        ...generatePreviewPlayers("ply", "Platypucks", 20, 2),
        ...generatePreviewPlayers("mds", "Mudsquatch", 20, 2),
      ]
    ),
  },
};

const penaltyDefaults: Record<string, number> = {
  Hooking: 2,
  Tripping: 2,
  Slashing: 2,
  Roughing: 2,
  Boarding: 2,
  "Cross-Checking": 2,
  "High-Sticking": 2,
  Interference: 2,
  Unsportsmanlike: 2,
  Fighting: 5,
  Major: 5,
  Misconduct: 10,
};

const statColumns = [
  { key: "points" as const, label: "Points" },
  { key: "goals" as const, label: "Goals" },
  { key: "assists" as const, label: "Assists" },
  { key: "pim" as const, label: "PIM" },
  { key: "hits" as const, label: "Hits" },
];

function mapSeasonStatsRows(rows: SeasonStatsRow[] | null | undefined): StatRow[] {
  return (rows || []).map((row) => {
    const playerRecord = Array.isArray(row.players) ? row.players[0] : row.players;

    return {
      player_id: row.player_id,
      name: playerRecord?.name || "Unknown Player",
      points: row.points ?? 0,
      goals: row.goals ?? 0,
      assists: row.assists ?? 0,
      pim: row.pim ?? 0,
      hits: 0,
    };
  });
}

function sortData(
  data: StatRow[],
  field: keyof StatRow,
  dir: "asc" | "desc"
) {
  return [...data].sort((a, b) => {
    const av = a[field] as number;
    const bv = b[field] as number;
    return dir === "desc" ? bv - av : av - bv;
  });
}

function applyEvents(baseRows: StatRow[], events: LoggedEvent[]) {
  const next = new Map(
    baseRows.map((row) => [
      row.player_id,
      {
        ...row,
      },
    ])
  );

  for (const event of events) {
    if (event.type === "goal") {
      const scorer = next.get(event.scorerId);
      if (scorer) {
        scorer.goals += 1;
        scorer.points += 1;
      }

      for (const assistId of event.assists) {
        const assistRow = next.get(assistId);
        if (assistRow) {
          assistRow.assists += 1;
          assistRow.points += 1;
        }
      }
    }

    if (event.type === "penalty") {
      const penalized = next.get(event.playerId);
      if (penalized) {
        penalized.pim += event.pim;
      }
    }

    if (event.type === "hit") {
      const hitter = next.get(event.playerId);
      if (hitter) {
        hitter.hits += 1;
      }
    }
  }

  return Array.from(next.values());
}

export default function StatsPage() {
  const router = useRouter();
  const { selectedTeam } = useTeam();

  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [playerProfile, setPlayerProfile] = useState<ProfileSummary>({
    number: null,
    position: null,
    profile_pic_url: null,
  });
  const [personalStats, setPersonalStats] = useState({
    points: 0,
    goals: 0,
    assists: 0,
    pim: 0,
    hits: 0,
  });
  const [teamStats, setTeamStats] = useState<StatRow[]>([]);
  const [leagueStats, setLeagueStats] = useState<StatRow[]>([]);
  const [season, setSeason] = useState("2026a");
  const [teamSortField, setTeamSortField] = useState<keyof StatRow>("points");
  const [teamSortDir, setTeamSortDir] = useState<"asc" | "desc">("desc");
  const [leagueSortField, setLeagueSortField] = useState<keyof StatRow>("points");
  const [leagueSortDir, setLeagueSortDir] = useState<"asc" | "desc">("desc");
  const [eventType, setEventType] = useState<"goal" | "penalty" | "hit">("goal");
  const [loggedEvents, setLoggedEvents] = useState<LoggedEvent[]>([]);
  const [goalScorerId, setGoalScorerId] = useState("");
  const [goalAssistOneId, setGoalAssistOneId] = useState("");
  const [goalAssistTwoId, setGoalAssistTwoId] = useState("");
  const [goalUnassisted, setGoalUnassisted] = useState(false);
  const [penaltyPlayerId, setPenaltyPlayerId] = useState("");
  const [penaltyType, setPenaltyType] = useState("Hooking");
  const [penaltyMinutes, setPenaltyMinutes] = useState(2);
  const [hitPlayerId, setHitPlayerId] = useState("");
  const [hitTargetNumber, setHitTargetNumber] = useState("");

  const isStaffEditor =
    selectedTeam?.role === "captain" || selectedTeam?.role === "assistant_captain";

  useEffect(() => {
    async function loadData() {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;

      if (!session) {
        router.push("/auth/login");
        return;
      }

      setUserEmail(session.user.email ?? null);

      if (!selectedTeam) {
        setLoading(false);
        return;
      }

      setLoading(true);

      const playerId = selectedTeam.player_id;
      const teamId = selectedTeam.id;
      const leagueId = selectedTeam.leagueId;

      const { data: sharedProfileRow } = await supabase
        .from("players")
        .select("profile_pic_url")
        .eq("user_id", session.user.id)
        .not("profile_pic_url", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: leagueRow } = leagueId
        ? await supabase
            .from("leagues")
            .select("season")
            .eq("id", leagueId)
            .maybeSingle()
        : { data: null };

      const nextSeason = leagueRow?.season ?? fallbackStatsByTeam[selectedTeam.name]?.season ?? "2026a";
      setSeason(nextSeason);

      const { data: playerInfo } = await supabase
        .from("players")
        .select("name, number, position, profile_pic_url")
        .eq("id", playerId)
        .maybeSingle();

      setPlayerProfile({
        number: playerInfo?.number ?? null,
        position: playerInfo?.position ?? null,
        profile_pic_url: sharedProfileRow?.profile_pic_url ?? playerInfo?.profile_pic_url ?? null,
      });

      const { data: personal } = await supabase
        .from("season_stats")
        .select("points, goals, assists, pim")
        .eq("player_id", playerId)
        .eq("team_id", teamId)
        .eq("season", nextSeason)
        .maybeSingle();

      const { data: teamPlayers } = await supabase
        .from("season_stats")
        .select("player_id, points, goals, assists, pim, players(name)")
        .eq("team_id", teamId)
        .eq("season", nextSeason);

      const { data: leagueTeams } = leagueId
        ? await supabase.from("teams").select("id").eq("league_id", leagueId)
        : { data: null };

      const leagueTeamIds = (leagueTeams || []).map((team) => team.id);

      const { data: leaguePlayers } = await supabase
        .from("season_stats")
        .select("player_id, points, goals, assists, pim, players(name)")
        .eq("season", nextSeason)
        .in("team_id", leagueTeamIds.length > 0 ? leagueTeamIds : [teamId]);

      const fallback = fallbackStatsByTeam[selectedTeam.name];
      const mappedTeamStats = mapSeasonStatsRows(teamPlayers as SeasonStatsRow[]);
      const mappedLeagueStats = mapSeasonStatsRows(leaguePlayers as SeasonStatsRow[]);

      const baseTeamStats =
        mappedTeamStats.length > 0 ? mappedTeamStats : fallback?.teamStats ?? [];
      const baseLeagueStats =
        mappedLeagueStats.length > 0 ? mappedLeagueStats : fallback?.leagueStats ?? baseTeamStats;

      const currentPlayerName =
        playerInfo?.name ??
        baseTeamStats.find((row) => row.player_id === playerId)?.name ??
        userEmail?.split("@")[0] ??
        "Player";

      const nextTeamStats = upsertCurrentPlayerRow(
        baseTeamStats,
        playerId,
        currentPlayerName,
        personal
      );
      const nextLeagueStats = upsertCurrentPlayerRow(
        baseLeagueStats,
        playerId,
        currentPlayerName,
        personal
      );

      const personalRow =
        nextTeamStats.find((row) => row.player_id === playerId) ||
        nextTeamStats.find((row) =>
          row.name.toLowerCase() === (userEmail?.split("@")[0] || "").toLowerCase()
        );

      setPersonalStats({
        points: personal?.points ?? personalRow?.points ?? 0,
        goals: personal?.goals ?? personalRow?.goals ?? 0,
        assists: personal?.assists ?? personalRow?.assists ?? 0,
        pim: personal?.pim ?? personalRow?.pim ?? 0,
        hits: personalRow?.hits ?? 0,
      });

      setTeamStats(nextTeamStats);
      setLeagueStats(nextLeagueStats);
      setLoading(false);
    }

    loadData();
  }, [router, selectedTeam, userEmail]);

  useEffect(() => {
    if (!selectedTeam) return;

    const key = `stats-events-${selectedTeam.id}-${season}`;
    const raw = window.localStorage.getItem(key);

    if (!raw) {
      queueMicrotask(() => setLoggedEvents([]));
      return;
    }

    try {
      const parsed = JSON.parse(raw) as LoggedEvent[];
      queueMicrotask(() => setLoggedEvents(parsed));
    } catch {
      queueMicrotask(() => setLoggedEvents([]));
    }
  }, [selectedTeam, season]);

  function persistEvents(nextEvents: LoggedEvent[]) {
    if (!selectedTeam) return;
    const key = `stats-events-${selectedTeam.id}-${season}`;
    window.localStorage.setItem(key, JSON.stringify(nextEvents));
    setLoggedEvents(nextEvents);
  }

  const rosterOptions = useMemo(() => {
    if (teamStats.length > 0) return teamStats;
    return fallbackStatsByTeam[selectedTeam?.name || ""]?.teamStats ?? [];
  }, [selectedTeam?.name, teamStats]);

  const displayedTeamStats = useMemo(
    () => applyEvents(teamStats, loggedEvents),
    [teamStats, loggedEvents]
  );

  const displayedLeagueStats = useMemo(() => {
    const relevantIds = new Set(displayedTeamStats.map((row) => row.player_id));
    const leagueBase = leagueStats.map((row) =>
      relevantIds.has(row.player_id)
        ? displayedTeamStats.find((teamRow) => teamRow.player_id === row.player_id) || row
        : row
    );

    return leagueBase;
  }, [displayedTeamStats, leagueStats]);

  if (!selectedTeam) {
    return (
      <main className="center-screen">
        <p>Loading team...</p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="center-screen">
        <p>Loading stats...</p>
      </main>
    );
  }

  const playerId = selectedTeam.player_id;
  const currentPlayerStats =
    displayedTeamStats.find((row) => row.player_id === playerId) || personalStats;

  function handleSaveEvent() {
    const now = new Date().toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });

    if (eventType === "goal") {
      const scorer = rosterOptions.find((player) => player.player_id === goalScorerId);
      if (!scorer) return;

      const assists = goalUnassisted
        ? []
        : [goalAssistOneId, goalAssistTwoId].filter(
            (assistId) => assistId && assistId !== goalScorerId
          );

      const nextEvent: LoggedEvent = {
        id: `${Date.now()}`,
        type: "goal",
        scorerId: scorer.player_id,
        scorerName: scorer.name,
        assists,
        createdAt: now,
      };

      persistEvents([nextEvent, ...loggedEvents]);
      setGoalScorerId("");
      setGoalAssistOneId("");
      setGoalAssistTwoId("");
      setGoalUnassisted(false);
      return;
    }

    if (eventType === "penalty") {
      const penalized = rosterOptions.find((player) => player.player_id === penaltyPlayerId);
      if (!penalized) return;

      const nextEvent: LoggedEvent = {
        id: `${Date.now()}`,
        type: "penalty",
        playerId: penalized.player_id,
        playerName: penalized.name,
        penaltyType,
        pim: penaltyMinutes,
        createdAt: now,
      };

      persistEvents([nextEvent, ...loggedEvents]);
      setPenaltyPlayerId("");
      return;
    }

    const hitter = rosterOptions.find((player) => player.player_id === hitPlayerId);
    if (!hitter) return;

    const nextEvent: LoggedEvent = {
      id: `${Date.now()}`,
      type: "hit",
      playerId: hitter.player_id,
      playerName: hitter.name,
      targetNumber: hitTargetNumber,
      createdAt: now,
    };

    persistEvents([nextEvent, ...loggedEvents]);
    setHitPlayerId("");
    setHitTargetNumber("");
  }

  function handlePenaltyTypeChange(nextType: string) {
    setPenaltyType(nextType);
    setPenaltyMinutes(penaltyDefaults[nextType] ?? 2);
  }

  return (
    <main
      className="page-shell"
      style={{ maxWidth: "1100px", paddingTop: "1.5rem" }}
    >
      <section className="glass-panel" style={{ padding: "1.25rem", marginBottom: "1rem" }}>
        <div
          style={{
            display: "grid",
            gap: "1rem",
            justifyItems: "center",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "96px minmax(0, 1fr)",
              gap: "0.9rem",
              alignItems: "center",
              justifyContent: "center",
              width: "fit-content",
              maxWidth: "100%",
            }}
          >
            <img
              src={playerProfile.profile_pic_url || "https://via.placeholder.com/120?text=?"}
              alt="Profile"
              style={{
                width: "96px",
                height: "96px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "3px solid var(--accent-light)",
              }}
            />

            <div
              style={{
                minWidth: 0,
                paddingTop: "0.15rem",
                textAlign: "center",
                display: "grid",
                justifyItems: "center",
              }}
            >
              <div style={{ color: "var(--accent-light)", marginBottom: "0.15rem" }}>
                {selectedTeam.name}
              </div>
              <div style={{ color: "var(--text-muted)" }}>{selectedTeam.name}</div>
              <div style={{ color: "var(--text-muted)", marginTop: "0.15rem" }}>
                {season}
              </div>
            </div>
          </div>

          <div style={{ textAlign: "center" }}>
            <h1 style={{ fontSize: "1.85rem", lineHeight: 1.05 }}>
              {userEmail?.split("@")[0]}
            </h1>
            <div
              style={{
                marginTop: "0.45rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.45rem",
                flexWrap: "wrap",
                color: "var(--text-muted)",
              }}
            >
              <span>#{playerProfile.number ?? "00"}</span>
              {playerProfile.position ? (
                <span
                  style={{
                    padding: "2px 10px",
                    borderRadius: "999px",
                    border: `1px solid ${positionColor(playerProfile.position)}`,
                    background:
                      "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(15,23,42,0.8))",
                    color: "#FFFFFF",
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  {playerProfile.position}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section style={{ marginTop: "1rem" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
            gap: "0.75rem",
            maxWidth: "calc(100% - 2.5rem)",
            margin: "0 auto",
          }}
        >
          {statColumns.map((stat) => (
            <div key={stat.key} style={statCardStyle}>
              <div style={{ fontSize: "1.6rem", fontWeight: 700, lineHeight: 1 }}>
                {currentPlayerStats[stat.key]}
              </div>
              <div style={statLabelStyle}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {isStaffEditor ? (
        <section
          className="glass-panel"
          style={{
            padding: "1rem",
            marginTop: "1.25rem",
            width: "calc(100% - 1rem)",
            marginInline: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "1rem",
              alignItems: "center",
              flexWrap: "wrap",
              marginBottom: "1rem",
            }}
          >
            <div>
              <div style={{ color: "var(--accent-light)", marginBottom: "0.35rem" }}>
                Postgame Entry
              </div>
              <h2 style={{ fontSize: "1.6rem" }}>Captain stat console</h2>
            </div>
            <div style={{ color: "var(--text-muted)", maxWidth: "520px" }}>
              Captains and assistants can log goals, hits, and penalties after the game.
              Goals can include assists or be marked unassisted. Penalties default to standard PIM,
              but can be edited before saving.
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.55rem", flexWrap: "wrap", marginBottom: "1rem" }}>
            {(["goal", "penalty", "hit"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setEventType(type)}
                style={entryTabStyle(eventType === type)}
              >
                {type}
              </button>
            ))}
          </div>

          {eventType === "goal" ? (
            <div style={entryGridStyle}>
              <select value={goalScorerId} onChange={(event) => setGoalScorerId(event.target.value)} style={inputStyle}>
                <option value="">Select scorer</option>
                {rosterOptions.map((player) => (
                  <option key={player.player_id} value={player.player_id}>
                    {player.name}
                  </option>
                ))}
              </select>

              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={goalUnassisted}
                  onChange={(event) => setGoalUnassisted(event.target.checked)}
                />
                Unassisted
              </label>

              {!goalUnassisted ? (
                <>
                  <select value={goalAssistOneId} onChange={(event) => setGoalAssistOneId(event.target.value)} style={inputStyle}>
                    <option value="">Primary assist</option>
                    {rosterOptions.map((player) => (
                      <option key={player.player_id} value={player.player_id}>
                        {player.name}
                      </option>
                    ))}
                  </select>

                  <select value={goalAssistTwoId} onChange={(event) => setGoalAssistTwoId(event.target.value)} style={inputStyle}>
                    <option value="">Secondary assist</option>
                    {rosterOptions.map((player) => (
                      <option key={player.player_id} value={player.player_id}>
                        {player.name}
                      </option>
                    ))}
                  </select>
                </>
              ) : null}
            </div>
          ) : null}

          {eventType === "penalty" ? (
            <div style={entryGridStyle}>
              <select value={penaltyPlayerId} onChange={(event) => setPenaltyPlayerId(event.target.value)} style={inputStyle}>
                <option value="">Penalized player</option>
                {rosterOptions.map((player) => (
                  <option key={player.player_id} value={player.player_id}>
                    {player.name}
                  </option>
                ))}
              </select>

              <select
                value={penaltyType}
                onChange={(event) => handlePenaltyTypeChange(event.target.value)}
                style={inputStyle}
              >
                {Object.keys(penaltyDefaults).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min={0}
                value={penaltyMinutes}
                onChange={(event) => setPenaltyMinutes(Number(event.target.value))}
                style={inputStyle}
              />
            </div>
          ) : null}

          {eventType === "hit" ? (
            <div style={entryGridStyle}>
              <select value={hitPlayerId} onChange={(event) => setHitPlayerId(event.target.value)} style={inputStyle}>
                <option value="">Hitting player</option>
                {rosterOptions.map((player) => (
                  <option key={player.player_id} value={player.player_id}>
                    {player.name}
                  </option>
                ))}
              </select>

              <input
                placeholder="Other team number (optional)"
                value={hitTargetNumber}
                onChange={(event) => setHitTargetNumber(event.target.value)}
                style={inputStyle}
              />
            </div>
          ) : null}

          <div style={{ display: "flex", justifyContent: "stretch", marginTop: "1rem" }}>
            <button onClick={handleSaveEvent} style={saveButtonStyle}>
              Save stat event
            </button>
          </div>
        </section>
      ) : null}

      <section style={{ display: "grid", gap: "1rem", marginTop: "1.25rem" }}>
        <StatsTable
          title="Team Stats"
          rows={sortData(displayedTeamStats, teamSortField, teamSortDir)}
          playerId={playerId}
          sortField={teamSortField}
          sortDir={teamSortDir}
          onSortFieldChange={setTeamSortField}
          onSortDirChange={setTeamSortDir}
          routerPush={router.push}
        />

        <StatsTable
          title="League Stats"
          rows={sortData(displayedLeagueStats, leagueSortField, leagueSortDir)}
          playerId={playerId}
          sortField={leagueSortField}
          sortDir={leagueSortDir}
          onSortFieldChange={setLeagueSortField}
          onSortDirChange={setLeagueSortDir}
          routerPush={router.push}
        />
      </section>
    </main>
  );
}

function StatsTable({
  title,
  rows,
  playerId,
  sortField,
  sortDir,
  onSortFieldChange,
  onSortDirChange,
  routerPush,
}: {
  title: string;
  rows: StatRow[];
  playerId: string;
  sortField: keyof StatRow;
  sortDir: "asc" | "desc";
  onSortFieldChange: (field: keyof StatRow) => void;
  onSortDirChange: (dir: "asc" | "desc") => void;
  routerPush: (href: string) => void;
}) {
  return (
    <section
      className="glass-panel"
      style={{
        padding: "0.8rem",
        width: "calc(100% - 1.5rem)",
        margin: "0 auto",
        overflow: "visible",
      }}
    >
      <h2 style={{ fontSize: "1.3rem", marginBottom: "0.75rem" }}>{title}</h2>

      <div>
        <div style={{ ...tableHeaderStyle, ...tableHeaderStickyStyle }}>
          <div style={{ textAlign: "left" }}>Name</div>
          {statColumns.map((col) => {
            const active = sortField === col.key;
            const arrow = active ? (sortDir === "desc" ? "↓" : "↑") : "";

            return (
              <div
                key={col.key}
                onClick={() => {
                  if (active) {
                    onSortDirChange(sortDir === "desc" ? "asc" : "desc");
                  } else {
                    onSortFieldChange(col.key);
                    onSortDirChange("desc");
                  }
                }}
                style={sortableHeaderStyle}
              >
                {col.label} {arrow}
              </div>
            );
          })}
        </div>

        {rows.map((player) => {
          const isCurrent = player.player_id === playerId;

          return (
            <div
              key={player.player_id}
              onClick={() => routerPush(`/dashboard/player/${player.player_id}`)}
              style={{
                display: "grid",
                gridTemplateColumns: statsGridTemplate,
                padding: "0.68rem 0.55rem",
                alignItems: "center",
                cursor: "pointer",
                background: isCurrent
                  ? "linear-gradient(90deg, rgba(96,165,250,0.18), rgba(37,99,235,0.08))"
                  : "transparent",
                borderBottom: "1px solid rgba(31,41,55,0.9)",
                borderLeft: isCurrent
                  ? "3px solid rgba(125,211,252,0.85)"
                  : "3px solid transparent",
                fontWeight: isCurrent ? 700 : 400,
                textAlign: "center",
                fontSize: "0.88rem",
              }}
            >
              <div style={{ textAlign: "left", overflow: "hidden" }}>{player.name}</div>
              <div>{player.points}</div>
              <div>{player.goals}</div>
              <div>{player.assists}</div>
              <div>{player.pim}</div>
              <div>{player.hits}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

const statCardStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,64,175,0.9))",
  padding: "0.9rem 0.75rem",
  borderRadius: "var(--radius)",
  border: "1px solid rgba(148,163,184,0.4)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
};

const statLabelStyle: React.CSSProperties = {
  marginTop: "0.25rem",
  fontSize: "0.8rem",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "var(--text-muted)",
};

const entryGridStyle: React.CSSProperties = {
  display: "grid",
  gap: "0.75rem",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  minHeight: "48px",
  padding: "0.8rem 0.85rem",
  borderRadius: "14px",
  border: "1px solid var(--line)",
  background: "rgba(7, 17, 31, 0.72)",
  color: "var(--text)",
  fontSize: "16px",
};

const checkboxLabelStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.6rem",
  color: "var(--text)",
};

function entryTabStyle(active: boolean): React.CSSProperties {
  return {
    background: active ? "rgba(249, 115, 22, 0.18)" : "var(--surface-light)",
    border: `1px solid ${active ? "rgba(249,115,22,0.3)" : "var(--line)"}`,
    color: "var(--text)",
    padding: "0.65rem 0.9rem",
    borderRadius: "999px",
    textTransform: "capitalize",
  };
}

const saveButtonStyle: React.CSSProperties = {
  width: "100%",
  minHeight: "50px",
  padding: "0.9rem 1rem",
  borderRadius: "14px",
  background: "linear-gradient(135deg, #f97316, #ea580c)",
  color: "white",
  fontWeight: 700,
};

const statsGridTemplate = "minmax(92px, 1.3fr) repeat(5, minmax(30px, 0.48fr))";

const tableHeaderStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: statsGridTemplate,
  padding: "0.45rem 0.55rem",
  color: "#9CA3AF",
  fontSize: "0.68rem",
  fontWeight: 600,
  textAlign: "center",
  boxShadow: "0 2px 4px rgba(0,0,0,0.35)",
};

const sortableHeaderStyle: React.CSSProperties = {
  cursor: "pointer",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: "4px",
  userSelect: "none",
};

const tableHeaderStickyStyle: React.CSSProperties = {
  position: "sticky",
  top: "calc(var(--app-topbar-height) - 12px)",
  zIndex: 30,
  background: "rgba(13, 24, 42, 0.98)",
  boxShadow: "0 8px 20px rgba(1, 5, 16, 0.28)",
  marginBottom: "0.2rem",
};
