#include "GraphEngine.h"
#include <iostream>
#include <algorithm>
#include <cmath>
#include <chrono>

namespace PathPilot {

json AnalysisResult::toJson() const {
    json j;
    j["success"] = success;
    j["operation"] = operation;
    if (!error.empty()) {
        j["error"] = error;
    }
    j["hasCycle"] = hasCycle;
    j["vertexCount"] = vertexCount;
    j["edgeCount"] = edgeCount;
    j["processedCount"] = processedCount;

    json orderJson = json::array();
    for (const auto& v : learningOrder) {
        orderJson.push_back(v.toJson());
    }
    j["learningOrder"] = orderJson;

    json cpJson = json::array();
    for (const auto& v : criticalPath) {
        cpJson.push_back(v.toJson());
    }
    j["criticalPath"] = cpJson;
    j["criticalPathCodes"] = criticalPathCodes;

    j["cycleNodes"] = cycleNodes;
    j["blockedNodes"] = blockedNodes;

    j["totalStudyHours"] = studyTimeEstimates.totalStudyHours;
    j["criticalPathHours"] = studyTimeEstimates.criticalPathHours;
    j["studyTimeEstimates"] = studyTimeEstimates.toJson();

    json edgesJson = json::array();
    for (const auto& e : edges) {
        edgesJson.push_back(e.toJson());
    }
    j["edges"] = edgesJson;

    return j;
}

int DirectedGraph::addVertex(const CourseVertex& vertex) {
    CourseVertex v = vertex;
    int idx = static_cast<int>(vertices_.size());
    v.index = idx;
    vertices_.push_back(v);

    if (!v.id.empty()) {
        idToIndex_[v.id] = idx;
    }
    if (!v.code.empty()) {
        codeToIndex_[v.code] = idx;
    }

    adj_.emplace_back();
    revAdj_.emplace_back();
    inDegree_.push_back(0);
    return idx;
}

bool DirectedGraph::addEdge(int u, int v, const std::string& fromCode, const std::string& toCode) {
    int n = getVertexCount();
    if (u < 0 || u >= n || v < 0 || v >= n) {
        return false;
    }
    if (u == v) {
        // Self-loop is not allowed
        return false;
    }

    auto edgePair = std::make_pair(u, v);
    if (edgeSet_.find(edgePair) != edgeSet_.end()) {
        // Duplicate edge; ignore gracefully
        return true;
    }

    edgeSet_.insert(edgePair);
    adj_[u].push_back(v);
    revAdj_[v].push_back(u);
    inDegree_[v]++;

    PrereqEdge edge;
    edge.u = u;
    edge.v = v;
    edge.fromCode = fromCode.empty() ? (vertices_[u].code) : fromCode;
    edge.toCode = toCode.empty() ? (vertices_[v].code) : toCode;
    edges_.push_back(edge);
    return true;
}

int DirectedGraph::findIndexById(const std::string& id) const {
    auto it = idToIndex_.find(id);
    if (it != idToIndex_.end()) {
        return it->second;
    }
    return -1;
}

int DirectedGraph::findIndexByCode(const std::string& code) const {
    auto it = codeToIndex_.find(code);
    if (it != codeToIndex_.end()) {
        return it->second;
    }
    return -1;
}

const CourseVertex* DirectedGraph::getVertex(int index) const {
    if (index >= 0 && index < static_cast<int>(vertices_.size())) {
        return &vertices_[index];
    }
    return nullptr;
}

// Algorithm B: Goal-based prerequisite extraction via Reverse BFS
DirectedGraph DirectedGraph::extractPrerequisiteSubgraph(const std::vector<int>& targetIndices) const {
    DirectedGraph subGraph;
    if (targetIndices.empty() || vertices_.empty()) {
        return subGraph;
    }

    std::set<int> reachable;
    std::queue<int> q;

    for (int t : targetIndices) {
        if (t >= 0 && t < getVertexCount()) {
            if (reachable.insert(t).second) {
                q.push(t);
            }
        }
    }

    // Traverse upstream along prerequisite edges (reverse adjacency)
    while (!q.empty()) {
        int curr = q.front();
        q.pop();

        for (int parent : revAdj_[curr]) {
            if (reachable.insert(parent).second) {
                q.push(parent);
            }
        }
    }

    // Build the induced subgraph
    // Map original indices to new continuous indices in induced subgraph
    std::unordered_map<int, int> origToNew;
    // Keep deterministic vertex ordering by original index
    std::vector<int> sortedIndices(reachable.begin(), reachable.end());
    std::sort(sortedIndices.begin(), sortedIndices.end());

    for (int oldIdx : sortedIndices) {
        CourseVertex copy = vertices_[oldIdx];
        int newIdx = subGraph.addVertex(copy);
        origToNew[oldIdx] = newIdx;
    }

    // Add all edges where both endpoints are in the induced set
    for (const auto& e : edges_) {
        if (origToNew.find(e.u) != origToNew.end() && origToNew.find(e.v) != origToNew.end()) {
            subGraph.addEdge(origToNew[e.u], origToNew[e.v], e.fromCode, e.toCode);
        }
    }

    return subGraph;
}

// Algorithm C & D: Kahn's Topological Sorting and Cycle Detection
std::pair<std::vector<CourseVertex>, bool> DirectedGraph::computeTopologicalSort(
    std::vector<std::string>& outCycleNodes,
    std::vector<std::string>& outBlockedNodes
) const {
    int n = getVertexCount();
    outCycleNodes.clear();
    outBlockedNodes.clear();

    if (n == 0) {
        return {{}, false};
    }

    std::vector<int> currentInDegree = inDegree_;
    std::vector<int> nodeLevel(n, 0);

    // Min-heap priority queue for deterministic ordering by course code
    auto comp = [this](int a, int b) {
        const std::string& codeA = vertices_[a].code;
        const std::string& codeB = vertices_[b].code;
        if (codeA != codeB) {
            return codeA > codeB; // Greater returns true so smaller code pops first
        }
        return a > b;
    };
    std::priority_queue<int, std::vector<int>, decltype(comp)> pq(comp);

    for (int i = 0; i < n; ++i) {
        if (currentInDegree[i] == 0) {
            pq.push(i);
        }
    }

    std::vector<CourseVertex> order;
    order.reserve(n);

    while (!pq.empty()) {
        int u = pq.top();
        pq.pop();

        CourseVertex v = vertices_[u];
        v.level = nodeLevel[u];
        order.push_back(v);

        for (int neighbor : adj_[u]) {
            nodeLevel[neighbor] = std::max(nodeLevel[neighbor], nodeLevel[u] + 1);
            currentInDegree[neighbor]--;
            if (currentInDegree[neighbor] == 0) {
                pq.push(neighbor);
            }
        }
    }

    bool hasCycle = (static_cast<int>(order.size()) < n);

    if (hasCycle) {
        // Diagnose nodes in cycle vs blocked nodes
        // Nodes with currentInDegree[i] > 0 cannot be resolved.
        // We find actual cycle members using DFS cycle detection on remaining nodes.
        std::vector<int> state(n, 0); // 0 = unvisited, 1 = visiting (in stack), 2 = visited
        std::set<int> inCycleSet;

        auto dfsFindCycle = [&](auto& self, int u, std::vector<int>& path) -> void {
            state[u] = 1;
            path.push_back(u);

            for (int v : adj_[u]) {
                if (currentInDegree[v] == 0) continue; // Skip already cleared nodes
                if (state[v] == 1) {
                    // Back-edge found! Collect all nodes in this cycle loop
                    auto it = std::find(path.begin(), path.end(), v);
                    while (it != path.end()) {
                        inCycleSet.insert(*it);
                        ++it;
                    }
                } else if (state[v] == 0) {
                    self(self, v, path);
                }
            }

            path.pop_back();
            state[u] = 2;
        };

        for (int i = 0; i < n; ++i) {
            if (currentInDegree[i] > 0 && state[i] == 0) {
                std::vector<int> path;
                dfsFindCycle(dfsFindCycle, i, path);
            }
        }

        for (int i = 0; i < n; ++i) {
            if (currentInDegree[i] > 0) {
                if (inCycleSet.find(i) != inCycleSet.end()) {
                    outCycleNodes.push_back(vertices_[i].code);
                } else {
                    outBlockedNodes.push_back(vertices_[i].code);
                }
            }
        }
    }

    return {order, hasCycle};
}

// Algorithm E: Critical Path and Study Time Analysis
StudyTimeEstimates DirectedGraph::computeCriticalPath(
    const std::vector<CourseVertex>& topoOrder,
    std::vector<CourseVertex>& outCriticalPath,
    std::vector<std::string>& outCriticalPathCodes,
    int weeklyStudyHours
) const {
    StudyTimeEstimates estimates;
    int n = getVertexCount();
    estimates.weeklyStudyHours = (weeklyStudyHours > 0) ? weeklyStudyHours : 10;
    outCriticalPath.clear();
    outCriticalPathCodes.clear();

    if (n == 0 || topoOrder.empty()) {
        estimates.explanation = "Graph is empty; study time is 0 hours.";
        return estimates;
    }

    int totalHours = 0;
    for (const auto& v : vertices_) {
        totalHours += v.estimatedHours;
    }
    estimates.totalStudyHours = totalHours;

    // Dynamic programming on DAG along topological order
    // dist[u] = longest prerequisite path hours ending at vertex u
    std::vector<int> dist(n, 0);
    std::vector<int> parent(n, -1);

    for (int i = 0; i < n; ++i) {
        dist[i] = vertices_[i].estimatedHours;
    }

    for (const auto& vNode : topoOrder) {
        int u = vNode.index;
        for (int v : adj_[u]) {
            int candidate = dist[u] + vertices_[v].estimatedHours;
            if (candidate > dist[v]) {
                dist[v] = candidate;
                parent[v] = u;
            }
        }
    }

    // Find end vertex of maximum path
    int maxEnd = 0;
    int maxDist = dist[0];
    for (int i = 1; i < n; ++i) {
        if (dist[i] > maxDist) {
            maxDist = dist[i];
            maxEnd = i;
        }
    }

    estimates.criticalPathHours = maxDist;

    // Reconstruct critical path from parent pointers
    std::vector<int> pathIndices;
    int curr = maxEnd;
    while (curr != -1) {
        pathIndices.push_back(curr);
        curr = parent[curr];
    }
    std::reverse(pathIndices.begin(), pathIndices.end());

    for (int idx : pathIndices) {
        outCriticalPath.push_back(vertices_[idx]);
        outCriticalPathCodes.push_back(vertices_[idx].code);
    }

    estimates.serialEstimatedWeeks = static_cast<int>(std::ceil(
        static_cast<double>(estimates.totalStudyHours) / estimates.weeklyStudyHours
    ));
    estimates.parallelEstimatedWeeks = static_cast<int>(std::ceil(
        static_cast<double>(estimates.criticalPathHours) / estimates.weeklyStudyHours
    ));

    estimates.explanation =
        "Total study hours (" + std::to_string(estimates.totalStudyHours) + "h) represents the full cumulative workload. "
        "Critical-path duration (" + std::to_string(estimates.criticalPathHours) + "h) represents the longest prerequisite bottleneck chain, "
        "providing the dependency-constrained minimum study time if non-dependent courses are studied concurrently.";

    return estimates;
}

AnalysisResult DirectedGraph::analyze(
    const std::string& operation,
    const std::vector<int>& targetIndices,
    int weeklyStudyHours
) const {
    AnalysisResult result;
    result.operation = operation;

    // If goal-roadmap operation with targetIndices is requested, extract subgraph first
    if (operation == "goal-roadmap" && !targetIndices.empty()) {
        DirectedGraph sub = extractPrerequisiteSubgraph(targetIndices);
        return sub.analyze("goal-roadmap", {}, weeklyStudyHours);
    }

    result.vertexCount = getVertexCount();
    result.edgeCount = getEdgeCount();
    result.edges = edges_;

    if (result.vertexCount == 0) {
        result.success = true;
        result.hasCycle = false;
        result.processedCount = 0;
        result.studyTimeEstimates = computeCriticalPath({}, result.criticalPath, result.criticalPathCodes, weeklyStudyHours);
        return result;
    }

    auto topoRes = computeTopologicalSort(result.cycleNodes, result.blockedNodes);
    bool hasCycle = topoRes.second;
    const auto& order = topoRes.first;

    result.hasCycle = hasCycle;
    result.processedCount = static_cast<int>(order.size());

    if (hasCycle) {
        result.success = false;
        result.error = "Directed cycle detected in prerequisite graph. Complete topological ordering is impossible.";
        return result;
    }

    result.learningOrder = order;
    result.studyTimeEstimates = computeCriticalPath(
        order,
        result.criticalPath,
        result.criticalPathCodes,
        weeklyStudyHours
    );

    result.success = true;
    return result;
}

DirectedGraph DirectedGraph::fromJson(const json& root, std::string& outError) {
    DirectedGraph graph;
    outError.clear();

    if (!root.contains("vertices") || !root["vertices"].is_array()) {
        outError = "Missing or invalid 'vertices' array in input JSON.";
        return graph;
    }

    const auto& verticesJson = root["vertices"];
    std::unordered_map<std::string, int> inputKeyToEngineIndex;

    for (size_t i = 0; i < verticesJson.size(); ++i) {
        const auto& vj = verticesJson[i];
        if (!vj.is_object()) {
            outError = "Vertex at index " + std::to_string(i) + " is not an object.";
            return graph;
        }

        CourseVertex v = CourseVertex::fromJson(vj, static_cast<int>(i));
        int assignedIdx = graph.addVertex(v);

        if (vj.contains("index") && vj["index"].is_number_integer()) {
            int originalIdx = vj["index"].get<int>();
            inputKeyToEngineIndex[std::to_string(originalIdx)] = assignedIdx;
        }
        if (!v.id.empty()) {
            inputKeyToEngineIndex[v.id] = assignedIdx;
        }
        if (!v.code.empty()) {
            inputKeyToEngineIndex[v.code] = assignedIdx;
        }
    }

    if (root.contains("edges") && root["edges"].is_array()) {
        const auto& edgesJson = root["edges"];
        for (size_t i = 0; i < edgesJson.size(); ++i) {
            const auto& ej = edgesJson[i];
            if (!ej.is_object()) {
                outError = "Edge at index " + std::to_string(i) + " is not an object.";
                return graph;
            }

            int u = -1;
            int v = -1;
            std::string fromCode;
            std::string toCode;

            if (ej.contains("u") && ej["u"].is_number_integer() &&
                ej.contains("v") && ej["v"].is_number_integer()) {
                int rawU = ej["u"].get<int>();
                int rawV = ej["v"].get<int>();

                // Check direct range or mapping
                if (inputKeyToEngineIndex.find(std::to_string(rawU)) != inputKeyToEngineIndex.end()) {
                    u = inputKeyToEngineIndex[std::to_string(rawU)];
                } else if (rawU >= 0 && rawU < graph.getVertexCount()) {
                    u = rawU;
                }

                if (inputKeyToEngineIndex.find(std::to_string(rawV)) != inputKeyToEngineIndex.end()) {
                    v = inputKeyToEngineIndex[std::to_string(rawV)];
                } else if (rawV >= 0 && rawV < graph.getVertexCount()) {
                    v = rawV;
                }
            } else if (ej.contains("fromCode") && ej.contains("toCode")) {
                fromCode = ej["fromCode"].get<std::string>();
                toCode = ej["toCode"].get<std::string>();
                u = graph.findIndexByCode(fromCode);
                v = graph.findIndexByCode(toCode);
            } else if (ej.contains("from") && ej.contains("to")) {
                std::string fromId = ej["from"].get<std::string>();
                std::string toId = ej["to"].get<std::string>();
                u = graph.findIndexById(fromId);
                v = graph.findIndexById(toId);
            }

            if (ej.contains("fromCode") && fromCode.empty()) {
                fromCode = ej["fromCode"].get<std::string>();
            }
            if (ej.contains("toCode") && toCode.empty()) {
                toCode = ej["toCode"].get<std::string>();
            }

            if (u < 0 || u >= graph.getVertexCount()) {
                outError = "Invalid source vertex endpoint in edge " + std::to_string(i) + " (u=" + std::to_string(u) + ").";
                return graph;
            }
            if (v < 0 || v >= graph.getVertexCount()) {
                outError = "Invalid destination vertex endpoint in edge " + std::to_string(i) + " (v=" + std::to_string(v) + ").";
                return graph;
            }

            if (!graph.addEdge(u, v, fromCode, toCode)) {
                outError = "Failed to add edge " + std::to_string(i) + " between " + std::to_string(u) + " and " + std::to_string(v) + " (possible self-loop).";
                return graph;
            }
        }
    }

    return graph;
}

json GraphEngine::processJson(const std::string& inputJsonString, int& outStatusCode) {
    auto startTime = std::chrono::high_resolution_clock::now();
    outStatusCode = 0;

    json root;
    try {
        root = json::parse(inputJsonString);
    } catch (const json::parse_error& e) {
        outStatusCode = 1;
        json errJson;
        errJson["success"] = false;
        errJson["error"] = std::string("JSON parse error: ") + e.what();
        errJson["hasCycle"] = false;
        errJson["vertexCount"] = 0;
        errJson["edgeCount"] = 0;
        return errJson;
    }

    std::string parseError;
    DirectedGraph graph = DirectedGraph::fromJson(root, parseError);

    if (!parseError.empty()) {
        outStatusCode = 1;
        json errJson;
        errJson["success"] = false;
        errJson["error"] = parseError;
        errJson["hasCycle"] = false;
        errJson["vertexCount"] = graph.getVertexCount();
        errJson["edgeCount"] = graph.getEdgeCount();
        return errJson;
    }

    std::string operation = root.value("operation", "analyze");
    int weeklyStudyHours = root.value("weeklyStudyHours", 10);

    std::vector<int> targetIndices;
    if (root.contains("targetIndices") && root["targetIndices"].is_array()) {
        for (const auto& item : root["targetIndices"]) {
            if (item.is_number_integer()) {
                targetIndices.push_back(item.get<int>());
            }
        }
    }
    if (root.contains("targetCodes") && root["targetCodes"].is_array()) {
        for (const auto& item : root["targetCodes"]) {
            if (item.is_string()) {
                int idx = graph.findIndexByCode(item.get<std::string>());
                if (idx != -1) {
                    targetIndices.push_back(idx);
                }
            }
        }
    }
    if (root.contains("targetIds") && root["targetIds"].is_array()) {
        for (const auto& item : root["targetIds"]) {
            if (item.is_string()) {
                int idx = graph.findIndexById(item.get<std::string>());
                if (idx != -1) {
                    targetIndices.push_back(idx);
                }
            }
        }
    }

    AnalysisResult result = graph.analyze(operation, targetIndices, weeklyStudyHours);

    if (result.hasCycle) {
        outStatusCode = 2; // Nonzero status on cycle
    } else if (!result.success) {
        outStatusCode = 1;
    }

    json output = result.toJson();

    auto endTime = std::chrono::high_resolution_clock::now();
    double elapsedMs = std::chrono::duration<double, std::milli>(endTime - startTime).count();
    output["diagnostics"] = {
        {"executionTimeMs", elapsedMs},
        {"nodesAnalyzed", result.vertexCount},
        {"edgesAnalyzed", result.edgeCount}
    };

    return output;
}

} // namespace PathPilot
