import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, createSessionToken, AUTH_COOKIE, hashPassword } from '@/lib/auth';

const DEMO_EMAIL = 'demo@pathpilot.dev';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, isDemo } = body;

    // Quick Student Demo One-Click Access
    if (isDemo || email === DEMO_EMAIL) {
      let demoUser = await prisma.user.findUnique({
        where: { email: DEMO_EMAIL },
        include: { targetGoal: true },
      });

      if (!demoUser) {
        // Ensure default goal exists
        const defaultGoal = await prisma.goal.findFirst({
          where: { slug: 'machine-learning-engineer' },
        }) || await prisma.goal.findFirst();

        demoUser = await prisma.user.create({
          data: {
            email: DEMO_EMAIL,
            name: 'Alex Chen',
            passwordHash: await hashPassword('DemoStudent2026!'),
            weeklyStudyHours: 15,
            targetGoalId: defaultGoal?.id,
            yearOfStudy: 3,
            branch: 'Computer Science & AI',
            onboarded: true,
          },
          include: { targetGoal: true },
        });

        // Seed some completed progress for demo user so roadmap has active state
        const initialCourses = await prisma.course.findMany({
          where: { code: { in: ['MATH101', 'MATH102', 'CS101', 'CS102'] } },
        });

        for (const course of initialCourses) {
          await prisma.studentProgress.upsert({
            where: {
              userId_courseId: { userId: demoUser.id, courseId: course.id },
            },
            update: { isCompleted: true, status: 'COMPLETED' },
            create: {
              userId: demoUser.id,
              courseId: course.id,
              isCompleted: true,
              status: 'COMPLETED',
              hoursSpent: course.estimatedHours,
              completedAt: new Date(),
            },
          });
        }
      }

      const token = await createSessionToken({
        userId: demoUser.id,
        email: demoUser.email,
        name: demoUser.name,
        onboarded: demoUser.onboarded,
      });

      const response = NextResponse.json({
        success: true,
        user: {
          id: demoUser.id,
          email: demoUser.email,
          name: demoUser.name,
          onboarded: demoUser.onboarded,
          weeklyStudyHours: demoUser.weeklyStudyHours,
          targetGoalId: demoUser.targetGoalId,
          yearOfStudy: demoUser.yearOfStudy,
          branch: demoUser.branch,
        },
      });

      response.cookies.set({
        name: AUTH_COOKIE,
        value: token,
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      });

      return response;
    }

    if (!email || !password) {
      return NextResponse.json({ error: 'Please enter both email and password.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: 'Incorrect email or password.' }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Incorrect email or password.' }, { status: 401 });
    }

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      onboarded: user.onboarded,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        onboarded: user.onboarded,
        weeklyStudyHours: user.weeklyStudyHours,
        targetGoalId: user.targetGoalId,
        yearOfStudy: user.yearOfStudy,
        branch: user.branch,
      },
    });

    response.cookies.set({
      name: AUTH_COOKIE,
      value: token,
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 500 });
  }
}
