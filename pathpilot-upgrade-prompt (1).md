# TASK: Upgrade PathPilot for a DSA competition (demo is TOMORROW)

Repo: https://github.com/bhoomi-kabra/DSA-project
Stack: Next.js (App Router) + TypeScript + Prisma + Neon Postgres + React Flow + native C++ graph engine (`cpp/`).
Goal: make the app look polished and consistent, make the roadmap graph readable, make it truly personal per student, let students save/export their roadmap, and give every course real learning links. Judges care about DSA, so the algorithms must be visible and impressive, not hidden.

## RULES
- Do NOT break the C++ engine, `/api/graph`, `/api/graph/analyze`, `/api/user/progress`, or the existing tests (`npm run cpp:test`, `npm run test:integration`). Run them after your changes.
- Work in priority order (P0 -> P1 -> P2). Finish and verify each P0 item before starting P1. Commit after each step.
- Before editing anything, do STEP 0 and post your findings.

## STEP 0: AUDIT (read before changing)
Inspect `app/`, `components/`, `styles/`, `lib/`, `data/`, `prisma/`. Report:
1. Where theme colors come from. Are any colors hardcoded (hex/Tailwind dark classes) instead of CSS variables? Is the dark-mode toggle wired to the whole app or only some components?
2. How the roadmap graph computes node positions (manual coordinates? levels?). How `fitView` is configured and how tall the container is.
3. Where the numbers "4 Completed, 40 Remaining, 100h Logged, 12d Streak" and the "Sample data" chip come from (hardcoded or DB?).
4. Which userId the UI uses. Is there any auth, or is one demo user shared by everyone?
5. Whether "In Progress" exists anywhere in the DB or only in UI mock data.

## KNOWN PROBLEMS (from screenshots)
1. MIXED THEMES: the page is light/cream, but the roadmap toolbar and nodes use dark navy/grey cards and a light canvas. Result: dark blocks inside a light page.
2. INVISIBLE HEADING: "My Learning Roadmap" is white text on a cream background. It is nearly unreadable (dark-mode text color applied in light mode).
3. GRAPH UNREADABLE: node text is about 7-8px because fitView scales a huge graph down; there is a lot of empty space; the Full Stack graph is cropped at the bottom/right; edges run straight through other nodes (e.g. a line crosses Linear Algebra and Probability); badges ("READY", "25h") overlap the category label; locked nodes are low-contrast grey.
4. INCONSISTENT DATA: the Roadmap says Probability is "Done" while My Progress says "In Progress" and ML shows 2/15. Overview says 4 completed. These come from different sources (My Progress is sample data). There must be ONE source of truth: the database.
5. NOT PERSONAL: sidebar shows a fixed "Student Workspace / CS - 3rd Year" and Logout does nothing; streak and hours are fake.
6. Course cards (CS101...) have no links; nothing happens when a student wants to actually learn a course.

## P0-1: ONE DESIGN SYSTEM (light default, proper dark mode)
- Define ALL colors as CSS variables in `styles/` (`:root` for light, `[data-theme="dark"]` for dark). Replace every hardcoded color with `var(--...)`. Toggle sets `data-theme` on `<html>` and persists in localStorage; respect `prefers-color-scheme` on first visit.
- Light palette (keep the existing warm/cream identity): bg `#F7F5F0`, surface `#FFFFFF`, surface-2 `#F1EDE3`, border `#E4DFD2`, text `#1F2430`, text-muted `#5F6675`, primary `#8A5A00` (amber-brown), primary-soft `#F4E7C6`, accent `#5B5BD6` (indigo for graph/algorithm UI).
- Dark palette: bg `#12141A`, surface `#1B1E27`, surface-2 `#232733`, border `#2E3341`, text `#ECEEF3`, text-muted `#A3AAB8`, primary `#E0A93B`, accent `#8B8BFF`.
- Status colors (use in BOTH themes, with text contrast >= 4.5:1):
  - Completed: green `#2E7D5B` on `#E3F3EA` (dark: `#5FD3A0` on `#173226`)
  - In progress: blue `#2563EB` on `#E4ECFD` (dark: `#7AA7FF` on `#16233F`)
  - Ready to start: amber `#B7791F` on `#FBEFD3` (dark: `#F0C060` on `#3A2E12`)
  - Locked: grey `#6B7280` on `#EEF0F3`, dashed border, 70% opacity but text still readable
- The roadmap canvas, toolbar, nodes, edges, legend, minimap and tooltips must ALL use these variables so the whole page is one theme. No dark toolbar on a light page.
- Fix the invisible heading and audit every page (Overview, My Roadmap, My Courses, My Progress) in both themes. Minimum body text 14px, headings clear.

## P0-2: MAKE THE ROADMAP GRAPH READABLE AND ATTRACTIVE
- Use `dagre` (or `elkjs`) for automatic layout: `rankdir: "LR"`, `nodesep: 40`, `ranksep: 110`. Do not use manual coordinates. (Layout is only for drawing; the order/validity still comes from the C++ engine.)
- Fixed node size about 240x92. Title 14px/600 (2 lines max, ellipsis + full title in tooltip), course code and hours as small pills on ONE row, status badge top-right with no overlap. Category shown as a thin colored left border instead of tiny text.
- Edges: `smoothstep`, arrowheads, 1.5px, muted color. Edges must not pass behind nodes. Critical path edges (from Algorithm E) in the accent color, thicker.
- `fitView({ padding: 0.2 })`, `minZoom: 0.3`, `maxZoom: 1.5`, container height `calc(100vh - 260px)` (min 560px). A "Fit view" button must work. Initial view should show the whole graph at a readable size; if the graph is too wide, start zoomed on the first unlocked nodes instead of shrinking everything.
- Phase lanes: group nodes by topological level (from the engine) with labels "Phase 1 - Foundations", "Phase 2", ... drawn as subtle background bands.
- Interaction: hover or click a node -> highlight its ancestors and descendants (reverse/forward BFS), dim everything else. Click opens a right-side detail panel: description, hours, prerequisites, what it unlocks, resources (see P1-3), buttons Start / Mark done.
- Add React Flow `MiniMap`, `Controls`, and a small legend (Done / In progress / Ready / Locked / Critical path).
- Show a summary bar above the graph: total hours, remaining hours, critical-path hours, estimated finish date (remaining hours / weeklyStudyHours).
- Goal tabs (ML Engineer / Full Stack / Placement) keep working; switching goal re-runs the engine and re-fits the view.

## P0-3: SINGLE SOURCE OF TRUTH FOR PROGRESS
- Remove ALL hardcoded/sample numbers and the "Sample data" chip. Overview, My Courses, My Roadmap and My Progress must read from `/api/user/progress` for the current user.
- Add a real "In progress" state (see schema below). Streak and hours logged must be computed from real activity records, not constants. If a student has no activity yet, show 0 and an encouraging empty state.
- When a student marks a course done/started, all pages update (revalidate or shared client state) and the engine recomputes unlocked/locked.

## P0-4: SAVE / EXPORT THE ROADMAP
On the roadmap page add a "Save & Share" menu:
1. Download PNG (use `html-to-image` `toPng` on the React Flow viewport; follow the React Flow "download image" example using `getNodesBounds` + `getViewportForBounds` so the whole graph is exported, not only the visible part; white/theme background; 2x pixel ratio).
2. Download PDF (landscape; title, goal, date, the graph image, then the ordered course list with hours; use `jspdf`).
3. Download JSON (goal, order, nodes, edges, user progress).
4. Save to my account (stores a snapshot, see `SavedRoadmap`), shown under "My Roadmaps".
5. Copy share link: read-only page `/r/[slug]` that renders the saved snapshot without login.
Also add a print stylesheet so Ctrl+P gives a clean roadmap.

## P1-1: REAL PERSONALIZATION
- Onboarding wizard on first visit (3 steps): (a) name + year/branch, (b) choose goal, weekly study hours (slider 3-40), (c) checklist "Mark what you already know" (grouped by category). Saving it marks those courses completed, then the engine generates the personal roadmap. A student who already knows Python and DSA must see a shorter roadmap than a beginner.
- Auth: see the section "WIRE THE EXISTING LOGIN PAGE" below. Do NOT build a new login UI.
- "What-if" panel: "If I mark X as known, how many hours do I save?" Calls the engine with the changed set and shows the delta.

## WIRE THE EXISTING LOGIN PAGE (P0, do not redesign it)
A finished sign-in page already exists ("Sign in to PathPilot": email, password with show/hide, Forgot password?, Sign in, "Quick Student Demo (1-Click Direct Access)", "Create account", and a theme toggle). Find it in `app/` and KEEP its layout and styling. Only connect it to real logic:
1. Create account: add `passwordHash String?` to `User`. Add `POST /api/auth/register` (validate email format and password length >= 8, reject duplicate email, hash with `bcryptjs`, create the user with `onboarded=false`). Reuse the existing Create account form/screen; if it does not exist yet, match the sign-in page's style exactly.
2. Sign in: `POST /api/auth/login` verifies the bcrypt hash, then sets a signed httpOnly, sameSite=lax cookie (JWT via `jose`, 7-day expiry; secret from `AUTH_SECRET` in `.env` and `.env.example`). Show inline error messages ("Incorrect email or password") and a loading state on the button. Show/hide password button must work.
3. Quick Student Demo: one click logs in a seeded demo user (`demo@pathpilot.dev`) that has some completed courses and a goal, so the roadmap is already populated. Make the seed script idempotent. Optionally also a "reset demo data" action.
4. Protect the app: Next.js `middleware.ts` redirects unauthenticated users from Overview/Roadmap/Courses/Progress to the sign-in page, and redirects signed-in users away from the sign-in page. Add `GET /api/auth/me` and a small `useUser()` hook.
5. Replace every hardcoded user (the fixed userId and the "Student Workspace / CS - 3rd Year" block) with the session user: name or email initial in the avatar, real name in the sidebar, and `userId` taken from the session on the server, never from the client query string. `/api/user/progress` must use the session user.
6. Logout clears the cookie and returns to the sign-in page.
7. After first sign-in, if `onboarded=false`, send the user to the onboarding wizard (goal, weekly hours, "what I already know"), then to the roadmap.
8. "Forgot password?": for the demo, either hide it or show a short message ("Contact the admin to reset"). Do not leave a dead link.
9. Contrast bug on this page: the divider text "OR EXPLORE WITHOUT ACCOUNT" is almost invisible (light grey on cream) and the Quick Student Demo button's green text is too faint. Fix both with theme variables so text contrast is at least 4.5:1 in light and dark mode.
10. Never log passwords or return `passwordHash` from any API.

## P1-2: SCHEMA CHANGES (Prisma)
Do these as additive migrations; update `prisma/seed.ts` accordingly.
```prisma
enum ProgressStatus { NOT_STARTED IN_PROGRESS COMPLETED }
enum Level { BEGINNER INTERMEDIATE ADVANCED }
enum ResourceType { VIDEO COURSE DOCS PRACTICE BOOK }

model Course {
  // existing fields...
  level      Level  @default(BEGINNER)
  difficulty Int    @default(1)      // 1-5
  resources  CourseResource[]
}

model StudentProgress {
  // replace isCompleted with:
  status      ProgressStatus @default(NOT_STARTED)
  startedAt   DateTime?
  completedAt DateTime?
  hoursSpent  Int            @default(0)
}

model CourseResource {
  id        String       @id @default(uuid())
  courseId  String
  title     String
  provider  String       // e.g. "freeCodeCamp", "MIT OCW", "YouTube"
  url       String
  type      ResourceType
  isFree    Boolean      @default(true)
  hours     Int?
  isPrimary Boolean      @default(false)
  course    Course       @relation(fields: [courseId], references: [id], onDelete: Cascade)
  @@index([courseId])
}

model StudyLog {            // real hours + streak
  id       String   @id @default(uuid())
  userId   String
  courseId String?
  hours    Float
  date     DateTime @default(now())
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId, date])
}

model SavedRoadmap {
  id        String   @id @default(uuid())
  userId    String
  goalId    String
  name      String
  snapshot  Json     // order, nodes, edges, progress at save time
  shareSlug String   @unique
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  goal      Goal     @relation(fields: [goalId], references: [id], onDelete: Cascade)
}

model User {
  // add: image String?, yearOfStudy Int?, branch String?, onboarded Boolean @default(false)
  // relations: studyLogs StudyLog[], savedRoadmaps SavedRoadmap[]
}
model Goal { // add: description String?, icon String?, color String?, saved SavedRoadmap[] }
```
Keep `isCompleted` working during the migration (derive it from `status === COMPLETED`) so the C++ bridge and tests do not break. Streak = consecutive days with a `StudyLog` or a `completedAt`.

## P1-3: COURSE RESOURCES AND REDIRECTS
- The codes like CS101/DEV204 are PathPilot's own module IDs, not a college's. Label them "Module" and show provider names on resources so it is honest and clear.
- Every course needs 2-3 `CourseResource` rows, exactly one `isPrimary`. Prefer free, stable, official sources: freeCodeCamp, MDN, CS50 (Harvard), MIT OpenCourseWare, NPTEL, official docs, Kaggle Learn, fast.ai, 3Blue1Brown / StatQuest playlists, NeetCode / LeetCode / Striver sheet for placement DSA. Paid platforms (Coursera, Udemy) only as optional links marked "Paid / audit free".
- Do NOT scrape other platforms and do NOT copy their descriptions or content. Store only: your own short description, the title, provider, URL and hours. Verify every URL opens (write `scripts/check-links.ts` that HEAD-requests each URL and prints failures; fix any 404 before the demo).
- UI: course card and detail panel get a "Start learning" button that opens the primary resource in a new tab (`target="_blank" rel="noopener noreferrer"`) AND sets status to IN_PROGRESS with `startedAt`. A "Resources" list shows all links with provider, type icon, free/paid tag. "Mark done" sets COMPLETED, unlocks dependents, and animates the newly unlocked nodes.
- Example seed rows (verify before use):
  - Programming Fundamentals with Python -> CS50P (cs50.harvard.edu/python) primary; freeCodeCamp Python
  - Linear Algebra & Matrix Methods -> 3Blue1Brown "Essence of Linear Algebra"; MIT OCW 18.06
  - Machine Learning Foundations -> Andrew Ng ML Specialization (Coursera, audit); Kaggle Learn Intro to ML
  - Data Structures -> NeetCode roadmap / freeCodeCamp DSA course
  - HTML5 & Modern Web -> MDN Learn Web Development; freeCodeCamp Responsive Web Design

## P1-4: DATA SUFFICIENCY
Current data (44 modules, 3 goals, 14-15 courses per goal) is enough for a demo IF each module has: a real description, hours, level, resources, and the prerequisite edges look sensible. Add: 8-10 more edges so graphs are not only chains (diamonds and joins make topological sort and critical path interesting), and ensure each goal has a visible branch and merge. Do not add more than ~10 new modules; quality over quantity.

## P0/P1: SHOW THE DSA (this is what judges score)
- Keep the "How Courses Unlock (Algorithm)" inspector and Study Hours Planner prominent. In the inspector show: step number, in-degree array, queue contents, popped node, with Play / Pause / Step / Speed controls.
- Put a small badge on each feature with its algorithm and complexity: "Kahn's topological sort O(V+E)", "Reverse BFS subgraph O(V+E)", "Cycle detection O(V+E)", "Critical path DP O(V+E)", "Edmonds-Karp max-flow O(VE^2)".
- Add a "Cycle detection demo" button: lets the user add a prerequisite edge (e.g. make an early course depend on a later one); the engine rejects it live, highlights the cycle in red, and explains why.
- Add an "Algorithm Lab" or "How it works" page: one section per algorithm, tiny animated example, the C++ function name, complexity, and the exact place it is used in the app.

## P2 (only if time remains)
- Weekly plan view: split the ordered courses into weeks using `weeklyStudyHours`, show a calendar-like board, export `.ics`.
- Badges/achievements for phases completed.
- Skeleton loaders and empty states everywhere; keyboard shortcuts; mobile layout for the roadmap (list view fallback under 768px).

## DEPLOY NOTE
Native C++ binaries do not run on Vercel serverless. For the competition, run locally (`npm run cpp:build && npm run dev`) and make sure it works offline except for the database. If hosting is wanted, add a TypeScript fallback implementation of the same algorithms behind the same API shape and use it when the C++ binary is not found.

## ACCEPTANCE CHECKLIST (verify and report)
- [ ] Every page is readable in light and dark; no dark-on-light or white-on-cream text; the toggle themes the whole app including the graph.
- [ ] Each roadmap shows the whole graph at a readable size; no cropped nodes; no edges through nodes; no overlapping badges.
- [ ] Numbers on Overview, Roadmap, Courses and Progress always match.
- [ ] Existing sign-in page is unchanged visually; Create account, Sign in, Quick Student Demo and Logout all work with the database.
- [ ] Unauthenticated visits to any app page redirect to sign-in.
- [ ] Two different users see different roadmaps/progress.
- [ ] PNG, PDF, JSON export work; saved roadmap reopens; share link works logged out.
- [ ] "Start learning" opens the real resource and sets In progress; "Mark done" unlocks the next courses.
- [ ] Cycle-detection demo and algorithm inspector work.
- [ ] `npm run cpp:test` and `npm run test:integration` pass.
- [ ] Final report: what changed, files touched, anything not finished.

## 5-MINUTE DEMO SCRIPT (make this flow smooth)
1. Sign in as a new student -> onboarding: pick ML Engineer, 10 h/week, tick "I know Python".
2. Roadmap appears, phases visible, finish date shown. Hover a node to highlight dependencies.
3. Open Algorithm Inspector and step through Kahn's algorithm.
4. Try to add a circular prerequisite -> cycle rejected live.
5. Mark a course done -> next nodes unlock, hours/finish date update.
6. Click Start learning -> real resource opens.
7. Export PNG/PDF and show the share link.
8. Open the Max-Flow planner: show the min-cut bottleneck at 5 vs 20 hours/week.
