"use client";

import { FormEvent, useState } from "react";

const DUMMY_EMAIL = "admin@cleanpaper.school";
const DUMMY_PASSWORD = "admin123";

export default function AdminLoginPage() {
  const [status, setStatus] = useState("");

  function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");

    if (email !== DUMMY_EMAIL || password !== DUMMY_PASSWORD) {
      setStatus("Use admin@cleanpaper.school and admin123 for the dummy login.");
      return;
    }

    document.cookie = "admin_session=dummy-admin; path=/; max-age=86400; SameSite=Lax";
    window.location.href = "/";
  }

  return (
    <main className="login-page">
      <section className="login-panel" aria-label="Admin login">
        <div>
          <h1>Clean Paper</h1>
          <p>Administrative Portal</p>
        </div>

        <form className="login-form" onSubmit={login}>
          <label className="form-field">
            <span className="field-label">Email</span>
            <input defaultValue={DUMMY_EMAIL} name="email" placeholder="admin@cleanpaper.school" type="email" />
          </label>
          <label className="form-field">
            <span className="field-label">Password</span>
            <input defaultValue={DUMMY_PASSWORD} name="password" placeholder="Enter password" type="password" />
          </label>
          <button className="primary-button" type="submit">
            Sign In
          </button>
          {status ? <p className="form-status">{status}</p> : null}
        </form>
      </section>
    </main>
  );
}
