typescript_source := justfile_directory() / "sysdig-cli-scan-task"
azure_devops_access_token := env_var_or_default("AZURE_DEVOPS_ACCESS_TOKEN", "")

# List available recipes
default:
    @just --list

# Install deps and compile the TypeScript task
build:
    npm install
    cd {{typescript_source}} && npm install && tsc

# Publish a test build shared with the sysdigtest org
publish-local: build
    tfx extension publish \
        --manifest-globs vss-extension-test.json \
        --publisher IgorEulalio \
        --extension-id b52fe4a2-0476-4973-bc50-cc44e9032e11 \
        --share-with sysdigtest \
        --token {{azure_devops_access_token}}

# Publish the release build to the marketplace
publish-release:
    tfx extension publish \
        --manifest-globs {{justfile_directory()}}/vss-extension.json \
        --overrides-file {{justfile_directory()}}/vss-extension-release.json \
        --token {{azure_devops_access_token}}

# Pin GitHub Actions to commit SHAs
pin-actions:
    pinact run -u
