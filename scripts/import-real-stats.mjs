import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, ".env.local");
const PEAKS_SKATERS_PATH = "/tmp/peaks_rookie_skaters.html";
const PEAKS_GOALIES_PATH = "/tmp/peaks_rookie_goalies.html";
const RINK_RATS_PATH = "/tmp/rinkrats_sheet_117099024_sheet.html";
const OUTPUT_SQL_PATH = path.join(
  ROOT,
  "supabase",
  "migrations",
  "20260331_import_real_2026a_stats.sql",
);
const OUTPUT_REPORT_PATH = path.join(ROOT, "supabase", "import-real-stats-report.json");
const LEAGUE_SEASON_KEYS = {
  peaksrookie: "2026a_peaks",
  rinkrats: "2026a_rinkrats",
};

function loadEnv(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const env = {};
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) continue;
    const [, key, value] = match;
    env[key] = value.replace(/^['"]|['"]$/g, "");
  }
  return env;
}

const env = loadEnv(ENV_PATH);
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase credentials in .env.local");
}

const POSITION_UPDATES = {
  goalie: "G",
  g: "G",
  p: "C",
};

const TEAM_NAME_ALIASES = new Map([
  ["bungulators", "bungalators"],
  ["ratbastards", "rb"],
]);

function normalizeText(value) {
  return (value ?? "")
    .toString()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&amp;/g, "and")
    .replace(/[^a-z0-9]+/g, "");
}

function normalizeTeamName(value) {
  const normalized = normalizeText(value);
  return TEAM_NAME_ALIASES.get(normalized) ?? normalized;
}

function escapeSql(value) {
  return (value ?? "").toString().replace(/'/g, "''");
}

function toNumber(value) {
  if (value === null || value === undefined) return null;
  const trimmed = value.toString().trim();
  if (!trimmed) return null;
  const numeric = Number(trimmed.replace(/^(\.\d+)$/, "0$1"));
  return Number.isFinite(numeric) ? numeric : null;
}

function parseHtmlTableRows(html) {
  const rows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)];
  return rows.map((row) => {
    const cells = [...row[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((cell) =>
      decodeHtml(cell[1]),
    );
    return cells;
  });
}

function decodeHtml(value) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function parsePlayerLine(value) {
  const match = value.match(/^(.*?)\s*-\s*#\s*([A-Za-z0-9]+)$/);
  if (!match) {
    return { name: value.trim(), number: null };
  }

  const [, name, number] = match;
  const parsedNumber = Number(number);
  return {
    name: name.trim(),
    number: Number.isFinite(parsedNumber) ? parsedNumber : null,
  };
}

function parsePeaksSkaters(filePath) {
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const rows = parseHtmlTableRows(parsed.content);
  return rows
    .filter(
      (cells) =>
        cells.length >= 12 &&
        cells[0] !== "Rk" &&
        cells[1] &&
        cells[3] &&
        normalizeText(cells[4]) !== "g",
    )
    .map((cells) => ({
      source: "Peaks Rookie",
      leagueKey: "peaksrookie",
      teamName: cells[3],
      name: cells[1].replace(/\s+#\d+$/, "").trim(),
      number: toNumber(cells[2]),
      rawPosition: cells[4],
      position: POSITION_UPDATES[normalizeText(cells[4])] ?? "C",
      gp: toNumber(cells[5]) ?? 0,
      goals: toNumber(cells[6]) ?? 0,
      assists: toNumber(cells[7]) ?? 0,
      points: toNumber(cells[8]) ?? 0,
      pim: toNumber(cells[10]) ?? 0,
      wins: 0,
      losses: 0,
      ties: 0,
      savePct: null,
      gaa: null,
      goalie: normalizeText(cells[4]) === "g",
    }));
}

function parsePeaksGoalies(filePath) {
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const rows = parseHtmlTableRows(parsed.content);
  return rows
    .filter((cells) => cells.length >= 18 && cells[0] !== "Rk" && cells[1] && cells[3])
    .map((cells) => ({
      source: "Peaks Rookie",
      leagueKey: "peaksrookie",
      teamName: cells[3],
      name: cells[1].replace(/\s+#\d+$/, "").trim(),
      number: toNumber(cells[2]),
      rawPosition: "G",
      position: "G",
      gp: toNumber(cells[4]) ?? 0,
      goals: 0,
      assists: 0,
      points: 0,
      pim: toNumber(cells[15]) ?? 0,
      wins: toNumber(cells[5]) ?? 0,
      losses: toNumber(cells[6]) ?? 0,
      ties: toNumber(cells[7]) ?? 0,
      savePct: toNumber(cells[13]),
      gaa: toNumber(cells[11]),
      goalie: true,
    }));
}

function parseRinkRats(filePath) {
  const html = fs.readFileSync(filePath, "utf8");
  const rows = parseHtmlTableRows(html);
  const imports = [];
  let currentTeamName = null;
  let currentMode = null;

  for (const cells of rows) {
    const values = /^\d+$/.test(cells[0] ?? "") ? cells.slice(1) : cells;
    if (values.length < 6) continue;
    const firstCell = values[0];

    if (firstCell === "Team Standings") {
      currentTeamName = null;
      currentMode = null;
      continue;
    }

    if (firstCell.endsWith(" Players")) {
      currentTeamName = firstCell.replace(/\s+Players$/, "").trim();
      currentMode = "players";
      continue;
    }

    if (firstCell === "Goalie") {
      currentMode = "goalie";
      continue;
    }

    if (!currentTeamName || !currentMode) continue;
    if (!firstCell.includes("#")) continue;

    const { name, number } = parsePlayerLine(firstCell);

    if (currentMode === "players") {
      imports.push({
        source: "Rink Rats",
        leagueKey: "rinkrats",
        teamName: currentTeamName,
        name,
        number,
        rawPosition: "P",
        position: "C",
        gp: toNumber(values[1]) ?? 0,
        goals: toNumber(values[2]) ?? 0,
        assists: toNumber(values[3]) ?? 0,
        points: toNumber(values[4]) ?? 0,
        pim: toNumber(values[5]) ?? 0,
        wins: 0,
        losses: 0,
        ties: 0,
        savePct: null,
        gaa: null,
        goalie: false,
      });
      continue;
    }

    imports.push({
      source: "Rink Rats",
      leagueKey: "rinkrats",
      teamName: currentTeamName,
      name,
      number,
      rawPosition: "G",
      position: "G",
      gp: toNumber(values[1]) ?? 0,
      goals: 0,
      assists: 0,
      points: 0,
      pim: 0,
      wins: toNumber(values[2]) ?? 0,
      losses: Math.max((toNumber(values[1]) ?? 0) - (toNumber(values[2]) ?? 0), 0),
      ties: 0,
      savePct: toNumber(values[5]),
      gaa: toNumber(values[4]),
      goalie: true,
    });
  }

  return imports;
}

function dedupeImportRows(rows) {
  const seen = new Set();
  return rows.filter((row) => {
    const key = [
      row.source,
      row.teamName,
      row.name,
      row.number ?? "",
      row.position,
      row.gp,
      row.goals,
      row.assists,
      row.points,
      row.pim,
      row.wins,
      row.losses,
      row.ties,
      row.savePct ?? "",
      row.gaa ?? "",
    ].join("|");

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function consolidateMatchedRows(rows) {
  const grouped = new Map();

  for (const row of rows) {
    const key = `${row.playerId}:${row.seasonKey}:${row.teamId}`;
    if (!grouped.has(key)) {
      grouped.set(key, { ...row });
      continue;
    }

    const current = grouped.get(key);
    current.gp = Math.max(current.gp ?? 0, row.gp ?? 0);
    current.goals = (current.goals ?? 0) + (row.goals ?? 0);
    current.assists = (current.assists ?? 0) + (row.assists ?? 0);
    current.points = (current.points ?? 0) + (row.points ?? 0);
    current.pim = (current.pim ?? 0) + (row.pim ?? 0);
    current.wins = Math.max(current.wins ?? 0, row.wins ?? 0);
    current.losses = Math.max(current.losses ?? 0, row.losses ?? 0);
    current.ties = Math.max(current.ties ?? 0, row.ties ?? 0);
    current.savePct = row.savePct ?? current.savePct;
    current.gaa = row.gaa ?? current.gaa;
    current.goalie = current.goalie || row.goalie;
    current.position = current.goalie ? "G" : current.position;
  }

  return [...grouped.values()];
}

async function supabaseFetch(resource, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${resource}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(options.headers ?? {}),
    },
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Supabase request failed for ${resource}: ${response.status} ${text}`);
  }

  return text ? JSON.parse(text) : null;
}

async function loadSupabaseRoster() {
  const [teams, players, playerTeams, leagues] = await Promise.all([
    supabaseFetch("teams?select=id,name,league_id,league&order=name"),
    supabaseFetch("players?select=id,name,number,position,team_id,created_at&order=created_at"),
    supabaseFetch("player_teams?select=player_id,team_id"),
    supabaseFetch("leagues?select=id,name,season"),
  ]);

  return { teams, players, playerTeams, leagues };
}

function buildTeamIndexes({ teams, players, playerTeams }) {
  const teamByLeagueAndName = new Map();
  for (const team of teams) {
    const leagueKey = normalizeText(team.league);
    const teamKey = normalizeTeamName(team.name);
    teamByLeagueAndName.set(`${leagueKey}:${teamKey}`, team);
  }

  const membershipMap = new Map();
  for (const playerTeam of playerTeams) {
    if (!membershipMap.has(playerTeam.team_id)) {
      membershipMap.set(playerTeam.team_id, new Set());
    }
    membershipMap.get(playerTeam.team_id).add(playerTeam.player_id);
  }

  const playersById = new Map(players.map((player) => [player.id, player]));
  const candidatesByTeamAndName = new Map();

  function addCandidate(teamId, player) {
    const key = `${teamId}:${normalizeText(player.name)}`;
    if (!candidatesByTeamAndName.has(key)) {
      candidatesByTeamAndName.set(key, []);
    }
    candidatesByTeamAndName.get(key).push(player);
  }

  for (const [teamId, playerIds] of membershipMap.entries()) {
    for (const playerId of playerIds) {
      const player = playersById.get(playerId);
      if (player?.name) addCandidate(teamId, player);
    }
  }

  for (const player of players) {
    if (player.team_id && player.name) {
      addCandidate(player.team_id, player);
    }
  }

  return { teamByLeagueAndName, candidatesByTeamAndName };
}

function matchImportedRows(importRows, indexes) {
  const matchedRows = [];
  const unmatchedRows = [];
  const goaliePlayerIds = new Set();

  for (const row of importRows) {
    const leagueKey = normalizeText(row.source);
    const team = indexes.teamByLeagueAndName.get(
      `${leagueKey}:${normalizeTeamName(row.teamName)}`,
    );

    if (!team) {
      unmatchedRows.push({ ...row, reason: "team_not_found" });
      continue;
    }

    const candidates =
      indexes.candidatesByTeamAndName.get(`${team.id}:${normalizeText(row.name)}`) ?? [];

    let chosen = null;
    if (candidates.length === 1) {
      chosen = candidates[0];
    } else if (candidates.length > 1 && row.number !== null) {
      chosen = candidates.find((candidate) => Number(candidate.number) === Number(row.number)) ?? null;
    } else if (candidates.length > 1) {
      chosen = candidates[0];
    }

    if (!chosen) {
      unmatchedRows.push({ ...row, teamId: team.id, reason: "player_not_found" });
      continue;
    }

    if (row.goalie) goaliePlayerIds.add(chosen.id);

    matchedRows.push({
      ...row,
      seasonKey: LEAGUE_SEASON_KEYS[row.leagueKey] ?? "2026a",
      teamId: team.id,
      leagueId: team.league_id,
      playerId: chosen.id,
      existingPosition: chosen.position,
    });
  }

  return { matchedRows, unmatchedRows, goaliePlayerIds };
}

function buildSql({ matchedRows, goaliePlayerIds, teams, leagues }) {
  const teamIds = [...new Set(matchedRows.map((row) => row.teamId))];
  const seasonKeys = [...new Set(matchedRows.map((row) => row.seasonKey))];
  const leagueSeasonUpdates = new Map();
  for (const row of matchedRows) {
    leagueSeasonUpdates.set(row.leagueId, row.seasonKey);
  }
  const teamIdList = teamIds.map((id) => `'${escapeSql(id)}'`).join(", ");
  const seasonKeyList = seasonKeys.map((season) => `'${escapeSql(season)}'`).join(", ");
  const goalieIdList = [...goaliePlayerIds].map((id) => `'${escapeSql(id)}'`).join(", ");

  const inserts = matchedRows
    .map(
      (row) => `(
  '${escapeSql(row.playerId)}',
  '${escapeSql(row.seasonKey)}',
  ${row.gp},
  ${row.goals},
  ${row.assists},
  ${row.points},
  ${row.pim},
  ${row.savePct ?? "null"},
  ${row.gaa ?? "null"},
  ${row.wins},
  ${row.losses},
  ${row.ties},
  '${escapeSql(row.teamId)}'
)`,
    )
    .join(",\n");

  const sql = `-- Generated by scripts/import-real-stats.mjs on ${new Date().toISOString()}
-- Imports real 2026a stats for Peaks Rookie and Rink Rats.

begin;

update public.players
set position = 'C'
where position = 'P';

${goalieIdList ? `update public.players set position = 'G' where id in (${goalieIdList});` : "-- No goalie position updates needed."}

${[...leagueSeasonUpdates.entries()]
  .map(
    ([leagueId, seasonKey]) =>
      `update public.leagues set season = '${escapeSql(seasonKey)}' where id = '${escapeSql(leagueId)}';`,
  )
  .join("\n")}

delete from public.season_stats
where season in (${seasonKeyList})
  and team_id in (${teamIdList});

insert into public.season_stats (
  player_id,
  season,
  gp,
  goals,
  assists,
  points,
  pim,
  save_pct,
  gaa,
  wins,
  losses,
  ties,
  team_id
)
values
${inserts};

commit;
`;

  const summary = {
    seasons: seasonKeys,
    teams: teams.filter((team) => teamIds.includes(team.id)).map((team) => team.name),
    leagues: leagues
      .filter((league) => [...leagueSeasonUpdates.keys()].includes(league.id))
      .map((league) => ({ name: league.name, season: leagueSeasonUpdates.get(league.id) })),
    rowCount: matchedRows.length,
    goalieUpdates: goaliePlayerIds.size,
  };

  return { sql, summary };
}

async function applyDirectWrites({ matchedRows, goaliePlayerIds }) {
  const teamIds = [...new Set(matchedRows.map((row) => row.teamId))];
  const seasonKeys = [...new Set(matchedRows.map((row) => row.seasonKey))];
  const leagueSeasonUpdates = new Map();
  for (const row of matchedRows) {
    leagueSeasonUpdates.set(row.leagueId, row.seasonKey);
  }

  await supabaseFetch(
    `players?position=eq.P`,
    {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ position: "C" }),
    },
  );

  for (const goalieId of goaliePlayerIds) {
    await supabaseFetch(
      `players?id=eq.${goalieId}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ position: "G" }),
      },
    );
  }

  if (teamIds.length > 0) {
    const deleteFilter = `season=in.(${seasonKeys.join(",")})&team_id=in.(${teamIds.join(",")})`;
    await supabaseFetch(`season_stats?${deleteFilter}`, {
      method: "DELETE",
      headers: { Prefer: "return=minimal" },
    });
  }

  for (const [leagueId, seasonKey] of leagueSeasonUpdates.entries()) {
    await supabaseFetch(`leagues?id=eq.${leagueId}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ season: seasonKey }),
    });
  }

  const payload = matchedRows.map((row) => ({
    player_id: row.playerId,
    season: row.seasonKey,
    gp: row.gp,
    goals: row.goals,
    assists: row.assists,
    points: row.points,
    pim: row.pim,
    save_pct: row.savePct,
    gaa: row.gaa,
    wins: row.wins,
    losses: row.losses,
    ties: row.ties,
    team_id: row.teamId,
  }));

  const chunkSize = 200;
  for (let index = 0; index < payload.length; index += chunkSize) {
    const chunk = payload.slice(index, index + chunkSize);
    await supabaseFetch("season_stats", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(chunk),
    });
  }
}

async function main() {
  const importRows = dedupeImportRows([
    ...parsePeaksSkaters(PEAKS_SKATERS_PATH),
    ...parsePeaksGoalies(PEAKS_GOALIES_PATH),
    ...parseRinkRats(RINK_RATS_PATH),
  ]);

  const roster = await loadSupabaseRoster();
  const indexes = buildTeamIndexes(roster);
  const { matchedRows, unmatchedRows, goaliePlayerIds } = matchImportedRows(importRows, indexes);
  const consolidatedRows = consolidateMatchedRows(matchedRows);
  const { sql, summary } = buildSql({
    matchedRows: consolidatedRows,
    goaliePlayerIds,
    teams: roster.teams,
    leagues: roster.leagues,
  });

  fs.writeFileSync(OUTPUT_SQL_PATH, sql);
  fs.writeFileSync(
    OUTPUT_REPORT_PATH,
    JSON.stringify(
      {
        summary,
        matchedRows: consolidatedRows.length,
        unmatchedCount: unmatchedRows.length,
        unmatchedRows,
      },
      null,
      2,
    ),
  );

  const shouldWrite = process.argv.includes("--write");
  if (shouldWrite) {
    await applyDirectWrites({ matchedRows: consolidatedRows, goaliePlayerIds });
  }

  console.log(
    JSON.stringify(
      {
        outputSqlPath: OUTPUT_SQL_PATH,
        outputReportPath: OUTPUT_REPORT_PATH,
        matchedRows: consolidatedRows.length,
        unmatchedRows: unmatchedRows.length,
        wroteToSupabase: shouldWrite,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
