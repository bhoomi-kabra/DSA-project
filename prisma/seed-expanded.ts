import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const GOALS_DATA = [
  {
    name: "Machine Learning Engineer",
    slug: "machine-learning-engineer",
    description: "From programming and mathematical foundations to production deep learning, LLMs, and MLOps.",
  },
  {
    name: "Full Stack Web Developer",
    slug: "full-stack-developer",
    description: "Build scalable end-to-end web applications with modern frontend frameworks, RESTful backend APIs, and cloud databases.",
  },
  {
    name: "Placement & DSA Interview Preparation",
    slug: "dsa-interview-prep",
    description: "Master problem solving, data structures, algorithm paradigms, CS core fundamentals, and technical interview screening.",
  },
];

export const COURSES_DATA = [
  // ─── Track 1: Machine Learning & AI Foundations ───────────────
  {
    code: "CS101",
    title: "Programming Fundamentals with Python",
    description: "Variables, control flow, functions, OOP, and computational problem solving in Python.",
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
    code: "MATH203",
    title: "Calculus for Machine Learning",
    description: "Multivariate calculus, partial derivatives, gradients, chain rule, and optimization surfaces.",
    estimatedHours: 25,
    category: "Mathematics",
  },
  {
    code: "CS105",
    title: "Python for Data Science: NumPy & Pandas",
    description: "Vectorized array computations with NumPy, tabular data manipulation, indexing, and aggregation with Pandas.",
    estimatedHours: 25,
    category: "Data Science",
  },
  {
    code: "CS205",
    title: "Exploratory Data Analysis & Visualization",
    description: "Data cleaning, missing value imputation, statistical plotting with Matplotlib and Seaborn, and feature discovery.",
    estimatedHours: 20,
    category: "Data Science",
  },
  {
    code: "CS301",
    title: "Machine Learning Foundations",
    description: "Supervised and unsupervised learning, cost functions, gradient descent, and bias-variance tradeoff.",
    estimatedHours: 45,
    category: "AI/ML",
  },
  {
    code: "CS305",
    title: "Supervised & Unsupervised Learning",
    description: "Regression, decision trees, random forests, boosting, k-means clustering, and PCA.",
    estimatedHours: 35,
    category: "AI/ML",
  },
  {
    code: "CS306",
    title: "Feature Engineering & Model Evaluation",
    description: "Cross-validation, ROC-AUC, precision-recall, feature scaling, encoding, and hyperparameter tuning.",
    estimatedHours: 25,
    category: "AI/ML",
  },
  {
    code: "CS302",
    title: "Deep Learning & Neural Architectures",
    description: "Backpropagation, CNNs, RNNs, Transformers, attention mechanisms, and PyTorch implementations.",
    estimatedHours: 50,
    category: "AI/ML",
  },
  {
    code: "CS401",
    title: "MLOps: Production Machine Learning",
    description: "Model containerization, registries, CI/CD for ML, drift detection, and low-latency inference serving.",
    estimatedHours: 30,
    category: "AI/ML",
  },
  {
    code: "CS402",
    title: "Natural Language Processing (NLP)",
    description: "Tokenization, word embeddings, sequence-to-sequence models, and fine-tuning BERT architectures.",
    estimatedHours: 35,
    category: "AI/ML",
  },
  {
    code: "CS403",
    title: "Computer Vision Fundamentals",
    description: "Image transformations, object detection, segmentation with YOLO, and transfer learning in vision.",
    estimatedHours: 35,
    category: "AI/ML",
  },
  {
    code: "CS405",
    title: "Generative AI & Large Language Models",
    description: "Transformer scaling, prompt engineering, fine-tuning, embeddings, and vector similarity search.",
    estimatedHours: 40,
    category: "Advanced AI",
  },
  {
    code: "CS406",
    title: "Retrieval-Augmented Generation (RAG) & AI Apps",
    description: "Building production RAG pipelines, chunking strategies, vector databases, LangChain, and AI agents.",
    estimatedHours: 35,
    category: "Advanced AI",
  },

  // ─── Track 2: Full-Stack Web Development ──────────────────────
  {
    code: "DEV101",
    title: "HTML5 & Modern Web Fundamentals",
    description: "Semantic markup, DOM structure, accessibility standards, web forms, and browser rendering lifecycle.",
    estimatedHours: 15,
    category: "Frontend",
  },
  {
    code: "DEV102",
    title: "CSS3 Styling, Flexbox & Grid",
    description: "Modern CSS box model, responsive layouts with Flexbox and CSS Grid, transitions, and animations.",
    estimatedHours: 20,
    category: "Frontend",
  },
  {
    code: "DEV103",
    title: "Responsive Design & Modern UI",
    description: "Mobile-first design principles, media queries, CSS variables, and modern styling architectures.",
    estimatedHours: 15,
    category: "Frontend",
  },
  {
    code: "DEV104",
    title: "JavaScript Fundamentals & DOM",
    description: "Data types, closures, scope, event loop, DOM manipulation, and browser event listeners.",
    estimatedHours: 25,
    category: "Frontend",
  },
  {
    code: "DEV105",
    title: "Advanced JavaScript & Asynchronous ES6+",
    description: "Promises, async/await, fetch API, modules, functional paradigms, and error handling in JS.",
    estimatedHours: 25,
    category: "Frontend",
  },
  {
    code: "DEV106",
    title: "Git, GitHub & Version Control",
    description: "Branching strategies, merge conflict resolution, pull request workflows, and collaborative development.",
    estimatedHours: 15,
    category: "Tools",
  },
  {
    code: "DEV201",
    title: "React Fundamentals & Component Architecture",
    description: "JSX, virtual DOM, component lifecycles, props, and declarative UI development.",
    estimatedHours: 30,
    category: "Frontend",
  },
  {
    code: "DEV202",
    title: "React Hooks & Global State Management",
    description: "useState, useEffect, custom hooks, Context API, and state management patterns.",
    estimatedHours: 25,
    category: "Frontend",
  },
  {
    code: "DEV203",
    title: "TypeScript for Web Applications",
    description: "Static typing, generics, interfaces, union types, and type-safe React application development.",
    estimatedHours: 25,
    category: "Frontend",
  },
  {
    code: "DEV204",
    title: "Node.js & Backend Runtime Architecture",
    description: "V8 engine, Node.js event-driven non-blocking I/O, file system operations, and npm package architecture.",
    estimatedHours: 25,
    category: "Backend",
  },
  {
    code: "DEV205",
    title: "Express.js & REST API Design",
    description: "Routing, middleware architecture, request handling, status codes, and modular REST API structuring.",
    estimatedHours: 25,
    category: "Backend",
  },
  {
    code: "DEV206",
    title: "SQL & Relational Databases (PostgreSQL)",
    description: "Relational schema modeling, foreign keys, normalization, joins, indexing, and Prisma ORM.",
    estimatedHours: 25,
    category: "Databases",
  },
  {
    code: "DEV207",
    title: "MongoDB & NoSQL Document Stores",
    description: "Document data models, aggregation pipelines, schema validation, and Mongoose integration.",
    estimatedHours: 20,
    category: "Databases",
  },
  {
    code: "DEV301",
    title: "Authentication, Authorization & Security",
    description: "JWT, session management, OAuth2, bcrypt hashing, CORS, and defense against XSS/CSRF vulnerabilities.",
    estimatedHours: 25,
    category: "Backend",
  },
  {
    code: "DEV401",
    title: "Full-Stack Integration & Cloud Deployment",
    description: "End-to-end frontend/backend integration, containerization with Docker, CI/CD pipelines, and cloud hosting.",
    estimatedHours: 40,
    category: "Full-Stack",
  },

  // ─── Track 3: Placement & DSA Interview Preparation ───────────
  {
    code: "DSA101",
    title: "C++ Programming Fundamentals & STL",
    description: "Pointers, references, memory management, templates, and Standard Template Library (vector, map, set).",
    estimatedHours: 30,
    category: "Core CS",
  },
  {
    code: "DSA102",
    title: "Time & Space Complexity Analysis",
    description: "Big-O, Big-Omega, Big-Theta notation, recurrence relations, Master Theorem, and memory layout.",
    estimatedHours: 15,
    category: "Core CS",
  },
  {
    code: "CS201",
    title: "Data Structures",
    description: "Arrays, linked lists, stacks, queues, hash tables, trees, heaps, and graphs.",
    estimatedHours: 35,
    category: "Core CS",
  },
  {
    code: "DSA201",
    title: "Searching, Sorting & Two-Pointer Techniques",
    description: "Binary search variations, merge sort, quick sort, two pointers, and sliding window patterns.",
    estimatedHours: 20,
    category: "Algorithms",
  },
  {
    code: "DSA202",
    title: "Hashing & Hash Maps Problem Solving",
    description: "Hash collisions, frequency maps, prefix sums, and hash set algorithms for O(1) lookups.",
    estimatedHours: 20,
    category: "Data Structures",
  },
  {
    code: "DSA203",
    title: "Recursion & Backtracking Paradigms",
    description: "Recursive call stack, subsets, permutations, N-Queens, Sudoku solver, and combinatorial search.",
    estimatedHours: 25,
    category: "Algorithms",
  },
  {
    code: "CS202",
    title: "Design & Analysis of Algorithms",
    description: "Asymptotic analysis, Divide & Conquer, Greedy strategies, Dynamic Programming, and Graph Traversals.",
    estimatedHours: 40,
    category: "Core CS",
  },
  {
    code: "DSA301",
    title: "Trees, Binary Search Trees & Heaps",
    description: "Tree traversals, LCA, diameter, AVL/BST balancing, min/max heaps, and priority queues.",
    estimatedHours: 35,
    category: "Data Structures",
  },
  {
    code: "CS303",
    title: "Competitive Programming & Advanced Graphs",
    description: "Topological sorting, Dijkstra, Bellman-Ford, Tarjan's SCC, network flows, and tree DP.",
    estimatedHours: 40,
    category: "Algorithms",
  },
  {
    code: "DSA303",
    title: "Dynamic Programming Patterns",
    description: "Memoization, tabulation, 0/1 knapsack, LCS, LIS, matrix chain multiplication, and interval DP.",
    estimatedHours: 40,
    category: "Algorithms",
  },
  {
    code: "CS210",
    title: "Operating Systems Fundamentals for Interviews",
    description: "Process management, threads, concurrency, deadlock, virtual memory, paging, and CPU scheduling.",
    estimatedHours: 25,
    category: "Core CS",
  },
  {
    code: "CS211",
    title: "DBMS & SQL for Technical Interviews",
    description: "ER modeling, normalization (1NF-BCNF), transactions, ACID properties, indexing, and complex SQL queries.",
    estimatedHours: 25,
    category: "Core CS",
  },
  {
    code: "CS212",
    title: "Computer Networks & Web Architecture",
    description: "OSI model, TCP/IP stack, DNS, HTTP/HTTPS, sockets, routing protocols, and CDN architectures.",
    estimatedHours: 20,
    category: "Core CS",
  },
  {
    code: "INT401",
    title: "Technical Interview Preparation & Mock Screening",
    description: "System design basics, behavioral STAR method, live coding simulations, and end-to-end technical screening.",
    estimatedHours: 25,
    category: "Interview Prep",
  },
];

// Prerequisite Edge Relationships (prereq -> course)
export const EDGE_DEFINITIONS = [
  // ── Track 1: ML & AI ───────────────────────────────────────
  { prereq: "CS101", course: "CS105" },
  { prereq: "CS105", course: "CS205" },
  { prereq: "MATH202", course: "CS205" },

  { prereq: "CS101", course: "CS301" },
  { prereq: "MATH201", course: "CS301" },
  { prereq: "MATH202", course: "CS301" },
  { prereq: "MATH203", course: "CS301" },

  { prereq: "CS301", course: "CS305" },
  { prereq: "CS205", course: "CS305" },

  { prereq: "CS305", course: "CS306" },

  { prereq: "CS301", course: "CS302" },
  { prereq: "MATH201", course: "CS302" },

  { prereq: "CS301", course: "CS401" },

  { prereq: "CS302", course: "CS402" },
  { prereq: "CS302", course: "CS403" },

  { prereq: "CS402", course: "CS405" },
  { prereq: "CS405", course: "CS406" },

  // ── Track 2: Full-Stack Web Development ────────────────────
  { prereq: "DEV101", course: "DEV102" },
  { prereq: "DEV102", course: "DEV103" },

  { prereq: "DEV101", course: "DEV104" },
  { prereq: "DEV104", course: "DEV105" },

  { prereq: "DEV105", course: "DEV201" },
  { prereq: "DEV103", course: "DEV201" },
  { prereq: "DEV201", course: "DEV202" },

  { prereq: "DEV105", course: "DEV203" },

  { prereq: "DEV105", course: "DEV204" },
  { prereq: "DEV204", course: "DEV205" },

  { prereq: "DEV204", course: "DEV207" },

  { prereq: "DEV205", course: "DEV301" },
  { prereq: "DEV206", course: "DEV301" },

  { prereq: "DEV202", course: "DEV401" },
  { prereq: "DEV203", course: "DEV401" },
  { prereq: "DEV301", course: "DEV401" },
  { prereq: "DEV106", course: "DEV401" },

  // ── Track 3: Placement & DSA ───────────────────────────────
  { prereq: "DSA101", course: "DSA102" },
  { prereq: "DSA101", course: "CS201" },

  { prereq: "CS201", course: "DSA201" },
  { prereq: "DSA102", course: "DSA201" },

  { prereq: "CS201", course: "DSA202" },

  { prereq: "CS201", course: "DSA203" },
  { prereq: "DSA102", course: "DSA203" },

  { prereq: "CS201", course: "CS202" },
  { prereq: "DSA102", course: "CS202" },

  { prereq: "CS202", course: "DSA301" },
  { prereq: "DSA203", course: "DSA301" },

  { prereq: "CS202", course: "CS303" },
  { prereq: "DSA301", course: "CS303" },

  { prereq: "CS202", course: "DSA303" },
  { prereq: "DSA203", course: "DSA303" },

  { prereq: "DSA101", course: "CS210" },

  { prereq: "CS303", course: "INT401" },
  { prereq: "DSA303", course: "INT401" },
  { prereq: "CS210", course: "INT401" },
  { prereq: "CS211", course: "INT401" },
  { prereq: "CS212", course: "INT401" },
];

// Mapping of Goals to their member courses and terminal flags
export const GOAL_MEMBERSHIPS: Record<
  string,
  Array<{ code: string; isTerminal: boolean }>
> = {
  "machine-learning-engineer": [
    { code: "CS101", isTerminal: false },
    { code: "MATH201", isTerminal: false },
    { code: "MATH202", isTerminal: false },
    { code: "MATH203", isTerminal: false },
    { code: "CS105", isTerminal: false },
    { code: "CS205", isTerminal: false },
    { code: "CS301", isTerminal: false },
    { code: "CS305", isTerminal: false },
    { code: "CS306", isTerminal: false },
    { code: "CS302", isTerminal: false },
    { code: "CS401", isTerminal: true },
    { code: "CS402", isTerminal: false },
    { code: "CS403", isTerminal: true },
    { code: "CS405", isTerminal: false },
    { code: "CS406", isTerminal: true },
  ],
  "full-stack-developer": [
    { code: "DEV101", isTerminal: false },
    { code: "DEV102", isTerminal: false },
    { code: "DEV103", isTerminal: false },
    { code: "DEV104", isTerminal: false },
    { code: "DEV105", isTerminal: false },
    { code: "DEV106", isTerminal: false },
    { code: "DEV201", isTerminal: false },
    { code: "DEV202", isTerminal: false },
    { code: "DEV203", isTerminal: false },
    { code: "DEV204", isTerminal: false },
    { code: "DEV205", isTerminal: false },
    { code: "DEV206", isTerminal: false },
    { code: "DEV207", isTerminal: false },
    { code: "DEV301", isTerminal: false },
    { code: "DEV401", isTerminal: true },
  ],
  "dsa-interview-prep": [
    { code: "DSA101", isTerminal: false },
    { code: "DSA102", isTerminal: false },
    { code: "CS201", isTerminal: false },
    { code: "DSA201", isTerminal: false },
    { code: "DSA202", isTerminal: false },
    { code: "DSA203", isTerminal: false },
    { code: "CS202", isTerminal: false },
    { code: "DSA301", isTerminal: false },
    { code: "CS303", isTerminal: false },
    { code: "DSA303", isTerminal: false },
    { code: "CS210", isTerminal: false },
    { code: "CS211", isTerminal: false },
    { code: "CS212", isTerminal: false },
    { code: "INT401", isTerminal: true },
  ],
};

async function main() {
  console.log("🌱 Starting idempotent database expansion...");

  // 1. Upsert Goals
  const goalMap = new Map<string, string>(); // slug -> id
  for (const g of GOALS_DATA) {
    const upserted = await prisma.goal.upsert({
      where: { slug: g.slug },
      update: {
        name: g.name,
        description: g.description,
      },
      create: g,
    });
    goalMap.set(g.slug, upserted.id);
  }
  console.log(`✅ Upserted ${goalMap.size} Goals.`);

  // 2. Upsert Courses
  const courseCodeToId = new Map<string, string>(); // code -> id
  for (const c of COURSES_DATA) {
    const upserted = await prisma.course.upsert({
      where: { code: c.code },
      update: {
        title: c.title,
        description: c.description,
        estimatedHours: c.estimatedHours,
        category: c.category,
      },
      create: c,
    });
    courseCodeToId.set(c.code, upserted.id);
  }
  console.log(`✅ Upserted ${courseCodeToId.size} Courses across all 3 tracks.`);

  // 3. Upsert Prerequisite Edges safely using createMany
  const edgeItems: Array<{ courseId: string; prerequisiteCourseId: string }> = [];
  for (const e of EDGE_DEFINITIONS) {
    const prereqId = courseCodeToId.get(e.prereq);
    const courseId = courseCodeToId.get(e.course);
    if (!prereqId || !courseId) {
      console.warn(`⚠️ Skipping missing edge: ${e.prereq} -> ${e.course}`);
      continue;
    }
    edgeItems.push({ courseId, prerequisiteCourseId: prereqId });
  }

  const edgeResult = await prisma.prerequisite.createMany({
    data: edgeItems,
    skipDuplicates: true,
  });
  console.log(`✅ Synced ${edgeResult.count} Directed Prerequisite Edges.`);

  // 4. Sync Goal Memberships & Terminal Capstones
  const goalCourseItems: Array<{ goalId: string; courseId: string; isTerminal: boolean }> = [];
  for (const [goalSlug, members] of Object.entries(GOAL_MEMBERSHIPS)) {
    const goalId = goalMap.get(goalSlug);
    if (!goalId) continue;

    for (const member of members) {
      const courseId = courseCodeToId.get(member.code);
      if (!courseId) continue;

      goalCourseItems.push({
        goalId,
        courseId,
        isTerminal: member.isTerminal,
      });
    }
  }

  // Remove existing goalCourse links and insert fresh links to ensure isTerminal is synced
  await prisma.goalCourse.deleteMany({});
  const result = await prisma.goalCourse.createMany({
    data: goalCourseItems,
    skipDuplicates: true,
  });
  console.log(`✅ Synced ${result.count} GoalCourse associations.`);

  // 5. Ensure Demo Student Alex Rivera has realistic initial progress
  const demoUser = await prisma.user.findFirst({
    where: { email: "student@pathpilot.dev" },
  });

  if (demoUser) {
    const initialCompleted = ["CS101", "MATH201", "DEV101", "DSA101"];
    for (const code of initialCompleted) {
      const cId = courseCodeToId.get(code);
      if (cId) {
        await prisma.studentProgress.upsert({
          where: {
            userId_courseId: {
              userId: demoUser.id,
              courseId: cId,
            },
          },
          update: { isCompleted: true },
          create: {
            userId: demoUser.id,
            courseId: cId,
            isCompleted: true,
          },
        });
      }
    }
    console.log(`✅ Preserved and verified progress for ${demoUser.email}.`);
  }

  console.log("🎉 Idempotent database expansion completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Expansion error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
