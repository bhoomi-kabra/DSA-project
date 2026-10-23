'use client';

/**
 * CoursesView.jsx — Full Course Catalogue View
 *
 * Connected directly to PostgreSQL via /api/courses and /api/user/progress.
 * Allows users to:
 * - Browse all 44 courses across 3 career roadmaps.
 * - Search by course code, title, category, or description.
 * - Filter by track (All, ML & AI, Full Stack, Placement & DSA) and category.
 * - View estimated study hours, category, and prerequisites.
 * - Mark courses complete or undo completion with real database persistence.
 * - "View in Roadmap" to navigate directly to the course in its prerequisite graph.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Lock,
  PlayCircle,
  CheckCircle2,
  Search,
  BookOpen,
  Clock,
  Filter,
  ArrowRight,
  GitBranch,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';
import { GOALS } from '../data/courseData';

const STATUS_CONFIG = {
  completed: {
    chipCls: 'chip-done',
    label: 'Completed',
    Icon: CheckCircle2,
  },
  'in-progress': {
    chipCls: 'chip-progress',
    label: 'Ready to Study',
    Icon: PlayCircle,
  },
  locked: {
    chipCls: 'chip-locked',
    label: 'Locked',
    Icon: Lock,
  },
};

export default function CoursesView({
  searchQuery = '',
  onNavigateToRoadmap,
}) {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Local filter states
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [selectedGoalFilter, setSelectedGoalFilter] = useState('all'); // 'all' | 'ml' | 'webdev' | 'placement'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);

  // Sync external search query
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  // Fetch all courses from backend API
  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/courses');
      if (!res.ok) throw new Error('Failed to load course catalogue');
      const data = await res.json();
      setCourses(data.courses || []);
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError(err.message || 'Failed to fetch course catalogue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Handle progress toggle with database persistence
  const handleToggleComplete = async (courseId, nextCompleted) => {
    setUpdatingId(courseId);
    try {
      const res = await fetch('/api/user/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          isCompleted: nextCompleted,
        }),
      });

      if (res.ok) {
        // Optimistically update local courses state & refetch
        setCourses((prev) =>
          prev.map((c) =>
            c.id === courseId
              ? {
                  ...c,
                  isCompleted: nextCompleted,
                  status: nextCompleted
                    ? 'completed'
                    : c.unmetPrerequisites?.length === 0
                    ? 'in-progress'
                    : 'locked',
                }
              : c
          )
        );
        await fetchCourses();
      } else {
        const data = await res.json();
        alert(`Error: ${data.error || 'Failed to update progress'}`);
      }
    } catch (err) {
      console.error('Error updating course progress:', err);
      alert('Network error updating course progress.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter courses based on search, track, and category
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      // Search term matching
      if (localSearch.trim()) {
        const q = localSearch.toLowerCase();
        const match =
          c.code.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          (c.category && c.category.toLowerCase().includes(q)) ||
          (c.description && c.description.toLowerCase().includes(q));
        if (!match) return false;
      }

      // Track filter matching
      if (selectedGoalFilter !== 'all') {
        const goalObj = GOALS.find((g) => g.id === selectedGoalFilter);
        const targetSlug = goalObj?.slug || selectedGoalFilter;
        const belongsToGoal = (c.goals || []).some(
          (g) => g.slug === targetSlug || g.id === targetSlug
        );
        if (!belongsToGoal) return false;
      }

      // Category matching
      if (selectedCategory !== 'all') {
        if (c.category !== selectedCategory) return false;
      }

      return true;
    });
  }, [courses, localSearch, selectedGoalFilter, selectedCategory]);

  return (
    <div className="view-wrap">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="view-heading">Course Catalogue</h1>
          <p className="view-sub">
            Explore {courses.length} courses across 3 structured career tracks, complete with prerequisites, estimated study hours, and live progress tracking.
          </p>
        </div>

        <button
          className="btn btn-ghost"
          style={{ fontSize: '0.78rem', padding: '6px 12px' }}
          onClick={fetchCourses}
          disabled={loading}
          title="Reload course catalogue"
        >
          <RefreshCw size={13} className={loading ? 'anim-spin' : ''} />
          <span style={{ marginLeft: 6 }}>Refresh</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: 24,
        }}
      >
        {/* Track selection tabs */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`btn ${selectedGoalFilter === 'all' ? 'btn-outline-accent' : 'btn-ghost'}`}
            style={{ fontSize: '0.75rem', padding: '5px 12px' }}
            onClick={() => setSelectedGoalFilter('all')}
          >
            All Tracks ({courses.length})
          </button>
          {GOALS.map((g) => {
            const active = selectedGoalFilter === g.id;
            return (
              <button
                key={g.id}
                type="button"
                className={`btn ${active ? 'btn-outline-accent' : 'btn-ghost'}`}
                style={{
                  fontSize: '0.75rem',
                  padding: '5px 12px',
                  borderColor: active ? `${g.accentColor}66` : undefined,
                  color: active ? g.accentColor : undefined,
                }}
                onClick={() => setSelectedGoalFilter(g.id)}
              >
                {g.shortTitle}
              </button>
            );
          })}
        </div>

        {/* Search & Category Filter */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Category Dropdown */}
          {categories.length > 0 && (
            <select
              className="toolbar-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ padding: '6px 10px', fontSize: '0.75rem' }}
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}

          {/* Search Input */}
          <div className="toolbar-input-wrap">
            <Search size={13} />
            <input
              type="text"
              className="toolbar-input"
              placeholder="Search catalogue..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              style={{ width: 190 }}
            />
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="empty-state" style={{ paddingTop: 40 }}>
          <div
            style={{
              width: 34,
              height: 34,
              border: '2px solid rgba(139,124,255,0.2)',
              borderTopColor: '#8B7CFF',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <div className="empty-title">Loading course catalogue...</div>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="empty-state">
          <div className="empty-title" style={{ color: '#EF4444' }}>
            Failed to load courses
          </div>
          <p className="empty-desc">{error}</p>
          <button className="btn btn-outline-accent" onClick={fetchCourses}>
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredCourses.length === 0 && (
        <div className="empty-state" style={{ paddingTop: 40 }}>
          <div className="empty-icon-ring">
            <Search size={22} strokeWidth={1.4} />
          </div>
          <div className="empty-title">No courses found</div>
          <p className="empty-desc">
            No courses matched your search criteria. Try resetting your search or track filter.
          </p>
          <button
            className="btn btn-ghost"
            onClick={() => {
              setLocalSearch('');
              setSelectedGoalFilter('all');
              setSelectedCategory('all');
            }}
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Course Grid */}
      {!loading && !error && filteredCourses.length > 0 && (
        <div className="courses-grid">
          {filteredCourses.map((c) => {
            const statusConfig = STATUS_CONFIG[c.status] || STATUS_CONFIG.locked;
            const StatusIcon = statusConfig.Icon;
            const isCompleted = c.isCompleted;
            const isUpdating = updatingId === c.id;

            // Determine primary goal for "View in Roadmap"
            const primaryGoal = c.goals?.[0]?.slug || 'machine-learning-engineer';

            return (
              <div
                key={c.id}
                className="course-card"
                id={`course-${c.code}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: '100%',
                }}
              >
                <div>
                  {/* Top Bar: Code + Category + Status */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 6 }}>
                    <span
                      style={{
                        fontFamily: 'Space Grotesk, sans-serif',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {c.code}
                    </span>

                    <span className={`status-chip ${statusConfig.chipCls}`}>
                      <StatusIcon size={11} strokeWidth={2.5} />
                      {statusConfig.label}
                    </span>
                  </div>

                  {/* Title */}
                  <h3
                    className="course-card-title"
                    style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: 8, lineHeight: 1.35 }}
                  >
                    {c.title}
                  </h3>

                  {/* Description */}
                  <p
                    style={{
                      fontSize: '0.74rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.45,
                      marginBottom: 12,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {c.description}
                  </p>
                </div>

                <div>
                  {/* Metadata: Category & Study Hours */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 10px',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: 6,
                      fontSize: '0.7rem',
                      color: 'var(--text-muted)',
                      marginBottom: 10,
                    }}
                  >
                    <span>{c.category}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)' }}>
                      <Clock size={11} /> {c.estimatedHours}h
                    </span>
                  </div>

                  {/* Prerequisites or Unmet warning */}
                  {c.status === 'locked' && c.unmetPrerequisites?.length > 0 && (
                    <div
                      style={{
                        fontSize: '0.68rem',
                        color: '#F5A623',
                        background: 'rgba(245,166,35,0.08)',
                        padding: '6px 8px',
                        borderRadius: 6,
                        marginBottom: 10,
                        lineHeight: 1.3,
                      }}
                    >
                      Requires:{' '}
                      <strong style={{ color: '#F5A623' }}>
                        {c.unmetPrerequisites.map((p) => p.code).join(', ')}
                      </strong>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    <button
                      type="button"
                      className="course-action-btn"
                      style={{
                        margin: 0,
                        flex: 1,
                        background: isCompleted ? 'rgba(82,217,164,0.12)' : undefined,
                        borderColor: isCompleted ? 'rgba(82,217,164,0.35)' : undefined,
                        color: isCompleted ? '#52D9A4' : undefined,
                      }}
                      disabled={isUpdating}
                      onClick={() => handleToggleComplete(c.id, !isCompleted)}
                    >
                      {isUpdating ? (
                        'Updating...'
                      ) : isCompleted ? (
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          <RotateCcw size={12} /> Undo
                        </span>
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          <CheckCircle2 size={12} /> Mark Done
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{
                        padding: '6px 10px',
                        fontSize: '0.72rem',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 8,
                      }}
                      title="View position in prerequisite roadmap"
                      onClick={() => onNavigateToRoadmap?.(primaryGoal, c.code)}
                    >
                      <GitBranch size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
