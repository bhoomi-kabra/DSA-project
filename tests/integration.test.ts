import { GraphService } from "@/lib/services/graph-service";
import { prisma } from "@/lib/prisma";

async function runIntegrationTests() {
  console.log("==================================================");
  console.log("PathPilot Next.js <-> C++ Graph Engine Integration");
  console.log("==================================================");

  let passed = 0;
  let total = 0;

  async function test(name: string, fn: () => Promise<void>) {
    total++;
    process.stdout.write(`[INTEGRATION TEST ${total}] ${name}... `);
    try {
      await fn();
      passed++;
      console.log("PASSED");
    } catch (err: any) {
      console.log(`FAILED: ${err.message}`);
    }
  }

  try {
    // Test 1: Full Graph Execution via C++
    await test("Full catalogue graph analysis through C++ engine", async () => {
      const result = await GraphService.executeCppRoadmap({
        weeklyStudyHours: 15,
      });

      if (!result.success) throw new Error("C++ engine returned success=false");
      if (result.hasCycle) throw new Error("Unexpected cycle in full graph");
      if (!result.vertexCount || result.vertexCount < 40) throw new Error(`Expected at least 40 vertices, got ${result.vertexCount}`);
      if (!result.edgeCount || result.edgeCount < 50) throw new Error(`Expected at least 50 edges, got ${result.edgeCount}`);
      if (result.learningOrder.length !== result.vertexCount) throw new Error("Topological sort length mismatch");
    });

    // Test 2: Goal Subgraph Extraction for Machine Learning Engineer
    await test("ML goal prerequisite extraction and topological order", async () => {
      const result = await GraphService.executeCppRoadmap({
        goalSlug: "machine-learning-engineer",
        weeklyStudyHours: 15,
      });

      if (!result.success) throw new Error("ML roadmap failed");
      const codes = result.learningOrder.map((c) => c.code);

      // Must include key ML milestones
      const required = ["CS101", "MATH201", "MATH202", "CS301", "CS302", "CS401", "CS405", "CS406"];
      for (const req of required) {
        if (!codes.includes(req)) throw new Error(`Missing expected ML course: ${req}`);
      }

      // Check prerequisite order: CS101 before CS301
      const cs101Idx = codes.indexOf("CS101");
      const cs301Idx = codes.indexOf("CS301");
      const cs302Idx = codes.indexOf("CS302");
      const cs406Idx = codes.indexOf("CS406");
      if (cs101Idx >= cs301Idx) throw new Error("CS101 must precede CS301");
      if (cs301Idx >= cs302Idx) throw new Error("CS301 must precede CS302");
      if (cs302Idx >= cs406Idx) throw new Error("CS302 must precede CS406");

      // Verify critical path
      if (!result.criticalPathCodes || result.criticalPathCodes.length === 0) {
        throw new Error("Critical path codes missing");
      }
    });

    // Test 3: Goal Subgraph Extraction for Full-Stack Developer
    await test("Full-Stack goal prerequisite extraction and critical path", async () => {
      const result = await GraphService.executeCppRoadmap({
        goalSlug: "full-stack-developer",
        weeklyStudyHours: 15,
      });

      if (!result.success) throw new Error("Full-Stack roadmap failed");
      const codes = result.learningOrder.map((c) => c.code);

      const required = ["DEV101", "DEV104", "DEV105", "DEV201", "DEV204", "DEV205", "DEV301", "DEV401"];
      for (const req of required) {
        if (!codes.includes(req)) throw new Error(`Missing expected Full-Stack course: ${req}`);
      }

      const dev101Idx = codes.indexOf("DEV101");
      const dev104Idx = codes.indexOf("DEV104");
      const dev105Idx = codes.indexOf("DEV105");
      const dev401Idx = codes.indexOf("DEV401");

      if (dev101Idx >= dev104Idx) throw new Error("DEV101 must precede DEV104");
      if (dev104Idx >= dev105Idx) throw new Error("DEV104 must precede DEV105");
      if (dev105Idx >= dev401Idx) throw new Error("DEV105 must precede DEV401");
    });

    // Test 4: Goal Subgraph Extraction for DSA Interview Prep
    await test("DSA goal prerequisite extraction and critical path", async () => {
      const result = await GraphService.executeCppRoadmap({
        goalSlug: "dsa-interview-prep",
        weeklyStudyHours: 15,
      });

      if (!result.success) throw new Error("DSA roadmap failed");
      const codes = result.learningOrder.map((c) => c.code);

      const required = ["DSA101", "CS201", "CS202", "DSA301", "CS303", "INT401"];
      for (const req of required) {
        if (!codes.includes(req)) throw new Error(`Missing expected DSA course: ${req}`);
      }

      const dsa101Idx = codes.indexOf("DSA101");
      const cs201Idx = codes.indexOf("CS201");
      const cs202Idx = codes.indexOf("CS202");
      const int401Idx = codes.indexOf("INT401");

      if (dsa101Idx >= cs201Idx) throw new Error("DSA101 must precede CS201");
      if (cs201Idx >= cs202Idx) throw new Error("CS201 must precede CS202");
      if (cs202Idx >= int401Idx) throw new Error("CS202 must precede INT401");
    });

    // Test 5: Student progress integration & recommendations
    await test("Student progress overlay and next recommendations", async () => {
      const demoUser = await prisma.user.findFirst();
      if (!demoUser) throw new Error("Demo user not found");

      const cs101Course = await prisma.course.findUnique({ where: { code: "CS101" } });
      if (cs101Course) {
        await prisma.studentProgress.upsert({
          where: { userId_courseId: { userId: demoUser.id, courseId: cs101Course.id } },
          create: { userId: demoUser.id, courseId: cs101Course.id, isCompleted: true },
          update: { isCompleted: true },
        });
      }

      const result = await GraphService.executeCppRoadmap({
        goalSlug: "machine-learning-engineer",
        userId: demoUser.id,
      });

      const cs101 = result.learningOrder.find((c) => c.code === "CS101");
      const cs301 = result.learningOrder.find((c) => c.code === "CS301");

      if (cs101?.status !== "completed") {
        throw new Error(`Expected CS101 to be 'completed', got '${cs101?.status}'`);
      }
      if (cs301?.status !== "locked") {
        throw new Error(`Expected CS301 to be 'locked', got '${cs301?.status}'`);
      }

      // Check recommendation feature
      if (!result.recommendedNextCourses || result.recommendedNextCourses.length === 0) {
        throw new Error("Missing recommendedNextCourses in result");
      }
    });

    // Test 6: React Flow layout nodes and edges structure
    await test("React Flow node positions and directed edges generation", async () => {
      const result = await GraphService.executeCppRoadmap({
        goalSlug: "full-stack-developer",
      });

      if (!result.flow || !result.flow.nodes || !result.flow.edges) {
        throw new Error("Missing flow layout in result");
      }
      if (result.flow.nodes.length < 10) {
        throw new Error(`Expected at least 10 flow nodes, got ${result.flow.nodes.length}`);
      }
      if (result.flow.edges.length < 10) {
        throw new Error(`Expected at least 10 flow edges, got ${result.flow.edges.length}`);
      }
    });

    // Test 7: Prerequisite Directed Edges Validation
    await test("Prerequisite edges direction and matching endpoints", async () => {
      const result = await GraphService.executeCppRoadmap({
        goalSlug: "machine-learning-engineer",
      });

      if (!result.edges || result.edges.length === 0) {
        throw new Error("Missing edges in C++ roadmap result");
      }

      // Check that every edge points from prerequisite to dependent
      const nodeMap = new Map<string, any>();
      result.learningOrder.forEach((n) => nodeMap.set(n.code, n));

      for (const e of result.edges) {
        const fromNode = nodeMap.get(e.fromCode);
        const toNode = nodeMap.get(e.toCode);
        if (!fromNode) throw new Error(`Edge source not found in learning order: ${e.fromCode}`);
        if (!toNode) throw new Error(`Edge target not found in learning order: ${e.toCode}`);
        // Prerequisite level must be strictly less than dependent level
        if (fromNode.level >= toNode.level) {
          throw new Error(`Edge violates prerequisite DAG level ordering: ${e.fromCode} (L${fromNode.level}) -> ${e.toCode} (L${toNode.level})`);
        }
      }
    });

    // Test 8: Prerequisite Ancestor Traversal (BFS, Multi-branch, & Foundational edge cases)
    await test("Prerequisite Ancestor Traversal BFS correctness", async () => {
      const result = await GraphService.executeCppRoadmap({
        goalSlug: "machine-learning-engineer",
      });

      // Build parent map from directed edges
      const parentMap = new Map<string, string[]>();
      result.edges.forEach((e) => {
        if (!parentMap.has(e.toCode)) parentMap.set(e.toCode, []);
        parentMap.get(e.toCode)!.push(e.fromCode);
      });

      // Helper BFS traversal (identical to UI implementation)
      function getAncestors(targetCode: string): Set<string> {
        const ancestors = new Set<string>();
        const visited = new Set<string>([targetCode]);
        const queue = [...(parentMap.get(targetCode) || [])];

        for (const p of queue) {
          visited.add(p);
          ancestors.add(p);
        }

        let head = 0;
        while (head < queue.length) {
          const curr = queue[head++];
          const parents = parentMap.get(curr) || [];
          for (const p of parents) {
            if (!visited.has(p)) {
              visited.add(p);
              ancestors.add(p);
              queue.push(p);
            }
          }
        }
        return ancestors;
      }

      // Case A: Foundational course has 0 ancestors
      const math201Ancestors = getAncestors("MATH201");
      if (math201Ancestors.size !== 0) {
        throw new Error(`Expected MATH201 to have 0 ancestors, got ${math201Ancestors.size}`);
      }

      // Case B: CS301 (Machine Learning) has multiple prerequisite branches (Python & Math)
      const cs301Ancestors = getAncestors("CS301");
      if (!cs301Ancestors.has("CS101")) throw new Error("CS301 must have CS101 as prerequisite ancestor");
      if (!cs301Ancestors.has("MATH201")) throw new Error("CS301 must have MATH201 as prerequisite ancestor");
      if (cs301Ancestors.has("CS301")) throw new Error("CS301 must not be in its own ancestor set");

      // Case C: Deep Learning (CS302) requires ML (CS301) and all its ancestors
      const cs302Ancestors = getAncestors("CS302");
      if (!cs302Ancestors.has("CS301")) throw new Error("CS302 must have CS301 as ancestor");
      if (!cs302Ancestors.has("CS101")) throw new Error("CS302 must have CS101 as indirect ancestor");
      if (!cs302Ancestors.has("MATH201")) throw new Error("CS302 must have MATH201 as indirect ancestor");

      // Case D: Capstone (CS406) encompasses the full pipeline
      const cs406Ancestors = getAncestors("CS406");
      if (cs406Ancestors.size < 5) {
        throw new Error(`Expected CS406 to have at least 5 ancestors, got ${cs406Ancestors.size}`);
      }
    });
  } finally {
    await prisma.$disconnect();
  }

  console.log("==================================================");
  console.log(`Integration Test Results: ${passed} / ${total} passed`);
  console.log("==================================================");

  if (passed !== total) {
    process.exit(1);
  }
}

runIntegrationTests().catch((e) => {
  console.error("Unhandled integration test error:", e);
  process.exit(1);
});
