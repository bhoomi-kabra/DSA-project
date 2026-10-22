'use client';

// Sidebar.jsx — PathPilot v2
import {
  LayoutDashboard,
  Map,
  BookOpen,
  BarChart2,
  LogOut,
} from 'lucide-react';

const NAV = [
  { id: 'overview',   icon: LayoutDashboard, label: 'Overview'    },
  { id: 'roadmap',    icon: Map,             label: 'My Roadmap'  },
  { id: 'courses',    icon: BookOpen,        label: 'My Courses'  },
  { id: 'progress',   icon: BarChart2,       label: 'My Progress' },
];

export default function Sidebar({
  activeNav,
  onNavChange,
  isOpen,
  onClose,
  onLogout,
}) {
  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay${isOpen ? ' show' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />  

      <aside className={`sidebar${isOpen ? ' sidebar-open' : ''}`} aria-label="Main navigation">
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="brand-icon" aria-hidden="true">
            {/* Simple compass-style SVG wordmark */}
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="7.5" stroke="white" strokeWidth="1.4" />
              <path d="M9 3.5 L10.5 9 L9 10.5 L7.5 9 Z" fill="white" opacity="0.9" />
              <path d="M9 14.5 L7.5 9 L9 7.5 L10.5 9 Z" fill="white" opacity="0.4" />
            </svg>
          </div>
          <div>
            <div className="brand-name">PathPilot</div>
            <div className="brand-sub">Learning Path Planner</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav" aria-label="Primary navigation">
          <div className="nav-label">Menu</div>
          {NAV.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              id={`nav-${id}`}
              className={`nav-link${activeNav === id ? ' active' : ''}`}
              onClick={() => { onNavChange(id); onClose?.(); }}
              aria-current={activeNav === id ? 'page' : undefined}
            >
              <Icon
                size={16}
                strokeWidth={activeNav === id ? 2.2 : 1.7}
                className="nav-link-icon"
              />
              {label}
            </button>
          ))}
        </nav>

        {/* Profile footer */}
        {/* Profile footer */}
<div className="sidebar-footer">
  <div
    className="profile-row"
    role="button"
    tabIndex={0}
    aria-label="Student profile"
  >
    <div className="avatar" aria-hidden="true">S</div>

    <div>
      <div className="profile-name">Student Workspace</div>
      <div className="profile-role">CS · 3rd Year</div>
    </div>
  </div>

  <button
    type="button"
    className="sidebar-logout-btn"
    onClick={onLogout}
  >
    <LogOut size={16} />
    <span>Logout</span>
  </button>
</div>
      </aside>
    </>
  );
}
