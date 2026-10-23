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
