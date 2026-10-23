#include "GraphEngine.h"
#include <iostream>
#include <fstream>
#include <sstream>

int main(int argc, char* argv[]) {
    // Disable synchronization between C and C++ standard streams for performance
    std::ios_base::sync_with_stdio(false);
    std::cin.tie(NULL);

    std::string inputJsonStr;

    // Support either file argument or standard input
    if (argc > 1) {
        std::string filename = argv[1];
        if (filename == "--help" || filename == "-h") {
            std::cerr << "PathPilot C++ Graph Algorithm Engine\n";
            std::cerr << "Usage: graph_engine [input_file.json]\n";
            std::cerr << "       If no file is provided, input is read from standard input (stdin).\n";
            std::cerr << "Output is formatted JSON printed to stdout.\n";
            return 0;
        }

        std::ifstream file(filename);
        if (!file.is_open()) {
            std::cerr << "[Error] Cannot open input file: " << filename << "\n";
            nlohmann::json err;
            err["success"] = false;
            err["error"] = "Cannot open input file: " + filename;
            std::cout << err.dump(2) << std::endl;
            return 1;
        }
        std::stringstream buffer;
        buffer << file.rdbuf();
        inputJsonStr = buffer.str();
    } else {
        std::stringstream buffer;
        buffer << std::cin.rdbuf();
        inputJsonStr = buffer.str();
    }

    if (inputJsonStr.empty()) {
        std::cerr << "[Error] Empty input received on stdin or file.\n";
        nlohmann::json err;
        err["success"] = false;
        err["error"] = "Empty input received.";
        std::cout << err.dump(2) << std::endl;
        return 1;
    }

    int statusCode = 0;
    nlohmann::json output = PathPilot::GraphEngine::processJson(inputJsonStr, statusCode);

    // Write machine-readable JSON to standard output
    std::cout << output.dump(2) << std::endl;

    if (statusCode != 0) {
        std::cerr << "[Info] Execution finished with status code: " << statusCode << "\n";
    }

    return statusCode;
}
