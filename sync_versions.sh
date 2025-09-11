#!/bin/bash
set -e

# Set the script's directory as the working directory
cd "$(dirname "$0")"

# Check if jq and npm are installed
if ! command -v jq &> /dev/null
then
    echo "jq could not be found, please install it"
    exit 1
fi

if ! command -v npm &> /dev/null
then
    echo "npm could not be found, please install it"
    exit 1
fi

# Get version from sysdig-cli-scan-task/package.json
VERSION=$(jq -r .version "sysdig-cli-scan-task/package.json")

if [ -z "$VERSION" ]; then
    echo "Version could not be read from sysdig-cli-scan-task/package.json"
    exit 1
fi

echo "Syncing to version $VERSION"

# Update root package.json
jq --arg VERSION "$VERSION" '.version = $VERSION' package.json > package.json.tmp && mv package.json.tmp package.json

# Update vss-extension.json
jq --arg VERSION "$VERSION" '.version = $VERSION' vss-extension.json > vss-extension.json.tmp && mv vss-extension.json.tmp vss-extension.json

# Update sysdig-cli-scan-task/task.json
MAJOR=$(echo "$VERSION" | cut -d. -f1)
MINOR=$(echo "$VERSION" | cut -d. -f2)
PATCH=$(echo "$VERSION" | cut -d. -f3)

jq ".version.Major = $MAJOR | .version.Minor = $MINOR | .version.Patch = $PATCH" sysdig-cli-scan-task/task.json > sysdig-cli-scan-task/task.json.tmp && mv sysdig-cli-scan-task/task.json.tmp sysdig-cli-scan-task/task.json

# Run npm install to update package-lock.json files
npm install
(cd sysdig-cli-scan-task && npm install)

echo "Versions synchronized successfully"
