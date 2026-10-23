'use client';

import React from 'react';
import {
  X,
  CheckCircle2,
  PlayCircle,
  Lock,
  GitBranch,
  Sparkles,
  ArrowRight,
  Clock,
  Layers,
  Eye,
  RotateCcw,
} from 'lucide-react';

export default function CourseDetailsDrawer({
  course,
  onClose,
  onToggleComplete,
  onHighlightAncestors,
  onHighlightDescendants,
  onClearHighlights,
  onSelectCourse,
  updatingProgress = false,
  highlightMode = null,
}) {
  if (!course) return null;

  const isCompleted = course.status === 'completed';
  const isLocked = course.status === 'locked';
  const isReady = course.status === 'in-progress';

  const unmetPrereqs = (course.prerequisites || []).filter((p) => !p.isCompleted);

  return (
    <aside className="course-drawer" id="course-details-drawer" aria-label="Course details">
      {/* Header */}
      <div className="drawer-header">
        <div className="drawer-title-group">
          <div className="drawer-code-row">
            <span className="drawer-code">{course.code}</span>
            {course.isCritical && (
              <span className="node-cp-badge" title="On Critical Path bottleneck">
                CP
              </span>
            )}
            <span
              className={`node-status-chip node-status-chip--${course.status}`}
              style={{ fontSize: '0.68rem', padding: '2px 8px' }}
            >
              {isCompleted ? 'Completed' : isReady ? 'Ready to Study' : 'Locked'}
            </span>
          </div>
          <h3 className="drawer-title">{course.title}</h3>
        </div>

        <button
          className="drawer-close-btn"
          id="btn-close-drawer"
          onClick={onClose}
          aria-label="Close details"
        >
          <X size={18} />
        </button>
      </div>

      {/* Body */}
      <div className="drawer-body">
        {/* Quick meta grid */}
        <div className="drawer-meta-grid">
          <div className="drawer-meta-item">
            <span className="drawer-meta-lbl">Category</span>
            <span className="drawer-meta-val">{course.category || 'General'}</span>
          </div>
          <div className="drawer-meta-item">
            <span className="drawer-meta-lbl">Estimated Hours</span>
            <span className="drawer-meta-val">{course.estimatedHours}h</span>
          </div>
          <div className="drawer-meta-item">
            <span className="drawer-meta-lbl">Topology Level</span>
            <span className="drawer-meta-val">Level {course.level ?? 0}</span>
          </div>
          <div className="drawer-meta-item">
            <span className="drawer-meta-lbl">Direct Prerequisites</span>
            <span className="drawer-meta-val">{(course.prerequisites || []).length}</span>
          </div>
        </div>

        {/* Course Description */}
        <div>
          <div className="drawer-section-heading">Description</div>
          <p className="drawer-desc">{course.description || 'No description provided.'}</p>
        </div>

        {/* Locked Explanation Alert */}
        {isLocked && unmetPrereqs.length > 0 && (
          <div className="locked-explanation-card" id="locked-explanation">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
              <Lock size={13} />
              <span>Prerequisites Required to Unlock</span>
            </div>
            <div>
              Complete the following {unmetPrereqs.length} prerequisite{unmetPrereqs.length > 1 ? 's' : ''} to unlock this course:
            </div>
            <div className="locked-chips">
              {unmetPrereqs.map((pr) => (
                <button
                  key={pr.id}
                  className="locked-chip"
                  style={{ cursor: 'pointer', border: 'none' }}
                  onClick={() => onSelectCourse?.(pr.code)}
                  title={`View ${pr.code}: ${pr.title}`}
                >
                  {pr.code} ↗
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Prerequisites list */}
        <div>
          <div className="drawer-section-heading">
            Prerequisites ({(course.prerequisites || []).length})
          </div>
          {(course.prerequisites || []).length === 0 ? (
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              ✓ Foundational Course — No prior prerequisites required.
            </div>
          ) : (
            <div className="drawer-prereqs-list">
              {course.prerequisites.map((pr) => (
                <div
                  key={pr.id}
                  className="drawer-prereq-item"
                  onClick={() => onSelectCourse?.(pr.code)}
                  title={`Jump to ${pr.code}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{pr.code}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.68rem' }}>{pr.title}</span>
                  </div>
                  <div>
                    {pr.isCompleted ? (
                      <span style={{ color: '#52D9A4', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <CheckCircle2 size={11} /> Done
                      </span>
                    ) : (
                      <span style={{ color: '#F5A623', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Lock size={11} /> Unmet
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dependent downstream courses */}
        <div>
          <div className="drawer-section-heading">
            Unlocks Subsequent Courses ({(course.dependents || []).length})
          </div>
          {(course.dependents || []).length === 0 ? (
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Terminal / Track Milestone Course — No further dependencies in this track.
            </div>
          ) : (
            <div className="drawer-prereqs-list">
              {course.dependents.map((dep) => (
                <div
                  key={dep.id}
                  className="drawer-prereq-item"
                  onClick={() => onSelectCourse?.(dep.code)}
                  title={`Jump to ${dep.code}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{dep.code}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.68rem' }}>{dep.title}</span>
                  </div>
                  <ArrowRight size={11} color="var(--text-muted)" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="drawer-actions-group">
          {/* Mark Complete / In Progress Toggle */}
          <button
            type="button"
            id="btn-toggle-course-complete"
            className={`drawer-btn-complete ${
              isCompleted ? 'drawer-btn-complete--done' : 'drawer-btn-complete--pending'
            }`}
            disabled={updatingProgress}
            onClick={() => onToggleComplete?.(course.id, !isCompleted)}
          >
            {updatingProgress ? (
              <span>Updating with C++ Engine...</span>
            ) : isCompleted ? (
              <>
                <RotateCcw size={14} />
                Undo Completion (Mark Incomplete)
              </>
            ) : (
              <>
                <CheckCircle2 size={14} />
                Mark Course as Completed
              </>
            )}
          </button>

          {/* Highlight Prerequisite Path */}
          <button
            type="button"
            className={`drawer-btn-secondary ${highlightMode === 'ancestors' ? 'toolbar-btn--active' : ''}`}
            onClick={onHighlightAncestors}
          >
            <GitBranch size={13} />
            Highlight Prerequisite Ancestors
          </button>

          {/* Highlight Dependent Path */}
          <button
            type="button"
            className={`drawer-btn-secondary ${highlightMode === 'descendants' ? 'toolbar-btn--active' : ''}`}
            onClick={onHighlightDescendants}
          >
            <Sparkles size={13} />
            Highlight Unlocked Descendants
          </button>

          {highlightMode && (
            <button
              type="button"
              className="drawer-btn-secondary"
              onClick={onClearHighlights}
            >
              Clear Highlights
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
