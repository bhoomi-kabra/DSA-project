export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#ffffff",
        color: "#18181b",
        padding: "60px 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "760px", width: "100%" }}>
        {/* Status Pill */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "4px 12px",
            borderRadius: "9999px",
            backgroundColor: "#f4f4f5",
            border: "1px solid #e4e4e7",
            fontSize: "13px",
            fontWeight: 500,
            color: "#16a34a",
            marginBottom: "20px",
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "#16a34a",
              display: "inline-block",
            }}
          />
          Backend Services Online &bull; Member 3
        </div>

        <h1
          style={{
            fontSize: "36px",
            fontWeight: 700,
            letterSpacing: "-0.025em",
            margin: "0 0 12px 0",
            color: "#09090b",
          }}
        >
          PathPilot &bull; Backend & Database Core
        </h1>

        <p
          style={{
            fontSize: "16px",
            lineHeight: "1.6",
            color: "#71717a",
            margin: "0 0 32px 0",
          }}
        >
          Prisma ORM &times; Neon Serverless PostgreSQL &times; Next.js App Router.
          Directed Acyclic Graph (DAG) course prerequisite models and knowledge-aware roadmap engine.
        </p>

        {/* API Routes Box */}
        <div
          style={{
            backgroundColor: "#fafafa",
            border: "1px solid #e4e4e7",
            borderRadius: "12px",
            padding: "24px",
            marginBottom: "32px",
          }}
        >
          <h2
            style={{
              fontSize: "16px",
              fontWeight: 600,
              margin: "0 0 16px 0",
              color: "#27272a",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Live Backend API Endpoints
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <EndpointLink
              method="GET"
              path="/api/health"
              description="Database connectivity and node/edge count metrics"
            />
            <EndpointLink
              method="GET"
              path="/api/graph"
              description="Complete DAG course adjacency list, nodes, and directed edges"
            />
            <EndpointLink
              method="GET"
              path="/api/graph?goal=machine-learning-engineer"
              description="Feature 1: Goal-based prerequisite subgraph extraction"
            />
            <EndpointLink
              method="GET"
              path="/api/graph?format=cpp"
              description="Raw edge-list format ready for teammate's C++ Graph Engine"
            />
            <EndpointLink
              method="GET"
              path="/api/goals"
              description="Available career paths with milestone capstones"
            />
            <EndpointLink
              method="GET"
              path="/api/user/progress"
              description="Feature 2: Knowledge-aware unlocked vs locked courses"
            />
          </div>
        </div>

        {/* Team Integration Guide */}
        <div
          style={{
            borderTop: "1px solid #f4f4f5",
            paddingTop: "24px",
            fontSize: "14px",
            color: "#a1a1aa",
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <span>Frontend Teammate: Connect UI to <code>/api/*</code></span>
          <span>C++ Teammate: Consume <code>/api/graph?format=cpp</code></span>
        </div>
      </div>
    </main>
  );
}

function EndpointLink({
  method,
  path,
  description,
}: {
  method: string;
  path: string;
  description: string;
}) {
  return (
    <a
      href={path}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex",
        flexDirection: "column",
        textDecoration: "none",
        padding: "12px 16px",
        borderRadius: "8px",
        backgroundColor: "#ffffff",
        border: "1px solid #e4e4e7",
        transition: "border-color 0.15s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            padding: "2px 6px",
            borderRadius: "4px",
            backgroundColor: method === "GET" ? "#dcfce7" : "#dbeafe",
            color: method === "GET" ? "#15803d" : "#1d4ed8",
          }}
        >
          {method}
        </span>
        <code style={{ fontSize: "14px", fontWeight: 600, color: "#09090b" }}>
          {path}
        </code>
      </div>
      <span style={{ fontSize: "13px", color: "#71717a" }}>{description}</span>
    </a>
  );
}
