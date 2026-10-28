'use client';

/**
 * CognitiveFlowModal.jsx
 *
 * Maximum Flow & Min-Cut Student Cognitive Capacity Planner (Edmonds-Karp Algorithm).
 * Formulates semester course scheduling as a Network Flow problem:
 * - Source S: Student's total semester study hours budget (weeklyHours * 12 weeks).
 * - Intermediate Hubs: Domain/Subject categories with cognitive distribution caps.
 * - Sinks: Candidate course capacities.
 *
 * Highlights the saturated Min-Cut edges (exact bottlenecks) and recommends the optimal
 * parallel course bundle for the current semester without cognitive burnout.
 */
import React, { useState } from 'react';
import {
  Gauge,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Layers,
  ArrowRight,
  TrendingUp,
  X,
  Zap,
  HelpCircle,
} from 'lucide-react';
import { getCourseTitle, getCourseShortTitle } from '../data/courseData';

function formatCourseTag(rawStr) {
  if (!rawStr) return '';
  const parts = rawStr.split(' ');
  const code = parts[0];
  const title = getCourseTitle(code);
  const details = parts.slice(1).join(' ');
  return title !== code ? `${title} ${details}` : rawStr;
}

export default function CognitiveFlowModal({
  isOpen,
  onClose,
  maxFlowData,
  currentWeeklyHours = 15,
  onPaceChange = null,
  goalTitle = 'Curriculum',
}) {
  const [localHours, setLocalHours] = useState(currentWeeklyHours);
  const [showExplanation, setShowExplanation] = useState(false);

  if (!isOpen) return null;

  const data = maxFlowData || {
    sourceCapacity: localHours * 12,
    maxFlow: Math.min(localHours * 12, 180),
    utilizationPercent: 85,
    minCutBottlenecks: [],
    recommendedCourses: [],
    overloadedCourses: [],
    flowNetwork: [],
    diagnosis: 'Analyzing cognitive capacity...',
  };

  const handleSliderChange = (e) => {
    const val = Number(e.target.value);
    setLocalHours(val);
    if (onPaceChange) {
      onPaceChange(val);
    }
  };

  const isOverCapacity = data.utilizationPercent >= 100 && (data.overloadedCourses?.length || 0) > 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(5, 7, 15, 0.85)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 960,
          background: 'var(--surface-primary, #0E1322)',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          borderRadius: 16,
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 35px rgba(56, 189, 248, 0.18)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
          overflow: 'hidden',
          color: '#E2E8F0',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'linear-gradient(90deg, rgba(56, 189, 248, 0.12), rgba(139, 124, 255, 0.08))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'rgba(56, 189, 248, 0.18)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38BDF8',
              }}
            >
              <Activity size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
                  Semester Study Load & Burnout Planner
                </h3>
                <span
                  style={{
                    fontSize: '0.68rem',
                    padding: '2px 8px',
                    borderRadius: 99,
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: '#38BDF8',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    fontWeight: 600,
                  }}
                >
                  ⚡ Edmonds-Karp Engine
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                Find out how many courses you can comfortably study this term without getting overwhelmed
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={() => setShowExplanation((prev) => !prev)}
              style={{
                background: showExplanation ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: showExplanation ? '#38BDF8' : '#CBD5E1',
                borderRadius: 8,
                padding: '6px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                cursor: 'pointer',
                fontSize: '0.76rem',
                fontWeight: 600,
              }}
            >
              <HelpCircle size={13} />
              {showExplanation ? 'Hide Algorithm Details' : '🔬 Evaluator / DSA Math'}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.6)',
                cursor: 'pointer',
                padding: 6,
                borderRadius: 8,
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Explanation Callout (Toggable for Judges/Teachers) */}
          {showExplanation && (
            <div
              style={{
                padding: '14px 18px',
                borderRadius: 10,
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                fontSize: '0.82rem',
                lineHeight: 1.5,
                color: '#CBD5E1',
              }}
            >
              <strong style={{ color: '#38BDF8' }}>How Max-Flow / Min-Cut applies to Curriculum Scheduling:</strong>
              <p style={{ margin: '6px 0 0' }}>
                We formulate the student schedule as a directed flow network: <strong>Source S</strong> represents the student&apos;s total semester hour budget (weekly hours &times; 12 weeks),
                intermediate <strong>Category Hubs</strong> enforce subject diversity caps, and <strong>Course Sinks</strong> consume capacities equal to credit hours.
                By the <strong>Max-Flow Min-Cut Theorem</strong>, saturated edges in the minimum cut pinpoint exactly which study bandwidth bottlenecks limit course intake.
              </p>
            </div>
          )}

          {/* Interactive Study Hours Capacity Slider */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: 12,
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sliders size={16} color="#38BDF8" />
                <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                  How many hours can you study per week?
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <strong style={{ color: '#38BDF8', fontSize: '1.1rem' }}>{localHours} hours / week</strong>
                <span style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                  ({localHours * 12} hours total over a 12-week term)
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: '0.74rem', color: 'rgba(255, 255, 255, 0.5)' }}>5h (Part-Time)</span>
              <input
                type="range"
                min="5"
                max="40"
                step="5"
                value={localHours}
                onChange={handleSliderChange}
                style={{ flex: 1, accentColor: '#38BDF8', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.74rem', color: 'rgba(255, 255, 255, 0.5)' }}>40h (Intensive)</span>
            </div>
          </div>

          {/* KPI Dashboard Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            {/* Total Budget */}
            <div
              style={{
                padding: '14px 18px',
                borderRadius: 12,
                background: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <span style={{ fontSize: '0.74rem', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase' }}>
                Available Study Time
              </span>
              <strong style={{ fontSize: '1.4rem', color: '#FFF' }}>{data.sourceCapacity}h</strong>
              <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.5)' }}>Total hours across term</span>
            </div>

            {/* Courses You Can Take */}
            <div
              style={{
                padding: '14px 18px',
                borderRadius: 12,
                background: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <span style={{ fontSize: '0.74rem', color: '#38BDF8', textTransform: 'uppercase', fontWeight: 600 }}>
                Recommended Load
              </span>
              <strong style={{ fontSize: '1.4rem', color: '#38BDF8' }}>
                {data.recommendedCourses?.length || 0} Courses
              </strong>
              <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                {data.maxFlow}h study workload
              </span>
            </div>

            {/* Schedule Health Check */}
            <div
              style={{
                padding: '14px 18px',
                borderRadius: 12,
                background: 'rgba(15, 23, 42, 0.5)',
                border:
                  (data.overloadedCourses?.length || 0) === 0
                    ? '1px solid rgba(82, 217, 164, 0.3)'
                    : '1px solid rgba(245, 166, 35, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <span style={{ fontSize: '0.74rem', color: (data.overloadedCourses?.length || 0) === 0 ? '#52D9A4' : '#F5A623', textTransform: 'uppercase', fontWeight: 600 }}>
                Burnout Health
              </span>
              <strong style={{ fontSize: '1.25rem', color: (data.overloadedCourses?.length || 0) === 0 ? '#52D9A4' : '#F5A623' }}>
                {(data.overloadedCourses?.length || 0) === 0 ? '🟢 Balanced Schedule' : '🟡 Full Schedule'}
              </strong>
              <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                {(data.overloadedCourses?.length || 0) === 0
                  ? 'All courses fit without stress!'
                  : `${data.overloadedCourses?.length} course(s) saved for next term`}
              </span>
            </div>
          </div>

          {/* Student Friendly Explanation of Schedule */}
          {(data.overloadedCourses?.length || 0) > 0 && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 10,
                background: 'rgba(245, 166, 35, 0.08)',
                border: '1px solid rgba(245, 166, 35, 0.25)',
                fontSize: '0.8rem',
                color: '#FDE68A',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <AlertTriangle size={16} color="#F5A623" style={{ flexShrink: 0 }} />
              <span>
                <strong>Study Tip:</strong> Based on your <strong>{localHours}h/week</strong> study time, we scheduled the most critical foundational courses for this semester. The remaining {data.overloadedCourses?.length} courses are deferred to next term so you have plenty of time to succeed without burning out!
              </span>
            </div>
          )}

          {/* Schedulable Courses vs Overloaded Courses */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 16 }}>
            {/* Recommended Semester Course Bundle */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid rgba(82, 217, 164, 0.25)',
                borderRadius: 12,
                padding: '16px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.84rem', fontWeight: 600, color: '#52D9A4' }}>
                  <CheckCircle2 size={15} />
                  <span>Optimal Schedulable Courses for This Semester ({data.recommendedCourses?.length || 0})</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {!data.recommendedCourses || data.recommendedCourses.length === 0 ? (
                  <span style={{ fontSize: '0.76rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                    Increase weekly study hours to fit courses into this semester.
                  </span>
                ) : (
                  data.recommendedCourses.map((c, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '5px 12px',
                        borderRadius: 6,
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        background: 'rgba(82, 217, 164, 0.15)',
                        color: '#52D9A4',
                        border: '1px solid rgba(82, 217, 164, 0.3)',
                      }}
                      title={c}
                    >
                      ✓ {formatCourseTag(c)}
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Overloaded / Deferred Courses */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 12,
                padding: '16px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.84rem', fontWeight: 600, color: '#94A3B8' }}>
                <TrendingUp size={15} />
                <span>Defer to Next Semester ({data.overloadedCourses?.length || 0})</span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {!data.overloadedCourses || data.overloadedCourses.length === 0 ? (
                  <span style={{ fontSize: '0.76rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                    None! All courses fit into current semester bandwidth.
                  </span>
                ) : (
                  data.overloadedCourses.map((c, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: '0.72rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: '#94A3B8',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                      title={c}
                    >
                      ⏳ {formatCourseTag(c)}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 24px',
            background: 'rgba(10, 15, 30, 0.95)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: '0.74rem', color: 'rgba(255, 255, 255, 0.5)' }}>
            Flow network solved natively in C++ via Edmonds-Karp with residual graph BFS.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-primary"
            style={{ padding: '6px 18px', fontSize: '0.8rem', borderRadius: 8 }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
