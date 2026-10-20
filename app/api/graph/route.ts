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
    console.error("API Error in /api/graph:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch graph data" },
      { status: 500 }
    );
  }
}
