'use client';

/**
 * AlgorithmVisualizerModal.jsx
 *
 * Live Algorithm Visualizer Mode for Kahn's Topological Sort & Reverse BFS.
 * Provides media player controls (Play, Pause, Step Next, Step Prev, Reset, Speed),
 * live Priority Queue inspection, real-time in-degree tracking array D[v],
 * and step-by-step algorithmic narration.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  Layers,
  Cpu,
  CheckCircle2,
  X,
  GitBranch,
  Sparkles,
} from 'lucide-react';
import { getCourseTitle, getCourseShortTitle } from '../data/courseData';

function getFriendlyStepDescription(step) {
  if (!step) return 'Analyzing learning path...';
  const activeTitle = step.activeNodeCode ? getCourseTitle(step.activeNodeCode) : '';
  const targetTitle = step.targetNodeCode ? getCourseTitle(step.targetNodeCode) : '';

  if (step.type === 'INITIALIZE') {
    return '🔍 Finding Starting Points: Checking all courses for foundational topics with 0 prerequisites so you can begin immediately.';
  }
  if (step.type === 'POP_QUEUE') {
    return `🎯 Ready to Study: "${activeTitle}" has all prerequisites fulfilled! It is scheduled as your next learning milestone.`;
  }
  if (step.type === 'DECREMENT_INDEGREE') {
    const remainingText = step.newInDegree === 0 ? 'All requirements satisfied!' : `${step.newInDegree} more prerequisite needed`;
    return `🔓 Progress: Finishing "${activeTitle}" satisfies 1 prerequisite for "${targetTitle}". (${remainingText})`;
  }
  if (step.type === 'PUSH_QUEUE') {
    return `🎉 Unlocked: "${targetTitle}" has 0 remaining blockers! Added to your queue of courses ready to start.`;
  }
  if (step.type === 'COMPLETE') {
    return '🏁 Complete Roadmap Generated: All courses have been arranged in the optimal, prerequisite-safe study order.';
  }
  return step.description;
}

export default function AlgorithmVisualizerModal({
  isOpen,
  onClose,
  steps = [],
  goalTitle = 'Curriculum',
  onStepChange = null,
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timerRef = useRef(null);

  const totalSteps = steps.length;
  const currentStep = steps[currentStepIndex] || null;

  // Stop playback on unmount or close
  useEffect(() => {
    if (!isOpen) {
      setIsPlaying(false);
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      setCurrentStepIndex(0);
    }
  }, [isOpen]);

  // Notify parent of active step for graph highlighting
  useEffect(() => {
    if (onStepChange && currentStep) {
      onStepChange(currentStep);
    }
  }, [currentStepIndex, currentStep, onStepChange]);

  // Auto-play loop
  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.max(250, Math.round(1200 / speed));
      timerRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= totalSteps - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speed, totalSteps]);

  const handlePlayPause = () => {
    if (currentStepIndex >= totalSteps - 1) {
      setCurrentStepIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((prev) => !prev);
    }
  };

  const handleStepNext = () => {
    setIsPlaying(false);
    setCurrentStepIndex((prev) => Math.min(prev + 1, totalSteps - 1));
  };

  const handleStepPrev = () => {
    setIsPlaying(false);
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
  };

  const handleScrub = (e) => {
    setIsPlaying(false);
    setCurrentStepIndex(Number(e.target.value));
  };

  if (!isOpen) return null;

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
          maxWidth: 920,
          background: 'var(--surface-primary, #0E1322)',
          border: '1px solid rgba(139, 124, 255, 0.35)',
          borderRadius: 16,
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 35px rgba(139, 124, 255, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          overflow: 'hidden',
          color: '#E2E8F0',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'linear-gradient(90deg, rgba(139, 124, 255, 0.12), rgba(56, 189, 248, 0.05))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'rgba(139, 124, 255, 0.2)',
                border: '1px solid rgba(139, 124, 255, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent, #8B7CFF)',
              }}
            >
              <Cpu size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
                  Learning Path Builder (Kahn&apos;s Algorithm)
                </h3>
                <span
                  style={{
                    fontSize: '0.68rem',
                    padding: '2px 8px',
                    borderRadius: 99,
                    background: 'rgba(82, 217, 164, 0.15)',
                    color: '#52D9A4',
                    border: '1px solid rgba(82, 217, 164, 0.3)',
                    fontWeight: 600,
                  }}
                >
                  ⚡ Fast C++ Engine
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                Watch how courses get unlocked step-by-step for {goalTitle}
              </p>
            </div>
          </div>

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
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#FFF')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Active Step Narrative Card */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: 12,
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(139, 124, 255, 0.3)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: 3,
                width: `${((currentStepIndex + 1) / Math.max(1, totalSteps)) * 100}%`,
                background: 'linear-gradient(90deg, #8B7CFF, #38BDF8)',
                transition: 'width 0.2s ease',
              }}
            />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: '#8B7CFF',
                  }}
                >
                  Step {currentStepIndex + 1} of {totalSteps}
                </span>
                <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>&bull;</span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 6,
                    background:
                      currentStep?.type === 'INITIALIZE'
                        ? 'rgba(56, 189, 248, 0.15)'
                        : currentStep?.type === 'POP_QUEUE'
                        ? 'rgba(245, 166, 35, 0.15)'
                        : currentStep?.type === 'DECREMENT_INDEGREE'
                        ? 'rgba(192, 132, 252, 0.15)'
                        : currentStep?.type === 'PUSH_QUEUE'
                        ? 'rgba(82, 217, 164, 0.15)'
                        : 'rgba(255, 255, 255, 0.1)',
                    color:
                      currentStep?.type === 'INITIALIZE'
                        ? '#38BDF8'
                        : currentStep?.type === 'POP_QUEUE'
                        ? '#F5A623'
                        : currentStep?.type === 'DECREMENT_INDEGREE'
                        ? '#C084FC'
                        : currentStep?.type === 'PUSH_QUEUE'
                        ? '#52D9A4'
                        : '#CBD5E1',
                  }}
                >
                  {currentStep?.type === 'INITIALIZE'
                    ? '1. Find Starting Courses'
                    : currentStep?.type === 'POP_QUEUE'
                    ? '2. Add to Study Plan'
                    : currentStep?.type === 'DECREMENT_INDEGREE'
                    ? '3. Complete Prerequisite'
                    : currentStep?.type === 'PUSH_QUEUE'
                    ? '4. Course Unlocked!'
                    : currentStep?.type}
                </span>
              </div>

              {currentStep?.activeNodeCode && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.76rem' }}>
                  <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Active Topic:</span>
                  <strong style={{ color: '#F5A623', background: 'rgba(245, 166, 35, 0.15)', padding: '2px 8px', borderRadius: 4 }}>
                    {getCourseTitle(currentStep.activeNodeCode)}
                  </strong>
                </div>
              )}
            </div>

            <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: 1.5, color: '#F8FAFC' }}>
              {getFriendlyStepDescription(currentStep)}
            </p>
          </div>

          {/* Dual Panel: Priority Queue & In-Degrees Map */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Priority Queue State */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 12,
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 600 }}>
                  <Layers size={14} color="#52D9A4" />
                  <span>Courses Ready to Learn (0 Blockers)</span>
                </div>
                <span
                  style={{
                    fontSize: '0.72rem',
                    background: 'rgba(82, 217, 164, 0.12)',
                    color: '#52D9A4',
                    padding: '2px 6px',
                    borderRadius: 6,
                    fontWeight: 600,
                  }}
                >
                  {currentStep?.queueState?.length || 0} waiting
                </span>
              </div>

              <div
                style={{
                  minHeight: 52,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  flexWrap: 'wrap',
                  padding: 8,
                  background: 'rgba(0, 0, 0, 0.25)',
                  borderRadius: 8,
                }}
              >
                {!currentStep?.queueState || currentStep.queueState.length === 0 ? (
                  <span style={{ fontSize: '0.76rem', color: 'rgba(255, 255, 255, 0.4)', fontStyle: 'italic' }}>
                    All available courses are scheduled or waiting on prerequisites
                  </span>
                ) : (
                  currentStep.queueState.map((code, idx) => (
                    <span
                      key={code}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        background: idx === 0 ? 'rgba(82, 217, 164, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                        color: idx === 0 ? '#52D9A4' : '#E2E8F0',
                        border: idx === 0 ? '1px solid rgba(82, 217, 164, 0.5)' : '1px solid rgba(255, 255, 255, 0.12)',
                        boxShadow: idx === 0 ? '0 0 10px rgba(82, 217, 164, 0.3)' : 'none',
                      }}
                      title={`${code}: ${getCourseTitle(code)}`}
                    >
                      {idx === 0 ? '⚡ Next: ' : '✓ '} {getCourseTitle(code)}
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* In-Degree State Array D[v] */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 12,
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 600 }}>
                  <GitBranch size={14} color="#38BDF8" />
                  <span>Prerequisite Check (Blockers Remaining)</span>
                </div>
              </div>

              <div
                style={{
                  maxHeight: 110,
                  overflowY: 'auto',
                  display: 'flex',
                  gap: 6,
                  flexWrap: 'wrap',
                  padding: 8,
                  background: 'rgba(0, 0, 0, 0.25)',
                  borderRadius: 8,
                }}
              >
                {!currentStep?.inDegrees ? (
                  <span style={{ fontSize: '0.76rem', color: 'rgba(255, 255, 255, 0.4)' }}>No prerequisite data</span>
                ) : (
                  Object.entries(currentStep.inDegrees).map(([code, deg]) => {
                    const isZero = deg === 0;
                    const isTarget = currentStep.targetNodeCode === code;
                    const shortName = getCourseShortTitle(code);
                    return (
                      <span
                        key={code}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: '0.72rem',
                          background: isTarget
                            ? 'rgba(245, 166, 35, 0.25)'
                            : isZero
                            ? 'rgba(82, 217, 164, 0.15)'
                            : 'rgba(255, 255, 255, 0.05)',
                          border: isTarget
                            ? '1px solid #F5A623'
                            : isZero
                            ? '1px solid rgba(82, 217, 164, 0.3)'
                            : '1px solid rgba(255, 255, 255, 0.08)',
                          color: isTarget ? '#F5A623' : isZero ? '#52D9A4' : '#94A3B8',
                        }}
                        title={`${code}: ${getCourseTitle(code)} (${deg} prerequisites remaining)`}
                      >
                        <strong>{shortName}</strong>: {isZero ? '0 (Unlocked!)' : `${deg} left`}
                      </span>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Current Topological Learning Order Output */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 12,
              padding: '14px 16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 600 }}>
                <CheckCircle2 size={14} color="#8B7CFF" />
                <span>Your Step-by-Step Learning Order ({currentStep?.currentOrder?.length || 0} courses unblocked)</span>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                flexWrap: 'wrap',
                padding: '8px 12px',
                background: 'rgba(0, 0, 0, 0.25)',
                borderRadius: 8,
                minHeight: 40,
              }}
            >
              {!currentStep?.currentOrder || currentStep.currentOrder.length === 0 ? (
                <span style={{ fontSize: '0.76rem', color: 'rgba(255, 255, 255, 0.4)', fontStyle: 'italic' }}>
                  No courses resolved yet
                </span>
              ) : (
                currentStep.currentOrder.map((code, idx) => (
                  <span
                    key={code}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: '0.74rem',
                      padding: '3px 9px',
                      borderRadius: 6,
                      background: 'rgba(139, 124, 255, 0.15)',
                      color: '#C084FC',
                      border: '1px solid rgba(139, 124, 255, 0.25)',
                    }}
                    title={`${code}: ${getCourseTitle(code)}`}
                  >
                    <span style={{ fontSize: '0.66rem', opacity: 0.7 }}>#{idx + 1}</span> {getCourseTitle(code)}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Media Player Controls Footer */}
        <div
          style={{
            padding: '16px 24px',
            background: 'rgba(10, 15, 30, 0.95)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {/* Timeline Scrubber */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.5)', minWidth: 40 }}>
              {currentStepIndex + 1} / {totalSteps}
            </span>
            <input
              type="range"
              min="0"
              max={Math.max(0, totalSteps - 1)}
              value={currentStepIndex}
              onChange={handleScrub}
              style={{
                flex: 1,
                accentColor: '#8B7CFF',
                cursor: 'pointer',
              }}
            />
          </div>

          {/* Control Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Reset */}
              <button
                type="button"
                onClick={handleReset}
                title="Reset to beginning"
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#CBD5E1',
                  borderRadius: 8,
                  padding: '6px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                }}
              >
                <RotateCcw size={13} />
                Reset
              </button>

              {/* Step Prev */}
              <button
                type="button"
                onClick={handleStepPrev}
                disabled={currentStepIndex === 0}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: currentStepIndex === 0 ? 'rgba(255, 255, 255, 0.25)' : '#CBD5E1',
                  borderRadius: 8,
                  padding: '6px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: currentStepIndex === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '0.78rem',
                }}
              >
                <SkipBack size={13} />
                Prev
              </button>

              {/* Play / Pause */}
              <button
                type="button"
                onClick={handlePlayPause}
                style={{
                  background: isPlaying ? 'rgba(245, 166, 35, 0.2)' : 'rgba(139, 124, 255, 0.25)',
                  border: isPlaying ? '1px solid #F5A623' : '1px solid #8B7CFF',
                  color: isPlaying ? '#F5A623' : '#FFF',
                  borderRadius: 8,
                  padding: '6px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  boxShadow: isPlaying ? '0 0 12px rgba(245, 166, 35, 0.25)' : '0 0 12px rgba(139, 124, 255, 0.3)',
                }}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                {isPlaying ? 'Pause' : currentStepIndex >= totalSteps - 1 ? 'Replay' : 'Play'}
              </button>

              {/* Step Next */}
              <button
                type="button"
                onClick={handleStepNext}
                disabled={currentStepIndex >= totalSteps - 1}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: currentStepIndex >= totalSteps - 1 ? 'rgba(255, 255, 255, 0.25)' : '#CBD5E1',
                  borderRadius: 8,
                  padding: '6px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: currentStepIndex >= totalSteps - 1 ? 'not-allowed' : 'pointer',
                  fontSize: '0.78rem',
                }}
              >
                Next
                <SkipForward size={13} />
              </button>
            </div>

            {/* Playback Speed Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.5)' }}>Speed:</span>
              {[0.5, 1, 2, 4].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSpeed(s)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 6,
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: speed === s ? 'rgba(139, 124, 255, 0.3)' : 'rgba(255, 255, 255, 0.06)',
                    color: speed === s ? '#8B7CFF' : 'rgba(255, 255, 255, 0.7)',
                    border: speed === s ? '1px solid rgba(139, 124, 255, 0.5)' : '1px solid transparent',
                  }}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
