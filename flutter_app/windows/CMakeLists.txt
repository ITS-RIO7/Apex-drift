cmake_minimum_required(VERSION 3.14)
project(apex_drift_3d LANGUAGES CXX)

set(BINARY_NAME "apex_drift_3d")

cmake_policy(SET CMP0079 NEW)

# Flutter CMake plugin integration
include(flutter/generated_plugins.cmake)

set(FLUTTER_MANAGED_DIR "${CMAKE_CURRENT_SOURCE_DIR}/flutter")

add_subdirectory(${FLUTTER_MANAGED_DIR})
add_subdirectory("runner")
