import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const goals = await prisma.goal.findMany({
      include: {
        courses: {
          include: {
            course: {
              select: {
                id: true,
                code: true,
                title: true,
                estimatedHours: true,
                category: true,
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const formatted = goals.map((g) => {
      const totalHours = g.courses.reduce(
        (sum, item) => sum + item.course.estimatedHours,
        0
      );
      return {
        id: g.id,
        name: g.name,
        slug: g.slug,
        description: g.description,
        courseCount: g.courses.length,
        totalEstimatedHours: totalHours,
        targetCourses: g.courses.map((gc) => ({
          ...gc.course,
          isTerminal: gc.isTerminal,
        })),
      };
    });

    return NextResponse.json({ goals: formatted });
  } catch (error: any) {
    console.error("API Error in /api/goals:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch goals" },
      { status: 500 }
    );
  }
}
