// GoalCard.jsx — v2
import { Brain, Code2, Trophy, Check } from 'lucide-react';

const ICON_MAP = { Brain, Code2, Trophy };

// Per-goal colour config
const THEME = {
  purple: { iconBg: 'rgba(139,124,255,0.15)', iconColor: '#8B7CFF', pillClass: 'pill-purple' },
  blue:   { iconBg: 'rgba(89,184,255,0.12)',  iconColor: '#59B8FF', pillClass: 'pill-blue'   },
  green:  { iconBg: 'rgba(82,217,164,0.12)',  iconColor: '#52D9A4', pillClass: 'pill-green'  },
};

export default function GoalCard({ goal, selected, onClick }) {
  const Icon  = ICON_MAP[goal.icon] ?? Brain;
  const theme = THEME[goal.bgToken] ?? THEME.purple;

  return (
    <div
      id={`goal-card-${goal.id}`}
      className={`goal-card${selected ? ' selected' : ''}`}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={() => onClick(goal.id)}
      onKeyDown={e => e.key === 'Enter' && onClick(goal.id)}
    >
      {/* Icon */}
      <div
        className="goal-card-icon"
        style={{ background: theme.iconBg, color: theme.iconColor }}
        aria-hidden="true"
      >
        <Icon size={22} strokeWidth={1.8} />
      </div>

      {/* Text */}
      <div className="goal-card-title">{goal.title}</div>
      <div className="goal-card-desc">{goal.description}</div>

      {/* Tags */}
      <div className="goal-tags">
        {goal.tags.map(tag => (
          <span key={tag} className={`pill ${theme.pillClass}`}>{tag}</span>
        ))}
      </div>

      {/* Footer */}
      <div className="goal-card-footer">
        <span className="goal-meta">{goal.courseCount} courses · {goal.duration}</span>
        <div className="goal-check" aria-hidden="true">
          {selected && <Check size={13} strokeWidth={2.5} />}
        </div>
      </div>
    </div>
  );
}
