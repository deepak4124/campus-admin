"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");

    if (!email || !password) {
      setStatus("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setStatus("Signing in...");
    
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setStatus(error.message);
      setLoading(false);
    } else {
      localStorage.setItem("supabase_session_start", Date.now().toString());
      window.location.href = "/dashboard";
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel" aria-label="Admin login">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", marginBottom: "8px" }}>
          <img src="/bdps logo.jpeg" alt="Blooming Daffodils Logo" style={{ width: "80px", height: "80px", borderRadius: "16px", objectFit: "cover", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }} />
          <div style={{ textAlign: "center" }}>
            <h1 className="brand-title" style={{ fontSize: "28px", margin: 0 }}>Blooming Daffodils</h1>
            <p className="brand-subtitle" style={{ marginTop: "4px" }}>Administrative Portal</p>
          </div>
        </div>

        <form className="login-form" onSubmit={login}>
          <label className="form-field">
            <span className="field-label">Email</span>
            <input name="email" placeholder="admin@cleanpaper.school" type="email" />
          </label>
          <label className="form-field">
            <span className="field-label">Password</span>
            <input name="password" placeholder="Enter password" type="password" />
          </label>
          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
          {status ? <p className="form-status">{status}</p> : null}
        </form>
      </section>
    </main>
  );
}
