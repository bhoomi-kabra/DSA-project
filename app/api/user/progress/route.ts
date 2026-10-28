import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GraphService } from "@/lib/services/graph-service";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

function computeStreak(dates: Date[]): number {
  if (!dates || dates.length === 0) return 0;
  const daySet = new Set(
    dates.map((d) => new Date(d).toISOString().slice(0, 10))
  );
  let streak = 0;
  const cursor = new Date();

  const todayStr = cursor.toISOString().slice(0, 10);
  if (!daySet.has(todayStr)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (true) {
    const dateStr = cursor.toISOString().slice(0, 10);
    if (daySet.has(dateStr)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * GET /api/user/progress
 * Returns student's knowledge-aware state (completed, unlocked, locked)
 * and real computed activity stats (hours logged, streak, remaining).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionUser = await getSessionUser();
    let userId = sessionUser?.id || searchParams.get("userId");

    if (!userId) {
      const defaultUser = await prisma.user.findFirst();
      if (!defaultUser) {
        return NextResponse.json(
          { error: "No users found in database. Please run seed script first." },
          { status: 404 }
        );
      }
      userId = defaultUser.id;
    }

    const roadmap = await GraphService.getStudentRoadmapState(userId);

    // Compute real study logs and streak from DB (P0-3)
    const logs = await prisma.studyLog.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    });

    const progressRecords = await prisma.studentProgress.findMany({
      where: { userId, isCompleted: true },
      include: { course: true },
    });

    const loggedHours = logs.reduce((sum, l) => sum + l.hours, 0);
    const completedCourseHours = progressRecords.reduce(
      (sum, p) => sum + (p.course?.estimatedHours || p.hoursSpent || 0),
      0
    );
    const totalHoursLogged = Math.max(loggedHours, completedCourseHours);

    const activityDates: Date[] = [
      ...logs.map((l) => l.date),
      ...progressRecords
        .map((p) => p.completedAt || p.updatedAt)
        .filter(Boolean) as Date[],
    ];

    const currentStreak = computeStreak(activityDates);

    return NextResponse.json({
      ...roadmap,
      stats: {
        coursesCompleted: roadmap.completedCount,
        coursesRemaining: Math.max(0, roadmap.totalCourses - roadmap.completedCount),
        hoursLogged: Math.round(totalHoursLogged),
        currentStreak,
      },
    });
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
 * Body: { userId?: string, courseId: string, isCompleted: boolean }
 * Updates student progress in database and recalculates roadmap.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { userId, courseId, isCompleted } = body;

    const sessionUser = await getSessionUser();
    const effectiveUserId = sessionUser?.id || userId || (await prisma.user.findFirst())?.id;

    if (!effectiveUserId) {
      return NextResponse.json({ error: "User session required." }, { status: 401 });
    }

    if (!courseId || typeof isCompleted !== "boolean") {
      return NextResponse.json(
        { error: "Missing required fields: courseId, isCompleted (boolean)" },
        { status: 400 }
      );
    }

    // Allow courseId to be either a UUID or a course code (e.g. CS101)
    const matchedCourse = await prisma.course.findFirst({
      where: {
        OR: [{ id: courseId }, { code: courseId }],
      },
    });

    if (!matchedCourse) {
      return NextResponse.json(
        { error: `Course not found for identifier: ${courseId}` },
        { status: 404 }
      );
    }

    const targetCourseId = matchedCourse.id;
    const status = isCompleted ? "COMPLETED" : "NOT_STARTED";
    const completedAt = isCompleted ? new Date() : null;

    const updated = await prisma.studentProgress.upsert({
      where: {
        userId_courseId: {
          userId: effectiveUserId,
          courseId: targetCourseId,
        },
      },
      create: {
        userId: effectiveUserId,
        courseId: targetCourseId,
        isCompleted,
        status,
        completedAt,
        hoursSpent: isCompleted ? matchedCourse.estimatedHours : 0,
      },
      update: {
        isCompleted,
        status,
        completedAt,
        hoursSpent: isCompleted ? matchedCourse.estimatedHours : 0,
      },
      include: {
        course: { select: { code: true, title: true, estimatedHours: true } },
      },
    });

    // Record study log entry if course completed
    if (isCompleted) {
      await prisma.studyLog.create({
        data: {
          userId: effectiveUserId,
          courseId: targetCourseId,
          hours: matchedCourse.estimatedHours,
          date: new Date(),
        },
      });
    }

    // Recompute roadmap state after update to show newly unlocked courses
    const newRoadmapState = await GraphService.getStudentRoadmapState(effectiveUserId);

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
