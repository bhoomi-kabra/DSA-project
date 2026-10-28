'use client';

/**
 * StudentGuideModal.jsx
 *
 * Built-in "Project Guide & How It Works" Modal.
 * Gives students and evaluators an immediate, crystal-clear explanation of the platform,
 * where every function is located, and 1-click shortcuts to jump straight into any feature.
 */
import React from 'react';
import {
  HelpCircle,
  X,
  Compass,
  GitBranch,
  Cpu,
  Activity,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Sparkles,
  Layers,
  Award,
} from 'lucide-react';

export default function StudentGuideModal({
  isOpen,
  onClose,
  onNavigate,
}) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(5, 7, 15, 0.88)',
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
          maxWidth: 880,
          background: 'var(--surface-primary, #0E1322)',
          border: '1px solid rgba(82, 217, 164, 0.35)',
          borderRadius: 16,
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 35px rgba(82, 217, 164, 0.2)',
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
            background: 'linear-gradient(90deg, rgba(82, 217, 164, 0.12), rgba(139, 124, 255, 0.08))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'rgba(82, 217, 164, 0.2)',
                border: '1px solid rgba(82, 217, 164, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#52D9A4',
              }}
            >
              <Compass size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600 }}>
                PathPilot Student Guide & Feature Tour
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                Everything you need to understand and demonstrate this platform
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
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Section 1: The Core Idea */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: 12,
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <h4 style={{ margin: '0 0 6px', fontSize: '0.95rem', color: '#52D9A4', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={16} />
              What is PathPilot? (The 10-Second Summary)
            </h4>
            <p style={{ margin: 0, fontSize: '0.84rem', lineHeight: 1.55, color: '#CBD5E1' }}>
              PathPilot is an <strong>academic GPS</strong> for computer science students. Instead of guessing what courses to take,
              it models the entire 44-course college catalog as a <strong>Directed Acyclic Graph (DAG)</strong>.
              When you pick a career goal (like <em>Machine Learning Engineer</em> or <em>Full-Stack Developer</em>),
              it uses a native <strong>C++ algorithm engine</strong> to find the fastest, conflict-free sequence of courses without missing any prerequisites.
            </p>
          </div>

          {/* Section 2: Where Everything Lives */}
          <div>
            <h4 style={{ margin: '0 0 12px', fontSize: '0.92rem', color: '#FFF' }}>
              Where Are the Functions? (Quick Feature Map)
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {/* Feature 1 */}
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: 10,
                  background: 'rgba(15, 23, 42, 0.5)',
                  border: '1px solid rgba(139, 124, 255, 0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#C084FC', fontWeight: 600, fontSize: '0.84rem' }}>
                  <GitBranch size={16} />
                  <span>1. Interactive DAG Roadmap</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#94A3B8', lineHeight: 1.45 }}>
                  Click <strong>&quot;My Roadmap&quot;</strong> in the sidebar. See courses as cards with arrows showing prerequisites. Click any course to view details or highlight all ancestors!
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigate('roadmap');
                  }}
                  style={{
                    marginTop: 6,
                    padding: '6px 12px',
                    borderRadius: 6,
                    background: 'rgba(139, 124, 255, 0.15)',
                    border: '1px solid rgba(139, 124, 255, 0.35)',
                    color: '#C084FC',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    width: 'fit-content',
                  }}
                >
                  Go to Roadmap <ArrowRight size={12} />
                </button>
              </div>

              {/* Feature 2 */}
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: 10,
                  background: 'rgba(15, 23, 42, 0.5)',
                  border: '1px solid rgba(192, 132, 252, 0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#E879F9', fontWeight: 600, fontSize: '0.84rem' }}>
                  <Cpu size={16} />
                  <span>2. Live Algorithm Inspector</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#94A3B8', lineHeight: 1.45 }}>
                  In the Roadmap toolbar, click <strong>&quot;Algorithm Inspector&quot;</strong>. Hit Play to watch Kahn&apos;s algorithm sequence courses, update in-degrees, and process the Queue!
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigate('roadmap');
                  }}
                  style={{
                    marginTop: 6,
                    padding: '6px 12px',
                    borderRadius: 6,
                    background: 'rgba(232, 121, 249, 0.15)',
                    border: '1px solid rgba(232, 121, 249, 0.35)',
                    color: '#E879F9',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    width: 'fit-content',
                  }}
                >
                  View on Roadmap <ArrowRight size={12} />
                </button>
              </div>

              {/* Feature 3 */}
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: 10,
                  background: 'rgba(15, 23, 42, 0.5)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#38BDF8', fontWeight: 600, fontSize: '0.84rem' }}>
                  <Activity size={16} />
                  <span>3. Cognitive Capacity (Max-Flow)</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#94A3B8', lineHeight: 1.45 }}>
                  In the Roadmap toolbar, click <strong>&quot;Cognitive Capacity&quot;</strong>. Drag the weekly study hour slider to see your optimal semester course bundle and saturated Min-Cut bottlenecks!
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigate('roadmap');
                  }}
                  style={{
                    marginTop: 6,
                    padding: '6px 12px',
                    borderRadius: 6,
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    color: '#38BDF8',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    width: 'fit-content',
                  }}
                >
                  Test Capacity Planner <ArrowRight size={12} />
                </button>
              </div>

              {/* Feature 4 */}
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: 10,
                  background: 'rgba(15, 23, 42, 0.5)',
                  border: '1px solid rgba(82, 217, 164, 0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#52D9A4', fontWeight: 600, fontSize: '0.84rem' }}>
                  <BookOpen size={16} />
                  <span>4. Course Library & Search</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#94A3B8', lineHeight: 1.45 }}>
                  Click <strong>&quot;My Courses&quot;</strong> in the sidebar. Search across 44 courses, filter by topic, and jump straight into their roadmap location.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigate('courses');
                  }}
                  style={{
                    marginTop: 6,
                    padding: '6px 12px',
                    borderRadius: 6,
                    background: 'rgba(82, 217, 164, 0.15)',
                    border: '1px solid rgba(82, 217, 164, 0.35)',
                    color: '#52D9A4',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    width: 'fit-content',
                  }}
                >
                  Browse Courses <ArrowRight size={12} />
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Viva & Presentation Tips */}
          <div
            style={{
              padding: '14px 18px',
              borderRadius: 10,
              background: 'rgba(245, 166, 35, 0.08)',
              border: '1px solid rgba(245, 166, 35, 0.25)',
              fontSize: '0.8rem',
              color: '#CBD5E1',
            }}
          >
            <strong style={{ color: '#F5A623', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Award size={15} />
              What to say in your Project Presentation / Viva:
            </strong>
            <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
              <li><strong>Graph Model</strong>: Curriculums are modeled as Directed Acyclic Graphs (DAGs) stored in PostgreSQL.</li>
              <li><strong>Prerequisite Subgraph</strong>: Reverse BFS isolates only relevant courses for target capstones.</li>
              <li><strong>Topological Ordering</strong>: Kahn&apos;s Algorithm O(V+E) sequences courses without prerequisite conflicts.</li>
              <li><strong>Capacity Optimization</strong>: Edmonds-Karp Residual Max-Flow and Min-Cut calculates student study throughput.</li>
              <li><strong>High Performance</strong>: Native compiled C++ engine solves graphs in ~6 milliseconds.</li>
            </ul>
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
            PathPilot — DSA Final Project Evaluation
          </span>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-primary"
            style={{ padding: '6px 20px', fontSize: '0.8rem', borderRadius: 8 }}
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  );
}
