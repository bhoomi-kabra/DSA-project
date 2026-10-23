'use client';

/**
 * RoadmapView.jsx
 *
 * Renders an intelligent, interactive prerequisite course DAG using @xyflow/react.
 * Connected directly to the compiled C++ Graph Algorithm Engine via /api/graph/analyze.
 * Features:
 * - Direct, high-contrast prerequisite arrows flowing from Prerequisite -> Dependent course.
 * - Robust BFS-based "Highlight Prerequisite Ancestors" traversing direct & indirect dependencies.
 * - Visible directional arrowheads (MarkerType.ArrowClosed) with dynamic highlight coloring.
 * - Course Details Drawer with prerequisite breakdown and live progress updating.
 * - Recommended Next Courses tray with rationale tags.
 * - Real-time search, status filtering, category filtering, and weekly study pace adjustment.
 * - Workload vs. Critical-Path metrics with clear serial vs parallel explanations.
 */
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react';
import {
  GitBranch,
  AlertTriangle,
  Clock,
  Layers,
  Sparkles,
  Zap,
  RefreshCw,
  Search,
  Maximize2,
  HelpCircle,
  X,
  Info,
} from 'lucide-react';

import CourseNode from './CourseNode';
import CourseDetailsDrawer from './CourseDetailsDrawer';
import RecommendedCoursesTray from './RecommendedCoursesTray';
import { GOALS, GOAL_SLUG_MAP } from '../data/courseData';

const NODE_TYPES = {
  courseNode: CourseNode,
};

// ── Main Component ─────────────────────────────────────────
export default function RoadmapView({
  goalId,
  onSelectGoal,
  initialSelectedCourseCode = null,
}) {
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  const [loading, setLoading] = useState(false);
  const [updatingProgress, setUpdatingProgress] = useState(false);
  const [error, setError] = useState(null);
  const [cppResult, setCppResult] = useState(null);

  // User controls & filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'ready' | 'completed' | 'locked'
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [weeklyStudyHours, setWeeklyStudyHours] = useState(15);
  const [showLegend, setShowLegend] = useState(false);
  const [highlightNotice, setHighlightNotice] = useState(null);

  // Selection & highlighting
  const [selectedCourseCode, setSelectedCourseCode] = useState(initialSelectedCourseCode);
  const [highlightMode, setHighlightMode] = useState(null); // 'ancestors' | 'descendants' | null

  // Resolve database goal slug from ID
  const targetGoalSlug = goalId ? (GOAL_SLUG_MAP[goalId] || goalId) : null;

  // ── Fetch algorithm results from C++ Engine ──────────────
  const fetchCppRoadmap = useCallback(async (slug, pace = weeklyStudyHours) => {
    if (!slug) {
      setCppResult(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/graph/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: slug,
          operation: 'goal-roadmap',
          weeklyStudyHours: pace,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (data.hasCycle) {
          setError({
            type: 'cycle',
            message: data.error || 'A prerequisite cycle was detected in this curriculum graph.',
            cycleNodes: data.cycleNodes || [],
            blockedNodes: data.blockedNodes || [],
          });
        } else {
          setError({
            type: 'general',
            message: data.error || `Failed to compute roadmap for goal: ${slug}`,
          });
        }
        setCppResult(null);
      } else {
        setCppResult(data);
      }
    } catch (err) {
      console.error('Failed to fetch C++ roadmap:', err);
      setError({
        type: 'network',
        message: err.message || 'Network error communicating with C++ backend.',
      });
      setCppResult(null);
    } finally {
      setLoading(false);
    }
  }, [weeklyStudyHours]);

  useEffect(() => {
    if (targetGoalSlug) {
      fetchCppRoadmap(targetGoalSlug, weeklyStudyHours);
    }
  }, [targetGoalSlug, fetchCppRoadmap, weeklyStudyHours]);

  // Synchronize initialSelectedCourseCode if provided from parent
  useEffect(() => {
    if (initialSelectedCourseCode) {
      setSelectedCourseCode(initialSelectedCourseCode);
    }
  }, [initialSelectedCourseCode]);

  // ── Toggle course completion progress ────────────────────
  const handleToggleComplete = useCallback(
    async (courseId, isCompleted) => {
      setUpdatingProgress(true);
      try {
        const response = await fetch('/api/user/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId,
            isCompleted,
          }),
        });

        if (response.ok) {
          await fetchCppRoadmap(targetGoalSlug, weeklyStudyHours);
        } else {
          const errData = await response.json();
          alert(`Could not update progress: ${errData.error || 'Unknown error'}`);
        }
      } catch (err) {
        console.error('Failed to update progress:', err);
        alert('Network error updating course progress.');
      } finally {
        setUpdatingProgress(false);
      }
    },
    [fetchCppRoadmap, targetGoalSlug, weeklyStudyHours]
  );

  // ── Extract categories for filtering ──────────────────────
  const availableCategories = useMemo(() => {
    if (!cppResult?.learningOrder) return [];
    const set = new Set();
    cppResult.learningOrder.forEach((c) => {
      if (c.category) set.add(c.category);
    });
    return Array.from(set).sort();
  }, [cppResult]);

  // ── Identify Selected Course Object ──────────────────────
  const selectedCourse = useMemo(() => {
    if (!selectedCourseCode || !cppResult?.learningOrder) return null;
    return cppResult.learningOrder.find((c) => c.code === selectedCourseCode) || null;
  }, [selectedCourseCode, cppResult]);

  // ── Extract Raw Edges safely from C++ engine or flow ───────
  const rawEdges = useMemo(() => {
    if (!cppResult) return [];
    if (Array.isArray(cppResult.edges) && cppResult.edges.length > 0) {
      return cppResult.edges;
    }
    if (cppResult.flow && Array.isArray(cppResult.flow.edges)) {
      return cppResult.flow.edges;
    }
    return [];
  }, [cppResult]);

  // ── Compute Ancestors (Prerequisites) & Descendants (Dependents) ──
  const { ancestorCodes, descendantCodes } = useMemo(() => {
    if (!selectedCourseCode || !cppResult?.learningOrder || cppResult.learningOrder.length === 0) {
      return { ancestorCodes: new Set(), descendantCodes: new Set() };
    }

    // Build directed adjacency maps:
    // parentMap: child course code -> array of direct prerequisite course codes (incoming edges u -> v)
    // childMap: parent course code -> array of downstream course codes it unlocks (outgoing edges u -> v)
    const parentMap = new Map();
    const childMap = new Map();

    // 1. Populate from raw directed edges (u = prerequisite -> v = dependent)
    rawEdges.forEach((e) => {
      if (e.fromCode && e.toCode) {
        if (!parentMap.has(e.toCode)) parentMap.set(e.toCode, []);
        if (!parentMap.get(e.toCode).includes(e.fromCode)) {
          parentMap.get(e.toCode).push(e.fromCode);
        }

        if (!childMap.has(e.fromCode)) childMap.set(e.fromCode, []);
        if (!childMap.get(e.fromCode).includes(e.toCode)) {
          childMap.get(e.fromCode).push(e.toCode);
        }
      }
    });

    // 2. Also incorporate direct course metadata from enriched learningOrder as reinforcement
    cppResult.learningOrder.forEach((course) => {
      if (Array.isArray(course.prerequisites)) {
        if (!parentMap.has(course.code)) parentMap.set(course.code, []);
        course.prerequisites.forEach((pr) => {
          if (pr.code && !parentMap.get(course.code).includes(pr.code)) {
            parentMap.get(course.code).push(pr.code);
          }
        });
      }
      if (Array.isArray(course.dependents)) {
        if (!childMap.has(course.code)) childMap.set(course.code, []);
        course.dependents.forEach((dep) => {
          if (dep.code && !childMap.get(course.code).includes(dep.code)) {
            childMap.get(course.code).push(dep.code);
          }
        });
      }
    });

    // BFS Algorithm for Prerequisite Ancestors:
    // Starts at direct prerequisites of selected course, traverses upstream, visits all branches in O(V + E)
    const ancestors = new Set();
    const visitedAncestors = new Set([selectedCourseCode]); // Prevent self-inclusion and cycles
    const queue1 = [...(parentMap.get(selectedCourseCode) || [])];

    for (const p of queue1) {
      visitedAncestors.add(p);
      ancestors.add(p);
    }

    let head1 = 0;
    while (head1 < queue1.length) {
      const curr = queue1[head1++];
      const parents = parentMap.get(curr) || [];
      for (const p of parents) {
        if (!visitedAncestors.has(p)) {
          visitedAncestors.add(p);
          ancestors.add(p);
          queue1.push(p);
        }
      }
    }

    // BFS Algorithm for Unlocked Descendants:
    // Starts at direct children of selected course, traverses downstream in O(V + E)
    const descendants = new Set();
    const visitedDescendants = new Set([selectedCourseCode]);
    const queue2 = [...(childMap.get(selectedCourseCode) || [])];

    for (const c of queue2) {
      visitedDescendants.add(c);
      descendants.add(c);
    }

    let head2 = 0;
    while (head2 < queue2.length) {
      const curr = queue2[head2++];
      const children = childMap.get(curr) || [];
      for (const c of children) {
        if (!visitedDescendants.has(c)) {
          visitedDescendants.add(c);
          descendants.add(c);
          queue2.push(c);
        }
      }
    }

    return { ancestorCodes: ancestors, descendantCodes: descendants };
  }, [selectedCourseCode, rawEdges, cppResult]);

  // ── Build React Flow Nodes & Directed Edges ──────────────
  const { flowNodes, flowEdges } = useMemo(() => {
    if (!cppResult || !cppResult.learningOrder || cppResult.learningOrder.length === 0) {
      return { flowNodes: [], flowEdges: [] };
    }

    const criticalPathSet = new Set(cppResult.criticalPathCodes || []);
    const searchLower = searchQuery.trim().toLowerCase();

    // Group courses by level for clean DAG layered layout
    const levelBuckets = {};
    cppResult.learningOrder.forEach((course) => {
      const lvl = course.level ?? 0;
      if (!levelBuckets[lvl]) levelBuckets[lvl] = [];
      levelBuckets[lvl].push(course);
    });

    const HGAP = 260;
    const VGAP = 130;

    const nodes = [];

    Object.keys(levelBuckets).forEach((lvlStr) => {
      const lvl = parseInt(lvlStr, 10);
      const coursesAtLevel = levelBuckets[lvl];
      const count = coursesAtLevel.length;

      coursesAtLevel.forEach((course, idx) => {
        const x = lvl * HGAP + 50;
        const y = (idx - (count - 1) / 2) * VGAP + 220;

        const isSelected = selectedCourseCode === course.code;
        const isAncestor = highlightMode === 'ancestors' && ancestorCodes.has(course.code);
        const isDescendant = highlightMode === 'descendants' && descendantCodes.has(course.code);

        let highlightRole = null;
        if (isSelected) highlightRole = 'selected';
        else if (isAncestor) highlightRole = 'ancestor';
        else if (isDescendant) highlightRole = 'descendant';

        // Check if node is dimmed based on active filters, search, or highlight mode
        let isDimmed = false;
        if (searchLower) {
          const match =
            course.code.toLowerCase().includes(searchLower) ||
            course.title.toLowerCase().includes(searchLower) ||
            (course.category && course.category.toLowerCase().includes(searchLower));
          if (!match) isDimmed = true;
        }

        if (statusFilter !== 'all') {
          if (statusFilter === 'ready' && course.status !== 'in-progress') isDimmed = true;
          if (statusFilter === 'completed' && course.status !== 'completed') isDimmed = true;
          if (statusFilter === 'locked' && course.status !== 'locked') isDimmed = true;
        }

        if (categoryFilter !== 'all') {
          if (course.category !== categoryFilter) isDimmed = true;
        }

        if (highlightMode === 'ancestors' && !isAncestor && !isSelected) {
          isDimmed = true;
        }
        if (highlightMode === 'descendants' && !isDescendant && !isSelected) {
          isDimmed = true;
        }

        nodes.push({
          id: course.id,
          type: 'courseNode',
          position: { x, y },
          selected: isSelected,
          data: {
            ...course,
            isCritical: criticalPathSet.has(course.code),
            highlightRole,
            isDimmed,
          },
        });
      });
    });

    // ── Generate Directed Edges with Bold Arrowheads ─────────
    const edges = rawEdges.map((e, i) => {
      const fromNode = cppResult.learningOrder.find((n) => n.code === e.fromCode);
      const toNode = cppResult.learningOrder.find((n) => n.code === e.toCode);
      const sourceId = fromNode ? fromNode.id : (e.source || `source-${e.fromCode}`);
      const targetId = toNode ? toNode.id : (e.target || `target-${e.toCode}`);

      const isCriticalEdge =
        criticalPathSet.has(e.fromCode) && criticalPathSet.has(e.toCode);

      // Prerequisite edge in ancestor chain:
      // Starts at an ancestor course (fromCode) and leads to an ancestor course or the selected target course (toCode)
      const isAncestorEdge =
        highlightMode === 'ancestors' &&
        ancestorCodes.has(e.fromCode) &&
        (ancestorCodes.has(e.toCode) || e.toCode === selectedCourseCode);

      // Downstream edge in descendant chain:
      // Starts at selected course or descendant course (fromCode) and leads to a descendant course (toCode)
      const isDescendantEdge =
        highlightMode === 'descendants' &&
        (descendantCodes.has(e.fromCode) || e.fromCode === selectedCourseCode) &&
        descendantCodes.has(e.toCode);

      // Default high-contrast slate edge styling against dark background
      let strokeColor = '#64748B';
      let strokeWidth = 2;
      let animated = false;
      let markerColor = '#64748B';
      let markerSize = 18;
      let zIndex = 2;

      if (isCriticalEdge) {
        strokeColor = '#F5A623';
        strokeWidth = 2.5;
        animated = true;
        markerColor = '#F5A623';
        markerSize = 20;
        zIndex = 3;
      }

      if (highlightMode === 'ancestors') {
        if (isAncestorEdge) {
          strokeColor = '#38BDF8'; // Vivid Cyan for ancestor prerequisite chain
          strokeWidth = 3;
          animated = true;
          markerColor = '#38BDF8';
          markerSize = 22;
          zIndex = 10;
        } else {
          // Dim non-ancestor edges
          strokeColor = 'rgba(255, 255, 255, 0.08)';
          strokeWidth = 1.2;
          animated = false;
          markerColor = 'rgba(255, 255, 255, 0.12)';
          markerSize = 14;
          zIndex = 1;
        }
      } else if (highlightMode === 'descendants') {
        if (isDescendantEdge) {
          strokeColor = '#C084FC'; // Vivid Purple for unlocked descendant chain
          strokeWidth = 3;
          animated = true;
          markerColor = '#C084FC';
          markerSize = 22;
          zIndex = 10;
        } else {
          strokeColor = 'rgba(255, 255, 255, 0.08)';
          strokeWidth = 1.2;
          animated = false;
          markerColor = 'rgba(255, 255, 255, 0.12)';
          markerSize = 14;
          zIndex = 1;
        }
      }

      return {
        id: `edge-${i}-${e.fromCode}-${e.toCode}`,
        source: sourceId,
        target: targetId,
        type: 'smoothstep',
        animated,
        zIndex,
        style: {
          stroke: strokeColor,
          strokeWidth,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: markerColor,
          width: markerSize,
          height: markerSize,
        },
      };
    });

    return { flowNodes: nodes, flowEdges: edges };
  }, [
    cppResult,
    rawEdges,
    selectedCourseCode,
    highlightMode,
    ancestorCodes,
    descendantCodes,
    searchQuery,
    statusFilter,
    categoryFilter,
  ]);

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  useEffect(() => {
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [flowNodes, flowEdges, setNodes, setEdges]);

  // Handle node selection: updates selected course and recalculates highlight chain without stale state
  const onNodeClick = useCallback((event, node) => {
    const code = node.data?.code || null;
    setSelectedCourseCode(code);
    setHighlightNotice(null);
  }, []);

  const handleSelectCourseByCode = useCallback((code) => {
    setSelectedCourseCode(code);
    setHighlightNotice(null);

    if (reactFlowInstance) {
      const node = nodes.find((n) => n.data?.code === code);
      if (node) {
        reactFlowInstance.setCenter(node.position.x + 90, node.position.y + 40, {
          zoom: 1.1,
          duration: 600,
        });
      }
    }
  }, [reactFlowInstance, nodes]);

  // ── Highlight Ancestors Action with Clear User Guidance ───
  const handleToggleHighlightAncestors = useCallback(() => {
    if (!selectedCourseCode) {
      setHighlightNotice('Select a course first to highlight its prerequisite ancestors.');
      return;
    }
    if (ancestorCodes.size === 0) {
      setHighlightNotice(`${selectedCourseCode} is a foundational course with no prior prerequisite ancestors.`);
      setHighlightMode(null);
      return;
    }
    setHighlightNotice(null);
    setHighlightMode((prev) => (prev === 'ancestors' ? null : 'ancestors'));
  }, [selectedCourseCode, ancestorCodes]);

  const handleFitView = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView({ padding: 0.2, duration: 400 });
    }
  }, [reactFlowInstance]);

  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setSelectedCourseCode(null);
    setHighlightMode(null);
    setHighlightNotice(null);
    handleFitView();
  }, [handleFitView]);

  // ── Empty state: No Goal Selected ────────────────────────
  if (!goalId) {
    return (
      <div className="empty-state">
        <div className="empty-icon-ring" aria-hidden="true">
          <GitBranch size={26} strokeWidth={1.4} />
        </div>
        <div className="empty-title">No goal selected</div>
        <p className="empty-desc">
          Pick a career track to compute its prerequisite DAG and critical path with the native C++ Graph Algorithm Engine.
        </p>
        <button
          className="btn btn-outline-accent"
          id="btn-go-select-goal"
          onClick={() => onSelectGoal?.()}
        >
          Select a Goal
        </button>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      {/* ── Mode & Algorithm Status Bar ───────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10,
          padding: '8px 14px',
          background: 'rgba(17, 24, 39, 0.75)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '10px 10px 0 0',
          fontSize: '0.78rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 8px',
              borderRadius: 6,
              background: 'rgba(82,217,164,0.15)',
              color: '#52D9A4',
              fontWeight: 600,
            }}
          >
            <Zap size={13} />
            C++ Graph Engine Active
          </span>

          {cppResult?.diagnostics && (
            <span style={{ color: '#8A99B5', fontSize: '0.72rem' }}>
              ⚡ Computed in {cppResult.diagnostics.executionTimeMs.toFixed(2)}ms &bull;{' '}
              {cppResult.learningOrder?.length || 0} courses &bull;{' '}
              {rawEdges.length} prerequisite dependencies
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ fontSize: '0.72rem', padding: '4px 8px' }}
            title="Re-run C++ Graph Engine"
            onClick={() => fetchCppRoadmap(targetGoalSlug, weeklyStudyHours)}
            disabled={loading}
          >
            <RefreshCw size={12} className={loading ? 'anim-spin' : ''} />
            <span style={{ marginLeft: 4 }}>Recalculate</span>
          </button>
        </div>
      </div>

      {/* ── Controls & Filter Toolbar ─────────────────────── */}
      <div className="graph-toolbar">
        {/* Search & Filters */}
        <div className="toolbar-group">
          {/* Search box */}
          <div className="toolbar-input-wrap">
            <Search size={13} />
            <input
              type="text"
              className="toolbar-input"
              placeholder="Search course or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status filter */}
          <select
            className="toolbar-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            title="Filter by status"
          >
            <option value="all">All Statuses</option>
            <option value="ready">Ready to Study</option>
            <option value="completed">Completed</option>
            <option value="locked">Locked</option>
          </select>

          {/* Category filter */}
          {availableCategories.length > 0 && (
            <select
              className="toolbar-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              title="Filter by category"
            >
              <option value="all">All Categories</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}

          {/* Highlight Ancestors Button on Toolbar */}
          <button
            type="button"
            id="toolbar-btn-highlight-ancestors"
            className={`toolbar-btn ${highlightMode === 'ancestors' ? 'toolbar-btn--active' : ''}`}
            onClick={handleToggleHighlightAncestors}
            title={
              selectedCourseCode
                ? `Toggle prerequisite ancestors for ${selectedCourseCode}`
                : 'Select a course to highlight its prerequisite ancestors'
            }
          >
            <GitBranch size={12} />
            {highlightMode === 'ancestors'
              ? `Ancestors (${ancestorCodes.size})`
              : 'Highlight Ancestors'}
          </button>

          {(searchQuery || statusFilter !== 'all' || categoryFilter !== 'all' || selectedCourseCode || highlightMode) && (
            <button
              type="button"
              className="toolbar-btn"
              onClick={handleResetFilters}
              title="Reset all filters and highlights"
            >
              Reset
            </button>
          )}
        </div>

        {/* Weekly Pace & View Controls */}
        <div className="toolbar-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
            <Clock size={12} />
            <span>Pace:</span>
            <select
              className="toolbar-select"
              value={weeklyStudyHours}
              onChange={(e) => {
                const val = Number(e.target.value);
                setWeeklyStudyHours(val);
                fetchCppRoadmap(targetGoalSlug, val);
              }}
              title="Study hours per week"
            >
              <option value="10">10h / week</option>
              <option value="15">15h / week</option>
              <option value="20">20h / week</option>
              <option value="25">25h / week</option>
            </select>
          </div>

          <button
            type="button"
            className="toolbar-btn"
            onClick={handleFitView}
            title="Fit graph to canvas"
          >
            <Maximize2 size={12} />
            Fit View
          </button>

          <button
            type="button"
            className={`toolbar-btn ${showLegend ? 'toolbar-btn--active' : ''}`}
            onClick={() => setShowLegend((prev) => !prev)}
            title="Toggle graph legend"
          >
            <HelpCircle size={12} />
            Legend
          </button>
        </div>
      </div>

      {/* ── Active Highlighting or Notice Banner ──────────── */}
      {highlightNotice && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 16px',
            background: 'rgba(245, 166, 35, 0.12)',
            borderBottom: '1px solid rgba(245, 166, 35, 0.3)',
            color: '#F5A623',
            fontSize: '0.76rem',
            fontWeight: 500,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Info size={14} />
            <span>{highlightNotice}</span>
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ padding: '2px 6px', color: '#F5A623' }}
            onClick={() => setHighlightNotice(null)}
          >
            <X size={12} />
          </button>
        </div>
      )}

      {highlightMode === 'ancestors' && selectedCourseCode && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 16px',
            background: 'rgba(56, 189, 248, 0.12)',
            borderBottom: '1px solid rgba(56, 189, 248, 0.3)',
            color: '#38BDF8',
            fontSize: '0.76rem',
            fontWeight: 500,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <GitBranch size={14} />
            <span>
              Showing <strong>{ancestorCodes.size}</strong> prerequisite ancestor{ancestorCodes.size === 1 ? '' : 's'} for <strong>{selectedCourseCode}</strong> (connected arrows highlighted in cyan).
            </span>
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ padding: '3px 10px', fontSize: '0.72rem', color: '#38BDF8', border: '1px solid rgba(56, 189, 248, 0.35)', borderRadius: 6 }}
            onClick={() => setHighlightMode(null)}
          >
            Clear Highlights
          </button>
        </div>
      )}

      {/* ── Metrics Strip: Total Workload vs Critical Path ── */}
      {cppResult?.studyTimeEstimates && !error && (
        <div className="graph-metrics-strip">
          <div className="metrics-items-group">
            {/* Total Workload */}
            <div className="metric-pill" title="Total study hours across all courses in this roadmap">
              <Layers size={13} color="var(--accent-2)" />
              <span>
                Total Workload:{' '}
                <strong className="metric-value-strong">
                  {cppResult.studyTimeEstimates.totalStudyHours}h
                </strong>
                <span className="metric-helper-tip">
                  ({cppResult.studyTimeEstimates.serialEstimatedWeeks} wks serial)
                </span>
              </span>
            </div>

            {/* Critical Path Duration */}
            <div
              className="metric-pill"
              title="Minimum calendar time required along the longest prerequisite dependency chain when independent courses can be studied in parallel"
            >
              <Clock size={13} color="#F5A623" />
              <span>
                Critical-Path Duration:{' '}
                <strong className="metric-value-accent">
                  {cppResult.studyTimeEstimates.criticalPathHours}h
                </strong>
                <span className="metric-helper-tip">
                  ({cppResult.studyTimeEstimates.parallelEstimatedWeeks} wks parallel)
                </span>
              </span>
            </div>
          </div>

          {/* Bottleneck Path */}
          {cppResult.criticalPathCodes?.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: '0.72rem',
                color: '#F5A623',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%',
              }}
              title="The sequence of dependent courses that dictates the minimum completion duration"
            >
              <Sparkles size={12} />
              <span>
                <strong>Bottleneck Path:</strong> {cppResult.criticalPathCodes.join(' → ')}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Recommended Next Courses Tray ─────────────────── */}
      {!loading && !error && cppResult?.recommendedNextCourses && (
        <RecommendedCoursesTray
          recommendedCourses={cppResult.recommendedNextCourses}
          onSelectCourse={handleSelectCourseByCode}
        />
      )}

      {/* ── Loading State ─────────────────────────────────── */}
      {loading && (
        <div
          style={{
            height: 440,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            background: '#0B1020',
            color: 'var(--text-secondary)',
            fontSize: '0.85rem',
          }}
        >
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
          <div>Computing DAG topological levels and critical path in C++...</div>
        </div>
      )}

      {/* ── Error State ───────────────────────────────────── */}
      {!loading && error && (
        <div
          style={{
            padding: 24,
            background: error.type === 'cycle' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 166, 35, 0.08)',
            border: error.type === 'cycle' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(245, 166, 35, 0.3)',
            borderRadius: 8,
            margin: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: error.type === 'cycle' ? '#EF4444' : '#F5A623', fontWeight: 600 }}>
            <AlertTriangle size={18} />
            <span>
              {error.type === 'cycle'
                ? 'Curriculum Cycle Detected in Graph'
                : 'C++ Algorithm Engine Notice'}
            </span>
          </div>

          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
            {error.message}
          </p>

          {error.cycleNodes && error.cycleNodes.length > 0 && (
            <div style={{ fontSize: '0.78rem', color: '#EF4444' }}>
              <strong>Cyclic Courses:</strong> {error.cycleNodes.join(', ')}
            </div>
          )}

          <div style={{ marginTop: 8 }}>
            <button
              className="btn btn-outline-accent"
              style={{ fontSize: '0.75rem', padding: '6px 14px' }}
              onClick={() => fetchCppRoadmap(targetGoalSlug, weeklyStudyHours)}
            >
              Retry C++ Graph Calculation
            </button>
          </div>
        </div>
      )}

      {/* ── React Flow Canvas ─────────────────────────────── */}
      {!loading && !error && (
        <div
          ref={reactFlowWrapper}
          style={{ width: '100%', height: 500, position: 'relative', overflow: 'hidden' }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={NODE_TYPES}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onPaneClick={() => {
              setSelectedCourseCode(null);
              setHighlightMode(null);
              setHighlightNotice(null);
            }}
            onInit={setReactFlowInstance}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            proOptions={{ hideAttribution: true }}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={true}
            colorMode="dark"
          >
            <Background color="rgba(255, 255, 255, 0.04)" gap={24} size={1} />
            <Controls
              showInteractive={false}
              style={{
                background: '#141C30',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
              }}
            />
            <MiniMap
              nodeColor={(n) => {
                if (n.data?.highlightRole === 'selected') return '#F5A623';
                if (n.data?.highlightRole === 'ancestor') return '#38BDF8';
                if (n.data?.status === 'completed') return '#52D9A4';
                if (n.data?.status === 'in-progress') return '#8B7CFF';
                return '#374151';
              }}
              style={{
                background: '#0E1425',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
              }}
              maskColor="rgba(11, 16, 32, 0.8)"
            />
          </ReactFlow>

          {/* ── Slide-Over Course Details Drawer ──────────── */}
          {selectedCourse && (
            <CourseDetailsDrawer
              course={selectedCourse}
              updatingProgress={updatingProgress}
              highlightMode={highlightMode}
              ancestorCount={ancestorCodes.size}
              descendantCount={descendantCodes.size}
              onClose={() => {
                setSelectedCourseCode(null);
                setHighlightMode(null);
                setHighlightNotice(null);
              }}
              onToggleComplete={handleToggleComplete}
              onHighlightAncestors={handleToggleHighlightAncestors}
              onHighlightDescendants={() => setHighlightMode((prev) => (prev === 'descendants' ? null : 'descendants'))}
              onClearHighlights={() => {
                setHighlightMode(null);
                setHighlightNotice(null);
              }}
              onSelectCourse={handleSelectCourseByCode}
            />
          )}

          {/* ── Collapsible Graph Legend ──────────────────── */}
          {showLegend && (
            <div className="graph-legend-overlay">
              <div style={{ fontWeight: 600, color: '#F4F6FF', marginBottom: 4 }}>
                Graph Legend
              </div>
              <div className="legend-items-list">
                <div className="legend-item">
                  <div className="legend-dot" style={{ background: '#52D9A4' }} />
                  <span>Done / Completed</span>
                </div>
                <div className="legend-item">
                  <div className="legend-dot" style={{ background: '#8B7CFF' }} />
                  <span>Ready to Study (Prereqs Met)</span>
                </div>
                <div className="legend-item">
                  <div className="legend-dot" style={{ background: '#4B5563' }} />
                  <span>Locked (Prereqs Incomplete)</span>
                </div>
                <div className="legend-item">
                  <div className="legend-dot" style={{ background: '#F5A623' }} />
                  <span>Target Selected Course</span>
                </div>
                <div className="legend-item">
                  <div className="legend-dot" style={{ background: '#38BDF8' }} />
                  <span>Prerequisite Ancestor Course</span>
                </div>
                <div className="legend-item">
                  <div className="legend-dot" style={{ background: '#F5A623' }} />
                  <span>CP: Critical-Path Bottleneck</span>
                </div>
                <div style={{ marginTop: 4, paddingTop: 4, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <strong>A &rarr; B:</strong> Course A is a prerequisite for Course B
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
