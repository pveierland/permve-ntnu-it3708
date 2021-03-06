cmake_minimum_required(VERSION 2.8.12)
project(permve-ntnu-it3708-project-3-2017)

set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++14")# -fsanitize=address")

find_package(Boost REQUIRED COMPONENTS program_options)
find_package(JPEG)
find_package(PNG)
find_package(Qt5Gui)
find_package(Qt5PrintSupport)
find_package(Qt5Widgets)

include_directories(. ${Boost_INCLUDE_DIR} ${JPEG_INCLUDE_DIR} ${PNG_INCLUDE_DIR})

add_executable(mtsp mtsp.cpp)

target_link_libraries(
    mtsp
    ${Boost_LIBRARIES})

add_executable(segmentation segmentation.cpp)

target_link_libraries(
    segmentation
    ${Boost_LIBRARIES}
    ${JPEG_LIBRARIES}
    ${PNG_LIBRARIES}
    Qt5::Gui
    Qt5::PrintSupport
    Qt5::Widgets)
