'use client';

/**
 * ProgressSection.jsx — Learning Overview panel (sample data).
 *
 * Shown on the Overview page. Displays illustrative progress metrics
 * and a short list of recent courses.
 */
import { CheckCircle2, Clock, Flame, Info } from 'lucide-react';
import { PROGRESS, COURSES } from '../data/courseData';

const STATUS_CONFIG = {
  completed:   { cls: 'dot-done',     chipCls: 'chip-done',     label: 'Completed'   },
  'in-progress': { cls: 'dot-progress', chipCls: 'chip-progress', label: 'In Progress' },
  locked:      { cls: 'dot-locked',   chipCls: 'chip-locked',   label: 'Locked'      },
};

// Show the first 5 courses as recent activity
const RECENT = COURSES.slice(0, 5);

export default function ProgressSection() {
  const pct = Math.round((PROGRESS.coursesCompleted / PROGRESS.totalCourses) * 100);

  return (
    <div className="progress-section">
      <div className="progress-header">
        <h2>Learning Overview</h2>
        <span className="sample-notice">
          <Info size={11} />
          Sample data
        </span>
      </div>

      {/* Key metrics */}
      <div className="progress-grid">
        <div className="prog-item">
          <span className="prog-label">Completed</span>
          <span className="prog-val" style={{ color: 'var(--success)' }}>
            {PROGRESS.coursesCompleted}
          </span>
          <span className="prog-sub">courses done</span>
        </div>
        <div className="prog-item">
          <span className="prog-label">Remaining</span>
          <span className="prog-val">{PROGRESS.coursesRemaining}</span>
          <span className="prog-sub">courses left</span>
        </div>
        <div className="prog-item">
          <span className="prog-label">Hours Logged</span>
          <span className="prog-val" style={{ color: 'var(--accent-2)' }}>
            {PROGRESS.hoursLogged}h
          </span>
          <span className="prog-sub">total study time</span>
        </div>
        <div className="prog-item">
          <span className="prog-label">Streak</span>
          <span className="prog-val" style={{ color: 'var(--warn)' }}>
            {PROGRESS.currentStreak}
          </span>
          <span className="prog-sub">days in a row</span>
        </div>
      </div>

      {/* Overall progress bar */}
      <div style={{ marginBottom: 6 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            marginBottom: 6,
          }}
        >
          <span>Overall progress</span>
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{pct}%</span>
        </div>
        <div className="progress-bar-wrap" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Recent courses */}
      <div style={{ marginTop: 20 }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>
          RECENT COURSES
        </p>
        <div className="course-list">
          {RECENT.map(c => {
            const cfg = STATUS_CONFIG[c.status];
            return (
              <div key={c.id} className="course-row">
                <span className={`course-status-dot ${cfg.cls}`} aria-hidden="true" />
                <span className="course-name">{c.title}</span>
                <span className={`status-chip ${cfg.chipCls}`}>{cfg.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
