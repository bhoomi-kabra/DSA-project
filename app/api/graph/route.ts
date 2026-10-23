import { NextRequest, NextResponse } from "next/server";
import { GraphService } from "@/lib/services/graph-service";

export const dynamic = "force-dynamic";

/**
 * GET /api/graph
 * Query parameters:
 *  - goal: string (slug of the goal to extract subgraph for, e.g. "machine-learning-engineer")
 *  - format: "cpp" | "json" (default: "json")
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const goalSlug = searchParams.get("goal");
    const format = searchParams.get("format");
    const engine = searchParams.get("engine");
    const userId = searchParams.get("userId") || undefined;
    const weeklyHoursParam = searchParams.get("weeklyStudyHours");
    const weeklyStudyHours = weeklyHoursParam ? parseInt(weeklyHoursParam, 10) : undefined;

    // Direct C++ execution via GET parameter
    if (engine === "cpp") {
      const cppResult = await GraphService.executeCppRoadmap({
        goalSlug: goalSlug || undefined,
        userId,
        weeklyStudyHours,
        operation: goalSlug ? "goal-roadmap" : "analyze",
      });
      return NextResponse.json(cppResult);
    }

    if (format === "cpp") {
      const cppData = await GraphService.exportToCppFormat();
      return NextResponse.json(cppData);
    }

    if (goalSlug) {
      const subgraph = await GraphService.getGoalSubgraph(goalSlug);
      return NextResponse.json(subgraph);
    }

    const fullGraph = await GraphService.getFullGraph();
    return NextResponse.json(fullGraph);
  } catch (error: any) {
    console.error("API Error in GET /api/graph:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch graph data" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/graph
 * Body: { goal?: string, userId?: string, operation?: string, weeklyStudyHours?: number }
 * Invokes the C++ Graph Algorithm Engine with database-derived data.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { goal, userId, operation, weeklyStudyHours } = body;

    const result = await GraphService.executeCppRoadmap({
      goalSlug: goal,
      userId,
      operation,
      weeklyStudyHours,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("API Error in POST /api/graph:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to execute C++ graph algorithm" },
      { status: 500 }
    );
  }
}
