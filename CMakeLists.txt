cmake_minimum_required(VERSION 3.5)

project(xcloud-condenser VERSION 0.1 LANGUAGES CXX)

set(CMAKE_AUTOUIC ON)
set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTORCC ON)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include(FetchContent)

FetchContent_Declare(
        yaml-cpp
        GIT_REPOSITORY https://github.com/jbeder/yaml-cpp.git
        GIT_TAG master
)
FetchContent_GetProperties(yaml-cpp)

FetchContent_Declare(
        cpp-steam-tools
        GIT_REPOSITORY https://github.com/nikorag/cpp-steam-tools.git
        GIT_TAG main
)
FetchContent_GetProperties(cpp-steam-tools)

if(NOT yaml-cpp_POPULATED)
    message(STATUS "Fetching yaml-cpp...")
    FetchContent_Populate(yaml-cpp)
    add_subdirectory(${yaml-cpp_SOURCE_DIR} ${yaml-cpp_BINARY_DIR})
endif()

if(NOT cpp-steam-tools_POPULATED)
    message(STATUS "Fetching cpp-steam-tools...")
    FetchContent_Populate(cpp-steam-tools)
    add_subdirectory(${cpp-steam-tools_SOURCE_DIR} ${cpp-steam-tools_BINARY_DIR})
endif()

find_package(QT NAMES Qt6 Qt5 REQUIRED COMPONENTS Widgets WebEngineWidgets)
find_package(Qt${QT_VERSION_MAJOR} REQUIRED COMPONENTS Widgets WebEngineWidgets)

qt_add_resources(QRC_SOURCES res/resources.qrc)

set(PROJECT_SOURCES
        include/sgdbenums.h
        include/steamgriddbapi.h
        src/steamgriddbapi.cpp
        src/main.cpp
        src/mainwindow.cpp
        include/mainwindow.h
        src/jsonrequester.cpp
        include/jsonrequester.h
        src/gamepassapi.cpp
        include/gamepassapi.h
        include/gamepassgame.h
        src/gamepassgame.cpp
        src/settingsdialog.cpp
        include/settingsdialog.h
        include/imageloader.h
        src/imageloader.cpp
        include/browserselectdialog.h
        include/xcchelper.h
        src/browserselectdialog.cpp
)

if(${QT_VERSION_MAJOR} GREATER_EQUAL 6)
    qt_add_executable(xcloud-condenser
        MANUAL_FINALIZATION
        ${QRC_SOURCES}
        ${PROJECT_SOURCES}
    )
# Define target properties for Android with Qt 6 as:
#    set_property(TARGET xcloud-condenser APPEND PROPERTY QT_ANDROID_PACKAGE_SOURCE_DIR
#                 ${CMAKE_CURRENT_SOURCE_DIR}/android)
# For more information, see https://doc.qt.io/qt-6/qt-add-executable.html#target-creation
else()
    if(ANDROID)
        add_library(xcloud-condenser SHARED
            ${PROJECT_SOURCES}
        )
# Define properties for Android with Qt 5 after find_package() calls as:
#    set(ANDROID_PACKAGE_SOURCE_DIR "${CMAKE_CURRENT_SOURCE_DIR}/android")
    else()
        add_executable(xcloud-condenser
            ${PROJECT_SOURCES}
        )
    endif()
endif()

target_link_libraries(xcloud-condenser PRIVATE Qt${QT_VERSION_MAJOR}::Widgets Qt::WebEngineWidgets)
target_link_libraries(xcloud-condenser PUBLIC yaml-cpp::yaml-cpp cpp-steam-tools)

# Qt for iOS sets MACOSX_BUNDLE_GUI_IDENTIFIER automatically since Qt 6.1.
# If you are developing for iOS or macOS you should consider setting an
# explicit, fixed bundle identifier manually though.
if(${QT_VERSION} VERSION_LESS 6.1.0)
  set(BUNDLE_ID_OPTION MACOSX_BUNDLE_GUI_IDENTIFIER com.example.xcloud-condenser)
endif()
set_target_properties(xcloud-condenser PROPERTIES
    ${BUNDLE_ID_OPTION}
    MACOSX_BUNDLE_BUNDLE_VERSION ${PROJECT_VERSION}
    MACOSX_BUNDLE_SHORT_VERSION_STRING ${PROJECT_VERSION_MAJOR}.${PROJECT_VERSION_MINOR}
    MACOSX_BUNDLE TRUE
    WIN32_EXECUTABLE TRUE
)

include(GNUInstallDirs)
install(TARGETS xcloud-condenser
    BUNDLE DESTINATION .
    LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR}
    RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
)

if(QT_VERSION_MAJOR EQUAL 6)
    qt_finalize_executable(xcloud-condenser)
endif()
