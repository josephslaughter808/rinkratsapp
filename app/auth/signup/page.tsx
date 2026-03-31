"use client";

import { useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [primaryPosition, setPrimaryPosition] = useState("C");
  const [handedness, setHandedness] = useState("L");
  const [level, setLevel] = useState("C");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          primary_position: primaryPosition,
          handedness,
          level,
        },
      },
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
    } else {
      router.push("/auth/login");
    }
  };

  return (
    <main className="center-screen">
      <div
        className="card"
        style={{
          width: "min(100%, 460px)",
          borderRadius: "26px",
          padding: "1.35rem 1.1rem 1.25rem",
          background:
            "linear-gradient(180deg, rgba(8,16,29,0.98), rgba(5,10,19,0.98))",
          border: "1px solid rgba(148,163,184,0.14)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.32)",
        }}
      >
        <div style={{ color: "var(--accent-light)", fontSize: "0.78rem", letterSpacing: "0.08em", textTransform: "uppercase", textAlign: "center" }}>
          Pucklytics
        </div>
        <h1 className="text-center" style={{ fontSize: "2rem", fontWeight: 700, marginTop: "0.35rem" }}>
          Create Account
        </h1>
        <p
          className="text-center"
          style={{ color: "var(--text-muted)", marginTop: "0.4rem", lineHeight: 1.45 }}
        >
          Use the exact name your captain entered so we can connect you to your existing player profile right away.
        </p>

        <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1.5rem" }}>
          <input
            type="text"
            placeholder="Full name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: "0.7rem",
            }}
          >
            <label style={fieldLabelWrapStyle}>
              <span style={fieldLabelStyle}>Position</span>
              <select
                value={primaryPosition}
                onChange={(e) => setPrimaryPosition(e.target.value)}
                style={selectStyle}
              >
                <option value="C">Center</option>
                <option value="LW">Left Wing</option>
                <option value="RW">Right Wing</option>
                <option value="D">Defense</option>
                <option value="G">Goalie</option>
              </select>
            </label>

            <label style={fieldLabelWrapStyle}>
              <span style={fieldLabelStyle}>Hand</span>
              <select
                value={handedness}
                onChange={(e) => setHandedness(e.target.value)}
                style={selectStyle}
              >
                <option value="L">Left</option>
                <option value="R">Right</option>
              </select>
            </label>

            <label style={fieldLabelWrapStyle}>
              <span style={fieldLabelStyle}>Level</span>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                style={selectStyle}
              >
                <option value="R">Rookie</option>
                <option value="D">D</option>
                <option value="C">C</option>
                <option value="B">B</option>
                <option value="A">A</option>
                <option value="E">Elite</option>
              </select>
            </label>
          </div>

          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        {message && (
          <p className="text-center mt-1" style={{ color: "var(--danger)" }}>
            {message}
          </p>
        )}

        <p className="text-center mt-2 opacity-70">
          Already have an account?{" "}
          <Link href="/auth/login">Log in</Link>
        </p>
      </div>
    </main>
  );
}

const fieldLabelWrapStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.35rem",
};

const fieldLabelStyle: React.CSSProperties = {
  color: "var(--text-muted)",
  fontSize: "0.74rem",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: "16px",
  border: "1px solid rgba(148,163,184,0.16)",
  background: "rgba(15,23,42,0.78)",
  color: "var(--text)",
  padding: "0.9rem 0.85rem",
  fontSize: "0.95rem",
  outline: "none",
};
