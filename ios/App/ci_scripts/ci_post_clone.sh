#!/bin/sh
# Xcode Cloud: build the web app and copy it into the iOS project before Xcode
# resolves packages and compiles. Capacitor's Swift packages live in node_modules,
# and App/public + capacitor.config.json are generated, so both must exist first.
set -e

export HOMEBREW_NO_INSTALL_CLEANUP=1
export HOMEBREW_NO_AUTO_UPDATE=1
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

brew install node

cd "$CI_PRIMARY_REPOSITORY_PATH"
npm ci
npm run build
npx cap sync ios
