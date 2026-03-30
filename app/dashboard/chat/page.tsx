"use client";

import Link from "next/link";
import { chatRooms } from "@/lib/mockLeagueData";

export default function ChatHome() {
  return (
    <main className="page-shell">
      <section className="glass-panel" style={{ padding: "1.25rem", marginBottom: "1rem" }}>
        <div style={{ color: "var(--accent-light)", marginBottom: "0.35rem" }}>Chat</div>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.45rem" }}>League and team messaging</h1>
        <p style={{ color: "var(--text-muted)", maxWidth: "760px" }}>
          Team chat is the daily room for line combos, game reminders, and clip reactions.
          Leadership-only rooms stay available for league operations and film workflows.
        </p>
      </section>

      <section style={{ display: "grid", gap: "1rem" }}>
        {chatRooms.map((room) => (
          <Link
            key={room.id}
            href={`/dashboard/chat/${room.id}`}
            className="glass-panel"
            style={{ padding: "1rem 1.1rem", color: "var(--text)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: "1.2rem", fontWeight: 700 }}>{room.name}</div>
                <div style={{ color: "var(--accent-light)", marginTop: "0.2rem" }}>{room.scope}</div>
                <div style={{ color: "var(--text-muted)", marginTop: "0.45rem" }}>{room.lastMessage}</div>
              </div>
              <div
                style={{
                  minWidth: "110px",
                  textAlign: "right",
                  color: room.unread > 0 ? "#fde68a" : "var(--text-muted)",
                  fontWeight: 700,
                }}
              >
                {room.unread > 0 ? `${room.unread} unread` : "All caught up"}
              </div>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}
