import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting PathPilot database seed...");

  // 1. Clean existing records in reverse dependency order
  await prisma.goalCourse.deleteMany();
  await prisma.prerequisite.deleteMany();
  await prisma.studentProgress.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();
  await prisma.goal.deleteMany();

  // 2. Create Goals
  const mlGoal = await prisma.goal.create({
    data: {
      name: "Machine Learning Engineer",
      slug: "machine-learning-engineer",
      description: "From programming and mathematical foundations to production deep learning and MLOps.",
    },
  });

  const dsaGoal = await prisma.goal.create({
    data: {
      name: "DSA Interview Preparation",
      slug: "dsa-interview-prep",
      description: "Master data structures, algorithm design paradigms, graph algorithms, and competitive coding.",
    },
  });

  console.log("✅ Created Goals:", [mlGoal.name, dsaGoal.name]);

  // 3. Create Courses (Graph Nodes)
  const coursesData = [
    {
      code: "CS101",
      title: "Programming Fundamentals with Python",
      description: "Variables, control flow, functions, OOP, and computational problem solving.",
      estimatedHours: 25,
      category: "Core CS",
    },
    {
      code: "MATH201",
      title: "Linear Algebra & Matrix Methods",
      description: "Vector spaces, matrix decomposition, eigenvalues, and SVD for computational science.",
      estimatedHours: 30,
      category: "Mathematics",
    },
    {
      code: "MATH202",
      title: "Probability & Applied Statistics",
      description: "Random variables, distributions, Bayesian inference, and hypothesis testing.",
      estimatedHours: 25,
      category: "Mathematics",
    },
    {
      code: "CS201",
      title: "Data Structures",
      description: "Arrays, linked lists, stacks, queues, hash tables, trees, heaps, and graphs.",
      estimatedHours: 35,
      category: "Core CS",
    },
    {
      code: "CS202",
      title: "Design & Analysis of Algorithms",
      description: "Asymptotic notation, Divide & Conquer, Greedy, Dynamic Programming, and Graph Traversals.",
      estimatedHours: 40,
      category: "Core CS",
    },
    {
      code: "CS301",
      title: "Machine Learning Foundations",
      description: "Supervised and unsupervised learning, gradient descent, loss functions, regularization, and model evaluation.",
      estimatedHours: 45,
      category: "AI/ML",
    },
    {
      code: "CS302",
      title: "Deep Learning & Neural Architectures",
      description: "CNNs, RNNs, Transformers, attention mechanisms, backpropagation, and PyTorch implementations.",
      estimatedHours: 50,
      category: "AI/ML",
    },
    {
      code: "CS303",
      title: "Competitive Programming & Advanced Graphs",
      description: "Topological sorting, Dijkstra, Bellman-Ford, Tarjan's SCC, network flows, and tree DP.",
      estimatedHours: 40,
      category: "Algorithms",
    },
    {
      code: "CS401",
      title: "MLOps: Production Machine Learning",
      description: "Containerization, model registries, CI/CD for ML, drift detection, and low-latency inference.",
      estimatedHours: 30,
      category: "AI/ML",
    },
  ];

  const courseMap = new Map<string, string>(); // code -> id

  for (const c of coursesData) {
    const created = await prisma.course.create({ data: c });
    courseMap.set(c.code, created.id);
  }

  console.log(`✅ Created ${courseMap.size} Course Nodes.`);

  // 4. Create Directed Prerequisite Edges (DAG)
  // [prerequisiteCourseId] (Parent/Prerequisite) ---> [courseId] (Child/Dependent)
  const edgeDefinitions = [
    // Programming unlocks Data Structures & ML Core
    { prereq: "CS101", course: "CS201" }, // CS101 -> CS201
    { prereq: "CS101", course: "CS301" }, // CS101 -> CS301

    // Data Structures unlocks Algorithms
    { prereq: "CS201", course: "CS202" }, // CS201 -> CS202

    // Mathematics prerequisites for ML Core
    { prereq: "MATH201", course: "CS301" }, // MATH201 -> CS301
    { prereq: "MATH202", course: "CS301" }, // MATH202 -> CS301

    // Algorithms unlocks Advanced Graphs & Competitive Programming
    { prereq: "CS202", course: "CS303" }, // CS202 -> CS303

    // ML Core unlocks Deep Learning & MLOps
    { prereq: "CS301", course: "CS302" }, // CS301 -> CS302
    { prereq: "CS301", course: "CS401" }, // CS301 -> CS401
  ];

  for (const edge of edgeDefinitions) {
    const prereqId = courseMap.get(edge.prereq)!;
    const courseId = courseMap.get(edge.course)!;

    await prisma.prerequisite.create({
      data: {
        prerequisiteCourseId: prereqId,
        courseId: courseId,
      },
    });
  }

  console.log(`✅ Created ${edgeDefinitions.length} Directed Prerequisite Edges in DAG.`);

  // 5. Link Target Milestone Courses to Goals
  // Machine Learning: Terminal capstones are CS302 (Deep Learning) and CS401 (MLOps)
  await prisma.goalCourse.createMany({
    data: [
      { goalId: mlGoal.id, courseId: courseMap.get("CS101")!, isTerminal: false },
      { goalId: mlGoal.id, courseId: courseMap.get("MATH201")!, isTerminal: false },
      { goalId: mlGoal.id, courseId: courseMap.get("MATH202")!, isTerminal: false },
      { goalId: mlGoal.id, courseId: courseMap.get("CS301")!, isTerminal: false },
      { goalId: mlGoal.id, courseId: courseMap.get("CS302")!, isTerminal: true },
      { goalId: mlGoal.id, courseId: courseMap.get("CS401")!, isTerminal: true },
    ],
  });

  // DSA Track: Terminal capstone is CS303 (Advanced Graphs & CP)
  await prisma.goalCourse.createMany({
    data: [
      { goalId: dsaGoal.id, courseId: courseMap.get("CS101")!, isTerminal: false },
      { goalId: dsaGoal.id, courseId: courseMap.get("CS201")!, isTerminal: false },
      { goalId: dsaGoal.id, courseId: courseMap.get("CS202")!, isTerminal: false },
      { goalId: dsaGoal.id, courseId: courseMap.get("CS303")!, isTerminal: true },
    ],
  });

  console.log("✅ Linked Goal Target Courses for Subgraph Extraction.");

  // 6. Create Demo Student Alex Rivera (Feature 2 & 3 test)
  const student = await prisma.user.create({
    data: {
      email: "student@pathpilot.dev",
      name: "Alex Rivera",
      weeklyStudyHours: 15,
      targetGoalId: mlGoal.id,
      progress: {
        create: [
          {
            courseId: courseMap.get("CS101")!,
            isCompleted: true,
          },
          {
            courseId: courseMap.get("MATH201")!,
            isCompleted: true,
          },
          {
            courseId: courseMap.get("MATH202")!,
            isCompleted: false, // In-progress / not yet completed
          },
        ],
      },
    },
  });

  console.log(`✅ Created Demo Student (${student.email}) with completed courses.`);
  console.log("🚀 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
