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
    <div className="view-wrap" style={{ padding: '0 0 20px' }}>
      {/* Top Header Row: Clean Title + Goal Switcher */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            My Learning Roadmap
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            Visual step-by-step path computed by the C++ Graph Engine
          </p>
        </div>

        {/* Goal selector tabs */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
                        padding: '6px 12px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                      }
                    : {
                        padding: '6px 12px',
                        fontSize: '0.82rem',
                      }
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
                  {g.courseCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Direct Roadmap Canvas — Maximized Visibility */}
      <div
        style={{
          background: 'var(--surface-primary, #0B1020)',
          borderRadius: 12,
          border: '1px solid rgba(255, 255, 255, 0.08)',
          overflow: 'hidden',
        }}
      >
        <RoadmapView
          goalId={activeGoalId}
          onSelectGoal={(id) => onGoalSelect(id || 'ml')}
          initialSelectedCourseCode={initialSelectedCourseCode}
        />
      </div>
    </div>
  );
}
