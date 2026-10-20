import { prisma } from "@/lib/prisma";

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
}
