#!/bin/bash

# Function to increment a version string
increment_version() {
    local array=($(echo "$1" | tr '.' '\n'))
    array[2]=$((array[2]+1)) # Increment the patch version
    echo "${array[@]}"
}

# Read the current version from the VERSION file
current_version=$(cat VERSION)

# Increment the version
read major minor patch <<< $(increment_version $current_version)

# Update the version in the VERSION file
new_version="${major}.${minor}.${patch}"
echo $new_version > VERSION

# Update task.json
jq ".version.Major = $major | \
    .version.Minor = $minor | \
    .version.Patch = $patch" \
    sysdig-cli-scan-task/task.json > tmp.json && mv tmp.json sysdig-cli-scan-task/task.json

# Update vss-extension.json
jq --arg major "$major" \
   --arg minor "$minor" \
   --arg patch "$patch" \
   '.version = "\($major).\($minor).\($patch)"' \
   vss-extension.json > tmp.json && mv tmp.json vss-extension.json

# Output the new version for use in other scripts (like GitHub Actions)
echo $new_version
