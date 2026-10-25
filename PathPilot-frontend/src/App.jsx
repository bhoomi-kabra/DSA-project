/**
 * App.jsx — PathPilot v2
 * Personalised Learning Path Planner
 *
 * Views:
 *   overview  → Hero + Goals + Progress + Roadmap preview
 *   roadmap   → Full React Flow roadmap (My Roadmap)
 *   courses   → Course library with search (My Courses)
 *   progress  → Detailed per-goal progress (My Progress)
 */
import { useState, useCallback, useEffect } from 'react';
import ThemeToggle from './components/ThemeToggle';
import './App.css';

// Layout
import Sidebar from './components/Sidebar';

// Authentication
import AuthPage from './AuthPage.jsx';

// Views
import GoalCard        from './components/GoalCard';
import HeroGraph       from './components/HeroGraph';
import ProgressSection from './components/ProgressSection';
import RoadmapView     from './components/RoadmapView';
import RoadmapPageView from './components/RoadmapPageView';
import CoursesView     from './components/CoursesView';
import ProgressView    from './components/ProgressView';

// Data
import { GOALS, COURSES } from './data/courseData';

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


// ─── Page label map ─────────────────────────────────────────
const PAGE_LABELS = {
  overview: 'Overview',
  roadmap:  'My Roadmap',
  courses:  'My Courses',
  progress: 'My Progress',
};

// ─── App ────────────────────────────────────────────────────
export default function App() {
  const [activeNav, setActiveNav] = useState('overview');
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [theme, setTheme] = useState(() => {
  const savedTheme = localStorage.getItem('pathpilot-theme');
  return savedTheme === 'light' ? 'light' : 'dark';
});

useEffect(() => {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('pathpilot-theme', theme);
}, [theme]);

const handleToggleTheme = useCallback(() => {
  setTheme(currentTheme =>
    currentTheme === 'dark' ? 'light' : 'dark'
  );
}, []);

  const [isAuthenticated, setIsAuthenticated] = useState(
    () => sessionStorage.getItem('pathpilot_demo_authenticated') === 'true'
  );

  // Shared state for course completion and progress
  const [courses, setCourses] = useState(COURSES);
  // Calculate dashboard statistics from the current course state
const completedCount = courses.filter(
  course => course.status === 'completed'
).length;

const inProgressCount = courses.filter(
  course => course.status === 'in-progress'
).length;

const lockedCount = courses.filter(
  course => course.status === 'locked'
).length;

const totalCourses = courses.length;

const STAT_TILES = [
  {
    id: 'stat-completed',
    icon: Award,
    iconBg: 'rgba(82,217,164,0.12)',
    iconColor: 'var(--success)',
    val: completedCount,
    lbl: 'Completed',
  },
  {
    id: 'stat-in-progress',
    icon: BarChart2,
    iconBg: 'rgba(139,124,255,0.12)',
    iconColor: 'var(--accent)',
    val: inProgressCount,
    lbl: 'In Progress',
  },
  {
    id: 'stat-locked',
    icon: BookMarked,
    iconBg: 'rgba(245,166,35,0.12)',
    iconColor: 'var(--warn)',
    val: lockedCount,
    lbl: 'Locked',
  },
  {
    id: 'stat-total',
    icon: GitBranch,
    iconBg: 'rgba(89,184,255,0.12)',
    iconColor: 'var(--accent-2)',
    val: totalCourses,
    lbl: 'Total Courses',
  },
];
  // Update the status of a course
const handleCourseStatusChange = useCallback((courseId, newStatus) => {
  setCourses((previousCourses) =>
    previousCourses.map((course) =>
      course.id === courseId
        ? { ...course, status: newStatus }
        : course
    )
  );
}, []);
  // Keep your existing callbacks below, including:
  // handleAuthenticated
  // handleLogout
  // handleGoalClick
  // handleBuildRoadmap
  // navigate
  // handleSearch
  // handleNav

const handleAuthenticated = useCallback(() => {
  sessionStorage.setItem('pathpilot_demo_authenticated', 'true');
  setIsAuthenticated(true);
}, []);
const handleLogout = useCallback(() => {
  sessionStorage.removeItem('pathpilot_demo_authenticated');

  setIsAuthenticated(false);
  setActiveNav('overview');
  setSelectedGoal(null);
  setSearchQuery('');
  setSidebarOpen(false);
}, []);

  const currentGoal = GOALS.find(g => g.id === selectedGoal) ?? null;

  // Toggle goal selection (click same = deselect)
  const handleGoalClick = useCallback((id) => {
    setSelectedGoal(prev => (prev === id ? null : id));
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
  const handleSearch = useCallback((e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.trim() && activeNav !== 'courses') {
      setActiveNav('courses');
    }
  }, [activeNav]);

  // Clear search when leaving courses view
  const handleNav = useCallback((view) => {
    if (view !== 'courses') setSearchQuery('');
    navigate(view);
  }, [navigate]);

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
              onClick={() => setSidebarOpen(prev => !prev)}
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
  <ThemeToggle
    theme={theme}
    onToggle={handleToggleTheme}
  />

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
                {STAT_TILES.map(s => (
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
                  <h2 id="goals-heading">What are you learning towards?</h2>
                  <button
                    className="section-link"
                    id="btn-view-all-goals"
                    onClick={() => navigate('roadmap')}
                  >
                    View roadmap <ChevronRight size={12} />
                  </button>
                </div>
                <div className="goals-grid stagger">
                  {GOALS.map(goal => (
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
                          currentGoal.bgToken === 'purple' ? 'pill-purple' :
                          currentGoal.bgToken === 'blue'   ? 'pill-blue'   : 'pill-green'
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
                      <strong>Example roadmap</strong> — shown for preview.
The final graph will use the prerequisite relationships
returned by the C++ algorithm.
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
         {activeNav === 'progress' && (
  <ProgressView courses={courses} />
)}

        </div>{/* /page-wrap */}
      </main>
    </div>
  );
}
