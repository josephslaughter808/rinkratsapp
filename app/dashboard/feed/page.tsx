"use client";

import { currentMember, feedPosts, getTeam } from "@/lib/mockLeagueData";

export default function FeedPage() {
  return (
    <main className="page-shell">
      <section className="glass-panel" style={{ padding: "1.25rem", marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <div style={{ color: "var(--accent-light)", marginBottom: "0.35rem" }}>Team Feed</div>
            <h1 style={{ fontSize: "2rem", marginBottom: "0.45rem" }}>Captain and assistant updates</h1>
            <p style={{ color: "var(--text-muted)", maxWidth: "760px" }}>
              Only captains and assistant captains can publish here. This is where
              strategy notes, film examples, and player shout-outs live for the season.
            </p>
          </div>
          <div style={feedAccessCardStyle}>
            <div style={{ color: "var(--text-muted)", marginBottom: "0.35rem" }}>Your Posting Access</div>
            <div style={{ fontSize: "1.15rem", fontWeight: 700, textTransform: "capitalize" }}>
              {currentMember.role.replaceAll("_", " ")}
            </div>
            <div style={{ marginTop: "0.35rem", color: "var(--accent-light)" }}>
              Read-only for players; posting stays with team leadership.
            </div>
          </div>
        </div>
      </section>

      <section style={{ display: "grid", gap: "1rem", gridTemplateColumns: "minmax(0, 2fr) minmax(280px, 1fr)" }}>
        <div style={{ display: "grid", gap: "1rem" }}>
          {feedPosts.map((post) => {
            const team = getTeam(post.teamId);

            return (
              <article key={post.id} className="glass-panel" style={{ padding: "1.2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.8rem" }}>
                  <div>
                    <div style={{ color: "var(--accent-light)", marginBottom: "0.25rem" }}>
                      {post.role} • {team?.name}
                    </div>
                    <h2 style={{ fontSize: "1.55rem" }}>{post.title}</h2>
                  </div>
                  <div style={{ color: "var(--text-muted)" }}>{post.createdAt}</div>
                </div>

                <p style={{ color: "var(--text-muted)", marginBottom: "0.9rem" }}>{post.body}</p>

                {post.attachmentLabel ? (
                  <div style={attachmentBoxStyle}>
                    <div style={{ fontWeight: 700 }}>{post.attachmentLabel}</div>
                    <div style={{ color: "var(--text-muted)", marginTop: "0.25rem" }}>
                      {post.linkedHighlightId
                        ? `Linked highlight: ${post.linkedHighlightId}`
                        : "Linked to season film library"}
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>

        <aside className="glass-panel" style={{ padding: "1.2rem", height: "fit-content" }}>
          <div style={{ color: "var(--accent-light)", marginBottom: "0.4rem" }}>Season Rules</div>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.7rem" }}>Feed permissions</h2>
          <div style={sideNoteStyle}>Captains and assistants can post strategy notes, film examples, and player spotlights.</div>
          <div style={sideNoteStyle}>Players can react, read, and jump into team chat, but cannot publish to the feed.</div>
          <div style={sideNoteStyle}>League captains and film staff retain access to all season game film across the league.</div>
        </aside>
      </section>
    </main>
  );
}

const feedAccessCardStyle: React.CSSProperties = {
  padding: "1rem",
  minWidth: "250px",
  borderRadius: "16px",
  border: "1px solid var(--line)",
  background: "var(--surface-light)",
};

const attachmentBoxStyle: React.CSSProperties = {
  borderRadius: "16px",
  padding: "0.9rem",
  background: "rgba(7, 17, 31, 0.7)",
  border: "1px solid var(--line)",
};

const sideNoteStyle: React.CSSProperties = {
  padding: "0.9rem",
  borderRadius: "14px",
  border: "1px solid var(--line)",
  background: "rgba(7, 17, 31, 0.68)",
  color: "var(--text-muted)",
  marginBottom: "0.7rem",
};
