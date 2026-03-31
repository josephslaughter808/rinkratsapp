"use client";

import { useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
    } else {
      await supabase.rpc("claim_current_user_player_by_name");
      router.push("/dashboard");
    }
  };

  return (
    <main className="center-screen">
      <div className="card">
        <h1 className="text-center" style={{ fontSize: "2rem", fontWeight: 700 }}>
          Log In
        </h1>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1.5rem" }}>
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
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        {message && (
          <p className="text-center mt-1" style={{ color: "var(--danger)" }}>
            {message}
          </p>
        )}

        <p className="text-center mt-2 opacity-70">
          Don’t have an account?{" "}
          <Link href="/auth/signup">Sign up</Link>
        </p>
      </div>
    </main>
  );
}
