"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useTeam } from "@/context/TeamContext";

type GameRow = {
  id: string;
  league_id: string | null;
  season: string;
  date: string;
  home_team_id: string | null;
  away_team_id: string | null;
  home_score: number | null;
  away_score: number | null;
  is_playoff: boolean | null;
};

type TeamRow = {
  id: string;
  name: string;
  logo_url: string | null;
};

type RosterPlayer = {
  id: string;
  name: string | null;
  number: number | null;
  position: string | null;
  profile_pic_url: string | null;
};

type AvailabilityStatus = "in" | "out" | "unknown";

type AvailabilityEntry = {
  player: RosterPlayer;
  status: AvailabilityStatus;
};

type PreviousMatchup = {
  id: string;
  date: string;
  home_score: number | null;
  away_score: number | null;
};

export default function GameDetailsPage() {
  const params = useParams<{ gameId: string }>();
  const router = useRouter();
  const { selectedTeam } = useTeam();
  const gameId = params?.gameId;

  const [loading, setLoading] = useState(true);
  const [game, setGame] = useState<GameRow | null>(null);
  const [teamsById, setTeamsById] = useState<Record<string, TeamRow>>({});
  const [roster, setRoster] = useState<RosterPlayer[]>([]);
  const [previousMatchups, setPreviousMatchups] = useState<PreviousMatchup[]>([]);
  const [myStatus, setMyStatus] = useState<AvailabilityStatus>("in");
  const [linesOpen, setLinesOpen] = useState(false);

  useEffect(() => {
    if (!gameId) return;

    let active = true;

    async function loadGame() {
      const { data: gameRow } = await supabase
        .from("games_v2")
        .select(
          "id, league_id, season, date, home_team_id, away_team_id, home_score, away_score, is_playoff"
        )
        .eq("id", gameId)
        .maybeSingle();

      if (!active) return;

      setGame((gameRow as GameRow | null) ?? null);

      if (!gameRow) {
        setLoading(false);
        return;
      }

      const teamIds = [gameRow.home_team_id, gameRow.away_team_id].filter(Boolean) as string[];

      const [{ data: teamRows }, previousResult] = await Promise.all([
        supabase.from("teams").select("id, name, logo_url").in("id", teamIds),
        supabase
          .from("games_v2")
          .select("id, date, home_score, away_score")
          .eq("home_team_id", gameRow.home_team_id)
          .eq("away_team_id", gameRow.away_team_id)
          .not("home_score", "is", null)
          .not("away_score", "is", null)
          .order("date", { ascending: false })
          .limit(4),
      ]);

      if (!active) return;

      setTeamsById(
        Object.fromEntries(((teamRows ?? []) as TeamRow[]).map((team) => [team.id, team]))
      );
      setPreviousMatchups((previousResult.data ?? []) as PreviousMatchup[]);
      setLoading(false);
    }

    loadGame();

    return () => {
      active = false;
    };
  }, [gameId]);

  useEffect(() => {
    const teamId = selectedTeam?.id;

    if (!teamId) {
      return;
    }

    let active = true;

    async function loadRoster() {
      const { data } = await supabase
        .from("player_teams")
        .select("player_id, players(id, name, number, position, profile_pic_url)")
        .eq("team_id", teamId);

      if (!active) return;

      const nextRoster = ((data ?? []) as Array<{
        player_id: string | null;
        players:
          | {
              id: string;
              name: string | null;
              number: number | null;
              position: string | null;
              profile_pic_url: string | null;
            }
          | {
              id: string;
              name: string | null;
              number: number | null;
              position: string | null;
              profile_pic_url: string | null;
            }[]
          | null;
      }>)
        .map((row) => (Array.isArray(row.players) ? row.players[0] : row.players))
        .filter((player): player is RosterPlayer => Boolean(player?.id))
        .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));

      setRoster(nextRoster);
    }

    loadRoster();

    return () => {
      active = false;
    };
  }, [selectedTeam?.id]);

  const homeTeam = teamsById[game?.home_team_id ?? ""];
  const awayTeam = teamsById[game?.away_team_id ?? ""];
  const isFinal = Boolean(game && game.home_score !== null && game.away_score !== null);

  const availability = useMemo(() => {
    const generated = roster.map((player, index) => {
      const defaultStatus: AvailabilityStatus =
        index < Math.max(0, roster.length - 2) ? "in" : index === roster.length - 2 ? "out" : "unknown";

      const status =
        player.id === selectedTeam?.player_id ? myStatus : defaultStatus;

      return {
        player,
        status,
      } satisfies AvailabilityEntry;
    });

    return {
      attending: generated.filter((entry) => entry.status === "in"),
      notAttending: generated.filter((entry) => entry.status === "out"),
      awaiting: generated.filter((entry) => entry.status === "unknown"),
    };
  }, [myStatus, roster, selectedTeam?.player_id]);

  if (loading) {
    return (
      <main className="center-screen">
        <p>Loading game...</p>
      </main>
    );
  }

  if (!game) {
    return (
      <main className="page-shell" style={{ paddingTop: "1rem" }}>
        <section className="glass-panel" style={{ padding: "1.25rem" }}>
          <Link href="/dashboard" style={{ color: "#93c5fd" }}>
            Back
          </Link>
          <h1 style={{ fontSize: "1.7rem", marginTop: "0.75rem" }}>Game not found</h1>
        </section>
      </main>
    );
  }

  const counts = {
    in: availability.attending.length,
    out: availability.notAttending.length,
    unknown: availability.awaiting.length,
  };

  const linesArePosted = ["captain", "assistant_captain"].includes(
    selectedTeam?.role ?? ""
  );
  const currentPlayer = roster.find((player) => player.id === selectedTeam?.player_id);
  const linePreview = selectedTeam && linesArePosted
    ? buildLinePreview(currentPlayer?.position ?? null, selectedTeam.player_id)
    : "Line placement pending";

  return (
    <main className="page-shell" style={{ maxWidth: "760px", paddingTop: "1rem", paddingBottom: "10rem" }}>
      <div style={gameHeaderStyle}>
        <button onClick={() => router.push("/dashboard")} style={backButtonStyle}>
          Back
        </button>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "1.25rem", marginBottom: "0.18rem" }}>Game</h1>
          <div style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>
            {formatGameDate(game.date)} at {formatGameTime(game.date)}
          </div>
        </div>
        <div style={{ width: 44 }} />
      </div>

      {!isFinal ? (
        <section style={quickActionRowStyle}>
          <button style={quickActionCardStyle} onClick={() => setLinesOpen(true)}>
            <span style={quickActionIconStyle}>≡</span>
            <span>lines</span>
          </button>
        </section>
      ) : null}

      <section className="glass-panel" style={gameSummaryCardStyle}>
        <div style={summaryTeamsStyle}>
          <SummaryTeam team={awayTeam} label="Away" />
          <SummaryTeam team={homeTeam} label="Home" />
        </div>

        {!isFinal ? (
          <>
            <div style={summaryCountsStyle}>
              <SummaryCount label="In" value={counts.in} />
              <SummaryCount label="Out" value={counts.out} />
              <SummaryCount label="Unknown" value={counts.unknown} />
            </div>

            <div style={summaryMetaTextStyle}>
              {Math.max(counts.in - 1, 0)} skaters &nbsp; 1 goalie
            </div>

            {linesArePosted ? (
              <button
                style={homeLinePreviewStyle}
                onClick={() => setLinesOpen(true)}
              >
              <span style={linesIconStyle}>≡</span>
              <span>{linePreview}</span>
              <span style={linesLinkStyle}>See Lines</span>
              </button>
            ) : null}
          </>
        ) : (
          <div style={finalScoreStyle}>
            {awayTeam?.name ?? "Away"} {game.away_score ?? 0} • {homeTeam?.name ?? "Home"} {game.home_score ?? 0}
          </div>
        )}
      </section>

      {!isFinal ? (
        <>
          <AttendanceCard
            title="Attending"
            count={availability.attending.length}
            entries={availability.attending}
            tone="in"
          />
          <AttendanceCard
            title="Not Attending"
            count={availability.notAttending.length}
            entries={availability.notAttending}
            tone="out"
          />
          <AttendanceCard
            title="Awaiting Response"
            count={availability.awaiting.length}
            entries={availability.awaiting}
            tone="unknown"
          />

          <section className="glass-panel" style={{ padding: "1rem", marginTop: "1rem" }}>
            <div style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginBottom: "0.6rem" }}>
              Game Setup
            </div>
            <div style={setupGridStyle}>
              <SetupCell label="Max Skaters" value="15" />
              <SetupCell label="Max Goalie" value="ANY" />
              <SetupCell label="Duration" value="1 hour" />
            </div>
          </section>
        </>
      ) : null}

      <section className="glass-panel" style={{ padding: "1rem", marginTop: "1rem" }}>
        <h2 style={{ fontSize: "1.35rem", marginBottom: "0.8rem" }}>Previous Match-ups</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "0.75rem" }}>
          {previousMatchups.length ? (
            previousMatchups
              .filter((match) => match.id !== game.id)
              .slice(0, 2)
              .map((match) => (
                <article key={match.id} style={matchupHistoryCardStyle}>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginBottom: "0.45rem" }}>
                    {formatGameDate(match.date)} at {formatGameTime(match.date)}
                  </div>
                  <div style={{ fontWeight: 700 }}>{awayTeam?.name ?? "Away"}</div>
                  <div style={{ fontWeight: 700 }}>{homeTeam?.name ?? "Home"}</div>
                  <div style={{ marginTop: "0.45rem", color: "var(--accent-light)", fontWeight: 700 }}>
                    {match.away_score ?? 0} - {match.home_score ?? 0}
                  </div>
                </article>
              ))
          ) : (
            <div style={{ color: "var(--text-muted)", gridColumn: "1 / -1" }}>
              No previous scorelines have been recorded for this matchup yet.
            </div>
          )}
        </div>
      </section>

      {!isFinal ? (
        <div style={availabilityDockStyle}>
          <div style={availabilityDockShellStyle}>
          <div style={availabilityButtonsStyle}>
            <button
              style={dockButtonStyle(myStatus === "in", "in")}
              onClick={() => setMyStatus("in")}
            >
              <span>✓ In</span>
              <span>{counts.in}</span>
            </button>
            <button
              style={dockButtonStyle(myStatus === "out", "out")}
              onClick={() => setMyStatus("out")}
            >
              <span>✕ Out</span>
              <span>{counts.out}</span>
            </button>
          </div>
          <div style={availabilityExtrasStyle}>
            <button style={auxButtonStyle}>Add Note</button>
            <button style={auxButtonStyle}>Request Ride</button>
          </div>
          </div>
        </div>
      ) : null}

      {linesOpen ? (
        <div style={sheetOverlayStyle} onClick={() => setLinesOpen(false)}>
          <div style={sheetStyle} onClick={(event) => event.stopPropagation()}>
            <div style={sheetHandleStyle} />
            <div style={sheetHeaderStyle}>
              <div style={{ width: 56 }} />
              <h2 style={{ fontSize: "1.35rem" }}>Lines</h2>
              <button style={sheetDoneStyle} onClick={() => setLinesOpen(false)}>
                Done
              </button>
            </div>

            <div style={sheetContentStyle}>
              <LineGroup
                title="Forward 1st Line"
                rows={[["LW", "To be posted"], ["C", "To be posted"], ["RW", "To be posted"]]}
              />
              <LineGroup
                title="Forward 2nd Line"
                rows={[["LW", "To be posted"], ["C", "To be posted"], ["RW", "To be posted"]]}
              />
              <LineGroup
                title="Forward 3rd Line"
                rows={[["LW", "To be posted"], ["C", "To be posted"], ["RW", "To be posted"]]}
              />
              <LineGroup
                title="Defence 1st Pair"
                rows={[["LD", "To be posted"], ["RD", "To be posted"]]}
              />
              <LineGroup
                title="Defence 2nd Pair"
                rows={[["LD", "To be posted"], ["RD", "To be posted"]]}
              />
              <LineGroup
                title="Defence 3rd Pair"
                rows={[["LD", "To be posted"], ["RD", "To be posted"]]}
              />
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function LineGroup({
  title,
  rows,
}: {
  title: string;
  rows: [string, string][];
}) {
  return (
    <section style={{ marginBottom: "1.1rem" }}>
      <div style={{ fontWeight: 700, marginBottom: "0.45rem" }}>{title}</div>
      <div style={lineGroupCardStyle}>
        {rows.map(([position, player]) => (
          <div key={`${title}-${position}`} style={lineRowStyle}>
            <div style={linePositionStyle}>{position}</div>
            <div style={linePlayerStyle}>{player}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SummaryTeam({ team, label }: { team?: TeamRow; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
      {team?.logo_url ? (
        <img src={team.logo_url} alt={team.name} style={summaryLogoStyle} />
      ) : (
        <div style={summaryLogoFallbackStyle}>{buildShortName(team?.name)}</div>
      )}
      <div>
        <div style={{ fontWeight: 700 }}>{team?.name ?? "TBD"}</div>
        <div style={{ color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.72rem" }}>
          {label}
        </div>
      </div>
    </div>
  );
}

function SummaryCount({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>{label}</div>
      <div style={{ marginTop: "0.3rem", fontWeight: 800, fontSize: "1.5rem" }}>{value}</div>
    </div>
  );
}

function AttendanceCard({
  title,
  count,
  entries,
  tone,
}: {
  title: string;
  count: number;
  entries: AvailabilityEntry[];
  tone: AvailabilityStatus;
}) {
  return (
    <section className="glass-panel" style={{ padding: "1rem", marginTop: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.7rem" }}>
        <h2 style={{ fontSize: "1.3rem" }}>{title}</h2>
        <div style={{ color: "var(--text-muted)", fontWeight: 700 }}>{count}</div>
      </div>

      {entries.length ? (
        <div style={{ display: "grid" }}>
          {entries.map((entry) => (
            <div key={entry.player.id} style={attendanceRowStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.7rem", minWidth: 0 }}>
                {entry.player.profile_pic_url ? (
                  <img src={entry.player.profile_pic_url} alt={entry.player.name ?? "Player"} style={attendanceAvatarStyle} />
                ) : (
                  <div style={attendanceFallbackStyle}>
                    {buildShortName(entry.player.name ?? "Player")}
                  </div>
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700 }}>
                    {entry.player.name ?? "Unknown"} {entry.player.number ? `#${entry.player.number}` : ""}
                  </div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase" }}>
                    Roster
                  </div>
                </div>
              </div>

              <div style={positionBadgeStyle(entry.player.position, tone)}>
                {entry.player.position === "LW" || entry.player.position === "RW" ? "FWD" : entry.player.position ?? "ANY"}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ color: "var(--text-muted)" }}>No players in this group yet.</div>
      )}
    </section>
  );
}

function SetupCell({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{label}</div>
      <div style={{ marginTop: "0.35rem", fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function formatGameDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatGameTime(value: string) {
  return new Date(value).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function buildShortName(name?: string) {
  if (!name) return "TBD";
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
    .slice(0, 3);
}

function buildLinePreview(position: string | null, playerId: string) {
  const index = (playerId.charCodeAt(0) % 4) + 1;

  if (position === "G") return "Goalie - Starting";
  if (position === "LD" || position === "RD" || position === "D") {
    return `Defense - ${ordinal(index)} pair`;
  }
  if (position === "LW" || position === "RW") return `Wing - ${ordinal(index)} line`;
  return `Center - ${ordinal(index)} line`;
}

function ordinal(value: number) {
  if (value === 1) return "1st";
  if (value === 2) return "2nd";
  if (value === 3) return "3rd";
  return `${value}th`;
}

function dockButtonStyle(active: boolean, type: "in" | "out"): CSSProperties {
  return {
    flex: 1,
    minHeight: "56px",
    borderRadius: "999px",
    border: "1px solid transparent",
    background: active
      ? type === "in"
        ? "#67d96f"
        : "#ef4444"
      : type === "in"
        ? "rgba(103,217,111,0.2)"
        : "rgba(239,68,68,0.18)",
    color: active ? "#ffffff" : "#f8fafc",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 1.15rem",
    fontWeight: 800,
  };
}

function positionBadgeStyle(position: string | null, tone: AvailabilityStatus): CSSProperties {
  return {
    minWidth: "46px",
    padding: "0.25rem 0.45rem",
    borderRadius: "999px",
    textAlign: "center",
    fontSize: "0.7rem",
    fontWeight: 700,
    border: `1px solid ${
      tone === "in" ? "rgba(74,222,128,0.4)" : tone === "out" ? "rgba(248,113,113,0.4)" : "rgba(148,163,184,0.28)"
    }`,
    color: "var(--text-muted)",
    background: "rgba(255,255,255,0.03)",
  };
}

const gameHeaderStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "44px 1fr 44px",
  alignItems: "center",
  marginBottom: "1rem",
};

const backButtonStyle: CSSProperties = {
  background: "transparent",
  color: "#93c5fd",
  padding: 0,
  textAlign: "left",
  fontWeight: 600,
};

const quickActionRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "0.85rem",
  marginBottom: "1rem",
};

const quickActionCardStyle: CSSProperties = {
  minHeight: "78px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(96,165,250,0.2)",
  display: "grid",
  placeItems: "center",
  color: "#93c5fd",
  textTransform: "lowercase",
  gap: "0.2rem",
};

const quickActionIconStyle: CSSProperties = {
  fontSize: "1.2rem",
  lineHeight: 1,
};

const gameSummaryCardStyle: CSSProperties = {
  padding: "1rem",
};

const summaryTeamsStyle: CSSProperties = {
  display: "grid",
  gap: "0.95rem",
};

const summaryLogoStyle: CSSProperties = {
  width: "40px",
  height: "40px",
  borderRadius: "999px",
  objectFit: "cover",
};

const summaryLogoFallbackStyle: CSSProperties = {
  width: "40px",
  height: "40px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  display: "grid",
  placeItems: "center",
  fontWeight: 800,
  color: "var(--text-muted)",
};

const summaryCountsStyle: CSSProperties = {
  display: "flex",
  gap: "0.9rem",
  marginTop: "1rem",
  paddingTop: "1rem",
  borderTop: "1px solid rgba(255,255,255,0.08)",
};

const summaryMetaTextStyle: CSSProperties = {
  marginTop: "0.55rem",
  color: "var(--text-muted)",
};

const homeLinePreviewStyle: CSSProperties = {
  marginTop: "1rem",
  display: "grid",
  gridTemplateColumns: "20px minmax(0, 1fr) auto",
  gap: "0.7rem",
  alignItems: "center",
  padding: "0.8rem 0.9rem",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(96,165,250,0.18)",
  width: "100%",
  color: "var(--text)",
};

const finalScoreStyle: CSSProperties = {
  marginTop: "1rem",
  paddingTop: "1rem",
  borderTop: "1px solid rgba(255,255,255,0.08)",
  fontSize: "1.05rem",
  fontWeight: 800,
  color: "var(--accent-light)",
};

const attendanceRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "0.75rem",
  alignItems: "center",
  padding: "0.72rem 0",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
};

const attendanceAvatarStyle: CSSProperties = {
  width: "40px",
  height: "40px",
  borderRadius: "999px",
  objectFit: "cover",
};

const attendanceFallbackStyle: CSSProperties = {
  width: "40px",
  height: "40px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  display: "grid",
  placeItems: "center",
  color: "var(--text-muted)",
  fontWeight: 800,
};

const setupGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "0.8rem",
};

const matchupHistoryCardStyle: CSSProperties = {
  borderRadius: "16px",
  padding: "0.9rem",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(96,165,250,0.14)",
};

const availabilityDockStyle: CSSProperties = {
  position: "fixed",
  left: "50%",
  bottom: "calc(5.25rem + var(--safe-bottom))",
  transform: "translateX(-50%)",
  width: "min(94vw, 430px)",
  zIndex: 90,
};

const availabilityDockShellStyle: CSSProperties = {
  padding: "0.7rem",
  borderRadius: "26px",
  background: "rgba(8,18,32,0.96)",
  border: "1px solid rgba(96,165,250,0.18)",
  boxShadow: "0 18px 42px rgba(2,6,23,0.34)",
  backdropFilter: "blur(18px)",
};

const availabilityButtonsStyle: CSSProperties = {
  display: "flex",
  gap: "0.75rem",
};

const availabilityExtrasStyle: CSSProperties = {
  display: "flex",
  gap: "0.75rem",
  justifyContent: "center",
  marginTop: "0.7rem",
};

const auxButtonStyle: CSSProperties = {
  minWidth: "130px",
  minHeight: "42px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  color: "var(--text-muted)",
  border: "1px solid rgba(255,255,255,0.08)",
  fontWeight: 600,
};

const linesIconStyle: CSSProperties = {
  color: "#4ade80",
  fontSize: "1.1rem",
  fontWeight: 700,
  lineHeight: 1,
};

const linesLinkStyle: CSSProperties = {
  color: "#93c5fd",
  whiteSpace: "nowrap",
  fontWeight: 700,
};

const sheetOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(2,6,14,0.82)",
  zIndex: 2200,
  display: "flex",
  alignItems: "flex-end",
  backdropFilter: "blur(12px)",
};

const sheetStyle: CSSProperties = {
  width: "100%",
  maxHeight: "100vh",
  background: "linear-gradient(180deg, rgba(9,16,29,0.99), rgba(5,10,19,0.99))",
  color: "var(--text)",
  borderTopLeftRadius: "24px",
  borderTopRightRadius: "24px",
  padding: "calc(var(--safe-top) + 0.55rem) 1rem 1.2rem",
  overflow: "hidden",
  borderTop: "1px solid rgba(148,163,184,0.16)",
  boxShadow: "0 -24px 80px rgba(0,0,0,0.45)",
};

const sheetHandleStyle: CSSProperties = {
  width: "56px",
  height: "5px",
  borderRadius: "999px",
  background: "rgba(226,232,240,0.22)",
  margin: "0.35rem auto 0.55rem",
};

const sheetHeaderStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "56px 1fr 56px",
  alignItems: "center",
  marginBottom: "0.9rem",
  textAlign: "center",
};

const sheetDoneStyle: CSSProperties = {
  background: "transparent",
  color: "var(--accent-light)",
  padding: 0,
  fontWeight: 700,
};

const sheetContentStyle: CSSProperties = {
  overflowY: "auto",
  maxHeight: "calc(100vh - var(--safe-top) - 92px)",
  paddingBottom: "1rem",
};

const lineGroupCardStyle: CSSProperties = {
  background: "rgba(10,18,31,0.92)",
  borderRadius: "16px",
  overflow: "hidden",
  border: "1px solid rgba(148,163,184,0.14)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
};

const lineRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "52px 1fr",
  minHeight: "54px",
  borderBottom: "1px solid rgba(148,163,184,0.12)",
};

const linePositionStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700,
  fontSize: "0.82rem",
  color: "var(--accent-light)",
  background: "rgba(56,189,248,0.08)",
  borderRight: "1px solid rgba(148,163,184,0.12)",
};

const linePlayerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  padding: "0 0.9rem",
  fontWeight: 600,
  color: "var(--text)",
};
