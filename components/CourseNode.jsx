'use client';

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { CheckCircle2, PlayCircle, Lock } from 'lucide-react';

/**
 * CourseNode — Custom React Flow Node for PathPilot DAG
 * Features handles on left (target) and right (source) for clean left-to-right DAG layout.
 * Visualizes status, critical path flag, hours, level, category, and interaction states.
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

  const statusCls = `course-node--${status}`;
  const highlightCls = highlightRole ? `course-node--${highlightRole}` : '';
  const criticalCls = isCritical ? 'course-node--critical' : '';
  const dimmedCls = isDimmed ? 'course-node--dimmed' : '';
  const selectedCls = selected ? 'course-node--selected' : '';

  return (
    <div
      className={`course-node ${statusCls} ${highlightCls} ${criticalCls} ${dimmedCls} ${selectedCls}`}
      id={`flow-node-${code}`}
      title={`${code}: ${title} (${estimatedHours}h)`}
    >
      {/* Target handle on left for incoming prerequisite edges */}
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        style={{
          background: '#59B8FF',
          width: 7,
          height: 7,
          border: '1.5px solid #0E1425',
          left: -4,
        }}
      />

      {/* Header: Code + CP badge + Hours */}
      <div className="node-header">
        <span className="node-code">{code}</span>
        <div className="node-badges">
          {isCritical && (
            <span className="node-cp-badge" title="Course is on the Critical Path bottleneck">
              CP
            </span>
          )}
          <span className="node-hours-badge">{estimatedHours}h</span>
        </div>
      </div>

      {/* Title */}
      <div className="node-title">{title}</div>

      {/* Footer: Level & Category + Status icon */}
      <div className="node-footer">
        <span className="node-meta" title={category}>
          L{level} • {category}
        </span>

        {status === 'completed' && (
          <span className="node-status-chip node-status-chip--completed">
            <CheckCircle2 size={10} strokeWidth={2.5} />
            Done
          </span>
        )}

        {status === 'in-progress' && (
          <span className="node-status-chip node-status-chip--in-progress">
            <PlayCircle size={10} strokeWidth={2.5} />
            Ready
          </span>
        )}

        {status === 'locked' && (
          <span className="node-status-chip node-status-chip--locked">
            <Lock size={10} strokeWidth={2.5} />
            Locked
          </span>
        )}
      </div>

      {/* Source handle on right for outgoing prerequisite edges */}
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        style={{
          background: '#8B7CFF',
          width: 7,
          height: 7,
          border: '1.5px solid #0E1425',
          right: -4,
        }}
      />
    </div>
  );
}

export default memo(CourseNode);
