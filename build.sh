#!/bin/bash

PACKAGE_VERSION=$(node -p -e "require('./package.json').version")

# Build Script for WebcamJS
# Install uglifyjs first: sudo npm install uglify-js -g

uglifyjs webcam.js -o webcam.min.js --mangle --reserved "Webcam" --preamble "// WebcamJS v${PACKAGE_VERSION} - http://github.com/jhuckaby/webcamjs - MIT Licensed"
