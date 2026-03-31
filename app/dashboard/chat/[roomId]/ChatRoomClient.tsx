"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useTeam } from "@/context/TeamContext";

type MessageRow = {
  id: string;
  room_id: string | null;
  sender_id: string | null;
  message: string;
  created_at: string | null;
};

type RoomRow = {
  id: string;
  type: string;
  team_id: string | null;
  created_at: string | null;
};

type PlayerRow = {
  id: string;
  name: string | null;
  profile_pic_url: string | null;
};

type TeamRow = {
  id: string;
  name: string;
};

export default function ChatRoomClient({ roomId }: { roomId: string }) {
  const { selectedTeam } = useTeam();
  const activeTeam = selectedTeam;
  const [loading, setLoading] = useState(true);
  const [draftMessage, setDraftMessage] = useState("");
  const [room, setRoom] = useState<RoomRow | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [playersById, setPlayersById] = useState<Record<string, PlayerRow>>({});
  const [team, setTeam] = useState<TeamRow | null>(null);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!activeTeam) {
      return;
    }
    const teamMember = activeTeam;

    let active = true;

    async function loadRoom() {
      setLoading(true);
      setError("");

      const roomResult = await supabase
        .from("chat_rooms")
        .select("id, type, team_id, created_at")
        .eq("id", roomId)
        .maybeSingle();

      if (!roomResult.data) {
        if (active) {
          setError("Chat room not found.");
          setLoading(false);
        }
        return;
      }

      const membershipResult = await supabase
        .from("chat_room_members")
        .select("id")
        .eq("room_id", roomId)
        .eq("user_id", teamMember.player_id)
        .maybeSingle();

      if (!membershipResult.data?.id) {
        await supabase.from("chat_room_members").insert({
          room_id: roomId,
          user_id: teamMember.player_id,
        });
      }

      const [messageResult, teamResult] = await Promise.all([
        supabase
          .from("chat_messages")
          .select("id, room_id, sender_id, message, created_at")
          .eq("room_id", roomId)
          .order("created_at", { ascending: true }),
        roomResult.data.team_id
          ? supabase
              .from("teams")
              .select("id, name")
              .eq("id", roomResult.data.team_id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      const senderIds = Array.from(
        new Set(
          ((messageResult.data ?? []) as MessageRow[])
            .map((message) => message.sender_id)
            .filter(Boolean)
        )
      ) as string[];

      const playerResult = senderIds.length
        ? await supabase
            .from("players")
            .select("id, name, profile_pic_url")
            .in("id", senderIds)
        : { data: [] as PlayerRow[] };

      if (!active) {
        return;
      }

      setRoom(roomResult.data as RoomRow);
      setMessages((messageResult.data ?? []) as MessageRow[]);
      setTeam((teamResult.data as TeamRow | null) ?? null);
      setPlayersById(
        Object.fromEntries(((playerResult.data ?? []) as PlayerRow[]).map((player) => [player.id, player]))
      );
      setLoading(false);
    }

    loadRoom();

    const channel = supabase
      .channel(`chat-room-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          const message = payload.new as MessageRow;

          setMessages((current) => {
            if (current.some((item) => item.id === message.id)) {
              return current;
            }
            return [...current, message];
          });

          if (message.sender_id) {
            const { data: playerRow } = await supabase
              .from("players")
              .select("id, name, profile_pic_url")
              .eq("id", message.sender_id)
              .maybeSingle();

            if (playerRow) {
              setPlayersById((current) => ({
                ...current,
                [playerRow.id]: playerRow as PlayerRow,
              }));
            }
          }
        }
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [activeTeam, roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const roomTitle = useMemo(() => {
    if (room?.type === "team") {
      return `${team?.name ?? activeTeam?.name ?? "Team"} Chat`;
    }

    return "Chat Room";
  }, [activeTeam?.name, room?.type, team?.name]);

  async function handleSendMessage() {
    if (!activeTeam || !draftMessage.trim()) {
      return;
    }

    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticMessage: MessageRow = {
      id: optimisticId,
      room_id: roomId,
      sender_id: activeTeam.player_id,
      message: draftMessage.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages((current) => [...current, optimisticMessage]);
    setDraftMessage("");

    const { data, error: sendError } = await supabase
      .from("chat_messages")
      .insert({
        room_id: roomId,
        sender_id: activeTeam.player_id,
        message: optimisticMessage.message,
      })
      .select("id, room_id, sender_id, message, created_at")
      .single();

    if (sendError || !data) {
      setError(sendError?.message || "Could not send message.");
      setMessages((current) => current.filter((message) => message.id !== optimisticId));
      setDraftMessage(optimisticMessage.message);
      return;
    }

    setMessages((current) =>
      current.map((message) => (message.id === optimisticId ? (data as MessageRow) : message))
    );
  }

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
        <p>Loading chat...</p>
      </main>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div className="glass-panel" style={{ padding: "1rem", margin: "1rem 1rem 0" }}>
        <Link href="/dashboard/chat" style={{ display: "inline-block", marginBottom: "0.7rem" }}>
          Back to chat
        </Link>
        <div style={{ fontSize: "1.45rem", fontWeight: 700 }}>{roomTitle}</div>
        <div style={{ color: "var(--accent-light)", marginTop: "0.25rem" }}>
          {room?.type === "team" ? "Players and team staff" : room?.type ?? "Room"}
        </div>
      </div>

      {error ? (
        <div className="glass-panel" style={errorStyle}>
          {error}
        </div>
      ) : null}

      <div
        style={{
          flex: 1,
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.9rem",
          overflowY: "auto",
        }}
      >
        {messages.length === 0 ? (
          <div className="glass-panel" style={{ padding: "1rem", color: "var(--text-muted)" }}>
            No messages yet. Be the first one in the room.
          </div>
        ) : null}

        {messages.map((msg) => {
          const sender = playersById[msg.sender_id ?? ""];
          const isSelf = msg.sender_id === selectedTeam.player_id;

          return (
            <div
              key={msg.id}
              style={{
                alignSelf: isSelf ? "flex-end" : "stretch",
                maxWidth: isSelf ? "88%" : "100%",
                background: isSelf
                  ? "linear-gradient(135deg, rgba(249,115,22,0.22), rgba(234,88,12,0.18))"
                  : "rgba(7, 17, 31, 0.78)",
                padding: "0.9rem",
                borderRadius: 16,
                border: "1px solid var(--line)",
              }}
            >
              <div style={{ color: "var(--accent-light)", marginBottom: "0.2rem", fontWeight: 700 }}>
                {sender?.name || "Player"}
              </div>
              <div style={{ color: "var(--text)", marginBottom: "0.5rem", whiteSpace: "pre-wrap" }}>
                {msg.message}
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
                {msg.created_at ? formatStamp(msg.created_at) : "Sending..."}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div
        className="glass-panel"
        style={{ margin: "0 1rem 1rem", padding: "1rem", display: "flex", gap: "0.5rem" }}
      >
        <textarea
          placeholder="Type a message..."
          value={draftMessage}
          onChange={(event) => setDraftMessage(event.target.value)}
          rows={1}
          style={composerStyle}
        />

        <button
          onClick={handleSendMessage}
          disabled={!draftMessage.trim()}
          style={sendButtonStyle}
        >
          Send
        </button>
      </div>
    </div>
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

const composerStyle: CSSProperties = {
  flex: 1,
  padding: "0.9rem",
  borderRadius: 14,
  border: "1px solid var(--line)",
  background: "rgba(7, 17, 31, 0.7)",
  color: "white",
  resize: "none",
  minHeight: "52px",
};

const sendButtonStyle: CSSProperties = {
  padding: "0.9rem 1rem",
  background: "linear-gradient(135deg, #f97316, #ea580c)",
  borderRadius: 14,
  fontWeight: 700,
  color: "white",
  alignSelf: "stretch",
};

const errorStyle: CSSProperties = {
  margin: "1rem 1rem 0",
  padding: "0.85rem 1rem",
  color: "#fecaca",
  border: "1px solid rgba(239,68,68,0.3)",
  background: "rgba(127,29,29,0.28)",
};
