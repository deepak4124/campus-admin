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
      window.location.href = "/";
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel" aria-label="Admin login">
        <div>
          <h1>Blooming Daffodils</h1>
          <p>Administrative Portal</p>
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
