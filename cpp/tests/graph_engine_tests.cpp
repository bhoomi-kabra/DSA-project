#include "GraphEngine.h"
#include <iostream>
#include <cassert>
#include <vector>
#include <string>

using namespace PathPilot;

static int totalTests = 0;
static int passedTests = 0;

#define RUN_TEST(fn) do { \
    totalTests++; \
    std::cout << "[TEST " << totalTests << "] Running: " << #fn << "... "; \
    try { \
        fn(); \
        passedTests++; \
        std::cout << "PASSED\n"; \
    } catch (const std::exception& e) { \
        std::cout << "FAILED: " << e.what() << "\n"; \
    } catch (...) { \
        std::cout << "FAILED: Unknown exception\n"; \
    } \
} while(0)

// Helper to find index of course code in learning order
int findOrderIndex(const std::vector<CourseVertex>& order, const std::string& code) {
    for (size_t i = 0; i < order.size(); ++i) {
        if (order[i].code == code) return static_cast<int>(i);
    }
    return -1;
}

// Test 1: Simple valid graph (A -> B -> C)
void test1_SimpleValidGraph() {
    DirectedGraph g;
    g.addVertex({0, "id-a", "A", "Course A", 10, "General", 0});
    g.addVertex({1, "id-b", "B", "Course B", 15, "General", 0});
    g.addVertex({2, "id-c", "C", "Course C", 20, "General", 0});

    assert(g.addEdge(0, 1)); // A -> B
    assert(g.addEdge(1, 2)); // B -> C

    std::vector<std::string> cycleNodes, blockedNodes;
    auto topoRes = g.computeTopologicalSort(cycleNodes, blockedNodes);
    const auto& order = topoRes.first;
    bool hasCycle = topoRes.second;

    assert(!hasCycle);
    assert(order.size() == 3);
    assert(order[0].code == "A");
    assert(order[1].code == "B");
    assert(order[2].code == "C");
}

// Test 2: Multiple prerequisites (A -> C, B -> C, C -> D)
void test2_MultiplePrerequisites() {
    DirectedGraph g;
    g.addVertex({0, "id-a", "A", "Course A", 10, "General", 0});
    g.addVertex({1, "id-b", "B", "Course B", 15, "General", 0});
    g.addVertex({2, "id-c", "C", "Course C", 20, "General", 0});
    g.addVertex({3, "id-d", "D", "Course D", 25, "General", 0});

    assert(g.addEdge(0, 2)); // A -> C
    assert(g.addEdge(1, 2)); // B -> C
    assert(g.addEdge(2, 3)); // C -> D

    std::vector<std::string> cycleNodes, blockedNodes;
    auto topoRes = g.computeTopologicalSort(cycleNodes, blockedNodes);
    const auto& order = topoRes.first;
    bool hasCycle = topoRes.second;

    assert(!hasCycle);
    assert(order.size() == 4);

    int posA = findOrderIndex(order, "A");
    int posB = findOrderIndex(order, "B");
    int posC = findOrderIndex(order, "C");
    int posD = findOrderIndex(order, "D");

    assert(posA != -1 && posB != -1 && posC != -1 && posD != -1);
    assert(posA < posC);
    assert(posB < posC);
    assert(posC < posD);
}

// Test 3: Independent courses (A, B, C; no edges)
void test3_IndependentCourses() {
    DirectedGraph g;
    g.addVertex({0, "id-a", "A", "Course A", 10, "General", 0});
    g.addVertex({1, "id-b", "B", "Course B", 15, "General", 0});
    g.addVertex({2, "id-c", "C", "Course C", 20, "General", 0});

    std::vector<std::string> cycleNodes, blockedNodes;
    auto topoRes = g.computeTopologicalSort(cycleNodes, blockedNodes);
    const auto& order = topoRes.first;
    bool hasCycle = topoRes.second;

    assert(!hasCycle);
    assert(order.size() == 3);
    // Deterministic ordering by code: A, B, C
    assert(order[0].code == "A");
    assert(order[1].code == "B");
    assert(order[2].code == "C");
}

// Test 4: Directed cycle (A -> B -> C -> A)
void test4_DirectedCycle() {
    DirectedGraph g;
    g.addVertex({0, "id-a", "A", "Course A", 10, "General", 0});
    g.addVertex({1, "id-b", "B", "Course B", 15, "General", 0});
    g.addVertex({2, "id-c", "C", "Course C", 20, "General", 0});

    assert(g.addEdge(0, 1)); // A -> B
    assert(g.addEdge(1, 2)); // B -> C
    assert(g.addEdge(2, 0)); // C -> A (cycle!)

    std::vector<std::string> cycleNodes, blockedNodes;
    auto topoRes = g.computeTopologicalSort(cycleNodes, blockedNodes);
    const auto& order = topoRes.first;
    bool hasCycle = topoRes.second;

    assert(hasCycle == true);
    assert(order.size() < 3); // Kahn fails to process cycle nodes
    assert(!cycleNodes.empty());
}

// Test 5: Disconnected graph (A -> B, C -> D)
void test5_DisconnectedGraph() {
    DirectedGraph g;
    g.addVertex({0, "id-a", "A", "Course A", 10, "General", 0});
    g.addVertex({1, "id-b", "B", "Course B", 15, "General", 0});
    g.addVertex({2, "id-c", "C", "Course C", 20, "General", 0});
    g.addVertex({3, "id-d", "D", "Course D", 25, "General", 0});

    assert(g.addEdge(0, 1)); // A -> B
    assert(g.addEdge(2, 3)); // C -> D

    std::vector<std::string> cycleNodes, blockedNodes;
    auto topoRes = g.computeTopologicalSort(cycleNodes, blockedNodes);
    const auto& order = topoRes.first;
    bool hasCycle = topoRes.second;

    assert(!hasCycle);
    assert(order.size() == 4);

    int posA = findOrderIndex(order, "A");
    int posB = findOrderIndex(order, "B");
    int posC = findOrderIndex(order, "C");
    int posD = findOrderIndex(order, "D");

    assert(posA < posB);
    assert(posC < posD);
}

// Test 6: Goal-based prerequisite extraction
void test6_GoalBasedPrerequisiteExtraction() {
    // Graph: A -> B -> C (Target); and X -> Y (Unrelated)
    DirectedGraph g;
    g.addVertex({0, "id-a", "A", "Course A", 10, "General", 0});
    g.addVertex({1, "id-b", "B", "Course B", 15, "General", 0});
    g.addVertex({2, "id-c", "C", "Course C (Target)", 20, "General", 0});
    g.addVertex({3, "id-x", "X", "Course X", 10, "General", 0});
    g.addVertex({4, "id-y", "Y", "Course Y", 15, "General", 0});

    assert(g.addEdge(0, 1));
    assert(g.addEdge(1, 2));
    assert(g.addEdge(3, 4));

    // Extract target C (index 2)
    DirectedGraph sub = g.extractPrerequisiteSubgraph({2});

    assert(sub.getVertexCount() == 3);
    assert(sub.findIndexByCode("A") != -1);
    assert(sub.findIndexByCode("B") != -1);
    assert(sub.findIndexByCode("C") != -1);
    assert(sub.findIndexByCode("X") == -1);
    assert(sub.findIndexByCode("Y") == -1);
    assert(sub.getEdgeCount() == 2);
}

// Test 7: Shared prerequisites (Diamond: A -> C, A -> D, C -> E, D -> E)
void test7_SharedPrerequisites() {
    DirectedGraph g;
    g.addVertex({0, "id-a", "A", "Course A", 10, "General", 0});
    g.addVertex({1, "id-c", "C", "Course C", 20, "General", 0});
    g.addVertex({2, "id-d", "D", "Course D", 20, "General", 0});
    g.addVertex({3, "id-e", "E", "Course E", 30, "General", 0});

    assert(g.addEdge(0, 1)); // A -> C
    assert(g.addEdge(0, 2)); // A -> D
    assert(g.addEdge(1, 3)); // C -> E
    assert(g.addEdge(2, 3)); // D -> E

    // Goal extraction for target E
    DirectedGraph sub = g.extractPrerequisiteSubgraph({3});
    assert(sub.getVertexCount() == 4); // A is included only once!

    std::vector<std::string> cycleNodes, blockedNodes;
    auto topoRes = sub.computeTopologicalSort(cycleNodes, blockedNodes);
    const auto& order = topoRes.first;
    bool hasCycle = topoRes.second;
    assert(!hasCycle);
    assert(order.size() == 4);

    int posA = findOrderIndex(order, "A");
    int posC = findOrderIndex(order, "C");
    int posD = findOrderIndex(order, "D");
    int posE = findOrderIndex(order, "E");

    assert(posA < posC);
    assert(posA < posD);
    assert(posC < posE);
    assert(posD < posE);
}

// Test 8: Empty graph
void test8_EmptyGraph() {
    DirectedGraph g;
    assert(g.getVertexCount() == 0);
    assert(g.getEdgeCount() == 0);

    std::vector<std::string> cycleNodes, blockedNodes;
    auto topoRes = g.computeTopologicalSort(cycleNodes, blockedNodes);
    const auto& order = topoRes.first;
    bool hasCycle = topoRes.second;

    assert(!hasCycle);
    assert(order.empty());

    AnalysisResult res = g.analyze("analyze", {}, 10);
    assert(res.success);
    assert(!res.hasCycle);
    assert(res.vertexCount == 0);
    assert(res.studyTimeEstimates.totalStudyHours == 0);
    assert(res.studyTimeEstimates.criticalPathHours == 0);
}

// Test 9: Invalid input handling (JSON parser, negative indices, malformed inputs)
void test9_InvalidInput() {
    // Malformed JSON string
    int status1 = 0;
    json out1 = GraphEngine::processJson("{ not valid json: }", status1);
    assert(status1 != 0);
    assert(!out1["success"].get<bool>());
    assert(out1.contains("error"));

    // Missing vertices
    int status2 = 0;
    json out2 = GraphEngine::processJson("{\"operation\": \"analyze\"}", status2);
    assert(status2 != 0);
    assert(!out2["success"].get<bool>());

    // Out of range edge endpoint
    std::string badEdgeJson = R"({
        "vertices": [{"index": 0, "code": "A"}],
        "edges": [{"u": 0, "v": 99}]
    })";
    int status3 = 0;
    json out3 = GraphEngine::processJson(badEdgeJson, status3);
    assert(status3 != 0);
    assert(!out3["success"].get<bool>());

    // Negative index endpoint
    std::string negEdgeJson = R"({
        "vertices": [{"index": 0, "code": "A"}],
        "edges": [{"u": -1, "v": 0}]
    })";
    int status4 = 0;
    json out4 = GraphEngine::processJson(negEdgeJson, status4);
    assert(status4 != 0);
    assert(!out4["success"].get<bool>());
}

// Test 10: Study-time estimation (Workload vs Critical Path)
void test10_StudyTimeEstimation() {
    // A (10h) -> C (25h) -> D (30h)  (path length: 10 + 25 + 30 = 65h)
    // B (40h) -> D (30h)             (path length: 40 + 30 = 70h - CRITICAL PATH!)
    // Total workload: 10 + 40 + 25 + 30 = 105 hours
    DirectedGraph g;
    g.addVertex({0, "id-a", "A", "Course A", 10, "General", 0});
    g.addVertex({1, "id-b", "B", "Course B", 40, "General", 0});
    g.addVertex({2, "id-c", "C", "Course C", 25, "General", 0});
    g.addVertex({3, "id-d", "D", "Course D", 30, "General", 0});

    assert(g.addEdge(0, 2)); // A -> C
    assert(g.addEdge(2, 3)); // C -> D
    assert(g.addEdge(1, 3)); // B -> D

    AnalysisResult res = g.analyze("analyze", {}, 10);
    assert(res.success);
    assert(!res.hasCycle);

    // Verify Total Workload vs Critical Path
    assert(res.studyTimeEstimates.totalStudyHours == 105);
    assert(res.studyTimeEstimates.criticalPathHours == 70);
    assert(res.studyTimeEstimates.criticalPathHours != res.studyTimeEstimates.totalStudyHours);

    // Verify critical path codes: B -> D
    assert(res.criticalPathCodes.size() == 2);
    assert(res.criticalPathCodes[0] == "B");
    assert(res.criticalPathCodes[1] == "D");

    // Verify weekly estimates with 10h/week:
    // Serial: ceil(105 / 10) = 11 weeks
    // Parallel: ceil(70 / 10) = 7 weeks
    assert(res.studyTimeEstimates.serialEstimatedWeeks == 11);
    assert(res.studyTimeEstimates.parallelEstimatedWeeks == 7);
}

// Test 11: Algorithm Inspector Micro-Step Tracing
void test11_StepByStepTrace() {
    DirectedGraph g;
    g.addVertex({0, "id-a", "A", "Course A", 10, "General", 0});
    g.addVertex({1, "id-b", "B", "Course B", 20, "General", 0});
    g.addVertex({2, "id-c", "C", "Course C", 30, "General", 0});
    g.addEdge(0, 1); // A -> B
    g.addEdge(1, 2); // B -> C

    std::vector<std::string> cycleNodes, blockedNodes;
    std::vector<AlgorithmStep> steps;
    auto topoRes = g.computeTopologicalSortWithSteps(cycleNodes, blockedNodes, steps);

    assert(!topoRes.second); // No cycle
    assert(topoRes.first.size() == 3);
    assert(!steps.empty());
    assert(steps[0].type == "INITIALIZE");
    assert(steps.back().type == "FINISHED");
    assert(steps[0].queueState.size() == 1 && steps[0].queueState[0] == "A");
}

// Test 12: Edmonds-Karp Student Cognitive Capacity Max Flow & Min-Cut
void test12_EdmondsKarpMaxFlowMinCut() {
    DirectedGraph g;
    g.addVertex({0, "id-a", "CS101", "Intro CS", 30, "Core", 0});
    g.addVertex({1, "id-b", "CS102", "Data Structures", 40, "Core", 0});
    g.addVertex({2, "id-c", "AI101", "Intro AI", 50, "AI", 0});

    MaxFlowResult flowRes = g.computeStudentCognitiveCapacity(10, 12); // 120h total capacity
    assert(flowRes.success);
    assert(flowRes.sourceCapacity == 120);
    assert(flowRes.maxFlow > 0);
    assert(flowRes.maxFlow <= 120);
    assert(!flowRes.recommendedCourses.empty());
    assert(!flowRes.flowNetwork.empty());
}

int main() {
    std::cout << "========================================\n";
    std::cout << "PathPilot C++ Graph Algorithm Engine Tests\n";
    std::cout << "========================================\n";

    RUN_TEST(test1_SimpleValidGraph);
    RUN_TEST(test2_MultiplePrerequisites);
    RUN_TEST(test3_IndependentCourses);
    RUN_TEST(test4_DirectedCycle);
    RUN_TEST(test5_DisconnectedGraph);
    RUN_TEST(test6_GoalBasedPrerequisiteExtraction);
    RUN_TEST(test7_SharedPrerequisites);
    RUN_TEST(test8_EmptyGraph);
    RUN_TEST(test9_InvalidInput);
    RUN_TEST(test10_StudyTimeEstimation);
    RUN_TEST(test11_StepByStepTrace);
    RUN_TEST(test12_EdmondsKarpMaxFlowMinCut);

    std::cout << "========================================\n";
    std::cout << "Results: " << passedTests << " / " << totalTests << " passed.\n";
    std::cout << "========================================\n";

    return (passedTests == totalTests) ? 0 : 1;
}
