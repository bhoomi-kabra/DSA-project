'use client';

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { CheckCircle2, PlayCircle, Lock, Zap } from 'lucide-react';

const CATEGORY_COLORS = {
  'Foundations': '#8B5CF6',
  'Mathematics': '#6366F1',
  'Core CS': '#0EA5E9',
  'Programming': '#0284C7',
  'Machine Learning': '#9333EA',
  'Deep Learning': '#C026D3',
  'Web Development': '#10B981',
  'Frontend': '#059669',
  'Backend': '#D97706',
  'Database': '#EA580C',
  'Interview Prep': '#F59E0B',
};

function getCategoryColor(cat) {
  if (!cat) return '#8A5A00';
  for (const [key, color] of Object.entries(CATEGORY_COLORS)) {
    if (cat.toLowerCase().includes(key.toLowerCase())) return color;
  }
  return '#8A5A00';
}

/**
 * CourseNode — P0-2 Readable & Polished React Flow Node
 * Fixed dimensions: 240px × 92px
 * Features:
 * - 14px/600 title (2 lines max with clean ellipsis)
 * - Module code & hours as small pills on ONE row
 * - Status badge top-right with zero overlap
 * - Left colored border for category identification
 * - Handles for clean LR prerequisite routing
 */
function CourseNode({ id, data, selected }) {
  const {
    code = '',
    title = '',
    estimatedHours = 0,
    status = 'locked',
    category = '',
    level = 0,
    isCritical = false,
    highlightRole = null, // 'selected' | 'ancestor' | 'descendant'
    isDimmed = false,
  } = data || {};

  const catColor = getCategoryColor(category);

  const statusCls = `course-node--${status}`;
  const highlightCls = highlightRole ? `course-node--${highlightRole}` : '';
  const criticalCls = isCritical ? 'course-node--critical' : '';
  const dimmedCls = isDimmed ? 'course-node--dimmed' : '';
  const selectedCls = selected ? 'course-node--selected' : '';

  return (
    <div
      className={`course-node ${statusCls} ${highlightCls} ${criticalCls} ${dimmedCls} ${selectedCls}`}
      id={`flow-node-${code}`}
      title={`${code}: ${title} (${estimatedHours}h, ${category || 'General'})`}
      style={{
        borderLeftColor: catColor,
        borderLeftWidth: 4,
      }}
    >
      {/* Target handle on left for incoming prerequisite edges */}
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        style={{
          background: 'var(--accent, #5B5BD6)',
          width: 8,
          height: 8,
          border: '2px solid var(--bg-card)',
        }}
      />

      {/* Row 1: Code + Hours pills on Left, Status Badge on Right */}
      <div className="node-top-row">
        <div className="node-pills-group">
          <span className="node-pill-code">{code}</span>
          <span className="node-pill-hours">{estimatedHours}h</span>
          {isCritical && (
            <span className="node-pill-critical" title="On Critical Path (bottleneck module)">
              <Zap size={9} />
              CP
            </span>
          )}
        </div>

        <div className="node-status-wrap">
          {data?.isAlgoActive && (
            <span className="node-algo-badge active">ACTIVE ⚡</span>
          )}
          {data?.isAlgoQueued && !data?.isAlgoActive && (
            <span className="node-algo-badge ready">READY 📥</span>
          )}

          {highlightRole === 'ancestor' && !data?.isAlgoQueued && (
            <span className="node-role-badge ancestor" title="Prerequisite needed for selected course">
              PREREQ
            </span>
          )}
          {highlightRole === 'selected' && !data?.isAlgoActive && (
            <span className="node-role-badge target" title="Selected module">
              TARGET
            </span>
          )}
          {highlightRole === 'descendant' && (
            <span className="node-role-badge unlocks" title="Unlocked by this module">
              UNLOCKS
            </span>
          )}

          {!highlightRole && !data?.isAlgoActive && !data?.isAlgoQueued && (
            <>
              {status === 'completed' && (
                <span className="node-status-chip node-status-chip--completed">
                  <CheckCircle2 size={11} strokeWidth={2.4} />
                  Done
                </span>
              )}
              {status === 'in-progress' && (
                <span className="node-status-chip node-status-chip--in-progress">
                  <PlayCircle size={11} strokeWidth={2.4} />
                  Ready
                </span>
              )}
              {status === 'locked' && (
                <span className="node-status-chip node-status-chip--locked">
                  <Lock size={10} strokeWidth={2.2} />
                  Locked
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Row 2: Human-Readable Module Title (14px/600, 2 lines max) */}
      <div
        className="node-title"
        title={title}
      >
        {title || code}
      </div>

      {/* Row 3: Category subtitle pill */}
      <div className="node-category-sub">
        <span style={{ color: catColor }}>●</span>
        <span>{category || 'Core Curriculum'}</span>
      </div>

      {/* Source handle on right for outgoing prerequisite edges */}
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        style={{
          background: 'var(--accent, #5B5BD6)',
          width: 8,
          height: 8,
          border: '2px solid var(--bg-card)',
        }}
      />
    </div>
  );
}

export default memo(CourseNode);
