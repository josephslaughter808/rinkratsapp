"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function TeamSwitcher() {
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [player, setPlayer] = useState<any>(null);

  // ============================================================
  // ===============  REAL SUPABASE TEAM LOADING  ===============
  // ============================================================
  useEffect(() => {
    async function loadTeams() {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;

      if (!user) {
        setLoading(false);
        return;
      }

      // Load team memberships
      const { data: memberships } = await supabase
        .from("player_teams")
        .select(`
          player_id,
          role,
          sub_expires_at,
          teams (
            id,
            name,
            logo_url
          )
        `)
        .eq("user_id", user.id);

      if (!memberships) {
        setTeams([]);
        setLoading(false);
        return;
      }

      const mappedTeams = memberships.map((row: any) => ({
        id: row.teams?.id,
        name: row.teams?.name,
        leagueLogo: row.teams?.logo_url,
        player_id: row.player_id,
      }));

      setTeams(mappedTeams);

      if (mappedTeams.length > 0) {
        setSelectedTeam(mappedTeams[0]);
      }

      // Load player info (name, number, position, profile picture)
      const { data: playerData } = await supabase
        .from("players")
        .select("name, number, position, profile_pic_url")
        .eq("id", mappedTeams[0].player_id)
        .single();

      setPlayer(playerData);

      setLoading(false);
    }

    loadTeams();
  }, []);

  // Prevent empty bar flash
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

  const handleSelect = (team: any) => {
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
          {/* ⭐ REAL PROFILE PICTURE (replaces placeholder) */}
          <img
            src={player.profile_pic_url || "https://via.placeholder.com/60?text=?"}
            alt="Profile"
            style={{
              width: "60px",   // ← adjust size here
              height: "60px",  // ← adjust size here
              borderRadius: "50%",
              objectFit: "cover",
              flexShrink: 0,
            }}
          />

          {/* REAL PLAYER NAME + NUMBER + POSITION */}
          <div style={{ lineHeight: "1.1", whiteSpace: "nowrap" }}>
            <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>
              {player.name}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>
              #{player.number} • {player.position}
            </div>
          </div>
        </div>

        {/* CENTER — TEAM NAME + DOWN ARROW */}
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

        {/* RIGHT — LEAGUE LOGO (unchanged) */}
        <div
          style={{
            minWidth: "40px",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          <img
            src={selectedTeam.leagueLogo}
            alt="league logo"
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              objectFit: "cover",
              opacity: 1,
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
