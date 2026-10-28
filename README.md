# PathPilot — Personalized Learning Path Planner (Backend & Database Core)

> **Role**: Member 3 — Backend & Database Architect  
> **Stack**: Next.js (App Router Route Handlers) &bull; Neon DB (Serverless PostgreSQL) &bull; Prisma ORM &bull; TypeScript

PathPilot solves a fundamental challenge for computer science students: planning an optimal, personalized course sequence based on career goals, course prerequisites, and prior knowledge.

---

## Architecture & DSA Mapping

This backend models the entire curriculum as a **Directed Acyclic Graph (DAG)**:
- **Graph Nodes (`Course`)**: Course metadata, difficulty, estimated study hours.
- **Graph Edges (`Prerequisite`)**: Self-referencing directed relationship $(u \to v)$ where course $u$ is a prerequisite required to unlock course $v$.
- **Adjacency Lists & In-Degree**: Precomputed on demand for $O(1)$ edge queries and instant topological sorting / cycle detection by the core algorithm engine.
- **Knowledge-Aware Roadmaps (`StudentProgress`)**: Dynamically flags courses as completed, in-progress, unlocked, or locked.
- **Goal Subgraph Isolation (`Goal`, `GoalCourse`)**: Reverse BFS/DFS from capstone milestone nodes to extract only the relevant prerequisite subgraph.

| DSA Concept | Implementation in PathPilot |
| :--- | :--- |
| **Directed Graphs & Adjacency Lists** | Represented in PostgreSQL via `Course` (nodes) and `Prerequisite` (edges). Exposed via `/api/graph`. |
| **Reverse BFS / DFS** | Subgraph extraction: Starts from terminal goal courses and traverses upstream dependencies. |
| **Topological Sorting** | Generates valid sequential schedules respecting prerequisite constraints ($O(V+E)$). |
| **Cycle Detection** | Identifies circular dependencies (e.g., $A \to B \to C \to A$) before applying curriculum updates. |
| **Time-Constrained Scheduling** | Uses `weeklyStudyHours` and `estimatedHours` to calculate feasible weekly study plans. |

---

## Database Schema (`prisma/schema.prisma`)

```prisma
model User {
  id               String            @id @default(uuid())
  email            String            @unique
  name             String?
  weeklyStudyHours Int               @default(10)
  targetGoalId     String?
  createdAt        DateTime          @default(now())

  targetGoal       Goal?             @relation(fields: [targetGoalId], references: [id], onDelete: SetNull)
  progress         StudentProgress[]
}

model Course {
  id             String            @id @default(uuid())
  code           String            @unique
  title          String
  description    String            @db.Text
  estimatedHours Int
  category       String            @default("General")
  createdAt      DateTime          @default(now())

  prerequisites  Prerequisite[]    @relation("CourseAsCourse")
  requiredFor    Prerequisite[]    @relation("CourseAsPrerequisite")
  students       StudentProgress[]
  goals          GoalCourse[]
}

model Prerequisite {
  courseId             String
  prerequisiteCourseId String

  course               Course   @relation("CourseAsCourse", fields: [courseId], references: [id], onDelete: Cascade)
  prerequisiteCourse   Course   @relation("CourseAsPrerequisite", fields: [prerequisiteCourseId], references: [id], onDelete: Cascade)

  @@id([courseId, prerequisiteCourseId])
}

model StudentProgress {
  id          String   @id @default(uuid())
  userId      String
  courseId    String
  isCompleted Boolean  @default(false)
  updatedAt   DateTime @updatedAt

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  course      Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)

  @@unique([userId, courseId])
}
```

---

## Live API Endpoints

- `GET /api/health` — Neon DB connection status and entity counts.
- `GET /api/graph` — Complete course DAG (nodes, edges, forward & reverse adjacency lists).
- `GET /api/graph?goal=machine-learning-engineer` — Goal-specific prerequisite subgraph extraction.
- `GET /api/graph?format=cpp` — Standard 0-indexed edge list $(u, v)$ for C++ engine consumption.
- `GET /api/graph?engine=cpp&goal=...` — Direct execution of C++ Graph Algorithm Engine via GET query.
- `POST /api/graph/analyze` — Primary C++ graph engine execution endpoint. Accepts `{ goal, userId, operation, weeklyStudyHours }`. Returns topological learning order, cycle diagnostics, critical path, study-time estimates, and React Flow nodes/edges.
- `POST /api/graph` — Same as `/api/graph/analyze`.
- `GET /api/goals` — List of career goals and target milestone capstones.
- `GET /api/user/progress?userId=...` — Knowledge-aware roadmap state (completed, unlocked, locked, remaining hours).
- `POST /api/user/progress` — Body: `{ userId, courseId, isCompleted }`. Recalculates unlocked courses.

---

## C++ Graph Algorithm Engine

PathPilot includes a high-performance native C++ engine (`cpp/`) that executes graph algorithms over real database data:

1. **Algorithm A (Graph Construction)**: Validates indices, builds forward & reverse adjacency lists and in-degrees, rejects self-loops and duplicate edges.
2. **Algorithm B (Reverse BFS Subgraph Extraction)**: Discovers prerequisite ancestors from target capstone courses.
3. **Algorithm C (Topological Sorting & Live Inspector Tracing)**: Implements Kahn's algorithm with deterministic tie-breaking using a min-priority queue ordered by course code. Emits fine-grained micro-step traces (in-degree array updates, queue state, and popping) for the interactive **Algorithm Inspector**.
4. **Algorithm D (Cycle Detection & Isolation)**: Detects cyclic dependencies using Kahn's algorithm and isolates cyclic nodes from blocked downstream nodes via DFS.
5. **Algorithm E (Critical-Path Study-Time Estimation)**: Computes the longest prerequisite chain using dynamic programming along the topological order. Distinguishes total cumulative workload ($\sum h$) from critical-path duration ($\max_{\text{paths}} \sum h$).
6. **Algorithm F (Maximum Flow & Min-Cut Cognitive Capacity Planner)**: Implements the **Edmonds-Karp algorithm** (BFS augmenting paths on residual graph $G_f$) to model student weekly cognitive study capacity. Computes the maximum schedulable course workload and isolates the **Minimum Cut edges** to mathematically pinpoint the exact saturated bottleneck constraints preventing course expansion.

See [cpp/README.md](file:///c:/Users/Lenovo/OneDrive/Desktop/Path-Pilot/DSA-project/cpp/README.md) for detailed complexity analysis and architectural documentation.

---

## Setup & Local Development

```bash
# 1. Clone the repository
git clone https://github.com/bhoomi-kabra/DSA-project.git
cd DSA-project

# 2. Install dependencies
npm install

# 3. Configure environment variables
# Copy .env.example to .env and add your Neon DB credentials:
# DATABASE_URL="postgresql://...pooler..."
# DIRECT_URL="postgresql://..."

# 4. Generate Prisma Client & Sync DB
npx prisma generate
npx prisma db push

# 5. Seed initial courses, edges, goals, and demo student
npm run prisma:seed

# 6. Compile C++ Graph Engine and Test Suite
npm run cpp:build

# 7. Run C++ Unit Tests (10 test cases)
npm run cpp:test

# 8. Run Full-Stack Integration Tests
npm run test:integration

# 9. Start Next.js development server
npm run dev
```
