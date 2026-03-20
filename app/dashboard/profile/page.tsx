"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Placeholder player info (later from DB)
  const player = {
    name: "Player Name",
    number: 13,
    position: "Forward",
    team: "Provo Ice Wolves",
    isCaptain: true, // placeholder
  };

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        router.push("/auth/login");
        return;
      }

      setUser(data.session.user);
      setLoading(false);
    }

    loadUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  if (loading) {
    return (
      <main className="center-screen">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main style={{ padding: "2rem", textAlign: "center" }}>
      {/* Profile Picture */}
      <div
        style={{
          width: "130px",
          height: "130px",
          borderRadius: "50%",
          background: "var(--surface-light)",
          margin: "0 auto",
          marginBottom: "1rem",
          border: "3px solid var(--accent-light)",
        }}
      ></div>

      {/* Name + Number */}
      <h1 style={{ fontSize: "1.8rem", fontWeight: 700 }}>
        {player.name}
      </h1>
      <p className="opacity-70" style={{ marginTop: "0.25rem" }}>
        #{player.number} • {player.position}
      </p>

      {/* Team */}
      <p className="opacity-70" style={{ marginTop: "0.25rem" }}>
        {player.team}
      </p>

      {/* Edit Profile */}
      <button
        style={{
          marginTop: "1.5rem",
          width: "100%",
          padding: "0.75rem",
          borderRadius: "var(--radius)",
          background: "var(--accent)",
          color: "white",
          fontWeight: 600,
          border: "none",
        }}
      >
        Edit Profile
      </button>

      {/* Divider */}
      <hr
        style={{
          margin: "2rem 0",
          borderColor: "var(--surface-light)",
        }}
      />

      {/* Account Info */}
      <section style={{ textAlign: "left" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Account</h2>

        <div
          style={{
            background: "var(--surface)",
            padding: "1rem",
            borderRadius: "var(--radius)",
            marginTop: "1rem",
          }}
        >
          <p>Email</p>
          <p className="opacity-70">{user.email}</p>
        </div>

        <button
          onClick={handleLogout}
          style={{
            marginTop: "1.5rem",
            width: "100%",
            padding: "0.75rem",
            borderRadius: "var(--radius)",
            background: "var(--danger)",
            color: "white",
            fontWeight: 600,
            border: "none",
          }}
        >
          Log Out
        </button>
      </section>

      {/* Captain Tools */}
      {player.isCaptain && (
        <>
          <hr
            style={{
              margin: "2rem 0",
              borderColor: "var(--surface-light)",
            }}
          />

          <section style={{ textAlign: "left" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>
              Captain Tools
            </h2>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                marginTop: "1rem",
              }}
            >
              <button
                style={{
                  padding: "0.75rem",
                  borderRadius: "var(--radius)",
                  background: "var(--surface-light)",
                  color: "white",
                  border: "1px solid var(--accent-light)",
                }}
              >
                Manage Team
              </button>

              <button
                style={{
                  padding: "0.75rem",
                  borderRadius: "var(--radius)",
                  background: "var(--surface-light)",
                  color: "white",
                  border: "1px solid var(--accent-light)",
                }}
              >
                Add Stats
              </button>

              <button
                style={{
                  padding: "0.75rem",
                  borderRadius: "var(--radius)",
                  background: "var(--surface-light)",
                  color: "white",
                  border: "1px solid var(--accent-light)",
                }}
              >
                Approve Players
              </button>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
