"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import { useTeam } from "@/context/TeamContext";

type PlayerProfile = {
  id: string;
  name: string | null;
  number: number | null;
  position: string | null;
  profile_pic_url: string | null;
};

type MembershipCard = {
  id: string;
  name: string;
  league: string;
  role: string;
  logoUrl: string | null;
};

function positionColor(pos: string | null) {
  if (pos === "C") return "#facc15";
  if (pos === "LW" || pos === "RW") return "#60a5fa";
  if (pos === "LD" || pos === "RD" || pos === "D") return "#ef4444";
  if (pos === "G") return "#f8fafc";
  return "#cbd5e1";
}

export default function ProfilePage() {
  const router = useRouter();
  const { selectedTeam } = useTeam();

  const [loading, setLoading] = useState(true);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [memberships, setMemberships] = useState<MembershipCard[]>([]);
  const [uploading, setUploading] = useState(false);
  const [savingPosition, setSavingPosition] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<string>("");
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;

      if (!session) {
        router.push("/auth/login");
        return;
      }

      setAuthUserId(session.user.id);
      setEmail(session.user.email ?? null);

      const { data: ptRow } = await supabase
        .from("player_teams")
        .select("player_id")
        .eq("user_id", session.user.id)
        .limit(1)
        .maybeSingle();

      if (!ptRow?.player_id) {
        setLoading(false);
        return;
      }

      setPlayerId(ptRow.player_id);

      const { data: sharedProfileRow } = await supabase
        .from("players")
        .select("profile_pic_url")
        .eq("user_id", session.user.id)
        .not("profile_pic_url", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: playerData } = await supabase
        .from("players")
        .select("id, name, number, position, profile_pic_url")
        .eq("id", ptRow.player_id)
        .maybeSingle();

      if (playerData?.id) {
        setPlayer({
          id: playerData.id,
          name: playerData.name ?? null,
          number: playerData.number ?? null,
          position: playerData.position ?? null,
          profile_pic_url: sharedProfileRow?.profile_pic_url ?? playerData.profile_pic_url,
        });
        setSelectedPosition(playerData.position ?? "");
      }

      const { data: membershipRows } = await supabase
        .from("player_teams")
        .select("id, role, teams(id, name, logo_url, leagues(name, season))")
        .eq("user_id", session.user.id);

      const nextMemberships =
        membershipRows
          ?.map((row) => {
            const team = Array.isArray(row.teams) ? row.teams[0] : row.teams;
            const league = team?.leagues
              ? Array.isArray(team.leagues)
                ? team.leagues[0]
                : team.leagues
              : null;

            if (!team?.id || !team?.name) return null;

            return {
              id: team.id,
              name: team.name,
              league: league?.name
                ? `${league.name}${league.season ? ` • ${league.season}` : ""}`
                : "League",
              role: row.role || "player",
              logoUrl: team.logo_url ?? null,
            } satisfies MembershipCard;
          })
          .filter((row): row is MembershipCard => Boolean(row)) ?? [];

      setMemberships(nextMemberships);
      setLoading(false);
    }

    loadProfile();
  }, [router]);

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true);

      const file = event.target.files?.[0];
      if (!file || !playerId || !authUserId) return;

      const fileExt = file.name.split(".").pop();
      const fileName = `${playerId}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("profile pictures")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("profile pictures")
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      await supabase
        .from("players")
        .update({ profile_pic_url: publicUrl })
        .eq("user_id", authUserId);

      setPlayer((prev) =>
        prev
          ? {
              ...prev,
              profile_pic_url: publicUrl,
            }
          : prev
      );

      window.dispatchEvent(
        new CustomEvent("pucklytics-profile-photo-updated", {
          detail: publicUrl,
        })
      );
      window.dispatchEvent(new Event("pucklytics-player-profile-updated"));
    } catch (error) {
      console.error("Error uploading avatar:", error);
    } finally {
      setUploading(false);
    }
  }

  async function savePrimaryPosition() {
    if (!authUserId || !selectedPosition) return;

    try {
      setSavingPosition(true);

      const { error } = await supabase
        .from("players")
        .update({ position: selectedPosition })
        .eq("user_id", authUserId);

      if (error) throw error;

      setPlayer((prev) =>
        prev
          ? {
              ...prev,
              position: selectedPosition,
            }
          : prev
      );

      window.dispatchEvent(new Event("pucklytics-player-profile-updated"));
    } catch (error) {
      console.error("Error updating position:", error);
    } finally {
      setSavingPosition(false);
    }
  }

  const playerName = useMemo(() => {
    if (player?.name) return player.name;
    if (email) return email.split("@")[0];
    return "Player";
  }, [email, player?.name]);

  if (loading) {
    return (
      <main className="center-screen">
        <p>Loading profile...</p>
      </main>
    );
  }

  if (!player) {
    return (
      <main className="page-shell" style={{ paddingTop: "1rem" }}>
        <section className="glass-panel" style={{ padding: "1.1rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.4rem" }}>Profile</h1>
          <p style={{ marginTop: "0.6rem", color: "var(--text-muted)" }}>
            No player profile found yet.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell" style={{ paddingTop: "1rem", paddingBottom: "6rem" }}>
      <section className="glass-panel" style={heroCardStyle}>
        <div style={heroTopRowStyle}>
          <img
            src={player.profile_pic_url || "https://via.placeholder.com/240?text=Rink+Rats"}
            alt="Profile"
            style={avatarStyle}
          />

          <div style={{ minWidth: 0 }}>
            <div style={eyebrowStyle}>Shared across leagues</div>
            <h1 style={nameStyle}>{playerName}</h1>

            <div style={identityRowStyle}>
              <span style={identityTextStyle}>#{player.number ?? "00"}</span>
              {player.position ? (
                <span
                  style={{
                    ...positionPillStyle,
                    background: positionColor(player.position),
                  }}
                >
                  {player.position}
                </span>
              ) : null}
            </div>

            <p style={helperTextStyle}>
              One photo follows your account across every team and league you join.
            </p>
          </div>
        </div>

        <label style={uploadButtonStyle}>
          {uploading ? "Uploading..." : "Update photo"}
          <input
            type="file"
            accept="image/*"
            onChange={uploadAvatar}
            style={{ display: "none" }}
          />
        </label>
      </section>

      <section style={sectionStackStyle}>
        <div style={sectionTitleRowStyle}>
          <h2 style={sectionTitleStyle}>Player Settings</h2>
        </div>

        <div className="glass-panel" style={infoCardStyle}>
          <div style={{ display: "grid", gap: "0.9rem" }}>
            <div style={detailRowStyle}>
              <span style={detailLabelStyle}>Primary Position</span>
              <div style={positionEditorRowStyle}>
                <select
                  value={selectedPosition}
                  onChange={(event) => setSelectedPosition(event.target.value)}
                  style={positionSelectStyle}
                >
                  {["C", "LW", "RW", "D", "G"].map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={savePrimaryPosition}
                  disabled={savingPosition || !selectedPosition || selectedPosition === player.position}
                  style={saveButtonStyle(
                    savingPosition || !selectedPosition || selectedPosition === player.position
                  )}
                >
                  {savingPosition ? "Saving..." : "Save"}
                </button>
              </div>
              <span style={helperInlineStyle}>
                This updates your main position across your account.
              </span>
            </div>

            <div style={teamRowStyle}>
              <div>
                <div style={eyebrowStyle}>Selected team</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                  {selectedTeam?.name ?? memberships[0]?.name ?? "No team selected"}
                </div>
              </div>

              {selectedTeam?.teamLogo ? (
                <img
                  src={selectedTeam.teamLogo}
                  alt={selectedTeam.name}
                  style={teamLogoStyle}
                />
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section style={sectionStackStyle}>
        <div style={sectionTitleRowStyle}>
          <h2 style={sectionTitleStyle}>Rostered Teams</h2>
        </div>

        <div style={{ display: "grid", gap: "0.8rem" }}>
          {memberships.length > 0 ? (
            memberships.map((membership) => {
              const isActive = selectedTeam?.id === membership.id;

              return (
                <div
                  key={membership.id}
                  className="glass-panel"
                  style={{
                    ...membershipCardStyle,
                    borderColor: isActive
                      ? "rgba(96,165,250,0.42)"
                      : "rgba(148,163,184,0.14)",
                  }}
                >
                  <div style={teamRowStyle}>
                    <div style={{ minWidth: 0 }}>
                      <div style={membershipLeagueStyle}>{membership.league}</div>
                      <div style={membershipNameStyle}>{membership.name}</div>
                      <div style={membershipRoleStyle}>{formatRole(membership.role)}</div>
                    </div>

                    {membership.logoUrl ? (
                      <img
                        src={membership.logoUrl}
                        alt={membership.name}
                        style={teamLogoStyle}
                      />
                    ) : null}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="glass-panel" style={infoCardStyle}>
              <p style={{ color: "var(--text-muted)" }}>No league memberships found yet.</p>
            </div>
          )}
        </div>
      </section>

      <section style={sectionStackStyle}>
        <div style={sectionTitleRowStyle}>
          <h2 style={sectionTitleStyle}>Account</h2>
        </div>

        <div className="glass-panel" style={infoCardStyle}>
          <div style={detailRowStyle}>
            <span style={detailLabelStyle}>Email</span>
            <span style={detailValueStyle}>{email ?? "No email"}</span>
          </div>
          <div style={detailRowStyle}>
            <span style={detailLabelStyle}>Player ID</span>
            <span style={detailValueStyle}>{player.id}</span>
          </div>
        </div>
      </section>
    </main>
  );
}

function formatRole(role: string) {
  if (role === "assistant_captain") return "Assistant Captain";
  if (role === "captain") return "Captain";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

const heroCardStyle: React.CSSProperties = {
  padding: "1rem",
  display: "grid",
  gap: "1rem",
};

const heroTopRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "88px minmax(0, 1fr)",
  gap: "0.9rem",
  alignItems: "center",
};

const avatarStyle: React.CSSProperties = {
  width: "88px",
  height: "88px",
  borderRadius: "50%",
  objectFit: "cover",
  border: "3px solid var(--accent-light)",
  background: "rgba(255,255,255,0.08)",
};

const eyebrowStyle: React.CSSProperties = {
  color: "var(--accent-light)",
  fontSize: "0.72rem",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const nameStyle: React.CSSProperties = {
  fontSize: "1.6rem",
  lineHeight: 1.05,
  marginTop: "0.3rem",
};

const identityRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.45rem",
  flexWrap: "wrap",
  marginTop: "0.45rem",
};

const identityTextStyle: React.CSSProperties = {
  color: "rgba(255,255,255,0.74)",
  fontWeight: 600,
};

const positionPillStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: "30px",
  height: "24px",
  padding: "0 0.6rem",
  borderRadius: "999px",
  color: "#101010",
  fontSize: "0.76rem",
  fontWeight: 800,
  lineHeight: 1,
};

const helperTextStyle: React.CSSProperties = {
  marginTop: "0.55rem",
  color: "var(--text-muted)",
  fontSize: "0.85rem",
  lineHeight: 1.45,
};

const uploadButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "46px",
  padding: "0.8rem 1rem",
  borderRadius: "14px",
  background: "linear-gradient(135deg, #f97316, #ea580c)",
  color: "white",
  fontWeight: 700,
  width: "100%",
};

const positionEditorRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  gap: "0.65rem",
  alignItems: "center",
  marginTop: "0.35rem",
};

const positionSelectStyle: React.CSSProperties = {
  width: "100%",
  minHeight: "44px",
  borderRadius: "12px",
  background: "rgba(15,23,42,0.9)",
  border: "1px solid rgba(148,163,184,0.18)",
  color: "white",
  padding: "0.75rem 0.9rem",
  fontSize: "0.9rem",
  fontWeight: 600,
};

function saveButtonStyle(disabled: boolean): React.CSSProperties {
  return {
    minHeight: "44px",
    borderRadius: "12px",
    padding: "0.75rem 0.95rem",
    background: disabled
      ? "rgba(71,85,105,0.4)"
      : "linear-gradient(135deg, #f97316, #ea580c)",
    color: "white",
    fontSize: "0.86rem",
    fontWeight: 700,
    opacity: disabled ? 0.72 : 1,
  };
}

const helperInlineStyle: React.CSSProperties = {
  display: "block",
  marginTop: "0.45rem",
  color: "var(--text-muted)",
  fontSize: "0.8rem",
  lineHeight: 1.4,
};

const sectionStackStyle: React.CSSProperties = {
  display: "grid",
  gap: "0.7rem",
  marginTop: "1rem",
};

const sectionTitleRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: "1.15rem",
};

const infoCardStyle: React.CSSProperties = {
  padding: "0.95rem",
};

const membershipCardStyle: React.CSSProperties = {
  padding: "0.95rem",
  borderWidth: "1px",
  borderStyle: "solid",
};

const teamRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "0.8rem",
};

const teamLogoStyle: React.CSSProperties = {
  width: "54px",
  height: "54px",
  borderRadius: "50%",
  objectFit: "cover",
  background: "rgba(255,255,255,0.05)",
  flexShrink: 0,
};

const membershipLeagueStyle: React.CSSProperties = {
  color: "var(--accent-light)",
  fontSize: "0.8rem",
};

const membershipNameStyle: React.CSSProperties = {
  fontSize: "1rem",
  fontWeight: 700,
  marginTop: "0.18rem",
};

const membershipRoleStyle: React.CSSProperties = {
  color: "var(--text-muted)",
  marginTop: "0.2rem",
  fontSize: "0.84rem",
};

const detailRowStyle: React.CSSProperties = {
  display: "grid",
  gap: "0.2rem",
  padding: "0.2rem 0",
};

const detailLabelStyle: React.CSSProperties = {
  color: "var(--text-muted)",
  fontSize: "0.76rem",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const detailValueStyle: React.CSSProperties = {
  fontSize: "0.95rem",
  wordBreak: "break-word",
};
