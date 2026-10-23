import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/courses
 * Returns the entire course catalogue from the database with categories,
 * goals, prerequisite relationships, and student completion status.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const goalSlug = searchParams.get("goal");
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    // Get current student
    const defaultUser = await prisma.user.findFirst();
    const completedSet = new Set<string>();

    if (defaultUser) {
      const progress = await prisma.studentProgress.findMany({
        where: { userId: defaultUser.id, isCompleted: true },
        select: { courseId: true },
      });
      progress.forEach((p) => completedSet.add(p.courseId));
    }

    const courses = await prisma.course.findMany({
      include: {
        goals: {
          include: {
            goal: { select: { id: true, name: true, slug: true } },
          },
        },
        prerequisites: {
          include: {
            prerequisiteCourse: { select: { id: true, code: true, title: true } },
          },
        },
        requiredFor: {
          include: {
            course: { select: { id: true, code: true, title: true } },
          },
        },
      },
      orderBy: { code: "asc" },
    });

    const formatted = courses.map((c) => {
      const isCompleted = completedSet.has(c.id);
      const unmetPrerequisites = c.prerequisites
        .map((p) => p.prerequisiteCourse)
        .filter((pr) => !completedSet.has(pr.id));

      let status: "completed" | "in-progress" | "locked" = "locked";
      if (isCompleted) {
        status = "completed";
      } else if (unmetPrerequisites.length === 0) {
        status = "in-progress";
      } else {
        status = "locked";
      }

      return {
        id: c.id,
        code: c.code,
        title: c.title,
        description: c.description,
        category: c.category,
        estimatedHours: c.estimatedHours,
        status,
        isCompleted,
        goals: c.goals.map((g) => ({
          id: g.goal.id,
          name: g.goal.name,
          slug: g.goal.slug,
          isTerminal: g.isTerminal,
        })),
        prerequisites: c.prerequisites.map((p) => ({
          id: p.prerequisiteCourse.id,
          code: p.prerequisiteCourse.code,
          title: p.prerequisiteCourse.title,
          isCompleted: completedSet.has(p.prerequisiteCourse.id),
        })),
        unmetPrerequisites: unmetPrerequisites.map((p) => ({
          id: p.id,
          code: p.code,
          title: p.title,
        })),
        dependents: c.requiredFor.map((r) => ({
          id: r.course.id,
          code: r.course.code,
          title: r.course.title,
          isCompleted: completedSet.has(r.course.id),
        })),
      };
    });

    let results = formatted;

    if (goalSlug) {
      results = results.filter((c) => c.goals.some((g) => g.slug === goalSlug));
    }

    if (category) {
      results = results.filter((c) => c.category.toLowerCase() === category.toLowerCase());
    }

    if (search) {
      const term = search.toLowerCase();
      results = results.filter(
        (c) =>
          c.code.toLowerCase().includes(term) ||
          c.title.toLowerCase().includes(term) ||
          c.description.toLowerCase().includes(term) ||
          c.category.toLowerCase().includes(term)
      );
    }

    // Extract all unique categories
    const categories = Array.from(new Set(courses.map((c) => c.category))).sort();

    return NextResponse.json({
      total: results.length,
      categories,
      courses: results,
    });
  } catch (error: any) {
    console.error("API Error in GET /api/courses:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch courses" },
      { status: 500 }
    );
  }
}
