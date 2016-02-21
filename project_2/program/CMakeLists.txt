cmake_minimum_required(VERSION 2.8)
project(permve-ntnu-it3708-project-2)

set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++14")

#set(Boost_USE_STATIC_LIBS    ON)
#set(Boost_USE_MULTITHREADED  ON)
#set(Boost_USE_STATIC_RUNTIME OFF)
#find_package(Boost REQUIRED COMPONENTS  )
find_package(Boost REQUIRED)
include_directories(${Boost_INCLUDE_DIR})

add_executable(test test.cpp)
target_link_libraries(test ${Boost_LIBRARIES})

