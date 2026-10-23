'use client';

/**
 * RoadmapPageView.jsx — "My Roadmap" Full-Page View.
 *
 * Provides goal track selection across:
 * 1. Machine Learning & AI Engineer (15 courses)
 * 2. Full-Stack Web Developer (15 courses)
 * 3. Placement & DSA Interview Preparation (14 courses)
 *
 * Integrated with the native C++ Graph Algorithm Engine.
 */
import { Brain, Code2, Trophy, Cpu } from 'lucide-react';
import RoadmapView from './RoadmapView';
import { GOALS } from '../data/courseData';

const ICON_MAP = { Brain, Code2, Trophy };

export default function RoadmapPageView({
  selectedGoalId,
  onGoalSelect,
  initialSelectedCourseCode = null,
}) {
  // Default to 'ml' if not chosen
  const activeGoalId = selectedGoalId || 'ml';
  const activeGoal = GOALS.find((g) => g.id === activeGoalId) || GOALS[0];

  return (
    <div className="view-wrap">
      <h1 className="view-heading">My Roadmap</h1>
      <p className="view-sub">
        Explore intelligent, prerequisite-directed learning paths computed by the C++ Graph Engine.
      </p>

      {/* Goal selector tabs */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        {GOALS.map((g) => {
          const Icon = ICON_MAP[g.icon] ?? Brain;
          const active = activeGoalId === g.id;
          return (
            <button
              key={g.id}
              id={`roadmap-tab-${g.id}`}
              className={`btn ${active ? 'btn-outline-accent' : 'btn-ghost'}`}
              style={
                active
                  ? {
                      borderColor: `${g.accentColor}66`,
                      color: g.accentColor,
                      background: `${g.accentColor}16`,
                    }
                  : {}
              }
              onClick={() => onGoalSelect(g.id)}
            >
              <Icon size={14} strokeWidth={2} />
              {g.title}
              <span
                style={{
                  fontSize: '0.68rem',
                  opacity: 0.75,
                  marginLeft: 4,
                  background: 'rgba(255,255,255,0.08)',
                  padding: '1px 6px',
                  borderRadius: 10,
                }}
              >
                {g.courseCount} courses
              </span>
            </button>
          );
        })}
      </div>

      {/* Graph panel */}
      <div className="roadmap-section">
        <div className="roadmap-header">
          <div className="roadmap-title-row">
            <h2>
              {activeGoal.title} &mdash; Prerequisite Dependency Graph
            </h2>
            <span
              className={`pill ${
                activeGoal.bgToken === 'purple'
                  ? 'pill-purple'
                  : activeGoal.bgToken === 'blue'
                  ? 'pill-blue'
                  : 'pill-green'
              }`}
              style={{ marginLeft: 8 }}
            >
              {activeGoal.difficulty}
            </span>
          </div>

          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '4px 0 0', width: '100%' }}>
            {activeGoal.description}
          </p>
        </div>

        <div className="roadmap-body">
          <RoadmapView
            goalId={activeGoalId}
            onSelectGoal={(id) => onGoalSelect(id || 'ml')}
            initialSelectedCourseCode={initialSelectedCourseCode}
          />
        </div>
      </div>
    </div>
  );
}
