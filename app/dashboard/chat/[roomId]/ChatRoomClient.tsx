"use client";

import { useState } from "react";

interface Message {
  id: string;
  sender: string;
  content?: string;
  image_url?: string;
  highlight_id?: string;
}

export default function ChatRoomClient({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", sender: "Captain", content: "Great game tonight!" },
    { id: "2", sender: "Player", highlight_id: "abc123" },
  ]);

  return (
    <div
      style={{
        background: "#000",
        color: "white",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          padding: "1rem",
          borderBottom: "1px solid #222",
          fontSize: "1.2rem",
          fontWeight: 600,
        }}
      >
        
      </div>

      <div
        style={{
          flex: 1,
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          overflowY: "auto",
        }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              background: "#111",
              padding: "0.75rem",
              borderRadius: 8,
              border: "1px solid #222",
            }}
          >
            <div style={{ opacity: 0.7, marginBottom: "0.3rem" }}>
              {msg.sender}
            </div>

            {msg.content && <div>{msg.content}</div>}

            {msg.image_url && (
              <img
                src={msg.image_url}
                style={{
                  width: "100%",
                  borderRadius: 8,
                  marginTop: "0.5rem",
                }}
              />
            )}

            {msg.highlight_id && (
              <div
                style={{
                  marginTop: "0.5rem",
                  padding: "0.75rem",
                  background: "#1A1A1A",
                  borderRadius: 8,
                  border: "1px solid #333",
                }}
              >
                <strong>Attached Highlight</strong>
                <div style={{ opacity: 0.7 }}>
                  Highlight ID: {msg.highlight_id}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div
        style={{
          padding: "1rem",
          borderTop: "1px solid #222",
          display: "flex",
          gap: "0.5rem",
        }}
      >
        <input
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: "0.75rem",
            borderRadius: 8,
            border: "1px solid #333",
            background: "#111",
            color: "white",
          }}
        />

        <button
          style={{
            padding: "0.75rem 1rem",
            background: "#12937f",
            borderRadius: 8,
            fontWeight: 600,
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
