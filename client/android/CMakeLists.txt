cmake_minimum_required(VERSION 3.16)
project(otclientv8 LANGUAGES C CXX)

if(NOT ANDROID OR NOT ANDROID_ABI STREQUAL "arm64-v8a")
    message(FATAL_ERROR "This build currently supports Android arm64-v8a only")
endif()
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(ANDROID_DEPS "${CMAKE_CURRENT_LIST_DIR}/../build/android-deps" CACHE PATH "Extracted android_libs.7z")
set(CLIENT_SRC "${CMAKE_CURRENT_LIST_DIR}/../src")
if(NOT EXISTS "${ANDROID_DEPS}/lib64/libluajit.a")
    message(FATAL_ERROR "Extract android_libs.7z into ${ANDROID_DEPS} first")
endif()

file(GLOB_RECURSE CLIENT_SOURCES CONFIGURE_DEPENDS "${CLIENT_SRC}/client/*.cpp" "${CLIENT_SRC}/framework/*.cpp" "${CLIENT_SRC}/framework/*.c")
list(FILTER CLIENT_SOURCES EXCLUDE REGEX "/(platform|sound)/")
list(FILTER CLIENT_SOURCES EXCLUDE REGEX "/consoleapplication\\.cpp$")
list(APPEND CLIENT_SOURCES
    "${CLIENT_SRC}/main.cpp"
    "${CLIENT_SRC}/framework/platform/platform.cpp"
    "${CLIENT_SRC}/framework/platform/platformwindow.cpp"
    "${CLIENT_SRC}/framework/platform/androidplatform.cpp"
    "${CLIENT_SRC}/framework/platform/androidwindow.cpp"
    "${CLIENT_SRC}/android/android_native_app_glue.cpp"
    "${CLIENT_SRC}/android/dependencies.cpp")
add_library(otclientv8 SHARED ${CLIENT_SOURCES})
target_include_directories(otclientv8 PRIVATE "${CLIENT_SRC}" "${ANDROID_DEPS}/include"
    "${ANDROID_DEPS}/include/luajit" "${ANDROID_DEPS}/include/png" "${ANDROID_DEPS}/include/OpenAL")
target_compile_definitions(otclientv8 PRIVATE ANDROID OPENGL_ES=2 OTCLIENT FW_GRAPHICS FW_NET FW_XML FW_PROXY
    NOMINMAX BUILD_TYPE="Release" BUILD_COMMIT="android" BUILD_REVISION=0 BUILD_ARCH="arm64")
target_compile_options(otclientv8 PRIVATE "$<$<COMPILE_LANGUAGE:CXX>:-include${CLIENT_SRC}/android/pch.h>")
target_precompile_headers(otclientv8 PRIVATE "$<$<COMPILE_LANGUAGE:CXX>:${CLIENT_SRC}/framework/pch.h>")
target_link_libraries(otclientv8 PRIVATE
    "-Wl,--start-group"
    "${ANDROID_DEPS}/lib64/libboost_system.a"
    "${ANDROID_DEPS}/lib64/libluajit.a"
    "${ANDROID_DEPS}/lib64/libphysfs.a"
    "${ANDROID_DEPS}/lib64/libpng.a"
    "${ANDROID_DEPS}/lib64/libzip.a"
    "${ANDROID_DEPS}/lib64/libssl.a"
    "${ANDROID_DEPS}/lib64/libcrypto.a"
    "-Wl,--end-group"
    GLESv2 EGL android log z dl m atomic)
target_link_options(otclientv8 PRIVATE "-Wl,--no-undefined" "-Wl,-z,max-page-size=16384")
