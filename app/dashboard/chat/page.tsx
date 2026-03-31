"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useTeam } from "@/context/TeamContext";

type RoomType = "team" | "captains" | "film_staff";

type RoomRow = {
  id: string;
  type: string;
  team_id: string | null;
  created_at: string | null;
};

type MessageRow = {
  id: string;
  room_id: string | null;
  sender_id: string | null;
  message: string;
  created_at: string | null;
};

type TeamRow = {
  id: string;
  name: string;
  logo_url: string | null;
};

const filmStaffRoles = new Set(["captain", "assistant_captain", "film_manager"]);
const captainRoles = new Set(["captain", "assistant_captain", "commissioner"]);

export default function ChatHome() {
  const { selectedTeam } = useTeam();
  const activeTeam = selectedTeam;
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [teamInfo, setTeamInfo] = useState<TeamRow | null>(null);
  const [latestByRoom, setLatestByRoom] = useState<Record<string, MessageRow | null>>({});

  useEffect(() => {
    if (!activeTeam) {
      return;
    }
    const teamMember = activeTeam;

    const activeState = { current: true };

    async function ensureRoom(type: RoomType) {
      const roomQuery = supabase
        .from("chat_rooms")
        .select("id, type, team_id, created_at")
        .eq("type", type);

      const existing = await roomQuery.eq("team_id", teamMember.id).maybeSingle();

      const room = existing.data?.id
        ? (existing.data as RoomRow)
        : (
            await supabase
              .from("chat_rooms")
              .insert({
                type,
                team_id: teamMember.id,
              })
              .select("id, type, team_id, created_at")
              .single()
          ).data as RoomRow | null;

      if (room?.id) {
        const membership = await supabase
          .from("chat_room_members")
          .select("id")
          .eq("room_id", room.id)
          .eq("user_id", teamMember.player_id)
          .maybeSingle();

        if (!membership.data?.id) {
          await supabase.from("chat_room_members").insert({
            room_id: room.id,
            user_id: teamMember.player_id,
          });
        }
      }

      return room;
    }

    async function loadRooms() {
      setLoading(true);

      const desiredTypes: RoomType[] = ["team"];
      if (captainRoles.has(teamMember.role ?? "")) {
        desiredTypes.push("captains");
      }
      if (filmStaffRoles.has(teamMember.role ?? "")) {
        desiredTypes.push("film_staff");
      }

      const ensuredRooms = await Promise.all(desiredTypes.map((type) => ensureRoom(type)));
      const roomIds = ensuredRooms
        .map((room) => room?.id)
        .filter((value): value is string => Boolean(value));

      const [{ data: teamRows }, roomResult, messageResult] = await Promise.all([
        supabase
          .from("teams")
          .select("id, name, logo_url")
          .eq("id", teamMember.id)
          .maybeSingle(),
        roomIds.length
          ? supabase
              .from("chat_rooms")
              .select("id, type, team_id, created_at")
              .in("id", roomIds)
              .order("created_at", { ascending: false })
          : Promise.resolve({ data: [] as RoomRow[] }),
        roomIds.length
          ? supabase
              .from("chat_messages")
              .select("id, room_id, sender_id, message, created_at")
              .in("room_id", roomIds)
              .order("created_at", { ascending: false })
          : Promise.resolve({ data: [] as MessageRow[] }),
      ]);

      if (!activeState.current) {
        return;
      }

      setRooms((roomResult.data ?? []) as RoomRow[]);
      setTeamInfo((teamRows as TeamRow | null) ?? null);
      setLatestByRoom(
        ((messageResult.data ?? []) as MessageRow[]).reduce<Record<string, MessageRow | null>>(
          (accumulator, message) => {
            if (message.room_id && !accumulator[message.room_id]) {
              accumulator[message.room_id] = message;
            }
            return accumulator;
          },
          {}
        )
      );
      setLoading(false);
    }

    loadRooms();

    return () => {
      activeState.current = false;
    };
  }, [activeTeam]);

  if (!activeTeam) {
    return (
      <main className="page-shell">
        <section className="glass-panel" style={{ padding: "1.2rem" }}>
          Select a team to open chat.
        </section>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="center-screen">
        <p>Loading chat rooms...</p>
      </main>
    );
  }

  return (
    <main className="page-shell" style={{ paddingBottom: "6rem" }}>
      <section className="glass-panel" style={{ padding: "1rem", marginBottom: "0.9rem" }}>
        <div style={{ color: "var(--accent-light)", marginBottom: "0.35rem" }}>Chat</div>
        <h1 style={{ fontSize: "1.8rem", marginBottom: "0.35rem" }}>Team messaging</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.5 }}>
          Team chat stays open to your roster, while leadership and film rooms appear automatically
          when your role allows them.
        </p>
      </section>

      <section style={{ display: "grid", gap: "0.9rem" }}>
        {rooms.map((room) => {
          const latestMessage = latestByRoom[room.id];
          const roomMeta = getRoomMeta(room.type, teamInfo?.name ?? activeTeam.name);

          return (
            <Link
              key={room.id}
              href={`/dashboard/chat/${room.id}`}
              className="glass-panel"
              style={{ padding: "0.95rem 1rem", color: "var(--text)" }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "56px minmax(0,1fr) auto", gap: "0.85rem", alignItems: "center" }}>
                <div style={roomBadgeStyle}>
                  {room.type === "team" && (teamInfo?.logo_url || activeTeam.teamLogo) ? (
                    <img
                      src={teamInfo?.logo_url || activeTeam.teamLogo || ""}
                      alt={teamInfo?.name ?? activeTeam.name}
                      style={roomLogoStyle}
                    />
                  ) : (
                    <span>{roomMeta.shortLabel}</span>
                  )}
                </div>

                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "1.05rem", fontWeight: 700 }}>{roomMeta.title}</div>
                  <div style={{ color: "var(--accent-light)", marginTop: "0.2rem", fontSize: "0.85rem" }}>
                    {roomMeta.subtitle}
                  </div>
                  <div
                    style={{
                      color: "var(--text-muted)",
                      marginTop: "0.42rem",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {latestMessage?.message || "No messages yet. Start the conversation."}
                  </div>
                </div>

                <div style={roomTimeStyle}>
                  {latestMessage?.created_at ? formatStamp(latestMessage.created_at) : "Open"}
                </div>
              </div>
            </Link>
          );
        })}
      </section>
    </main>
  );
}

function getRoomMeta(type: string, teamName: string) {
  if (type === "captains") {
    return {
      title: `${teamName} Leadership`,
      subtitle: "Captains and assistant captains",
      shortLabel: "C",
    };
  }

  if (type === "film_staff") {
    return {
      title: `${teamName} Film Room`,
      subtitle: "Captains, assistants, and film staff",
      shortLabel: "F",
    };
  }

  return {
    title: `${teamName} Team Chat`,
    subtitle: "Players and team staff",
    shortLabel: "T",
  };
}

function formatStamp(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const roomBadgeStyle: CSSProperties = {
  width: "56px",
  height: "56px",
  borderRadius: "18px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid rgba(148,163,184,0.16)",
  background: "rgba(15, 23, 42, 0.86)",
  color: "var(--accent-light)",
  fontWeight: 800,
};

const roomLogoStyle: CSSProperties = {
  width: "42px",
  height: "42px",
  objectFit: "contain",
};

const roomTimeStyle: CSSProperties = {
  minWidth: "58px",
  textAlign: "right",
  color: "var(--text-muted)",
  fontWeight: 700,
  fontSize: "0.78rem",
};
