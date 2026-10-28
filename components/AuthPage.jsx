
'use client';

import { useState } from 'react';
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  Code2,
  Eye,
  EyeOff,
  GitBranch,
  Layers3,
  LockKeyhole,
  Mail,
  Sparkles,
  UserRound,
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function AuthPage({ onAuthenticated, theme, onToggleTheme }) {
  const [mode, setMode] = useState('login');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  const isSignup = mode === 'signup';

  const switchMode = () => {
    setMode(isSignup ? 'login' : 'signup');
    setError('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    if (isSignup && name.trim().length < 2) {
      setError('Please enter your name.');
      return;
    }

    if (password.length < 6) {
      setError('Your password must contain at least 6 characters.');
      return;
    }

    if (isSignup && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // Demo mode: real credential verification requires a backend.
    onAuthenticated?.();
  };

  const handleForgotPassword = () => {
    setError(
      'Password reset will be available after backend integration.'
    );
  };

  return (
    <main className="auth-page">

      {/* LEFT: BRANDING AND ROADMAP PREVIEW */}
      <section className="auth-brand-panel">
        <div className="auth-brand-top">
          <div className="auth-logo-mark">
            <img src="/pathpilot-mark.png" alt="PathPilot logo" />
          </div>

          <div className="auth-brand-name">
            <span>PathPilot</span>
            <small>PERSONALISED LEARNING PATH PLANNER</small>
          </div>
        </div>

        <div className="auth-brand-main">

          <div className="auth-eyebrow">
            <Sparkles size={14} />
            LEARN WITH A CLEAR DIRECTION
          </div>

          <h1>
            Big goals deserve
            <br />
            <span>a clear path.</span>
          </h1>

          <p className="auth-brand-description">
            Discover what to learn next, understand your prerequisites,
            and move towards your career goals one step at a time.
          </p>

          <div className="auth-roadmap-card">
            <div className="auth-roadmap-header">
              <div>
                <span className="auth-card-overline">
                  YOUR LEARNING ROADMAP
                </span>
                <h3>Your next steps</h3>
              </div>

              <div className="auth-card-decoration">
                <span />
                <span />
                <span />
              </div>
            </div>

            <div className="auth-roadmap-list">

              <div className="auth-roadmap-step completed">
                <div className="auth-step-icon">
                  <CheckCircle2 size={19} />
                </div>

                <div className="auth-step-content">
                  <strong>Foundations</strong>
                  <span>Build your basics</span>
                </div>

                <span className="auth-step-status">DONE</span>
              </div>

              <div className="auth-roadmap-connector" />

              <div className="auth-roadmap-step active">
                <div className="auth-step-icon">
                  <Brain size={19} />
                </div>

                <div className="auth-step-content">
                  <strong>Core skills</strong>
                  <span>Strengthen your knowledge</span>
                </div>

                <span className="auth-step-status">NOW</span>
              </div>

              <div className="auth-roadmap-connector" />

              <div className="auth-roadmap-step upcoming">
                <div className="auth-step-icon">
                  <Layers3 size={19} />
                </div>

                <div className="auth-step-content">
                  <strong>Advanced concepts</strong>
                  <span>Build on what you know</span>
                </div>

                <span className="auth-step-status">NEXT</span>
              </div>

            </div>
          </div>

          <div className="auth-benefits">
            <div>
              <Code2 size={17} />
              <span>Goal-focused learning</span>
            </div>

            <div>
              <GitBranch size={17} />
              <span>Clear prerequisites</span>
            </div>

            <div>
              <CheckCircle2 size={17} />
              <span>Track your progress</span>
            </div>
          </div>

        </div>

        <div className="auth-brand-footer">
          Learn at your pace. Grow with purpose.
        </div>
      </section>

      {/* RIGHT: LOGIN / SIGN-UP FORM */}
      <section className="auth-main-panel">
        <div className="auth-theme-control">
          <ThemeToggle
            theme={theme}
            onToggle={onToggleTheme}
          />
        </div>

        <div className="auth-mobile-brand">
          <div className="auth-logo-mark">
            <img src="/pathpilot-mark.png" alt="PathPilot logo" />
          </div>
          <span>PathPilot</span>
        </div>

        <div className="auth-form-shell">

          <div className="auth-form-heading">
            <div className="auth-form-kicker">
              {isSignup ? 'GET STARTED' : 'WELCOME BACK'}
            </div>

            <h2>
              {isSignup
                ? 'Create your account'
                : 'Sign in to PathPilot'}
            </h2>

            <p>
              {isSignup
                ? 'Create an account to begin your learning journey.'
                : 'Pick up where your learning journey left off.'}
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>

            {isSignup && (
              <div className="auth-field">
                <label htmlFor="auth-name">Full name</label>

                <div className="auth-input-wrap">
                  <UserRound size={18} />

                  <input
                    id="auth-name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="name"
                    minLength={2}
                    required
                  />
                </div>
              </div>
            )}

            <div className="auth-field">
              <label htmlFor="auth-email">Email address</label>

              <div className="auth-input-wrap">
                <Mail size={18} />

                <input
                  id="auth-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <div className="auth-label-row">
                <label htmlFor="auth-password">Password</label>

                {!isSignup && (
                  <button
                    type="button"
                    className="auth-text-button"
                    onClick={handleForgotPassword}
                  >
                    Forgot password?
                  </button>
                )}
              </div>

              <div className="auth-input-wrap">
                <LockKeyhole size={18} />

                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={
                    isSignup ? 'new-password' : 'current-password'
                  }
                  minLength={6}
                  required
                />

                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={
                    showPassword ? 'Hide password' : 'Show password'
                  }
                >
                  {showPassword
                    ? <EyeOff size={18} />
                    : <Eye size={18} />}
                </button>
              </div>
            </div>

            {isSignup && (
              <div className="auth-field">
                <label htmlFor="auth-confirm-password">
                  Confirm password
                </label>

                <div className="auth-input-wrap">
                  <LockKeyhole size={18} />

                  <input
                    id="auth-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    autoComplete="new-password"
                    minLength={6}
                    required
                  />

                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() =>
                      setShowConfirmPassword((prev) => !prev)
                    }
                    aria-label={
                      showConfirmPassword
                        ? 'Hide confirm password'
                        : 'Show confirm password'
                    }
                  >
                    {showConfirmPassword
                      ? <EyeOff size={18} />
                      : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}

            <button type="submit" className="auth-submit-btn">
              <span>
                {isSignup ? 'Create account' : 'Sign in'}
              </span>
              <ArrowRight size={18} />
            </button>

            {/* 1-Click Direct Demo Entry */}
            <div style={{ margin: '16px 0 8px', textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0' }}>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  or explore without account
                </span>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>

              <button
                type="button"
                id="btn-demo-quick-entry"
                onClick={() => onAuthenticated?.()}
                style={{
                  width: '100%',
                  padding: '12px 18px',
                  borderRadius: 10,
                  background: 'var(--primary-soft)',
                  border: '1.5px solid var(--primary)',
                  color: 'var(--primary)',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  transition: 'all 0.2s ease',
                }}
              >
                <Sparkles size={16} />
                <span>Quick Student Demo (1-Click Direct Access)</span>
                <ArrowRight size={16} />
              </button>
            </div>

            <div className="auth-mode-switch">
              <span>
                {isSignup
                  ? 'Already have an account?'
                  : "Don't have an account?"}
              </span>

              <button
                type="button"
                className="auth-text-button"
                onClick={switchMode}
              >
                {isSignup ? 'Sign in' : 'Create account'}
              </button>
            </div>

          </form>

          <div className="auth-demo-note">
            <LockKeyhole size={14} />
            <span>
              Demo mode: Click &quot;Quick Student Demo&quot; to test all graph algorithms and interactive roadmaps.
            </span>
          </div>

        </div>

        <div className="auth-main-footer">
          Your learning journey starts with one step.
        </div>

      </section>
    </main>
  );
}
