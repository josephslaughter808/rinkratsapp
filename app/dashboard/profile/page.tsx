"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useRouter } from "next/navigation";

type PlayerProfile = {
  id: string;
  name: string | null;
  number: number | null;
  position: string | null;
  profile_pic_url: string | null;
};

export default function ProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;

      if (!session) {
        router.push("/auth/login");
        return;
      }

      setAuthUserId(session.user.id);

      const { data: ptRow } = await supabase
        .from("player_teams")
        .select("player_id")
        .eq("user_id", session.user.id)
        .single();

      if (!ptRow) {
        setLoading(false);
        return;
      }

      setPlayerId(ptRow.player_id);

      const { data: sharedProfileRow } = await supabase
        .from("players")
        .select("profile_pic_url")
        .eq("user_id", session.user.id)
        .not("profile_pic_url", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: playerData } = await supabase
        .from("players")
        .select("id, name, number, position, profile_pic_url")
        .eq("id", ptRow.player_id)
        .single();

      if (!playerData?.id) {
        setLoading(false);
        return;
      }

      setPlayer({
        id: playerData.id,
        name: playerData.name ?? null,
        number: playerData.number ?? null,
        position: playerData.position ?? null,
        profile_pic_url: sharedProfileRow?.profile_pic_url ?? playerData.profile_pic_url,
      });
      setLoading(false);
    }

    loadProfile();
  }, [router]);

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true);

      const file = event.target.files?.[0];
      if (!file || !playerId || !authUserId) return;

      const fileExt = file.name.split(".").pop();
      const fileName = `${playerId}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("profile pictures")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("profile pictures")
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      await supabase
        .from("players")
        .update({ profile_pic_url: publicUrl })
        .eq("user_id", authUserId);

      setPlayer((prev) =>
        prev
          ? {
        ...prev,
        profile_pic_url: publicUrl,
            }
          : prev
      );
    } catch (error) {
      console.error("Error uploading avatar:", error);
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <main className="center-screen">
        <p>Loading...</p>
      </main>
    );
  }

  if (!player) {
    return (
      <main style={{ padding: "2rem", textAlign: "center" }}>
        <h1>Profile</h1>
        <p>No player profile found.</p>
      </main>
    );
  }

  return (
    <main
      style={{
        padding: "1.5rem",
        maxWidth: "600px",
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: "1.6rem", fontWeight: 700 }}>My Profile</h1>

      {/* Profile Picture */}
      <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
        <img
          src={
            player.profile_pic_url ||
            "https://via.placeholder.com/150?text=No+Image"
          }
          alt="Profile"
          style={{
            width: "140px",
            height: "140px",
            borderRadius: "50%",
            objectFit: "cover",
            border: "3px solid var(--accent-light)",
          }}
        />

        <div style={{ marginTop: "1rem" }}>
          <label
            style={{
              display: "inline-block",
              padding: "0.5rem 1rem",
              background: "var(--accent)",
              color: "white",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            {uploading ? "Uploading..." : "Upload New Picture"}
            <input
              type="file"
              accept="image/*"
              onChange={uploadAvatar}
              style={{ display: "none" }}
            />
          </label>
        </div>
      </div>

      {/* Player Info */}
      <section style={{ marginTop: "2rem" }}>
        <p>
          <strong>Name:</strong> {player.name}
        </p>
        <p>
          <strong>Number:</strong> #{player.number}
        </p>
        <p>
          <strong>Position:</strong> {player.position}
        </p>
      </section>
    </main>
  );
}
