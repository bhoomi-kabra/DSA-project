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
    let { userId, courseId, isCompleted } = body;

    if (!courseId || typeof isCompleted !== "boolean") {
      return NextResponse.json(
        { error: "Missing required fields: courseId, isCompleted (boolean)" },
        { status: 400 }
      );
    }

    // Default to first user if userId not provided
    if (!userId) {
      const defaultUser = await prisma.user.findFirst();
      if (!defaultUser) {
        return NextResponse.json(
          { error: "No users found in database." },
          { status: 404 }
        );
      }
      userId = defaultUser.id;
    }

    // Allow courseId to be either a UUID or a course code (e.g., CS101)
    const matchedCourse = await prisma.course.findFirst({
      where: {
        OR: [
          { id: courseId },
          { code: courseId }
        ]
      }
    });

    if (!matchedCourse) {
      return NextResponse.json(
        { error: `Course not found for identifier: ${courseId}` },
        { status: 404 }
      );
    }

    const targetCourseId = matchedCourse.id;

    const updated = await prisma.studentProgress.upsert({
      where: {
        userId_courseId: {
          userId,
          courseId: targetCourseId,
        },
      },
      create: {
        userId,
        courseId: targetCourseId,
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
