/**
 * ProgressView.jsx — "My Progress" full-page view.
 *
 * Detailed breakdown of learning progress per goal path.
 * All data is illustrative sample data.
 */
import { Info, TrendingUp, Award, Flame } from 'lucide-react';
import { GOALS, COURSES, PROGRESS } from '../data/courseData';

const STATUS_DOT = {
  completed:   'dot-done',
  'in-progress': 'dot-progress',
  locked:      'dot-locked',
};
const STATUS_CHIP = {
  completed:   'chip-done',
  'in-progress': 'chip-progress',
  locked:      'chip-locked',
};
const STATUS_LABEL = {
  completed:   'Completed',
  'in-progress': 'In Progress',
  locked:      'Locked',
};

export default function ProgressView({ courses = COURSES }) {
  const completedCount = courses.filter(
    course => course.status === 'completed'
  ).length;

  const remainingCount = courses.length - completedCount;

  const overall = courses.length
    ? Math.round((completedCount / courses.length) * 100)
    : 0;

  return (
    <div className="view-wrap">
      <h1 className="view-heading">My Progress</h1>
      <p className="view-sub">
        Track your completion across all learning paths.{' '}
        <span className="sample-notice"><Info size={11} /> Sample data</span>
      </p>

      {/* Summary tiles */}
      <div className="stats-row stagger" style={{ marginBottom: 32 }}>
        {[
  { icon: Award, color: 'var(--success)', val: completedCount, lbl: 'Completed' },
  { icon: TrendingUp, color: 'var(--accent)', val: remainingCount, lbl: 'Remaining' },
  { icon: Flame, color: 'var(--warn)', val: `${PROGRESS.currentStreak}d`, lbl: 'Streak' },
  { icon: Award, color: 'var(--accent-2)', val: `${overall}%`, lbl: 'Overall' },
].map(({ icon: Icon, color, val, lbl }) => (
          <div key={lbl} className="stat-tile anim-fade-up">
            <div className="stat-icon-wrap" style={{ background: `${color}1a` }}>
              <Icon size={16} color={color} strokeWidth={2} />
            </div>
            <div className="stat-val" style={{ color }}>{val}</div>
            <div className="stat-lbl">{lbl}</div>
          </div>
        ))}
      </div>

      {/* Per-goal breakdown */}
      {GOALS.map(goal => {
       const goalCourses = courses.filter(c => c.goalId === goal.id);
        const done  = goalCourses.filter(c => c.status === 'completed').length;
        const total = goalCourses.length;
        const pct   = Math.round((done / total) * 100);

        const accentColor = goal.accentColor;

        return (
          <div
            key={goal.id}
            className="progress-section"
            style={{ marginBottom: 18 }}
          >
            <div className="progress-header">
              <h2 style={{ fontSize: '0.92rem' }}>{goal.title}</h2>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {done}/{total} courses
              </span>
            </div>

            {/* Progress bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 16,
              }}
            >
              <div className="progress-bar-wrap" style={{ flex: 1 }}>
                <div
                  className="progress-bar-fill"
                  style={{ width: `${pct}%`, background: accentColor }}
                />
              </div>
              <span style={{ fontSize: '0.72rem', color: accentColor, fontWeight: 600, minWidth: 30 }}>
                {pct}%
              </span>
            </div>

            {/* Course rows */}
            <div className="course-list">
              {goalCourses.map(c => (
                <div key={c.id} className="course-row">
                  <span className={`course-status-dot ${STATUS_DOT[c.status]}`} aria-hidden="true" />
                  <span className="course-name">{c.title}</span>
                  <span className={`status-chip ${STATUS_CHIP[c.status]}`}>
                    {STATUS_LABEL[c.status]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
