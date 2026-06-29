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
    <main className="riso-login-page">
      <div className="landing-grain" aria-hidden="true" />
      <div className="riso-login-blob riso-login-blob-1" aria-hidden="true" />
      <div className="riso-login-blob riso-login-blob-2" aria-hidden="true" />

      <section className="riso-login-panel" aria-label="Admin login">
        <div className="riso-login-brand">
          <div className="riso-login-logo-wrap">
            <img src="/bdps-removebg-preview.png" alt="Blooming Daffodils Logo" />
          </div>
          <div>
            <h1 className="riso-login-title">Admin Portal</h1>
            <p className="riso-login-sub">Blooming Daffodils Play School</p>
          </div>
        </div>

        <form className="riso-login-form" onSubmit={login}>
          <label className="riso-login-field">
            <span>Email</span>
            <input name="email" placeholder="admin@school.edu" type="email" />
          </label>
          <label className="riso-login-field">
            <span>Password</span>
            <input name="password" placeholder="Enter password" type="password" />
          </label>
          <button className="riso-login-submit" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
          {status ? <p className="riso-login-status">{status}</p> : null}
        </form>

        <div className="riso-login-footer">
          <a className="riso-login-back" href="/">← Back to home</a>
          <p className="riso-login-notice">This portal is for school staff only.</p>
        </div>
      </section>
    </main>
  );
}
