"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useTeam } from "@/context/TeamContext";

type LeaguePlayerRow = {
  membershipId: string;
  playerTeamId: string | null;
  playerId: string;
  name: string;
  number: number | null;
  position: string | null;
  teamName: string;
  teamId: string | null;
  role: string;
  assignmentStatus: string;
};

type TeamSummary = {
  id: string;
  name: string;
  logoUrl: string | null;
  feedPosts: Array<{
    id: string;
    post_type: string;
    title: string;
    created_at: string;
  }>;
  films: Array<{
    id: string;
    source_url: string;
    created_at: string;
    games_v2?: { date: string | null } | { date: string | null }[] | null;
  }>;
};

type TeamRow = {
  id: string;
  name: string;
  logo_url: string | null;
};

const leadershipRoles = ["player", "assistant_captain", "captain"] as const;
const assignmentStatuses = ["rostered", "sub_list"] as const;

export default function CommissionerPage() {
  const router = useRouter();
  const { selectedTeam } = useTeam();

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [leagueName, setLeagueName] = useState<string>("League");
  const [players, setPlayers] = useState<LeaguePlayerRow[]>([]);
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    async function loadCommissionerHub() {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;

      if (!session) {
        router.push("/auth/login");
        return;
      }

      if (!selectedTeam?.leagueId) {
        setLoading(false);
        return;
      }

      const [{ data: ownedTeams }, { data: leagueRow }] = await Promise.all([
        supabase
          .from("teams")
          .select("id")
          .eq("league_id", selectedTeam.leagueId)
          .eq("owner_id", session.user.id)
          .limit(1),
        supabase
          .from("leagues")
          .select("name")
          .eq("id", selectedTeam.leagueId)
          .maybeSingle(),
      ]);

      const canManage =
        (ownedTeams?.length ?? 0) > 0 || selectedTeam.role === "commissioner";

      setAuthorized(canManage);
      setLeagueName(leagueRow?.name ?? "League");

      if (!canManage) {
        setLoading(false);
        return;
      }

      const { data: teamRows } = await supabase
        .from("teams")
        .select("id, name, logo_url")
        .eq("league_id", selectedTeam.leagueId)
        .order("name");

      const safeTeams = (teamRows ?? []) as TeamRow[];
      const teamIds = safeTeams.map((team) => team.id);

      const [{ data: membershipRows }, { data: playerTeamRows }, { data: feedRows }, { data: filmRows }] =
        await Promise.all([
          supabase
            .from("league_memberships")
            .select("id, player_id, status, assigned_team_id, players(id, name, number, position)")
            .eq("league_id", selectedTeam.leagueId),
          supabase
            .from("player_teams")
            .select("id, player_id, team_id, role, assignment_status")
            .eq("league_id", selectedTeam.leagueId),
          teamIds.length
            ? supabase
                .from("team_feed_posts")
                .select("id, team_id, post_type, title, created_at")
                .in("team_id", teamIds)
                .order("created_at", { ascending: false })
            : Promise.resolve({ data: [] }),
          teamIds.length
            ? supabase
                .from("game_films")
                .select("id, game_id, source_url, created_at, games_v2(date)")
                .in("game_id", (
                  await supabase
                    .from("games_v2")
                    .select("id")
                    .eq("league_id", selectedTeam.leagueId)
                ).data?.map((row) => row.id) ?? [])
                .order("created_at", { ascending: false })
            : Promise.resolve({ data: [] }),
        ]);

      const teamLookup = new Map(safeTeams.map((team) => [team.id, team]));
      const membershipList = ((membershipRows ?? []) as Array<{
        id: string;
        player_id: string;
        status: string;
        assigned_team_id: string | null;
        players:
          | { id: string; name: string | null; number: number | null; position: string | null }
          | { id: string; name: string | null; number: number | null; position: string | null }[]
          | null;
      }>).map((row) => {
        const player = Array.isArray(row.players) ? row.players[0] : row.players;
        const playerTeam = (playerTeamRows ?? []).find(
          (entry) => entry.player_id === row.player_id && entry.team_id === row.assigned_team_id
        ) as
          | {
              id: string;
              player_id: string;
              team_id: string | null;
              role: string | null;
              assignment_status: string | null;
            }
          | undefined;

        return {
          membershipId: row.id,
          playerTeamId: playerTeam?.id ?? null,
          playerId: row.player_id,
          name: player?.name ?? "Unnamed Player",
          number: player?.number ?? null,
          position: player?.position ?? null,
          teamName: row.assigned_team_id ? teamLookup.get(row.assigned_team_id)?.name ?? "Unassigned" : "Unassigned",
          teamId: row.assigned_team_id ?? null,
          role: playerTeam?.role ?? "player",
          assignmentStatus: playerTeam?.assignment_status ?? row.status,
        } satisfies LeaguePlayerRow;
      });

      const feedByTeam = new Map<string, TeamSummary["feedPosts"]>();
      for (const row of (feedRows ?? []) as Array<{ team_id: string; id: string; post_type: string; title: string; created_at: string }>) {
        feedByTeam.set(row.team_id, [...(feedByTeam.get(row.team_id) ?? []), row]);
      }

      const filmsByGameDate = (filmRows ?? []) as TeamSummary["films"];
      const nextTeams = safeTeams.map((team) => ({
        id: team.id,
        name: team.name,
        logoUrl: team.logo_url ?? null,
        feedPosts: (feedByTeam.get(team.id) ?? []).slice(0, 3),
        films: filmsByGameDate.slice(0, 3),
      }));

      setPlayers(
        membershipList.sort((a, b) => {
          if (a.teamName !== b.teamName) return a.teamName.localeCompare(b.teamName);
          return a.name.localeCompare(b.name);
        })
      );
      setTeams(nextTeams);
      setLoading(false);
    }

    loadCommissionerHub();
  }, [router, selectedTeam]);

  const overview = useMemo(() => {
    return {
      players: players.length,
      captains: players.filter((player) => player.role === "captain").length,
      subs: players.filter((player) => player.assignmentStatus === "sub_list").length,
      teams: teams.length,
    };
  }, [players, teams.length]);

  async function updatePlayerRole(player: LeaguePlayerRow, nextRole: string) {
    if (!player.playerTeamId) return;

    try {
      setSavingKey(`${player.playerId}-role`);
      const { error } = await supabase
        .from("player_teams")
        .update({ role: nextRole })
        .eq("id", player.playerTeamId);

      if (error) throw error;

      setPlayers((current) =>
        current.map((entry) =>
          entry.playerId === player.playerId ? { ...entry, role: nextRole } : entry
        )
      );
    } finally {
      setSavingKey(null);
    }
  }

  async function updateAssignmentStatus(player: LeaguePlayerRow, nextStatus: string) {
    try {
      setSavingKey(`${player.playerId}-status`);

      if (player.playerTeamId) {
        const { error: ptError } = await supabase
          .from("player_teams")
          .update({ assignment_status: nextStatus })
          .eq("id", player.playerTeamId);
        if (ptError) throw ptError;
      }

      const { error: lmError } = await supabase
        .from("league_memberships")
        .update({ status: nextStatus === "sub_list" ? "sub_list" : "assigned_team" })
        .eq("id", player.membershipId);
      if (lmError) throw lmError;

      setPlayers((current) =>
        current.map((entry) =>
          entry.playerId === player.playerId
            ? { ...entry, assignmentStatus: nextStatus }
            : entry
        )
      );
    } finally {
      setSavingKey(null);
    }
  }

  if (loading) {
    return (
      <main className="center-screen">
        <p>Loading commissioner hub...</p>
      </main>
    );
  }

  if (!authorized) {
    return (
      <main className="page-shell" style={{ paddingTop: "1rem" }}>
        <section className="glass-panel" style={{ padding: "1.1rem" }}>
          <Link href="/dashboard/profile" style={{ color: "#93c5fd" }}>
            Back to profile
          </Link>
          <h1 style={{ fontSize: "1.55rem", marginTop: "0.8rem" }}>Commissioner Hub</h1>
          <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>
            This workspace is only available to the commissioner for the selected league.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell" style={{ paddingTop: "1rem", paddingBottom: "6rem" }}>
      <section className="glass-panel" style={{ padding: "1.15rem", marginBottom: "1rem" }}>
        <Link href="/dashboard/profile" style={{ color: "#93c5fd" }}>
          Back to profile
        </Link>
        <div style={{ color: "var(--accent-light)", marginTop: "0.9rem", fontSize: "0.82rem" }}>
          Commissioner Hub
        </div>
        <h1 style={{ fontSize: "1.75rem", marginTop: "0.25rem" }}>{leagueName}</h1>
        <p style={{ color: "var(--text-muted)", marginTop: "0.45rem" }}>
          Manage league-wide player roles and review each team’s feed and film. Team chat stays team-only.
        </p>
      </section>

      <section style={overviewGridStyle}>
        <OverviewTile label="Players" value={overview.players} />
        <OverviewTile label="Captains" value={overview.captains} />
        <OverviewTile label="Subs" value={overview.subs} />
        <OverviewTile label="Teams" value={overview.teams} />
      </section>

      <section className="glass-panel" style={{ padding: "1rem", marginTop: "1rem" }}>
        <h2 style={{ fontSize: "1.35rem", marginBottom: "0.8rem" }}>League Players</h2>
        <div style={{ display: "grid", gap: "0.85rem" }}>
          {players.map((player) => (
            <article key={player.playerId} style={playerAdminCardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "0.8rem", alignItems: "start" }}>
                <div>
                  <div style={{ fontWeight: 800 }}>
                    {player.name} {player.number ? `#${player.number}` : ""}
                  </div>
                  <div style={{ color: "var(--text-muted)", marginTop: "0.18rem" }}>
                    {player.teamName} • {player.position ?? "C"}
                  </div>
                </div>
                <div style={statusPillStyle(player.assignmentStatus)}>
                  {player.assignmentStatus === "sub_list" ? "Sub" : "Roster"}
                </div>
              </div>

              <div style={{ marginTop: "0.85rem", display: "grid", gap: "0.55rem" }}>
                <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Role</div>
                <div style={roleButtonRowStyle}>
                  {leadershipRoles.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => updatePlayerRole(player, role)}
                      disabled={savingKey === `${player.playerId}-role` || !player.playerTeamId}
                      style={chipButtonStyle(player.role === role)}
                    >
                      {formatRole(role)}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: "0.85rem", display: "grid", gap: "0.55rem" }}>
                <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Status</div>
                <div style={roleButtonRowStyle}>
                  {assignmentStatuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => updateAssignmentStatus(player, status)}
                      disabled={savingKey === `${player.playerId}-status`}
                      style={chipButtonStyle(player.assignmentStatus === status)}
                    >
                      {status === "sub_list" ? "Sub" : "Roster"}
                    </button>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="glass-panel" style={{ padding: "1rem", marginTop: "1rem" }}>
        <h2 style={{ fontSize: "1.35rem", marginBottom: "0.8rem" }}>Team Feed and Film</h2>
        <div style={{ display: "grid", gap: "0.85rem" }}>
          {teams.map((team) => (
            <article key={team.id} style={teamReviewCardStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.8rem" }}>
                {team.logoUrl ? (
                  <img src={team.logoUrl} alt={team.name} style={teamLogoStyle} />
                ) : (
                  <div style={teamFallbackStyle}>{shortName(team.name)}</div>
                )}
                <div>
                  <div style={{ fontWeight: 800 }}>{team.name}</div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                    Feed and film visibility
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gap: "0.85rem" }}>
                <div>
                  <div style={contentLabelStyle}>Latest Feed</div>
                  {team.feedPosts.length ? (
                    <div style={{ display: "grid", gap: "0.45rem", marginTop: "0.45rem" }}>
                      {team.feedPosts.map((post) => (
                        <div key={post.id} style={contentRowStyle}>
                          <span>{post.title}</span>
                          <span style={{ color: "var(--text-muted)", textTransform: "capitalize" }}>
                            {post.post_type}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: "var(--text-muted)", marginTop: "0.45rem" }}>
                      No feed posts yet.
                    </div>
                  )}
                </div>

                <div>
                  <div style={contentLabelStyle}>Linked Film</div>
                  {team.films.length ? (
                    <div style={{ display: "grid", gap: "0.45rem", marginTop: "0.45rem" }}>
                      {team.films.map((film) => (
                        <a
                          key={film.id}
                          href={film.source_url}
                          target="_blank"
                          rel="noreferrer"
                          style={contentRowStyle}
                        >
                          <span>Full game film</span>
                          <span style={{ color: "#93c5fd" }}>Open</span>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: "var(--text-muted)", marginTop: "0.45rem" }}>
                      No film linked yet.
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function OverviewTile({ label, value }: { label: string; value: number }) {
  return (
    <div style={overviewTileStyle}>
      <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{value}</div>
      <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{label}</div>
    </div>
  );
}

function formatRole(role: string) {
  if (role === "assistant_captain") return "Assistant";
  if (role === "captain") return "Captain";
  return "Player";
}

function shortName(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
    .slice(0, 3);
}

function chipButtonStyle(active: boolean): CSSProperties {
  return {
    minHeight: "38px",
    padding: "0.45rem 0.75rem",
    borderRadius: "999px",
    background: active ? "rgba(56,189,248,0.16)" : "rgba(255,255,255,0.04)",
    border: `1px solid ${active ? "rgba(56,189,248,0.42)" : "rgba(148,163,184,0.16)"}`,
    color: "var(--text)",
    fontWeight: 700,
  };
}

function statusPillStyle(status: string): CSSProperties {
  return {
    padding: "0.3rem 0.65rem",
    borderRadius: "999px",
    background: status === "sub_list" ? "rgba(250,204,21,0.14)" : "rgba(34,197,94,0.14)",
    border: `1px solid ${status === "sub_list" ? "rgba(250,204,21,0.34)" : "rgba(34,197,94,0.34)"}`,
    color: "var(--text)",
    fontSize: "0.76rem",
    fontWeight: 700,
  };
}

const overviewGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "0.75rem",
};

const overviewTileStyle: CSSProperties = {
  padding: "0.95rem 1rem",
  borderRadius: "18px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(96,165,250,0.18)",
  textAlign: "center",
};

const playerAdminCardStyle: CSSProperties = {
  padding: "0.95rem",
  borderRadius: "18px",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(148,163,184,0.14)",
};

const roleButtonRowStyle: CSSProperties = {
  display: "flex",
  gap: "0.5rem",
  flexWrap: "wrap",
};

const teamReviewCardStyle: CSSProperties = {
  padding: "0.95rem",
  borderRadius: "18px",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(148,163,184,0.14)",
};

const teamLogoStyle: CSSProperties = {
  width: "44px",
  height: "44px",
  borderRadius: "999px",
  objectFit: "cover",
};

const teamFallbackStyle: CSSProperties = {
  width: "44px",
  height: "44px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  display: "grid",
  placeItems: "center",
  color: "var(--text-muted)",
  fontWeight: 800,
};

const contentLabelStyle: CSSProperties = {
  color: "var(--text-muted)",
  fontSize: "0.78rem",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

const contentRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "0.75rem",
  padding: "0.65rem 0.75rem",
  borderRadius: "14px",
  background: "rgba(7,17,31,0.72)",
  border: "1px solid rgba(148,163,184,0.12)",
  color: "var(--text)",
  textDecoration: "none",
};
