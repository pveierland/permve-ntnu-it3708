cmake_minimum_required(VERSION 2.8)
project(permve-ntnu-it3708-project-2)

set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++14")

find_package(Boost REQUIRED COMPONENTS program_options)
include_directories(. ${Boost_INCLUDE_DIR})

add_executable(test test.cpp)
target_link_libraries(test ${Boost_LIBRARIES})

