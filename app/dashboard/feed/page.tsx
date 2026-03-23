"use client";

import { useState } from "react";

interface FeedPost {
  id: string;
  created_by: string;
  content: string;
  image_url?: string;
  highlight_id?: string;
  created_at: string;
}

export default function FeedPage() {
  // TEMP MOCK DATA
  const [posts] = useState<FeedPost[]>([
    {
      id: "1",
      created_by: "Captain",
      content: "Great win tonight boys! Highlights are up.",
      created_at: "2026-03-20",
      highlight_id: "abc123",
    },
    {
      id: "2",
      created_by: "Assistant Captain",
      content: "Practice tomorrow at 7pm. Be early.",
      created_at: "2026-03-19",
    },
  ]);

  return (
    <div
      style={{
        padding: "1rem",
        background: "#000",
        color: "white",
        minHeight: "100vh",
      }}
    >
      <h2 style={{ fontSize: "1.4rem", marginBottom: "1rem" }}>
        Captain’s Feed
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {posts.map((post) => (
          <div
            key={post.id}
            style={{
              background: "#111",
              padding: "1rem",
              borderRadius: 10,
              border: "1px solid #222",
            }}
          >
            <div style={{ opacity: 0.7, marginBottom: "0.3rem" }}>
              {post.created_by} • {post.created_at}
            </div>

            <div style={{ marginBottom: "0.5rem" }}>{post.content}</div>

            {post.image_url && (
              <img
                src={post.image_url}
                style={{
                  width: "100%",
                  borderRadius: 8,
                  marginTop: "0.5rem",
                }}
              />
            )}

            {post.highlight_id && (
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
                  Highlight ID: {post.highlight_id}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
