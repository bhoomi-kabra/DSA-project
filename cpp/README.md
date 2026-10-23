# PathPilot C++ Graph Algorithm Engine

The **PathPilot C++ Graph Algorithm Engine** is a high-performance native engine designed to solve curriculum planning problems represented as Directed Acyclic Graphs (DAGs). It provides robust implementations for graph construction, goal-based prerequisite extraction, topological sorting, cycle detection, and critical-path study-time analysis.

---

## 1. Architecture Overview

The C++ engine is decoupled from database storage and communicates with the Next.js server via standard input (stdin) and standard output (stdout) using structured JSON.

```
PostgreSQL (Neon)
       │
       ▼
 Prisma ORM
       │
       ▼
GraphService (lib/services/graph-service.ts)
       │ (JSON via stdin)
       ▼
C++ Graph Algorithm Engine (cpp/bin/graph_engine.exe)
  ├── Algorithm A: Directed Graph Construction & Validation
  ├── Algorithm B: Reverse BFS Goal Subgraph Extraction
  ├── Algorithm C: Kahn's Topological Sorting (Deterministic min-heap)
  ├── Algorithm D: Cycle Detection & Diagnosis (DFS Cycle Isolation)
  └── Algorithm E: Critical Path Analysis (Dynamic Programming on DAG)
       │ (JSON via stdout)
       ▼
Next.js API Handler (/api/graph/analyze & /api/graph)
       │
       ▼
React Flow Roadmap UI (components/RoadmapView.jsx)
```

---

## 2. Graph Representation & Edge Convention

* **Vertices ($V$)**: Represent courses. Each vertex contains:
  * `index`: Internal 0-based integer index.
  * `id`: Stable database UUID.
  * `code`: Course code (e.g., `CS101`, `MATH201`).
  * `title`: Human-readable course title.
  * `estimatedHours`: Workload required to complete the course.
  * `category`: Curriculum domain (e.g., `Mathematics`, `Core CS`, `AI/ML`).
  * `level`: Topological depth layer (used for visual layout coordinates).

* **Directed Edges ($E$)**:
  * **Edge Direction**: $u \to v$
  * **Semantic**: Course $u$ is a **prerequisite** that must be completed **before** course $v$ can be taken.
  * **Forward Adjacency (`adj[u]`)**: Lists all courses unlocked by course $u$.
  * **Reverse Adjacency (`revAdj[v]`)**: Lists all immediate prerequisite courses required by course $v$.
  * **In-Degree (`inDegree[v]`)**: Number of unmet prerequisites required by course $v$.

---

## 3. Implemented Algorithms & Complexity

### Algorithm A: Graph Construction & Validation
* Constructs adjacency and reverse adjacency lists.
* Validates indices ($0 \le u, v < V$), rejects self-loops, and deduplicates edges.
* Handles empty graphs ($V = 0, E = 0$) gracefully.
* **Complexity**: Time $\mathcal{O}(V + E)$, Space $\mathcal{O}(V + E)$.

### Algorithm B: Goal-Based Prerequisite Extraction (Reverse BFS)
* Given target capstone courses (e.g. Deep Learning & MLOps for Machine Learning Engineer), traverses incoming edges upstream via reverse BFS.
* Collects all transitive prerequisite ancestors and constructs the induced subgraph.
* Excludes unrelated courses and unused dependencies.
* **Complexity**: Time $\mathcal{O}(V_{\text{sub}} + E_{\text{sub}})$, Space $\mathcal{O}(V_{\text{sub}} + E_{\text{sub}})$.

### Algorithm C: Topological Sorting (Kahn's Algorithm with Deterministic Tie-Breaking)
* Computes a valid linear study sequence respecting all prerequisite constraints.
* Uses a min-priority queue ordered by `courseCode` to produce a stable, reproducible schedule across runs.
* Calculates the topological layer (`level`) for each course to position nodes cleanly in React Flow.
* **Complexity**: Time $\mathcal{O}((V + E) \log V)$ with priority queue, Space $\mathcal{O}(V)$.

### Algorithm D: Cycle Detection & Isolation
* If Kahn's algorithm processes fewer vertices than $V$, a directed cycle exists.
* Isolates cycle participants using depth-first search on remaining vertices, distinguishing actual cyclic courses from downstream courses blocked by the cycle.
* Returns `hasCycle: true` and diagnostic lists `cycleNodes` and `blockedNodes`.
* Never hangs or crashes on cyclic input.
* **Complexity**: Time $\mathcal{O}(V + E)$, Space $\mathcal{O}(V)$.

### Algorithm E: Critical-Path Study-Time Estimation
* Calculates the longest prerequisite path through the DAG using Dynamic Programming along the topological order.
* **Total Study Hours**: The sum of `estimatedHours` of all courses in the roadmap ($\sum_{v \in V} h_v$). Represents the cumulative student workload.
* **Critical-Path Duration**: The longest dependency bottleneck chain ($\max_{\text{paths}} \sum_{v \in \text{path}} h_v$). Represents the minimum calendar time needed under idealized concurrent study of independent prerequisites.
* Calculates serial vs. parallel estimated weeks based on `weeklyStudyHours`.
* **Complexity**: Time $\mathcal{O}(V + E)$, Space $\mathcal{O}(V)$.

---

## 4. Total Workload vs. Critical-Path Duration

| Metric | Definition | Practical Meaning |
| :--- | :--- | :--- |
| **Total Study Hours** | $\sum_{v} \text{estimatedHours}(v)$ | Total effort a student must expend across all courses. |
| **Critical-Path Hours** | Length of longest dependency chain | The minimum calendar time required even if all non-dependent courses are studied in parallel. |
| **Serial Weeks** | $\lceil \text{Total Hours} / \text{Weekly Hours} \rceil$ | Duration when studying one course at a time. |
| **Parallel Weeks** | $\lceil \text{Critical Hours} / \text{Weekly Hours} \rceil$ | Duration when studying parallel courses simultaneously. |

---

## 5. JSON Input / Output Contract

### Input JSON Structure
```json
{
  "operation": "goal-roadmap",
  "weeklyStudyHours": 15,
  "targetIndices": [4, 6],
  "vertices": [
    {
      "index": 0,
      "id": "uuid-1",
      "code": "CS101",
      "title": "Programming Fundamentals",
      "estimatedHours": 25,
      "category": "Core CS"
    }
  ],
  "edges": [
    { "u": 0, "v": 1, "fromCode": "CS101", "toCode": "CS201" }
  ]
}
```

### Output JSON Structure
```json
{
  "success": true,
  "operation": "goal-roadmap",
  "hasCycle": false,
  "vertexCount": 6,
  "edgeCount": 5,
  "processedCount": 6,
  "learningOrder": [
    {
      "index": 0,
      "id": "uuid-1",
      "code": "CS101",
      "title": "Programming Fundamentals",
      "estimatedHours": 25,
      "category": "Core CS",
      "level": 0
    }
  ],
  "criticalPath": [ ... ],
  "criticalPathCodes": ["MATH201", "CS301", "CS302"],
  "totalStudyHours": 205,
  "criticalPathHours": 125,
  "studyTimeEstimates": {
    "totalStudyHours": 205,
    "criticalPathHours": 125,
    "weeklyStudyHours": 15,
    "serialEstimatedWeeks": 14,
    "parallelEstimatedWeeks": 9,
    "explanation": "..."
  },
  "diagnostics": {
    "executionTimeMs": 1.0,
    "nodesAnalyzed": 6,
    "edgesAnalyzed": 5
  }
}
```

---

## 6. Building and Testing on Windows

### Requirements
* MinGW GCC (g++ 6.3+ supporting C++17) or MSVC or Clang.
* Node.js v18+.

### Compilation
Compile the engine and test suite:
```powershell
# Using npm script:
npm run cpp:build

# Or directly using g++:
g++ -std=c++17 -O2 -I cpp/include cpp/src/GraphEngine.cpp cpp/src/main.cpp -o cpp/bin/graph_engine.exe
g++ -std=c++17 -O2 -I cpp/include cpp/src/GraphEngine.cpp cpp/tests/graph_engine_tests.cpp -o cpp/bin/graph_engine_tests.exe
```

### Running Unit Tests
```powershell
npm run cpp:test
# Or directly:
.\cpp\bin\graph_engine_tests.exe
```

### Running Full-Stack Integration Tests
```powershell
npm run test:integration
```

---

## 7. Deployment & Hosting Constraints

1. **Native Executable Execution**: In production (e.g. AWS EC2, VPS, Docker containers), compile `graph_engine` for the host platform (`g++ -std=c++17 -O2 ... -o cpp/bin/graph_engine`) during the container build step.
2. **Serverless Hosting (Vercel)**:
   * If deployed on AWS Lambda / Vercel Serverless Functions, compile a Linux ELF binary statically (`-static`) or bundle it into the serverless deployment package.
   * `process.env.CPP_GRAPH_ENGINE_PATH` can point to the custom binary path.
   * If native execution is restricted by serverless sandbox permissions, the engine architecture allows compiling to WebAssembly (Wasm) with `emscripten` (`emcc`) to run in standard Node.js V8 runtimes without native binary dependencies.
