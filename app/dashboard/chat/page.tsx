"use client";

import Link from "next/link";

export default function ChatHome() {
  return (
    <div
      style={{
        padding: "1rem",
        background: "#000",
        color: "white",
        minHeight: "100vh",
      }}
    >
      <h2 style={{ fontSize: "1.4rem", marginBottom: "1rem" }}>Chat</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <Link
          href="/dashboard/chat/team"
          style={{
            background: "#111",
            padding: "1rem",
            borderRadius: 10,
            border: "1px solid #222",
            fontWeight: 600,
          }}
        >
          Team Chat
        </Link>

        <Link
          href="/dashboard/chat/captains"
          style={{
            background: "#111",
            padding: "1rem",
            borderRadius: 10,
            border: "1px solid #222",
            fontWeight: 600,
          }}
        >
          Captains Chat
        </Link>

        <Link
          href="/dashboard/chat/captains-assistants"
          style={{
            background: "#111",
            padding: "1rem",
            borderRadius: 10,
            border: "1px solid #222",
            fontWeight: 600,
          }}
        >
          Captains + Assistants
        </Link>
      </div>
    </div>
  );
}
