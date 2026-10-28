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
  currentUser = null,
}) {
  const userInitial = (currentUser?.name?.[0] || currentUser?.email?.[0] || 'S').toUpperCase();
  const userName = currentUser?.name || 'Student Workspace';
  const userRole = currentUser?.branch
    ? `${currentUser.branch}${currentUser.yearOfStudy ? ` · Year ${currentUser.yearOfStudy}` : ''}`
    : 'CS · Student';

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
            <img src="/pathpilot-mark.png" alt="PathPilot logo" />
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
        <div className="sidebar-footer">
          <div
            className="profile-row"
            role="button"
            tabIndex={0}
            aria-label="Student profile"
          >
            <div className="avatar" aria-hidden="true" style={{ background: 'var(--primary)', color: '#FFFFFF', fontWeight: 700 }}>
              {userInitial}
            </div>

            <div style={{ overflow: 'hidden' }}>
              <div className="profile-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userName}
              </div>
              <div className="profile-role" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userRole}
              </div>
            </div>
          </div>

          <button
            type="button"
            id="sidebar-btn-logout"
            className="sidebar-logout-btn"
            onClick={onLogout}
            title="Sign out of PathPilot"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
