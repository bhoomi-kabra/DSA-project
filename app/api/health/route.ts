import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Ping database with a lightweight query
    const [userCount, courseCount, edgeCount] = await Promise.all([
      prisma.user.count(),
      prisma.course.count(),
      prisma.prerequisite.count(),
    ]);

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "PathPilot Backend Engine",
      database: "Neon PostgreSQL",
      metrics: {
        users: userCount,
        courseNodes: courseCount,
        prerequisiteEdges: edgeCount,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        message: "Database connection failed",
        error: error?.message,
      },
      { status: 500 }
    );
  }
}
