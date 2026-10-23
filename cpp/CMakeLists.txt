cmake_minimum_required(VERSION 3.14)
project(PathPilotGraphEngine LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include_directories(include)

# Executable for main engine
add_executable(graph_engine
    src/GraphEngine.cpp
    src/main.cpp
)

# Output binary into cpp/bin
set_target_properties(graph_engine PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/bin"
)

# Test executable
add_executable(graph_engine_tests
    src/GraphEngine.cpp
    tests/graph_engine_tests.cpp
)

set_target_properties(graph_engine_tests PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/bin"
)

enable_testing()
add_test(NAME AllGraphTests COMMAND graph_engine_tests)
