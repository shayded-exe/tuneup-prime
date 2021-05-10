#!/bin/bash
set -e
cd "$(dirname "$0")/.."

TARGET_PLATFORM=$1

if [ -z "$TARGET_PLATFORM" ]; then
    echo 'A target platform (linux/win32/darwin) is required'
    exit 1
fi

# for prebuild-install
export npm_config_platform=$TARGET_PLATFORM
# for node-pre-gyp
export npm_config_target_platform=$TARGET_PLATFORM

case $TARGET_PLATFORM in
    "win32")
        oclif-dev pack -r pack -t win32-x64,win32-x86
        oclif-dev pack:win -r pack
        ;;
    "darwin")
        oclif-dev pack -r pack -t darwin-x64
        oclif-dev pack:macos -r pack
        ;;
esac
