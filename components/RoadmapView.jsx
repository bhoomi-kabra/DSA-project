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
  Activity,
  Cpu,
  ZoomIn,
  ZoomOut,
  Calendar,
} from 'lucide-react';

import CourseNode from './CourseNode';
import CourseDetailsDrawer from './CourseDetailsDrawer';
import RecommendedCoursesTray from './RecommendedCoursesTray';
import AlgorithmVisualizerModal from './AlgorithmVisualizerModal';
import CognitiveFlowModal from './CognitiveFlowModal';
import { GOALS, GOAL_SLUG_MAP } from '../data/courseData';
import dagre from '@dagrejs/dagre';

const NODE_TYPES = {
  courseNode: CourseNode,
};

const DAGRE_NODE_WIDTH = 240;
const DAGRE_NODE_HEIGHT = 92;

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

  // Interactive Algorithm Inspector & Cognitive Capacity Max-Flow States
  const [showAlgoInspector, setShowAlgoInspector] = useState(false);
  const [showCapacityPlanner, setShowCapacityPlanner] = useState(false);
  const [activeStep, setActiveStep] = useState(null);

  // Resolve database goal slug from ID
  const targetGoalSlug = goalId ? (GOAL_SLUG_MAP[goalId] || goalId) : null;

  // ── Fetch algorithm results from C++ Engine ──────────────
  const fetchCppRoadmap = useCallback(async (slug, pace = weeklyStudyHours, isSilent = false) => {
    if (!slug) {
      setCppResult(null);
      setError(null);
      return;
    }

    if (!isSilent) {
      setLoading(true);
    }
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
      if (!isSilent) {
        setLoading(false);
      }
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

  // ── Compute Stable Graph Layout via Dagre ─────────────────
  // Uses balanced Sugiyama layered DAG layout without artificial rank inflation
  const layoutPositions = useMemo(() => {
    if (!cppResult?.learningOrder || cppResult.learningOrder.length === 0) {
      return new Map();
    }

    const g = new dagre.graphlib.Graph();
    g.setGraph({
      rankdir: 'LR',
      nodesep: 40,  // Clean vertical clearance
      ranksep: 110, // P0-2 standard spacing between prerequisite ranks
      edgesep: 25,
      marginx: 40,
      marginy: 40,
    });
    g.setDefaultEdgeLabel(() => ({}));

    // Register all courses as nodes with bounding box
    cppResult.learningOrder.forEach((course) => {
      g.setNode(course.id, {
        width: DAGRE_NODE_WIDTH,
        height: DAGRE_NODE_HEIGHT,
      });
    });

    // Register directed prerequisite edges with minlen = 1 (clean topological tiers)
    rawEdges.forEach((e) => {
      const fromNode = cppResult.learningOrder.find((n) => n.code === e.fromCode);
      const toNode = cppResult.learningOrder.find((n) => n.code === e.toCode);
      if (fromNode && toNode) {
        g.setEdge(fromNode.id, toNode.id, { minlen: 1 });
      }
    });

    dagre.layout(g);

    const posMap = new Map();
    cppResult.learningOrder.forEach((course) => {
      const dagreNode = g.node(course.id);
      if (dagreNode) {
        posMap.set(course.id, {
          x: Math.round(dagreNode.x - DAGRE_NODE_WIDTH / 2),
          y: Math.round(dagreNode.y - DAGRE_NODE_HEIGHT / 2),
        });
      } else {
        posMap.set(course.id, { x: 0, y: 0 });
      }
    });

    return posMap;
  }, [cppResult?.learningOrder, rawEdges]);

  // ── Build React Flow Nodes & Directed Edges ──────────────
  const flowNodes = useMemo(() => {
    if (!cppResult?.learningOrder || cppResult.learningOrder.length === 0) {
      return [];
    }

    const criticalPathSet = new Set(cppResult.criticalPathCodes || []);
    const searchLower = searchQuery.trim().toLowerCase();

    return cppResult.learningOrder.map((course) => {
      const isSelected = selectedCourseCode === course.code;
      const isAncestor = highlightMode === 'ancestors' && ancestorCodes.has(course.code);
      const isDescendant = highlightMode === 'descendants' && descendantCodes.has(course.code);

      let highlightRole = null;
      if (isSelected) highlightRole = 'selected';
      else if (isAncestor) highlightRole = 'ancestor';
      else if (isDescendant) highlightRole = 'descendant';

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

      // Live Step Highlight during Algorithm Inspector playback
      let isAlgoActive = false;
      let isAlgoTarget = false;
      let isAlgoQueued = false;
      if (activeStep) {
        if (activeStep.activeNodeCode === course.code) {
          isAlgoActive = true;
          highlightRole = 'selected';
          isDimmed = false;
        } else if (activeStep.targetNodeCode === course.code) {
          isAlgoTarget = true;
          highlightRole = 'descendant';
          isDimmed = false;
        } else if (activeStep.queueState?.includes(course.code)) {
          isAlgoQueued = true;
          highlightRole = 'ancestor';
          isDimmed = false;
        }
      }

      const pos = layoutPositions.get(course.id) || { x: 0, y: 0 };

      return {
        id: course.id,
        type: 'courseNode',
        position: pos,
        selected: isSelected || isAlgoActive,
        data: {
          ...course,
          isCritical: criticalPathSet.has(course.code),
          highlightRole,
          isDimmed,
          isAlgoActive,
          isAlgoTarget,
          isAlgoQueued,
        },
      };
    });
  }, [
    cppResult,
    layoutPositions,
    selectedCourseCode,
    highlightMode,
    ancestorCodes,
    descendantCodes,
    searchQuery,
    statusFilter,
    categoryFilter,
    activeStep,
  ]);

  // ── Generate Directed Edges with Bold Arrowheads and Clean Routing ───
  const flowEdges = useMemo(() => {
    if (!cppResult?.learningOrder || cppResult.learningOrder.length === 0) {
      return [];
    }

    const criticalPathSet = new Set(cppResult.criticalPathCodes || []);

    return rawEdges.map((e, i) => {
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

      // Default high-contrast edge styling respecting light & dark theme
      let strokeColor = 'var(--roadmap-edge, #94A3B8)';
      let strokeWidth = 1.5;
      let animated = false;
      let markerColor = 'var(--roadmap-edge-arrow, #64748B)';
      let markerSize = 16;
      let zIndex = 2;

      if (isCriticalEdge) {
        strokeColor = 'var(--roadmap-edge-critical, #5B5BD6)';
        strokeWidth = 2.5;
        animated = true;
        markerColor = 'var(--roadmap-edge-critical, #5B5BD6)';
        markerSize = 18;
        zIndex = 5;
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
        sourceHandle: 'out',
        targetHandle: 'in',
        type: 'smoothstep',
        pathOptions: {
          borderRadius: 16,
          offset: 20,
        },
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
  }, [
    cppResult,
    rawEdges,
    selectedCourseCode,
    highlightMode,
    ancestorCodes,
    descendantCodes,
  ]);

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  useEffect(() => {
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [flowNodes, flowEdges, setNodes, setEdges]);

  const lastFittedGoalRef = useRef(null);

  // Auto-fit viewport only when a new goal/roadmap is loaded, not on every state change
  useEffect(() => {
    if (reactFlowInstance && layoutPositions.size > 0) {
      if (lastFittedGoalRef.current !== targetGoalSlug) {
        lastFittedGoalRef.current = targetGoalSlug;
        const timer = setTimeout(() => {
          reactFlowInstance.fitView({ padding: 0.16, minZoom: 0.65, maxZoom: 1.05, duration: 400 });
        }, 80);
        return () => clearTimeout(timer);
      }
    }
  }, [reactFlowInstance, targetGoalSlug, layoutPositions]);

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
        reactFlowInstance.setCenter(node.position.x + 105, node.position.y + 44, {
          zoom: Math.max(0.9, reactFlowInstance.getZoom()),
          duration: 500,
        });
      }
    }
  }, [reactFlowInstance, nodes]);

  const handleFitView = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView({ padding: 0.16, minZoom: 0.65, maxZoom: 1.05, duration: 350 });
    }
  }, [reactFlowInstance]);

  const handleZoomIn = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.zoomIn({ duration: 250 });
    }
  }, [reactFlowInstance]);

  const handleZoomOut = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.zoomOut({ duration: 250 });
    }
  }, [reactFlowInstance]);

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

  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setSelectedCourseCode(null);
    setHighlightMode(null);
    setHighlightNotice(null);
    setNodes(flowNodes);
    handleFitView();
  }, [handleFitView, flowNodes, setNodes]);

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

  // ── Summary Bar Metrics (P0-2) ─────────────────────────────
  const summaryMetrics = useMemo(() => {
    if (!cppResult?.learningOrder || cppResult.learningOrder.length === 0) {
      return null;
    }
    const courses = cppResult.learningOrder;
    const totalHours = courses.reduce((acc, c) => acc + (c.estimatedHours || 0), 0);
    const completedCourses = courses.filter((c) => c.status === 'completed');
    const completedHours = completedCourses.reduce((acc, c) => acc + (c.estimatedHours || 0), 0);
    const remainingHours = Math.max(0, totalHours - completedHours);
    const criticalHours = cppResult.criticalPathHours || 0;
    const pace = weeklyStudyHours || 10;
    const weeks = pace > 0 ? Math.ceil(remainingHours / pace) : 0;
    const finishDate = new Date();
    finishDate.setDate(finishDate.getDate() + weeks * 7);
    const finishDateStr = finishDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return {
      totalHours,
      completedHours,
      remainingHours,
      criticalHours,
      finishDateStr,
      weeks,
    };
  }, [cppResult, weeklyStudyHours]);

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      {/* ── Summary Bar Above Graph (P0-2) ─────────────────── */}
      {summaryMetrics && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            padding: '12px 18px',
            marginBottom: 10,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            fontSize: '0.82rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={15} style={{ color: 'var(--accent)' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Total:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{summaryMetrics.totalHours}h</strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: 'var(--success)', fontWeight: 700 }}>✓</span>
              <span style={{ color: 'var(--text-secondary)' }}>Completed:</span>
              <strong style={{ color: 'var(--success)' }}>{summaryMetrics.completedHours}h</strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Remaining:</span>
              <strong style={{ color: 'var(--primary)' }}>{summaryMetrics.remainingHours}h</strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Zap size={14} style={{ color: 'var(--accent)' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Critical Path:</span>
              <strong style={{ color: 'var(--accent)' }}>{summaryMetrics.criticalHours}h</strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={14} style={{ color: 'var(--text-secondary)' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Est. Finish ({weeklyStudyHours || 10}h/wk):</span>
            <strong style={{ color: 'var(--text-primary)' }}>{summaryMetrics.finishDateStr} ({summaryMetrics.weeks} wks)</strong>
          </div>
        </div>
      )}

      {/* ── Single Unified Streamlined Toolbar ──────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10,
          padding: '10px 16px',
          background: 'var(--roadmap-toolbar-bg)',
          border: '1px solid var(--border)',
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
        }}
      >
        {/* Left: Search & Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div className="toolbar-input-wrap" style={{ minWidth: 200 }}>
            <Search size={13} />
            <input
              type="text"
              className="toolbar-input"
              placeholder="Search course title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="toolbar-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            title="Filter by status"
          >
            <option value="all">All Courses</option>
            <option value="ready">Ready to Start</option>
            <option value="completed">Completed</option>
            <option value="locked">Locked</option>
          </select>

          {selectedCourseCode && (
            <button
              type="button"
              className={`toolbar-btn ${highlightMode === 'ancestors' ? 'toolbar-btn--active' : ''}`}
              onClick={handleToggleHighlightAncestors}
              title={`Highlight prerequisites needed for ${selectedCourseCode}`}
            >
              <GitBranch size={12} />
              {highlightMode === 'ancestors' ? 'Prereqs Active' : 'Show Prereqs'}
            </button>
          )}

          {(searchQuery || statusFilter !== 'all' || selectedCourseCode || highlightMode) && (
            <button
              type="button"
              className="toolbar-btn"
              onClick={handleResetFilters}
              title="Reset search and filters"
              style={{ fontSize: '0.72rem', padding: '4px 8px' }}
            >
              Reset
            </button>
          )}
        </div>

        {/* Right: DSA Interactive Tools & Zoom Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Feature 1: Algorithm Visualizer */}
          <button
            type="button"
            id="toolbar-btn-algo-inspector"
            className="btn"
            style={{
              background: 'rgba(139, 124, 255, 0.18)',
              color: '#C084FC',
              border: '1px solid rgba(139, 124, 255, 0.4)',
              fontSize: '0.78rem',
              fontWeight: 600,
              padding: '6px 12px',
              borderRadius: 8,
              gap: 6,
            }}
            onClick={() => setShowAlgoInspector(true)}
            title="Watch how courses get unlocked step-by-step using Kahn's Algorithm"
          >
            <Cpu size={14} />
            <span>How Courses Unlock (Algorithm)</span>
          </button>

          {/* Feature 2: Cognitive Capacity Planner */}
          <button
            type="button"
            id="toolbar-btn-max-flow"
            className="btn"
            style={{
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38BDF8',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              fontSize: '0.78rem',
              fontWeight: 600,
              padding: '6px 12px',
              borderRadius: 8,
              gap: 6,
            }}
            onClick={() => setShowCapacityPlanner(true)}
            title="Calculate how many courses you can balance this semester without burnout"
          >
            <Activity size={14} />
            <span>Study Hours Planner</span>
          </button>

          {/* Zoom Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'rgba(0,0,0,0.25)', borderRadius: 8, padding: 2 }}>
            <button
              type="button"
              className="toolbar-btn"
              onClick={handleZoomIn}
              title="Zoom In (+)"
              style={{ padding: '5px 8px' }}
            >
              <ZoomIn size={13} />
            </button>
            <button
              type="button"
              className="toolbar-btn"
              onClick={handleZoomOut}
              title="Zoom Out (-)"
              style={{ padding: '5px 8px' }}
            >
              <ZoomOut size={13} />
            </button>
            <button
              type="button"
              className="toolbar-btn"
              onClick={handleFitView}
              title="Fit map to screen"
              style={{ padding: '5px 9px', fontSize: '0.74rem' }}
            >
              <Maximize2 size={12} />
              Fit View
            </button>
          </div>

          <button
            type="button"
            className={`toolbar-btn ${showLegend ? 'toolbar-btn--active' : ''}`}
            onClick={() => setShowLegend((prev) => !prev)}
            title="Toggle legend"
            style={{ padding: '5px 8px' }}
          >
            <HelpCircle size={13} />
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
            padding: '7px 16px',
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
          style={{
            width: '100%',
            height: 'calc(100vh - 260px)',
            minHeight: 560,
            position: 'relative',
            overflow: 'hidden',
            background: 'var(--roadmap-canvas-bg)',
            border: '1px solid var(--border)',
            borderTop: 'none',
            borderBottomLeftRadius: 10,
            borderBottomRightRadius: 10,
          }}
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
            fitViewOptions={{ padding: 0.2, minZoom: 0.3, maxZoom: 1.5 }}
            proOptions={{ hideAttribution: true }}
            nodesDraggable={true}
            nodesConnectable={false}
            elementsSelectable={true}
            minZoom={0.3}
            maxZoom={1.5}
            zoomOnScroll={true}
            zoomOnPinch={true}
            panOnScroll={false}
            colorMode={typeof document !== 'undefined' && document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'}
          >
            <Background color="var(--roadmap-grid-dot, rgba(255, 255, 255, 0.04))" gap={24} size={1} />
            <Controls
              showInteractive={true}
              style={{
                background: 'var(--roadmap-controls-bg, #141C30)',
                border: '1px solid var(--border, rgba(255,255,255,0.08))',
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
                background: 'var(--roadmap-minimap-bg, #0E1425)',
                border: '1px solid var(--border, rgba(255,255,255,0.08))',
                borderRadius: 8,
              }}
              maskColor="var(--roadmap-mask, rgba(11, 16, 32, 0.8))"
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

      {/* ── Student Friendly Bottom Helper Strip ── */}
      {!loading && !error && cppResult && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            padding: '9px 16px',
            background: 'rgba(15, 23, 42, 0.95)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            fontSize: '0.8rem',
            color: '#CBD5E1',
          }}
        >
          {cppResult.recommendedNextCourses?.[0] ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  background: 'rgba(82, 217, 164, 0.15)',
                  color: '#52D9A4',
                  fontWeight: 600,
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: 6,
                }}
              >
                💡 Ready to Start Now
              </span>
              <span>
                <strong>{cppResult.recommendedNextCourses[0].title}</strong> ({cppResult.recommendedNextCourses[0].estimatedHours}h)
              </span>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ fontSize: '0.72rem', padding: '2px 8px', color: '#8B7CFF' }}
                onClick={() => handleSelectCourseByCode(cppResult.recommendedNextCourses[0].code)}
              >
                View Syllabus &rarr;
              </button>
            </div>
          ) : (
            <span style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.6)' }}>
              💡 Click any course card to inspect its syllabus, duration, and prerequisites.
            </span>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.74rem', color: 'rgba(255, 255, 255, 0.5)' }}>
            <span>Total: <strong style={{ color: '#E2E8F0' }}>{cppResult.studyTimeEstimates?.totalStudyHours || 0}h</strong></span>
            <span>&bull;</span>
            <span>{cppResult.learningOrder?.length || 0} courses</span>
            <span>&bull;</span>
            <span style={{ color: '#52D9A4' }}>⚡ C++ Engine: {cppResult.diagnostics?.executionTimeMs?.toFixed(2) || '0.00'}ms</span>
          </div>
        </div>
      )}

      {/* ── Feature 1: Algorithm Inspector Modal (Always Mounted) ──────── */}
      <AlgorithmVisualizerModal
        isOpen={showAlgoInspector}
        onClose={() => {
          setShowAlgoInspector(false);
          setActiveStep(null);
        }}
        steps={cppResult?.steps || []}
        goalTitle={targetGoalSlug ? (GOAL_SLUG_MAP[goalId] || targetGoalSlug) : 'Curriculum Track'}
        onStepChange={(step) => setActiveStep(step)}
      />

      {/* ── Feature 2: Student Study Hours & Burnout Planner (Always Mounted) ── */}
      <CognitiveFlowModal
        isOpen={showCapacityPlanner}
        onClose={() => setShowCapacityPlanner(false)}
        maxFlowData={cppResult?.maxFlow}
        currentWeeklyHours={weeklyStudyHours}
        onPaceChange={(newHours) => {
          setWeeklyStudyHours(newHours);
          fetchCppRoadmap(targetGoalSlug, newHours, true); // silent = true so window never minimizes!
        }}
        goalTitle={targetGoalSlug ? (GOAL_SLUG_MAP[goalId] || targetGoalSlug) : 'Curriculum Track'}
      />
    </div>
  );
}
