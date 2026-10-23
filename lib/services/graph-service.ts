import { prisma } from "@/lib/prisma";
import { runCppGraphEngine, CppGraphInput } from "./cpp-graph-runner";

export interface GraphNode {
  id: string;
  code: string;
  title: string;
  description: string;
  estimatedHours: number;
  category: string;
}

export interface GraphEdge {
  from: string; // prerequisiteCourseId
  to: string;   // courseId
  fromCode: string;
  toCode: string;
}

export interface AdjacencyList {
  forward: Record<string, string[]>;  // node -> array of courses it unlocks
  reverse: Record<string, string[]>;  // node -> array of prerequisites it requires
  inDegree: Record<string, number>;   // node -> count of prerequisites
}

export class GraphService {
  /**
   * Fetches the complete course DAG (nodes, directed edges, and adjacency lists)
   */
  static async getFullGraph() {
    const [courses, edges] = await Promise.all([
      prisma.course.findMany({
        orderBy: { code: "asc" },
      }),
      prisma.prerequisite.findMany({
        include: {
          prerequisiteCourse: { select: { code: true } },
          course: { select: { code: true } },
        },
      }),
    ]);

    const nodes: GraphNode[] = courses.map((c) => ({
      id: c.id,
      code: c.code,
      title: c.title,
      description: c.description,
      estimatedHours: c.estimatedHours,
      category: c.category,
    }));

    const formattedEdges: GraphEdge[] = edges.map((e) => ({
      from: e.prerequisiteCourseId,
      to: e.courseId,
      fromCode: e.prerequisiteCourse.code,
      toCode: e.course.code,
    }));

    const adjacency: AdjacencyList = {
      forward: {},
      reverse: {},
      inDegree: {},
    };

    for (const node of nodes) {
      adjacency.forward[node.id] = [];
      adjacency.reverse[node.id] = [];
      adjacency.inDegree[node.id] = 0;
    }

    for (const edge of formattedEdges) {
      if (adjacency.forward[edge.from]) {
        adjacency.forward[edge.from].push(edge.to);
      }
      if (adjacency.reverse[edge.to]) {
        adjacency.reverse[edge.to].push(edge.from);
        adjacency.inDegree[edge.to] = (adjacency.inDegree[edge.to] || 0) + 1;
      }
    }

    return {
      nodeCount: nodes.length,
      edgeCount: formattedEdges.length,
      nodes,
      edges: formattedEdges,
      adjacency,
    };
  }

  /**
   * Feature 1: Goal-based prerequisite subgraph extraction (Reverse BFS)
   */
  static async getGoalSubgraph(goalSlug: string) {
    const goal = await prisma.goal.findUnique({
      where: { slug: goalSlug },
      include: {
        courses: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!goal) {
      throw new Error(`Goal '${goalSlug}' not found.`);
    }

    const targetCourseIds = goal.courses.map((gc) => gc.courseId);

    const allEdges = await prisma.prerequisite.findMany({
      include: {
        prerequisiteCourse: { select: { code: true } },
        course: { select: { code: true } },
      },
    });

    const reverseAdj = new Map<string, string[]>();
    for (const edge of allEdges) {
      if (!reverseAdj.has(edge.courseId)) {
        reverseAdj.set(edge.courseId, []);
      }
      reverseAdj.get(edge.courseId)!.push(edge.prerequisiteCourseId);
    }

    // Traverse upstream via Reverse BFS to collect all required ancestor prerequisites
    const reachableCourseIds = new Set<string>();
    const queue: string[] = [...targetCourseIds];

    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (!reachableCourseIds.has(curr)) {
        reachableCourseIds.add(curr);
        const parents = reverseAdj.get(curr) || [];
        for (const p of parents) {
          if (!reachableCourseIds.has(p)) {
            queue.push(p);
          }
        }
      }
    }

    const relevantCourses = await prisma.course.findMany({
      where: { id: { in: Array.from(reachableCourseIds) } },
      orderBy: { code: "asc" },
    });

    const relevantEdges = allEdges
      .filter(
        (e) => reachableCourseIds.has(e.courseId) && reachableCourseIds.has(e.prerequisiteCourseId)
      )
      .map((e) => ({
        from: e.prerequisiteCourseId,
        to: e.courseId,
        fromCode: e.prerequisiteCourse.code,
        toCode: e.course.code,
      }));

    return {
      goal: {
        id: goal.id,
        name: goal.name,
        slug: goal.slug,
        description: goal.description,
      },
      nodeCount: relevantCourses.length,
      edgeCount: relevantEdges.length,
      nodes: relevantCourses,
      edges: relevantEdges,
    };
  }

  /**
   * Feature 2: Knowledge-Aware Roadmap State
   * Determines completed, unlocked, and locked courses based on current prerequisites.
   */
  static async getStudentRoadmapState(userId: string) {
    const [user, progressList, allEdges, allCourses] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: { targetGoal: true },
      }),
      prisma.studentProgress.findMany({
        where: { userId },
      }),
      prisma.prerequisite.findMany(),
      prisma.course.findMany(),
    ]);

    if (!user) {
      throw new Error(`User '${userId}' not found.`);
    }

    const completedSet = new Set<string>();
    for (const p of progressList) {
      if (p.isCompleted) {
        completedSet.add(p.courseId);
      }
    }

    // Map courseId -> list of prerequisiteCourseIds
    const prereqsByCourse = new Map<string, string[]>();
    for (const c of allCourses) {
      prereqsByCourse.set(c.id, []);
    }
    for (const edge of allEdges) {
      prereqsByCourse.get(edge.courseId)?.push(edge.prerequisiteCourseId);
    }

    const unlocked: string[] = [];
    const locked: string[] = [];
    let remainingHours = 0;

    for (const course of allCourses) {
      if (completedSet.has(course.id)) {
        continue;
      }

      remainingHours += course.estimatedHours;
      const prereqs = prereqsByCourse.get(course.id) || [];
      const allPrereqsMet = prereqs.every((pId) => completedSet.has(pId));

      if (allPrereqsMet) {
        unlocked.push(course.id);
      } else {
        locked.push(course.id);
      }
    }

    const estimatedWeeks = Math.ceil(
      remainingHours / (user.weeklyStudyHours || 10)
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        weeklyStudyHours: user.weeklyStudyHours,
        targetGoal: user.targetGoal,
      },
      completedCourseIds: Array.from(completedSet),
      unlockedCourseIds: unlocked,
      lockedCourseIds: locked,
      summary: {
        totalCourses: allCourses.length,
        completedCount: completedSet.size,
        unlockedCount: unlocked.length,
        lockedCount: locked.length,
        remainingStudyHours: remainingHours,
        estimatedWeeksToGoal: estimatedWeeks,
      },
    };
  }

  /**
   * Helper format for C++ Graph Algorithm Engine
   */
  static async exportToCppFormat() {
    const graph = await this.getFullGraph();
    const indexMap = new Map<string, number>();

    graph.nodes.forEach((node, idx) => {
      indexMap.set(node.id, idx);
    });

    const cppEdges = graph.edges.map((e) => ({
      u: indexMap.get(e.from)!,
      v: indexMap.get(e.to)!,
      fromCode: e.fromCode,
      toCode: e.toCode,
    }));

    return {
      V: graph.nodes.length,
      E: cppEdges.length,
      nodeIndexMapping: graph.nodes.map((n, idx) => ({ index: idx, id: n.id, code: n.code })),
      edges: cppEdges,
    };
  }

  /**
   * Feature: Execute C++ Graph Algorithm Engine on Database Data
   * Derives real graph data from PostgreSQL via Prisma, invokes C++ engine,
   * overlays student progress, and formats layout for React Flow visualization.
   */
  static async executeCppRoadmap(options: {
    goalSlug?: string;
    userId?: string;
    weeklyStudyHours?: number;
    operation?: "goal-roadmap" | "topological-sort" | "analyze";
  } = {}) {
    const { goalSlug, userId, operation } = options;

    let targetCourseIds: string[] = [];
    let goalMeta: any = null;

    if (goalSlug) {
      const goal = await prisma.goal.findUnique({
        where: { slug: goalSlug },
        include: {
          courses: {
            include: { course: true },
          },
        },
      });

      if (!goal) {
        throw new Error(`Goal '${goalSlug}' not found.`);
      }

      goalMeta = {
        id: goal.id,
        name: goal.name,
        slug: goal.slug,
        description: goal.description,
      };

      // Target all courses associated with this goal to extract the full track curriculum
      targetCourseIds = goal.courses.map((gc) => gc.courseId);
    }

    // Fetch full graph from database
    const fullGraph = await this.getFullGraph();

    // Map course ID to index in fullGraph
    const idToIndex = new Map<string, number>();
    fullGraph.nodes.forEach((n, idx) => {
      idToIndex.set(n.id, idx);
    });

    const targetIndices = targetCourseIds
      .map((id) => idToIndex.get(id))
      .filter((idx): idx is number => idx !== undefined);

    // Prepare C++ engine input
    const cppInput: CppGraphInput = {
      operation: goalSlug ? (operation || "goal-roadmap") : (operation || "analyze"),
      weeklyStudyHours: options.weeklyStudyHours || 10,
      targetIndices,
      vertices: fullGraph.nodes.map((n, idx) => ({
        index: idx,
        id: n.id,
        code: n.code,
        title: n.title,
        estimatedHours: n.estimatedHours,
        category: n.category,
      })),
      edges: fullGraph.edges.map((e) => ({
        u: idToIndex.get(e.from)!,
        v: idToIndex.get(e.to)!,
        fromCode: e.fromCode,
        toCode: e.toCode,
      })),
    };

    // Execute C++ algorithm engine
    const cppResult = await runCppGraphEngine(cppInput);

    if (cppResult.hasCycle) {
      return {
        success: false,
        hasCycle: true,
        error: cppResult.error || "A prerequisite cycle was detected in the curriculum graph.",
        cycleNodes: cppResult.cycleNodes,
        blockedNodes: cppResult.blockedNodes,
        goal: goalMeta,
        learningOrder: [],
        flow: { nodes: [], edges: [] },
        diagnostics: cppResult.diagnostics,
      };
    }

    // Student Progress overlay
    const completedCourseIds = new Set<string>();
    let effectiveUserId = userId;

    if (!effectiveUserId) {
      // Use demo student Alex Rivera if available
      const firstUser = await prisma.user.findFirst();
      if (firstUser) {
        effectiveUserId = firstUser.id;
      }
    }

    if (effectiveUserId) {
      const progress = await prisma.studentProgress.findMany({
        where: { userId: effectiveUserId, isCompleted: true },
      });
      progress.forEach((p) => completedCourseIds.add(p.courseId));
    }

    // Critical path lookup
    const criticalPathSet = new Set(cppResult.criticalPathCodes || []);

    // Induced subgraph forward and reverse adjacency for prerequisites and dependents
    const subgraphRevAdj = new Map<string, string[]>(); // courseId -> array of prereq courseIds
    const subgraphFwdAdj = new Map<string, string[]>(); // courseId -> array of unlocked courseIds

    for (const e of cppResult.edges) {
      const fromNode = cppResult.learningOrder.find((n) => n.code === e.fromCode);
      const toNode = cppResult.learningOrder.find((n) => n.code === e.toCode);
      if (fromNode && toNode) {
        if (!subgraphRevAdj.has(toNode.id)) subgraphRevAdj.set(toNode.id, []);
        subgraphRevAdj.get(toNode.id)!.push(fromNode.id);

        if (!subgraphFwdAdj.has(fromNode.id)) subgraphFwdAdj.set(fromNode.id, []);
        subgraphFwdAdj.get(fromNode.id)!.push(toNode.id);
      }
    }

    const nodeById = new Map<string, any>();
    cppResult.learningOrder.forEach((n) => nodeById.set(n.id, n));

    // Enrich courses with status, prerequisites, dependents, and recommendations
    const enrichedOrder = cppResult.learningOrder.map((course) => {
      const isCompleted = completedCourseIds.has(course.id);
      const prereqIds = subgraphRevAdj.get(course.id) || [];
      const dependentIds = subgraphFwdAdj.get(course.id) || [];

      const prerequisites = prereqIds.map((pId) => {
        const p = nodeById.get(pId);
        return {
          id: pId,
          code: p?.code || "",
          title: p?.title || "",
          isCompleted: completedCourseIds.has(pId),
        };
      });

      const dependents = dependentIds.map((dId) => {
        const d = nodeById.get(dId);
        return {
          id: dId,
          code: d?.code || "",
          title: d?.title || "",
          isCompleted: completedCourseIds.has(dId),
        };
      });

      const unmetPrerequisites = prerequisites.filter((p) => !p.isCompleted);
      const isCritical = criticalPathSet.has(course.code);

      let status: "completed" | "in-progress" | "locked" = "locked";
      if (isCompleted) {
        status = "completed";
      } else if (unmetPrerequisites.length === 0) {
        status = "in-progress";
      } else {
        status = "locked";
      }

      let recommendationReason = "";
      if (status === "in-progress") {
        if (isCritical) {
          recommendationReason = "★ Critical-Path Priority — Advancing this bottleneck directly shortens the minimum roadmap completion time.";
        } else if (dependents.length >= 2) {
          recommendationReason = `Foundational Anchor — Unlocks ${dependents.length} downstream courses in this track.`;
        } else {
          recommendationReason = "Available Now — All prerequisite requirements have been met.";
        }
      }

      return {
        ...course,
        status,
        isCritical,
        isRecommended: status === "in-progress",
        recommendationReason,
        prerequisites,
        dependents,
        unmetPrerequisites,
      };
    });

    // Compute remaining workload
    let remainingStudyHours = 0;
    enrichedOrder.forEach((c) => {
      if (c.status !== "completed") {
        remainingStudyHours += c.estimatedHours;
      }
    });

    const recommendedNextCourses = enrichedOrder
      .filter((c) => c.status === "in-progress")
      .sort((a, b) => {
        if (a.isCritical && !b.isCritical) return -1;
        if (!a.isCritical && b.isCritical) return 1;
        return (b.dependents?.length || 0) - (a.dependents?.length || 0);
      });

    // Build React Flow nodes and edges layout with computed levels
    const levelCounts: Record<number, number> = {};
    enrichedOrder.forEach((n) => {
      levelCounts[n.level] = (levelCounts[n.level] || 0) + 1;
    });

    const levelOffset: Record<number, number> = {};
    const HGAP = 240;
    const VGAP = 120;

    const flowNodes = enrichedOrder.map((n) => {
      levelOffset[n.level] = levelOffset[n.level] || 0;
      const count = levelCounts[n.level];
      const idx = levelOffset[n.level]++;
      const x = n.level * HGAP + 40;
      const y = (idx - (count - 1) / 2) * VGAP + 180;

      return {
        id: n.id,
        code: n.code,
        title: n.title,
        status: n.status,
        level: n.level,
        isCritical: n.isCritical,
        isRecommended: n.isRecommended,
        recommendationReason: n.recommendationReason,
        estimatedHours: n.estimatedHours,
        category: n.category,
        prerequisites: n.prerequisites,
        dependents: n.dependents,
        unmetPrerequisites: n.unmetPrerequisites,
        position: { x, y },
      };
    });

    const flowEdges = cppResult.edges.map((e, idx) => {
      const fromNode = enrichedOrder.find((n) => n.code === e.fromCode);
      const toNode = enrichedOrder.find((n) => n.code === e.toCode);
      return {
        id: `e-${idx}`,
        source: fromNode ? fromNode.id : `code-${e.fromCode}`,
        target: toNode ? toNode.id : `code-${e.toCode}`,
        fromCode: e.fromCode,
        toCode: e.toCode,
      };
    });

    return {
      success: true,
      algorithmEngine: "PathPilot C++ Native Engine v1.0",
      goal: goalMeta,
      hasCycle: false,
      vertexCount: cppResult.vertexCount,
      edgeCount: cppResult.edgeCount,
      learningOrder: enrichedOrder,
      edges: cppResult.edges,
      criticalPath: cppResult.criticalPath,
      criticalPathCodes: cppResult.criticalPathCodes,
      studyTimeEstimates: {
        ...cppResult.studyTimeEstimates,
        remainingStudyHours,
        remainingWeeks: Math.ceil(remainingStudyHours / (options.weeklyStudyHours || 10)),
      },
      recommendedNextCourses,
      flow: {
        nodes: flowNodes,
        edges: flowEdges,
      },
      diagnostics: cppResult.diagnostics,
    };
  }
}

