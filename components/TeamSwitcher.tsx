"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { SelectedTeam, useTeam } from "@/context/TeamContext";

type PlayerCard = {
  name: string | null;
  number: number | null;
  position: string | null;
  profile_pic_url: string | null;
};

export default function TeamSwitcher() {
  const { selectedTeam, setSelectedTeam } = useTeam();

  const [teams, setTeams] = useState<SelectedTeam[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [player, setPlayer] = useState<PlayerCard | null>(null);

  useEffect(() => {
    async function loadTeams() {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;

      if (!user) {
        setLoading(false);
        return;
      }

      setUserId(user.id);

      const { data: memberships, error } = await supabase
        .from("player_teams")
        .select(`
          player_id,
          role,
          teams:team_id (
            id,
            name,
            logo_url,
            league_id
          )
        `)
        .eq("user_id", user.id);

      if (error) {
        console.error("Team load error:", error);
        setLoading(false);
        return;
      }

      if (!memberships || memberships.length === 0) {
        setTeams([]);
        setLoading(false);
        return;
      }

      const mappedTeams: SelectedTeam[] = memberships
        .filter((row) => row.teams?.id && row.player_id)
        .map((row: {
          player_id: string;
          role: string | null;
          teams: {
            id: string;
            name: string;
            logo_url: string | null;
            league_id: string | null;
          } | null;
        }) => ({
        id: row.teams?.id,
        name: row.teams?.name,
        teamLogo: row.teams?.logo_url ?? null,
        leagueId: row.teams?.league_id ?? null,
        player_id: row.player_id,
        role: row.role,
      }));

      setTeams(mappedTeams);

      if (!selectedTeam && mappedTeams.length > 0) {
        setSelectedTeam(mappedTeams[0]);
      }
      setLoading(false);
    }

    loadTeams();
  }, [selectedTeam, setSelectedTeam]);

  useEffect(() => {
    async function loadPlayerCard() {
      if (!selectedTeam || !userId) {
        setPlayer(null);
        return;
      }

      const { data: profileRow } = await supabase
        .from("players")
        .select("profile_pic_url")
        .eq("user_id", userId)
        .not("profile_pic_url", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: selectedPlayerRow } = await supabase
        .from("players")
        .select("name, number, position")
        .eq("id", selectedTeam.player_id)
        .maybeSingle();

      setPlayer({
        name: selectedPlayerRow?.name ?? null,
        number: selectedPlayerRow?.number ?? null,
        position: selectedPlayerRow?.position ?? null,
        profile_pic_url: profileRow?.profile_pic_url ?? null,
      });
    }

    loadPlayerCard();
  }, [selectedTeam, userId]);

  if (loading || !selectedTeam || !player) {
    return (
      <div
        style={{
          height: "60px",
          background: "#0A1A2F",
          borderRadius: "6px",
        }}
      />
    );
  }

  const handleSelect = (team: SelectedTeam) => {
    setSelectedTeam(team);
    setOpen(false);
  };

  return (
    <div style={{ position: "relative", width: "100%" }}>
      {/* TOP BAR */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#0A1A2F",
          padding: "0.75rem 1rem",
          borderRadius: "6px",
          cursor: "pointer",
          userSelect: "none",
          height: "48px",
          overflow: "visible",
        }}
      >
        {/* LEFT — PLAYER INFO */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            minWidth: 0,
          }}
        >
          <img
            src={player.profile_pic_url || "https://via.placeholder.com/60?text=?"}
            alt="Profile"
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              objectFit: "cover",
              flexShrink: 0,
            }}
          />

          <div style={{ lineHeight: "1.1", whiteSpace: "nowrap" }}>
            <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>
              {player.name || "Player"}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>
              #{player.number ?? "--"} • {player.position ?? "--"}
            </div>
          </div>
        </div>

        {/* CENTER — TEAM NAME */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: "0.35rem",
            pointerEvents: "none",
          }}
        >
          <span style={{ fontSize: "1.1rem", fontWeight: 700 }}>
            {selectedTeam.name}
          </span>

          <span
            style={{
              fontSize: "0.9rem",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: "0.2s",
              opacity: 0.8,
            }}
          >
            ▼
          </span>
        </div>

        {/* RIGHT — LEAGUE LOGO */}
        <div
          style={{
            minWidth: "40px",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          <img
            src={selectedTeam.teamLogo}
            alt="league logo"
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />
        </div>
      </div>

      {/* DROPDOWN */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "3.2rem",
            left: 0,
            width: "100%",
            background: "#0F213A",
            border: "1px solid #1f2937",
            borderRadius: "6px",
            overflow: "hidden",
            zIndex: 1000,
          }}
        >
          {teams.map((team) => (
            <div
              key={team.id}
              onClick={() => handleSelect(team)}
              style={{
                padding: "0.75rem 1rem",
                cursor: "pointer",
                background:
                  selectedTeam.id === team.id ? "#1A2F4D" : "transparent",
              }}
            >
              {team.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
