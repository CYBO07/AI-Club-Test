import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Icon } from "../components/Icons.jsx";
import "../index.css";

export default function Login({ variant = "student" }) {
  const isAdmin = variant === "admin";

  const { loginAdmin, loginStudent } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setBusy(true);

    try {
      if (isAdmin) {
        await loginAdmin(identifier, password);
        navigate("/admin");
      } else {
        await loginStudent(identifier, password);
        navigate("/dashboard");
      }
    } catch (err) {
      setError(
        err?.message ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-page">

      {/* =====================================================
          LEFT SIDE
      ===================================================== */}

      <section className="login-left">

        {/* Background effects */}
        <div className="login-left-glow glow-one"></div>
        <div className="login-left-glow glow-two"></div>

        <div className="login-grid"></div>


        {/* Brand */}
        <div className="left-brand">

          <div className="brand-icon">
            AI
          </div>

          <div className="brand-text">
            <strong>AI CLUB</strong>
            <span>RECRUITMENT PLATFORM</span>
          </div>

        </div>


        {/* Hero content */}
        <div className="left-content">

          <div className="online-badge">

            <span className="online-dot"></span>

            AI RECRUITMENT SYSTEM

            <b>ONLINE</b>

          </div>


          <h1>
            Think.
            <br />

            <span>Build.</span>
            <br />

            Innovate.
          </h1>


          <p>
            Challenge your skills, solve real problems
            and become part of the AI Club community.
          </p>

        </div>


        {/* =================================================
            IMAGE
        ================================================= */}

        <div className="left-image">

          <img
            src="/ai-login.png"
            alt="Student working on laptop"
          />

        </div>


        {/* Bottom features */}
        <div className="left-bottom">

          <div className="feature">

            <span>01</span>

            <div>
              <strong>LOGICAL THINKING</strong>
              <small>
                Analyse complex problems.
              </small>
            </div>

          </div>


          <div className="feature">

            <span>02</span>

            <div>
              <strong>PROGRAMMING</strong>
              <small>
                Build efficient solutions.
              </small>
            </div>

          </div>


          <div className="feature">

            <span>03</span>

            <div>
              <strong>AI & INNOVATION</strong>
              <small>
                Think beyond the obvious.
              </small>
            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          RIGHT SIDE
      ===================================================== */}

      <section className="login-right">

        <div className="login-box">


          {/* Mobile brand */}
          <div className="mobile-brand">

            <div className="brand-icon">
              AI
            </div>

            <div className="brand-text">

              <strong>
                AI CLUB
              </strong>

              <span>
                RECRUITMENT PLATFORM
              </span>

            </div>

          </div>


          {/* Header */}
          <div className="form-header">

            <div className="access-badge">

              <span></span>

              {isAdmin
                ? "ADMINISTRATOR ACCESS"
                : "STUDENT ACCESS"}

            </div>


            <h2>
              {isAdmin
                ? "Welcome back."
                : "Welcome Back"}
            </h2>


            <p>
              {isAdmin
                ? "Sign in to manage the AI Club recruitment platform."
                : "Sign in to continue to the AI Club recruitment platform."}
            </p>

          </div>


          {/* =================================================
              LOGIN FORM
          ================================================= */}

          <form
            className="login-form"
            onSubmit={handleSubmit}
          >


            {/* Username / Email */}
            <div className="form-field">

              <label htmlFor="identifier">
                Username or Email
              </label>


              <div className="input-container">

                <svg
                  className="input-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >

                  <circle
                    cx="12"
                    cy="7"
                    r="4"
                  />

                  <path
                    d="M4 21a8 8 0 0 1 16 0"
                  />

                </svg>


                <input
                  id="identifier"
                  type="text"
                  required
                  value={identifier}
                  onChange={(event) =>
                    setIdentifier(event.target.value)
                  }
                  placeholder={
                    isAdmin
                      ? "Enter administrator username"
                      : "Enter username or email"
                  }
                  autoComplete="username"
                />

              </div>

            </div>


            {/* Password */}
            <div className="form-field">

              <label htmlFor="password">
                Password
              </label>


              <div className="input-container">

                <svg
                  className="input-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >

                  <rect
                    x="4"
                    y="10"
                    width="16"
                    height="11"
                    rx="2"
                  />

                  <path
                    d="M8 10V7a4 4 0 0 1 8 0v3"
                  />

                </svg>


                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  required
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />


                <button
                  type="button"
                  className="show-password"
                  onClick={() =>
                    setShowPassword(
                      (current) => !current
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >

                  <Icon.eye size={19} />

                </button>

              </div>

            </div>


            {/* Error */}
            {error && (

              <div className="login-error">

                <Icon.alert size={17} />

                <span>
                  {error}
                </span>

              </div>

            )}


            {/* Login button */}
            <button
              type="submit"
              className="login-button"
              disabled={busy}
            >

              {busy ? (

                <>
                  <span className="login-spinner"></span>

                  Signing in...
                </>

              ) : (

                <>
                  {isAdmin
                    ? "Sign in to Admin"
                    : "Continue to Test"}

                  <span className="button-arrow">
                    →
                  </span>
                </>

              )}

            </button>

          </form>


          {/* Student help */}
          {!isAdmin && (

            <div className="login-help">

              <p>
                Don't have credentials?
              </p>

              <span>
                Student accounts are issued by
                the AI Club administrator.
              </span>

            </div>

          )}


          {/* Security */}
          <div className="security">

            <span>◈</span>

            Secure authentication

            <i>•</i>

            AI Club Recruitment

          </div>

        </div>

      </section>

    </main>
  );
}