"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useTeam } from "@/context/TeamContext";

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

export default function ChatHome() {
  const { selectedTeam } = useTeam();
  const activeTeam = selectedTeam;
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [teamsById, setTeamsById] = useState<Record<string, TeamRow>>({});
  const [latestByRoom, setLatestByRoom] = useState<Record<string, MessageRow | null>>({});

  useEffect(() => {
    if (!activeTeam) {
      return;
    }
    const team = activeTeam;

    let active = true;

    async function loadRooms() {
      setLoading(true);

      let roomId: string | null = null;

      const existingRoom = await supabase
        .from("chat_rooms")
        .select("id, type, team_id, created_at")
        .eq("team_id", team.id)
        .eq("type", "team")
        .maybeSingle();

      if (existingRoom.data?.id) {
        roomId = existingRoom.data.id;
      } else {
        const createdRoom = await supabase
          .from("chat_rooms")
          .insert({
            type: "team",
            team_id: team.id,
          })
          .select("id, type, team_id, created_at")
          .single();

        roomId = createdRoom.data?.id ?? null;
      }

      if (roomId) {
        const existingMembership = await supabase
          .from("chat_room_members")
          .select("id")
          .eq("room_id", roomId)
          .eq("user_id", team.player_id)
          .maybeSingle();

        if (!existingMembership.data?.id) {
          await supabase.from("chat_room_members").insert({
            room_id: roomId,
            user_id: team.player_id,
          });
        }
      }

      const [{ data: memberRows }, { data: teamRows }] = await Promise.all([
        supabase
          .from("chat_room_members")
          .select("room_id")
          .eq("user_id", team.player_id),
        supabase
          .from("teams")
          .select("id, name, logo_url")
          .eq("id", team.id),
      ]);

      const roomIds = Array.from(
        new Set((memberRows ?? []).map((row) => row.room_id).filter(Boolean))
      ) as string[];

      const { data: roomRows } = roomIds.length
        ? await supabase
            .from("chat_rooms")
            .select("id, type, team_id, created_at")
            .in("id", roomIds)
            .order("created_at", { ascending: false })
        : { data: [] as RoomRow[] };

      const { data: messageRows } = roomIds.length
        ? await supabase
            .from("chat_messages")
            .select("id, room_id, sender_id, message, created_at")
            .in("room_id", roomIds)
            .order("created_at", { ascending: false })
        : { data: [] as MessageRow[] };

      if (!active) {
        return;
      }

      setRooms((roomRows ?? []) as RoomRow[]);
      setTeamsById(
        Object.fromEntries(((teamRows ?? []) as TeamRow[]).map((entry) => [entry.id, entry]))
      );
      setLatestByRoom(
        ((messageRows ?? []) as MessageRow[]).reduce<Record<string, MessageRow | null>>(
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
      active = false;
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
    <main className="page-shell">
      <section className="glass-panel" style={{ padding: "1.25rem", marginBottom: "1rem" }}>
        <div style={{ color: "var(--accent-light)", marginBottom: "0.35rem" }}>Chat</div>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.45rem" }}>Team messaging</h1>
        <p style={{ color: "var(--text-muted)", maxWidth: "760px" }}>
          This is your live team room for line combos, ride sharing, game reminders, and film reactions.
        </p>
      </section>

      <section style={{ display: "grid", gap: "1rem" }}>
        {rooms.map((room) => {
          const team = teamsById[room.team_id ?? ""];
          const latestMessage = latestByRoom[room.id];

          return (
            <Link
              key={room.id}
              href={`/dashboard/chat/${room.id}`}
              className="glass-panel"
              style={{ padding: "1rem 1.1rem", color: "var(--text)" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "1rem",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 700 }}>
                    {room.type === "team" ? `${team?.name ?? activeTeam.name} Team Chat` : "Chat Room"}
                  </div>
                  <div style={{ color: "var(--accent-light)", marginTop: "0.2rem" }}>
                    {room.type === "team" ? "Players and team staff" : room.type}
                  </div>
                  <div style={{ color: "var(--text-muted)", marginTop: "0.45rem" }}>
                    {latestMessage?.message || "No messages yet. Start the conversation."}
                  </div>
                </div>
                <div style={roomTimeStyle}>
                  {latestMessage?.created_at
                    ? formatStamp(latestMessage.created_at)
                    : "Open room"}
                </div>
              </div>
            </Link>
          );
        })}
      </section>
    </main>
  );
}

function formatStamp(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const roomTimeStyle: CSSProperties = {
  minWidth: "110px",
  textAlign: "right",
  color: "var(--text-muted)",
  fontWeight: 700,
};
