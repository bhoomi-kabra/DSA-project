'use client';

/**
 * CoursesView.jsx — "My Courses" full-page view.
 *
 * Lists all sample courses, filterable by search query passed down from the top bar.
 * Data is illustrative — not connected to a real backend.
 */
import { Lock, PlayCircle, CheckCircle2, Search } from 'lucide-react';
import { COURSES, GOALS } from '../data/courseData';

const STATUS_CONFIG = {
  completed:   { chipCls: 'chip-done',     label: 'Completed',   Icon: CheckCircle2 },
  'in-progress': { chipCls: 'chip-progress', label: 'In Progress', Icon: PlayCircle   },
  locked:      { chipCls: 'chip-locked',   label: 'Locked',      Icon: Lock         },
};

// Build a map of goalId → goal title for the section headings
const GOAL_MAP = Object.fromEntries(GOALS.map(g => [g.id, g]));

export default function CoursesView({
  searchQuery,
  courses = COURSES,
  onCourseStatusChange,
}) {
  const q = searchQuery.trim().toLowerCase();

const filtered = q
  ? courses.filter(c => c.title.toLowerCase().includes(q))
  : courses;;

  // Group by goal
  const groups = GOALS.map(g => ({
    goal: g,
    courses: filtered.filter(c => c.goalId === g.id),
  })).filter(grp => grp.courses.length > 0);

  return (
    <div className="view-wrap">
      <h1 className="view-heading">My Courses</h1>
      <p className="view-sub">
        Browse all courses across your learning paths.
        <span style={{ marginLeft: 8 }} className="sample-notice">
          Sample data
        </span>
      </p>

      {filtered.length === 0 && (
        <div className="empty-state" style={{ paddingTop: 40 }}>
          <div className="empty-icon-ring"><Search size={22} strokeWidth={1.4} /></div>
          <div className="empty-title">No courses found</div>
          <p className="empty-desc">Try a different search term.</p>
        </div>
      )}

      {groups.map(({ goal, courses }) => {
        const theme = goal.bgToken;
        const pillCls =
          theme === 'purple' ? 'pill-purple' :
          theme === 'blue'   ? 'pill-blue'   : 'pill-green';

        return (
          <div key={goal.id} style={{ marginBottom: 32 }}>
            <div className="section-hd">
              <h2>
                {goal.shortTitle}
                <span className={`pill ${pillCls}`} style={{ marginLeft: 10 }}>
                  {courses.length} course{courses.length !== 1 ? 's' : ''}
                </span>
              </h2>
            </div>
            <div className="courses-grid">
              {courses.map(c => {
                const { chipCls, label, Icon } = STATUS_CONFIG[c.status];
                return (
                  <div key={c.id} className="course-card" id={`course-${c.id}`}>
                    <div className="course-card-title">{c.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className={`status-chip ${chipCls}`}>
                        <Icon size={11} strokeWidth={2} />
                        {label}
                      </span>
                    </div>
                    <div style={{ marginTop: 'auto', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {c.credits} credit{c.credits !== 1 ? 's' : ''}
                    </div>
                    {c.status === 'locked' ? (
  <span className="course-prereq-note">
    Complete prerequisites first
  </span>
) : (
  <button
    type="button"
    className="course-action-btn"
    onClick={() =>
      onCourseStatusChange?.(
        c.id,
        c.status === 'completed' ? 'in-progress' : 'completed'
      )
    }
  >
    {c.status === 'completed'
      ? 'Undo Completion'
      : 'Mark as Completed'}
  </button>
)}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
