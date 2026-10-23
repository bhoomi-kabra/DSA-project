'use client';

import React from 'react';
import { Sparkles, Zap, CheckCircle2, ArrowRight } from 'lucide-react';

export default function RecommendedCoursesTray({
  recommendedCourses = [],
  onSelectCourse,
}) {
  if (!recommendedCourses || recommendedCourses.length === 0) {
    return null;
  }

  return (
    <div className="recommended-section" id="recommended-courses-tray">
      <div className="recommended-header">
        <div className="recommended-title">
          <Sparkles size={14} color="#8B7CFF" />
          <span>Recommended Next Courses</span>
          <span
            style={{
              fontSize: '0.65rem',
              color: 'var(--text-muted)',
              fontWeight: 400,
            }}
          >
            ({recommendedCourses.length} available to study now)
          </span>
        </div>
      </div>

      <div className="recommended-grid">
        {recommendedCourses.map((c) => {
          const isCritical = c.isCritical;
          const unlocksCount = (c.dependents || []).length;
          const isAnchor = unlocksCount >= 2;

          let badgeType = 'ready';
          let badgeText = 'Ready to Study';

          if (isCritical) {
            badgeType = 'critical';
            badgeText = '★ Critical Bottleneck';
          } else if (isAnchor) {
            badgeType = 'anchor';
            badgeText = `⚡ Unlocks ${unlocksCount} Courses`;
          }

          return (
            <div
              key={c.id || c.code}
              className="recommended-card"
              onClick={() => onSelectCourse?.(c.code)}
              title={`Click to view ${c.code} in graph`}
            >
              <div className="recommended-card-top">
                <span style={{ fontWeight: 700, fontSize: '0.75rem', color: '#F4F6FF' }}>
                  {c.code}
                </span>
                <span className={`recommended-badge recommended-badge--${badgeType}`}>
                  {badgeText}
                </span>
              </div>

              <div className="recommended-course-title">{c.title}</div>

              <div className="recommended-course-reason">
                {c.recommendationReason ||
                  (isCritical
                    ? 'Advancing this bottleneck directly shortens the minimum roadmap completion time.'
                    : `Estimated ${c.estimatedHours}h • All prerequisite requirements completed.`)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
