"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function TeamSwitcher() {
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

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

    const { data: memberships, error } = await supabase
      .from("player_teams")
      .select(`
        role,
        sub_expires_at,
        teams (
          id,
          name,
          logo_url
        )
      `)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error loading teams:", error);
      setLoading(false);
      return;
    }

    if (!memberships) {
      setTeams([]);
      setLoading(false);
      return;
    }

    const mappedTeams = (memberships as any[]).map((row) => ({
  id: row.teams?.id,
  name: row.teams?.name,
  leagueLogo: row.teams?.logo_url,
}));


    setTeams(mappedTeams);

    if (mappedTeams.length > 0) {
      setSelectedTeam(mappedTeams[0]);
    }

    setLoading(false);
  }

  loadTeams();
}, []);



  // ============================================================
  // ==================  END SUPABASE LOADING  ==================
  // ============================================================


  // Prevent empty bar flash
  if (loading) {
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

  if (!selectedTeam) {
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

        // ⭐ FIXED BAR HEIGHT — tweak this number
        height: "48px",
        overflow: "visible", // allow the big circle to extend outside the bar
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
        {/* ⭐ 60px PROFILE PICTURE */}
        <div
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            background: "#1F2937",
            flexShrink: 0, // prevents squishing
          }}
        />

        <div style={{ lineHeight: "1.1", whiteSpace: "nowrap" }}>
          <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>
            Player Name
          </div>
          <div style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>
            #00 • POS
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
            borderRadius: "50%",      // makes it circular
            objectFit: "cover",       // fills the circle cleanly
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
