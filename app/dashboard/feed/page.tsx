"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useTeam } from "@/context/TeamContext";

type FeedPostRow = {
  id: string;
  team_id: string;
  author_player_id: string;
  post_type: "announcement" | "highlight" | "survey";
  title: string;
  body: string;
  attachment_url: string | null;
  poll_options: string[] | null;
  created_at: string | null;
  author?: {
    id: string;
    name: string | null;
    profile_pic_url: string | null;
  } | null;
};

const leadershipRoles = new Set(["captain", "assistant_captain"]);

export default function FeedPage() {
  const { selectedTeam } = useTeam();
  const activeTeam = selectedTeam;
  const canPost = leadershipRoles.has(activeTeam?.role ?? "");

  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [error, setError] = useState("");
  const [posts, setPosts] = useState<FeedPostRow[]>([]);
  const [postType, setPostType] = useState<FeedPostRow["post_type"]>("announcement");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [surveyOptions, setSurveyOptions] = useState("Yes\nNo");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!activeTeam) {
      return;
    }
    const teamMember = activeTeam;

    const activeState = { current: true };

    async function loadFeed() {
      setLoading(true);
      setError("");
      setNeedsSetup(false);

      const result = await supabase
        .from("team_feed_posts")
        .select(
          "id, team_id, author_player_id, post_type, title, body, attachment_url, poll_options, created_at, author:players!team_feed_posts_author_player_id_fkey(id, name, profile_pic_url)"
        )
        .eq("team_id", teamMember.id)
        .order("created_at", { ascending: false });

      if (!activeState.current) {
        return;
      }

      if (result.error?.code === "PGRST205") {
        setNeedsSetup(true);
        setPosts([]);
        setLoading(false);
        return;
      }

      if (result.error) {
        setError(result.error.message);
        setPosts([]);
        setLoading(false);
        return;
      }

      setPosts(normalizeFeedRows(result.data ?? []));
      setLoading(false);
    }

    loadFeed();
    return () => {
      activeState.current = false;
    };
  }, [activeTeam]);

  const parsedSurveyOptions = useMemo(() => {
    return surveyOptions
      .split("\n")
      .map((option) => option.trim())
      .filter(Boolean);
  }, [surveyOptions]);

  async function handleSubmitPost() {
    if (!activeTeam || !canPost || !title.trim() || !body.trim()) {
      return;
    }

    setSaving(true);
    setError("");

    const insertResult = await supabase
      .from("team_feed_posts")
      .insert({
        team_id: activeTeam.id,
        author_player_id: activeTeam.player_id,
        post_type: postType,
        title: title.trim(),
        body: body.trim(),
        attachment_url: attachmentUrl.trim() || null,
        poll_options: postType === "survey" ? parsedSurveyOptions : null,
      })
      .select(
        "id, team_id, author_player_id, post_type, title, body, attachment_url, poll_options, created_at, author:players!team_feed_posts_author_player_id_fkey(id, name, profile_pic_url)"
      )
      .single();

    if (insertResult.error) {
      if (insertResult.error.code === "PGRST205") {
        setNeedsSetup(true);
      } else {
        setError(insertResult.error.message);
      }
      setSaving(false);
      return;
    }

    const normalizedRow = normalizeFeedRows(insertResult.data ? [insertResult.data] : [])[0];
    setPosts((current) => (normalizedRow ? [normalizedRow, ...current] : current));
    setTitle("");
    setBody("");
    setAttachmentUrl("");
    setSurveyOptions("Yes\nNo");
    setPostType("announcement");
    setSaving(false);
  }

  if (!activeTeam) {
    return (
      <main className="page-shell">
        <section className="glass-panel" style={{ padding: "1.2rem" }}>
          Select a team to open the feed.
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell" style={{ paddingBottom: "6rem" }}>
      <section className="glass-panel" style={{ padding: "1.1rem", marginBottom: "0.9rem" }}>
        <div style={{ color: "var(--accent-light)", marginBottom: "0.35rem" }}>Team Feed</div>
        <h1 style={{ fontSize: "1.8rem", marginBottom: "0.35rem" }}>{activeTeam.name} updates</h1>
        <p style={{ color: "var(--text-muted)", lineHeight: 1.5 }}>
          Captains and assistant captains can publish announcements, highlight notes, and team surveys
          here for the room to read all season.
        </p>
      </section>

      {needsSetup ? (
        <section className="glass-panel" style={{ padding: "1rem", marginBottom: "0.9rem" }}>
          <div style={{ color: "#facc15", fontWeight: 700, marginBottom: "0.35rem" }}>
            Feed setup needed
          </div>
          <p style={{ color: "var(--text-muted)", lineHeight: 1.5 }}>
            The live database does not have `team_feed_posts` yet. Run the new migration in Supabase,
            then this tab will switch from setup mode to the real feed immediately.
          </p>
        </section>
      ) : null}

      {error ? (
        <section className="glass-panel" style={{ padding: "1rem", marginBottom: "0.9rem", color: "#fecaca" }}>
          {error}
        </section>
      ) : null}

      {canPost ? (
        <section className="glass-panel" style={{ padding: "1rem", marginBottom: "0.9rem" }}>
          <div style={{ color: "var(--accent-light)", marginBottom: "0.35rem" }}>New post</div>
          <div style={fieldStackStyle}>
            <div style={chipRowStyle}>
              {(["announcement", "highlight", "survey"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setPostType(option)}
                  style={typeChipStyle(postType === option)}
                >
                  {labelForPostType(option)}
                </button>
              ))}
            </div>

            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={
                postType === "highlight"
                  ? "Highlight title"
                  : postType === "survey"
                    ? "Survey question"
                    : "Announcement title"
              }
              style={inputStyle}
            />

            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Write the post body..."
              rows={4}
              style={textareaStyle}
            />

            <input
              value={attachmentUrl}
              onChange={(event) => setAttachmentUrl(event.target.value)}
              placeholder="Optional link"
              style={inputStyle}
            />

            {postType === "survey" ? (
              <textarea
                value={surveyOptions}
                onChange={(event) => setSurveyOptions(event.target.value)}
                placeholder={"Yes\nNo"}
                rows={3}
                style={textareaStyle}
              />
            ) : null}

            <button type="button" onClick={handleSubmitPost} disabled={saving || needsSetup} style={publishButtonStyle}>
              {saving ? "Posting..." : "Publish Post"}
            </button>
          </div>
        </section>
      ) : (
        <section className="glass-panel" style={{ padding: "1rem", marginBottom: "0.9rem" }}>
          <div style={{ color: "var(--accent-light)", marginBottom: "0.35rem" }}>Posting access</div>
          <p style={{ color: "var(--text-muted)", lineHeight: 1.5 }}>
            This tab is read-only for players. Captains and assistant captains can publish updates.
          </p>
        </section>
      )}

      <section style={{ display: "grid", gap: "0.9rem" }}>
        {loading ? (
          <div className="glass-panel" style={{ padding: "1rem" }}>
            Loading feed...
          </div>
        ) : posts.length === 0 ? (
          <div className="glass-panel" style={{ padding: "1rem", color: "var(--text-muted)" }}>
            No posts yet. Captains can publish the first update here.
          </div>
        ) : (
          posts.map((post) => (
            <article key={post.id} className="glass-panel" style={{ padding: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "48px minmax(0,1fr) auto", gap: "0.8rem", alignItems: "start" }}>
                <img
                  src={post.author?.profile_pic_url || "https://via.placeholder.com/96?text=P"}
                  alt={post.author?.name || "Author"}
                  style={authorAvatarStyle}
                />

                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                    <span style={feedTypePillStyle(post.post_type)}>{labelForPostType(post.post_type)}</span>
                    <span style={{ color: "var(--accent-light)", fontSize: "0.82rem" }}>
                      {post.author?.name || "Team leadership"}
                    </span>
                  </div>
                  <h2 style={{ fontSize: "1.2rem", marginTop: "0.4rem", lineHeight: 1.2 }}>{post.title}</h2>
                  <p style={{ color: "var(--text-muted)", lineHeight: 1.55, marginTop: "0.5rem" }}>{post.body}</p>

                  {post.attachment_url ? (
                    <a
                      href={post.attachment_url}
                      target="_blank"
                      rel="noreferrer"
                      style={attachmentLinkStyle}
                    >
                      Open linked item
                    </a>
                  ) : null}

                  {post.post_type === "survey" && post.poll_options?.length ? (
                    <div style={{ display: "grid", gap: "0.45rem", marginTop: "0.8rem" }}>
                      {post.poll_options.map((option) => (
                        <div key={option} style={surveyOptionStyle}>
                          {option}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div style={{ color: "var(--text-muted)", fontSize: "0.78rem", textAlign: "right" }}>
                  {post.created_at ? formatStamp(post.created_at) : ""}
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}

function normalizeFeedRows(rows: Array<Record<string, unknown>>) {
  return rows.map((row) => {
    const authorValue = row.author;
    const author = Array.isArray(authorValue) ? authorValue[0] : authorValue;

    return {
      ...(row as Omit<FeedPostRow, "author" | "poll_options">),
      poll_options: Array.isArray(row.poll_options) ? (row.poll_options as string[]) : null,
      author: author && typeof author === "object"
        ? {
            id: String((author as Record<string, unknown>).id ?? ""),
            name: ((author as Record<string, unknown>).name as string | null) ?? null,
            profile_pic_url:
              ((author as Record<string, unknown>).profile_pic_url as string | null) ?? null,
          }
        : null,
    } satisfies FeedPostRow;
  });
}

function labelForPostType(type: FeedPostRow["post_type"]) {
  if (type === "highlight") return "Highlight";
  if (type === "survey") return "Survey";
  return "Announcement";
}

function formatStamp(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function typeChipStyle(active: boolean): CSSProperties {
  return {
    minHeight: "40px",
    padding: "0.65rem 0.9rem",
    borderRadius: "999px",
    border: `1px solid ${active ? "rgba(249,115,22,0.45)" : "rgba(148,163,184,0.16)"}`,
    background: active ? "rgba(249,115,22,0.16)" : "rgba(15,23,42,0.82)",
    color: active ? "var(--accent-light)" : "var(--text)",
    fontWeight: 700,
  };
}

function feedTypePillStyle(type: FeedPostRow["post_type"]): CSSProperties {
  const color =
    type === "survey" ? "#60a5fa" : type === "highlight" ? "#f97316" : "#facc15";

  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "26px",
    padding: "0.25rem 0.6rem",
    borderRadius: "999px",
    background: color,
    color: "#0f172a",
    fontSize: "0.74rem",
    fontWeight: 800,
  };
}

const fieldStackStyle: CSSProperties = {
  display: "grid",
  gap: "0.75rem",
};

const chipRowStyle: CSSProperties = {
  display: "flex",
  gap: "0.55rem",
  flexWrap: "wrap",
};

const inputStyle: CSSProperties = {
  width: "100%",
  minHeight: "46px",
  borderRadius: "14px",
  border: "1px solid var(--line)",
  background: "rgba(7, 17, 31, 0.72)",
  color: "white",
  padding: "0.85rem 0.95rem",
};

const textareaStyle: CSSProperties = {
  width: "100%",
  borderRadius: "14px",
  border: "1px solid var(--line)",
  background: "rgba(7, 17, 31, 0.72)",
  color: "white",
  padding: "0.85rem 0.95rem",
  resize: "vertical",
};

const publishButtonStyle: CSSProperties = {
  minHeight: "48px",
  borderRadius: "14px",
  background: "linear-gradient(135deg, #f97316, #ea580c)",
  color: "white",
  fontWeight: 800,
};

const authorAvatarStyle: CSSProperties = {
  width: "48px",
  height: "48px",
  borderRadius: "50%",
  objectFit: "cover",
  border: "1px solid rgba(148,163,184,0.18)",
  background: "rgba(255,255,255,0.08)",
};

const attachmentLinkStyle: CSSProperties = {
  display: "inline-flex",
  marginTop: "0.75rem",
  color: "var(--accent-light)",
  fontWeight: 700,
};

const surveyOptionStyle: CSSProperties = {
  borderRadius: "14px",
  padding: "0.8rem 0.9rem",
  border: "1px solid rgba(148,163,184,0.16)",
  background: "rgba(7,17,31,0.62)",
};
