cmake_minimum_required(VERSION 2.8)
project(permve-ntnu-it3708-project-5)

set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++14")

#find_package(Boost REQUIRED COMPONENTS program_options)
#include_directories(. ${Boost_INCLUDE_DIR})

add_executable(tsp_moea tsp_moea.cpp)
#target_link_libraries(lolz ${Boost_LIBRARIES})

