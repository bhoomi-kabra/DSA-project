#ifndef GRAPH_ENGINE_H
#define GRAPH_ENGINE_H

#include <string>
#include <vector>
#include <unordered_map>
#include <set>
#include <queue>
#include "json.hpp"

namespace PathPilot {

using json = nlohmann::json;

struct CourseVertex {
    int index = -1;
    std::string id;
    std::string code;
    std::string title;
    int estimatedHours = 0;
    std::string category = "General";
    int level = 0; // Topological depth layer (for visual layout)

    json toJson() const {
        return json{
            {"index", index},
            {"id", id},
            {"code", code},
            {"title", title},
            {"estimatedHours", estimatedHours},
            {"category", category},
            {"level", level}
        };
    }

    static CourseVertex fromJson(const json& j, int defaultIndex = -1) {
        CourseVertex v;
        v.index = j.value("index", defaultIndex);
        v.id = j.value("id", "");
        v.code = j.value("code", "");
        v.title = j.value("title", "");
        v.estimatedHours = j.value("estimatedHours", 0);
        v.category = j.value("category", "General");
        v.level = j.value("level", 0);
        return v;
    }
};

struct PrereqEdge {
    int u = -1; // prerequisite course index (source)
    int v = -1; // dependent course index (target)
    std::string fromCode;
    std::string toCode;

    json toJson() const {
        return json{
            {"u", u},
            {"v", v},
            {"fromCode", fromCode},
            {"toCode", toCode}
        };
    }
};

struct StudyTimeEstimates {
    int totalStudyHours = 0;
    int criticalPathHours = 0;
    int weeklyStudyHours = 10;
    int serialEstimatedWeeks = 0;
    int parallelEstimatedWeeks = 0;
    std::string explanation;

    json toJson() const {
        return json{
            {"totalStudyHours", totalStudyHours},
            {"criticalPathHours", criticalPathHours},
            {"weeklyStudyHours", weeklyStudyHours},
            {"serialEstimatedWeeks", serialEstimatedWeeks},
            {"parallelEstimatedWeeks", parallelEstimatedWeeks},
            {"explanation", explanation}
        };
    }
};

struct AlgorithmStep {
    int stepNumber = 0;
    std::string type; // "INITIALIZE", "POP_QUEUE", "VISIT_EDGE", "DECREMENT_INDEGREE", "PUSH_QUEUE", "NODE_COMPLETED", "CYCLE_DETECTED", "FINISHED"
    std::string description;
    std::string activeNodeCode;
    std::string targetNodeCode;
    std::vector<std::string> queueState;
    std::unordered_map<std::string, int> inDegrees;
    std::vector<std::string> currentOrder;

    json toJson() const {
        return json{
            {"stepNumber", stepNumber},
            {"type", type},
            {"description", description},
            {"activeNodeCode", activeNodeCode},
            {"targetNodeCode", targetNodeCode},
            {"queueState", queueState},
            {"inDegrees", inDegrees},
            {"currentOrder", currentOrder}
        };
    }
};

struct MaxFlowEdge {
    int from = -1;
    int to = -1;
    int capacity = 0;
    int flow = 0;
    std::string fromLabel;
    std::string toLabel;
    bool isBottleneck = false;

    json toJson() const {
        return json{
            {"from", from},
            {"to", to},
            {"capacity", capacity},
            {"flow", flow},
            {"fromLabel", fromLabel},
            {"toLabel", toLabel},
            {"isBottleneck", isBottleneck}
        };
    }
};

struct MaxFlowResult {
    bool success = true;
    int sourceCapacity = 0;
    int maxFlow = 0;
    int utilizationPercent = 0;
    std::vector<std::string> minCutBottlenecks;
    std::vector<std::string> recommendedCourses;
    std::vector<std::string> overloadedCourses;
    std::vector<MaxFlowEdge> flowNetwork;
    std::string diagnosis;

    json toJson() const {
        json net = json::array();
        for (const auto& edge : flowNetwork) {
            net.push_back(edge.toJson());
        }
        return json{
            {"success", success},
            {"sourceCapacity", sourceCapacity},
            {"maxFlow", maxFlow},
            {"utilizationPercent", utilizationPercent},
            {"minCutBottlenecks", minCutBottlenecks},
            {"recommendedCourses", recommendedCourses},
            {"overloadedCourses", overloadedCourses},
            {"flowNetwork", net},
            {"diagnosis", diagnosis}
        };
    }
};

struct AnalysisResult {
    bool success = true;
    std::string operation = "analyze";
    std::string error;
    bool hasCycle = false;
    int vertexCount = 0;
    int edgeCount = 0;
    int processedCount = 0;

    std::vector<CourseVertex> learningOrder;
    std::vector<CourseVertex> criticalPath;
    std::vector<std::string> criticalPathCodes;
    std::vector<std::string> cycleNodes;
    std::vector<std::string> blockedNodes;
    StudyTimeEstimates studyTimeEstimates;
    std::vector<PrereqEdge> edges;
    std::vector<AlgorithmStep> steps;
    MaxFlowResult maxFlowResult;

    json toJson() const;
};

class DirectedGraph {
private:
    std::vector<CourseVertex> vertices_;
    std::vector<PrereqEdge> edges_;
    std::unordered_map<std::string, int> idToIndex_;
    std::unordered_map<std::string, int> codeToIndex_;
    std::vector<std::vector<int>> adj_;    // Forward: u -> v (what u unlocks)
    std::vector<std::vector<int>> revAdj_; // Reverse: v -> u (what v requires)
    std::vector<int> inDegree_;
    std::set<std::pair<int, int>> edgeSet_;

public:
    DirectedGraph() = default;

    int addVertex(const CourseVertex& vertex);
    bool addEdge(int u, int v, const std::string& fromCode = "", const std::string& toCode = "");

    int getVertexCount() const { return static_cast<int>(vertices_.size()); }
    int getEdgeCount() const { return static_cast<int>(edges_.size()); }
    const std::vector<CourseVertex>& getVertices() const { return vertices_; }
    const std::vector<PrereqEdge>& getEdges() const { return edges_; }
    const std::vector<std::vector<int>>& getAdj() const { return adj_; }
    const std::vector<std::vector<int>>& getRevAdj() const { return revAdj_; }
    const std::vector<int>& getInDegree() const { return inDegree_; }

    int findIndexById(const std::string& id) const;
    int findIndexByCode(const std::string& code) const;
    const CourseVertex* getVertex(int index) const;

    // Algorithm B: Goal-based prerequisite subgraph extraction (Reverse BFS)
    DirectedGraph extractPrerequisiteSubgraph(const std::vector<int>& targetIndices) const;

    // Algorithm C & D: Kahn's Topological Sorting and Cycle Detection
    // Returns pair: <learningOrder, hasCycle>
    std::pair<std::vector<CourseVertex>, bool> computeTopologicalSort(
        std::vector<std::string>& outCycleNodes,
        std::vector<std::string>& outBlockedNodes
    ) const;

    // Algorithm C with Micro-Step Recording for Live Algorithm Inspector
    std::pair<std::vector<CourseVertex>, bool> computeTopologicalSortWithSteps(
        std::vector<std::string>& outCycleNodes,
        std::vector<std::string>& outBlockedNodes,
        std::vector<AlgorithmStep>& outSteps
    ) const;

    // Algorithm E: Critical Path and Study Time Analysis
    StudyTimeEstimates computeCriticalPath(
        const std::vector<CourseVertex>& topoOrder,
        std::vector<CourseVertex>& outCriticalPath,
        std::vector<std::string>& outCriticalPathCodes,
        int weeklyStudyHours = 10
    ) const;

    // Algorithm F: Maximum Flow & Min-Cut Student Cognitive Capacity Planner (Edmonds-Karp)
    MaxFlowResult computeStudentCognitiveCapacity(
        int weeklyStudyHours = 15,
        int semesterWeeks = 12
    ) const;

    // High-level analysis pipeline
    AnalysisResult analyze(
        const std::string& operation = "analyze",
        const std::vector<int>& targetIndices = {},
        int weeklyStudyHours = 10,
        bool recordSteps = false
    ) const;

    // Factory methods
    static DirectedGraph fromJson(const json& root, std::string& outError);
};

// Top-level engine runner for CLI / Stdin
class GraphEngine {
public:
    static json processJson(const std::string& inputJsonString, int& outStatusCode);
};

} // namespace PathPilot

#endif // GRAPH_ENGINE_H
