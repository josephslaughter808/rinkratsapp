"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function TeamSwitcher() {
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [player, setPlayer] = useState<any>(null);

  useEffect(() => {
    async function loadTeams() {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;

      if (!user) {
        setLoading(false);
        return;
      }

      // 1️⃣ Get ALL player rows for this user (Peaks + Bison)
      const { data: playerRows } = await supabase
        .from("players")
        .select("id")
        .eq("user_id", user.id);

      if (!playerRows || playerRows.length === 0) {
        setTeams([]);
        setLoading(false);
        return;
      }

      const playerIds = playerRows.map((p: any) => p.id);

      // 2️⃣ Load all team memberships for those player IDs
      const { data: memberships, error } = await supabase
        .from("player_teams")
        .select(`
          player_id,
          role,
          teams (
            id,
            name,
            logo_url,
            league_id,
            leagues (
              id,
              name,
              logo_url
            )
          )
        `)
        .in("player_id", playerIds);

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

      // 3️⃣ Map teams cleanly
      const mappedTeams = memberships.map((row: any) => ({
        id: row.teams?.id,
        name: row.teams?.name,
        teamLogo: row.teams?.logo_url,
        leagueId: row.teams?.league_id,
        leagueName: row.teams?.leagues?.name,
        leagueLogo: row.teams?.leagues?.logo_url,
        player_id: row.player_id,
      }));

      setTeams(mappedTeams);

      // 4️⃣ Set default selected team
      if (!selectedTeam) {
        setSelectedTeam(mappedTeams[0]);
      }

      // 5️⃣ Load player info for the selected team
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
              {player.name}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>
              #{player.number} • {player.position}
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
            src={selectedTeam.leagueLogo}
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
