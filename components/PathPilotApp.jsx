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
import { useState, useCallback, useEffect, useMemo } from 'react';

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
import StudentGuideModal from './StudentGuideModal';
import ThemeToggle from './ThemeToggle';

// Data
import { GOALS, COURSES, PROGRESS } from '../data/courseData';

// Icons
import {
  Search,
  Menu,
  X,
  GitBranch,
  Info,
  Cpu,
  BookMarked,
  BarChart2,
  Award,
  Flame,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';


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
  const [showGuideModal, setShowGuideModal] = useState(false);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [userStats, setUserStats] = useState({
    coursesCompleted: 0,
    coursesRemaining: 44,
    hoursLogged: 0,
    currentStreak: 0,
  });

  // Shared state for course completion and progress
  const [courses, setCourses] = useState(COURSES);

  // Fetch real progress from database (P0-3)
  const fetchProgress = useCallback(async () => {
    try {
      const res = await fetch('/api/user/progress');
      if (res.ok) {
        const data = await res.json();
        if (data.stats) {
          setUserStats(data.stats);
        }
        if (data.completedCodes && Array.isArray(data.completedCodes)) {
          const completedSet = new Set(data.completedCodes);
          const unlockedSet = new Set(data.unlockedCodes || []);
          setCourses((prev) =>
            prev.map((c) => {
              if (completedSet.has(c.code)) return { ...c, status: 'completed' };
              if (unlockedSet.has(c.code)) return { ...c, status: 'in-progress' };
              return { ...c, status: 'locked' };
            })
          );
        }
      }
    } catch (err) {
      console.error('Error fetching student progress:', err);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('pathpilot-theme');
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = (savedTheme === 'light' || savedTheme === 'dark') ? savedTheme : (prefersDark ? 'dark' : 'light');
      setTheme(initialTheme);
      document.documentElement.setAttribute('data-theme', initialTheme);
      document.documentElement.dataset.theme = initialTheme;

      // Check session with server
      fetch('/api/auth/me')
        .then((res) => res.json())
        .then((data) => {
          if (data.authenticated && data.user) {
            setIsAuthenticated(true);
            setCurrentUser(data.user);
            fetchProgress();
          } else {
            const hasDemoSession = sessionStorage.getItem('pathpilot_demo_authenticated') === 'true';
            setIsAuthenticated(hasDemoSession);
            if (hasDemoSession) fetchProgress();
          }
        })
        .catch(() => {
          setIsAuthenticated(false);
        });
    }
  }, [fetchProgress]);

  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => {
      const nextTheme = prev === 'dark' ? 'light' : 'dark';
      if (typeof window !== 'undefined') {
        localStorage.setItem('pathpilot-theme', nextTheme);
        document.documentElement.setAttribute('data-theme', nextTheme);
        document.documentElement.dataset.theme = nextTheme;
      }
      return nextTheme;
    });
  }, []);

  const handleCourseStatusChange = useCallback((courseId, newStatus) => {
    setCourses((previousCourses) =>
      previousCourses.map((course) =>
        course.id === courseId ? { ...course, status: newStatus } : course
      )
    );
    fetchProgress();
  }, [fetchProgress]);

  const handleAuthenticated = useCallback((user) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pathpilot_demo_authenticated', 'true');
    }
    if (user) setCurrentUser(user);
    setIsAuthenticated(true);
    fetchProgress();
  }, [fetchProgress]);

  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('pathpilot_demo_authenticated');
    }
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActiveNav('overview');
    setSelectedGoal(null);
    setSearchQuery('');
    setSidebarOpen(false);
  }, []);

  // Dynamic stat tiles from database (P0-3)
  const statTiles = useMemo(() => [
    {
      id: 'stat-completed',
      icon: Award,
      iconBg: 'rgba(46, 125, 91, 0.12)',
      iconColor: 'var(--success)',
      val: userStats.coursesCompleted,
      lbl: 'Completed',
    },
    {
      id: 'stat-remaining',
      icon: BookMarked,
      iconBg: 'rgba(91, 91, 214, 0.12)',
      iconColor: 'var(--accent)',
      val: userStats.coursesRemaining,
      lbl: 'Remaining',
    },
    {
      id: 'stat-hours',
      icon: BarChart2,
      iconBg: 'rgba(37, 99, 235, 0.12)',
      iconColor: 'var(--accent-2)',
      val: `${userStats.hoursLogged}h`,
      lbl: 'Hours Logged',
    },
    {
      id: 'stat-streak',
      icon: Flame,
      iconBg: 'rgba(183, 121, 31, 0.12)',
      iconColor: 'var(--warn)',
      val: `${userStats.currentStreak}d`,
      lbl: 'Streak',
    },
  ], [userStats]);

  const [targetRoadmapCourse, setTargetRoadmapCourse] = useState(null);

  const handleNavigateToRoadmap = useCallback((goalIdOrSlug, courseCode) => {
    let goalId = goalIdOrSlug;
    if (goalIdOrSlug === 'machine-learning-engineer') goalId = 'ml';
    if (goalIdOrSlug === 'full-stack-developer') goalId = 'webdev';
    if (goalIdOrSlug === 'dsa-interview-prep') goalId = 'placement';

    setSelectedGoal(goalId);
    setTargetRoadmapCourse(courseCode);
    setActiveNav('roadmap');
  }, []);

  const currentGoal = GOALS.find((g) => g.id === selectedGoal) ?? null;

  // Toggle goal selection (click same = deselect)
  const handleGoalClick = useCallback((id) => {
    setSelectedGoal((prev) => (prev === id ? null : id));
  }, []);

  // "Build My Roadmap" CTA — navigate to roadmap view with current goal
  const handleBuildRoadmap = useCallback(() => {
    if (!selectedGoal) {
      setSelectedGoal('ml');
    }
    setActiveNav('roadmap');
  }, [selectedGoal]);

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
    return (
      <AuthPage
        onAuthenticated={handleAuthenticated}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />
    );
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
        currentUser={currentUser}
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

          {/* Right — avatar, Guide, & Theme toggle */}
          <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              id="topbar-btn-guide"
              onClick={() => setShowGuideModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 8,
                background: 'rgba(82, 217, 164, 0.15)',
                border: '1px solid rgba(82, 217, 164, 0.35)',
                color: '#52D9A4',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <HelpCircle size={14} />
              <span>Project Guide & How It Works</span>
            </button>

            <ThemeToggle theme={theme} onToggle={handleToggleTheme} />

            <div
              className="avatar"
              role="img"
              aria-label="Student avatar"
              title={currentUser?.name || currentUser?.email || 'Student Workspace'}
            >
              {(currentUser?.name?.[0] || currentUser?.email?.[0] || 'S').toUpperCase()}
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
                  <p className="hero-eyebrow">PLAN YOUR NEXT LEARNING STEP</p>
                  <h1 id="hero-heading" className="hero-heading">
                    Learn in the right order.<br />
                    <em>Know what comes next.</em>
                  </h1>
                  <p className="hero-sub">
                    Choose a goal to see which courses to learn first,
                    what depends on them, and how each step connects.
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
                      type="button"
                      id="hero-btn-guide"
                      className="btn btn-outline-accent"
                      onClick={() => setShowGuideModal(true)}
                      style={{ gap: 6, borderColor: 'rgba(82, 217, 164, 0.4)', color: '#52D9A4' }}
                    >
                      <HelpCircle size={15} />
                      Project Guide
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
                {statTiles.map((s) => (
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
              <ProgressSection stats={userStats} />

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
                  {/* C++ Engine & DSA Innovation Banner */}
                  <div className="sample-banner" style={{ background: 'linear-gradient(90deg, rgba(82,217,164,0.1), rgba(139,124,255,0.1))', borderColor: 'rgba(82,217,164,0.3)', color: '#52D9A4' }}>
                    <Cpu size={13} aria-hidden="true" />
                    <span>
                      <strong>C++ Graph Algorithm Engine</strong> &bull; Interactive Algorithm Inspector (Kahn&apos;s O(V+E)) &bull; Student Cognitive Capacity Planner (Edmonds-Karp Max-Flow / Min-Cut)
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
              initialSelectedCourseCode={targetRoadmapCourse}
            />
          )}

          {/* ══ MY COURSES ════════════════════════════════ */}
          {activeNav === 'courses' && (
            <CoursesView
              searchQuery={searchQuery}
              onNavigateToRoadmap={handleNavigateToRoadmap}
            />
          )}

          {/* ══ MY PROGRESS ══════════════════════════════ */}
          {activeNav === 'progress' && <ProgressView courses={courses} stats={userStats} />}
        </div>
        {/* /page-wrap */}
      </main>
      {/* Student Guide Modal */}
      <StudentGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        onNavigate={(view) => navigate(view)}
      />
    </div>
  );
}
