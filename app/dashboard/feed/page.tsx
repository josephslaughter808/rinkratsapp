"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useTeam } from "@/context/TeamContext";

type FeedScope = "team" | "league";

type FeedPost = {
  id: string;
  scope: FeedScope;
  title: string;
  body: string;
  post_type: "announcement" | "highlight" | "survey";
  attachment_url: string | null;
  poll_options: string[] | null;
  created_at: string | null;
  author?: {
    id: string;
    name: string | null;
    profile_pic_url: string | null;
  } | null;
};

type LeagueRow = {
  id: string;
  name: string;
  season: string | null;
};

const teamPostingRoles = new Set(["captain", "assistant_captain"]);
const leaguePostingRoles = new Set(["captain", "commissioner"]);

export default function FeedPage() {
  const { selectedTeam } = useTeam();
  const activeTeam = selectedTeam;

  const [activeScope, setActiveScope] = useState<FeedScope>("team");
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState<FeedScope | null>(null);
  const [error, setError] = useState("");
  const [leagueInfo, setLeagueInfo] = useState<LeagueRow | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [postType, setPostType] = useState<FeedPost["post_type"]>("announcement");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [surveyOptions, setSurveyOptions] = useState("Yes\nNo");
  const [saving, setSaving] = useState(false);

  const canPost = useMemo(() => {
    if (!activeTeam) {
      return false;
    }
    return activeScope === "league"
      ? leaguePostingRoles.has(activeTeam.role ?? "")
      : teamPostingRoles.has(activeTeam.role ?? "");
  }, [activeScope, activeTeam]);

  useEffect(() => {
    if (!activeTeam?.leagueId) {
      return;
    }
    const teamMember = activeTeam;
    const activeState = { current: true };

    async function loadLeagueInfo() {
      const result = await supabase
        .from("leagues")
        .select("id, name, season")
        .eq("id", teamMember.leagueId)
        .maybeSingle();

      if (!activeState.current) {
        return;
      }

      setLeagueInfo((result.data as LeagueRow | null) ?? null);
    }

    loadLeagueInfo();

    return () => {
      activeState.current = false;
    };
  }, [activeTeam]);

  useEffect(() => {
    if (!activeTeam) {
      return;
    }
    const teamMember = activeTeam;
    const activeState = { current: true };

    async function loadFeed() {
      setLoading(true);
      setError("");
      setNeedsSetup(null);

      const result =
        activeScope === "league"
          ? await supabase
              .from("league_feed_posts")
              .select(
                "id, league_id, author_player_id, post_type, title, body, attachment_url, poll_options, created_at, author:players!league_feed_posts_author_player_id_fkey(id, name, profile_pic_url)"
              )
              .eq("league_id", teamMember.leagueId ?? "")
              .order("created_at", { ascending: false })
          : await supabase
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
        setNeedsSetup(activeScope);
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

      setPosts(
        activeScope === "league"
          ? normalizeLeagueFeedRows((result.data ?? []) as Array<Record<string, unknown>>)
          : normalizeTeamFeedRows((result.data ?? []) as Array<Record<string, unknown>>)
      );
      setLoading(false);
    }

    loadFeed();
    return () => {
      activeState.current = false;
    };
  }, [activeScope, activeTeam]);

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

    const result =
      activeScope === "league"
        ? await supabase
            .from("league_feed_posts")
            .insert({
              league_id: activeTeam.leagueId,
              author_player_id: activeTeam.player_id,
              post_type: postType,
              title: title.trim(),
              body: body.trim(),
              attachment_url: attachmentUrl.trim() || null,
              poll_options: postType === "survey" ? parsedSurveyOptions : null,
            })
            .select(
              "id, league_id, author_player_id, post_type, title, body, attachment_url, poll_options, created_at, author:players!league_feed_posts_author_player_id_fkey(id, name, profile_pic_url)"
            )
            .single()
        : await supabase
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

    if (result.error) {
      if (result.error.code === "PGRST205") {
        setNeedsSetup(activeScope);
      } else {
        setError(result.error.message);
      }
      setSaving(false);
      return;
    }

    const normalized =
      activeScope === "league"
        ? normalizeLeagueFeedRows(result.data ? [result.data as Record<string, unknown>] : [])
        : normalizeTeamFeedRows(result.data ? [result.data as Record<string, unknown>] : []);

    if (normalized[0]) {
      setPosts((current) => [normalized[0], ...current]);
    }

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
        <div style={{ color: "var(--accent-light)", marginBottom: "0.35rem" }}>Feed</div>
        <h1 style={{ fontSize: "1.8rem", marginBottom: "0.35rem" }}>
          {activeScope === "league" ? leagueInfo?.name ?? "League feed" : `${activeTeam.name} updates`}
        </h1>
        <p style={{ color: "var(--text-muted)", lineHeight: 1.5 }}>
          Switch between your team feed and the league-wide announcement feed. Team feed is for roster
          updates. League feed is readable by everyone, with posting reserved for captains and commissioners.
        </p>

        <div style={scopeToggleRowStyle}>
          <button type="button" onClick={() => setActiveScope("team")} style={scopeButtonStyle(activeScope === "team")}>
            Team Feed
          </button>
          <button
            type="button"
            onClick={() => setActiveScope("league")}
            style={scopeButtonStyle(activeScope === "league")}
          >
            League Feed
          </button>
        </div>
      </section>

      {needsSetup ? (
        <section className="glass-panel" style={{ padding: "1rem", marginBottom: "0.9rem" }}>
          <div style={{ color: "#facc15", fontWeight: 700, marginBottom: "0.35rem" }}>
            Feed setup needed
          </div>
          <p style={{ color: "var(--text-muted)", lineHeight: 1.5 }}>
            {needsSetup === "league"
              ? "The live database still needs the new league feed table. Run the latest SQL migration and this view will switch on."
              : "The live database does not have `team_feed_posts` yet. Run the feed migration in Supabase and this tab will switch to the real feed immediately."}
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
          <div style={{ color: "var(--accent-light)", marginBottom: "0.35rem" }}>
            {activeScope === "league" ? "New league post" : "New team post"}
          </div>
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
                    : activeScope === "league"
                      ? "League announcement title"
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

            <button type="button" onClick={handleSubmitPost} disabled={saving || Boolean(needsSetup)} style={publishButtonStyle}>
              {saving ? "Posting..." : activeScope === "league" ? "Publish to League" : "Publish to Team"}
            </button>
          </div>
        </section>
      ) : (
        <section className="glass-panel" style={{ padding: "1rem", marginBottom: "0.9rem" }}>
          <div style={{ color: "var(--accent-light)", marginBottom: "0.35rem" }}>Posting access</div>
          <p style={{ color: "var(--text-muted)", lineHeight: 1.5 }}>
            {activeScope === "league"
              ? "League feed is read-only for players. Only captains and commissioners can post."
              : "This tab is read-only for players. Captains and assistant captains can publish team updates."}
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
            {activeScope === "league"
              ? "No league announcements yet."
              : "No posts yet. Captains can publish the first update here."}
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
                      {post.author?.name || "Leadership"}
                    </span>
                    <span style={scopePillStyle(post.scope)}>
                      {post.scope === "league" ? leagueInfo?.name ?? "League" : activeTeam.name}
                    </span>
                  </div>
                  <h2 style={{ fontSize: "1.2rem", marginTop: "0.4rem", lineHeight: 1.2 }}>{post.title}</h2>
                  <p style={{ color: "var(--text-muted)", lineHeight: 1.55, marginTop: "0.5rem" }}>{post.body}</p>

                  {post.attachment_url ? (
                    <a href={post.attachment_url} target="_blank" rel="noreferrer" style={attachmentLinkStyle}>
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

function normalizeTeamFeedRows(rows: Array<Record<string, unknown>>): FeedPost[] {
  return rows.map((row) => {
    const authorValue = row.author;
    const author = Array.isArray(authorValue) ? authorValue[0] : authorValue;

    return {
      id: String(row.id ?? ""),
      scope: "team",
      title: String(row.title ?? ""),
      body: String(row.body ?? ""),
      post_type: (row.post_type as FeedPost["post_type"]) ?? "announcement",
      attachment_url: (row.attachment_url as string | null) ?? null,
      poll_options: Array.isArray(row.poll_options) ? (row.poll_options as string[]) : null,
      created_at: (row.created_at as string | null) ?? null,
      author:
        author && typeof author === "object"
          ? {
              id: String((author as Record<string, unknown>).id ?? ""),
              name: ((author as Record<string, unknown>).name as string | null) ?? null,
              profile_pic_url:
                ((author as Record<string, unknown>).profile_pic_url as string | null) ?? null,
            }
          : null,
    };
  });
}

function normalizeLeagueFeedRows(rows: Array<Record<string, unknown>>): FeedPost[] {
  return rows.map((row) => {
    const authorValue = row.author;
    const author = Array.isArray(authorValue) ? authorValue[0] : authorValue;

    return {
      id: String(row.id ?? ""),
      scope: "league",
      title: String(row.title ?? ""),
      body: String(row.body ?? ""),
      post_type: (row.post_type as FeedPost["post_type"]) ?? "announcement",
      attachment_url: (row.attachment_url as string | null) ?? null,
      poll_options: Array.isArray(row.poll_options) ? (row.poll_options as string[]) : null,
      created_at: (row.created_at as string | null) ?? null,
      author:
        author && typeof author === "object"
          ? {
              id: String((author as Record<string, unknown>).id ?? ""),
              name: ((author as Record<string, unknown>).name as string | null) ?? null,
              profile_pic_url:
                ((author as Record<string, unknown>).profile_pic_url as string | null) ?? null,
            }
          : null,
    };
  });
}

function labelForPostType(type: FeedPost["post_type"]) {
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

function feedTypePillStyle(type: FeedPost["post_type"]): CSSProperties {
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

function scopeButtonStyle(active: boolean): CSSProperties {
  return {
    flex: 1,
    minHeight: "42px",
    borderRadius: "999px",
    border: active ? "1px solid rgba(56,189,248,0.42)" : "1px solid rgba(148,163,184,0.16)",
    background: active
      ? "linear-gradient(135deg, rgba(56,189,248,0.16), rgba(14,165,233,0.08))"
      : "rgba(7,17,31,0.74)",
    color: active ? "var(--accent-blue)" : "var(--text-muted)",
    fontWeight: 800,
  };
}

function scopePillStyle(scope: FeedScope): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "26px",
    padding: "0.25rem 0.6rem",
    borderRadius: "999px",
    border: "1px solid rgba(56,189,248,0.25)",
    background: scope === "league" ? "rgba(56,189,248,0.16)" : "rgba(59,130,246,0.1)",
    color: "var(--accent-blue)",
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

const scopeToggleRowStyle: CSSProperties = {
  display: "flex",
  gap: "0.6rem",
  marginTop: "0.95rem",
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
