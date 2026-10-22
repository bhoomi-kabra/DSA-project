'use client';

/**
 * PathPilotApp.jsx — PathPilot Full-Stack App
 * Personalised Learning Path Planner
 *
 * Views:
 *   overview  → Hero + Goals + Progress + Roadmap preview
 *   roadmap   → Full React Flow roadmap (My Roadmap)
 *   courses   → Course library with search (My Courses)
 *   progress  → Detailed per-goal progress (My Progress)
 */
import { useState, useCallback, useEffect } from 'react';

// Layout
import Sidebar from './Sidebar';

// Authentication
import AuthPage from './AuthPage';

// Views
import GoalCard from './GoalCard';
import HeroGraph from './HeroGraph';
import ProgressSection from './ProgressSection';
import RoadmapView from './RoadmapView';
import RoadmapPageView from './RoadmapPageView';
import CoursesView from './CoursesView';
import ProgressView from './ProgressView';

// Data
import { GOALS, COURSES, PROGRESS } from '../data/courseData';

// Icons
import {
  Search,
  Menu,
  X,
  GitBranch,
  Info,
  BookMarked,
  BarChart2,
  Award,
  Flame,
  ChevronRight,
} from 'lucide-react';

// ─── Overview stats config ──────────────────────────────────
const STAT_TILES = [
  {
    id: 'stat-completed',
    icon: Award,
    iconBg: 'rgba(82,217,164,0.12)',
    iconColor: 'var(--success)',
    val: PROGRESS.coursesCompleted,
    lbl: 'Completed',
  },
  {
    id: 'stat-remaining',
    icon: BookMarked,
    iconBg: 'rgba(139,124,255,0.12)',
    iconColor: 'var(--accent)',
    val: PROGRESS.coursesRemaining,
    lbl: 'Remaining',
  },
  {
    id: 'stat-hours',
    icon: BarChart2,
    iconBg: 'rgba(89,184,255,0.12)',
    iconColor: 'var(--accent-2)',
    val: `${PROGRESS.hoursLogged}h`,
    lbl: 'Hours Logged',
  },
  {
    id: 'stat-streak',
    icon: Flame,
    iconBg: 'rgba(245,166,35,0.12)',
    iconColor: 'var(--warn)',
    val: `${PROGRESS.currentStreak}d`,
    lbl: 'Streak',
  },
];

// ─── Page label map ─────────────────────────────────────────
const PAGE_LABELS = {
  overview: 'Overview',
  roadmap: 'My Roadmap',
  courses: 'My Courses',
  progress: 'My Progress',
};

export default function PathPilotApp() {
  const [activeNav, setActiveNav] = useState('overview');
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      setIsAuthenticated(sessionStorage.getItem('pathpilot_demo_authenticated') === 'true');
    }
  }, []);

  // Shared state for course completion and progress
  const [courses, setCourses] = useState(COURSES);

  const handleCourseStatusChange = useCallback((courseId, newStatus) => {
    setCourses((previousCourses) =>
      previousCourses.map((course) =>
        course.id === courseId ? { ...course, status: newStatus } : course
      )
    );
  }, []);

  const handleAuthenticated = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pathpilot_demo_authenticated', 'true');
    }
    setIsAuthenticated(true);
  }, []);

  const handleLogout = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('pathpilot_demo_authenticated');
    }
    setIsAuthenticated(false);
    setActiveNav('overview');
    setSelectedGoal(null);
    setSearchQuery('');
    setSidebarOpen(false);
  }, []);

  const currentGoal = GOALS.find((g) => g.id === selectedGoal) ?? null;

  // Toggle goal selection (click same = deselect)
  const handleGoalClick = useCallback((id) => {
    setSelectedGoal((prev) => (prev === id ? null : id));
  }, []);

  // "Build My Roadmap" CTA — navigate to roadmap view with current goal
  const handleBuildRoadmap = useCallback(() => {
    setActiveNav('roadmap');
  }, []);

  // Navigate away from current view
  const navigate = useCallback((view) => {
    setActiveNav(view);
    setSidebarOpen(false);
  }, []);

  // Search: if on courses view, filter there; otherwise jump to courses
  const handleSearch = useCallback(
    (e) => {
      const val = e.target.value;
      setSearchQuery(val);
      if (val.trim() && activeNav !== 'courses') {
        setActiveNav('courses');
      }
    },
    [activeNav]
  );

  // Clear search when leaving courses view
  const handleNav = useCallback(
    (view) => {
      if (view !== 'courses') setSearchQuery('');
      navigate(view);
    },
    [navigate]
  );

  if (!mounted) {
    return null;
  }

  if (!isAuthenticated) {
    return <AuthPage onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="app-shell">
      {/* ── Sidebar ─────────────────────────────────────── */}
      <Sidebar
        activeNav={activeNav}
        onNavChange={handleNav}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
      />

      {/* ── Main ────────────────────────────────────────── */}
      <main className="main">
        {/* Top Bar */}
        <header className="topbar">
          <div className="topbar-left">
            {/* Hamburger (mobile) */}
            <button
              className="icon-btn menu-btn"
              id="btn-menu"
              aria-label="Open navigation"
              onClick={() => setSidebarOpen((prev) => !prev)}
            >
              {sidebarOpen ? <X size={17} /> : <Menu size={17} />}
            </button>

            <span className="page-label">
              PathPilot &nbsp;<ChevronRight size={12} style={{ opacity: 0.4 }} />&nbsp;
              <span>{PAGE_LABELS[activeNav]}</span>
            </span>
          </div>

          {/* Search */}
          <div className="topbar-search" role="search">
            <Search size={14} aria-hidden="true" />
            <input
              id="topbar-search-input"
              type="search"
              placeholder="Search courses or goals…"
              value={searchQuery}
              onChange={handleSearch}
              aria-label="Search courses or goals"
            />
          </div>

          {/* Right — avatar */}
          <div className="topbar-right">
            <div
              className="avatar"
              role="img"
              aria-label="Student avatar"
              title="Student Workspace"
            >
              S
            </div>
          </div>
        </header>

        {/* ── Page content ──────────────────────────────── */}
        <div className="page-wrap">
          {/* ══ OVERVIEW ══════════════════════════════════ */}
          {activeNav === 'overview' && (
            <div className="anim-fade-in">
              {/* Hero */}
              <section className="hero" aria-labelledby="hero-heading">
                <div className="hero-content">
                  <p className="hero-eyebrow">Personalised Learning Path Planner</p>
                  <h1 id="hero-heading" className="hero-heading">
                    Your next skill<br />
                    <em>starts here.</em>
                  </h1>
                  <p className="hero-sub">
                    Build a learning path that matches your goals,
                    one prerequisite at a time.
                  </p>
                  <div className="hero-actions">
                    <button
                      id="btn-build-roadmap"
                      className="btn btn-primary"
                      onClick={handleBuildRoadmap}
                    >
                      <GitBranch size={15} />
                      Build My Roadmap
                    </button>
                    <button
                      id="btn-browse-courses"
                      className="btn btn-ghost"
                      onClick={() => navigate('courses')}
                    >
                      Browse Courses
                    </button>
                  </div>
                </div>
                <div className="hero-graph" aria-hidden="true">
                  <HeroGraph />
                </div>
              </section>

              {/* Stats */}
              <div
                className="stats-row stagger"
                role="list"
                aria-label="Learning statistics"
              >
                {STAT_TILES.map((s) => (
                  <div
                    key={s.id}
                    id={s.id}
                    className="stat-tile anim-fade-up"
                    role="listitem"
                  >
                    <div
                      className="stat-icon-wrap"
                      style={{ background: s.iconBg }}
                      aria-hidden="true"
                    >
                      <s.icon size={16} color={s.iconColor} strokeWidth={2} />
                    </div>
                    <div className="stat-val">{s.val}</div>
                    <div className="stat-lbl">{s.lbl}</div>
                  </div>
                ))}
              </div>

              {/* Goal Cards */}
              <section aria-labelledby="goals-heading">
                <div className="section-hd">
                  <h2 id="goals-heading">Choose your destination</h2>
                  <button
                    className="section-link"
                    id="btn-view-all-goals"
                    onClick={() => navigate('roadmap')}
                  >
                    View roadmap <ChevronRight size={12} />
                  </button>
                </div>
                <div className="goals-grid stagger">
                  {GOALS.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      selected={selectedGoal === goal.id}
                      onClick={handleGoalClick}
                    />
                  ))}
                </div>
              </section>

              {/* Learning Overview */}
              <ProgressSection />

              {/* Roadmap Preview */}
              <section aria-labelledby="roadmap-preview-heading">
                <div className="section-hd">
                  <h2 id="roadmap-preview-heading">
                    Roadmap Preview
                    {currentGoal && (
                      <span
                        className={`pill ${
                          currentGoal.bgToken === 'purple'
                            ? 'pill-purple'
                            : currentGoal.bgToken === 'blue'
                            ? 'pill-blue'
                            : 'pill-green'
                        }`}
                        style={{ marginLeft: 10 }}
                      >
                        {currentGoal.shortTitle}
                      </span>
                    )}
                  </h2>
                  <button
                    className="section-link"
                    id="btn-open-full-roadmap"
                    onClick={() => navigate('roadmap')}
                  >
                    Full view <ChevronRight size={12} />
                  </button>
                </div>

                <div className="roadmap-section">
                  {/* Disclaimer */}
                  <div className="sample-banner">
                    <Info size={12} aria-hidden="true" />
                    <span>
                      <strong>Sample preview</strong> — illustrative only.
                      Real roadmap generated by C++ algorithm backend (coming soon).
                    </span>
                  </div>

                  {!selectedGoal && (
                    <div className="roadmap-header" style={{ borderBottom: 'none' }}>
                      <div className="roadmap-title-row">
                        <span
                          style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}
                        >
                          Select a goal above to preview its prerequisite graph.
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="roadmap-body">
                    <RoadmapView
                      goalId={selectedGoal}
                      onSelectGoal={() => navigate('roadmap')}
                    />
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* ══ MY ROADMAP ════════════════════════════════ */}
          {activeNav === 'roadmap' && (
            <RoadmapPageView
              selectedGoalId={selectedGoal}
              onGoalSelect={setSelectedGoal}
            />
          )}

          {/* ══ MY COURSES ════════════════════════════════ */}
          {activeNav === 'courses' && (
            <CoursesView
              searchQuery={searchQuery}
              courses={courses}
              onCourseStatusChange={handleCourseStatusChange}
            />
          )}

          {/* ══ MY PROGRESS ══════════════════════════════ */}
          {activeNav === 'progress' && <ProgressView courses={courses} />}
        </div>
        {/* /page-wrap */}
      </main>
    </div>
  );
}
