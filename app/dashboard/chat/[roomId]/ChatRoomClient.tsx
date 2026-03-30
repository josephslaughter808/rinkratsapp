"use client";

import Link from "next/link";
import { useState } from "react";
import { chatRooms, roomMessages } from "@/lib/mockLeagueData";

export default function ChatRoomClient({ roomId }: { roomId: string }) {
  const room = chatRooms.find((item) => item.id === roomId);
  const [draftMessage] = useState("");
  const messages = roomMessages[roomId] || [];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div className="glass-panel" style={{ padding: "1rem", margin: "1rem 1rem 0" }}>
        <Link href="/dashboard/chat" style={{ display: "inline-block", marginBottom: "0.7rem" }}>
          Back to chat
        </Link>
        <div style={{ fontSize: "1.45rem", fontWeight: 700 }}>{room?.name || "Chat room"}</div>
        <div style={{ color: "var(--accent-light)", marginTop: "0.25rem" }}>{room?.scope}</div>
      </div>

      <div style={{ flex: 1, padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem", overflowY: "auto" }}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              background: "rgba(7, 17, 31, 0.78)",
              padding: "0.9rem",
              borderRadius: 14,
              border: "1px solid var(--line)",
            }}
          >
            <div style={{ color: "var(--accent-light)", marginBottom: "0.2rem" }}>
              {msg.sender} • {msg.role}
            </div>
            <div style={{ color: "var(--text)", marginBottom: "0.5rem" }}>{msg.content}</div>
            <div style={{ color: "var(--text-muted)" }}>{msg.stamp}</div>
          </div>
        ))}
      </div>

      <div className="glass-panel" style={{ margin: "0 1rem 1rem", padding: "1rem", display: "flex", gap: "0.5rem" }}>
        <input
          placeholder="Type a message..."
          value={draftMessage}
          readOnly
          style={{
            flex: 1,
            padding: "0.9rem",
            borderRadius: 14,
            border: "1px solid var(--line)",
            background: "rgba(7, 17, 31, 0.7)",
            color: "white",
          }}
        />

        <button
          style={{
            padding: "0.9rem 1rem",
            background: "linear-gradient(135deg, #f97316, #ea580c)",
            borderRadius: 14,
            fontWeight: 600,
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
