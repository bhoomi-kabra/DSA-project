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

    if (!steps.empty()) {
        json stepsJson = json::array();
        for (const auto& step : steps) {
            stepsJson.push_back(step.toJson());
        }
        j["steps"] = stepsJson;
    }

    j["maxFlow"] = maxFlowResult.toJson();

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

std::pair<std::vector<CourseVertex>, bool> DirectedGraph::computeTopologicalSortWithSteps(
    std::vector<std::string>& outCycleNodes,
    std::vector<std::string>& outBlockedNodes,
    std::vector<AlgorithmStep>& outSteps
) const {
    outSteps.clear();
    int n = getVertexCount();
    outCycleNodes.clear();
    outBlockedNodes.clear();

    if (n == 0) {
        return {{}, false};
    }

    std::vector<int> currentInDegree = inDegree_;
    std::vector<int> nodeLevel(n, 0);

    auto comp = [this](int a, int b) {
        const std::string& codeA = vertices_[a].code;
        const std::string& codeB = vertices_[b].code;
        if (codeA != codeB) {
            return codeA > codeB;
        }
        return a > b;
    };
    std::priority_queue<int, std::vector<int>, decltype(comp)> pq(comp);

    auto getQueueCodes = [&]() {
        std::vector<std::string> qCodes;
        auto copyPq = pq;
        while (!copyPq.empty()) {
            qCodes.push_back(vertices_[copyPq.top()].code);
            copyPq.pop();
        }
        return qCodes;
    };

    auto getInDegreeMap = [&]() {
        std::unordered_map<std::string, int> degMap;
        for (int i = 0; i < n; ++i) {
            degMap[vertices_[i].code] = currentInDegree[i];
        }
        return degMap;
    };

    std::vector<std::string> currentOrderCodes;
    int stepCounter = 1;

    for (int i = 0; i < n; ++i) {
        if (currentInDegree[i] == 0) {
            pq.push(i);
        }
    }

    {
        AlgorithmStep s;
        s.stepNumber = stepCounter++;
        s.type = "INITIALIZE";
        s.description = "Calculated in-degrees for all " + std::to_string(n) + " courses. Found " +
                        std::to_string(pq.size()) + " foundational course(s) with in-degree 0.";
        s.queueState = getQueueCodes();
        s.inDegrees = getInDegreeMap();
        s.currentOrder = currentOrderCodes;
        outSteps.push_back(s);
    }

    std::vector<CourseVertex> order;
    order.reserve(n);

    while (!pq.empty()) {
        int u = pq.top();
        pq.pop();
        std::string uCode = vertices_[u].code;

        {
            AlgorithmStep s;
            s.stepNumber = stepCounter++;
            s.type = "POP_QUEUE";
            s.activeNodeCode = uCode;
            s.description = "Popped " + uCode + " from Priority Queue (all prerequisites completed). Processing downstream dependencies.";
            s.queueState = getQueueCodes();
            s.inDegrees = getInDegreeMap();
            s.currentOrder = currentOrderCodes;
            outSteps.push_back(s);
        }

        CourseVertex v = vertices_[u];
        v.level = nodeLevel[u];
        order.push_back(v);
        currentOrderCodes.push_back(uCode);

        for (int neighbor : adj_[u]) {
            std::string vCode = vertices_[neighbor].code;
            nodeLevel[neighbor] = std::max(nodeLevel[neighbor], nodeLevel[u] + 1);
            int prevDeg = currentInDegree[neighbor];
            currentInDegree[neighbor]--;
            int newDeg = currentInDegree[neighbor];

            {
                AlgorithmStep s;
                s.stepNumber = stepCounter++;
                s.type = "DECREMENT_INDEGREE";
                s.activeNodeCode = uCode;
                s.targetNodeCode = vCode;
                s.description = "Completed prerequisite " + uCode + " for " + vCode + ". Decremented in-degree: " +
                                std::to_string(prevDeg) + " → " + std::to_string(newDeg) + ".";
                s.queueState = getQueueCodes();
                s.inDegrees = getInDegreeMap();
                s.currentOrder = currentOrderCodes;
                outSteps.push_back(s);
            }

            if (currentInDegree[neighbor] == 0) {
                pq.push(neighbor);
                {
                    AlgorithmStep s;
                    s.stepNumber = stepCounter++;
                    s.type = "PUSH_QUEUE";
                    s.activeNodeCode = vCode;
                    s.targetNodeCode = vCode;
                    s.description = "All prerequisites satisfied for " + vCode + " (in-degree reached 0). Pushed to Queue!";
                    s.queueState = getQueueCodes();
                    s.inDegrees = getInDegreeMap();
                    s.currentOrder = currentOrderCodes;
                    outSteps.push_back(s);
                }
            }
        }

        {
            AlgorithmStep s;
            s.stepNumber = stepCounter++;
            s.type = "NODE_COMPLETED";
            s.activeNodeCode = uCode;
            s.description = "Appended " + uCode + " to the Topological Sequence.";
            s.queueState = getQueueCodes();
            s.inDegrees = getInDegreeMap();
            s.currentOrder = currentOrderCodes;
            outSteps.push_back(s);
        }
    }

    bool hasCycle = (static_cast<int>(order.size()) < n);

    if (hasCycle) {
        std::vector<int> state(n, 0);
        std::set<int> inCycleSet;

        auto dfsFindCycle = [&](auto& self, int u, std::vector<int>& path) -> void {
            state[u] = 1;
            path.push_back(u);

            for (int v : adj_[u]) {
                if (currentInDegree[v] == 0) continue;
                if (state[v] == 1) {
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

        AlgorithmStep s;
        s.stepNumber = stepCounter++;
        s.type = "CYCLE_DETECTED";
        s.description = "Queue became empty with " + std::to_string(n - order.size()) + " unresolved courses. Directed cycle detected!";
        s.queueState = getQueueCodes();
        s.inDegrees = getInDegreeMap();
        s.currentOrder = currentOrderCodes;
        outSteps.push_back(s);
    } else {
        AlgorithmStep s;
        s.stepNumber = stepCounter++;
        s.type = "FINISHED";
        s.description = "Topological sort completed successfully! All " + std::to_string(n) + " courses sequenced in optimal prerequisite order.";
        s.queueState = getQueueCodes();
        s.inDegrees = getInDegreeMap();
        s.currentOrder = currentOrderCodes;
        outSteps.push_back(s);
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

// Algorithm F: Maximum Flow & Min-Cut Student Cognitive Capacity Planner (Edmonds-Karp)
MaxFlowResult DirectedGraph::computeStudentCognitiveCapacity(
    int weeklyStudyHours,
    int semesterWeeks
) const {
    MaxFlowResult result;
    int n = getVertexCount();
    if (n == 0) {
        result.success = true;
        result.diagnosis = "No courses available in this roadmap to analyze capacity.";
        return result;
    }

    int pace = (weeklyStudyHours > 0) ? weeklyStudyHours : 15;
    int weeks = (semesterWeeks > 0) ? semesterWeeks : 12;
    int totalSemesterCapacity = pace * weeks;
    result.sourceCapacity = totalSemesterCapacity;

    std::unordered_map<std::string, int> categoryToHubIdx;
    std::vector<std::string> categories;
    for (const auto& v : vertices_) {
        std::string cat = v.category.empty() ? "General" : v.category;
        if (categoryToHubIdx.find(cat) == categoryToHubIdx.end()) {
            categoryToHubIdx[cat] = static_cast<int>(categories.size());
            categories.push_back(cat);
        }
    }

    int numCategories = static_cast<int>(categories.size());
    int source = 0;
    int sink = 1 + numCategories + n;
    int totalFlowNodes = sink + 1;

    std::vector<std::vector<int>> capacity(totalFlowNodes, std::vector<int>(totalFlowNodes, 0));
    std::vector<std::vector<int>> flow(totalFlowNodes, std::vector<int>(totalFlowNodes, 0));
    std::vector<std::vector<int>> flowAdj(totalFlowNodes);

    auto addFlowEdge = [&](int u, int v, int cap) {
        capacity[u][v] = cap;
        flowAdj[u].push_back(v);
        flowAdj[v].push_back(u);
    };

    int categoryMaxCap = std::max(60, static_cast<int>(std::round(totalSemesterCapacity * 0.55)));
    for (int c = 0; c < numCategories; ++c) {
        int catHubNode = 1 + c;
        addFlowEdge(source, catHubNode, categoryMaxCap);
    }

    for (int i = 0; i < n; ++i) {
        const auto& course = vertices_[i];
        std::string cat = course.category.empty() ? "General" : course.category;
        int catHubNode = 1 + categoryToHubIdx[cat];
        int courseNode = 1 + numCategories + i;

        int courseHours = std::max(15, course.estimatedHours);
        addFlowEdge(catHubNode, courseNode, courseHours);
        addFlowEdge(courseNode, sink, courseHours);
    }

    // Edmonds-Karp BFS Algorithm
    int maxFlow = 0;
    while (true) {
        std::vector<int> parent(totalFlowNodes, -1);
        std::queue<std::pair<int, int>> q;
        q.push({source, 1000000});
        parent[source] = source;

        int bottleneck = 0;
        while (!q.empty()) {
            int curr = q.front().first;
            int currentFlow = q.front().second;
            q.pop();

            if (curr == sink) {
                bottleneck = currentFlow;
                break;
            }

            for (int next : flowAdj[curr]) {
                int residual = capacity[curr][next] - flow[curr][next];
                if (parent[next] == -1 && residual > 0) {
                    parent[next] = curr;
                    int newFlow = std::min(currentFlow, residual);
                    q.push({next, newFlow});
                }
            }
        }

        if (bottleneck == 0) break;

        int curr = sink;
        while (curr != source) {
            int prev = parent[curr];
            flow[prev][curr] += bottleneck;
            flow[curr][prev] -= bottleneck;
            curr = prev;
        }

        maxFlow += bottleneck;
    }

    result.maxFlow = maxFlow;
    result.utilizationPercent = totalSemesterCapacity > 0 ?
        std::min(100, static_cast<int>(std::round((static_cast<double>(maxFlow) / totalSemesterCapacity) * 100.0))) : 0;

    // Min-Cut Computation via BFS in Residual Graph
    std::vector<bool> visited(totalFlowNodes, false);
    std::queue<int> cutQ;
    cutQ.push(source);
    visited[source] = true;

    while (!cutQ.empty()) {
        int u = cutQ.front();
        cutQ.pop();
        for (int v : flowAdj[u]) {
            if (!visited[v] && (capacity[u][v] - flow[u][v] > 0)) {
                visited[v] = true;
                cutQ.push(v);
            }
        }
    }

    std::set<std::string> cutBottlenecksSet;
    for (int u = 0; u < totalFlowNodes; ++u) {
        if (!visited[u]) continue;
        for (int v : flowAdj[u]) {
            if (!visited[v] && capacity[u][v] > 0) {
                std::string fromName, toName;
                if (u == source) fromName = "Student Budget (" + std::to_string(totalSemesterCapacity) + "h)";
                else if (u >= 1 && u <= numCategories) fromName = "Domain: " + categories[u - 1];
                else fromName = vertices_[u - 1 - numCategories].code;

                if (v == sink) toName = "Semester Target";
                else if (v >= 1 && v <= numCategories) toName = "Domain: " + categories[v - 1];
                else toName = vertices_[v - 1 - numCategories].code;

                cutBottlenecksSet.insert(fromName + " → " + toName + " (Cap: " + std::to_string(capacity[u][v]) + "h)");
            }
        }
    }

    for (const auto& b : cutBottlenecksSet) {
        result.minCutBottlenecks.push_back(b);
    }

    for (int i = 0; i < n; ++i) {
        int courseNode = 1 + numCategories + i;
        int courseCapacity = capacity[courseNode][sink];
        int courseFlow = flow[courseNode][sink];
        const auto& c = vertices_[i];

        if (courseFlow >= courseCapacity && courseCapacity > 0) {
            result.recommendedCourses.push_back(c.code + " (" + std::to_string(c.estimatedHours) + "h)");
        } else if (courseFlow > 0) {
            result.recommendedCourses.push_back(c.code + " [Partial " + std::to_string(courseFlow) + "/" + std::to_string(courseCapacity) + "h]");
        } else {
            result.overloadedCourses.push_back(c.code + " (" + std::to_string(c.estimatedHours) + "h)");
        }

        std::string cat = c.category.empty() ? "General" : c.category;
        int catHubNode = 1 + categoryToHubIdx[cat];
        MaxFlowEdge e;
        e.from = catHubNode;
        e.to = courseNode;
        e.capacity = capacity[catHubNode][courseNode];
        e.flow = flow[catHubNode][courseNode];
        e.fromLabel = cat;
        e.toLabel = c.code;
        e.isBottleneck = (visited[catHubNode] && !visited[courseNode]);
        result.flowNetwork.push_back(e);
    }

    if (result.minCutBottlenecks.empty()) {
        result.diagnosis = "Student capacity comfortably handles all active semester courses without saturation bottlenecks.";
    } else {
        result.diagnosis = "Min-Cut identified " + std::to_string(result.minCutBottlenecks.size()) +
                           " saturated bottleneck constraint(s). Max flow throughput is " + std::to_string(maxFlow) +
                           " hours (" + std::to_string(result.utilizationPercent) + "% capacity utilized).";
    }

    return result;
}

AnalysisResult DirectedGraph::analyze(
    const std::string& operation,
    const std::vector<int>& targetIndices,
    int weeklyStudyHours,
    bool recordSteps
) const {
    AnalysisResult result;
    result.operation = operation;

    // If goal-roadmap operation with targetIndices is requested, extract subgraph first
    if ((operation == "goal-roadmap" || operation == "trace" || operation == "max-flow") && !targetIndices.empty()) {
        DirectedGraph sub = extractPrerequisiteSubgraph(targetIndices);
        return sub.analyze(operation, {}, weeklyStudyHours, recordSteps);
    }

    result.vertexCount = getVertexCount();
    result.edgeCount = getEdgeCount();
    result.edges = edges_;

    // Compute Student Cognitive Capacity Max Flow
    result.maxFlowResult = computeStudentCognitiveCapacity(weeklyStudyHours);

    if (result.vertexCount == 0) {
        result.success = true;
        result.hasCycle = false;
        result.processedCount = 0;
        result.studyTimeEstimates = computeCriticalPath({}, result.criticalPath, result.criticalPathCodes, weeklyStudyHours);
        return result;
    }

    std::pair<std::vector<CourseVertex>, bool> topoRes;
    if (recordSteps || operation == "trace") {
        topoRes = computeTopologicalSortWithSteps(result.cycleNodes, result.blockedNodes, result.steps);
    } else {
        topoRes = computeTopologicalSort(result.cycleNodes, result.blockedNodes);
    }

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

    bool recordSteps = root.value("recordSteps", false) || (operation == "trace");
    AnalysisResult result = graph.analyze(operation, targetIndices, weeklyStudyHours, recordSteps);

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
