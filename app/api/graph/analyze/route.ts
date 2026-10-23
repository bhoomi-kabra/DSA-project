import { NextRequest, NextResponse } from "next/server";
import { GraphService } from "@/lib/services/graph-service";

export const dynamic = "force-dynamic";

/**
 * POST /api/graph/analyze
 * Body: {
 *   goal?: string,
 *   userId?: string,
 *   operation?: "goal-roadmap" | "topological-sort" | "analyze",
 *   weeklyStudyHours?: number
 * }
 * Dedicated endpoint for executing the C++ Graph Algorithm Engine.
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
    console.error("API Error in POST /api/graph/analyze:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to execute C++ graph algorithm",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/graph/analyze?goal=...&userId=...
 * Convenience GET endpoint for C++ execution.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const goalSlug = searchParams.get("goal") || undefined;
    const userId = searchParams.get("userId") || undefined;
    const weeklyHoursParam = searchParams.get("weeklyStudyHours");
    const weeklyStudyHours = weeklyHoursParam ? parseInt(weeklyHoursParam, 10) : undefined;
    const operation = (searchParams.get("operation") as any) || (goalSlug ? "goal-roadmap" : "analyze");

    const result = await GraphService.executeCppRoadmap({
      goalSlug,
      userId,
      operation,
      weeklyStudyHours,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("API Error in GET /api/graph/analyze:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to execute C++ graph algorithm",
      },
      { status: 500 }
    );
  }
}
