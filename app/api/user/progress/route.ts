import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GraphService } from "@/lib/services/graph-service";

export const dynamic = "force-dynamic";

/**
 * GET /api/user/progress?userId=...
 * Returns student's knowledge-aware state (completed, unlocked, locked).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      const defaultUser = await prisma.user.findFirst();
      if (!defaultUser) {
        return NextResponse.json(
          { error: "No users found in database. Please run seed script first." },
          { status: 404 }
        );
      }
      const roadmap = await GraphService.getStudentRoadmapState(defaultUser.id);
      return NextResponse.json(roadmap);
    }

    const roadmap = await GraphService.getStudentRoadmapState(userId);
    return NextResponse.json(roadmap);
  } catch (error: any) {
    console.error("API Error in GET /api/user/progress:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch student progress" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/progress
 * Body: { userId: string, courseId: string, isCompleted: boolean }
 * Updates student progress and recalculates roadmap.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, courseId, isCompleted } = body;

    if (!userId || !courseId || typeof isCompleted !== "boolean") {
      return NextResponse.json(
        { error: "Missing required fields: userId, courseId, isCompleted (boolean)" },
        { status: 400 }
      );
    }

    const updated = await prisma.studentProgress.upsert({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      create: {
        userId,
        courseId,
        isCompleted,
      },
      update: {
        isCompleted,
      },
      include: {
        course: { select: { code: true, title: true } },
      },
    });

    // Recompute roadmap state after update to show newly unlocked courses
    const newRoadmapState = await GraphService.getStudentRoadmapState(userId);

    return NextResponse.json({
      message: `Progress updated for ${updated.course.code}: completed = ${isCompleted}`,
      updatedProgress: updated,
      newRoadmapState,
    });
  } catch (error: any) {
    console.error("API Error in POST /api/user/progress:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update progress" },
      { status: 500 }
    );
  }
}
