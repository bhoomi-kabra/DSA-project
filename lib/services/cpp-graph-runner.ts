import { spawn } from "child_process";
import path from "path";
import fs from "fs";

if (typeof window !== "undefined") {
  throw new Error("CppGraphRunner can only be executed in server-side environments.");
}

export interface CppInputVertex {
  index?: number;
  id: string;
  code: string;
  title: string;
  estimatedHours: number;
  category?: string;
}

export interface CppInputEdge {
  u?: number;
  v?: number;
  from?: string;
  to?: string;
  fromCode?: string;
  toCode?: string;
}

export interface CppGraphInput {
  operation?: "goal-roadmap" | "topological-sort" | "analyze" | "trace" | "max-flow";
  weeklyStudyHours?: number;
  recordSteps?: boolean;
  targetIndices?: number[];
  targetCodes?: string[];
  targetIds?: string[];
  vertices: CppInputVertex[];
  edges: CppInputEdge[];
}

export interface CppVertexOutput {
  index: number;
  id: string;
  code: string;
  title: string;
  estimatedHours: number;
  category: string;
  level: number;
}

export interface CppStudyTimeEstimates {
  totalStudyHours: number;
  criticalPathHours: number;
  weeklyStudyHours: number;
  serialEstimatedWeeks: number;
  parallelEstimatedWeeks: number;
  explanation: string;
}

export interface CppAlgorithmStep {
  stepNumber: number;
  type: string;
  description: string;
  activeNodeCode?: string;
  targetNodeCode?: string;
  queueState: string[];
  inDegrees: Record<string, number>;
  currentOrder: string[];
}

export interface CppMaxFlowEdge {
  from: number;
  to: number;
  capacity: number;
  flow: number;
  fromLabel: string;
  toLabel: string;
  isBottleneck: boolean;
}

export interface CppMaxFlowResult {
  success: boolean;
  sourceCapacity: number;
  maxFlow: number;
  utilizationPercent: number;
  minCutBottlenecks: string[];
  recommendedCourses: string[];
  overloadedCourses: string[];
  flowNetwork: CppMaxFlowEdge[];
  diagnosis: string;
}

export interface CppAnalysisResult {
  success: boolean;
  operation: string;
  error?: string;
  hasCycle: boolean;
  vertexCount: number;
  edgeCount: number;
  processedCount: number;
  learningOrder: CppVertexOutput[];
  criticalPath: CppVertexOutput[];
  criticalPathCodes: string[];
  cycleNodes: string[];
  blockedNodes: string[];
  totalStudyHours: number;
  criticalPathHours: number;
  studyTimeEstimates: CppStudyTimeEstimates;
  edges: Array<{ u: number; v: number; fromCode: string; toCode: string }>;
  steps?: CppAlgorithmStep[];
  maxFlow?: CppMaxFlowResult;
  diagnostics?: {
    executionTimeMs: number;
    nodesAnalyzed: number;
    edgesAnalyzed: number;
  };
}

export interface CppRunnerOptions {
  timeoutMs?: number;
  executablePath?: string;
}

/**
 * Resolves the path to the compiled C++ Graph Engine binary.
 */
export function resolveCppBinaryPath(customPath?: string): string {
  if (customPath && fs.existsSync(customPath)) {
    return path.resolve(customPath);
  }

  if (process.env.CPP_GRAPH_ENGINE_PATH && fs.existsSync(process.env.CPP_GRAPH_ENGINE_PATH)) {
    return path.resolve(process.env.CPP_GRAPH_ENGINE_PATH);
  }

  const isWindows = process.platform === "win32";
  const binaryName = isWindows ? "graph_engine.exe" : "graph_engine";

  const candidates = [
    path.join(process.cwd(), "cpp", "bin", binaryName),
    path.join(process.cwd(), "cpp", "build", binaryName),
    path.join(process.cwd(), "cpp", "build", "Release", binaryName),
    path.join(process.cwd(), "cpp", "bin", "graph_engine"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return path.resolve(candidate);
    }
  }

  return path.join(process.cwd(), "cpp", "bin", binaryName);
}

/**
 * Executes the C++ Graph Algorithm Engine with the provided graph data via stdin/stdout.
 */
export async function runCppGraphEngine(
  input: CppGraphInput,
  options: CppRunnerOptions = {}
): Promise<CppAnalysisResult> {
  const binaryPath = resolveCppBinaryPath(options.executablePath);
  const timeoutMs = options.timeoutMs ?? 5000;

  if (!fs.existsSync(binaryPath)) {
    const isWindows = process.platform === "win32";
    const compileCmd = isWindows
      ? "npm run cpp:build"
      : "g++ -std=c++17 -O2 -I cpp/include cpp/src/GraphEngine.cpp cpp/src/main.cpp -o cpp/bin/graph_engine";

    throw new Error(
      `C++ Graph Engine executable not found at '${binaryPath}'. ` +
      `Please build the engine first by running: '${compileCmd}'`
    );
  }

  return new Promise<CppAnalysisResult>((resolve, reject) => {
    let stdoutBuffer = "";
    let stderrBuffer = "";
    let isSettled = false;

    const child = spawn(binaryPath, [], {
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    });

    const timer = setTimeout(() => {
      if (!isSettled) {
        isSettled = true;
        child.kill("SIGKILL");
        reject(new Error(`C++ Graph Engine timed out after ${timeoutMs}ms.`));
      }
    }, timeoutMs);

    child.stdout.on("data", (chunk: Buffer) => {
      stdoutBuffer += chunk.toString("utf8");
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderrBuffer += chunk.toString("utf8");
    });

    child.on("error", (err) => {
      if (!isSettled) {
        isSettled = true;
        clearTimeout(timer);
        reject(new Error(`Failed to spawn C++ Graph Engine: ${err.message}`));
      }
    });

    child.on("close", (code) => {
      if (isSettled) return;
      isSettled = true;
      clearTimeout(timer);

      if (!stdoutBuffer.trim()) {
        reject(
          new Error(
            `C++ engine returned empty output. Exit code: ${code}. Stderr: ${stderrBuffer.trim()}`
          )
        );
        return;
      }

      try {
        const parsed: CppAnalysisResult = JSON.parse(stdoutBuffer);

        // Code 2 is returned when a directed cycle is detected
        if (code === 2 || parsed.hasCycle) {
          resolve(parsed);
          return;
        }

        if (code !== 0 && !parsed.success) {
          reject(new Error(parsed.error || `C++ engine exited with code ${code}`));
          return;
        }

        resolve(parsed);
      } catch (jsonErr: any) {
        reject(
          new Error(
            `Failed to parse C++ engine JSON response: ${jsonErr.message}. Output was: ${stdoutBuffer.slice(
              0,
              200
            )}`
          )
        );
      }
    });

    try {
      const serialized = JSON.stringify(input);
      child.stdin.write(serialized);
      child.stdin.end();
    } catch (writeErr: any) {
      if (!isSettled) {
        isSettled = true;
        clearTimeout(timer);
        child.kill();
        reject(new Error(`Failed to send data to C++ Graph Engine stdin: ${writeErr.message}`));
      }
    }
  });
}
