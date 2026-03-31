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
  logo_url?: string | null;
};

const filmStaffRoles = new Set(["captain", "assistant_captain", "film_manager"]);
const captainRoles = new Set(["captain", "assistant_captain", "commissioner"]);

export default function ChatRoomClient({ roomId }: { roomId: string }) {
  const { selectedTeam } = useTeam();
  const activeTeam = selectedTeam;
  const [loading, setLoading] = useState(true);
  const [draftMessage, setDraftMessage] = useState("");
  const [room, setRoom] = useState<RoomRow | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [playersById, setPlayersById] = useState<Record<string, PlayerRow>>({});
  const [team, setTeam] = useState<TeamRow | null>(null);
  const [canCompose, setCanCompose] = useState(true);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!activeTeam) {
      return;
    }
    const teamMember = activeTeam;

    const activeState = { current: true };

    async function loadRoom() {
      setLoading(true);
      setError("");

      const roomResult = await supabase
        .from("chat_rooms")
        .select("id, type, team_id, created_at")
        .eq("id", roomId)
        .maybeSingle();

      const nextRoom = roomResult.data as RoomRow | null;

      if (!nextRoom) {
        if (activeState.current) {
          setError("Chat room not found.");
          setLoading(false);
        }
        return;
      }

      if (
        nextRoom.type.startsWith("league_announcements:") &&
        nextRoom.type !== `league_announcements:${teamMember.leagueId}`
      ) {
        setError("This room belongs to another league.");
        setLoading(false);
        return;
      }

      if (nextRoom.team_id && nextRoom.team_id !== teamMember.id) {
        setError("This room belongs to another team.");
        setLoading(false);
        return;
      }

      if (nextRoom.type === "captains" && !captainRoles.has(teamMember.role ?? "")) {
        setError("Only captains and assistant captains can open this room.");
        setLoading(false);
        return;
      }

      if (nextRoom.type === "film_staff" && !filmStaffRoles.has(teamMember.role ?? "")) {
        setError("Only captains, assistants, and film managers can open this room.");
        setLoading(false);
        return;
      }

      setCanCompose(
        nextRoom.type.startsWith("league_announcements:")
          ? captainRoles.has(teamMember.role ?? "")
          : true
      );

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
        nextRoom.team_id
          ? supabase
              .from("teams")
              .select("id, name, logo_url")
              .eq("id", nextRoom.team_id)
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

      if (!activeState.current) {
        return;
      }

      setRoom(nextRoom);
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
      activeState.current = false;
      void supabase.removeChannel(channel);
    };
  }, [activeTeam, roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const roomTitle = useMemo(() => {
    if (room?.type === "captains") {
      return `${team?.name ?? activeTeam?.name ?? "Team"} Leadership`;
    }
    if (room?.type === "film_staff") {
      return `${team?.name ?? activeTeam?.name ?? "Team"} Film Room`;
    }
    if (room?.type.startsWith("league_announcements:")) {
      return "League Announcements";
    }
    if (room?.type === "team") {
      return `${team?.name ?? activeTeam?.name ?? "Team"} Chat`;
    }
    return "Chat Room";
  }, [activeTeam?.name, room?.type, team?.name]);

  const messageItems = useMemo(() => {
    const items: Array<{ kind: "day"; id: string; label: string } | { kind: "message"; message: MessageRow }> = [];
    let lastDay = "";

    for (const message of messages) {
      const dayLabel = message.created_at ? formatDayLabel(message.created_at) : "Today";
      if (dayLabel !== lastDay) {
        items.push({
          kind: "day",
          id: `${dayLabel}-${message.id}`,
          label: dayLabel,
        });
        lastDay = dayLabel;
      }
      items.push({
        kind: "message",
        message,
      });
    }

    return items;
  }, [messages]);

  async function handleSendMessage() {
    if (!activeTeam || !draftMessage.trim() || !canCompose) {
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
        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
          {team?.logo_url ? (
            <img src={team.logo_url} alt={team.name} style={headerLogoStyle} />
          ) : null}
          <div>
            <div style={{ fontSize: "1.45rem", fontWeight: 700 }}>{roomTitle}</div>
            <div style={{ color: "var(--accent-light)", marginTop: "0.25rem" }}>
              {room?.type === "team"
                ? "Players and team staff"
                : room?.type === "captains"
                  ? "Captains and assistant captains"
                  : room?.type.startsWith("league_announcements:")
                    ? "League-wide read channel"
                    : "Captains, assistants, and film staff"}
            </div>
          </div>
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

        {messageItems.map((item) => {
          if (item.kind === "day") {
            return (
              <div key={item.id} style={dayDividerWrapStyle}>
                <div style={dayDividerLineStyle} />
                <div style={dayDividerLabelStyle}>{item.label}</div>
                <div style={dayDividerLineStyle} />
              </div>
            );
          }

          const msg = item.message;
          const sender = playersById[msg.sender_id ?? ""];
          const isSelf = msg.sender_id === selectedTeam.player_id;

          return (
            <div
              key={msg.id}
              style={{
                display: "flex",
                justifyContent: isSelf ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isSelf ? "minmax(0,1fr)" : "42px minmax(0,1fr)",
                  gap: "0.6rem",
                  alignItems: "end",
                  maxWidth: "92%",
                }}
              >
                {!isSelf ? (
                  <img
                    src={sender?.profile_pic_url || "https://via.placeholder.com/84?text=P"}
                    alt={sender?.name || "Player"}
                    style={bubbleAvatarStyle}
                  />
                ) : null}

                <div
                  style={{
                    justifySelf: isSelf ? "end" : "start",
                    maxWidth: "100%",
                    background: isSelf
                      ? "linear-gradient(135deg, rgba(249,115,22,0.22), rgba(234,88,12,0.18))"
                      : "rgba(7, 17, 31, 0.78)",
                    padding: "0.85rem 0.9rem",
                    borderRadius: 18,
                    border: "1px solid var(--line)",
                  }}
                >
                  <div
                    style={{
                      color: isSelf ? "rgba(255,255,255,0.88)" : "var(--accent-light)",
                      marginBottom: "0.22rem",
                      fontWeight: 700,
                      fontSize: "0.88rem",
                    }}
                  >
                    {isSelf ? "You" : sender?.name || "Player"}
                  </div>
                  <div style={{ color: "var(--text)", whiteSpace: "pre-wrap", lineHeight: 1.45 }}>
                    {msg.message}
                  </div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.74rem", marginTop: "0.45rem" }}>
                    {msg.created_at ? formatTime(msg.created_at) : "Sending..."}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {canCompose ? (
        <div
          className="glass-panel"
          style={{ margin: "0 1rem 1rem", padding: "0.85rem", display: "flex", gap: "0.55rem" }}
        >
          <textarea
            placeholder="Type a message..."
            value={draftMessage}
            onChange={(event) => setDraftMessage(event.target.value)}
            rows={1}
            style={composerStyle}
          />

          <button onClick={handleSendMessage} disabled={!draftMessage.trim()} style={sendButtonStyle}>
            Send
          </button>
        </div>
      ) : (
        <div className="glass-panel" style={readOnlyBannerStyle}>
          This room is read-only for players. Captains, assistants, and commissioners can post league announcements.
        </div>
      )}
    </div>
  );
}

function formatDayLabel(value: string) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(date, today)) return "Today";
  if (sameDay(date, yesterday)) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatTime(value: string) {
  return new Date(value).toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

const headerLogoStyle: CSSProperties = {
  width: "42px",
  height: "42px",
  borderRadius: "14px",
  objectFit: "contain",
  background: "rgba(255,255,255,0.06)",
  padding: "0.2rem",
};

const bubbleAvatarStyle: CSSProperties = {
  width: "42px",
  height: "42px",
  borderRadius: "50%",
  objectFit: "cover",
  border: "1px solid rgba(148,163,184,0.18)",
  background: "rgba(255,255,255,0.08)",
};

const dayDividerWrapStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0,1fr) auto minmax(0,1fr)",
  gap: "0.6rem",
  alignItems: "center",
  margin: "0.15rem 0 0.1rem",
};

const dayDividerLineStyle: CSSProperties = {
  height: "1px",
  background: "rgba(148,163,184,0.16)",
};

const dayDividerLabelStyle: CSSProperties = {
  color: "var(--text-muted)",
  fontSize: "0.76rem",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const composerStyle: CSSProperties = {
  flex: 1,
  padding: "0.85rem 0.95rem",
  borderRadius: 14,
  border: "1px solid var(--line)",
  background: "rgba(7, 17, 31, 0.7)",
  color: "white",
  resize: "none",
  minHeight: "50px",
};

const sendButtonStyle: CSSProperties = {
  padding: "0.9rem 1rem",
  background: "linear-gradient(135deg, #f97316, #ea580c)",
  borderRadius: 14,
  fontWeight: 700,
  color: "white",
  minWidth: "74px",
  opacity: 1,
};

const errorStyle: CSSProperties = {
  margin: "1rem 1rem 0",
  padding: "0.9rem 1rem",
  color: "#fecaca",
  borderColor: "rgba(248,113,113,0.35)",
};

const readOnlyBannerStyle: CSSProperties = {
  margin: "0 1rem 1rem",
  padding: "0.9rem 1rem",
  color: "var(--text-muted)",
};
